import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { application } from "../src/app.ts";
import { localServices, git } from "../scripts/local.ts";

test("strands endpoint maps task forks, proposals and braids; read-only and access-scoped", async () => {
  const dir = await mkdtemp(join(tmpdir(), "cf-native-forge-strands-"));
  const l = await localServices(dir, "http://127.0.0.1:8787");
  const app = application(l.s);
  const call = (path: string, body?: unknown, token: string | null = l.token) =>
    app(
      new Request(l.s.origin + path, {
        method: body ? "POST" : "GET",
        headers: token ? { authorization: "Bearer " + token } : {},
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    );
  const json = async (path: string, body?: unknown) => {
    const r = await call(path, body);
    assert.ok(r.ok, path + " " + r.status);
    return r.json();
  };
  try {
    const repo = await json("/api/repos", { name: "woven" });
    assert.deepEqual(await json(`/api/repos/${repo.id}/strands`), []);

    const seed = join(dir, "seed");
    await git(["clone", l.plane.path(repo.physical), seed]);
    await git(["config", "user.name", "Synthetic"], seed);
    await git(["config", "user.email", "synthetic@example.invalid"], seed);
    await writeFile(join(seed, "a.txt"), "a\n");
    await git(["add", "."], seed);
    await git(["commit", "-m", "base"], seed);
    await git(["push", "origin", "HEAD:main"], seed);
    const base = await git(["rev-parse", "HEAD"], seed);

    const push = async (task: any, file: string) => {
      const work = join(dir, task.name);
      await git(["clone", l.plane.path(task.physical), work]);
      await git(["config", "user.name", "Synthetic"], work);
      await git(["config", "user.email", "synthetic@example.invalid"], work);
      await writeFile(join(work, file), file + "\n");
      await git(["add", "."], work);
      await git(["commit", "-m", "work on " + file], work);
      await git(["push", "origin", "HEAD:main"], work);
      return git(["rev-parse", "HEAD"], work);
    };
    const tasks: any = {};
    tasks.braided = await json(`/api/repos/${repo.id}/tasks`, { name: "braided" });
    const braidedTip = await push(tasks.braided, "b.txt");
    const p1 = await json(`/api/repos/${repo.id}/proposals`, {
      task: tasks.braided.id,
      base,
      candidate: braidedTip,
    });
    await json(`/api/repos/${repo.id}/review`, { id: p1.id, status: "approved" });
    await json(`/api/repos/${repo.id}/merge`, { id: p1.id });
    for (const name of ["proposed", "working"])
      tasks[name] = await json(`/api/repos/${repo.id}/tasks`, { name });
    const proposedTip = await push(tasks.proposed, "c.txt");
    await json(`/api/repos/${repo.id}/proposals`, {
      task: tasks.proposed.id,
      base: braidedTip,
      candidate: proposedTip,
    });

    const list = await json(`/api/repos/${repo.id}/strands`);
    assert.deepEqual(
      list.map((s: any) => s.name),
      ["braided", "proposed", "working"],
    );
    const [braided, proposed, working] = list;
    assert.equal(braided.proposals.length, 1);
    assert.equal(braided.proposals[0].braided, true);
    assert.equal(braided.proposals[0].base, base);
    assert.equal(typeof braided.proposals[0].braidedAt, "number");
    assert.equal(braided.base, base);
    assert.equal(proposed.proposals[0].status, "open");
    assert.equal(proposed.proposals[0].braided, false);
    assert.equal(proposed.tip, proposedTip);
    assert.equal(proposed.ahead, 1);
    assert.equal(proposed.base, braidedTip);
    assert.deepEqual(working.proposals, []);
    assert.equal(working.base, braidedTip);
    assert.equal(working.ahead, 0);

    // Task forks never list strands of their own.
    assert.deepEqual(await json(`/api/repos/${tasks.working.id}/strands`), []);

    // Strangers and anonymous callers learn nothing; readers see proposals but
    // not the names of forks they cannot open.
    l.credentials.set("stranger", { id: "stranger", tenant: l.principal.tenant });
    l.credentials.set("guest", { id: "guest", tenant: l.principal.tenant });
    for (const token of ["stranger", null])
      assert.equal(
        (await call(`/api/repos/${repo.id}/strands`, undefined, token)).status,
        404,
      );
    await json(`/api/repos/${repo.id}/grants`, { user: "guest", role: "reader" });
    const seen = await (
      await call(`/api/repos/${repo.id}/strands`, undefined, "guest")
    ).json();
    assert.equal(seen.length, 2);
    assert.ok(seen.every((s: any) => s.name === null && !s.tip));
    // Read-only: no POST surface.
    assert.equal(
      (await call(`/api/repos/${repo.id}/strands`, { name: "x" })).status,
      404,
    );
  } finally {
    l.db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
