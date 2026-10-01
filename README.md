# CF Native Forge

A lean private forge prototype: Workers control plane/UI, WorkOS AuthKit integration, Artifacts Git adapter, explicit repository roles/task reviews, and tenant-scoped R2 LFS chunks using deterministic content-defined deduplication.

**Status: working local storage/collaboration vertical MVP; live Cloudflare deployment and login blocked.** This repository and the synthetic GitHub benchmark repository are **PRIVATE**. No demo/public bucket, subscription change, Actions workflow, hosted agent or competition submission was created.

- **Measured remotely:** private GitHub normal Git versus real local bare Git and a benchmark-only app-backed loopback HTTP task transport, five paired repetitions with identical full commits/checkouts. Native app normal Git is unavailable without the harness extension.
- **Measured locally:** actual git-lfs Batch/basic push/clone/pull/checkouts of five >100 MiB versions × three repetitions; whole-file/fixed/CDC storage, compute and correctness; local UI.
- **Not measured:** Cloudflare Artifacts Git, deployed R2 LFS, GitHub LFS or end-to-end WorkOS login. Existing Wrangler OAuth has artifacts:write and successfully lists namespaces (empty); older scoped-token 401s do not establish absence of access. WorkOS/R2 S3 credentials and confirmed remaining GitHub LFS quota are unavailable.

Read the [actual local app comparison v2](docs/benchmarks/gitflare-comparison-v2.md), the retained [Git/LFS report v1](docs/benchmarks/report-v1.md), [feature/status matrix and commands](docs/implementation.md), [security/storage model](docs/security.md), and [historical primary-source/credential findings](docs/research/build-feasibility.md). Raw JSON/CSV is committed under [docs/benchmarks/raw](docs/benchmarks/raw).

```sh
npm ci
npm run typecheck
npm test
npm run test:worker                      # local workerd auth guards only
WRANGLER_SEND_METRICS=false npm run build  # dry-run only
npm run dev                              # 127.0.0.1:8787, local test identity
npm run test:ui                          # installed Chrome; FORGE_CHROME_PATH override
npm run bench -- --repetitions 3          # real local Git, bounded defaults
npm run bench:comparison -- --help        # harmless; native app + optional HTTP harness
npm run bench:lfs -- --repetitions 3 --mib 112
npm run report
```

Requires Node ≥22.15, Git, git-lfs. Measured using Node 26.5.0 and git-lfs 3.7.0 on macOS ARM64 in Singapore. Remote GitHub benchmarking is explicit: `env -u GH_TOKEN -u GITHUB_TOKEN npm run bench -- --github --repetitions 3`; it creates/reuses only the dedicated private `cf-native-forge-benchmark-*` repository with synthetic files. Credentials use the existing vasanthsreeram CLI keyring. Provider secrets never enter source, .env, Git config or reports.

CDC saves storage, not standard LFS upload bandwidth or model tokens. Range/resume is unsupported (416). Production uploads use implemented direct R2 staging + verified ingest; actual above-limit Cloudflare compatibility is untested. Review decisions do not perform a merge. Native CI currently supports only an actual bounded immutable JSON-parse check; shell/Actions/Sandbox execution and hosted editing agents remain deferred. This is not a complete or production-ready platform.

The [original product brief](docs/product-brief.md), [architecture](docs/architecture.md), [planning README archive](docs/archive/README-planning.md) and [official competition archive](docs/competition/sources/README.md) are retained. The implementation authorization supersedes their docs-only restriction. Competition eligibility/licensing/publication questions remain separate; no license or publication decision was made.
