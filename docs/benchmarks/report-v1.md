# Measured benchmark v1

Measured 2026-10-01T18:04:15.117Z (UTC; local environment is Asia/Singapore). **No deployed Cloudflare performance result exists.** GitHub normal Git and local bare Git were measured; large-file service and dedupe runs are local only. Raw [code JSON](raw/code-v1.json), [code CSV](raw/code-v1.csv), [LFS JSON](raw/lfs-v1.json), [LFS CSV](raw/lfs-v1.csv), [micro CSV](raw/lfs-v1-micro.csv), [read-only account probes](raw/cloudflare-probes-v1.json), and [UI check](raw/ui-v1.json), [local Worker auth smoke](raw/worker-auth-smoke-v1.json).

## Workload and environment

Version 1 seed 5370206; 256 synthetic source files + README, 323888 fixture source bytes. Identical baseline and three edit commits for each backend: `d00dddbac3cda12330461a41ec3efddc2fcad6ed`, `f5157241c81a0d80b03ab3f9718bfb1cc66ae7c1`, `a63ed8171524840e3dac86ff7c9dbd2b7037165a`, `afc6626df5d76996f4623ffc8369a1a3b0d26007`. Full-history single-branch clone/fetch/full checkout on both backends, compression 6, no shallow/filter shortcuts. 3 repetitions; paired order github→local, local→github, github→local. Two task clients maximum; main edit loop sequential. Task workflows are normal Git branches, **not** GitHub API forks or Artifacts native forks.

Apple M4; darwin 24.5.0 arm64; v26.5.0; git version 2.39.5 (Apple Git-154). Client location is user-reported Singapore; network route/remote placement were not measured. The superseded code pilot overlapped LFS work; the final code rerun completed after LFS. Other machine background load is uncontrolled: this is a modest feasibility benchmark, not a controlled capacity comparison. LFS subprocess timings include server work on the same machine.

Cold means a fresh empty client, full history of the same single fixture branch, and full checkout with local hardlinks disabled. Provider/OS/page caches are uncontrolled. Warm means an existing clone after the preceding pushes; both backends fetch and check out the same full commit. GitHub may reuse server objects across repetitions. Large-file downloads empty the consumer LFS cache before each checkout. No provider-cold/startup claim.

## Normal Git latency

Milliseconds; p50 is median, p95 is nearest rank. **N=3/6/9 is too small for a tail-latency conclusion**; p95 usually equals maximum. Repeated edits inside a repetition are correlated.

| Backend | Operation | N | p50 ms | p95 ms | Min–max ms |
|---|---|---:|---:|---:|---:|
| local | cold-client-clone | 3 | 40.92 | 49.70 | 38.84–49.70 |
| local | edit-commit | 9 | 14.29 | 15.15 | 12.73–15.15 |
| local | edit-push | 9 | 30.66 | 30.88 | 30.37–30.88 |
| local | warm-fetch | 9 | 26.93 | 27.29 | 26.72–27.29 |
| local | checkout | 9 | 11.84 | 12.07 | 9.35–12.07 |
| local | task-clone | 6 | 46.97 | 48.34 | 46.13–48.34 |
| local | task-branch-push | 6 | 31.36 | 31.63 | 31.19–31.63 |
| local | canonical-compare-and-push | 3 | 28.96 | 29.07 | 28.83–29.07 |
| github | cold-client-clone | 3 | 1216.17 | 1233.97 | 1191.58–1233.97 |
| github | edit-commit | 9 | 13.45 | 13.95 | 12.95–13.95 |
| github | edit-push | 9 | 1611.15 | 1721.44 | 1472.76–1721.44 |
| github | warm-fetch | 9 | 1161.56 | 1274.49 | 1107.43–1274.49 |
| github | checkout | 9 | 17.48 | 22.22 | 16.15–22.22 |
| github | task-clone | 6 | 1123.81 | 1212.96 | 1097.39–1212.96 |
| github | task-branch-push | 6 | 1713.55 | 1817.45 | 1605.88–1817.45 |
| github | canonical-compare-and-push | 3 | 1555.41 | 1570.65 | 1485.25–1570.65 |

