# Actual local Gitflare comparison v2

Measured 2026-10-01T20:20:02.649Z–2026-10-01T20:21:33.926Z UTC on Apple M4, darwin 24.5.0 arm64, v26.5.0, git version 2.39.5 (Apple Git-154); user environment Singapore. Source was clean at `29b9083`. Source and dedicated GitHub benchmark repository were private before/after writes. No deployed Gitflare, Artifacts Git, or WorkOS login timing is claimed.

**The unmodified local app has no ordinary Git transport.** Its read-token API returns a bare filesystem path with no credential; its HTTP Git route returns 404. Canonical write issuance returns 403: “Canonical write capabilities are withheld; use a task fork”. A native end-to-end Git client iteration is therefore **unmeasured/unavailable**, not silently replaced with a bare-path clone. This report measures the real native control plane and separately a benchmark-only authenticated HTTP task workflow built around that control plane and its real LocalGit adapter.

[Raw JSON](raw/gitflare-comparison-v2.json), [CSV](raw/gitflare-comparison-v2.csv), [validation](raw/validation-v2.json), [independent verification](raw/gitflare-comparison-v2-verification.json), [OAuth read-only probes](raw/cloudflare-oauth-readonly-v2.json), [Worker rejection rerun](raw/worker-auth-smoke-v2.json). Previous v1 files remain unchanged. An earlier [owner-only pilot](raw/pilot/gitflare-comparison-v2-owner-pilot.json) is retained but excluded: the final harness binds each capability to its issuing identity and rechecks revocation. The two-repetition local development pilot remains in ignored .tmp.

Median edit-through-checkout: bare Git 94.73 ms; app-backed HTTP harness 168.35 ms; private GitHub 2891.71 ms. The local/network difference and extra policy/HTTP boundaries are explicit; this establishes no deployed Cloudflare performance result.

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

Five repetitions per backend; three sequential deterministic edits per repetition (45 accepted iterations). Fixture seed 5370206: 256 synthetic TypeScript files + README, 323888 source-file bytes plus README. The same four commits as v1 are used on every path:

- `d00dddbac3cda12330461a41ec3efddc2fcad6ed`
- `f5157241c81a0d80b03ab3f9718bfb1cc66ae7c1`
- `a63ed8171524840e3dac86ff7c9dbd2b7037165a`
- `afc6626df5d76996f4623ffc8369a1a3b0d26007`

Compression 6; full-history single-branch clone, full checkout, --no-local, no depth/filter/partial clones. Every iteration checks all 257 tracked file SHA256 values, clean worktree, exact HEAD and remote ref, and full history length. Dedicated refs are `bench-v2-20261001202002649-e1990d-<rep>`, retained privately; source repo data is never used as a fixture. The GitHub benchmark repo is reused, never created/publicized by v2. No LFS uploads/Actions/model calls or billing allocation.

Seeded Fisher-Yates pairs backend blocks within each repetition: gitflare-harness-http → bare-git → github; bare-git → github → gitflare-harness-http; github → bare-git → gitflare-harness-http; github → gitflare-harness-http → bare-git; github → gitflare-harness-http → bare-git. Backend blocks run sequentially with two clients. Tests/LFS workloads did not run concurrently with the final benchmark. Normal background load is uncontrolled. “Cold client” means a fresh destination/full history/full checkout; OS/page/provider caches are uncontrolled and GitHub may already hold all fixture objects from v1/pilots. Warm fetch follows the preceding clone/push. These are **not provider-cold timings**.

Two direct stopwatches exist per iteration; neither is a sum of unrelated medians:

- `workflow-edit-through-checkout`: actual file write → git add → deterministic commit → push → another client's fetch → full checkout. Git HTTP policy/auth is included; harness token issuance happens just before this stopwatch.
- `complete-verified-iteration`: token refresh (two real API calls for harness) → the whole workflow → all-body/history verification → authenticated remote-ref query → app open/log/tree/file + response-integrity checks for harness. Bare Git/GitHub include the same body/history/ref verification, with no invented forge browsing calls. Additional app work makes these totals intentionally asymmetric.

Clone timings include full checkout but exclude subsequent hash verification. Setup timing covers app identity/creation/listing/native probes/task creation/credentials/seed/two verified clones for harness; direct bare setup creates a bare repo, while GitHub uses an existing repo. It is not a symmetric provider-provisioning comparison. GitHub private metadata checks are separate measured gh commands; Git credential-helper/auth costs are included in Git times.

Milliseconds; p50 median, p95 nearest rank. N=5 clones/setup and N=15 edit phases; three edits within each of five repetitions are correlated. At either N, p95 equals maximum. No tail SLO, statistical significance, controlled throughput or causal attribution to app CPU is inferred.

