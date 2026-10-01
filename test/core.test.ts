import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localServices, git } from "../scripts/local.ts";
import { application } from "../src/app.ts";
import { ZERO } from "../src/review.ts";
async function harness() {
  const dir = await mkdtemp(join(tmpdir(), "forge-core-")),
    l = await localServices(dir);
  const call = async (path: string, body?: any, token = l.token) =>
    application(l.s)(
      new Request(l.s.origin + path, {
        method: body ? "POST" : "GET",
        headers: { authorization: "Bearer " + token },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  const repo = await (await call("/api/repos", { name: "alpha" })).json();
  return {
    ...l,
    dir,
    repo,
    call,
    async close() {
      l.db.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}
test("email-bound invitations: verified acceptance, wrong email/org denial, expiry/revoke, one-time grant and safe search", async () => {
  const l = await harness();
  try {
    const prefix = "/api/repos/" + l.repo.id;
    l.credentials.set("guest", {
      id: "guest",
      tenant: l.principal.tenant,
      email: "guest@example.invalid",
      emailVerified: true,
    });
    l.credentials.set("wrong", {
      id: "wrong",
      tenant: l.principal.tenant,
      email: "other@example.invalid",
      emailVerified: true,
    });
    l.credentials.set("unverified", {
      id: "unverified",
      tenant: l.principal.tenant,
      email: "guest@example.invalid",
      emailVerified: false,
    });
    const i = await (
      await l.call(prefix + "/invites", {
        email: "Guest@example.invalid",
        role: "writer",
      })
    ).json();
    for (const t of ["wrong", "unverified"])
      assert.equal((await l.call("/api/invites/" + i.id, {}, t)).status, 403);
    assert.equal(
      (await l.call("/api/invites/" + i.id, {}, "guest")).status,
      200,
    );
    assert.equal(
      (await l.call("/api/invites/" + i.id, {}, "guest")).status,
      404,
    );
    assert.equal((await l.call(prefix, undefined, "guest")).status, 200);
    const revoked = await (
      await l.call(prefix + "/invites", {
        email: "guest@example.invalid",
        role: "admin",
      })
    ).json();
    await l.call(prefix + "/invites", { revoke: revoked.id });
    assert.equal(
      (await l.call("/api/invites/" + revoked.id, {}, "guest")).status,
      404,
    );
    const expired = await (
      await l.call(prefix + "/invites", {
        email: "guest@example.invalid",
        role: "admin",
      })
    ).json();
    l.db.prepare("UPDATE invites SET expires=0 WHERE id=?").run(expired.id);
    assert.equal(
      (await l.call("/api/invites/" + expired.id, {}, "guest")).status,
      404,
    );
    assert.equal(
      (await (await l.call("/api/repos?q=alp")).json()).repos.length,
      1,
    );
    assert.equal(
      (await (await l.call("/api/repos?q=%25")).json()).repos.length,
      0,
    );
    assert.equal(
      (await (await l.call("/api/repos?q=' OR 1=1 --")).json()).repos.length,
      0,
    );
    let revokedTokens = 0;
    l.s.git.token = async () => ({
      id: "native_one",
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      plaintext: "not-recorded",
    });
    l.s.git.revoke = async () => {
      revokedTokens++;
    };
    await l.call(prefix + "/token", { scope: "read" }, "guest");
    await l.call(prefix + "/grants", { user: "guest", role: null });
    assert.equal(revokedTokens, 1);
    assert.equal((await l.call(prefix, undefined, "guest")).status, 404);
    l.s.allowPublic = true;
    assert.equal(
      (await l.call(prefix + "/visibility", { visibility: "public" })).status,
      400,
    );
    assert.equal(
      (
        await l.call(prefix + "/visibility", {
          visibility: "public",
          confirm: l.repo.id,
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await (
          await l.call("/api/discovery?q=alp", undefined, "invalid")
        ).json()
      ).repos.length,
      1,
    );
    assert.equal(
      (await l.call(prefix + "/token", { scope: "read" }, "guest")).status,
      200,
    );
    assert.equal(
      (await l.call(prefix + "/token", { scope: "write" }, "guest")).status,
      404,
    );
    assert.equal(
      (await l.call(prefix + "/token", { scope: "read" }, "invalid")).status,
      401,
    );
    await l.call(prefix + "/visibility", { visibility: "private" });
    assert.equal(revokedTokens, 2);
    assert.equal(
      (await (await l.call("/api/discovery", undefined, "invalid")).json())
        .repos.length,
      0,
    );
  } finally {
    await l.close();
  }
});
test("personal sharing crosses personal identity, organization sharing cannot cross organizations", async () => {
  const l = await harness();
  try {
    const own = { id: "user_owner", tenant: "user_owner" };
    l.credentials.set("owner", own);
    l.credentials.set("guest", { id: "user_guest", tenant: "user_guest" });
    const personal = await (
      await l.call("/api/repos", { name: "personal" }, "owner")
    ).json();
    await l.call(
      "/api/repos/" + personal.id + "/grants",
      { user: "user_guest", role: "contributor" },
      "owner",
    );
    assert.equal(
      (await l.call("/api/repos/" + personal.id, undefined, "guest")).status,
      200,
    );
    assert.equal(
      (await (await l.call("/api/repos", undefined, "guest")).json()).repos
        .length,
      1,
    );
    const task = await (
      await l.call(
        "/api/repos/" + personal.id + "/tasks",
        { name: "guest-task" },
        "guest",
      )
    ).json();
    assert.equal(task.tenant, own.tenant);
    assert.equal(
      (await l.call("/api/repos/" + task.id, undefined, "guest")).status,
      200,
    );
    l.credentials.set("reader", {
      id: "user_reader",
      tenant: "user_reader",
      email: "reader@example.invalid",
      emailVerified: true,
    });
    const invite = await (
      await l.call(
        "/api/repos/" + task.id + "/invites",
        {
          email: "reader@example.invalid",
          role: "reader",
        },
        "owner",
      )
    ).json();
    assert.equal(
      (await l.call("/api/invites/" + invite.id, {}, "reader")).status,
      200,
    );
    assert.equal(
      (await l.call("/api/repos/" + task.id, undefined, "reader")).status,
      200,
    );
    // A task owner loses implicit task authority with the parent contributor grant.
    await l.call(
      "/api/repos/" + personal.id + "/grants",
      { user: "user_guest", role: null },
      "owner",
    );
    assert.equal(
      (await l.call("/api/repos/" + task.id, undefined, "guest")).status,
      404,
    );
    // Independently shared task read access remains explicit and cannot grant parent access.
    assert.equal(
      (await l.call("/api/repos/" + task.id, undefined, "reader")).status,
      200,
    );
    assert.equal(
      (await l.call("/api/repos/" + personal.id, undefined, "reader")).status,
      404,
    );
    // Organization fixture from harness must remain non-enumerable even with a direct user grant.
    await l.call("/api/repos/" + l.repo.id + "/grants", {
      user: "user_guest",
      role: "admin",
    });
    assert.equal(
      (await l.call("/api/repos/" + l.repo.id, undefined, "guest")).status,
      404,
    );
  } finally {
    await l.close();
  }
});
async function taskCommit(
  l: Awaited<ReturnType<typeof harness>>,
  task: any,
  dir: string,
  message: string,
) {
  await git(["clone", l.plane.path(task.physical), dir]);
  await git(["config", "user.name", "Fixture"], dir);
  await git(["config", "user.email", "fixture@example.invalid"], dir);
  await writeFile(join(dir, "README.md"), message);
  await git(["add", "."], dir);
  await git(["commit", "-m", message], dir);
  await git(["push", "origin", "HEAD:main"], dir);
  return git(["rev-parse", "HEAD"], dir);
}
test("task -> immutable diff -> approval -> real controlled publication; empty seed, replay, concurrent stale-head safety", async () => {
  const l = await harness();
  try {
    const prefix = "/api/repos/" + l.repo.id;
    const seed = await (
      await l.call(prefix + "/tasks", { name: "seed" })
    ).json();
    const candidate = await taskCommit(
      l,
      seed,
      join(l.dir, "seed"),
      "Initial README",
    );
    const proposal = await (
      await l.call(prefix + "/proposals", {
        task: seed.id,
        base: ZERO,
        candidate,
      })
    ).json();
    assert.equal(
      (await l.call(prefix + "/merge", { id: proposal.id })).status,
      409,
    );
    const d = await (
      await l.call(prefix + "/diff?proposal=" + proposal.id)
    ).json();
    assert.equal(d.files[0].status, "added");
    assert.equal(d.files[0].after, "Initial README");
    assert.equal(
      (
        await l.call(prefix + "/review", {
          id: proposal.id,
          status: "approved",
        })
      ).status,
      200,
    );
    assert.equal(
      (await l.call(prefix + "/merge", { id: proposal.id })).status,
      200,
    );
    assert.equal(
      await git([
        "--git-dir",
        l.plane.path(l.repo.physical),
        "rev-parse",
        "HEAD",
      ]),
      candidate,
    );
    assert.equal(
      (await l.call(prefix + "/merge", { id: proposal.id })).status,
      200,
    );
    const tasks = await Promise.all(
      ["one", "two"].map(async (name) =>
        (await l.call(prefix + "/tasks", { name })).json(),
      ),
    );
    const candidates = await Promise.all(
      tasks.map((t, i) =>
        taskCommit(l, t, join(l.dir, "work" + i), "Edit " + i),
      ),
    );
    const proposals = await Promise.all(
      tasks.map(async (t, i) =>
        (
          await l.call(prefix + "/proposals", {
            task: t.id,
            base: candidate,
            candidate: candidates[i],
          })
        ).json(),
      ),
    );
    for (const p of proposals)
      assert.equal(
        (await l.call(prefix + "/review", { id: p.id, status: "approved" }))
          .status,
        200,
      );
    const results = await Promise.all(
      proposals.map((p) => l.call(prefix + "/merge", { id: p.id })),
    );
    assert.equal(results.filter((r) => r.status === 200).length, 1);
    assert.equal(results.filter((r) => r.status === 409).length, 1);
    const winner = await git([
      "--git-dir",
      l.plane.path(l.repo.physical),
      "rev-parse",
      "HEAD",
    ]);
    assert.ok(candidates.includes(winner));
    const losing = proposals.find((p) => p.candidate !== winner);
    assert.equal(
      (await l.call(prefix + "/merge", { id: losing.id })).status,
      409,
    );
    const intent = await l.catalog.mergeIntent(l.repo.id);
    assert.equal(intent?.state, "merged");
  } finally {
    await l.close();
  }
});
test("uncertain publisher retains fence; confirmed push can recover; unchanged head never retries blindly", async () => {
  const l = await harness();
  try {
    const prefix = "/api/repos/" + l.repo.id,
      task = await (await l.call(prefix + "/tasks", { name: "task" })).json();
    const candidate = await taskCommit(
      l,
      task,
      join(l.dir, "work"),
      "Recovery",
    );
    const p = await (
      await l.call(prefix + "/proposals", {
        task: task.id,
        base: ZERO,
        candidate,
      })
    ).json();
    await l.call(prefix + "/review", { id: p.id, status: "approved" });
    const publish = l.s.git.publish.bind(l.s.git);
    l.s.git.publish = async () => {
      throw Error("Disconnected before push");
    };
    assert.equal((await l.call(prefix + "/merge", { id: p.id })).status, 502);
    assert.equal((await l.call(prefix + "/merge", { id: p.id })).status, 409);
    assert.equal((await l.call(prefix + "/reconcile", {})).status, 409);
    assert.equal(
      (await l.call(prefix + "/grants", { user: "guest", role: "reader" }))
        .status,
      409,
    );
    await publish(
      task.physical,
      l.repo.physical,
      "refs/heads/main",
      ZERO,
      candidate,
    );
    const recovered = await (await l.call(prefix + "/reconcile", {})).json();
    assert.equal(recovered.integrated, true);
    assert.equal((await l.catalog.mergeIntent(l.repo.id))?.state, "merged");
  } finally {
    await l.close();
  }
});

test("lifecycle reconciliation refuses fabricated readiness and incomplete source snapshots", async () => {
  const l = await harness();
  try {
    const prefix = "/api/repos/" + l.repo.id;
    assert.equal((await l.catalog.getOperation(l.repo.id))?.kind, "create");
    // Simulate a lost metadata acknowledgment after valid empty native creation.
    await l.catalog.state(l.repo.id, "creating");
    assert.equal((await l.call(prefix + "/reconcile", {})).status, 200);
    // A forged expected source ref must never become a successful import/fork claim.
    await l.catalog.state(l.repo.id, "failed");
    l.db
      .prepare("UPDATE operations SET refs=? WHERE repo=?")
      .run(
        JSON.stringify([{ ref: "refs/heads/main", sha: "a".repeat(40) }]),
        l.repo.id,
      );
    assert.equal((await l.call(prefix + "/reconcile", {})).status, 409);
    assert.equal((await l.catalog.get(l.repo.id))?.state, "failed");
    assert.equal(
      (await l.call(prefix + "/token", { scope: "read" })).status,
      409,
    );
    l.db.prepare("DELETE FROM operations WHERE repo=?").run(l.repo.id);
    assert.equal((await l.call(prefix + "/reconcile", {})).status, 409);
  } finally {
    await l.close();
  }
});

test("native revocation covers tasks beyond listing pages and closes issuance after grant withdrawal", async () => {
  const l = await harness();
  try {
    const prefix = "/api/repos/" + l.repo.id;
    l.credentials.set("guest", { id: "guest", tenant: l.principal.tenant });
    await l.catalog.grant(l.repo.id, "guest", "writer");
    const revoked: string[] = [];
    l.s.git.revoke = async (_repo, id) => {
      revoked.push(id);
    };
    l.s.git.token = async () => {
      await l.catalog.grant(l.repo.id, "guest", null);
      return {
        id: "issuance-race",
        plaintext: "not-recorded",
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      };
    };
    assert.equal(
      (await l.call(prefix + "/token", { scope: "read" }, "guest")).status,
      404,
    );
    assert.deepEqual(revoked, ["issuance-race"]);
    assert.equal((await l.catalog.tokens(l.repo.id)).length, 0);
    await l.catalog.grant(l.repo.id, "guest", "writer");
    for (let i = 0; i <= 100; i++) {
      const id = "child_" + String(i).padStart(3, "0");
      await l.catalog.create({
        ...l.repo,
        id,
        name: id,
        physical: "cf-native-forge-" + id,
        owner: "guest",
        parent: l.repo.id,
      });
    }
    assert.equal((await l.catalog.list(l.principal, false)).length, 100);
    await l.catalog.nativeToken(
      "beyond-page",
      "child_100",
      "guest",
      Date.now() + 60000,
    );
    assert.equal(
      (await l.call(prefix + "/grants", { user: "guest", role: null })).status,
      200,
    );
    assert.ok(revoked.includes("beyond-page"));
    assert.equal((await l.catalog.tokens("child_100")).length, 0);
    assert.equal(
      (await l.call("/api/repos/child_100", undefined, "guest")).status,
      404,
    );
  } finally {
    await l.close();
  }
});
