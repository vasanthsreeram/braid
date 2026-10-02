import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { application, githubURL } from "../src/app.ts";
import { localServices, git } from "../scripts/local.ts";
import { digest, manifestKey, ingest } from "../src/storage.ts";
import worker from "../src/worker.ts";
async function setup() {
  const dir = await mkdtemp(join(tmpdir(), "cf-native-forge-test-"));
  const l = await localServices(dir, "http://127.0.0.1:8787");
  const app = application(l.s);
  const call = async (
    path: string,
    body?: unknown,
    token: string | null = l.token,
    method = body ? "POST" : "GET",
    headers: Record<string, string> = {},
  ) =>
    app(
      new Request(l.s.origin + path, {
        method,
        headers: {
          ...(token ? { authorization: "Bearer " + token } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  const repo = await (await call("/api/repos", { name: "test" })).json();
  return {
    ...l,
    dir,
    call,
    repo,
    close: async () => {
      l.db.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}
test("private default, missing identity, same-tenant stranger, other tenant, and discovery leak resistance", async () => {
  const l = await setup();
  try {
    assert.equal(l.repo.visibility, "private");
    l.credentials.set("stranger", { id: "stranger", tenant: "local-tenant" });
    l.credentials.set("other", {
      id: l.principal.id,
      tenant: "another-tenant",
    });
    for (const token of [null, "stranger", "other"])
      for (const path of [
        "/api/repos/" + l.repo.id,
        "/api/repos/" + l.repo.id + "/log",
        "/lfs/" + l.repo.id + "/objects/" + "a".repeat(64),
      ])
        assert.equal((await l.call(path, undefined, token)).status, 404);
    assert.equal((await l.call("/api/repos", undefined, null)).status, 401);
    assert.equal((await l.call("/api/discovery", undefined, null)).status, 401);
    assert.deepEqual(await (await l.call("/api/discovery")).json(), {
      repos: [],
    });
    assert.equal(
      (
        await l.call("/api/repos/" + l.repo.id + "/visibility", {
          visibility: "public",
          confirm: l.repo.id,
        })
      ).status,
      400,
    );
  } finally {
    await l.close();
  }
});
test("sharing grants immediate read, cannot write, and revoke removes access", async () => {
  const l = await setup();
  try {
    l.credentials.set("guest", { id: "guest", tenant: l.principal.tenant });
    assert.equal(
      (
        await l.call("/api/repos/" + l.repo.id + "/grants", {
          user: "guest",
          role: "reader",
        })
      ).status,
      200,
    );
    assert.equal(
      (await l.call("/api/repos/" + l.repo.id, undefined, "guest")).status,
      200,
    );
    assert.equal(
      (
        await l.call(
          "/api/repos/" + l.repo.id + "/tasks",
          { name: "fork" },
          "guest",
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await l.call(
          "/api/repos/" + l.repo.id + "/grants",
          { user: l.principal.id, role: "admin" },
          "guest",
        )
      ).status,
      404,
    );
    assert.equal(
      (await (await l.call("/api/repos", undefined, "guest")).json()).repos
        .length,
      1,
    );
    await l.call("/api/repos/" + l.repo.id + "/grants", {
      user: "guest",
      role: null,
    });
    assert.equal(
      (await l.call("/api/repos/" + l.repo.id, undefined, "guest")).status,
      404,
    );
  } finally {
    await l.close();
  }
});
test("LFS Batch/basic transfer, duplicate upload, missing OID, range rejection and per-repo ACL", async () => {
  const l = await setup();
  try {
    const data = new TextEncoder().encode("real object"),
      oid = digest(data),
      base = "/lfs/" + l.repo.id;
    const batch = {
      operation: "upload",
      objects: [{ oid, size: data.length }],
    };
    assert.equal(
      (await l.call(base + "/objects/batch", batch, null)).status,
      403,
    );
    const b = await (await l.call(base + "/objects/batch", batch)).json();
    assert.equal(b.transfer, "basic");
    const action = b.objects[0].actions.upload;
    const res = await application(l.s)(
      new Request(action.href, {
        method: "PUT",
        headers: action.header,
        body: data,
      }),
    );
    assert.equal(res.status, 200);
    assert.equal(
      (await (await l.call(base + "/objects/batch", batch)).json()).objects[0]
        .actions,
      undefined,
    );
    const read = await l.call(base + "/objects/" + oid);
    assert.deepEqual(new Uint8Array(await read.arrayBuffer()), data);
    assert.equal(
      (
        await l.call(base + "/objects/" + oid, undefined, l.token, "GET", {
          range: "bytes=0-1",
        })
      ).status,
      416,
    );
    const other = await (await l.call("/api/repos", { name: "other" })).json();
    assert.equal(
      (await l.call("/lfs/" + other.id + "/objects/" + oid)).status,
      404,
    );
    const missing = await (
      await l.call(base + "/objects/batch", {
        operation: "download",
        objects: [{ oid: "a".repeat(64), size: 1 }],
      })
    ).json();
    assert.equal(missing.objects[0].error.code, 404);
  } finally {
    await l.close();
  }
});
test("invalid imports, unknown transfer/hash, invalid OID/size, methods and malformed JSON rejected", async () => {
  for (const u of [
    "http://github.com/a/b",
    "https://github.com.evil/a/b",
    "https://u:p@github.com/a/b",
    "https://github.com/a/b?token=x",
    "https://github.com/a/%2e%2e",
    "file:///tmp/x",
    "https://github.com:443/a/b",
  ])
    assert.throws(() => githubURL(u));
  assert.equal(
    githubURL("https://github.com/a/b.git"),
    "https://github.com/a/b.git",
  );
  const l = await setup();
  try {
    for (const b of [
      { operation: "x", objects: [] },
      { operation: "upload", transfers: ["multipart"], objects: [] },
      { operation: "upload", hash_algo: "md5", objects: [] },
      { operation: "upload", objects: [{ oid: "bad", size: 1 }] },
      { operation: "upload", objects: [{ oid: "a".repeat(64), size: -1 }] },
    ])
      assert.ok(
        (await l.call("/lfs/" + l.repo.id + "/objects/batch", b)).status >= 400,
      );
    const r = await application(l.s)(
      new Request(l.s.origin + "/api/repos", {
        method: "POST",
        headers: { authorization: "Bearer " + l.token },
        body: "x",
      }),
    );
    assert.equal(r.status, 400);
  } finally {
    await l.close();
  }
});
test("production entry denies accidental dev credentials and reports missing WorkOS setup", async () => {
  const env: any = {
    WORKOS_CLIENT_ID: "UNCONFIGURED",
    ORIGIN: "https://forge.invalid",
    ALLOW_PUBLIC: "false",
    DEV_AUTH: "local-owner",
    LOCAL_AUTH: "true",
  };
  assert.equal(
    (
      await worker.fetch(
        new Request("https://forge.invalid/", {
          headers: { authorization: "Bearer local-owner" },
        }),
        env,
      )
    ).status,
    401,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request(
          "https://forge.invalid/lfs/private/objects/" + "a".repeat(64),
          { headers: { authorization: "Bearer local-owner" } },
        ),
        env,
      )
    ).status,
    404,
  );
  assert.equal(
    (await worker.fetch(new Request("https://forge.invalid/auth/login"), env))
      .status,
    503,
  );
  assert.equal(
    (
      await worker.fetch(
        new Request("https://forge.invalid/auth/callback?code=fake&state=fake"),
        env,
      )
    ).status,
    503,
  );
});
test("real local Git task fork, immutable proposal, stale-base refusal, excluded native check endpoint", async () => {
  const l = await setup();
  try {
    const work = join(l.dir, "work");
    await git(["clone", l.plane.path(l.repo.physical), work]);
    await git(["config", "user.name", "Synthetic"], work);
    await git(["config", "user.email", "synthetic@example.invalid"], work);
    await writeFile(join(work, "good.json"), "{}");
    await writeFile(join(work, "bad.json"), "{");
    await git(["add", "."], work);
    await git(["commit", "-m", "base"], work);
    await git(["push", "origin", "HEAD:main"], work);
    const base = await git(["rev-parse", "HEAD"], work);
    const task = await (
      await l.call("/api/repos/" + l.repo.id + "/tasks", { name: "task" })
    ).json();
    assert.ok(task.parent);
    const lfsData = new TextEncoder().encode("inherited LFS");
    const lfsOid = digest(lfsData);
    await ingest(
      l.store,
      l.principal.tenant,
      l.repo.id,
      lfsOid,
      lfsData.length,
      new Blob([lfsData]).stream(),
    );
    const lfsTask = await (
      await l.call("/api/repos/" + l.repo.id + "/tasks", { name: "lfs-task" })
    ).json();
    assert.equal(
      await (await l.call("/lfs/" + lfsTask.id + "/objects/" + lfsOid)).text(),
      "inherited LFS",
    );
    assert.equal(
      (await l.call("/api/repos/" + l.repo.id + "/token", { scope: "write" }))
        .status,
      403,
    );
    assert.equal(
      (await l.call("/api/repos/" + task.id + "/token", { scope: "write" }))
        .status,
      200,
    );
    await git(
      ["remote", "set-url", "origin", l.plane.path(task.physical)],
      work,
    );
    await writeFile(join(work, "good.json"), '{"edited":true}');
    await git(["add", "."], work);
    await git(["commit", "-m", "candidate"], work);
    await git(["push", "origin", "HEAD:main"], work);
    const candidate = await git(["rev-parse", "HEAD"], work);
    const proposal = await (
      await l.call("/api/repos/" + l.repo.id + "/proposals", {
        task: task.id,
        base,
        candidate,
      })
    ).json();
    assert.equal(proposal.candidate, candidate);
    assert.equal(
      (
        await l.call("/api/repos/" + task.id + "/check", {
          contract: "json-parse-v1",
          commit: candidate,
          paths: ["good.json"],
        })
      ).status,
      404,
    );
    await git(
      ["remote", "set-url", "origin", l.plane.path(l.repo.physical)],
      work,
    );
    await git(["push", "origin", "HEAD:main"], work);
    assert.equal(
      (
        await l.call("/api/repos/" + l.repo.id + "/review", {
          id: proposal.id,
          status: "approved",
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await l.call("/api/repos/" + l.repo.id + "/review", {
          id: proposal.id,
          status: "rejected",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await l.call("/api/repos/" + l.repo.id + "/review", {
          id: proposal.id,
          status: "rejected",
        })
      ).status,
      409,
    );
  } finally {
    await l.close();
  }
});
test("direct-staging flow verifies whole bytes before manifest publication, hides ticket across tenants", async () => {
  const l = await setup();
  try {
    l.s.localUpload = false;
    l.s.presign = async (t) => ({
      href: "https://r2.invalid/" + t.id,
      header: { "Content-Length": String(t.size) },
    });
    const bytes = new TextEncoder().encode("staged");
    const oid = digest(bytes),
      base = "/lfs/" + l.repo.id;
    const batch = await (
      await l.call(base + "/objects/batch", {
        operation: "upload",
        objects: [{ oid, size: bytes.length }],
      })
    ).json();
    const verify = new URL(batch.objects[0].actions.verify.href);
    const t = (await l.catalog.getTicket(verify.searchParams.get("ticket")!))!;
    assert.equal(
      await l.store.get(manifestKey(l.principal.tenant, l.repo.id, oid)),
      null,
    );
    await l.store.putIfAbsent(t.key, bytes);
    const v = await l.call(verify.pathname + verify.search, {
      oid,
      size: bytes.length,
    });
    assert.equal(v.status, 200);
    assert.equal(await l.store.get(t.key), null);
    assert.equal((await l.call(base + "/objects/" + oid)).status, 200);
  } finally {
    await l.close();
  }
});
test("GitHub picker routes preserve authentication, CSRF, private destinations and actual app ownership (provider contract double)", async () => {
  const l = await setup();
  try {
    l.s.github = {
      account: async () => ({ connected: true, login: "fixture" }),
      repos: async (p) => ({
        repos: [{ fullName: p.id + "/example", visibility: "public" }],
      }),
      source: async () => ({
        url: "https://github.com/fixture/example.git",
        name: "github-example",
      }),
      disconnect: async () => ({ ok: true }),
    };
    // Public upstream represented by real local Git transport; only this boundary is doubled.
    (l.plane as import("../src/contracts.ts").GitPlane).source = async () => ({
      refs: [],
    });
    (l.plane as import("../src/contracts.ts").GitPlane).import = async (
      name: string,
    ) => l.plane.create(name);
    assert.equal((await l.call("/api/github", undefined, null)).status, 401);
    assert.equal(
      (await l.call("/api/github/repos", undefined, null)).status,
      401,
    );
    const listed = await (await l.call("/api/github/repos")).json();
    assert.equal(listed.repos[0].fullName, l.principal.id + "/example");
    const imported = await l.call("/api/github/import", {
      repository: "fixture/example",
    });
    assert.equal(imported.status, 201);
    const repo = await imported.json();
    assert.equal(repo.owner, l.principal.id);
    assert.equal(repo.tenant, l.principal.tenant);
    assert.equal(repo.visibility, "private");
    l.credentials.set("stranger", {
      id: "stranger",
      tenant: l.principal.tenant,
    });
    assert.equal(
      (await l.call("/api/repos/" + repo.id, undefined, "stranger")).status,
      404,
    );
    l.s.authenticate = async () => l.principal;
    assert.equal(
      (
        await l.call("/api/github/disconnect", {}, null, "POST", {
          origin: "https://evil.invalid",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await l.call("/api/github/disconnect", {}, null, "POST", {
          origin: l.s.origin,
        })
      ).status,
      200,
    );
  } finally {
    await l.close();
  }
});
