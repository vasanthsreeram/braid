import { reachable, contributions } from "./history.ts";
import type {
  Services,
  Principal,
  Repo,
  Role,
  Ticket,
  Proposal,
  Invite,
  MergeIntent,
} from "./contracts.ts";
import {
  check,
  Fault,
  HASH,
  ID,
  MAX_OBJECT,
  readBytes,
  ingest,
  loadManifest,
  download,
  root,
  copyManifests,
} from "./storage.ts";
import { ZERO, SHA, branchRef, descendant, diff } from "./review.ts";
const LFS = "application/vnd.git-lfs+json";
const rank: Record<Role, number> = {
  reader: 1,
  contributor: 2,
  writer: 3,
  admin: 4,
};
const uuid = () => crypto.randomUUID();
const json = (v: unknown, status = 200, lfs = false) =>
  Response.json(v, {
    status,
    headers: { "content-type": lfs ? LFS : "application/json" },
  });
export async function bodyJSON(request: Request): Promise<any> {
  check(request.body, 400, "Missing body");
  try {
    const value = JSON.parse(
      new TextDecoder().decode(await readBytes(request.body, 64 * 1024)),
    );
    check(
      value && typeof value === "object" && !Array.isArray(value),
      400,
      "Expected JSON object",
    );
    return value;
  } catch {
    throw new Fault(400, "Invalid or oversized JSON");
  }
}
export function githubURL(raw: unknown): string {
  check(typeof raw === "string", 400, "Expected GitHub HTTPS URL");
  // Reconstruct strict repository identities; reject redirects/credentials/encoding tricks at the boundary.
  check(
    /^https:\/\/github\.com\/[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+(?:\.git)?$/.test(
      raw,
    ),
    400,
    "Only canonical public GitHub URLs are supported",
  );
  const url = new URL(raw);
  const parts = url.pathname.slice(1).split("/");
  check(
    parts.every((p) => p !== "." && p !== ".."),
    400,
    "Invalid source",
  );
  return `https://github.com/${parts[0]}/${parts[1].replace(/\.git$/, "")}.git`;
}
async function authorize(
  s: Services,
  p: Principal | null,
  id: string,
  needed: Role,
  publicRead = false,
): Promise<Repo> {
  check(typeof id === "string" && ID.test(id), 404, "Not found");
  check(
    p || (publicRead && s.allowPublic && needed === "reader"),
    404,
    "Not found",
  );
  const repo = await s.catalog.get(id);
  check(repo, 404, "Not found");
  if (
    publicRead &&
    s.allowPublic &&
    repo.visibility === "public" &&
    needed === "reader"
  )
    return repo;
  const canonical = repo.parent ? await s.catalog.get(repo.parent) : repo;
  check(
    canonical &&
      p &&
      (p.tenant === canonical.tenant || canonical.tenant === canonical.owner),
    404,
    "Not found",
  );
  const parentRole =
    p.id === canonical.owner
      ? "admin"
      : await s.catalog.role(canonical.id, p.id);
  if (repo.parent && p.id === repo.owner)
    check(parentRole && rank[parentRole] >= rank.contributor, 404, "Not found");
  const role =
    p.id === repo.owner || (repo.parent && parentRole === "admin")
      ? "admin"
      : await s.catalog.role(id, p.id);
  check(role && rank[role] >= rank[needed], 404, "Not found");
  return repo;
}
function object(v: any) {
  check(
    v &&
      typeof v.oid === "string" &&
      HASH.test(v.oid) &&
      Number.isSafeInteger(v.size) &&
      v.size >= 0 &&
      v.size <= MAX_OBJECT,
    422,
    "Invalid OID or size",
  );
}
async function createRepo(
  s: Services,
  p: Principal,
  b: any,
  parent: Repo | null = null,
): Promise<Repo> {
  check(
    typeof b.name === "string" && ID.test(b.name),
    400,
    "Invalid repository name",
  );
  const importURL = !parent && b.url ? githubURL(b.url) : null;
  const id = uuid();
  const physical = `cf-native-forge-${id}`;
  const tenant = parent?.tenant ?? p.tenant;
  const r: Repo = {
    id,
    tenant,
    owner: p.id,
    name: b.name,
    physical,
    visibility: "private",
    state: "creating",
    parent: parent?.id ?? null,
  };
  await s.catalog.create(r);
  try {
    const refs = parent
      ? await s.git.refs(parent.physical)
      : importURL
        ? (await s.git.source(importURL)).refs
        : [];
    await s.catalog.operation({
      repo: id,
      kind: parent ? "fork" : importURL ? "import" : "create",
      source: importURL,
      refs: JSON.stringify(refs),
    });
    if (parent) {
      check(
        parent.tenant === p.tenant || parent.tenant === parent.owner,
        403,
        "Cross-tenant organization forks unsupported",
      );
      check(
        (await s.store.listManifests(tenant, parent.id)).length <= 128,
        409,
        "Task fork manifest limit",
      );
      await s.git.fork(parent.physical, physical);
      await copyManifests(s.store, tenant, parent.id, id);
    } else if (importURL) await s.git.import(physical, importURL);
    else await s.git.create(physical);
    check(
      JSON.stringify(await s.git.refs(physical)) === JSON.stringify(refs),
      502,
      "Git refs differ from the recorded source snapshot",
    );
    await s.catalog.state(id, "ready");
    r.state = "ready";
    return r;
  } catch (e: any) {
    if (
      ["IMPORT_IN_PROGRESS", "FORK_IN_PROGRESS", "CREATE_IN_PROGRESS"].includes(
        e?.code,
      )
    )
      return r;
    await s.catalog.state(id, "failed");
    throw new Fault(
      502,
      "Git operation failed; intent retained for reconciliation",
    );
  }
}
async function revokeTokens(s: Services, repo: Repo, user?: string) {
  for (const t of await s.catalog.tokens(repo.id, user)) {
    await s.git.revoke(repo.physical, t.id);
    await s.catalog.removeToken(t.id);
  }
}
async function revokeAccessTokens(s: Services, repo: Repo, user: string) {
  await revokeTokens(s, repo, user);
  for (const task of await s.catalog.children(repo.id))
    await revokeTokens(s, task, user);
}
function query(u: URL) {
  const q = (u.searchParams.get("q") ?? "").trim();
  check(q.length <= 100, 400, "Search limited to 100 characters");
  return q;
}
async function head(s: Services, r: Repo) {
  const info = (await s.git.info(r.physical)) as { defaultBranch: string };
  const ref = branchRef(info.defaultBranch);
  return { ref, sha: (await s.git.log(r.physical, ref))[0]?.sha ?? ZERO };
}
export function application(s: Services) {
  return async (request: Request): Promise<Response> => {
    try {
      const url = new URL(request.url),
        path = url.pathname.split("/").filter(Boolean);
      const p = await s.authenticate(request);
      if (
        !["GET", "HEAD"].includes(request.method) &&
        !request.headers.get("authorization")
      )
        check(
          request.headers.get("origin") === s.origin,
          403,
          "Origin required",
        );
      let result: Response;
      if (path[0] === "api" && path[1] === "github") {
        check(p, 401, "Authentication required");
        check(s.github, 503, "GitHub connection unavailable");
        if (path.length === 2 && request.method === "GET")
          result = json(await s.github.account(p));
        else if (
          path.length === 3 &&
          path[2] === "repos" &&
          request.method === "GET"
        ) {
          const listed = await s.github.repos(p, url);
          const visible = await s.catalog.list(p, false);
          const imports = new Map<string, { id: string; state: string }[]>();
          for (const candidate of visible) {
            try {
              await authorize(s, p, candidate.id, "reader");
            } catch (e) {
              if (e instanceof Fault && e.status === 404) continue;
              throw e;
            }
            const op = await s.catalog.getOperation(candidate.id);
            if (op?.source)
              imports.set(op.source, [
                ...(imports.get(op.source) ?? []),
                { id: candidate.id, state: candidate.state },
              ]);
          }
          result = json({
            ...listed,
            repos: listed.repos.map((r: any) => ({
              ...r,
              imports:
                imports.get(`https://github.com/${r.fullName}.git`) ?? [],
            })),
            importStatusLimit: 100,
          });
        } else if (
          path.length === 3 &&
          path[2] === "import" &&
          request.method === "POST"
        ) {
          const b = await bodyJSON(request);
          const source = await s.github.source(p, b.repository);
          result = json(
            await createRepo(s, p, { name: source.name, url: source.url }),
            201,
          );
        } else if (
          path.length === 3 &&
          path[2] === "disconnect" &&
          request.method === "POST"
        )
          result = json(await s.github.disconnect(p));
        else throw new Fault(404, "Not found");
      } else if (
        path[0] === "api" &&
        path[1] === "me" &&
        request.method === "GET"
      ) {
        check(p, 401, "Authentication required");
        result = json(p);
      } else if (
        path[0] === "api" &&
        path[1] === "profile" &&
        path.length === 2 &&
        request.method === "GET"
      ) {
        check(p, 401, "Authentication required");
        const listed = await s.catalog.list(p, false);
        const histories = [];
        let incomplete = listed.length > 20;
        for (const candidate of listed.slice(0, 20)) {
          // Listing is a candidate set, not authorization: recheck inherited/tenant grants.
          let repo: Repo;
          try {
            repo = await authorize(s, p, candidate.id, "reader");
          } catch (e) {
            if (e instanceof Fault && e.status === 404) continue;
            throw e;
          }
          if (repo.state !== "ready") continue;
          const h = await reachable(s.git, repo);
          incomplete ||= h.incomplete;
          histories.push({ repo, commits: h.commits });
        }
        result = json({ ...contributions(p, histories), incomplete });
      } else if (
        path[0] === "api" &&
        path[1] === "discovery" &&
        request.method === "GET"
      ) {
        if (!s.allowPublic) check(p, 401, "Authentication required");
        result = json({
          repos: s.allowPublic ? await s.catalog.list(p, true, query(url)) : [],
        });
      } else if (
        path[0] === "api" &&
        path[1] === "repos" &&
        path.length === 2
      ) {
        check(p, 401, "Authentication required");
        if (request.method === "GET")
          result = json({ repos: await s.catalog.list(p, false, query(url)) });
        else {
          check(request.method === "POST", 405, "Method unsupported");
          result = json(await createRepo(s, p, await bodyJSON(request)), 201);
        }
      } else if (
        path[0] === "api" &&
        path[1] === "invites" &&
        path[2] &&
        request.method === "POST"
      ) {
        check(p, 401, "Authentication required");
        const i = await s.catalog.getInvite(path[2]);
        check(
          i && i.state === "pending" && i.expires > Date.now(),
          404,
          "Invitation unavailable",
        );
        check(
          p.emailVerified && p.email?.toLowerCase() === i.email,
          403,
          "Sign in with the invitation's verified email",
        );
        const repo = await s.catalog.get(i.repo);
        check(repo, 404, "Invitation unavailable");
        const canonical = repo.parent ? await s.catalog.get(repo.parent) : repo;
        check(
          canonical &&
            (canonical.tenant === canonical.owner ||
              canonical.tenant === p.tenant),
          403,
          "Select the invited organization with an active membership first",
        );
        await authorize(
          s,
          { id: i.issuer, tenant: canonical.tenant },
          repo.id,
          "admin",
        );
        if (s.member && canonical.tenant !== canonical.owner)
          check(
            await s.member(canonical.tenant, i.issuer),
            403,
            "Inviter organization membership inactive",
          );
        check(
          (await s.catalog.mergeIntent(repo.id))?.state !== "publishing",
          409,
          "Resolve publishing intent before changing access",
        );
        check(
          await s.catalog.acceptInvite(i.id, p.id),
          409,
          "Invitation is no longer pending",
        );
        await revokeAccessTokens(s, repo, p.id);
        result = json({ ok: true, repo: repo.id });
      } else if (path[0] === "api" && path[1] === "repos" && path[2]) {
        const id = path[2],
          action = path[3];
        const needed: Role = [
          "grants",
          "visibility",
          "invites",
          "merge",
          "reconcile",
        ].includes(action)
          ? "admin"
          : ["tasks", "proposals"].includes(action) && request.method === "POST"
            ? "contributor"
            : action === "review"
              ? "admin"
              : "reader";
        const r = await authorize(
          s,
          p,
          id,
          needed,
          (action === "token" && request.method === "POST") ||
            (request.method === "GET" &&
              ![
                "grants",
                "invites",
                "proposals",
                "diff",
                "review",
                "token",
                "merge",
                "reconcile",
              ].includes(action)),
        );
        if (!action && request.method === "GET")
          result = json({ ...r, git: await s.git.info(r.physical) });
        else if (action === "grants" && request.method === "GET")
          result = json(await s.catalog.grants(id));
        else if (action === "invites" && request.method === "GET")
          result = json(await s.catalog.invitations(id));
        else if (action === "invites" && request.method === "POST") {
          const b = await bodyJSON(request);
          if (b.revoke) {
            await s.catalog.revokeInvite(id, b.revoke);
            result = json({ ok: true });
          } else {
            check(
              typeof b.email === "string" &&
                b.email.length <= 254 &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email) &&
                Object.hasOwn(rank, b.role),
              400,
              "Invalid invitation",
            );
            const i: Invite = {
              id: uuid(),
              repo: id,
              email: b.email.toLowerCase(),
              role: b.role,
              issuer: p!.id,
              expires: Date.now() + 7 * 86400000,
              state: "pending",
              accepted_by: null,
            };
            await s.catalog.invite(i);
            result = json({ ...i, url: s.origin + "/?invite=" + i.id }, 201);
          }
        } else if (action === "grants" && request.method === "POST") {
          const b = await bodyJSON(request);
          check(
            typeof b.user === "string" &&
              ID.test(b.user) &&
              (b.role === null || Object.hasOwn(rank, b.role)),
            400,
            "Invalid grant",
          );
          check(b.user !== r.owner, 400, "Owner cannot be changed");
          check(
            (await s.catalog.mergeIntent(id))?.state !== "publishing",
            409,
            "Resolve publishing intent before changing access",
          );
          await s.catalog.grant(id, b.user, b.role);
          await revokeAccessTokens(s, r, b.user);
          result = json({ ok: true });
        } else if (action === "visibility" && request.method === "POST") {
          const b = await bodyJSON(request);
          check(
            b.visibility === "private" ||
              (b.visibility === "public" && s.allowPublic && b.confirm === id),
            400,
            "Publication disabled or unconfirmed",
          );
          check(
            !r.parent || b.visibility === "private",
            400,
            "Task repositories remain private",
          );
          check(
            (await s.catalog.mergeIntent(id))?.state !== "publishing",
            409,
            "Resolve publishing intent before changing visibility",
          );
          await s.catalog.visibility(id, b.visibility);
          await revokeTokens(s, r);
          result = json({ ok: true });
        } else if (action === "token" && request.method === "POST") {
          check(p, 401, "Authentication required");
          const b = await bodyJSON(request);
          check(
            b.scope === "read" || b.scope === "write",
            400,
            "Invalid scope",
          );
          if (b.scope === "write") {
            await authorize(s, p, id, "writer");
            check(
              r.parent,
              403,
              "Canonical write capabilities are withheld; use a task fork",
            );
          }
          check(p && r.state === "ready", 409, "Repository is not ready");
          const token = await s.git.token(r.physical, b.scope);
          if (token.id) {
            try {
              await s.catalog.nativeToken(
                token.id,
                id,
                p.id,
                Date.parse(token.expiresAt),
              );
            } catch (e) {
              await s.git.revoke(r.physical, token.id);
              throw e;
            }
          }
          try {
            await authorize(
              s,
              p,
              id,
              b.scope === "write" ? "writer" : "reader",
              b.scope === "read",
            );
          } catch (e) {
            if (token.id) {
              await s.git.revoke(r.physical, token.id);
              await s.catalog.removeToken(token.id);
            }
            throw e;
          }
          result = json(token);
        } else if (action === "log" && request.method === "GET")
          result = json(
            await s.git.log(r.physical, url.searchParams.get("ref") ?? "HEAD"),
          );
        else if (action === "commit" && request.method === "GET") {
          const sha = url.searchParams.get("sha") ?? "";
          check(SHA.test(sha), 400, "Invalid commit ID");
          const h = await reachable(s.git, r);
          const c = h.commits.find((c) => c.sha === sha);
          check(c, 404, "Commit unavailable in reachable history window");
          result = json(c);
        } else if (action === "tree" && request.method === "GET") {
          const sha = url.searchParams.get("sha") ?? "";
          check(/^[0-9a-f]{40}$/.test(sha), 400, "Invalid tree");
          result = json(await s.git.tree(r.physical, sha));
        } else if (action === "file" && request.method === "GET") {
          const ref = url.searchParams.get("ref") ?? "HEAD",
            filename = url.searchParams.get("path") ?? "README.md";
          check(
            filename.length < 1024 &&
              !filename.split("/").some((p) => p === ".." || p === ".") &&
              !filename.startsWith("/") &&
              !filename.includes("\0"),
            400,
            "Invalid path",
          );
          const file = await s.git.file(r.physical, ref, filename);
          check(file, 404, "Not found");
          check(file.size <= 1024 * 1024, 413, "Browse limited to 1 MiB");
          result = new Response(file, {
            headers: {
              "content-type": "text/plain; charset=utf-8",
              "content-disposition": 'attachment; filename="source.txt"',
              "x-content-type-options": "nosniff",
            },
          });
        } else if (action === "tasks" && request.method === "POST") {
          check(p, 401, "Authentication required");
          check(!r.parent, 400, "Tasks fork canonical repositories");
          result = json(
            await createRepo(s, p, await bodyJSON(request), r),
            201,
          );
        } else if (action === "proposals" && request.method === "GET")
          result = json(await s.catalog.proposals(id));
        else if (action === "proposals" && request.method === "POST") {
          const b = await bodyJSON(request);
          const task = await authorize(s, p, b.task, "writer");
          check(
            task.parent === id &&
              /^[0-9a-f]{40}$/.test(b.base) &&
              /^[0-9a-f]{40}$/.test(b.candidate),
            400,
            "Invalid proposal",
          );
          const base = await s.git.log(r.physical, b.base),
            candidate = await s.git.log(task.physical, b.candidate);
          check(
            (b.base === ZERO
              ? !(await s.git.log(r.physical, "HEAD")).length
              : base[0]?.sha === b.base) && candidate[0]?.sha === b.candidate,
            422,
            "Commit unavailable",
          );
          check(!r.parent, 400, "Proposals target a canonical repository");
          check(
            (await head(s, r)).sha === b.base,
            409,
            "Canonical head moved; new proposal required",
          );
          await descendant(s.git, task.physical, b.base, b.candidate);
          const proposal: Proposal = {
            id: uuid(),
            repo: id,
            task: task.id,
            base: b.base,
            candidate: b.candidate,
            author: p!.id,
            status: "open",
          };
          await s.catalog.propose(proposal);
          result = json(proposal, 201);
        } else if (action === "review" && request.method === "POST") {
          const b = await bodyJSON(request);
          check(
            b.status === "approved" || b.status === "rejected",
            400,
            "Invalid decision",
          );
          const proposal = (await s.catalog.proposals(id)).find(
            (x) => x.id === b.id,
          );
          check(proposal, 404, "Not found");
          if (b.status === "approved") {
            const current = await head(s, r);
            check(
              current.sha === proposal.base,
              409,
              "Canonical head moved; new proposal required",
            );
          }
          check(
            await s.catalog.review(id, b.id, b.status),
            409,
            "Already reviewed",
          );
          result = json({ ok: true, integrated: false });
        } else if (action === "diff" && request.method === "GET") {
          const proposal = (await s.catalog.proposals(id)).find(
            (x) => x.id === url.searchParams.get("proposal"),
          );
          check(proposal, 404, "Not found");
          const task = await s.catalog.get(proposal.task);
          check(
            task && task.parent === id && task.tenant === r.tenant,
            422,
            "Task unavailable",
          );
          result = json(
            await diff(s.git, task.physical, proposal.base, proposal.candidate),
          );
        } else if (action === "merge" && request.method === "GET")
          result = json(await s.catalog.mergeIntent(id));
        else if (action === "merge" && request.method === "POST") {
          const b = await bodyJSON(request);
          const proposal = (await s.catalog.proposals(id)).find(
            (x) => x.id === b.id,
          );
          check(
            proposal?.status === "approved",
            409,
            "An approved proposal is required",
          );
          const prior = await s.catalog.mergeIntent(id);
          if (prior?.state === "merged" && prior.proposal === b.id)
            return json({
              ok: true,
              integrated: true,
              candidate: prior.candidate,
            });
          check(
            prior?.state !== "publishing",
            409,
            "Publishing intent exists; reconcile before retrying",
          );
          const task = await s.catalog.get(proposal.task);
          check(
            task && task.parent === id && task.tenant === r.tenant,
            422,
            "Task unavailable",
          );
          const current = await head(s, r);
          check(
            current.sha === proposal.base,
            409,
            "Canonical head moved; new proposal required",
          );
          await descendant(
            s.git,
            task.physical,
            proposal.base,
            proposal.candidate,
          );
          const intent: MergeIntent = {
            repo: id,
            proposal: b.id,
            base: proposal.base,
            candidate: proposal.candidate,
            ref: current.ref,
            fence: uuid(),
            state: "publishing",
            error: null,
          };
          check(
            await s.catalog.beginMerge(intent),
            409,
            "Another publisher holds the fence",
          );
          try {
            // Immutable LFS associations become readable before ref publication. No repo code runs.
            await copyManifests(s.store, r.tenant, task.id, id);
            await s.git.publish(
              task.physical,
              r.physical,
              current.ref,
              proposal.base,
              proposal.candidate,
            );
            check(
              (await head(s, r)).sha === proposal.candidate,
              502,
              "Publication receipt disagrees with canonical head",
            );
            check(
              await s.catalog.finishMerge(id, intent.fence, "merged"),
              409,
              "Publisher fence changed",
            );
          } catch {
            // A transport failure can follow a successful remote push. Keep the fence until read-only reconciliation.
            throw new Fault(
              502,
              "Publication uncertain; reconcile retained intent before retrying",
            );
          }
          result = json({
            ok: true,
            integrated: true,
            candidate: proposal.candidate,
          });
        } else if (action === "reconcile" && request.method === "POST") {
          const intent = await s.catalog.mergeIntent(id);
          if (intent?.state === "publishing") {
            const current =
              (await s.git.log(r.physical, intent.ref))[0]?.sha ?? ZERO;
            check(
              current === intent.candidate || current !== intent.base,
              409,
              "Canonical still at base; publisher may be in flight. Fence retained; no unsafe retry",
            );
            const merged = current === intent.candidate;
            check(
              await s.catalog.finishMerge(
                id,
                intent.fence,
                merged ? "merged" : "failed",
                merged ? undefined : "Canonical diverged",
              ),
              409,
              "Fence changed",
            );
            result = json({ ok: true, integrated: merged, head: current });
          } else if (r.state !== "ready") {
            const operation = await s.catalog.getOperation(id);
            check(
              operation,
              409,
              "Creation intent is incomplete; retry into a new private repository",
            );
            await s.git.info(r.physical);
            check(
              JSON.stringify(await s.git.refs(r.physical)) === operation.refs,
              409,
              "Source snapshot and destination refs disagree; intent retained",
            );
            if (r.parent) {
              const parent = await s.catalog.get(r.parent);
              check(
                parent && parent.tenant === r.tenant,
                409,
                "Fork source unavailable",
              );
              await copyManifests(s.store, r.tenant, parent.id, id);
            }
            await s.git.seal(r.physical);
            await s.catalog.state(id, "ready");
            result = json({ ok: true, state: "ready" });
          } else result = json({ ok: true, intent });
        } else throw new Fault(404, "Not found");
      } else if (path[0] === "lfs" && path[1]) {
        const id = path[1];
        const isBatch = path[2] === "objects" && path[3] === "batch";
        const b = isBatch ? await bodyJSON(request) : null;
        const needed: Role =
          (isBatch && b.operation === "upload") ||
          request.method === "PUT" ||
          path[2] === "verify"
            ? "writer"
            : "reader";
        const r = await authorize(s, p, id, needed); // Never public anonymous LFS, never tenant-wide OID lookup.
        if (isBatch) {
          check(
            request.method === "POST" &&
              ["upload", "download"].includes(b.operation),
            400,
            "Invalid operation",
          );
          check(!b.hash_algo || b.hash_algo === "sha256", 422, "Only SHA256");
          check(
            !b.transfers ||
              (Array.isArray(b.transfers) && b.transfers.includes("basic")),
            422,
            "Only basic transfer",
          );
          check(
            Array.isArray(b.objects) && b.objects.length <= 32,
            400,
            "Batch limited to 32 objects",
          );
          const objects = [];
          for (const v of b.objects) {
            object(v);
            const m = await loadManifest(s.store, r.tenant, id, v.oid);
            check(!m || m.size === v.size, 422, "Size mismatch");
            const header = {
              Authorization: request.headers.get("authorization") ?? "",
            };
            check(
              header.Authorization,
              401,
              "LFS requires a bearer or Basic credential",
            );
            if (b.operation === "download")
              objects.push(
                m
                  ? {
                      ...v,
                      authenticated: true,
                      actions: {
                        download: {
                          href: `${s.origin}/lfs/${id}/objects/${v.oid}`,
                          header,
                        },
                      },
                    }
                  : {
                      ...v,
                      error: { code: 404, message: "Object unavailable" },
                    },
              );
            else if (m) objects.push({ oid: v.oid, size: v.size });
            else if (s.localUpload)
              objects.push({
                ...v,
                authenticated: true,
                actions: {
                  upload: {
                    href: `${s.origin}/lfs/${id}/objects/${v.oid}?size=${v.size}`,
                    header,
                  },
                  verify: {
                    href: `${s.origin}/lfs/${id}/verify/${v.oid}`,
                    header,
                  },
                },
              });
            else {
              check(s.presign, 503, "Direct R2 upload not configured");
              const tid = uuid();
              const t: Ticket = {
                id: tid,
                tenant: r.tenant,
                repo: id,
                oid: v.oid,
                size: v.size,
                key: `staging-v1/${r.tenant}/${id}/${tid}`,
                expires: Date.now() + 600000,
              };
              await s.catalog.ticket(t);
              const signed = await s.presign(t);
              objects.push({
                ...v,
                authenticated: true,
                actions: {
                  upload: { ...signed, expires_in: 600 },
                  verify: {
                    href: `${s.origin}/lfs/${id}/verify/${v.oid}?ticket=${tid}`,
                    header,
                  },
                },
              });
            }
          }
          result = json(
            { transfer: "basic", objects, hash_algo: "sha256" },
            200,
            true,
          );
        } else if (path[2] === "objects" && HASH.test(path[3] ?? "")) {
          const oid = path[3];
          if (request.method === "PUT") {
            check(
              s.localUpload,
              405,
              "Production uploads use direct R2 staging",
            );
            check(request.body, 400, "Missing body");
            const size = Number(url.searchParams.get("size"));
            object({ oid, size });
            result = json(
              await ingest(s.store, r.tenant, id, oid, size, request.body),
            );
          } else {
            check(request.method === "GET", 405, "Method unsupported");
            check(
              !request.headers.has("range"),
              416,
              "Range and resume are unsupported",
            );
            const m = await loadManifest(s.store, r.tenant, id, oid);
            check(m, 404, "Not found");
            result = new Response(download(s.store, r.tenant, m), {
              headers: {
                "content-type": "application/octet-stream",
                "content-length": String(m.size),
                "accept-ranges": "none",
              },
            });
          }
        } else if (
          path[2] === "verify" &&
          HASH.test(path[3] ?? "") &&
          request.method === "POST"
        ) {
          const v = await bodyJSON(request);
          object(v);
          check(v.oid === path[3], 422, "OID mismatch");
          const existing = await loadManifest(s.store, r.tenant, id, v.oid);
          if (existing) {
            check(existing.size === v.size, 422, "Size mismatch");
            result = json({ ok: true }, 200, true);
          } else {
            const t = await s.catalog.getTicket(
              url.searchParams.get("ticket") ?? "",
            );
            check(
              t &&
                t.repo === id &&
                t.tenant === r.tenant &&
                t.oid === v.oid &&
                t.size === v.size &&
                t.expires > Date.now(),
              404,
              "Not found",
            );
            const staged = await s.store.get(t.key);
            check(staged, 404, "Staged upload missing");
            await ingest(s.store, r.tenant, id, v.oid, v.size, staged);
            await s.store.delete(t.key);
            result = json({ ok: true }, 200, true);
          }
        } else throw new Fault(404, "Not found");
      } else throw new Fault(404, "Not found");
      result.headers.set("cache-control", "no-store");
      result.headers.set("x-content-type-options", "nosniff");
      return result;
    } catch (e) {
      const f = e instanceof Fault ? e : new Fault(500, "Internal failure");
      return json({ message: f.message }, f.status);
    }
  };
}
