# Roadmap and open decisions

Proposal only. No coding or infrastructure work is authorized by this preparation request.

## Stage 0: current preparation

Private repo, original brief, official competition material, architecture, and feature-by-feature research. No deployable app, runtime config, dependencies, database schema, test suite or benchmark.

## Stage 1: feasibility gates after approval

- Confirm Artifacts entitlement, live 1 GB/32 MB limits, fork billing, token revocation and native Git semantics on a test account.
- Validate public URL import completeness across branches/tags/history; do not equate `branch`/`depth` import with full migration. Validate authenticated private-source path separately.
- Demonstrate enforced canonical publishing despite direct native Git access; prove stale-head rejection and crash reconciliation.
- Validate WorkOS AuthKit on Workers, org switching, repo ACLs, invitations and CLI/Git credential exchange. Identity is external; app hosting remains CF-native.
- Exercise current Sandbox/Containers API version, untrusted CI isolation, cancellation, egress and output limits. Resolve conflicting Workflow concurrency docs with account evidence.
- Build a workload model before promising extreme-load targets or savings.

## Stage 2: lean product MVP

WorkOS login, owned/shared repository lists, private-default create and public publish, repo/file/README/commit browser, public discovery/search, collaborator grants, public GitHub URL code/history import with explicit limitations, task forks and minimal immutable change review/integration. Treat private GitHub import as a prioritized follow-on if feasibility/authorization work is not ready.

## Stage 3: native CI

One supported Linux toolchain first, durable run admission, isolated attempts, real exit codes/logs, bounded R2 outputs, commit status, retries/cancel/watchdog and quotas. Workers-native orchestration; not full GitHub Actions compatibility. Keep deterministic test execution separate from models.

## KIV: hosted cloud agents

Only after the preceding foundations: Agents SDK task state + Sandbox edits/tests + Artifacts task fork + reviewed change proposal. Require explicit promotion from KIV, model/spend budgets, prompt-injection tests, sponsor permissions, recovery receipts and approved publication. No autonomous default-branch merges or production deploys.

## Open questions

| Question | Current position |
|---|---|
| Final name/domain/branding | cf-native-forge is only a working name; no domain purchased |
| Competition eligibility | US/Canada legal-resident restriction needs clarification; do not assume eligible |
| Private repo versus open-source submission | Private now; explicit later license/publication decision required |
| Deadline fit | Docs are not a prototype; no submission-readiness claim |
| Repo size/import fidelity | Live lower Artifacts limits; report unsupported refs/blobs/LFS honestly |
| Public Git clone UX | Artifacts documents repo-token auth; validate anonymous gateway/read-capability approach |
| Branch rules | Native tokens are repo-scoped; canonical publisher until protection can be proven |
| Private GitHub import | Native docs promise public HTTPS; selected-repo App + isolated transfer candidate |
| Search | D1 lexical first; semantic/code search later if justified and ACL-safe |
| Issues/forks/reviews | Minimal coordination suggested; avoid full GitHub product parity |
| Native CI | Explicit command-step contract; no marketplace/Windows/macOS/full Actions claim |
| Availability/performance | Account/runtime tests required; no numerical SLA selected |

## Future acceptance tests

Anonymous/private cross-surface denial; collaborator invite/accept/revoke; public-to-private index/cache handling; URL import ref/object verification; many parallel task forks; conflicting candidates and moved canonical head; token expiry/revoke; duplicate events; lost publisher receipt; CI cancel/cleanup and cache poisoning; quotas and fair scheduling. Report actual raw measurements and cost, not simulated success labels.

## Illustrative competition demo, if eligibility and implementation are approved

Import a small GitHub repo; show public discovery and private collaborator access; launch many independent task clients from one pinned baseline; inspect proposals and real test receipts; integrate one change and reject/rebase a conflicting candidate; show measured workload/cost and recovery evidence. Hosted agents remain KIV: external agents or test clients must be labeled accurately. Finish with reproducible run instructions and an approved license. Do not automate contest submission.
