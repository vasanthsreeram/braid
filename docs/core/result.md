# Core forge result — 2026-10-02 Singapore

The feasible core is implemented, tested locally, and deployed behind an enforced authentication gate. **A fully authenticated live product is still blocked by dedicated WorkOS configuration and R2 S3 signing credentials.** No provider login, app-authenticated remote import/merge, or large remote LFS upload is fabricated. [Feature matrix and minimal setup](../implementation.md), [security boundaries](../security.md), [machine-readable verification](raw/verification-summary.json).

Native CI/check runners, Agents SDK, Sandbox/Containers, autonomous/model edits/tests and executing imported code are excluded. `/check` is removed. Developer tests and the retained shell benchmarks are not product CI.

The benchmark process PID 74137 was finished before edits began. Its final committed baseline was `2224be6`. The v2 report records 703 measurements with no unexpected errors; its local/network comparisons do not describe this deployed service. All **26 tracked benchmark assets remain byte-identical** to that baseline: [hash receipt](raw/benchmark-preservation.json). The superseded planning/research proposals are archived or explicitly marked historical.

## Dedicated deployment

| Resource | Retained identity / state |
|---|---|
| Cloudflare account | `7efeb52ec5727a903edd8ef7ae8eb925`; existing Wrangler OAuth, including `artifacts:write` |
| Worker | `cf-native-forge-evaluation` — [evaluation URL](https://cf-native-forge-evaluation.s-vasanthrojin.workers.dev) |
| Worker version | `da2449d7-687d-4c3c-80bf-b9ff844a28b3` |
| D1 | `cf-native-forge-evaluation`, UUID `200d9a4f-b51b-451a-86ab-43b1b29847d3`; all three migrations applied |
| R2 | `cf-native-forge-lfs-evaluation`, APAC; public r2.dev disabled; one-day expiry only for `staging-v1/` |
| Artifacts namespace | `cf-native-forge-evaluation` |
| Retained migration repo | `cf-native-forge-maggies-farm-migration`, ID `opvyb42arm5uj8cs`; private/token-required; no tokens retained |
| GitHub source | `vasanthsreeram/cf-native-forge`, PRIVATE; existing main branch |

Receipts: [final deploy](raw/deployment-final.txt), [D1 migrations](raw/d1-migrations-final.txt), [R2 public access](raw/r2-public-access-final.txt), [R2 lifecycle](raw/r2-lifecycle-final.txt), [Artifacts final inventory/token metadata](raw/artifacts-final-inventory.json), [GitHub privacy](raw/github-source-privacy.json).

The root exposes only a gated sign-in link (401), assets/API require identity, fake/loopback identities are denied, and unconfigured login/callback return 503. `ALLOW_PUBLIC=false` remains enforced. No domain, production app/database/bucket, subscription, or source visibility was changed. No new login/OAuth rotation or account-level key was created.

## Full-history migration

All candidates were the user's public, nonfork GitHub repositories. GitHub's size field was only a discovery hint; full mirrors, refs and reachable objects were preflighted. Original sources were unchanged. Imported scripts, dependencies, applications, archives, LFS smudge filters and submodules were never executed.

| Candidate | Preflight result |
|---|---|
| MFweb-app (preferred) | 99 commits; historical `public/images.zip`, OID `99f716b49d92a85597a011e3613388291904a421`, **53,799,916 bytes**, exceeds Artifacts' 32 MB blob limit |
| That_Aquarium_Webapp | 144 commits; historical `Design/Logo.psd`, OID `9bc8ef524679ed0e1c78b5795daf4d59c77ce1c9`, **73,528,662 bytes**, exceeds blob limit |
| Maggie-s_Farm_consolidated (selected) | 65,135,804 uncompressed reachable-object bytes; 59,552,567 transferred pack bytes; largest blob 4,087,808 bytes; fits provider limits |

Source: `https://github.com/vasanthsreeram/Maggie-s_Farm_consolidated.git`.

Private destination: `https://7efeb52ec5727a903edd8ef7ae8eb925.artifacts.cloudflare.net/git/cf-native-forge-evaluation/cf-native-forge-maggies-farm-migration.git`.

Source and destination `refs/heads/main` both equal **`45fb674a919bcbfcb521e9cea1bf1cffd1a8a397`**. It genuinely has one commit; none were truncated or rewritten. All branch/tag tips, all **287 reachable object IDs**, all commit IDs and **289 checkout files' bytes/modes** match. Object-ID-set SHA256: `586cb7c31a49d337314160530a3caa187e63c836bfa2ac319f8bea40e649f9c8`. Neither mirror is shallow. Source refs before/after match. No historical LFS pointers or checkout submodules were found; no LFS omission is hidden.

Native Artifacts import without a depth/branch limit returned 413/code10402 due to its separate **40 MB importer limit**. The implemented Git HTTP fallback streamed the complete original pack to a fresh empty private destination and checked the native unpack/ref receipts. The verification then cloned both sources, compared full objects/commits and independently hashed each tracked file. This is a **direct authenticated provider migration**, not a WorkOS app importer test. The destination has no fabricated D1/WorkOS owner. [Native rejection](raw/native-import-api-rejection.json), [streaming transfer](raw/migration-stream-transfer.json), [complete verification and per-file hashes](raw/migration-verification.json), [candidate preflights](raw).

## Verification

| Command / exercise | Result | Boundary / receipt |
|---|---|---|
| `npm run typecheck` | Pass | [TypeScript](raw/typecheck.txt) |
| `npm test` | **35 passed, 0 failed** | [Own application tests](raw/local-tests.txt), including real local Git, ACL/session/tenant/ref races, invitations, creation reconciliation, corrupted pack refusal, R2 CDC/dedupe |
| `npm run test:worker` | **7 passed** | [Local workerd denials](raw/worker-auth-smoke-core.json); no remote binding identity invented |
| `npm run test:ui` | **6 passed**, no page errors | [Loopback Chrome](raw/ui-core.json) |
| `npm run test:ui:core` | **12 passed**, no page errors | [Local Chrome + real bare-Git review/merge](raw/ui-core-full.json), [screenshot](../core/ui-core.png) |
| `WRANGLER_SEND_METRICS=false npm run build` | Pass | [Production bundle dry run](raw/build.txt) |
| `wrangler deploy` with existing OAuth | Pass | Dedicated account/resources only; [receipt](raw/deployment-final.txt) |
| `npm run test:deployed` | **13 passed** | [Actual deployed unauthorized/CSRF/fake identity/LFS/login denials](raw/deployed-core-smoke.json) |
| `tsx scripts/deployed-browser-smoke.ts` | **2 passed** | [Actual deployed Chrome gate](raw/deployed-browser.json), [screenshot](ui-deployed-gate.png); no authenticated UI claim |
| Direct native provider smoke | **12 passed** | [Actual clone/fetch/push/fork/scope/revoke/atomic ref race](raw/provider-core-smoke.json) |
| Full migration verification | Pass | [Exact refs/objects/commits/files](raw/migration-verification.json) |

Native smoke base was `a85e4f2cda6e82cd18a8b90195658905e9ffa554`, reviewed synthetic candidate `d378629fd6847d363ad20927849a1948946f4e49`. Two publishers both observed that same candidate as the current head. Exactly one native ref update succeeded (`52d8d905851f7c286dd14144360afca2bb3744d2`); competing `800391d2eaf2874c593dec998b5735d499f704c0` was rejected. Read-only credentials could not push, anonymous Git was denied, and revoked credentials failed. Disposable canonical/task/diagnostic repositories were deleted after retaining evidence; only the migration remains.

Earlier failures are retained rather than suppressed. They include stale OAuth read probes, the native importer rejection, and publisher framing diagnostics. Artifacts raw upload-pack appended `0000` after the binary pack; blindly forwarding it initially failed. The corrected publisher retains only 24 tail bytes and verifies the SHA-1 checksum before distinguishing/removing the proven protocol flush. Real Git tests cover ordinary/raw native framing, segmented streams, corruption and actual stale-ref races. The final 12-check provider receipt supersedes those failed runs. A D1 migration-list account-selection error was corrected by explicitly setting the authorized account ID; the failed receipt remains separate.

## Remaining user-bound setup and costs

[Credential availability](raw/credential-availability.json) checks dedicated Keychain service metadata and environment names only. Dedicated WorkOS and R2 signing credentials were absent. No unrelated app identity was reused. The session-seal secret already exists in Keychain and Worker secrets.

Supply a dedicated AuthKit **client ID, API key and exact JWT issuer**. Register callback `https://cf-native-forge-evaluation.s-vasanthrojin.workers.dev/auth/callback` and logout return/homepage `https://cf-native-forge-evaluation.s-vasanthrojin.workers.dev/auth/login`. Store the three dedicated values in Keychain and use `python3 scripts/configure-core-secrets.py` as described in [setup](../implementation.md). Then verify real login/refresh/logout, org membership and revoked sessions, plus the deployed create/share/import/native-token/review/publish flows. Provider-contract doubles are not live-auth evidence.

Supply existing **bucket-scoped R2 S3 access key ID and secret** with object read/write on `cf-native-forge-lfs-evaluation`, or explicitly authorize narrowly scoped generation. Store in Keychain and install with `python3 scripts/configure-core-secrets.py --r2`. No broad account API key was generated. Actual git-lfs staging/verify/download/dedupe above 100 MiB remains untested remotely. Local Miniflare R2 and >100 MiB loopback benchmarks do not establish remote enforcement/CPU/client behavior.

Retained recurring resources are the evaluation Worker, tiny metadata D1, dedicated R2 bucket/lifecycle, and one private Artifacts repository (~65.1 MB uncompressed reachable Git data). No R2 LFS payload was uploaded during this launch. Normal provider storage/request/CPU charges or existing plan allowances can apply; no zero-cost or measured invoice claim is made. Subscription inventory returned OAuth 403, so plan pricing/remaining allowances were not inferred. No paid plan/quotas were purchased or upgraded, no unbounded load test ran, and no scheduled runner or sandbox is retained. Do not delete the migrated destination as disposable evidence without an explicit decision.

Operational limits and conservative uncertain-publication recovery are documented in [security](../security.md) and [remaining gates](../roadmap.md). A publisher still at its base retains its fence for investigation; there is no blind retry. Range/resume, automatic chunk GC, private upstream credentials and unrestricted-size imports are not claimed.
