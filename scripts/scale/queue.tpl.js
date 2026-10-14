// Propose every pushed strand on the same base, then queue them all and wait until the queue is empty.
const repo = "__REPO__", P = __PUSHED__;
const t0 = performance.now();
const props = await B.pool(P.strands.filter((s) => s.ok), 8, async (s) => {
  const r = await B.api(`/api/repos/${repo}/proposals`, { task: s.id, base: P.base, candidate: s.candidate });
  return { ...s, proposal: r.v?.id, status: r.status };
});
const tProposed = performance.now();
const q0 = performance.now();
const enqueueFail = [];
for (const p of props.filter((p) => p.proposal)) {
  let r = await B.api(`/api/repos/${repo}/queue`, { proposal: p.proposal });
  if (r.status !== 202) { enqueueFail.push([p.name, r.status, r.v?.message]); r = await B.api(`/api/repos/${repo}/queue`, { proposal: p.proposal }); }
}
const tQueued = performance.now();
const ids = new Set(props.map((p) => p.task));
let q, polls = 0;
const deadline = performance.now() + __WAIT__ * 1000;
do {
  await new Promise((r) => setTimeout(r, 2000));
  q = (await B.api(`/api/repos/${repo}/queue`)).v;
  polls++;
} while (q.entries.length && performance.now() < deadline);
const tDone = performance.now();
const log = (await B.api(`/api/repos/${repo}/log?ref=HEAD`)).v;
// Every strand's file must be in the final tree (the queue log only keeps 50 outcomes).
const c = (await B.api(`/api/repos/${repo}/commit?sha=${log[0].sha}`)).v;
const rootTree = (await B.api(`/api/repos/${repo}/tree?sha=${c.tree ?? c.treeHash ?? log[0].tree}`)).v;
const scale = rootTree.find((e) => e.name === "scale");
const files = new Set(((await B.api(`/api/repos/${repo}/tree?sha=${scale.hash}`)).v).map((e) => e.name));
const missing = props.filter((p) => p.proposal && !files.has(p.name + ".txt")).map((p) => p.name);
return {
  proposed: props.filter((p) => p.proposal).length,
  proposeMs: Math.round(tProposed - t0),
  queueMs: Math.round(tQueued - q0),
  drainMs: Math.round(tDone - tQueued),
  left: q.entries.length,
  outcomes: q.recent.reduce((m, o) => ((m[o.outcome] = (m[o.outcome] || 0) + 1), m), {}),
  held: q.recent.filter((o) => o.outcome !== "braided").map((o) => o.note).slice(0, 5),
  waited: q.recent.filter((o) => o.waited).map((o) => o.waited),
  head: log.slice(0, 3).map((c) => c.message?.split("\n")[0]),
  linear: log.every((c) => (c.parents?.length ?? 1) <= 1),
  filesAtHead: files.size,
  enqueueFail,
  missing,
};
