# CF Native Forge

A lean, Cloudflare-native place to host, discover, and collaborate on Git projects, designed for heavy human and AI-agent activity without recreating all of GitHub.

**Working name:** CF Native Forge. **Status:** planning and research only. **Repository:** private. No application code, runtime configuration, deployment, or benchmark has been created.

## Product direction

- Cloudflare **Artifacts** owns Git storage and the Git-compatible data plane.
- **Workers** serves the product and control-plane APIs. **Durable Objects** coordinates small, contention-sensitive units of work, not one global bottleneck.
- Public/private repositories, shared access, browsing, discovery, and lightweight change review are core product features.
- Import projects from a GitHub URL with transparent migration boundaries.
- Native CI uses Workers orchestration and Cloudflare-hosted isolated Linux execution where needed. Ordinary Workers are not Ubuntu GitHub Actions runners.
- **WorkOS** supplies authentication. Repository authorization remains an explicit platform responsibility.
- **KIV:** Cloudflare Agents SDK + Sandbox agents that edit repos and run tests. Not part of the initial implementation scope.

## Read the docs

| Document | Contents |
|---|---|
| [Original requirements](docs/product-brief.md) | All ideas from Vas, priorities, assumptions, and non-goals |
| [Competition brief](docs/competition/brief.md) | Rules, deadline, judging, privacy/licensing and eligibility blockers |
| [Architecture](docs/architecture.md) | Proposed Cloudflare-native boundaries and concurrency flows |
| [Artifacts and scale research](docs/research/artifacts-and-scale.md) | Verified capabilities, live limits, costs, hot spots, validation plan |
| [Collaboration, discovery, import, auth](docs/research/collaboration-discovery-import-auth.md) | Feature research, permissions, WorkOS, GitHub migration, search |
| [CI and deferred agents](docs/research/ci-and-deferred-agents.md) | Workers versus Linux execution, isolation, native CI, KIV agents |
| [Roadmap and open decisions](docs/roadmap.md) | Staged scope and experiments, without implementation |
| [Source archive](docs/competition/sources/README.md) | Original competition page and official PDF |

## Important competition constraints

The official rules restrict eligibility to adult legal residents of the **United States or Canada**. Do not assume eligibility; clarify with Cloudflare before pursuing entry.

The page asks for open-source code, a 5–10 minute demo, and run instructions by **October 14, 2026**. Rules require Workers + Artifacts, concurrent multi-agent changes, and an approved open-source LICENSE. This private, docs-only repo is **not a submission-ready entry**. No license or publication decision has been made. Do not make this repository public or submit it without Vas's explicit approval.

The user-supplied motivation about GitHub struggling with millions of AI pushes is recorded as a **hypothesis**, not an established causal finding. Evaluate our own workloads rather than claim unmeasured superiority or attack competitors.