160 measured commands including four fixture preparation commits. 6 expected canonical lease rejections, 0 timeouts; no unexpected command failures. Every edit produced the same commit ID and another client fetched/checked out it with matching content. All 6 two-client canonical races accepted exactly one candidate and rejected the stale peer. This demonstrates ordinary Git compare-and-push on dedicated disposable branches, not an enforced forge publisher. A superseded [pilot run](raw/pilot/code-v1-uncontrolled-refs.json) retained growing remote refs and uncontrolled task timestamps; it is preserved but excluded from these comparisons. Final task commit IDs are fixed and matched across backends. Raw user/system CPU and maximum RSS from macOS /usr/bin/time are included (per subprocess process-tree counters, not provider CPU). Logical Git object counts/bytes and local consumer pack/loose sizes are recorded in inventories; remote pack byte counts, GitHub storage metering and provider operation counts were unavailable; they are not inferred from latency.

Local Git has lower latency here. That result includes the obvious loopback/network difference; it establishes no Cloudflare-vs-GitHub win. Canonical contention remains serialized even with independent task branches.

## Actual LFS clients, local-only service

3 repetitions × five versions; 111 measured commands. git-lfs/3.7.0 (GitHub; darwin arm64; go 1.24.4). Git metadata uses a local bare remote; LFS uses real git-lfs Batch/basic HTTP PUT/verify/GET against the shared application handler on 127.0.0.1. All **15 full uploads and full pull/checkouts** matched their SHA256 OIDs; every file exceeds 100 MiB. Initial file 112 MiB; sparse replaces three 4 KiB spans; insertion adds 3712 bytes; control is independent seeded gzip-compressed high-entropy bytes, then one changed byte per compressed MiB block. Hashes and exact sizes are in raw JSON. This success does not validate Workers' 100 MB ingress envelope or direct R2 upload compatibility.

| Version | Size MiB | Upload N / median ms | Full pull/check out N / median ms |
|---|---:|---:|---:|
| base.bin | 112.000 | 3 / 2305.00 | 3 / 1211.42 |
| sparse.bin | 112.000 | 3 / 2836.98 | 3 / 1260.47 |
| insert.bin | 112.004 | 3 / 2781.94 | 3 / 1152.27 |
| entropy.gz | 112.036 | 3 / 2317.83 | 3 / 1149.27 |
| entropy-edited.gz | 112.036 | 3 / 2329.61 | 3 / 1172.10 |

CPU/RSS for child git-lfs and local Node server are separately recorded. Node RSS is a process-wide observation including fixture-generation/GC history, not per-invocation Workers memory. No upload bandwidth benefit is claimed: each changed version transfers the whole object through standard basic. Repeat OID upload can be omitted after the manifest exists. Range/resume is unsupported and tested as HTTP 416.

## Storage/compute experiment

Same five fixture files, three repetitions each of whole-file, fixed 1 MiB, and gear CDC. All 45 full reconstructions checked chunk hashes/lengths, whole-file SHA and bytes. Counters are **local simulated R2 operations**, never provider usage or invoices. Logical file bytes / newly written physical chunk bytes are distinct. Physical means content-object file size; actual disk block allocation, replicas and remote storage metering were not measured. Manifest bytes are additional.

| Strategy | Total new chunks MiB / repetition | Manifest bytes | Simulated A/B calls | Ingest CPU ms / repetition (median) | Download CPU ms / repetition (median) |
|---|---:|---:|---:|---:|---:|
| whole | 560.076 | 1130 | 10 / 10 | 630.59 | 590.18 |
| fixed-1MiB | 434.076 | 51916 | 568 / 568 | 2459.46 | 597.20 |
| gear32-v1 | 342.913 | 32589 | 357 / 357 | 9874.60 | 579.43 |

| Edit | Whole new MiB | Fixed new MiB | CDC new MiB |
|---|---:|---:|---:|
| base.bin | 112.000 | 112.000 | 112.000 |
| sparse.bin | 112.000 | 3.000 | 8.189 |
| insert.bin | 112.004 | 95.004 | 2.386 |
| entropy.gz | 112.036 | 112.036 | 112.036 |
| entropy-edited.gz | 112.036 | 112.036 | 108.302 |

CDC reduced total new chunk bytes by 38.77% against whole-file storage for this mix. Fixed chunking is better for the aligned sparse edit (3 MiB vs roughly 8.19 MiB); CDC is better for insertion (roughly 2.39 MiB vs 95 MiB), and offers little saving for the changed high-entropy gzip control. CDC adds hashing/boundary CPU and dozens of read/write calls per object; the local ingest CPU is substantially higher than whole-file storage, and that compute cost may offset storage savings in a real deployment. This synthetic mix is not a population estimate or confidence interval. Raw phase wall time, CPU, object counts and cumulative Node peak RSS are available.

