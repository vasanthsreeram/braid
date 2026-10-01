# Product brief

> Historical planning baseline. Implementation is now authorized; see [current implementation status](implementation.md). Original scope/research is retained below.

Captured from Vas's request on 2026-10-01. These are requirements and design intent, not implemented functionality.

## Vision

Follow the Cloudflare Durable Objects + Workers approach to create a GitHub-like ecosystem without the fluff, fully Cloudflare-native except the explicitly requested WorkOS identity provider. Preserve GitHub's useful jobs: people discover projects, collaborate, and share repositories. Make it practical to move projects from GitHub through a URL.

The motivating hypothesis is that very high AI-agent push activity stresses current collaboration platforms. No causal incident analysis or workload measurement has established that claim here. The concrete engineering objective is efficient, predictable service under bursty Git writes, clone/fetch traffic, indexing, and CI events.

## Requirement register

| ID | User requirement | Interpretation / status |
|---|---|---|
| R1 | Prepare a repo; keep it private | Private GitHub planning repository; never automatically publish |
| R2 | Do not code anything | Markdown research/planning and official source documents only |
| R3 | Include docs from the competition page | Preserve official page Markdown and rules PDF; summarize obligations with source links |
| R4 | Cloudflare DO + Workers approach | Cloudflare-native control plane, scoped coordination, Artifacts Git data plane |
| R5 | Extreme loads with absolute efficiency using CF artifacts | Artifacts-first, isolation/sharding, backpressure, bounded spend; no absolute or benchmark guarantee |
| R6 | Project discovery | Public project profiles, README, topics, basic lexical search; private repos never leak into Explore |
| R7 | Collaboration / shared repos | Collaborator invitations, explicit repo roles, branches/forks, minimal review and safe merge |
| R8 | Public and private repos | Private default; explicit publication; access control on browse, Git and derivative assets |
| R9 | Easy GitHub URL import | Public import first; private import via selected-repo GitHub App or isolated authenticated Git job after validation |
| R10 | GitHub Actions-like capabilities through Workers | Native CI product, Workers orchestration; Linux test commands need Cloudflare Sandbox/Containers |
| R11 | KIV Agents SDK + Sandbox cloud agents | Future agents edit a task repo, run tests, and propose a reviewed change; explicitly deferred |
| R12 | Whole thing CF native | Workers, Artifacts, DO, D1, Queues/Workflows, R2, Sandbox/Containers as justified; no non-CF app server/database/runner |
| R13 | WorkOS auth | WorkOS AuthKit for human identity and org membership, separate per-repo ACL and Git credentials |
| R14 | Research every feature and commit findings | Source-linked capability/limitation research, recommendations clearly separated from facts |

## Lean core

Repo list/create/import, file and README browser, commits/refs, public discovery, sharing, diff/review/merge, basic native checks and durable job logs. Use a small coherent collaboration flow, not a giant feature checklist. Lightweight issues may support coordination but are a suggested feature, not an explicit request to rebuild every GitHub issue/project tool.

## Concurrency concept

Keep one canonical project repo for human-facing history and reviewed integration. High-rate autonomous work gets task/session-specific forked repos pinned to a baseline. Review proposals reference immutable source commit and baseline; integration is a deliberate, fenced operation. Ordinary shared branches remain valid when collaborators share a lifecycle. Do not use a single branch or shared repo as the universal agent queue.

External agents can use Git/API credentials before hosted autonomous agents exist. Supporting concurrent external task workflows does not require the KIV in-product agent feature.

## Non-goals now

Implementation, deployment, purchasing/provisioning, competition submission, making source public, choosing a release license, full GitHub social graph, marketplace, every Actions feature, enterprise SSH hosting, arbitrary huge repos, autonomous main-branch writes, or production deployment agents.

## Definition of success for this preparation

A verified private repository containing the original requirements, competition material, source-linked research on every requested feature, a proposed architecture and explicit open risks. All scale targets and experiments are proposals; none are portrayed as measured results.
