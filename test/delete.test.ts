import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localServices } from "../scripts/local.ts";
import { application } from "../src/app.ts";

test("delete repository: admin-only, name-confirmed, strands first, removes catalog row and storage", async () => {
  const dir = await mkdtemp(join(tmpdir(), "forge-delete-")),
    l = await localServices(dir);
  const call = (path: string, method = "GET", body?: any, token = l.token) =>
    application(l.s)(
      new Request(l.s.origin + path, {
        method,
        headers: { authorization: "Bearer " + token },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  try {
    const repo = await (await call("/api/repos", "POST", { name: "doomed" })).json();
    const prefix = "/api/repos/" + repo.id;
    const task = await (await call(prefix + "/tasks", "POST", { name: "strand-one" })).json();
    // Wrong confirmation, then refusal while a strand exists.
    assert.equal((await call(prefix, "DELETE", { confirm: "nope" })).status, 400);
    assert.equal((await call(prefix, "DELETE", { confirm: "doomed" })).status, 409);
    // An outsider cannot delete.
    l.credentials.set("outsider", { id: "outsider", tenant: "outsider", email: "o@example.invalid", emailVerified: true });
    assert.equal((await call(prefix, "DELETE", { confirm: "doomed" }, "outsider")).status, 404);
    // Delete the strand, then the repository.
    assert.equal((await call("/api/repos/" + task.id, "DELETE", { confirm: "strand-one" })).status, 200);
    const done = await call(prefix, "DELETE", { confirm: "doomed" });
    assert.equal(done.status, 200);
    assert.equal((await call(prefix)).status, 404);
    await assert.rejects(stat(l.plane.path(repo.physical)));
    const listed = (await (await call("/api/repos")).json()).repos;
    assert.ok(!listed.some((r: any) => r.id === repo.id || r.id === task.id));
  } finally {
    l.db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
