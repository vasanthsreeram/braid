import { readFile, writeFile } from "node:fs/promises";
const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "Usage: tsx scripts/report-comparison-v2.ts\nReads v2 raw JSON/independent verification and writes only docs/benchmarks/gitflare-comparison-v2.md.",
  );
  process.exit(0);
}
if (args.length) throw Error("No report options supported");
const raw = JSON.parse(
  await readFile("docs/benchmarks/raw/gitflare-comparison-v2.json", "utf8"),
);
const validation = JSON.parse(
  await readFile(
    "docs/benchmarks/raw/gitflare-comparison-v2-verification.json",
    "utf8",
  ),
);
if (raw.status !== "passed" || !validation.passed)
  throw Error("Successful measurement and verification required");
const backends = ["bare-git", "gitflare-harness-http", "github"];
const sum = (a: any[], k: string) =>
  a.reduce((n, x) => n + Number(x[k] ?? 0), 0);
const f = (n: number) => n.toFixed(2);
function summary(backend: string, operation: string) {
  const a = raw.measurements
    .filter((r: any) => r.backend === backend && r.operation === operation)
    .map((r: any) => r.wallMs)
    .sort((a: number, b: number) => a - b);
  if (!a.length) return null;
  return {
    n: a.length,
    p50:
      a.length % 2
        ? a[Math.floor(a.length / 2)]
        : (a[a.length / 2 - 1] + a[a.length / 2]) / 2,
    p95: a[Math.ceil(a.length * 0.95) - 1],
    min: a[0],
    max: a.at(-1),
  };
}
function table(operations: string[], selected = backends) {
  let text =
    "| Path | Phase | N | p50 ms | p95 ms | Min–max ms |\n|---|---|---:|---:|---:|---:|\n";
  for (const backend of selected)
    for (const op of operations) {
      const s = summary(backend, op);
      if (!s) continue;
      text += `| ${backend} | ${op} | ${s.n} | ${f(s.p50)} | ${f(s.p95)} | ${f(s.min)}–${f(s.max)} |\n`;
    }
  return text;
}
const events = raw.serverRuns.flatMap((s: any) => s.events);
const transport = events.filter(
  (e: any) => String(e.path).startsWith("/git/") && e.status === 200,
);
const api = events.filter((e: any) => String(e.path).startsWith("/api/"));
const checks = events.filter(
  (e: any) => e.path === "/internal-app-policy/token",
);
let text = `# Actual local Gitflare comparison v2

Measured ${raw.startedAt}–${raw.completedAt} UTC on ${raw.environment.cpu}, ${raw.environment.platform} ${raw.environment.os} ${raw.environment.arch}, ${raw.environment.node}, ${raw.environment.git}; user environment Singapore. Source was clean at \`29b9083\`. Source and dedicated GitHub benchmark repository were private before/after writes. No deployed Gitflare, Artifacts Git, or WorkOS login timing is claimed.

**The unmodified local app has no ordinary Git transport.** Its read-token API returns a bare filesystem path with no credential; its HTTP Git route returns 404. Canonical write issuance returns 403: “Canonical write capabilities are withheld; use a task fork”. A native end-to-end Git client iteration is therefore **unmeasured/unavailable**, not silently replaced with a bare-path clone. This report measures the real native control plane and separately a benchmark-only authenticated HTTP task workflow built around that control plane and its real LocalGit adapter.

[Raw JSON](raw/gitflare-comparison-v2.json), [CSV](raw/gitflare-comparison-v2.csv), [validation](raw/validation-v2.json), [independent verification](raw/gitflare-comparison-v2-verification.json), [OAuth read-only probes](raw/cloudflare-oauth-readonly-v2.json), [Worker rejection rerun](raw/worker-auth-smoke-v2.json). Previous v1 files remain unchanged. An earlier [owner-only pilot](raw/pilot/gitflare-comparison-v2-owner-pilot.json) is retained but excluded: the final harness binds each capability to its issuing identity and rechecks revocation. The two-repetition local development pilot remains in ignored .tmp.

Median edit-through-checkout: bare Git ${f(summary("bare-git", "workflow-edit-through-checkout")!.p50)} ms; app-backed HTTP harness ${f(summary("gitflare-harness-http", "workflow-edit-through-checkout")!.p50)} ms; private GitHub ${f(summary("github", "workflow-edit-through-checkout")!.p50)} ms. The local/network difference and extra policy/HTTP boundaries are explicit; this establishes no deployed Cloudflare performance result.

## Boundaries exercised

| Path/operation | Actual boundaries | Limits |
|---|---|---|
| Native create/list/open/read-token/canonical denial/task fork | Node loopback HTTP → existing ephemeral local identity authenticator → application auth/tenant/role policy → SQLite catalog → original LocalGit create/info/token/fork | Local adapter, filesystem storage; no WorkOS, Artifacts, Workers request runtime or remote DB |
| Native log/tree/file | Same real app authorization → original LocalGit subprocess → actual response consumed and checked | Underlying app operations unchanged by wrapper; text file ≤1 MiB |
| bare-git clone/push/fetch | Git client → direct private filesystem bare Git | Internal Git data plane; bypasses every forge application/auth/HTTP boundary |
| gitflare-harness-http clone/push/fetch/ref check | Git client → loopback HTTP → repo/scope/60s capability check → existing app token route with **issuing identity** for current ACL/canonical policy → git http-backend → LocalGit's actual bare storage | Benchmark scripts only; info/token wrapped to issue HTTP capabilities; not a shipped product transport or deployed dev auth |
| github clone/push/fetch/ref check | Git client → existing keyring credential helper → HTTPS → private GitHub normal Git | Network/provider auth included in Git command time; provider internals/location/cache/storage metering unknown |
| fixture building and post-run verification | Local fixture Git, client file hashing, and read-only original-app reopening | Outside provider traffic comparison; these inspections are explicit internal-plane reads |

Every app repetition creates an empty private canonical repo via API, verifies listing/opening and denied canonical write, then creates an empty private task through the task-fork API. The fixture baseline is pushed **through authorized HTTP into the task**, with no internal filesystem seeding. Canonical remains empty: canonical publication/integration is unavailable here. Every measured harness client remote is HTTP, with no stored credentials or filesystem fallback. Client bodies/refs/history and application file/log/tree results were verified; transport events demonstrate receive-pack/upload-pack and one app policy check per accepted Git HTTP request. The test also checks scope, wrong repo, invalid credential, Host rejection, real push/clone, reader-grant revocation, and identity revocation. Harness code is absent from the production Worker dependency graph.

## Workload and timing semantics

Five repetitions per backend; three sequential deterministic edits per repetition (${raw.trials.length} accepted iterations). Fixture seed ${raw.seed}: 256 synthetic TypeScript files + README, ${sum(raw.fixture, "bytes")} source-file bytes plus README. The same four commits as v1 are used on every path:

${raw.commits.map((s: string) => "- `" + s + "`").join("\n")}

Compression 6; full-history single-branch clone, full checkout, --no-local, no depth/filter/partial clones. Every iteration checks all 257 tracked file SHA256 values, clean worktree, exact HEAD and remote ref, and full history length. Dedicated refs are \`bench-v2-${raw.runId}-<rep>\`, retained privately; source repo data is never used as a fixture. The GitHub benchmark repo is reused, never created/publicized by v2. No LFS uploads/Actions/model calls or billing allocation.

Seeded Fisher-Yates pairs backend blocks within each repetition: ${raw.orders.map((o: string[]) => o.join(" → ")).join("; ")}. Backend blocks run sequentially with two clients. Tests/LFS workloads did not run concurrently with the final benchmark. Normal background load is uncontrolled. “Cold client” means a fresh destination/full history/full checkout; OS/page/provider caches are uncontrolled and GitHub may already hold all fixture objects from v1/pilots. Warm fetch follows the preceding clone/push. These are **not provider-cold timings**.

Two direct stopwatches exist per iteration; neither is a sum of unrelated medians:

- \`workflow-edit-through-checkout\`: actual file write → git add → deterministic commit → push → another client's fetch → full checkout. Git HTTP policy/auth is included; harness token issuance happens just before this stopwatch.
- \`complete-verified-iteration\`: token refresh (two real API calls for harness) → the whole workflow → all-body/history verification → authenticated remote-ref query → app open/log/tree/file + response-integrity checks for harness. Bare Git/GitHub include the same body/history/ref verification, with no invented forge browsing calls. Additional app work makes these totals intentionally asymmetric.

Clone timings include full checkout but exclude subsequent hash verification. Setup timing covers app identity/creation/listing/native probes/task creation/credentials/seed/two verified clones for harness; direct bare setup creates a bare repo, while GitHub uses an existing repo. It is not a symmetric provider-provisioning comparison. GitHub private metadata checks are separate measured gh commands; Git credential-helper/auth costs are included in Git times.

Milliseconds; p50 median, p95 nearest rank. N=5 clones/setup and N=15 edit phases; three edits within each of five repetitions are correlated. At either N, p95 equals maximum. No tail SLO, statistical significance, controlled throughput or causal attribution to app CPU is inferred.

## Measured Git client phases and whole iterations

${table(["cold-client-clone", "other-client-clone", "edit-file", "edit-add", "edit-commit", "edit-push", "other-client-fetch", "full-checkout", "verify-all-content-and-history", "verify-remote-ref", "workflow-edit-through-checkout", "complete-verified-iteration", "setup-through-two-verified-clones"])}
## Measured app API paths

The initial native paths below use the original LocalGit info/token implementation. Credential/task/browse paths use the transport wrapper only where info/token is involved; original create/fork/log/tree/file and app policy remain intact. Endpoint time consumes the entire actual HTTP response; includes local request/auth/catalog/adapter overhead. Local identity is ephemeral harness auth, **not WorkOS authentication**.

${table(["local-identity", "unauthenticated-me", "authenticate-me", "create-private-repo", "list-repos", "open-native-repo", "native-read-token", "canonical-write-denied", "native-http-route-missing", "create-task-fork", "credential-read", "credential-write", "open-task-repo", "app-log", "app-tree", "app-file"], ["gitflare-harness-http"])}
Native Git credential status: ${raw.nativeProbes.length}/${raw.nativeProbes.length} filesystem-only read responses without a credential, HTTP route 404, canonical write 403. These expected denials are recorded as successful checks with expectedStatus; no missing feature response was fabricated. Final measurement: ${raw.measurements.length} phase/command/aggregate records, ${raw.measurements.filter((r: any) => r.exitCode !== 0).length} unexpected failures, ${raw.measurements.filter((r: any) => r.timeout).length} timeouts, ${raw.trials.length} verified complete iteration samples. Aggregate rows overlap phase rows and must not be counted as additional operations.

## CPU, memory and actual counters

Client commands use macOS /usr/bin/time -l. Below: sums of child process-tree user/system CPU seconds across each backend's Git commands, and highest observed child maximum RSS. They are not provider CPU. Server git http-backend children are separately timed. Client and server process-tree counters can overlap; do not add them to estimate system totals. Endpoint nodeUserMs/nodeSystemMs are controller-process observations, not isolated adapter CPU.

| Path | Timed Git commands | Client user s | Client system s | Highest child RSS MiB |
|---|---:|---:|---:|---:|
`;
for (const backend of backends) {
  const r = raw.measurements.filter(
    (r: any) => r.backend === backend && r.userSeconds !== null,
  );
  text += `| ${backend} | ${r.length} | ${f(sum(r, "userSeconds"))} | ${f(sum(r, "systemSeconds"))} | ${f(Math.max(...r.map((x: any) => x.maxRssBytes ?? 0)) / 1048576)} |\n`;
}
text += `
Node controller + in-process app server: ${f(raw.nodeResources.userMs)} ms user / ${f(raw.nodeResources.systemMs)} ms system over the whole run, process peak ${f(raw.nodeResources.maxRssKiB / 1024)} MiB; includes fixture/hash work/GC, is not Workers memory. ${transport.length} timed successful server CGI executions: ${f(sum(transport, "userSeconds"))} s user / ${f(sum(transport, "systemSeconds"))} s system, highest CGI RSS ${f(Math.max(...transport.map((e: any) => e.maxRssBytes ?? 0)) / 1048576)} MiB. Provider CPU/RSS is unmeasured.

Actual local app counters: ${api.length} externally requested API operations (including expected native denials), ${checks.length} in-process app-policy rechecks, ${transport.length} successful HTTP Git requests, ${events.filter((e: any) => String(e.path).startsWith("/git/") && e.status >= 400).length} denied/missing Git-route probes. All HTTP entity bodies combined: ${sum(events, "inputBytes")} inbound and ${sum(events, "outputBytes")} outbound bytes; successful Git-route bodies alone: ${sum(transport, "inputBytes")} inbound / ${sum(transport, "outputBytes")} outbound. These counters exclude headers/TCP/TLS and are **not provider metering or GitHub wire bytes**. Credential values remain in memory; only response lengths are retained. Local LFS/object-store writes/bytes: zero. Five private canonicals and five private tasks; only tasks contain fixture Git. Post-run reachable-object/consumer-pack inventories are in the independent verification JSON; they are local storage inspection, never remote billable bytes.

GitHub workload has 5 baseline pushes + 15 edit pushes + 10 full clones + 15 fetches + 15 ref queries = 60 observed Git client network invocations. Actual provider operation counts/storage/bandwidth/charges are unknown. Four gh privacy-view commands are separately recorded for source/benchmark before/after, without claiming four provider API requests (gh may make multiple). Unique refs retain small synthetic histories; provider storage allocation is not measured.

## Cost: measurement separated from projection

No paid allocation, invoice or provider billing delta was observed. USD per accepted iteration is **unknown** for local hardware/electricity/opportunity cost and GitHub subscription/storage/network. No $0 local hardware claim. The Git workload made no Cloudflare data-plane request; the separate OAuth investigation made one successful read-only namespace-list invocation, not a Git/storage workload. Its provider billing classification is unknown. No R2/D1/Artifacts application resource was created.

Projected rates only, checked 2026-10-02 (Asia/Singapore): [Artifacts pricing](https://developers.cloudflare.com/artifacts/platform/pricing/) requires Workers Paid, bills operations/storage starting October 14, 2026, includes 10,000 operations and 1 GB-month, then $0.15/1,000 operations and $0.50/GB-month. A hypothetical month with 100,000 billable Artifacts operations and 10 GB-month would allocate $18 in Artifacts overage after those allowances, excluding Workers base plan, D1, auth, other services and any billing rounding. This is **not a projection from these HTTP request counts**: mapping Git/app requests to Artifacts billing units and provider stored bytes has not been measured. No predicted total application cost or cost-per-edit is defensible from this local adapter.

[R2 Standard pricing](https://developers.cloudflare.com/r2/pricing/) is $0.015/GB-month, $4.50/million A and $0.36/million B requests, with included usage and billable-unit rounding. The separate v1 local LFS/storage projection remains a synthetic-counter allocation excluding staging/app costs, not a live invoice. This ordinary-Git run provides no R2 usage projection.

## Correctness, tests and separate remote status

27/27 tests pass, including the new real-HTTP Git/security test; typecheck passes; Worker dry-run build passes (138.03 KiB / 35.59 KiB gzip); seven local workerd auth-rejection checks pass. Two initial test assertions were corrected to use a raw HTTP Host probe and the app's intentional 404 non-enumeration response on revoked identity. No unexpected benchmark failures. Independent verification in a fresh process checks ${validation.checks.length} client/app/remote results: both clients in all 15 backend blocks, reopening the five persisted stores through **original** serveLocal/app (no HTTP wrapper), and a fresh full GitHub clone. All four hashes match v1; all 257 checked-out bodies match; no credential was stored in client Git config.

OAuth-native Wrangler whoami succeeded with artifacts:write; selected-account namespace list succeeded with [] on account 7efeb52ec5727a903edd8ef7ae8eb925. Old scoped-token 401s are historical failures, **not a current absence-of-access finding**. No login/token rotation/billing upgrade was performed. WorkOS remains unconfigured, D1 ID is placeholder, deployment remains disabled; no unauthenticated app was deployed. Live Artifacts Git/R2/auth/deployment and MFweb-app migration remain pending separately. MFweb-app's GitHub size field (~243338 KiB) is metadata, not a measured clone size; no migration success is claimed.

Actual >100 MiB git-lfs push/clone/pull/checkouts remain separately documented in [v1](report-v1.md) and its retained raw LFS data. They used application HTTP for LFS and direct bare Git metadata; they are not an end-to-end Gitflare Git measurement. GitHub LFS entitlement/quota is unconfirmed, no paid allocation was purchased, and no live GitHub LFS comparison or oversized ordinary-Git rejection comparison was attempted.

## Reproduce

\`npm run bench:comparison -- --help\` and \`npm run bench:lfs -- --help\` exit without a workload. V2 rejects unknown/missing options, bounds repetitions at 2–5 and child Git/gh calls at 60s, HTTP/CGI at 15s, and refuses existing JSON/CSV outputs. No automatic login, deployment, repo creation, LFS or provider allocation. Run from the private source checkout:

\`env -u GH_TOKEN -u GITHUB_TOKEN npm run bench:comparison -- --github --repetitions 5 --output docs/benchmarks/raw/gitflare-comparison-v2-new.json\`

\`env -u GH_TOKEN -u GITHUB_TOKEN ./node_modules/.bin/tsx scripts/verify-comparison-v2.ts docs/benchmarks/raw/gitflare-comparison-v2-new.json --github\`

Omit --github for local-only runs. Keep the run's ignored .tmp directory for independent verification (recorded in raw JSON). The verification writes a new -verification.json and refuses overwrite. \`tsx scripts/report-comparison-v2.ts\` regenerates this fixed-name report from the committed primary v2 JSON/verification only. Revalidate via \`npm run typecheck && npm test && WRANGLER_SEND_METRICS=false npm run build\`. Existing test:worker writes a v1-named output: its rerun was saved separately as worker-auth-smoke-v2.json and the original v1 bytes restored; all prior measurements are retained unchanged.
`;
await writeFile("docs/benchmarks/gitflare-comparison-v2.md", text);
console.log(
  "Generated docs/benchmarks/gitflare-comparison-v2.md from verified v2 results.",
);
