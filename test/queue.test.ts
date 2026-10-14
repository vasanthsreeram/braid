import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, outsideScope, queueView, QUEUE, type QueueEntry } from "../src/queue.ts";

const H = "a".repeat(40),
  OLD = "b".repeat(40);
const entry = (o: Partial<QueueEntry> = {}): QueueEntry => ({
  proposal: "p1",
  run: "r1",
  mode: "auto",
  actor: { id: "u", tenant: "u", name: "Vas", session: "s" },
  queued: 0,
  state: "waiting",
  ...o,
});
const proposal = (o: any = {}) => ({ id: "p1", repo: "x", task: "t", base: H, candidate: "c".repeat(40), author: "u", status: "open", ...o });
const ctx = (o: any = {}) => ({ proposal: proposal(), run: { status: "proposed", proposal: "p1" }, head: H, braided: false, now: 1e9, ...o });

test("queue: fresh proposals braid (approving open ones); stale ones catch up first", () => {
  assert.deepEqual(decide(entry(), ctx()), { do: "braid", approve: true });
  assert.deepEqual(decide(entry(), ctx({ proposal: proposal({ status: "approved" }) })), { do: "braid", approve: false });
  assert.deepEqual(decide(entry(), ctx({ proposal: proposal({ base: OLD }) })), { do: "catch_up" });
  // No agent behind it: the queue rebases it itself.
  assert.deepEqual(decide(entry({ run: undefined }), ctx({ run: undefined, proposal: proposal({ base: OLD }) })), { do: "rebase" });
});

test("queue: waits for a running catch-up, then follows the new proposal", () => {
  assert.deepEqual(decide(entry(), ctx({ run: { status: "catching_up", proposal: "p1" } })), { do: "wait" });
  // Kicked but the run's row has not changed yet: wait, then re-kick after kickMs.
  const kicked = entry({ state: "catching_up", kicked: 1e9 - 1000 });
  assert.deepEqual(decide(kicked, ctx({ proposal: proposal({ base: OLD }) })), { do: "wait" });
  assert.deepEqual(
    decide(kicked, ctx({ proposal: proposal({ base: OLD }), now: 1e9 + QUEUE.kickMs })),
    { do: "catch_up" },
  );
  assert.deepEqual(decide(entry(), ctx({ run: { status: "proposed", proposal: "p2" } })), { do: "follow", proposal: "p2" });
});

test("queue: holds anything that needs a person", () => {
  const held = (s: any) => assert.equal(s.do === "done" && s.outcome, "held");
  held(decide(entry(), ctx({ run: { status: "proposed", proposal: "p2", conflicts: true } })));
  held(decide(entry(), ctx({ run: { status: "proposed", proposal: "p1", conflicts: true } })));
  held(decide(entry(), ctx({ run: { status: "failed", proposal: "p1", error: "boom" } })));
  // An approved entry whose agent resolved conflicts before queuing: the person saw that diff.
  assert.deepEqual(decide(entry({ mode: "approved" }), ctx({ run: { status: "proposed", proposal: "p1", conflicts: true } })), {
    do: "braid",
    approve: true,
  });
  assert.equal((decide(entry(), ctx({ braided: true })) as any).outcome, "braided");
  assert.equal((decide(entry(), ctx({ proposal: proposal({ status: "rejected" }) })) as any).outcome, "dropped");
  assert.equal((decide(entry(), ctx({ proposal: undefined })) as any).outcome, "dropped");
});

test("queue: auto mode stays inside the planner's files; the view hides principals", () => {
  assert.deepEqual(outsideScope(["docs/install.md"], ["docs/install.md"]), []);
  assert.deepEqual(outsideScope(["docs/a/b.md"], ["docs/a/"]), []);
  assert.deepEqual(outsideScope(["docs/install.md", "README.md"], ["docs/install.md"]), ["README.md"]);
  assert.deepEqual(outsideScope(["anything"], []), []);
  const v = queueView([entry()], []);
  assert.equal(v.entries[0].position, 1);
  assert.equal(v.entries[0].by, "Vas");
  assert.ok(!JSON.stringify(v).includes('"session"'));
});
