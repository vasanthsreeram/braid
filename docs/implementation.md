# Implementation status (2026-10-02 Singapore / 2026-10-01 UTC)

Implementation is authorized by the build brief. Earlier documents describe the preserved planning baseline, not a current docs-only restriction. The repository and every evaluation repository remain private. This is an exercised local vertical MVP with production integration code; **a live Cloudflare forge has not been validated or deployed**.

| Surface | Implemented / exercised | Live boundary or remaining work |
|---|---|---|
| Workers API & UI | Compiled Worker; local browser create/open/task/discovery checks | No deployment; all evaluation browsing requires auth; public flag disabled |
| WorkOS AuthKit | Real authorize/code exchange, PKCE, encrypted flow/session cookies, strict JWT verifier, rejection tests | No Keychain WorkOS credentials/environment; end-to-end login blocked; refresh/org switching/provider logout deferred |
| Repo policy | Private default, reader/contributor/writer/admin, explicit grants, tenant checks, revocation, shared listing | Direct WorkOS user-ID grant; invitations/team/org lifecycle reconciliation deferred |
| Public discovery | Explicit confirmed visibility API and public query; policy gated | Disabled in evaluation; no repo has been published; lexical ranking/topics/indexing deferred |
| Native Git | Artifacts binding create/info/log/tree/file/fork/import/token code matches pinned vendor types | Read-only account probes return 401; no Artifacts Git network timing; native lifecycle/token semantics unvalidated |
| URL import | Strict reconstructed public GitHub HTTPS identity; native importer; private destination | No live import test. LFS/submodules/platform metadata not migrated. Failed/in-progress native intent retained; no background reconciler |
| Task fork/review | Real local bare-Git forks; immutable base/candidate existence checks; stale-head rejection; decisions | Provider forks need live tests. Review does **not** integrate. Canonical token withheld; publisher/initial canonical seeding deferred |
| Native deterministic check | Actual immutable JSON parsing, 8 files × 64 KiB; positive/negative tests | Contract `json-parse-v1` only, synchronous receipt; no persisted CI orchestration/logs. No shell/packages/Actions/Sandbox claims |
| LFS/CDC | Standard Batch/basic, verified immutable manifests, chunk integrity, tenant isolation; actual git-lfs >100 MiB push/clone/pull | Only Node loopback + filesystem transport exercised. Production direct R2 PUT + verify wiring implemented, untested live |
| Range/resume | Explicit 416 rejection | Unsupported; no multipart or ranged-download promise |
| Agents | None | Hosted Agents SDK editing remains KIV |

## Run locally

Node ≥22.15 (measured on Node 26.5.0), Git, git-lfs, npm. No Cloudflare or WorkOS key is required for tests and local benchmarks. Unit integration also exercises the actual R2 adapter against local Miniflare conditional/checksum behavior; that is an emulator test, not a live storage measurement.

```sh
npm ci
npm run typecheck
npm test
npm run test:worker  # local workerd auth only; deliberately no remote Artifacts binding
WRANGLER_SEND_METRICS=false npm run build
npm run dev
# Open http://127.0.0.1:8787, choose "Use local test identity".
npm run test:ui
npm run bench -- --repetitions 3
# Opt-in remote synthetic Git benchmark; gh must use the authorized keyring account.
env -u GH_TOKEN -u GITHUB_TOKEN npm run bench -- --github --repetitions 3
npm run bench:lfs -- --repetitions 3 --mib 112
npm run report
```

The local harness is `scripts/local.ts`, binds **127.0.0.1 only**, and supplies in-memory ephemeral test auth through a clearly local-only endpoint. It uses Node SQLite, real filesystem-backed bare Git and filesystem chunk objects. It is not Miniflare, R2, Artifacts or a WorkOS emulator. A separate test:worker smoke uses local workerd/Miniflare to exercise only production auth rejection, with storage/Artifacts bindings omitted. It is absent from the production dependency graph; production ignores local/dev auth variables. Test identity credentials never enter source, catalog, Git config or reports. Browser/CLI credentials remain in memory.

`npm run test:ui` uses installed system Chrome; set `FORGE_CHROME_PATH` to a Chrome/Chromium executable elsewhere. No browser installation is performed automatically. Benchmarks use full clones, compression 6, no partial/shallow checkout, bounded child commands, at most two task clients. Commands invoking Git/gh remove `GH_TOKEN` and `GITHUB_TOKEN`. Fixtures are deterministic synthetic bytes generated under ignored `.tmp/`, with recorded seed/hashes. The LFS runner prunes disposable local test services/clients after each repetition; fixture files remain for inspection.

## Production integration prerequisites

`wrangler.jsonc` deliberately has no route, `workers_dev:false`, `preview_urls:false`, a placeholder D1 UUID, disabled public discovery and missing WorkOS configuration. `npm run build` is a **dry run**, not a deploy command. Do not treat these names as provisioned resource IDs.

Needed: verified existing Workers Paid entitlement; authorization for dedicated Artifacts namespace/D1/R2 resources; dedicated WorkOS client/API key/registered callback; exact `WORKOS_ISSUER` matching that environment; ≥32-byte `SESSION_SECRET`; already-existing bucket-scoped R2 S3 credentials. Store provider keys in macOS Keychain and use Worker secrets through an in-memory child process environment/stdin. Never use .env, .dev.vars, token-bearing Git URLs, or logged command arguments. This run created no provider API tokens, rotated no tokens, changed no subscriptions, modified no existing Cloudflare applications/DNS/buckets/DBs, and deployed no endpoint.

Before enabling any live evaluation: verify deny-by-default access, bucket public access off, direct-upload length/signature behavior with actual git-lfs, resource-level budgets/lifecycle, effective native token revocation, Artifacts fork/import completion behavior, and remote load below Workers memory/CPU/subrequest limits. The local results do not establish these properties. There is no production-launch claim.

## API contract

Authenticated `/api/me`; `/api/repos` GET/POST `{name,url?}`; `/api/repos/:id` GET; `/grants` POST `{user,role|null}`; `/visibility` POST `{visibility,confirm?}` (public disabled); `/log?ref=`; `/tree?sha=`; `/file?ref=&path=` (plain text attachment ≤1 MiB); `/tasks` POST `{name}`; `/proposals` GET/POST `{task,base,candidate}`; `/review` POST `{id,status}`; `/check` POST `{contract:'json-parse-v1',commit,paths}`; `/token` POST `{scope}`.

`/lfs/:repo/objects/batch` uses Git LFS media type, SHA256, `basic` only, ≤32 objects. Local-only object PUT; authenticated object GET; verify POST `{oid,size}`. Configure the standard LFS client `lfs.url` to `/lfs/:repo` and provide a real WorkOS access token using an ephemeral `http.extraHeader` configuration. WorkOS tokens accepted as Bearer or as the password of Basic auth; Git author identity never grants access. Browser sessions cannot issue LFS actions without an explicit LFS authorization header.

Native Git tokens last 60 seconds, with canonical write withheld. Native tokens have residual authority until expiry; ACL changes do not immediately invalidate previously minted native tokens. Task fork base LFS manifests are copied within the same tenant as private repository metadata (chunk objects are shared only within that tenant). A cross-tenant fork is rejected. Forged/stale native lifecycle metadata and integration crash recovery need further validation before launch.
