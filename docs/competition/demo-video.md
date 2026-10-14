# Demo video plan

The submission needs a 5–10 minute demo, open source code and run instructions by **Oct 14, 11:59 PM PDT**. Target **8 minutes**, which leaves room to trim without falling under 5.

The video has one job: make a judge believe **"agents scale, human attention doesn't"**, and that Braid is the answer, using real footage from the live site.

How the judging weights map to the video:

| Criterion | Weight | Where the video earns it |
|---|---|---|
| Originality and prototype quality, agent-oriented collaboration | 50% | Issues that start their own agents; policy-governed auto-braid; everything shown running live |
| Multi-agent concurrency, coordination, context, review, conflicts | 25% | Six strands at once, a real race at the fence, catch-up, evidence on each proposal |
| Ease of use and UX | 25% | The person's whole job fits on one "needs you" screen |

---

## 1. What must exist before recording

The vision leads with things that aren't built yet. Each one needs a minimum version that works on camera.

### Must have (build Oct 10–12)

| # | Feature | Minimum for the video | Builds on |
|---|---|---|---|
| B1 | **An issue starts an agent** | Filing an issue (with a repo setting or a label like `agent`) opens a strand and starts an agent run with the issue as its goal. The issue shows a live link to its strand, and the proposal links back to the issue. | The existing agent start path and `issues.ts` |
| B2 | **Evidence on the proposal** | The proposal page shows an evidence panel: files touched vs. planned, the check command run in the container and its pass/fail output, any conflicts the agent resolved, and the number of model turns. | The agent run journal; one `npm test` / `node --test` step before commit |
| B3 | **Autonomy policy per repository** | A settings card with level 0–2 and the level 2 rules: max changed lines, allowed paths, checks must pass, no agent-resolved conflicts. Generalize today's swarm auto-braid to use it for any agent proposal, including those from issues. | The existing auto-braid and braid queue |
| B4 | **Audit and revert** | Every automatic braid-in writes an audit entry ("braided by policy L2: 14 lines, 1 file, checks passed"), with a **Revert** button that opens a revert proposal through the same fence. | The fence and proposals |
| B5 | **The "Needs you" inbox** | One per-repository list: proposals held for a person, each with the reason ("touches `src/auth/`", "agent resolved a conflict", "checks failed"), plus what landed automatically today. | Proposals and the audit log |

### Nice to have (only if B1–B5 are solid by Oct 12 evening)

- **N1:** A model picker that includes Claude Sonnet 5.5 on Workers AI for the agent and reviewer. Today it's `gpt-oss-120b`. Only switch if a test run is reliable.
- **N2:** A labeled load test: 100+ simulated agents racing proposals at the fence, showing exactly one winner per round and a linear history. Record the terminal output and a graph.
- **N3:** Review agent level 1: the explanation is shown inline on the held proposal.

### Hard constraints to design around

- **Containers have no Internet.** The demo repo's checks must run with **zero installed dependencies**, for example a plain-JS app plus `node --test`. **Verify Node is present in the managed container image first.** If it isn't, use a shell or Python check that is.
- Run caps are 6 active runs per repository and 20 per repository per day. Use a fresh demo repository for each recording take, or raise the cap for the demo repository.
- An agent run takes minutes. Record it in real time, then speed it up in editing **with an on-screen label** ("4× speed").

---

## 2. The demo repository

Create a small, visual repository so changes are easy to see. Suggested: **`braid-demo-shop`**, a single-page product list (HTML/CSS/vanilla JS) with a `node --test` suite of about 10 tests and an obvious `src/auth/` folder that the policy protects.

Prepare these 6 issues, each designed for a specific outcome on camera:

