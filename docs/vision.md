# Braid — vision

**Agents scale. Human attention doesn't.**

Soon every repository will have far more agents working on it than people able to review their work. If every agent change still has to wait in a pull-request queue for a human, people become the bottleneck, and most of what agents could do never lands.

Braid is a forge built for that world. Every change carries its own evidence, and the repository's policy decides which changes need a person. People spend their attention on the few changes that matter, not on every diff.

## Three ideas

### 1. Every task gets a strand

When an issue is filed, or someone wants to test an idea, a **strand** opens: an isolated fork of the repository pinned to an exact base commit. A durable Pi agent picks it up in its own Cloudflare Container and starts working straight away. Hundreds of strands can run at once without touching each other or the canonical history.

When work lands and the history moves, stale strands **catch up on their own**. Changes that don't overlap are rebased inside the Worker in about a second. Real conflicts go back to the agent to resolve. Conflicts get handled by agents *before* a person ever sees them.

By the time someone opens a new issue, an attempt at it is often already waiting.

### 2. Every proposal carries its evidence

An agent's work comes back as an immutable **proposal**: an exact base commit and an exact candidate commit, so review is always about precisely what will land. Alongside the diff, it carries what the agent did and checked: the files it touched, the checks it ran, the conflicts it resolved, and its full run history. Reviewers, and policies, judge evidence rather than reading raw diffs cold.

### 3. Policy decides who needs to look

Each repository sets how much its agents may do alone, and raises that one step at a time:

| Level | What happens to an agent's proposal |
|---|---|
| **0 · Suggest** | A person reviews and braids it in. |
| **1 · Assisted** | A review agent explains the change and its risks, then a person approves with one click. |
| **2 · Autonomous, low risk** | If it passes the policy (small, inside its planned files, checks green, no agent-resolved conflicts), it braids in by itself, with an audit record and one-click revert. |
| **3 · Autonomous, scoped** | Larger changes braid in by themselves in areas the repository has opted in. |

Everything that doesn't pass is sent to a person, with the reason. A person's job becomes the **inbox of changes that need judgment**, not every change.

Every landing goes through the same **fence**: the candidate is published only if the repository head is still its base. However many agents race, exactly one change lands at a time and nothing is silently overwritten. The **braid queue** lands proposals one by one, catching up only the one at the front, so N parallel strands cost N rebases, not N².

## Why now

Frontier models can now do long, multi-step engineering work, and they're arriving on Cloudflare directly ([Claude Sonnet 5.5 on Workers AI](https://developers.cloudflare.com/ai/models/anthropic/claude-sonnet-5.5/), for example). What's missing is the place where that work happens safely: isolated, evidenced, governed, and able to run many tasks at once. Branches and pull-request queues were designed for a handful of humans.

## Why Cloudflare

| Need | Primitive |
|---|---|
| A canonical repository and a cheap, disposable fork per strand | Artifacts |
| Durable agents, a per-repository fence and braid queue | Durable Objects |
| An isolated place for agents to work, with no credentials inside | Containers |
| The models driving agents, the planner and the reviewer | Workers AI |
| API, UI, auth and scoped Git credentials | Workers |
| Metadata and large files | D1 and R2 |

## Where it stands

**Built and running live:**
- Strands, immutable proposals, the fence, the braid queue
- Fast catch-up and agent conflict resolution
- Single agent runs and swarms of up to 6 agents planned onto disjoint files
- Auto-braid for a swarm's clean parts (an early level 2)
- A read-only review agent
- GitHub sign-in and import, issues, and the strand map

**Next:**
- Issues automatically opening a strand and starting an agent
- Evidence attached to every proposal
- A per-repository autonomy policy with an audit log and one-click revert
- A "needs you" inbox that ranks proposals by risk