## Iteration spend: projected storage component, not measured invoices

Pricing accessed 2026-10-01 UTC / 2026-10-02 Singapore. At [R2 Standard pricing](https://developers.cloudflare.com/r2/pricing/), storage is $0.015/GB-month, A calls $4.50/million and B calls $0.36/million; included allowances are 10 GB-month, 1 million A and 10 million B. Model assumes one five-version workload, final objects retained 30 days, decimal GB, no allowance applied, and four accepted file edits after baseline. Values below are **unrounded linear allocation estimates from local counters**. They exclude staging, retries, failed-upload orphans, D1, Workers/DO/Sandbox/auth and application overhead. Conditional writes/error billing may differ live.

| Strategy | Storage 30 days USD | Request allocation USD | Workload USD | USD / accepted file edit |
|---|---:|---:|---:|---:|
| whole | 0.008809 | 0.000049 | 0.008858 | 0.002214 |
| fixed-1MiB | 0.006828 | 0.002760 | 0.009589 | 0.002397 |
| gear32-v1 | 0.005394 | 0.001735 | 0.007129 | 0.001782 |

R2 rounds usage upward to billing units; those small allocation values are **not** predicted charges. With unused included allowance this isolated storage component would fit; remaining account allowance is unknown. If an exhausted account crossed new storage/A/B billable units, aggregate invoice deltas could differ substantially (for example $0.015 + $4.50 + $0.36 for crossing one of each unit). No remote CF storage was consumed by this run, so no CF workload invoice exists. Local hardware/electricity opportunity cost is unmeasured, not assigned $0.

[Artifacts pricing](https://developers.cloudflare.com/artifacts/platform/pricing/) requires Workers Paid; operations/storage billing starts October 14, 2026, with 10,000 operations + 1 GB-month included and overage $0.15/1,000 + $0.50/GB-month. No Artifacts operation count/storage test exists here; these rates cannot turn local Git timings into CF spend.

GitHub code benchmark completed nine accepted edits per backend plus six task-branch edits and three canonical winners per backend. GitHub normal Git has no observed per-push charge here; account subscription/quota/invoice reads were unavailable, so **USD per accepted code iteration is unknown**, not zero. The dedicated benchmark repository remains private and retained. [GitHub LFS metering](https://docs.github.com/en/billing/concepts/product-billing/git-lfs) charges storage per complete object version and download bandwidth against account quota. Remaining quota was not readable; **GitHub LFS was not measured** and no allocation was purchased. No oversized ordinary-Git rejection was used as a comparison. AI/hosted-agent/model token spend is explicitly excluded; CDC does not imply fewer model tokens.

## Live blockers and retained resources

Six existing CF tokens were verified active via Keychain read-only probes. Artifacts list returned 401/code 10000; subscription reads 403. BugGuide credential can read the intended account, Workers settings and R2 listing, but Paid entitlement is not proven. No API tokens were created/rotated and no plan/resource change was attempted. WorkOS/forge credentials were absent from Keychain service names; no live WorkOS login request or fake provider response was substituted. GitHub billing usage/packages probes returned 404 with missing user-scope diagnostic; no auth-scope refresh was performed.

Real remote measurement: [private GitHub benchmark](https://github.com/vasanthsreeram/cf-native-forge-benchmark-20261002-v1), verified private at create and after tests. No GitHub LFS/Actions/hosted model usage; no CF namespace/Worker/D1/bucket was provisioned. Raw data and synthetic remote refs retained; retained normal-Git storage is small but metered size/subscription allocation unknown. Local generated fixtures live in ignored .tmp; disposable LFS services were removed after each repetition. UI screenshot is a local synthetic view, not a deployed demo.

## Reproduce

`npm ci && npm run typecheck && npm test && WRANGLER_SEND_METRICS=false npm run build`

`env -u GH_TOKEN -u GITHUB_TOKEN npm run bench -- --github --repetitions 3 --output docs/benchmarks/raw/code-v1.json`

`npm run bench:lfs -- --repetitions 3 --mib 112 && npm run test:ui && npm run report`

Remote opt-in creates/reuses only the dedicated cf-native-forge-benchmark-* private repository and uniquely named synthetic refs; it checks privacy before writes and afterward. The code CLI also runs local-only without --github. No automatic GitHub Actions workflow exists. Pin versions and commands are in package-lock.json and [implementation status](../implementation.md).
