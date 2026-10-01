# Cloudflare: Build the next GitHub

Sources accessed 2026-10-01 UTC:
- Landing page: https://www.cloudflare.com/git-competition/
- Published Markdown: https://www.cloudflare.com/git-competition/.md
- Official rules: https://www.cloudflare.com/documents/build-next-gen-git-platform-competition-terms.pdf
- Submission page linked by landing page: https://www.cloudflare.com/git-competition/submit (no submission made)

Original documents are preserved under [sources](sources/README.md). This summary is not legal advice. Official rules govern.

## Brief and dates

Build a new way for hundreds of thousands of agents to work on changes concurrently. The page explicitly invites rethinking repositories, branches, pull requests, worktrees, code review and merge conflicts.

| Item | Published requirement |
|---|---|
| Contest starts | October 1, 2026, 9:00 AM EDT |
| Submission closes | October 14, 2026, 11:59 PM PDT (rules' authoritative timezone) |
| Submission | 5–10 minute demo, source repository, instructions to run, complete application and agreement to rules |
| Finalists | Three teams; landing page says announcement October 16 |
| Final presentation | October 21, 2026, Cloudflare Connect, Moscone West, San Francisco; 10 minutes on stage |
| Travel | Page says travel/event attendance for up to two people; rules say Sponsor may provide reasonable approved travel/hotel/tickets and entrants cover other expenses |
| First prize | $25,000 USD Cloudflare credits valid 12 months, plus VIP speaker dinner invitation; not cash |

## Eligibility blocker

Rules section 3 requires entrants to be **legal residents of the United States or Canada**, at least 18 at the start. Other exclusions include sanctioned parties, Sponsor employees/family/household and specified government/public-sector employees. Singapore residence alone would not meet the stated geographic criterion. Do not claim Vas's eligibility or try to bypass it through a nominal entrant. Request an official clarification from git-competition@cloudflare.com if needed. No contact has been sent.

## Required platform and license

Section 4 requires Cloudflare's developer platform **including Workers and Artifacts**, and a project that enables multiple agents working on changes concurrently.

Source must use MIT, Apache 2.0, BSD 2-Clause, or BSD 3-Clause, with a LICENSE file. Landing page calls for open-source code. Section 9 requires complete source access for judging and states submissions are **not confidential**.

**Current decision:** keep this preparation repo private and docs-only. Do not choose a license, grant judges access, publish, or submit without explicit approval. Private planning is distinct from submission compliance. If pursuing entry, resolve eligibility, publication/source-access expectations, original-content permissions and licensing first.

## Judging

| Criterion | Weight |
|---|---|
| Originality and prototype quality for agent-oriented collaboration | 50% |
| Multi-agent concurrency, coordination, context preservation, review and conflict handling | 25% |
| Ease of use and product UX | 25% |

Each is scored 1–5. Originality/quality breaks ties. Winners must be physically present at Connect. One submission per entrant; automated/robotic entry is prohibited. This agent may prepare docs, not automate submission.

## Other important conditions

Original work and rights to third-party material required; no competitor/personal attacks or prohibited content. Entrants retain Project IP, while promotional/demo/presentation content has broad Sponsor usage rights. Sponsor may develop competing products. Preserve neutral, testable engineering language, not unverified claims about GitHub failures.

## Fit and scope tension

The lean forge covers discovery, sharing and import, but the competition prioritizes concurrent **agent-oriented** collaboration. A future entry would need a demonstrated task-fork/review/integration story, not just familiar repo screens. Hosted autonomous agents remain KIV per Vas; external agents or controlled simulated clients could exercise the concurrency model once implemented, but must be clearly labeled and measured. No running demo exists today.
