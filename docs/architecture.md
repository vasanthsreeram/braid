# Proposed architecture

> Historical planning baseline. Implementation is now authorized; see [current implementation status](implementation.md). Original scope/research is retained below.

Design only. See [Artifacts research](research/artifacts-and-scale.md), [feature research](research/collaboration-discovery-import-auth.md), and [CI research](research/ci-and-deferred-agents.md) for evidence and limitations.

## Boundaries

| Component | Responsibility | Not responsible for |
|---|---|---|
| Workers + static assets | UI, API, auth callbacks, authorization, repo capability issuance | Native shell/test execution |
| WorkOS AuthKit | Human identity, sessions, organizations/memberships | Automatic per-repo ACL or Git push policy |
| Cloudflare Artifacts | Versioned Git repos, fork/import lifecycle, Git smart HTTP and repo tokens | Discovery UI, review product, unproven branch protection |
| Scoped Durable Objects | Integration/admission/job coordination, fencing and ordered transitions | Global mutex for every repo, bespoke Git storage |
| D1 | Repo metadata, ACLs, invitations, review records, searchable projections | One infinitely scalable global write database |
| Queues + Workflows | Buffered event dispatch, durable import/index/CI orchestration | Exactly-once arbitrary external side effects |
| R2 | Build artifacts, log chunks, caches, release/LFS assets if implemented | Replacement for Artifacts Git repo storage |
| Sandbox/Containers | Isolated Linux CI/import execution where necessary | Secrets boundary within a shared sandbox |
| Agents SDK, later | Task conversation/state and supervised repo editing | MVP dependency or authority to grant itself permissions |

## Conceptual flow

Human browser/CLI -> Workers policy layer -> WorkOS identity + authoritative repo ACL -> Artifacts repo capability -> Git HTTPS data plane.

Artifacts push -> supported event subscription -> Queues -> idempotent Workflow -> index/check/job -> D1 result projection + authorized R2 logs/assets.

Independent task -> baseline-pinned Artifacts fork -> scoped write -> immutable change proposal -> review + check evidence -> project integration coordinator -> trusted canonical publisher -> reconcile ref + metadata.

WorkOS is the requested external identity dependency. GitHub is an upstream import source, not the new platform's required code store or CI coordinator.

## Core conceptual entities

User, organization/workspace, membership, team, repository (immutable logical ID + physical Artifacts IDs), repo grant, invitation, credential binding, task/work-repo, change proposal, review, integration intent, import job, pipeline definition, run/attempt/step, artifact manifest and audit event. These are not database schemas or implementation files.

Separate logical project from disposable task forks. Every derived resource carries tenant/project identity and current access policy. Commit SHA and Git author metadata establish content/provenance, not login authority.

## Product flows

1. **Create/share:** authenticated owner chooses namespace/slug; default private; backend creates Artifacts repo and metadata via recoverable intent. Invite intended user and grant only on acceptance. Browse/shared lists enforce current ACL.
2. **Public discovery:** explicit publication enables public repo/README/topic search. Current policy is checked on content and caches; withdrawal suppresses results and queues purge/reindex. Already cloned public history cannot be retracted.
3. **Import URL:** normalize GitHub identity and preflight current 1 GB repo / 32 MB blob constraints. Native Artifacts importer documents public HTTPS remotes, branch/depth inputs, and possible in-progress 409s. Do not silently use a shallow branch import while advertising all history. Full-history/refs and private-source support need validated isolated Git transfer or confirmed native capabilities. Import leaves destination private by default and does not execute workflows.
4. **Review/merge:** proposals bind base and candidate SHAs; checks bind exact candidate/toolchain/pipeline. Canonical head movement invalidates stale acceptance. No ordinary agent canonical write token. Verify ref atomicity; record and reconcile intent across storage boundaries.
5. **CI:** trusted Worker selects immutable commit and permitted pipeline; durable admission claims an execution lease; Queue hands off run ID; Workflow controls dedicated sandbox attempt; test process returns actual exit/logs; R2 stores bounded outputs; finalization is fenced. Imported Actions YAML is not executed automatically.
6. **Future agent (KIV):** agent coordinates a task-specific sandbox and Artifacts fork, edits/test-runs, and produces a proposal. A separate publisher revalidates permissions and exact reviewed patch. Tests and model outputs cannot authorize merge/deploy.

## Security decisions

Native Artifacts Git requires repo tokens. Public product browsing does not imply documented unauthenticated Git clone; validate whether to proxy public Git or offer short-lived read capabilities. Private revocation must reach active native token lifecycle, not only a UI ACL cache. Inventory token revocation APIs and effective behavior before launch.

Repo-scoped write tokens do not prove branch protection. Prefer controlled canonical publishing and task-fork writes until native ref restrictions or an unavoidable enforcement gateway are verified. Never expose account API tokens or WorkOS server keys to clients/sandboxes.

D1 primary/strong-authority reads for sensitive revocation; KV/search projections are not authorization truth. Reject SSRF through imports, submodules, LFS and artifact URLs. Sandbox per trust unit, no shared privileged cache, no production secrets in tests. Separate preview/artifact origin from authenticated UI.

## Efficiency decisions

Small fast acceptance path, streaming payloads, cached immutable public representations, task isolation, sharded namespaces, scoped coordinators, async projections, commit-event coalescing, resource-weighted quotas and expiry for disposable forks. Measure the canonical integration bottleneck separately from parallel task throughput.

No application resources have been provisioned. Pricing, sizing, tenant sharding, supported toolchains, failure recovery, Git compatibility and effective security semantics require implementation experiments after approval.
