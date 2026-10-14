---
format: 1920x1080
duration: 85s
message: "Braid lets hundreds of agents work in parallel and weaves their changes into one clean history, safely."
arc: PAS — surge → challenge → hook → pain → product intro → strand → issue-to-proposal → proposal → review agent → fenced merge → platform → outro
audience: hackathon judges and developers building with AI agents
mode: collaborative
music: high-energy electronic, punchy drums, bright synth arps, builds and drops, playful hackathon hype
---

## Video direction

- **palette system** — broadside two-register, from `frame.md`: DARK register (ink-black ground, cream text, fire-orange the only accent) or ORANGE register (fire-orange ground, ink text). One register per frame. Fire-orange is the ONLY hue: errors, success, highlights, probability bars all speak orange (on dark) or ink (on orange). No green/red status colors, no gradients, no shadows, 0 radius, 1px hairlines. Display type = Barlow 900 lowercase, tight negative tracking; all technical chrome (SHAs, labels, model ids, paths) = IBM Plex Mono uppercase 0.14em or mono lowercase for code. Registers per frame: 01 dark · 02 ORANGE · 03 dark · 04 ORANGE · 05 dark · 06 dark · 07 ORANGE · 08 dark · 09 dark · 10 ORANGE · 11 dark→ORANGE slam.
- **recurring motif — the strand** — thin fire-orange lines (2–3px) are the video's connective tissue: agents are dots riding strands, `main` is a thick strand, the braid mark is three strands twisting, history is a straight strand with commit dots. Draw strands with SVG self-draw; never decorative blobs.
- **motion grammar** — energetic but clean: fast arrivals on `expo.out`, settles on `power3.out`; overshoot allowed ONLY on the playful slams the frame names (counter slam, IMMUTABLE stamp, final wordmark). Hard-cut word swaps and kinetic beat-slams carry the hype. Every reveal lands on its spoken word (word timings are in each Scene); nothing front-loads.
- **rhythm / holds** — high energy throughout, three deliberate held reads: end of 03 (wordmark holds ~0.8s), end of 08 (straight history line + counters hold ~0.6s), end of 10 (final lockup holds ~1.5s). Subtle jitter is the only aliveness during holds.
- **tech legibility** — every technical label must be readable on a 1080p screen for ≥1s: mono labels ≥1.4cqw, SHAs shown as 7-char + ellipsis except in frame 06 where the full 40-char form appears once.
- **negative list** — no slideshow (front-load then freeze), no screensaver (many elements floating independently), no lazy breathing, no slow back-half pans, no purple/blue AI gradients, no bokeh, no browser chrome, no real cursors, no third-party logos (Cloudflare product names are mono text, never logos), no Math.random (agent-dot positions derive from index), no infinite loops.
- **caption band** — bottom ~17% reserved for captions; all content in the top ~83%.

## Frame 1 — The surge

