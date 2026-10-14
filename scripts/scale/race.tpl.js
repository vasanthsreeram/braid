const repo = "__REPO__", P = __PUSHED__;
const props = await B.pool(P.strands.filter((s) => s.ok), 8, async (s) => {
  const r = await B.api(`/api/repos/${repo}/proposals`, { task: s.id, base: P.base, candidate: s.candidate });
  await B.api(`/api/repos/${repo}/review`, { id: r.v.id, status: "approved" });
  return r.v.id;
});
await B.refresh();
const t0 = performance.now();
const res = await Promise.all(props.map((id) => B.api(`/api/repos/${repo}/merge`, { id }).then((r) => ({ s: r.status, m: r.v?.message, ms: Math.round(performance.now() - t0) }))));
const log = (await B.api(`/api/repos/${repo}/log?ref=HEAD`)).v;
const counts = res.reduce((m, r) => ((m[r.s + " " + (r.m ?? "ok")] = (m[r.s + " " + (r.m ?? "ok")] || 0) + 1), m), {});
return { racers: props.length, counts, wallMs: Math.max(...res.map((r) => r.ms)), headParentIsBase: log[0].parents?.[0] === P.base, head: log[0].message?.split("\n")[0] };
