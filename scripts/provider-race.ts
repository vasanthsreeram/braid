import { publishHTTP } from "../src/git-http.ts";
let raw = "";
for await (const c of process.stdin) raw += c;
const v = JSON.parse(raw);
raw = "";
let arrivals = 0,
  release: () => void;
const ready = new Promise<void>((r) => {
  release = r;
});
const request: typeof fetch = async (url, init) => {
  if (String(url).endsWith("git-upload-pack")) {
    if (++arrivals === 2) release();
    await ready;
  }
  return fetch(url, init);
};
const outcomes = await Promise.allSettled(
  v.candidates.map((candidate: string) =>
    publishHTTP(v.source, v.target, v.ref, v.base, candidate, request),
  ),
);
console.log(
  JSON.stringify(
    outcomes.map((r, i) =>
      r.status === "fulfilled"
        ? { ok: true, candidate: v.candidates[i], result: r.value }
        : {
            ok: false,
            candidate: v.candidates[i],
            status: r.reason.status,
            message: r.reason.message,
          },
    ),
  ),
);
if (outcomes.filter((r) => r.status === "fulfilled").length !== 1)
  process.exitCode = 1;
