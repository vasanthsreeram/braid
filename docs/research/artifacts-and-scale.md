# Artifacts, Durable Objects, Workers, and extreme-load design

> Historical research snapshot, not the current product status or scope. [Current implementation and verified boundaries](../implementation.md) supersede deployment blockers and proposals below. CI, Agents SDK, Sandbox/Containers and repository execution are excluded.

> Historical planning baseline. Implementation is now authorized; see [current implementation status](../implementation.md). Original scope/research is retained below.

Primary sources accessed 2026-10-01 UTC. Facts describe published capabilities; recommendations describe an unimplemented design. No authenticated Artifacts operation or performance benchmark was run.

## 1. What Cloudflare already provides

**Artifacts** is the specific product referred to as the “CF artefacts thingy.” It offers durable Git-compatible versioned repositories through a Workers binding, REST control plane, and standard Git smart HTTP remote. Repo management includes create/get/list/import/fork/delete and repo-scoped read/write tokens. Each repo isolates history, refs, access, lifecycle and routing. Cloudflare documents synchronous replication across multiple data centers with asynchronous object-storage/snapshot copies. It owns the Git server/storage infrastructure; we should not rebuild this on R2. [A1–A4]

Workers exposes the product API/UI and issues repo capabilities after authorization. A deployed Artifacts binding authenticates backend calls without user-provided CF API tokens. The control-plane Cloudflare token and data-plane Artifacts Git token are different credentials. Standard Git clone/fetch/pull/push uses the exact returned remote and an Artifacts repo token. Git author email is not authenticated identity. [A3, A5]

Git clone/fetch supports protocol v1/v2; push uses v1 receive-pack. Optional capabilities are partial: the published Git protocol page lists `filter` and `include-tag` as unsupported v1 capabilities. Do not promise every advanced Git transport capability or Git SSH. [A5]

Artifacts best practices explicitly recommend one repo per autonomous agent/session/task, forks from trusted baselines, short-lived narrow tokens, and deliberate namespace partitioning. Branches are appropriate for collaborators sharing a lifecycle, not as one giant autonomous-work queue. [A4]

ArtifactFS offers FUSE-mounted working trees and lazy blob hydration for large repositories, with commits/trees/refs first and local blob caching. It is a sandbox/container/VM mechanism, not a Worker filesystem or a substitute for Git semantics. For small repos regular clone is simpler. Resolve apparent blobless/partial-clone differences with the protocol page in a future integration test. No ArtifactFS performance measurement was run. [A6]

## 2. Live limits and source discrepancy

**Use the individually fetched live page, not the older llms-full.txt bundle.** On this access date the bundle says 10 GB per repo, but the live limits page updated October 1 says **1 GB per repo** and **32 MB maximum individual file/blob**. Treat the lower live envelope as the planning constraint and confirm with Cloudflare before accepting large imports. DO's own 10 GB SQLite storage limit does not increase Artifacts' repo limit. [A7, D1]

| Artifacts limit | Live published value |
|---|---|
| Control-plane requests | 2,000 per 10 seconds per namespace |
| Git requests | 2,000 per 10 seconds per artifact |
| Repo storage | 1 GB |
| Individual file/blob | 32 MB |
| Account storage | 1 TB; can be raised on request |
| Repo/namespace count | Unlimited (not unlimited traffic or storage) |
| Namespace name length | 2–63 characters |

These are **request** limits, not completed-push throughput, simultaneous users, pack bytes/s, or a million-agent guarantee. A Git operation may make multiple HTTP requests. Sharding control-plane namespaces does not remove a hot canonical repo's Git limit.

An individual Durable Object is inherently single-threaded, with a documented soft 1,000 requests/s limit dependent on work. SQLite-backed DO storage is bounded per object. Horizontal scale comes from many objects. D1 similarly processes queries per individual database serially and is designed to scale out across smaller databases. Neither a single DO nor one global D1 writer is an extreme-load design. [D1, D2]

## 3. Pricing observations

Artifacts requires Workers Paid. Live pricing says billing starts **October 14, 2026**. Included monthly allowance: first 10,000 operations and 1 GB storage; additional operations $0.15/1,000 and storage $0.50/GB-month. Storage measures average daily peak across a 30-day period; replicas do not add storage charges, and repos remain until explicitly deleted. [A8]

Cost model must include Artifacts operations/storage plus Workers requests/CPU, DO requests/storage, D1 rows/storage, Queues, Workflows, R2 operations/storage, Linux execution and WorkOS. Do not promise fork copy-on-write savings or constant-time forks without provider guarantees/measurement. Operation-level billing and retained-fork storage need account-level observations before budget projections. High activity may be efficient technically yet costly without quotas.

## 4. Proposed scaling mechanisms

