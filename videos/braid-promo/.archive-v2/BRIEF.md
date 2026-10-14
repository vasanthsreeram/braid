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