- scene: GitHub's own numbers slam in. A huge counter climbs to "275M" with "commits / week" beneath; a second stat "14B this year" lands; an attributed quote card slides in: "Yup, platform activity is surging… Now, it's 275 million per week, on pace for 14 billion this year" — Kyle Daigle, GitHub · 4 Apr 2026. A small chip: "Actions · 2.1B min / week".
- voiceover: "Two hundred seventy-five million commits, per week! GitHub is on pace for fourteen billion this year."
- duration: 6.471s
- transition_in: cut
- status: animated
- src: compositions/frames/00a-surge.html
- type: hook
- persuasion: Statistical shock + authority (the platform's own numbers)
- beat: awe → tension
- asset_candidates:
- blueprint: dataviz-countup (Adapt)
- focal: 275M counter
- sfx: riser-short, impact-boom, tick, impact-thud

narrativeRole: The "why now": code volume is exploding, in GitHub's own words. Sets up the competition's reason to exist without attacking anyone.
keyMessage: The load on code platforms is exploding.

Adapt: keep the cold-open exploding stat; two stats in sequence plus a sourced quote card as the authority beat. Quote is verbatim from the public post; attribution always visible. No GitHub logo (text only), no profanity, no third-party quote.
Scene 1 (0.0–1.4s): DARK. Mono kicker "COMMITS / WEEK · GITHUB" top-left. On "two hundred seventy-five" (0.28s) a stat-value numeral counts up value-scaled from 0 to 275, cream, upper-left two-thirds, ~40% of frame height → counting-dynamic-scale.
Scene 2 (1.4–2.9s): on "million" (1.48s) an orange "M" slams onto the numeral; on "commits" (1.88s) the lead label "commits" appears beneath; on "per week" (2.68–2.88s) "/ week" slams in beside it with a thud.
Scene 3 (2.9–4.6s): on "GitHub" (3.48s) the quote card slides in from the right (right third, hairline top border, mono attribution "— KYLE DAIGLE, GITHUB · 4 APR 2026" and handle "@kdaigle"); the quote's numbers "275 million per week" and "14 billion" are orange.
Scene 4 (4.6–6.47s): on "fourteen billion" (4.68–5.08s) a second stat card "14B / this year" counts up below the first; at 5.1s a small mono chip "ACTIONS · 2.1B MIN / WEEK" ticks in. Hold with subtle jitter; the numbers dominate.

## Frame 2 — The ask

- scene: ORANGE. "build the next github" slams in word by word in display type; then "for hundreds of thousands of agents" and a dense field of tiny ink agent dots fills the lower band.
- voiceover: "So Cloudflare asked: build the next GitHub, for hundreds of thousands of agents."
- duration: 4.758s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/00b-the-ask.html
- type: hook
- persuasion: Challenge framing
- beat: curiosity + urgency
- asset_candidates:
- blueprint: kinetic-type-beats (Reproduce)
- focal: "build the next github"
- sfx: whoosh-short, impact-thud, impact-thud, impact-thud, impact-boom

narrativeRole: Names the challenge Braid answers: agents at massive concurrency. Bridges the surge to the hundred-agents demo.
keyMessage: The next GitHub has to be built for agents.

Scene 1 (0.0–1.3s): ORANGE register. On "Cloudflare asked" (0.28–0.98s) a mono kicker "THE CHALLENGE · CLOUDFLARE" types in top-left with an ink stub rule.
Scene 2 (1.3–2.7s): kinetic beat-slam, each word on its spoken cue at display scale, lowercase ink, left-aligned stacked: "build" (1.38s) · "the next" (1.68s) · "github" (1.98s) → kinetic-beat-slam.
Scene 3 (2.7–4.76s): on "for hundreds of thousands of agents" (2.68–3.88s) a lead line "for hundreds of thousands of agents" reveals per word under the stack, and a dense grid of tiny ink agent dots (positions from index) pops in across the lower third in a fast waterfall, peaking on "agents" (3.88s). Hold.

## Frame 3 — Built for human speed

- scene: DARK. Three gauges labelled for a scenario (100 agents, one repo, one day) slam into the red zone one by one: "PRs awaiting review 2,400", "merge queue 3h 12m", "untriaged issues 918"; the needles shake against their limits.
- voiceover: "Today's tools run at human speed. Agents don't! Review queues explode, merges pile up, and nobody triages anything."
- duration: 8.008s
- transition_in: cut
- status: animated
- src: compositions/frames/01-human-speed.html
- type: pain_point
- persuasion: Pain agitation (scale mismatch)
- beat: tension → overwhelm
- asset_candidates:
- blueprint: dataviz-countup (Adapt)
- focal: three overload gauges
- sfx: whoosh-short, tick, riser-short, error-buzz, impact-thud, glitch-hit, impact-boom

narrativeRole: The pain at agent scale: every human-paced queue (review, merge, triage) overflows. Each gauge is answered later by Braid (Pi Durable review, fenced merge, Clef triage).
keyMessage: Today's collaboration tools can't keep up with agents.

Adapt: keep the count-up/meter as the hero; three meters in a triptych instead of one stat. Numbers are an illustrative scenario and must carry the visible "SCENARIO" label; the only color is fire-orange (the "red zone" is the orange band of each gauge, not red).
Scene 1 (0.0–2.2s): DARK. On "Today's tools" (0.08–0.56s) a mono kicker "SCENARIO · 100 AGENTS · ONE REPO · ONE DAY" types top-left. On "run at human speed" (0.96–1.76s) a lowercase h2 "built for human speed." lands upper-left, and three empty semicircular gauge outlines draw on in a triptych across the middle (svg-path-draw), each with a mono label beneath: "PRS AWAITING REVIEW", "MERGE QUEUE", "UNTRIAGED ISSUES". Needles rest at the left (calm).
Scene 2 (2.2–3.3s): on "Agents don't!" (2.32–2.80s) the h2 swaps in place to "agents aren't." with "aren't" in orange (hard-cut word swap) and all three needles twitch upward together.
Scene 3 (3.3–4.9s): on "review queues explode" (3.36–4.40s) gauge 1's needle sweeps into the orange red-zone band and its big stat-value counts up value-scaled to "2,400" → counting-dynamic-scale; the gauge shakes on 4.40s.
Scene 4 (4.9–6.4s): on "merges pile up" (5.04–5.84s) gauge 2 sweeps to the limit, readout counts to "3h 12m"; a thin stack of tiny proposal cards piles up beneath it.
Scene 5 (6.4–8.0s): on "nobody triages anything" (6.24–7.28s) gauge 3 slams to the stop, readout "918" counts up and a mono tag "UNASSIGNED" stamps under it on "anything" (7.28s); all three needles jitter against their stops (subtle, deterministic) to the cut.

## Frame 4 — Meet Braid

- scene: The clutter is shoved off-frame; three orange strands twist into a braid that resolves into the "braid" wordmark with the tagline.
- voiceover: "Meet Braid. Where parallel work comes together."
- duration: 3.432s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/03-meet-braid.html
- type: product_intro
- persuasion: Negative contrast (chaos → calm)
- beat: relief + curiosity
- asset_candidates:
- blueprint: logo-assemble-lockup (Adapt)
- focal: braid wordmark
- sfx: whoosh-big, impact-boom, shimmer

narrativeRole: The answer lands by beat 3: the value claim stated in one line.
keyMessage: Braid is where parallel work comes together.

Adapt: keep "the mark comes to exist from parts"; the parts are three strands (INK on the ORANGE register) that twist into a braid and resolve into the wordmark.
Scene 1 (0.0–0.5s): ORANGE register, clean field (the clutter of 02 has been shoved off by the zoom-through). Three ink strands enter from the left edge in parallel → svg-path-draw.
Scene 2 (0.5–1.0s): on "Braid" (0.5s) the three strands twist over each other into a tight braid at center, then the lowercase display wordmark "braid" slams in at display scale directly over/after the braid (playful slam allowed). Centered, wordmark ~60% frame width.
Scene 3 (1.0–2.2s): on "where parallel work" (1.0s) the tagline "where parallel work comes together" reveals per-word in lead type beneath the wordmark, each word on its spoken cue → dynamic-content-sequencing.
Scene 4 (2.2–3.43s): on "together" (2.2s) the braid tightens one notch; mono kicker "CLOUDFLARE-NATIVE GIT" fades in top-left. Hold the lockup still (subtle jitter only).

## Frame 5 — Everyone gets a strand

- scene: One base commit at left; 100 thin strands fan out to the right, each tagged agent-007, agent-042… Mono labels ride along: "fork · Cloudflare Artifacts" and "pinned @ base a1f3c9e…".
- voiceover: "Every agent gets its own strand. A fork in Cloudflare Artifacts, pinned to an exact base commit. Nobody fights over branches."
- duration: 7.527s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/04-strands.html
- type: feature_showcase
- persuasion: Feature-to-benefit translation
- beat: clarity + control
- asset_candidates:
- blueprint: spatial-pan-stations (Adapt)
- focal: fanned strands
- sfx: whoosh-short, tick-cascade

narrativeRole: Mechanism 1, isolation. Explains why nobody steps on anybody.
keyMessage: Each agent works in an isolated fork pinned to a known base.

Adapt: keep the single virtual camera traversing labeled stations across one wide canvas; the stations are: base commit → the fan of agent strands → the pinned-base label.
Scene 1 (0.0–1.4s): DARK. Left third: one large orange commit dot with mono label "base a1f3c9e". On "every agent" (0.1–0.4s) strands start splitting from it to the right; on "strand" (1.4s) the split completes → svg-path-draw with index-staggered starts.
Scene 2 (1.4–3.2s): camera pans right along the fan → viewport-change. ~40 visible strands (implying 100), each ending in a mono tag: agent-007, agent-042, agent-113, planner, human:vas… On "fork in Cloudflare Artifacts" (2.0–3.2s) a mono chip "FORK · CLOUDFLARE ARTIFACTS" pins to the highlighted strand agent-042.
Scene 3 (3.2–5.6s): on "pinned to an exact base commit" (3.8–5.1s) a hairline drops from every strand back to the base dot and a chip "PINNED @ a1f3c9e…" appears on agent-042; the base dot pulses once.
Scene 4 (5.6–7.53s): on "nobody fights over branches" (5.7s) display line "nobody fights over branches." reveals top-left in h2 lowercase; strands stay perfectly parallel, no crossings. Hold.

## Frame 6 — Issue in, proposal out

- scene: Issue card "#142 · login redirect loops" drops in and hits a block labelled "Clef-flash · Workers AI decision model". A mono line flashes "no tokens generated · every option scored in parallel". Typed questions answer as probability bars that snap full at once: type → bug 0.97 · priority → p1 0.91 · owner → auth 0.88 · urgent → yes 0.94. A stopwatch freezes on "39 ms". "assigned → agent-042" stamps on, a strand spins off, a progress rail runs, and a "proposal ready" card slides out.
- voiceover: "File an issue, and Clef, Cloudflare's decision model, triages it in thirty-nine milliseconds: type, priority, owner, every call with a probability! An agent picks it up, and the proposal is ready before you've refilled your coffee."
- duration: 12.703s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/05-issue-to-proposal.html
- type: feature_showcase
- persuasion: Friction reduction
- beat: delight + ease
- asset_candidates:
- blueprint: agent-progress-theater (Adapt)
- focal: Clef decision panel
- sfx: paper-drop, tick-fast, ding, stopwatch-click, whoosh-short, success-chime

narrativeRole: The agent-native loop: work starts itself. Shows why Braid is built for agents, not just tolerant of them.
keyMessage: Issues triage themselves and come back as ready proposals.

Adapt: keep trigger → working theater → receipt that checks off; the working theater is Clef's decision panel (probability bars snap, not stream), the receipt is the proposal card.
Scene 1 (0.0–1.0s): DARK. On "File an issue" (0.1–0.6s) an issue card drops in left third: mono "#142", title "login redirect loops", body line placeholder; hairline top border.
Scene 2 (1.0–3.2s): on "Clef" (1.0s) the card slides into a panel at center-right headed mono "CLEF · @cf/cloudflare/clef-flash" and "WORKERS AI DECISION MODEL" (on "decision model" 2.6s); a mono strap "no tokens generated · every option scored in parallel" types beneath → discrete-text-sequence.
Scene 3 (3.2–5.4s): on "triages it" (3.2s) four typed-question rows appear; on "39 milliseconds" (4.2–4.6s) ALL FOUR probability bars fill simultaneously in one snap and a stopwatch chip freezes on "39 ms" big (stat-value scale) → stat-bars-and-fills.
Scene 4 (5.4–8.6s): rows highlight on their spoken word: "type → bug 0.97" (5.4s), "priority → p1 0.91" (5.9s), "owner → auth 0.88" (6.6s); on "probability" (8.1s) the "urgent → yes 0.94" row glows. Mono keyword glow → asr-keyword-glow.
Scene 5 (8.6–10.6s): on "an agent picks it up" (8.7s) a stamp "ASSIGNED → agent-042" thunks on; a strand spins off the panel to the right with a running progress rail.
Scene 6 (10.6–12.7s): on "proposal is ready" (10.1–10.6s) an ink-on-orange card "PROPOSAL READY · #142 → 7e2d10b" slides out at the strand's end; on "coffee" (12.0s) a tiny coffee-cup mono glyph "☕ still hot" pops beside it. Hold.

## Frame 7 — Exact proposals

- scene: Proposal cards cascade into a grid; each card shows full 40-char SHAs "base a1f3c9e…  →  candidate 7e2d10b…" and an IMMUTABLE stamp thunks onto each.
- voiceover: "Every change is a proposal: exact base, exact commit, immutable."
- duration: 4.578s
- transition_in: push-slide LEFT
- status: animated
- src: compositions/frames/06-proposals.html
- type: feature_showcase
- persuasion: Risk reversal
- beat: trust
- asset_candidates:
- blueprint: grid-card-assemble (Adapt)
- focal: proposal grid
- sfx: card-flick-cascade, stamp-thud

narrativeRole: Mechanism 2, immutable proposals. Every change is reviewable and reproducible.
keyMessage: Every change is an exact, reviewable proposal.

Adapt: keep the staggered cascade into a grid; each tile is a proposal card; finale is a stamp on every card rather than a zoom-out.
Scene 1 (0.0–0.9s): ORANGE register. On "every change" (0.1s) one large proposal card (ink hairline border-top, ink text) lands at center: mono "PROPOSAL #318".
Scene 2 (0.9–2.6s): on "proposal" (0.9s) it shrinks into the top-left slot as a 4×3 grid of proposal cards cascades in (index stagger). On "exact base" (1.6s) every card's line "base a1f3c9e3b7d04c1f9e2a6b8d0c5f7a1e2b3c4d5" highlights — the full 40-char SHA shown once on the hero card, 7-char elsewhere.
Scene 3 (2.6–3.5s): on "exact commit" (2.6s) the "→ candidate 7e2d10b…" line highlights on every card in a waterfall.
Scene 4 (3.5–4.58s): on "immutable" (3.5s) a big ink stamp "IMMUTABLE" slams diagonally across the grid (playful slam allowed); a small lock glyph appears on each card in a waterfall. Hold.

## Frame 8 — The brain: Pi Durable

- scene: A "PI DURABLE · THE BRAIN" core sits inside a Durable Object frame; its journal stacks steps, survives a crash glitch and resumes; then it reads the exact commit of src/auth.ts, builds a finding chip "src/auth.ts:88–94 @ 7e2d10b", and files it as issue #143.
- voiceover: "The brain is Pi Durable: an agent harness inside a Durable Object, journaling every step, so a crash never loses its place. It reads the exact commit, cites the file, the line, the SHA, and files the finding as an issue."
- duration: 13.155s
- transition_in: crossfade
- status: animated
- src: compositions/frames/07-review-agent.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: confidence
- asset_candidates:
- blueprint: transcript-scroll-artifact-reveal (Adapt)
- focal: Pi Durable core + journal
- sfx: whoosh-short, tick-cascade, glitch-hit, ding, scan-sweep, pop-x3, card-flick

narrativeRole: Mechanism 3: the agent runtime is built in. Pi Durable is the brain, durable by construction, and its review is grounded in the exact commit.
keyMessage: A durable agent brain, built in, that reviews with receipts.

Adapt: keep "evidence read → artifact"; prepend the brain: a durable journal theater (the agent's steps persist through a crash) before the diff read and the auto-filed issue. Existing diff panel + issue card components may be reused.
Scene 1 (0.0–1.6s): DARK. On "brain" (0.28s) a square core block springs in at right-center: display "pi durable" with mono label "THE BRAIN · AGENT HARNESS". Mono kicker top-left "No. 09 / built-in agent runtime".
Scene 2 (1.6–3.8s): on "agent harness" (1.88–2.18s) the label underlines; on "Durable Object" (3.08–3.48s) a hairline outer frame draws around the core, labelled mono "DURABLE OBJECT", with a small chip "gpt-oss-120b · WORKERS AI".
Scene 3 (3.8–7.1s): on "journaling every step" (3.88–4.78s) a mono journal list stacks beside the core, one line per beat: "01 read src/auth.ts @ 7e2d10b ✓" · "02 diff a1f3c9e..7e2d10b ✓" · "03 check session refresh …". On "crash" (5.48s) a glitch hit tears the frame (short, orange) and the core blinks out; on "never loses its place" (5.88–6.68s) the core snaps back and the journal still shows 01–02 ✓ with "03 resumed" highlighted orange.
Scene 4 (7.1–8.9s): the core/journal slide to the right third; the src/auth.ts diff panel slides in left; on "reads the exact commit" (7.48–8.28s) an orange scan line sweeps down it and an "@ 7e2d10b" chip pins to its header.
Scene 5 (8.9–11.0s): lines 88–94 highlight; a finding chip builds token by token on its words: "src/auth.ts" (9.48s "file") → ":88–94" (9.88s "line") → " @ 7e2d10b" (10.48s "SHA").
Scene 6 (11.0–13.16s): on "files the finding as an issue" (11.28–12.38s) the chip flies right into an issue card "#143 · redirect loop on expired session · FOUND BY PI DURABLE REVIEW"; hold.

## Frame 9 — The fenced merge

- scene: Hundreds of proposals race toward a single gate labelled "fence · 1 publisher". Each one hits a compare-and-swap on refs/heads/main; winners snap onto a dead-straight history line, a stale one bounces off with "base moved · held, never rewritten". Counters tick: "merged 100+ · lost writes 0".
- voiceover: "Then the fenced merge! One publisher at a time, compare and swap on the ref. Hundreds racing, zero lost writes!"
- duration: 7.079s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/08-fenced-merge.html
- type: feature_showcase
- persuasion: Show-don't-tell proof
- beat: power + awe
- asset_candidates:
- blueprint: agent-progress-theater (Adapt)
- focal: the fence gate + straight history
- sfx: whoosh-big, gate-clack (repeating, index-timed), reject-bonk, counter-tick, impact-boom

narrativeRole: The climax and the proof of the message: safe under any amount of racing.
keyMessage: Merging stays safe no matter how many changes race.

Adapt: keep the working-theater → receipt counters; the theater is proposals racing a single gate.
Scene 1 (0.0–1.3s): DARK. Zoom-through arrival. Center: a vertical gate (two thick orange posts) labelled mono "FENCE · 1 PUBLISHER". Right: the history strand, straight, horizontal. On "fenced merge" (0.4–0.8s) the gate locks shut with a clack.
Scene 2 (1.3–2.6s): on "one publisher at a time" (1.3s) a queue of small proposal cards streams in from the left; the first passes through the gate and snaps onto the history strand as a commit dot.
Scene 3 (2.6–4.3s): on "compare and swap on the ref" (2.6–3.7s) a mono readout above the gate cycles fast: "CAS refs/heads/main  a1f3c9e → 7e2d10b ✓". One card with a stale base bounces back off the gate with chip "BASE MOVED · HELD, NEVER REWRITTEN".
Scene 4 (4.3–6.0s): on "hundreds racing" (4.3s) the queue becomes a torrent of cards (index-staggered), passing one at a time in a rapid cadence; the history strand extends dead straight with commit dots; two stat-cards top-right count up: "MERGED 100+" and "LOST WRITES 0" (on "zero lost writes" 5.4s the 0 slams).
Scene 5 (6.0–7.08s): hold on the straight history and counters (subtle jitter only).

## Frame 10 — Native on Cloudflare

- scene: The braid mark at center; five nodes spring into a ring around it (Workers, Artifacts, Durable Objects, D1, Workers AI); then "agent runtime: built in" lands under the core and a mono list of things you no longer host gets struck through; camera pushes into the core.
- voiceover: "All of it, native on Cloudflare: Workers, Artifacts, Durable Objects, D1, and Workers AI. And the agent runtime is built in, so there's nothing for you to host. Nothing."
- duration: 9.943s
- transition_in: blur-crossfade
- status: animated
- src: compositions/frames/09-cloudflare.html
- type: social_proof
- persuasion: Authority by association
- beat: trust
- asset_candidates:
- blueprint: constellation-hub (Reproduce)
- focal: braid core
- sfx: pop-x5, stamp-thud, tick-x3, whoosh-big

narrativeRole: Grounds the claim in real Cloudflare primitives and lands the dev-workload win: the agent runtime ships with the platform.
keyMessage: Native on Cloudflare, agent runtime built in, nothing to host.

Scene 1 (0.0–1.8s): ORANGE register. Ink braid mark (three strands) at center, small. On "native on Cloudflare" (0.58–1.08s) mono kicker "NATIVE ON CLOUDFLARE" above it.
Scene 2 (1.8–5.6s): five mono-labelled nodes spring into an ellipse around the core, each on its word, with hairline connectors drawing to the center → avatar-cloud-network: "WORKERS" (1.88s), "ARTIFACTS · repo per agent" (2.38s), "DURABLE OBJECTS · fence + pi durable" (3.08s), "D1 · issues + audit" (4.08s), "WORKERS AI · clef + gpt-oss-120b" (4.78s).
Scene 3 (5.6–7.6s): on "agent runtime is built in" (6.18–7.28s) a stamp-style ink block "agent runtime: built in" slams under the core (playful slam allowed).
Scene 4 (7.6–9.0s): on "nothing for you to host" (7.98–8.58s) a mono list types beside the stamp and each line is struck through in sequence: "your agent servers", "your job queue", "your retry glue".
Scene 5 (9.0–9.94s): on "Nothing." (9.08s) camera pushes hard into the braid core — the push carries into the zoom-through to frame 12.

## Frame 11 — One clean history

- scene: Rapid verb barrage on orange (fork · triage · propose · review · merge), then everything snaps to the braid wordmark and the line "where parallel work comes together".
- voiceover: "Fork, triage, propose, review, merge! Hundreds of agents, one clean history. This is Braid."
- duration: 7.988s
- transition_in: zoom-through
- status: animated
- src: compositions/frames/10-outro.html
- type: branding
- persuasion: Rule of three + value stacking
- beat: triumph
- asset_candidates:
- blueprint: kinetic-type-beats (Reproduce — verb barrage)
- focal: wordmark
- sfx: beat-hit-x5, impact-boom, riser-short, shimmer

narrativeRole: Recaps the loop as a chant and leaves the name ringing.
keyMessage: Hundreds of agents, one clean history: Braid.

Scene 1 (0.0–3.1s): DARK. Center channel verb barrage, each verb hard-cut in at display scale on its word: "fork" (0.2s) · "triage" (0.6s) · "propose" (1.3s) · "review" (1.9s) · "merge" (2.5s) → kinetic-beat-slam; a strand under the words gains one twist per verb.
Scene 2 (3.1–5.5s): on "hundreds of agents" (3.1s) h2 line appears; on "one clean history" (4.3s) it swaps in place to "one clean history." while the strand straightens into one clean line.
Scene 3 (5.5–7.99s): on "This is Braid" (5.5–5.8s) register slams to ORANGE; the strands braid and the lockup lands: wordmark "braid" (display) + tagline "where parallel work comes together" + mono "built on cloudflare". Final playful slam on "Braid", then hold still to the end; final 0.4s fade to ink.