- Keep Git clone/fetch/push on Artifacts' data plane. Avoid proxying every pack through a custom DO; proxy only when required by enforcement/product URL design, with streaming and measured overhead.
- Canonical repo per project; forked work repo per independent task from a pinned base SHA. Separate lifecycle and tenant ownership. Map logical project/workspace IDs to physical namespace/repo IDs in metadata.
- Namespace partition by environment, tenant/shard and workload class. Stable mapping, admission budgets and migration plan; don't create ad hoc random namespaces just to evade service policy.
- Per-project integration coordinator for small, authorized merge transitions. Partition independent coordination objects; do not route all pushes/index events through a global lock.
- Coalesce indexing/CI on superseded commits when allowed, but retain real history and provide explicit skipped/superseded statuses. Do not run a full index or pipeline for every byte-level edit.
- Queues absorb bounded bursts; Workflows manage durable long-running imports/builds. At-least-once events require dedupe, receipts, outbox/reconciliation and bounded retry/DLQ policy.
- Public metadata/immutable rendering can be cached; private access and current revocations must be enforced. D1 indexes queryable project metadata, not the raw Git object store. R2 holds large logs/build outputs/assets; these are different from Cloudflare Artifacts repositories.
- Enforce tenant, repo, credential and job quotas: active tasks, source size, retained forks, outstanding events, CPU, sandbox count, output bytes, and spend. Fairness protects interactive humans from agent bursts.
- Fork expiry/cleanup is an explicit lifecycle; retain accepted work/provenance before deleting temporary repos. Preserve user-selected history and avoid blanket retention policies.

## 5. Safe integration under contention

Proposal references canonical base SHA, task repo ID, candidate SHA and required test evidence. Coordinator validates authorization, exact candidate and current canonical ref; integration must reject stale heads or recompute/retest, not force-push over concurrent work. Use supported Git compare-and-update semantics and verify actual atomic behavior in a spike. A DO lock alone cannot protect a canonical branch that accepts direct external writes.

**Critical gap:** Artifacts docs describe repo-scoped `read`/`write`, not branch/path scoped tokens or built-in forge branch protection. A canonical write token may bypass product review through direct Git. Initial safe design is read-only canonical access for ordinary agents, task-fork write only, and a trusted publisher holding canonical write. Human direct canonical write must be a separately governed policy. Investigate server hooks/ref controls before promising enforced protected branches.

Across Artifacts, DO state, metadata and R2 there is no documented global transaction. Use fenced/idempotent intent, reconcile observed refs, and recover incomplete metadata updates. Never treat a queued event as proof a merge happened.

Artifacts event subscriptions document repo creation/deletion/fork/import events and repository-level push/clone/fetch/token events. Push includes ref, before/after and commit information with truncation flags. Verify subscription coverage/cardinality and event delivery behavior at scale; do not assume an account-level repo lifecycle subscription delivers every repository push. Truncated events are triggers, not full source truth. [A9]

## 6. Validation plan, not results

Test many independent repos separately from one hot project, with real Git request accounting. Measure p50/p95/p99 clone/fetch/push/fork/token/merge times; completed operations/s, transferred bytes, conflict/retry/429/overload rates, queue age, cold starts and cost per accepted change. Compare a shared-branch baseline with task forks under the same workload; publish hardware/account region/plan, repo sizes, client concurrency and raw results.

Fault tests: duplicate/delayed events, ref movement after approval, DO restart during publication, uncertain successful push, token expiry/revocation, blob/repo size limit failures, tenant floods, orphan fork cleanup and public-to-private cache leakage. Require no lost accepted commits, no unauthorized cross-repo write, and no double finalization. Multi-region clients do not prove every repo executes simultaneously in every region.

No target numbers are selected or measured here. “Absolute efficiency” becomes a testable latency/throughput/cost envelope, not an absolute marketing claim.

## Sources

- [A1] https://developers.cloudflare.com/artifacts/
- [A2] https://developers.cloudflare.com/artifacts/concepts/how-artifacts-works/
- [A3] https://developers.cloudflare.com/artifacts/api/workers-binding/
- [A4] https://developers.cloudflare.com/artifacts/concepts/best-practices/
- [A5] https://developers.cloudflare.com/artifacts/api/git-protocol/
- [A6] https://developers.cloudflare.com/artifacts/guides/artifact-fs/
- [A7] https://developers.cloudflare.com/artifacts/platform/limits/ (live lower limits override bundled snapshot for planning)
- [A8] https://developers.cloudflare.com/artifacts/platform/pricing/
- [A9] https://developers.cloudflare.com/artifacts/guides/event-subscriptions/
- [D1] https://developers.cloudflare.com/durable-objects/platform/limits/
- [D2] https://developers.cloudflare.com/d1/platform/limits/
- [R1] https://developers.cloudflare.com/r2/reference/consistency/ (strong direct storage consistency does not imply cached URLs immediately reflect deletion)

Artifacts overview, live limits/pricing/import/model pages, DO/D1/R2 limits/consistency were fetched individually. Other Artifacts APIs/guides were read from the official llms-full.txt doc bundle, which has demonstrated drift; validate those individual pages and actual account behavior before implementation. Account entitlements, token revocation behavior, fork storage costs and atomic merge mechanisms remain untested.