| Issue | Expected outcome | Shows |
|---|---|---|
| 1. "Typo: 'Recieve' on the checkout button" | Small change, checks pass → **auto-braids under L2** | Autonomy |
| 2. "Price shows `$9.9` instead of `$9.90`" | Small fix plus a test → **auto-braids** | Evidence: a new test passing |
| 3. "Add a 'Sort by price' button" | Touches `app.js`, same file as issue 4 | Concurrency |
| 4. "Add a 'Filter in stock' toggle" | Touches `app.js` too → loses the race at the fence → **catches up**, conflict resolved by the agent → **held for a person** (the policy refuses agent-resolved conflicts) | Fence, catch-up, conflict handling |
| 5. "Session should expire after 30 minutes" | Touches `src/auth/` → **held** with reason "protected path" | Governance |
| 6. "Idea: would a dark mode work?" | An experiment strand; even if checks fail, it's **held** with failing evidence | Testing ideas cheaply |

**Rehearse this end to end at least twice.** Agents aren't deterministic. If one misbehaves, reword the issue until it behaves reliably. That's fine, because the footage stays real.

---

## 3. Script and shot list (about 8:00)

Recording sources: **[B]** the live site in the browser (gitflare.lintlabs.org), **[T]** terminal, **[S]** a slide or title card, **[V]** voiceover only.

| Time | Section | On screen | Voiceover (draft) |
|---|---|---|---|
| 0:00–0:30 | **Hook** | [S] Title "Agents scale. Human attention doesn't." Then a counter: "1 reviewer · 6 issues · 6 agents" | "Soon every repository will have more agents than people who can review their work. If every change waits in a pull-request queue for a human, people become the bottleneck. Braid is a forge built for that." |
| 0:30–1:00 | **The three ideas** | [S] Three cards: Every task gets a strand · Every proposal carries evidence · Policy decides who needs to look | One sentence each. |
| 1:00–1:40 | **Setting the policy** | [B] Repo → Settings → Autonomy. Choose **Level 2** and show the rules: ≤ 30 lines, not `src/auth/`, checks pass, no agent-resolved conflicts | "This repository allows agents to land small, safe changes on their own. Everything else comes to me." |
| 1:40–2:40 | **Filing issues** | [B] File issues 1–6 quickly (or show them filed and cut to the list). Each issue immediately shows "Strand opened · agent working" | "I'm just filing issues, the way I normally would. Each one opens its own strand, and a durable agent starts work in its own Cloudflare Container." |
| 2:40–3:30 | **Six strands at once** | [B] The strand map: six strands branching off the same base. Then the Agents tab with live per-run status. Sped up, labeled. | "Six agents, six isolated forks, all pinned to the same commit. None can touch the main history, and none can see each other." |
| 3:30–4:30 | **Auto-braid with evidence** | [B] Issue 1 lands, then issue 2. Open issue 2's proposal: the diff, the **evidence panel** (new test passes, 1 file, inside its plan), and the audit entry "braided by policy L2" | "This one landed without me. Not because it's trusted blindly, but because its evidence passed the policy: it's small, inside its plan, and its tests pass, including the test it wrote." |
| 4:30–5:40 | **The race and catch-up** | [B] Issues 3 and 4 both propose. The strand map shows 3 braiding in. 4 is refused by the fence ("head moved"), catches up, and the agent resolves the conflict in `app.js`. A new proposal supersedes the old one. | "Two agents changed the same file. The fence lets exactly one land. The other isn't overwritten and isn't broken: Braid catches it up, and the agent resolves the conflict itself, before I ever look. But it had to resolve a conflict, so the policy sends it to me." |
| 5:40–6:40 | **The "Needs you" inbox** | [B] The inbox: 3 held items with reasons (conflict resolved, protected path, checks failed), plus "2 landed automatically." Open issue 4: read the evidence, approve, braid in. Glance at 5 and leave it. Open 6: failing check output, and the idea is answered. | "This is my whole job now: three decisions, each with its reason and evidence attached. Six issues; I made three calls." |
| 6:40–7:00 | **Revert** | [B] On issue 1's audit entry, click **Revert**. A revert proposal goes through the same fence. | "Autonomy is only safe if it's reversible. Every automatic landing is one click from undone." |
| 7:00–7:40 | **How it's built** | [S] The architecture diagram (Artifacts, Durable Objects, Containers, Workers AI, D1/R2). Optional N2: a terminal clip of the load test, labeled "simulated agents" | "Every strand is an Artifacts fork. Each repository's fence and braid queue is a Durable Object, so N strands cost N rebases, not N squared. Agents run in Containers with no credentials inside. Every Git request gets a 60-second token for its own strand." |
| 7:40–8:00 | **Close** | [S] "Braid: where parallel work comes together." Plus the repository URL and the live URL | "Agents do the work. Evidence makes it reviewable. Policy decides what needs you. That's Braid." |