## Measured Git client phases and whole iterations

| Path | Phase | N | p50 ms | p95 ms | Min–max ms |
|---|---|---:|---:|---:|---:|
| bare-git | cold-client-clone | 5 | 41.28 | 41.59 | 40.06–41.59 |
| bare-git | other-client-clone | 5 | 39.01 | 40.21 | 38.39–40.21 |
| bare-git | edit-file | 15 | 0.19 | 0.21 | 0.15–0.21 |
| bare-git | edit-add | 15 | 11.27 | 12.17 | 8.38–12.17 |
| bare-git | edit-commit | 15 | 14.29 | 14.78 | 13.03–14.78 |
| bare-git | edit-push | 15 | 31.20 | 32.87 | 30.68–32.87 |
| bare-git | other-client-fetch | 15 | 27.33 | 28.29 | 26.60–28.29 |
| bare-git | full-checkout | 15 | 11.82 | 12.23 | 9.34–12.23 |
| bare-git | verify-all-content-and-history | 15 | 45.88 | 48.10 | 42.44–48.10 |
| bare-git | verify-remote-ref | 15 | 12.25 | 13.08 | 11.89–13.08 |
| bare-git | workflow-edit-through-checkout | 15 | 94.73 | 98.45 | 90.13–98.45 |
| bare-git | complete-verified-iteration | 15 | 150.97 | 157.69 | 148.63–157.69 |
| bare-git | setup-through-two-verified-clones | 5 | 263.78 | 290.22 | 249.89–290.22 |
| gitflare-harness-http | cold-client-clone | 5 | 83.57 | 87.25 | 82.82–87.25 |
| gitflare-harness-http | other-client-clone | 5 | 82.54 | 84.94 | 81.49–84.94 |
| gitflare-harness-http | edit-file | 15 | 0.21 | 0.46 | 0.14–0.46 |
| gitflare-harness-http | edit-add | 15 | 11.40 | 11.79 | 8.56–11.79 |
| gitflare-harness-http | edit-commit | 15 | 14.66 | 15.26 | 13.13–15.26 |
| gitflare-harness-http | edit-push | 15 | 63.44 | 65.98 | 62.80–65.98 |
| gitflare-harness-http | other-client-fetch | 15 | 67.90 | 69.89 | 67.22–69.89 |
| gitflare-harness-http | full-checkout | 15 | 12.06 | 12.27 | 9.39–12.27 |
| gitflare-harness-http | verify-all-content-and-history | 15 | 44.84 | 49.73 | 41.59–49.73 |
| gitflare-harness-http | verify-remote-ref | 15 | 39.96 | 40.61 | 39.23–40.61 |
| gitflare-harness-http | workflow-edit-through-checkout | 15 | 168.35 | 172.95 | 163.21–172.95 |
| gitflare-harness-http | complete-verified-iteration | 15 | 286.98 | 297.08 | 279.50–297.08 |
| gitflare-harness-http | setup-through-two-verified-clones | 5 | 443.18 | 444.67 | 410.49–444.67 |
| github | cold-client-clone | 5 | 1133.64 | 1283.55 | 1097.03–1283.55 |
| github | other-client-clone | 5 | 1162.22 | 1227.53 | 1120.02–1227.53 |
| github | edit-file | 15 | 0.78 | 0.98 | 0.16–0.98 |
| github | edit-add | 15 | 24.83 | 26.95 | 10.03–26.95 |
| github | edit-commit | 15 | 22.74 | 26.29 | 12.79–26.29 |
| github | edit-push | 15 | 1597.76 | 1885.08 | 1429.73–1885.08 |
| github | other-client-fetch | 15 | 1184.06 | 1393.48 | 1088.59–1393.48 |
| github | full-checkout | 15 | 18.09 | 21.54 | 17.15–21.54 |
| github | verify-all-content-and-history | 15 | 50.21 | 54.15 | 44.76–54.15 |
| github | verify-remote-ref | 15 | 848.09 | 926.60 | 781.04–926.60 |
| github | workflow-edit-through-checkout | 15 | 2891.71 | 3071.02 | 2619.42–3071.02 |
| github | complete-verified-iteration | 15 | 3761.59 | 3980.18 | 3516.39–3980.18 |
| github | setup-through-two-verified-clones | 5 | 4093.45 | 4285.03 | 3945.37–4285.03 |

## Measured app API paths

The initial native paths below use the original LocalGit info/token implementation. Credential/task/browse paths use the transport wrapper only where info/token is involved; original create/fork/log/tree/file and app policy remain intact. Endpoint time consumes the entire actual HTTP response; includes local request/auth/catalog/adapter overhead. Local identity is ephemeral harness auth, **not WorkOS authentication**.

