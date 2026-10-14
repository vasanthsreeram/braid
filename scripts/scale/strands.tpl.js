const repo = "__REPO__", n = __N__, prefix = "__PREFIX__";
const t0 = performance.now();
const made = await B.pool(Array.from({ length: n }, (_, i) => i), 8, async (i) => {
  const s = performance.now();
  const t = await B.api(`/api/repos/${repo}/tasks`, { name: `${prefix}-${i}` });
  if (t.status !== 201 && t.status !== 200) return { i, err: t };
  const ms = performance.now() - s;
  return { i, id: t.v.id, name: t.v.name, createMs: Math.round(ms) };
});
const tokens = await B.pool(made.filter((m) => m.id), 8, async (m) => {
  const k = await B.api(`/api/repos/${m.id}/token`, { scope: "write" });
  return { ...m, remote: k.v.remote, token: k.v.plaintext };
});
return { totalMs: Math.round(performance.now() - t0), strands: tokens, errors: made.filter((m) => !m.id) };
