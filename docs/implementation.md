# Current implementation and verification

Updated 2026-10-02 Singapore. Source, migrated destination and evaluation resources are private. [Raw deployment/provider/migration receipts](core/raw) are separate from the unchanged historical benchmarks. **Real WorkOS sign-in and deployed R2 LFS are blocked by missing dedicated credentials; this is not a fully verified authenticated launch.**

| Feature | Implemented / exercised | Remaining live boundary |
|---|---|---|
| WorkOS login | Real provider authorize/code exchange, PKCE, encrypted cookies and strict client-pinned JWT verifier | Dedicated client/API key/issuer missing; no real login claimed |
| Sessions/orgs | Refresh rotation, org switch, POST/Origin protection, provider revoke/logout; live session and org-membership check on every authenticated request; local deny record | Contract tests use explicitly injected test provider; actual WorkOS lifecycle unverified |
| Ownership/ACL | Personal sharing, selected active org membership plus explicit reader/contributor/writer/admin; no implicit provider admin grant | Live multi-user/org flow requires WorkOS |
| Sharing/invites | Admin grants/list/revoke; seven-day verified-email-bound links, atomic one-time acceptance; revoked/expired/wrong email denied | UI and API tested locally; no email service sends invitations |
| Visibility/discovery | Private default, explicit repo-ID confirmation, task repos private, D1 name search over own/shared/public views, withdrawal and token revocation | Evaluation `ALLOW_PUBLIC=false`; no remote repo published |
| Create/browse | UI and API repo/task creation; immutable tree/file/README/history browsing; nested file UI | Local real bare Git; deployed app binding flow needs real identity |
| Native Git | Actual Artifacts clone/fetch/push, branch/tag fork, read/write scope, revoke, publisher | 12 direct provider checks pass; separate from app-authenticated credential flow |
| URL import | Strict public GitHub identity, recorded refs, native importer then checksum-verified streaming fallback; no depth/branch truncation | Native 40 MB limit measured; app full import unverified through WorkOS; Git-only limitations visible |
| Substantial migration | Maggie-s_Farm_consolidated: full original one-commit history, all 287 objects and 289 checkout files; no drift/LFS/submodules | Direct provider import; no fake D1 owner/adoption |
| Proposals/review/publish | Immutable base/candidate, ancestry/diff, explicit approval, trusted expected-ref publisher, fenced intent/recovery | Local UI/API and actual native atomic ref race verified; deployed authenticated end-to-end flow blocked |
| R2 LFS/dedupe | Standard Batch/basic/verify/download, checksum-verified CDC manifests/chunks, isolation, fork inheritance; local >100 MiB benchmarks retained | Real R2 direct staging credentials absent; no >100 MiB Cloudflare claim |
| Remote deployment | Correct account, dedicated Worker/D1/R2/Artifacts; 13 unauthenticated denial checks pass; bucket public access disabled | Authentication gate only until WorkOS configured |
| CI/Agents/Sandbox/Containers | Excluded; native check API removed; no supported product UI | Not an MVP dependency |

Run with Node ≥22.15, Git, npm and installed Chrome. git-lfs is required only for retained developer benchmarks.

```sh
npm ci
npm run typecheck
npm test
npm run test:worker
npm run test:ui
npm run test:ui:core
WRANGLER_SEND_METRICS=false npm run build
npm run dev                          # 127.0.0.1 only; explicit local test identity
npm run test:deployed                # deployed denials only
```

The local harness has real SQLite/bare Git/filesystem objects and an ephemeral loopback identity. It is absent from the production bundle. Provider auth contract tests inject a test transport/verifier explicitly; production never accepts that injection. The Worker requires WorkOS even for assets and ignores local/dev auth variables. Artifacts binding operations are always remote, so `test:worker` intentionally omits the binding and tests authentication only.