| Path | Phase | N | p50 ms | p95 ms | Min–max ms |
|---|---|---:|---:|---:|---:|
| gitflare-harness-http | local-identity | 5 | 5.06 | 7.48 | 1.71–7.48 |
| gitflare-harness-http | unauthenticated-me | 5 | 1.66 | 2.01 | 0.50–2.01 |
| gitflare-harness-http | authenticate-me | 5 | 1.63 | 2.63 | 0.65–2.63 |
| gitflare-harness-http | create-private-repo | 5 | 24.87 | 27.28 | 12.84–27.28 |
| gitflare-harness-http | list-repos | 5 | 1.97 | 2.02 | 1.39–2.02 |
| gitflare-harness-http | open-native-repo | 5 | 1.77 | 1.81 | 1.70–1.81 |
| gitflare-harness-http | native-read-token | 5 | 1.92 | 2.28 | 1.71–2.28 |
| gitflare-harness-http | canonical-write-denied | 5 | 1.93 | 2.21 | 1.72–2.21 |
| gitflare-harness-http | native-http-route-missing | 5 | 1.74 | 1.89 | 1.63–1.89 |
| gitflare-harness-http | create-task-fork | 5 | 23.19 | 28.10 | 17.82–28.10 |
| gitflare-harness-http | credential-read | 20 | 1.73 | 1.98 | 1.64–2.03 |
| gitflare-harness-http | credential-write | 20 | 1.90 | 2.31 | 0.66–3.15 |
| gitflare-harness-http | open-task-repo | 15 | 2.03 | 2.11 | 1.98–2.11 |
| gitflare-harness-http | app-log | 15 | 9.39 | 9.57 | 9.03–9.57 |
| gitflare-harness-http | app-tree | 15 | 8.92 | 9.39 | 7.59–9.39 |
| gitflare-harness-http | app-file | 15 | 9.20 | 9.49 | 8.90–9.49 |

Native Git credential status: 5/5 filesystem-only read responses without a credential, HTTP route 404, canonical write 403. These expected denials are recorded as successful checks with expectedStatus; no missing feature response was fabricated. Final measurement: 703 phase/command/aggregate records, 0 unexpected failures, 0 timeouts, 45 verified complete iteration samples. Aggregate rows overlap phase rows and must not be counted as additional operations.

## CPU, memory and actual counters

Client commands use macOS /usr/bin/time -l. Below: sums of child process-tree user/system CPU seconds across each backend's Git commands, and highest observed child maximum RSS. They are not provider CPU. Server git http-backend children are separately timed. Client and server process-tree counters can overlap; do not add them to estimate system totals. Endpoint nodeUserMs/nodeSystemMs are controller-process observations, not isolated adapter CPU.

| Path | Timed Git commands | Client user s | Client system s | Highest child RSS MiB |
|---|---:|---:|---:|---:|
| bare-git | 105 | 0.62 | 0.62 | 6.75 |
| gitflare-harness-http | 105 | 0.40 | 0.40 | 6.73 |
| github | 105 | 5.23 | 3.66 | 34.31 |

Node controller + in-process app server: 2362.06 ms user / 1018.08 ms system over the whole run, process peak 127.97 MiB; includes fixture/hash work/GC, is not Workers memory. 145 timed successful server CGI executions: 0.20 s user / 0.20 s system, highest CGI RSS 5.52 MiB. Provider CPU/RSS is unmeasured.

Actual local app counters: 140 externally requested API operations (including expected native denials), 145 in-process app-policy rechecks, 145 successful HTTP Git requests, 10 denied/missing Git-route probes. All HTTP entity bodies combined: 405055 inbound and 805990 outbound bytes; successful Git-route bodies alone: 404030 inbound / 772070 outbound. These counters exclude headers/TCP/TLS and are **not provider metering or GitHub wire bytes**. Credential values remain in memory; only response lengths are retained. Local LFS/object-store writes/bytes: zero. Five private canonicals and five private tasks; only tasks contain fixture Git. Post-run reachable-object/consumer-pack inventories are in the independent verification JSON; they are local storage inspection, never remote billable bytes.

GitHub workload has 5 baseline pushes + 15 edit pushes + 10 full clones + 15 fetches + 15 ref queries = 60 observed Git client network invocations. Actual provider operation counts/storage/bandwidth/charges are unknown. Four gh privacy-view commands are separately recorded for source/benchmark before/after, without claiming four provider API requests (gh may make multiple). Unique refs retain small synthetic histories; provider storage allocation is not measured.