---

## 4. What to screen-record (capture list)

Record each clip separately, in this order, so editing is simple.

| Clip | Source | Notes |
|---|---|---|
| C1 | Autonomy settings, set to L2 | Slow, deliberate mouse movement |
| C2 | Filing issues 1–6 | Paste the text from a prepared file; trim typing in editing |
| C3 | The issue list with "strand opened" badges | Hold 3 seconds |
| C4 | The strand map while 6 agents work | **Record the whole run in real time** (10–20 min) and speed it up later |
| C5 | The Agents tab with live statuses | Same session as C4, a second take |
| C6 | Issue 2's proposal: diff, evidence panel, audit entry | Scroll slowly |
| C7 | Issues 3 and 4: the fence refusal, catch-up, superseded proposal | The most important clip. Get two clean takes. |
| C8 | The inbox, then the approve and braid-in on issue 4 | |
| C9 | Issue 6's failing evidence | |
| C10 | Revert on issue 1 | |
| C11 | Terminal: `npm test`, plus the N2 load test if built | Large font (18pt+), dark theme |
| C12 | Backup B-roll: strand map in dark mode, mobile width (390px) | For cutaways |

**Recording setup:**
- Record at 1920×1080 (or 2560×1440, downscaled), browser at 110–125% zoom, with bookmarks, extensions and notifications hidden (turn on Do Not Disturb).
- Use one browser profile signed into the demo account only. Hide the URL bar if it shows anything private.
- Use Screen Studio or a similar tool for automatic cursor zoom; QuickTime works as a fallback.
- Record the voiceover separately afterwards, from the script above, then cut the footage to the voice.
- Speed-ups get an on-screen "N× speed" label, and simulated load is always labeled as simulated.

---

## 5. Schedule

| Date | Work |
|---|---|
| **Oct 10 (Sat)** | Vision and README reframed ✅. Build B1 (issue → agent) and B2 (evidence). Check that Node is in the container. |
| **Oct 11 (Sun)** | Build B3 (policy), B4 (audit and revert), B5 (inbox). Deploy with `npm run deploy`. |
| **Oct 12 (Mon)** | Create the demo repository and issues; two full rehearsals; fix whatever breaks. N1 or N2 only if everything is green. |
| **Oct 13 (Tue)** | Record clips C1–C12 (two takes of the critical ones), voiceover, rough cut. |
| **Oct 14 (Wed)** | Final edit and captions. Submission checklist below. **Submit by midday PDT**, not at 11:59 PM. |

---

## 6. Submission checklist

- [ ] **Eligibility.** The rules require legal residence in the US or Canada. Resolve this before anything else (git-competition@cloudflare.com).
- [ ] The repository is public, or judges have access. `LICENSE` is present (Apache-2.0) ✅
- [ ] The README has run instructions (quick start ✅) and a link to the video.
- [ ] Video: 5–10 minutes, uploaded (unlisted YouTube or similar), with captions.
- [ ] The live site works for a judge, or the README says how to get access (it's private behind GitHub sign-in today).
- [ ] No claims about GitHub that can't be backed up; neutral, testable language only (rules section on competitor statements).
- [ ] Final commit tagged, for example `submission-2026-10-14`.

---

## 7. Fallbacks

- **An agent misbehaves on camera:** keep the best take from the rehearsals. Every take is real footage, so use whichever worked.
- **Workers AI is slow or down on recording day:** record on Oct 12 during rehearsal as a backup.
- **B3–B5 aren't finished:** fall back to today's swarm auto-braid (already a working level 2). Show the policy as a swarm option and the inbox as the proposals list filtered to "held." The story still holds.
