import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { localServices, git } from "../scripts/local.ts";
import { ReviewCoordinator } from "../src/review-coordinator.ts";
import { Collaboration } from "../src/issues.ts";
import type { Env } from "../src/worker.ts";
test("coordinator provider contract doubles: queue/dedupe, owner-opted publication, cited issue idempotency, ACL revocation, cancel, retry and interrupted recovery", async () => {
  const dir = await mkdtemp(join(tmpdir(), "coordinator-")),
    l = await localServices(dir),
    db = new DatabaseSync(":memory:");
  const originalFetch = globalThis.fetch;
  try {
    const repo = {
      id: "coordinator-private",
      physical: "coordinator-source",
      name: "coordinator-source",
      tenant: l.principal.tenant,
      owner: l.principal.id,
      visibility: "private" as const,
      state: "ready" as const,
      parent: null,
    };
    await l.catalog.create(repo);
    await l.plane.create(repo.physical);
    const work = join(dir, "work");
    await git(["clone", l.plane.path(repo.physical), work]);
    await git(["config", "user.name", "Local fixture author"], work);
    await git(["config", "user.email", "fixture@example.invalid"], work);
    await writeFile(join(work, "review.ts"), "export const value = 1;\n");
    await git(["add", "."], work);
    await git(["commit", "-m", "Local fixture"], work);
    await git(["push", "origin", "HEAD:main"], work);
    const sha = await git(["rev-parse", "HEAD"], work),
      before = await l.plane.refs(repo.physical),
      actor = { ...l.principal, session: "fixture-session" };
    let sessionActive = true;
    globalThis.fetch = async (input) => {
      const path = new URL(String(input)).pathname;
      if (path.includes("/sessions"))
        return Response.json({
          data: [
            {
              id: actor.session,
              user_id: actor.id,
              status: sessionActive ? "active" : "revoked",
              organization_id: actor.tenant,
            },
          ],
        });
      if (path.includes("organization_memberships"))
        return Response.json({
          data: [
            {
              user_id: actor.id,
              organization_id: actor.tenant,
              status: "active",
            },
          ],
        });
      throw Error("Unexpected outbound URL");
    };
    const sql = {
      exec(query: string, ...bindings: any[]) {
        const s = db.prepare(query);
        if (query.trim().startsWith("SELECT") || query.includes("RETURNING"))
          return { toArray: () => s.all(...bindings) };
        s.run(...bindings);
        return { toArray: () => [] };
      },
    };
    let alarm = 0,
      modelCalls = 0,
      mode = "success",
      release: (v: any) => void = () => {};
    let entered: () => void = () => {};
    const env = {
      WORKOS_API_KEY: "explicit-provider-contract-double",
      DB: l.s.collaboration!.db,
      ARTIFACTS: {
        get: async (name: string) => ({
          [Symbol.dispose]() {},
          readCommit: async (s: string) => {
            const c = await l.plane.commit(name, s);
            return c ? { ...c, hash: c.sha, treeHash: c.tree } : null;
          },
          readTree: (s: string) => l.plane.tree(name, s),
          readFile: ({ ref, path }: any) => l.plane.file(name, ref, path),
        }),
      },
      AI: {
        run: async () => {
          modelCalls++;
          if (mode === "remote-revoke") sessionActive = false;
          if (mode === "failure") throw Error("Provider contract failure");
          if (mode === "waiting") {
            entered();
            return new Promise((r) => {
              release = r;
            });
          }
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    findings: [
                      {
                        title: "Contract finding",
                        path: "review.ts",
                        start: 1,
                        end: 1,
                        evidence: "export const value = 1;",
                        explanation:
                          "Explicit provider contract double, not a genuine live defect",
                        sha,
                        severity: "low",
                      },
                    ],
                  }),
                },
              },
            ],
          };
        },
      },
      REVIEWS: {
        idFromName: (n: string) => n,
        get: () => ({ fetch: async () => Response.json({ requests: 1 }) }),
      },
    } as unknown as Env;
    const coordinator = new ReviewCoordinator(
      {
        storage: {
          sql,
          setAlarm: async (n: number) => {
            alarm = n;
          },
          deleteAlarm: async () => {
            alarm = 0;
          },
        },
      } as any,
      env,
    );
    const request = (body: any) =>
      coordinator.fetch(
        new Request("https://internal/request", {
          method: "POST",
          body: JSON.stringify({ repo, actor, body }),
        }),
      );
    const read = (id: string) =>
      coordinator.fetch(
        new Request("https://internal/get", {
          method: "POST",
          body: JSON.stringify({ job: id }),
        }),
      );
    const scope = { sha, paths: ["review.ts"] };
    const first = (await (await request(scope)).json()) as any;
    assert.equal(first.status, "queued");
    assert.ok(alarm > 0);
    assert.equal(((await (await request(scope)).json()) as any).id, first.id);
    await l.s.collaboration!.setPolicy(repo.id, actor.id, true);
    await coordinator.alarm();
    const complete = (await (await read(first.id)).json()) as any;
    assert.equal(complete.status, "completed");
    assert.deepEqual(complete.published, [1]);
    assert.equal(modelCalls, 1);
    assert.deepEqual(await l.plane.refs(repo.physical), before);
    assert.equal(
      (await l.s.collaboration!.detail(repo.id, 1)).issue.finding !== null,
      true,
    );
    assert.equal(((await (await request(scope)).json()) as any).id, first.id);
    // New scope by explicit base: failing provider, then explicit retry reuses cited
    // finding key. No uncertain automatic provider retry occurs.
    mode = "failure";
    const second = (await (
      await request({ ...scope, base: sha })
    ).json()) as any;
    await coordinator.alarm();
    assert.equal(
      ((await (await read(second.id)).json()) as any).status,
      "failed",
    );
    assert.equal(modelCalls, 2);
    mode = "success";
    const retry = (await (
      await request({ ...scope, base: sha, retry: true })
    ).json()) as any;
    assert.notEqual(retry.id, second.id);
    await coordinator.alarm();
    assert.deepEqual(((await (await read(retry.id)).json()) as any).published, [
      1,
    ]);
    assert.equal((await l.s.collaboration!.list(repo.id, "", "")).length, 1);
    // Force a distinct cancelled job through a failed prior row, keeping production
    // request/retry code intact. These are local storage/provider fault injections.
    sql.exec("UPDATE jobs SET status=? WHERE id=?", "failed", first.id);
    mode = "waiting";
    const cancelJob = (await (
      await request({ ...scope, retry: true })
    ).json()) as any;
    const started = new Promise<void>((r) => {
      entered = r;
    });
    const running = coordinator.alarm();
    await started;
    const cancel = await coordinator.fetch(
      new Request("https://internal/cancel", {
        method: "POST",
        body: JSON.stringify({ job: cancelJob.id, actor }),
      }),
    );
    assert.equal(((await cancel.json()) as any).status, "cancelled");
    release({ choices: [{ message: { content: '{"findings":[]}' } }] });
    await running;
    assert.equal(
      ((await (await read(cancelJob.id)).json()) as any).status,
      "cancelled",
    );
    assert.equal((await l.s.collaboration!.list(repo.id, "", "")).length, 1);
    // External WorkOS revocation while inference runs prevents publication.
    sql.exec("UPDATE jobs SET status=? WHERE id=?", "failed", retry.id);
    mode = "remote-revoke";
    const external = (await (
      await request({ ...scope, base: sha, retry: true })
    ).json()) as any;
    const priorCalls = modelCalls;
    await coordinator.alarm();
    assert.equal(modelCalls, priorCalls + 1);
    assert.equal(
      ((await (await read(external.id)).json()) as any).status,
      "failed",
    );
    assert.match(
      ((await (await read(external.id)).json()) as any).error,
      /Session inactive/,
    );
    sessionActive = true;
    // Revoking owner session after admission prevents dispatch.
    const revoked = (await (
      await request({
        ...scope,
        base: sha,
        paths: ["review.ts", "missing.ts"],
        retry: true,
      })
    ).json()) as any;
    sql.exec(
      "UPDATE jobs SET status=?,data=? WHERE id=?",
      "queued",
      JSON.stringify({ ...revoked, status: "queued" }),
      revoked.id,
    );
    await l.s
      .collaboration!.db.prepare("INSERT INTO revoked_sessions VALUES (?,?)")
      .bind(actor.session, Date.now())
      .run();
    const callsBefore = modelCalls;
    await coordinator.alarm();
    assert.equal(modelCalls, callsBefore);
    assert.equal(
      ((await (await read(revoked.id)).json()) as any).status,
      "failed",
    );
    sql.exec("UPDATE jobs SET status=? WHERE id=?", "running", revoked.id);
    await coordinator.alarm();
    assert.equal(
      ((await (await read(revoked.id)).json()) as any).status,
      "interrupted",
    );
    assert.equal(modelCalls, callsBefore);
  } finally {
    globalThis.fetch = originalFetch;
    db.close();
    l.db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