The old benchmark receipts, >100 MiB local LFS results, and five-repetition local HTTP/GitHub comparison remain unchanged under `docs/benchmarks/`. They are not measurements of deployed WorkOS/Artifacts/R2 latency. The added remote Git exercise is functional verification with finite synthetic commits, not a load benchmark.

## Minimal dedicated WorkOS setup

Create/configure an AuthKit application for this forge in the intended WorkOS environment. No unrelated application's identity is reused. Required values:

- Client ID (`WORKOS_CLIENT_ID`).
- Exact JWT access-token issuer (`WORKOS_ISSUER`) for that client/environment.
- Environment API key (`WORKOS_API_KEY`).
- Registered callback: `https://cf-native-forge-evaluation.s-vasanthrojin.workers.dev/auth/callback`.
- Registered logout return: `https://cf-native-forge-evaluation.s-vasanthrojin.workers.dev/auth/login`.

A random session seal secret already exists in macOS Keychain (`cf-native-forge/session-secret`, account `cf-native-forge`) and Worker secrets. No cookie can create a provider identity. Put the dedicated WorkOS values in Keychain with account `cf-native-forge`, under `cf-native-forge/workos-client-id`, `cf-native-forge/workos-issuer`, and `cf-native-forge/workos-api-key`. `python3 scripts/configure-core-secrets.py` installs these existing values via Wrangler stdin; no credential enters `.env`, source/config, Git URL or reports. It fails when a required dedicated value is missing and creates no provider account/key. Organization invitations require an existing active WorkOS membership; repo links do not provision org seats.

## Minimal R2 setup

Already-existing S3 credentials restricted to bucket `cf-native-forge-lfs-evaluation` on account `7efeb52ec5727a903edd8ef7ae8eb925`: access key ID and secret access key with object read/write authority. If unavailable, generation needs explicit user authorization; no account-wide key is created. Store under `cf-native-forge/r2-access-key-id` and `cf-native-forge/r2-secret-access-key`, account `cf-native-forge`; run `python3 scripts/configure-core-secrets.py --r2`. Account/bucket names are already configured. Verify with actual git-lfs before marking this live.

The dedicated bucket has public r2.dev access disabled and a one-day expiry rule for **only** `staging-v1/`. Tenant chunk/manifests are outside that prefix. No naive chunk garbage collection is installed.

## API

`GET /api/me`; `GET /api/repos?q=`; `GET /api/discovery?q=`; `POST /api/repos {name,url?}`; repo GET; grants GET/POST `{user,role|null}`; invites GET/POST `{email,role}` or `{revoke}`; `POST /api/invites/:id` accepts the link for a verified matching email. Visibility POST `{visibility,confirm}`. Repo `/log?ref=`, `/tree?sha=`, `/file?ref=&path=` return bounded safe source text. `/tasks` POST forks a private task. `/token` POST `{scope}` issues a 60-second native read or task-write credential. Canonical write issuance returns 403. If public visibility is enabled, authenticated readers may obtain a short-lived read credential for an explicitly public repo; withdrawal revokes it. Anonymous native token issuance remains denied.

`/proposals` GET/POST `{task,base,candidate}`; `/diff?proposal=` GET; `/review` POST `{id,status}`; `/merge` GET reads intent and POST `{id}` publishes an approved candidate; `/reconcile` POST checks actual refs/fences. Empty canonical seeding uses 40 zeroes as base and follows the same task/proposal/approval flow. `/check` is absent.

`/auth/login` and callback are GET; logout/refresh/organization are POST with exact Origin. LFS paths use SHA256/basic and explicit bearer/Basic access tokens. Git credentials are scoped native capabilities, not Git author emails or the WorkOS server key. API/LFS access rechecks live WorkOS state; native capabilities bypass the app until expiry or explicit provider revoke. ACL/visibility/logout paths revoke tracked tokens; externally revoked WorkOS sessions can leave already-issued native capabilities valid for at most their 60-second TTL.
