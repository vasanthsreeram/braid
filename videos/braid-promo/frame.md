---
version: v3
name: Braid Cream — Frame (video / frame layer)
description: >
  Light, editorial, confident. One cream paper ground, ink type, and three warm strand colors that
  split off a main line and weave back in. Big sentence-case Inter Tight headlines with one
  Instrument Serif italic emphasis word in orange; IBM Plex Mono only for small proof captions.
  Generous whitespace, one idea per screen. (v2 dark "Broadside" spec archived at .archive-v2/frame.md.)
unit: the frame — 1920×1080
principle: outcome is the headline · tech is the caption · one idea per screen

colors:
  cream: "#faf7f2"        # the only ground
  cream-deep: "#f1ebe1"   # cards, quiet panels
  ink: "#1f1a15"          # headlines, main strand
  ink-muted: "#5e5248"    # proof captions, labels (6.9:1 on cream)
  hairline: "#e2d9cc"     # 1–2px rules, card borders
  orange: "#e8590c"       # strand 1 + emphasis word (display sizes only, ≥3:1)
  saffron: "#c99a2e"      # strand 2 — strokes/fills only, never text
  umber: "#7a5c46"        # strand 3 — strokes, small labels allowed (5.6:1)

typography:
  display:   { fontFamily: "Inter Tight", px: 150-340, weight: 800, lineHeight: 0.95, tracking: "-0.045em" }
  headline:  { fontFamily: "Inter Tight", px: 110-140, weight: 800, lineHeight: 1.0, tracking: "-0.04em" }
  emphasis:  { fontFamily: "Instrument Serif", style: italic, weight: 400, color: orange, note: "one word per headline; ~1.08x the headline size" }
  sub:       { fontFamily: "Inter Tight", px: 44-56, weight: 600, lineHeight: 1.2, tracking: "-0.015em", color: ink }
  proof:     { fontFamily: "IBM Plex Mono", px: 24-26, weight: 500, tracking: "0.1em", upper: true, color: ink-muted }
  label:     { fontFamily: "IBM Plex Mono", px: 20-22, weight: 500, tracking: "0.08em", color: ink-muted }

layout:
  safe: "title-safe 10% inset (192px / 108px); headlines start at x=192"
  headline-zone: "top-left, y 150–480"
  visual-zone: "y 500–900, full width"
  proof-line: "bottom-left, baseline ~y 960, preceded by a 40×3px orange tick"
  whitespace: "never more than ~45% of the frame inked; empty cream is a feature"

motif:
  strand: "SVG strokes, 3–8px, round caps. main = ink 8px; agent strands = orange / saffron / umber 4–5px.
           Strands split off main with smooth cubic curves and braid back in (three phase-shifted sines)."
  commit-dot: "filled circle r=9–12 on a strand, cream stroke 4px"
  braid-mark: "three sines, 120° apart, orange / saffron / umber, woven over a short span"

motion:
  arrivals: "expo.out / power4.out, 0.35–0.6s; words rise 30–60px"
  swaps: "hard cut word swaps on the spoken word — no crossfades between ideas"
  strands: "stroke-dashoffset draw, power2.inOut"
  overshoot: "back.out only on the counter slams and the wordmark"
  never: "slow fades, floating blobs, gradients, drop shadows, purple/blue, random motion"
---

# Braid Cream

Cream paper, ink type, warm strands. The headline is always the implication ("Main stays clean"),
and the mechanism sits underneath as a small mono proof line ("FENCED MERGE · …"). Emphasis is a
single serif italic word in orange; everything else is ink. Saffron never carries text.
