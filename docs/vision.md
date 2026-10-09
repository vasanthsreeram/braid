# Braid — vision

**Braid is where parallel work comes together.**

Hundreds of agents and people each work in their own isolated strand: a private fork pinned to a known base commit. Braid weaves those strands back into one clean history. Every change arrives as an exact, reviewable proposal (base commit + candidate commit). Conflicts surface before merge, not after. Merging is a fenced operation that stays safe no matter how many changes race at once. All of it runs natively on Cloudflare: Workers, Artifacts, Durable Objects, D1 and R2.

## Why

Shared branches and pull-request queues were designed for a handful of humans. When many agents push at once, they collide on the same refs, review context goes stale and merges race. Braid treats concurrency as the default case:

- **One canonical repository** holds the human-facing history.
- **One strand per task.** Every agent or person gets a private task fork pinned to a baseline instead of a shared branch.
- **Immutable proposals.** A proposal names exact commits, so review is always about precisely what will land.
- **Fenced integration.** Publishing checks the expected head atomically. Only one racing candidate can win; the rest are told to rebase rather than silently clobbering each other.
- **Context stays attached.** Issues, review discussion and agent run history live next to the strand that produced the change.

## What exists today

Repositories, sharing and invitations, GitHub sign-in and import of a user's public repositories, file/history browsing, issues, task forks, immutable proposals with diffs, review, and stale-head-safe publication on Cloudflare Artifacts. A bounded, read-only Pi reviewer can inspect proposals.

## Next

An agent swarm: split a goal into tasks, run each task as a durable Pi agent in its own Cloudflare Sandbox and task fork, and braid the resulting proposals back into the canonical repository with live progress, conflict handling and review.
