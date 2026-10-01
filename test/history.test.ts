import test from "node:test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localServices, git } from "../scripts/local.ts";
import { application } from "../src/app.ts";
import { reachable } from "../src/history.ts";

test("real Git contribution history: every merge parent, UTC author dates, original identities, fork dedupe and revoked visibility", async () => {
  const dir = await mkdtemp(join(tmpdir(), "forge-history-")),
    l = await localServices(dir);
  l.credentials.set(l.token, {
    ...l.principal,
    email: "owner@example.invalid",
    emailVerified: true,
  });
  const call = (path: string, body?: unknown, token = l.token) =>
    application(l.s)(
      new Request(l.s.origin + path, {
        method: body ? "POST" : "GET",
        headers: { authorization: "Bearer " + token },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
    );
  try {
    const repo: any = await (
      await call("/api/repos", { name: "real-history" })
    ).json();
    const work = join(dir, "work");
    await git(["clone", l.plane.path(repo.physical), work]);
    await git(["-C", work, "config", "user.name", "Original Author"]);
    await git(["-C", work, "config", "user.email", "owner@example.invalid"]);
    const now = new Date().toISOString().slice(0, 10);
    const env = {
      ...process.env,
      GIT_AUTHOR_DATE: `${now}T01:00:00+0800`,
      GIT_COMMITTER_DATE: `${now}T02:00:00+0800`,
    };
    await writeFile(join(work, "readme"), "original");
    await git(["-C", work, "add", "."]);
    await promisify(execFile)(
      "git",
      [
        "-c",
        "core.hooksPath=/dev/null",
        "-C",
        work,
        "commit",
        "-m",
        "original timestamp",
      ],
      { env },
    );
    const original = await git(["-C", work, "rev-parse", "HEAD"]);
    await git(["-C", work, "checkout", "-b", "side"]);
    await writeFile(join(work, "side"), "side");
    await git(["-C", work, "add", "."]);
    await git(["-C", work, "commit", "-m", "side parent"]);
    await git(["-C", work, "checkout", "main"]);
    await writeFile(join(work, "main"), "main");
    await git(["-C", work, "add", "."]);
    await git([
      "-C",
      work,
      "-c",
      "user.email=other@example.invalid",
      "commit",
      "-m",
      "other author",
    ]);
    await git([
      "-C",
      work,
      "merge",
      "--no-ff",
      "side",
      "-m",
      "merge both parents",
    ]);
    await git(["-C", work, "push", "origin", "main", "side"]);
    const fork: any = await (
      await call(`/api/repos/${repo.id}/tasks`, { name: "history-fork" })
    ).json();
    const copy: any = await (
      await call("/api/repos", { name: "independent-history-copy" })
    ).json();
    await git([
      "-C",
      work,
      "push",
      l.plane.path(copy.physical),
      "main",
      "side",
    ]);
    // A separate canonical copy models repeated import of identical persisted objects.
    assert.equal(
      await git([
        "--git-dir",
        l.plane.path(copy.physical),
        "rev-parse",
        "main~2",
      ]),
      original,
    );
    const p: any = await (await call("/api/profile")).json();
    assert.equal(p.total, 3);
    assert.equal(p.incomplete, false);
    assert.equal(
      p.days.reduce((n: number, d: any) => n + d.count, 0),
      3,
    );
    assert.equal(
      p.activity.find((c: any) => c.sha === original).repositories.length,
      3,
    );
    const c: any = await (
      await call(`/api/repos/${repo.id}/commit?sha=${original}`)
    ).json();
    assert.equal(c.authoredAt, Date.parse(env.GIT_AUTHOR_DATE) / 1000);
    assert.equal(c.committedAt, Date.parse(env.GIT_COMMITTER_DATE) / 1000);
    assert.equal(c.author.email, "owner@example.invalid");
    assert.equal(c.sha, original);
    assert.equal(
      p.days.find(
        (d: any) =>
          d.date === new Date(c.authoredAt * 1000).toISOString().slice(0, 10),
      ).count,
      1,
    );
    assert.equal((await reachable(l.plane, repo, 1)).incomplete, true);
    l.credentials.set("guest", {
      id: "guest",
      tenant: l.principal.tenant,
      email: "owner@example.invalid",
      emailVerified: true,
    });
    assert.equal((await call("/api/profile", undefined, "")).status, 401);
    const guest: any = await (
      await call("/api/profile", undefined, "guest")
    ).json();
    assert.equal(guest.total, 0);
    assert.deepEqual(guest.activity, []);
    await l.catalog.grant(repo.id, "guest", "reader");
    const shared: any = await (
      await call("/api/profile", undefined, "guest")
    ).json();
    assert.equal(shared.total, 3);
    assert.ok(
      shared.activity.every((c: any) =>
        c.repositories.every((r: any) => r.id !== fork.id),
      ),
    );
    await l.catalog.grant(repo.id, "guest", null);
    assert.equal(
      (
        await call(
          `/api/repos/${repo.id}/commit?sha=${original}`,
          undefined,
          "guest",
        )
      ).status,
      404,
    );
    assert.equal(
      ((await (await call("/api/profile", undefined, "guest")).json()) as any)
        .total,
      0,
    );
    l.credentials.set("unverified", {
      id: l.principal.id,
      tenant: l.principal.tenant,
      email: "owner@example.invalid",
      emailVerified: false,
    });
    assert.equal(
      (
        (await (
          await call("/api/profile", undefined, "unverified")
        ).json()) as any
      ).total,
      0,
    );
  } finally {
    l.db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
