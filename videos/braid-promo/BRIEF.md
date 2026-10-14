---
workflow: product-launch-video
flow: automation
storyboard: yes
message: "Braid lets hundreds of agents work in parallel and weaves their changes into one clean history, safely."
destination: youtube
aspect: 1920x1080
language: en
audience: hackathon / competition judges and developers building with AI agents
length: 60s
angle: agent-swarm chaos → calm
capture: none
---

## Intent

A fun, energetic, "nice af" launch promo for **Braid**: where parallel work comes together.
Hundreds of agents and people each work in their own isolated strand (a private fork pinned
to a known base). Braid weaves those strands back into one clean history: every change arrives
as an exact, reviewable proposal (exact base + exact candidate commit), conflicts surface before
merge rather than after, and merging is a fenced operation that stays safe no matter how many
changes race at once. Runs natively on Cloudflare: Workers, Artifacts, Durable Objects.

Story: open on 100+ agents slamming one shared repo and everything breaks; then Braid gives each
its own strand, proposals line up, fenced merge braids them into one clean history; close on a
live counter (100+ agents braided into one repo) and "built on Cloudflare".
The competition weights agent collaboration and concurrency at 75% of the score.

## Customizations

- Voiceover via the user's LiteLLM gateway (`qwen-tts`, https://llm.lintware.com/v1/audio/speech), energetic read.
- Music bed plus sound effects; fun, high-energy pacing.
- Motion graphics only, no UI capture. Carry the product's branch-and-merge / braid strand motif.

## Notes

- Source: product vision pasted by the user (README/docs proposal), repo /Users/vas/Documents/cf-native-forge.
- Voice must be Qwen TTS (user rule): no Kokoro / HeyGen voices.
- Frame 5 shows issue auto-triage + agent-ready proposal as a LIVE feature (user's choice, 2026-10-09). As of today the code has review-agent findings auto-filed as issues, but not auto-triage or agent-opened proposals (roadmap: write agents deferred). Must ship before submission.
- Technical terms to weave in on screen: Artifacts forks pinned to base SHA, immutable proposals (base + candidate SHA), Pi Durable review agent in a Durable Object on Workers AI gpt-oss-120b with path:line@sha findings, fenced merge with compare-and-swap on the ref, D1.
- Issue triage uses Clef-flash (Workers AI decision model family; blog.cloudflare.com/clef-decision-models, 1 Oct 2026). Sourced latency: Clef-flash median 38.8 ms / p95 122.4 ms; Clef median 209.3 ms / p95 238.6 ms (Cloudflare's 43-eval benchmark). Non-autoregressive: prefill once, score all schema options in parallel. On-screen claim: "39 ms".

---

## v3 — 2026-10-10 (follow-on version, same workflow and aspect)

User feedback on v2: "more punchy light theme nicer looking and the story line has to be better … it has the technical terms but not the implications".

- **Theme:** light "Braid Cream" (cream #faf7f2, ink #1f1a15, strands orange #e8590c / saffron #c99a2e / umber #7a5c46); `frame.md` rewritten (v2 spec in `.archive-v2/`).
- **Length:** ~54s, 12 short scenes, hard cuts snapped to music beats, kinetic type, one idea per screen.
- **Story:** implications first, tech as small mono proof captions. Hook (100 agents / your repo can't) → pain → Braid → own strand → main stays clean → catches itself up → review only what matters → 113 s swarm → 100-strand queue → vision → Cloudflare + URL.
- **Numbers:** only from cf-native-forge-gh README Scale section / docs/implementation.md (113 s 6-agent swarm, 9 fast catch-ups at 2.4–2.9 s, 99/99 braided from a 100-strand queue, 30-way fence race → 1 winner).
- **Dropped:** Clef-flash issue triage frame (not shipped per README).
- **Voice:** Qwen TTS `qwen-tts` voice `longanlingxin` via llm.lintware.com, silence-trimmed, atempo 1.12 (1.05 on the close), loudnorm. Music bed `assets/bgm/bed-v3.wav` = v2 bed trimmed, faded, sidechain-ducked under VO.
- **Captions:** skipped; the kinetic headlines carry each line.
- Output: `renders/video-v3.mp4`. v2 sources archived in `.archive-v2/` (index, frames, captions, script, storyboard, frame.md).

---

## v4 — 2026-10-10 (follow-on version, same workflow and aspect)

User direction: reframe around agentic development and governance after a judge's-eye review of the competition criteria (50% originality/prototype for agent collaboration, 25% concurrency/conflicts/review, 25% UX).

- **Message:** "Agents scale. Your attention doesn't." Every task gets a strand, every change carries its evidence, policy decides what needs a person.
- **Length:** ~67s, 14 scenes, same Braid Cream look (`frame.md` unchanged).
- **Story:** agents scale → attention doesn't → 100 agents / 100 PRs / one of you → Meet Braid → issue opens a strand, agent on it → own sandbox, six at once → evidence → policy L2 auto-braid → race at the fence + catch-up + agent fixes conflict → needs-you inbox (6 issues, 3 calls) → audit + one-click revert → 100-strand queue proof → "Agents do the work. Policy decides what needs you." → lockup.
- **Shown as live but NOT yet built (user's choice, 2026-10-10; must ship before the Oct 14 submission):** issue auto-opens a strand + agent (frame 5), evidence panel on proposals (frame 7), per-repo autonomy policy L2 (frame 8), needs-you inbox (frame 10), audit log + one-click revert (frame 11). Built today: strands, sandboxed container agents, swarms, fence, catch-up, agent conflict resolution, swarm auto-braid, queue numbers.
- **Voice:** Qwen TTS `qwen-tts`, voice `longanlingxin`, same processing as v3. Line 12 reworded "queued" → "lined up" (TTS made "queued" sound like "cute").
- **Build:** `.build/gen-v4.mjs` regenerates scenes (`compositions/v4/`), `index.html` and the ducked bed `assets/bgm/bed-v4.wav`. v3 sources in `.archive-v3/`.
- Output: `renders/video-v4.mp4`.

---

## v5 — 2026-10-10 (follow-on version, same workflow and aspect)

User feedback on v4: "we need to add more vocabulary on the exact type of technology we are using … artifacts, CLEF decision model and so on".

- **Length:** ~80s, 15 scenes. Same story and look as v4.
- **New scene 05:** file an issue → Clef-flash decision model scores every triage label in one pass (agent-ready 0.94) → 38.8 ms median (Cloudflare's published figure, shown as "39 ms").
- **Voiceover names the tech:** Clef (triage, risk score), Artifacts (strand = fork), Cloudflare Container, exact proposal, the fence, Durable Object (queue). Lines in `.build/lines-v5.json`; "Durable Object." at a sentence end made the TTS say "dot", so line 13 continues the sentence.
- **On screen:** "on cloudflare" badge top-right of scenes 05–13 (products as ink pills, Braid primitives as outlined pills); proof captions now name Artifacts forks at a base SHA, Pi Durable, Containers with no Internet or Git keys, immutable proposals and path:line@sha findings, CAS on the ref in a Durable Object, D1 for held proposals and the audit log. Lockup adds D1 and Clef.
- **Also shown as live but NOT built:** Clef triage of issues and Clef risk scoring in policy (in addition to the v4 list). Must ship before Oct 14 or be cut.
- **Build:** `.build/gen-v5.mjs` → `compositions/v5/`, `index.html`, `assets/bgm/bed-v5.wav`; voice in `assets/vo5/`, word timings in `.hyperframes/words5/`. v4 generator kept at `.build/gen-v4.mjs`.
- Output: `renders/video-v5.mp4`.
