# Gitflare UI polish + original Blocks

Implemented in the existing app, keeping the cream canvas and orange identity. The welcome page is an editorial composition with a custom pixel flame, original copy, technical dividers, and a hatched orange/saffron/terracotta block sculpture. The authenticated app uses a compact sidebar, flat repository rows, selected repository sections, restrained file/commit panels, and coherent issue, proposal, review, access, create/import, and contribution screens.

The [Cloudflare reference](https://www.cloudflare.com/git-competition/) informed the sparse framing, strong left-aligned type, negative space, fine guides, and playful warm block field. Gitflare's CSS, game code, mark, sculpture, copy, and controls are original. No site CSS/JavaScript, logos, competition claims, or proprietary art were copied. “Gitflare Blocks” is the game's name.

## Controls and accessibility

Choose **Play Blocks**, then focus the board. Left/right move, Up rotates, Down soft-drops, Space hard-drops, and Escape pauses/resumes. The visible Pause/Resume and Restart buttons work independently. Mobile users have five touch controls, all at least 44 × 44 CSS pixels. Fill rows to clear them and score points; the next piece appears beside the score. Restart resets the board, score, and lines.

Decorative artwork is aria-hidden and static under reduced motion. Explicit Play starts the game even with reduced motion enabled. Arrow/Space handlers are attached only to the focused board, preserving ordinary forms, navigation, and scrolling. Score/row announcements occur on meaningful events, not frames. Game gravity and decorative motion use one bounded timeout, render on changes, and stop when offscreen or hidden; active games pause and require Resume. Canvas resize and DPR (capped at 2) are handled. Text uses warm ink or accessible darker orange; vivid orange buttons use dark text, with visible keyboard focus.

## Security and scope

The existing root 401 remains intentional. `/auth/login`, readiness warnings, invitation filtering, resume-session and logout behavior remain intact. The Worker exposes only GET/HEAD of `/public/welcome.css`, `/public/blocks.js`, and `/public/blocks-engine.js`. It sets exact MIME types, nosniff, revalidation caching, and a restrictive CSP with `default-src 'none'`, self-hosted scripts/styles, no inline scripts, no eval, no framing, and same-origin forms. Other static paths remain authenticated; API/LFS permissions retain their original pipeline. Local workerd probes exercised private assets, API paths, encoded/traversal/source probes, and ready/unconfigured AuthKit gates.

No provider credential, WorkOS configuration, storage, budget, sharding, backend API/Git permission code, Worker binding, account, domain, or resource configuration changed. No live repository imports/pushes, model reviews, inference, paid review calls, stress tests, or LFS/Git benchmarks were run. Fixture operations use isolated local repositories and explicit test actors. GitHub fixture imports use provider doubles and empty local Git destinations; no GitHub account or user repository was imported.

## Executed checks

| Check | Actual result | Receipt |
| --- | --- | --- |
| Selected unit/runtime regressions | 29 tests passed: auth, auth exchange, core, history, collaboration, Blocks, public boundary | `receipts/regression-tests.txt` |
| New Blocks + welcome boundary subset | 8 tests passed, including isolated ready/unconfigured workerd | `receipts/blocks-boundary-tests.txt` |
| Desktop authenticated LOCAL fixture | 20 checks passed, 1440 CSS px | `receipts/after-ui-1440.json` |
| Mobile authenticated LOCAL fixture | 20 checks passed, 390 CSS px | `receipts/after-ui-390.json` |
| Independent LOCAL actor issue/access journeys | 10 checks per width, 20 total | `receipts/ui-collaboration.json` |
| LOCAL GitHub picker contract fixture | 4 grouped checks at 390/1440: pagination, search, private destination, status, disconnect | `receipts/ui-picker.json` |
| Anonymous local Worker/game browser | 8 grouped checks: keyboard, touch, score, next, pause/resume/restart, seeded row clear, motion, visibility, resize/DPR, CSP and no overflow | `receipts/local-game.json` |
| Typecheck | Passed | `receipts/typecheck.txt` |
| Worker dry-run build | Passed with existing bindings | `receipts/build.txt` |
| Formatting + diff whitespace | Passed | `receipts/formatting.txt` |

The 8-test subset is included in the 29-test suite; do not add those counts together. Browser groups contain multiple assertions. Isolated local workerd has no remote bindings or real provider credentials. The deterministic browser row uses a test-only response substitution; production has no seeded board or exposed cheat API. Hidden-page behavior includes a test-only visibility event; offscreen suspension is exercised by real scrolling. JavaScript page errors and unexpected console/network failures are checked. Expected anonymous root 401 and initial local auth denials are retained in receipts.

The installed Chrome/Playwright harness was used after the in-app browser bridge failed bootstrap (`sandboxPolicy` metadata missing). Screenshots were visually inspected. Baseline desktop fixtures ran 19 checks before the implementation; baseline hosted welcome screenshots exist at both sizes.

## Screenshots

All paths below are relative to this folder. `live-*` means the real anonymous custom host; `local-fixture-*` means LOCAL fixtures, not a hosted authenticated user flow. 390 captures may have 780 physical pixels where the mobile browser uses DPR 2; their viewport is 390 CSS pixels.

| Surface | Desktop | Mobile |
| --- | --- | --- |
| Welcome, before | `screenshots/before-live-welcome-1440.png` | `screenshots/before-live-welcome-390.png` |
| New welcome, local Worker | `screenshots/local-welcome-1440-viewport.png` | `screenshots/local-welcome-390-viewport.png` |
| Playing Blocks, local Worker | `screenshots/local-blocks-playing-1440.png` | `screenshots/local-blocks-playing-390.png` |
| LOCAL source/file | `screenshots/local-fixture-source-1440.png` | `screenshots/local-fixture-source-390.png` |
| LOCAL create/import | `screenshots/local-fixture-create-import-1440.png` | `screenshots/local-fixture-create-import-390.png` |
| LOCAL proposals/diff | `screenshots/local-fixture-proposals-diff-1440.png` | `screenshots/local-fixture-proposals-diff-390.png` |
| LOCAL issue/conversation | `screenshots/local-fixture-issues-1440.png` | `screenshots/local-fixture-issues-390.png` |
| LOCAL task/access/settings | `screenshots/local-fixture-task-settings-1440.png` | `screenshots/local-fixture-task-settings-390.png` |
| LOCAL contribution history | `screenshots/local-fixture-profile-1440.png` | `screenshots/local-fixture-profile-390.png` |
| LOCAL GitHub picker | `screenshots/local-fixture-github-picker-1440.png` | `screenshots/local-fixture-github-picker-390.png` |
| LOCAL review runtime unavailable (honest error) | `screenshots/review-blocked-local-1440.png` | `screenshots/review-blocked-local-390.png` |

## Changed implementation and harness files

`src/worker.ts`, `src/welcome.ts`, `web/index.html`, `web/style.css`, `web/app.js`, `web/public/welcome.css`, `web/public/blocks.js`, `web/public/blocks-engine.js`; tests `test/blocks.test.ts`, `test/ui-boundary.test.ts`; local/browser receipt harnesses `scripts/ui-polish-worker.ts`, `scripts/ui-polish-game.ts`, `scripts/ui-polish-core.ts`, `scripts/ui-polish-collaboration.ts`, `scripts/ui-polish-github.ts`; documentation/screenshots/receipts under `docs/ui-polish/`.

## Deployment

Target: existing `cf-native-forge-evaluation` Worker, existing account `7efeb52ec5727a903edd8ef7ae8eb925`, existing custom host `https://gitflare.lintlabs.org`. Native Wrangler OAuth was verified for that account with token overrides unset. Source privacy was verified as private (`vasanthsreeram/cf-native-forge`, branch `main`). Deployment/version and live verification receipts are added after publishing this implementation commit. Hosted authenticated screens and completed human OAuth login are not claimed; app verification is local, and live verification covers the anonymous gate and game.
