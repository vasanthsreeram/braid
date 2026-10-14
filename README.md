# Gitrah

A private forge with a Workers API/UI, WorkOS AuthKit identity, Artifacts Git, explicit repository sharing, reviewed task publishing, and tenant-scoped R2 LFS deduplication.

**Deployed at https://gitflare.lintlabs.org with GitHub-only sign-in and authentication enforced. The AuthKit session-token issuer/client contract and connected repository picker are implemented. Real account login and app imports remain blocked by human GitHub sign-in and dedicated token-returning OAuth app setup; deployed R2 LFS remains separately unverified.** The GitHub source and all remote evaluation destinations remain private. No native CI, Agents SDK, Sandbox, Containers, model features, or repository-code execution is part of this product.

Verified:

- Real Artifacts clone/fetch/push, full branch/tag fork, read-only credentials, revocation, checksum-verified streaming publisher, and a concurrent expected-head race with one accepted candidate.
- Full private migration of [Maggie-s_Farm_consolidated](https://github.com/vasanthsreeram/Maggie-s_Farm_consolidated): original hash `45fb674a919bcbfcb521e9cea1bf1cffd1a8a397`, all 287 reachable objects, its one full-history commit, and all 289 checkout files match. Source refs remained unchanged. This was a **direct provider test**, separate from the WorkOS-gated app importer.
- Local repository/file/README/history/search UI; verified-email invitation acceptance/revocation; explicit roles; private/public withdrawal; session refresh/logout/revocation contracts; immutable diffs; approved publishing; races and recovery fences. Provider identity tests use labeled test doubles, not fabricated WorkOS success.
- Deployed private API denials, actual GitHub/PKCE redirect and GitHub login page. These are pre-login checks, not proof of a real account callback, connected repo listing or app imports.

[Latest GitHub auth, picker, live blockers and import preflight](docs/github-auth/result.md) · [Historical domain/contribution evidence](docs/auth/result.md) · [Core feature matrix](docs/implementation.md) · [deployment/migration evidence](docs/core/result.md) · [security model](docs/security.md). Prior [benchmark reports and raw receipts](docs/benchmarks/gitflare-comparison-v2.md) are retained unchanged; their local-only limitations still apply. Developer tests and benchmark shell scripts are not a product CI runner.

```sh
npm ci
npm run typecheck
npm test
npm run test:worker                # local workerd authentication denials
npm run test:ui                    # system Chrome, local harness
npm run test:ui:core               # 1440px: review/merge/files/profile UI
npm run test:ui:mobile             # 390px: same real Git workflows
npx tsx scripts/ui-github.ts       # 390/1440 connected picker, local provider fixtures
npm run test:deployed:browser      # TLS, gate, GitHub routing and login blocker
WRANGLER_SEND_METRICS=false npm run build  # Worker dry run
npm run dev                       # loopback-only filesystem/bare-Git harness
npm run test:deployed              # read-only deployed denial verification
```

Node ≥22.15, Git and installed Chrome are required; git-lfs is needed for the retained LFS benchmarks. The native importer has a measured **40 MB full-history import limit**. The app tries it first and can stream a complete ordinary-Git pack to an empty private destination (128 MiB pack bound, 512 branch/tag refs). It never substitutes a shallow import. Artifacts still enforces its 32 MB blob / 1 GB repository limits. MFweb-app and That_Aquarium_Webapp were rejected at preflight because each history contains an oversized blob.

CDC reduces stored LFS bytes, not standard LFS upload bandwidth. Live direct R2 staging needs bucket-scoped S3 signing credentials; no >100 MiB Cloudflare LFS success is claimed. Range/resume remains unsupported. No provider secrets are in source, configuration, reports, or Git URLs. Only the Gitflare subdomain was attached; sibling sites, existing WorkOS apps, subscriptions and source visibility were unchanged.

Contribution profiles count unique reachable commit IDs by author date in UTC, matching only the signed-in account’s current verified email. Git authorship is self-declared, so an email match does not prove account ownership. Reads recheck repository and inherited task grants; fork/import copies count once. The profile supports commits for a rolling 365 days, with explicit bounded-scan and backfill limitations. See [definition and limitations](docs/auth/result.md).
