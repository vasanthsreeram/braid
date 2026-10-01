import type {
  Services,
  Principal,
  Repo,
  Role,
  Ticket,
  Proposal,
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
  check(p && p.tenant === repo.tenant, 404, "Not found");
  const role = p.id === repo.owner ? "admin" : await s.catalog.role(id, p.id);
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
  const id = uuid();
  const physical = `cf-native-forge-${id}`;
  const r: Repo = {
    id,
    tenant: p.tenant,
    owner: p.id,
    name: b.name,
    physical,
    visibility: "private",
    state: "creating",
    parent: parent?.id ?? null,
  };
  await s.catalog.create(r);
  try {
    if (parent) {
      check(parent.tenant === p.tenant, 403, "Cross-tenant forks unsupported");
      check(
        (await s.store.listManifests(p.tenant, parent.id)).length <= 128,
        409,
        "Task fork manifest limit",
      );
      await s.git.fork(parent.physical, physical);
      await copyManifests(s.store, p.tenant, parent.id, id);
    } else if (b.url) await s.git.import(physical, githubURL(b.url));
    else await s.git.create(physical);
    await s.catalog.state(id, "ready");
    r.state = "ready";
    return r;
  } catch {
    await s.catalog.state(id, "failed");
    throw new Fault(
      502,
      "Git operation failed; intent retained for reconciliation",
    );
  }
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
      if (path[0] === "api" && path[1] === "me" && request.method === "GET") {
        check(p, 401, "Authentication required");
        result = json(p);
      } else if (
        path[0] === "api" &&
        path[1] === "discovery" &&
        request.method === "GET"
      ) {
        if (!s.allowPublic) check(p, 401, "Authentication required");
        result = json({
          repos: s.allowPublic ? await s.catalog.list(p, true) : [],
        });
      } else if (
        path[0] === "api" &&
        path[1] === "repos" &&
        path.length === 2
      ) {
        check(p, 401, "Authentication required");
        if (request.method === "GET")
          result = json({ repos: await s.catalog.list(p, false) });
        else {
          check(request.method === "POST", 405, "Method unsupported");
          result = json(await createRepo(s, p, await bodyJSON(request)), 201);
        }
      } else if (path[0] === "api" && path[1] === "repos" && path[2]) {
        const id = path[2],
          action = path[3];
        const needed: Role = ["grants", "visibility"].includes(action)
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
          request.method === "GET" &&
            !["grants", "proposals", "review", "token"].includes(action),
        );
        if (!action && request.method === "GET")
          result = json({ ...r, git: await s.git.info(r.physical) });
        else if (action === "grants" && request.method === "POST") {
          const b = await bodyJSON(request);
          check(
            typeof b.user === "string" &&
              ID.test(b.user) &&
              (b.role === null || Object.hasOwn(rank, b.role)),
            400,
            "Invalid grant",
          );
          check(b.user !== r.owner, 400, "Owner cannot be changed");
          await s.catalog.grant(id, b.user, b.role);
          result = json({ ok: true });
        } else if (action === "visibility" && request.method === "POST") {
          const b = await bodyJSON(request);
          check(
            b.visibility === "private" ||
              (b.visibility === "public" && s.allowPublic && b.confirm === id),
            400,
            "Publication disabled or unconfirmed",
          );
          await s.catalog.visibility(id, b.visibility);
          result = json({ ok: true });
        } else if (action === "token" && request.method === "POST") {
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
          result = json(await s.git.token(r.physical, b.scope));
        } else if (action === "log" && request.method === "GET")
          result = json(
            await s.git.log(r.physical, url.searchParams.get("ref") ?? "HEAD"),
          );
        else if (action === "tree" && request.method === "GET") {
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
            base[0]?.sha === b.base && candidate[0]?.sha === b.candidate,
            422,
            "Commit unavailable",
          );
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
            const head = (await s.git.log(r.physical, "HEAD"))[0];
            check(
              head?.sha === proposal.base,
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
        } else if (action === "check" && request.method === "POST") {
          await authorize(s, p, id, "contributor");
          const b = await bodyJSON(request);
          check(
            b.contract === "json-parse-v1" && /^[0-9a-f]{40}$/.test(b.commit),
            400,
            "Only immutable JSON parse check supported",
          );
          check(
            Array.isArray(b.paths) &&
              b.paths.length > 0 &&
              b.paths.length <= 8 &&
              b.paths.every(
                (x: unknown) =>
                  typeof x === "string" &&
                  /^[\w/-]+\.json$/.test(x) &&
                  !x.includes(".."),
              ),
            400,
            "Invalid paths",
          );
          const results = [];
          for (const f of b.paths) {
            const file = await s.git.file(r.physical, b.commit, f);
            check(file && file.size <= 65536, 422, "Missing or oversized JSON");
            try {
              JSON.parse(await file.text());
              results.push({ path: f, passed: true });
            } catch {
              results.push({ path: f, passed: false });
            }
          }
          result = json({
            contract: b.contract,
            commit: b.commit,
            passed: results.every((x) => x.passed),
            results,
          });
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
                key: `${root(r.tenant)}/staging/${id}/${tid}`,
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