## Cost: measurement separated from projection

No paid allocation, invoice or provider billing delta was observed. USD per accepted iteration is **unknown** for local hardware/electricity/opportunity cost and GitHub subscription/storage/network. No $0 local hardware claim. The Git workload made no Cloudflare data-plane request; the separate OAuth investigation made one successful read-only namespace-list invocation, not a Git/storage workload. Its provider billing classification is unknown. No R2/D1/Artifacts application resource was created.

Projected rates only, checked 2026-10-02 (Asia/Singapore): [Artifacts pricing](https://developers.cloudflare.com/artifacts/platform/pricing/) requires Workers Paid, bills operations/storage starting October 14, 2026, includes 10,000 operations and 1 GB-month, then $0.15/1,000 operations and $0.50/GB-month. A hypothetical month with 100,000 billable Artifacts operations and 10 GB-month would allocate $18 in Artifacts overage after those allowances, excluding Workers base plan, D1, auth, other services and any billing rounding. This is **not a projection from these HTTP request counts**: mapping Git/app requests to Artifacts billing units and provider stored bytes has not been measured. No predicted total application cost or cost-per-edit is defensible from this local adapter.

[R2 Standard pricing](https://developers.cloudflare.com/r2/pricing/) is $0.015/GB-month, $4.50/million A and $0.36/million B requests, with included usage and billable-unit rounding. The separate v1 local LFS/storage projection remains a synthetic-counter allocation excluding staging/app costs, not a live invoice. This ordinary-Git run provides no R2 usage projection.

## Correctness, tests and separate remote status

27/27 tests pass, including the new real-HTTP Git/security test; typecheck passes; Worker dry-run build passes (138.03 KiB / 35.59 KiB gzip); seven local workerd auth-rejection checks pass. Two initial test assertions were corrected to use a raw HTTP Host probe and the app's intentional 404 non-enumeration response on revoked identity. No unexpected benchmark failures. Independent verification in a fresh process checks 36 client/app/remote results: both clients in all 15 backend blocks, reopening the five persisted stores through **original** serveLocal/app (no HTTP wrapper), and a fresh full GitHub clone. All four hashes match v1; all 257 checked-out bodies match; no credential was stored in client Git config.

OAuth-native Wrangler whoami succeeded with artifacts:write; selected-account namespace list succeeded with [] on account 7efeb52ec5727a903edd8ef7ae8eb925. Old scoped-token 401s are historical failures, **not a current absence-of-access finding**. No login/token rotation/billing upgrade was performed. WorkOS remains unconfigured, D1 ID is placeholder, deployment remains disabled; no unauthenticated app was deployed. Live Artifacts Git/R2/auth/deployment and MFweb-app migration remain pending separately. MFweb-app's GitHub size field (~243338 KiB) is metadata, not a measured clone size; no migration success is claimed.

Actual >100 MiB git-lfs push/clone/pull/checkouts remain separately documented in [v1](report-v1.md) and its retained raw LFS data. They used application HTTP for LFS and direct bare Git metadata; they are not an end-to-end Gitflare Git measurement. GitHub LFS entitlement/quota is unconfirmed, no paid allocation was purchased, and no live GitHub LFS comparison or oversized ordinary-Git rejection comparison was attempted.

## Reproduce

`npm run bench:comparison -- --help` and `npm run bench:lfs -- --help` exit without a workload. V2 rejects unknown/missing options, bounds repetitions at 2–5 and child Git/gh calls at 60s, HTTP/CGI at 15s, and refuses existing JSON/CSV outputs. No automatic login, deployment, repo creation, LFS or provider allocation. Run from the private source checkout:

`env -u GH_TOKEN -u GITHUB_TOKEN npm run bench:comparison -- --github --repetitions 5 --output docs/benchmarks/raw/gitflare-comparison-v2-new.json`

`env -u GH_TOKEN -u GITHUB_TOKEN ./node_modules/.bin/tsx scripts/verify-comparison-v2.ts docs/benchmarks/raw/gitflare-comparison-v2-new.json --github`

Omit --github for local-only runs. Keep the run's ignored .tmp directory for independent verification (recorded in raw JSON). The verification writes a new -verification.json and refuses overwrite. `tsx scripts/report-comparison-v2.ts` regenerates this fixed-name report from the committed primary v2 JSON/verification only. Revalidate via `npm run typecheck && npm test && WRANGLER_SEND_METRICS=false npm run build`. Existing test:worker writes a v1-named output: its rerun was saved separately as worker-auth-smoke-v2.json and the original v1 bytes restored; all prior measurements are retained unchanged.
