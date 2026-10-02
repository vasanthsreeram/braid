# Gitflare collaboration, issues, theme and Pi review — acceptance record

Recorded 2026-10-02. **The implementation is deployed; the complete user task is not finished.** Genuine Gitflare GitHub login, private self-import, genuine multi-user hosted acceptance and hosted review/finding publication remain blocked or unverified. No app principals, verified emails, memberships or repositories were fabricated to make a demo pass.

## Deployment and source

- Custom domain: https://gitflare.lintlabs.org — final browser receipt establishes TLS 1.3.
- Worker: `cf-native-forge-evaluation`, version **`7a1749a8-824f-48e2-8a75-6e60d0c99d5f`**. [Deployment receipt](raw/deploy-final.txt).
- Deployed code commit: **`adaf46498d98337547650b3ca4dc671870423689`**, following feature commit `12bfa66f551ad90936f7d70cc63d96bba1a1426b` and baseline `c844019963e2362c9eaf8475deb59a23cc7a04ed`.
- Source remains PRIVATE: [vasanthsreeram/cf-native-forge](https://github.com/vasanthsreeram/cf-native-forge). GitHub remains the retained fallback. Final documentation/main SHA and clean-tree/private verification are recorded in the external handoff, avoiding a self-referential commit hash here.
- D1 migration `0005_collaboration.sql` and SQLite DO migration `v1-review` are deployed. [D1 receipt](raw/migration.txt). AI and REVIEWS bindings are committed in wrangler.jsonc; there is no paid-plan upgrade.

## DONE and remaining acceptance

| Scope | Result | Boundary |
| --- | --- | --- |
| Native issues | DONE implementation + local acceptance | Real issue IDs/title/body/author/state/assignee/labels/comments/audit and guarded concurrency; genuine hosted acceptance pending login |
| Collaboration | DONE implementation + local acceptance | Existing grant/invite/task/review CAS reused; independently authenticated local actors are test identities, not real human accounts |
| Cream/orange UI | DONE | Actual reference rendering inspected; cohesive workspace/editor/history/profile/picker/issues/reviews; 390/1440 journeys and screenshots; no Cloudflare branding/affiliation |
| Pi read-only runtime | DONE integration + real provider/runtime checks | Pinned experimental Pi Durable 1.0.0; portable SQLite-backed JSONL; actual immutable own-source reads and real Workers AI requests |
| Hosted authenticated review | BLOCKED | No real app session or app-owned imported project; no hosted job has been admitted under a genuine principal |
| Actionable live finding publication | NOT VERIFIED | Real outputs with valid citations included false positives and were rejected on inspection. Final scans returned no findings. No live finding was published; publication/idempotency tests use explicit provider contract doubles |
| Private own-source import | BLOCKED | Authenticated bundle capability implemented/tested locally; live import count is zero; no destination object/file equivalence or cutover claimed |
| Prior 2–3 public sources | BLOCKED | Exact prior candidates are cloudnee, himaldb and formninja under vasanthsreeram; use the earlier recorded source refs, never modify the originals |
| BYOK/Codex OAuth/Grok OAuth | DONE planning only | Three private researched issues created; no implementations or subscription/consumer/CLI credentials repurposed |

Live read-only D1 count: **0 repositories, 0 connected GitHub accounts, 0 issues, 0 grants**. [Receipt](raw/live-counts.json). The earlier provider-only Maggie’s Farm migration is not an app-owned imported repository.

## Permission and concurrency behavior

Owner/admin retains existing grant/invitation and review decision permissions. Writers create/update issues and request/cancel static review. Authenticated current readers inspect private aggregates and append comments to existing issues or immutable proposals; they cannot change metadata, approve/merge proposals, modify grants or start jobs. Anonymous public-read permission never grants access to issues, collaborators, discussion or agent jobs. Only the repository owner can enable finding publication, which starts disabled.

Assignees require a profile obtained through authentication, current readable repository access and active WorkOS membership for organizations. Collaborator responses expose names and opaque IDs rather than emails. Verified-email invite acceptance and organization isolation remain enforced. Local acceptance covers owner/writer/reader/outsider/other-organization identities, revoked access, revoked sessions, task proposal/review discussion, and reader denials. Provider contract tests do not establish genuine human membership.

Issue updates require a version. Comment insertion guards the current version and uses SQLite triggers to advance it and write audit atomically. Concurrent updates yield one success and one 409. The browser retains stale drafts; an asynchronous detail reload race found during testing was fixed so a saved closed state actually persists. Comments are text, including hostile HTML strings. Native issue searches and lists are bounded.

## Pi architecture and real inference evidence

The official [Pi Durable article](https://earendil.com/posts/pi-durable/) and [durable README](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md) were read before implementation. pi-durable, pi-ai and chord are pinned to 1.0.0. A single repo DO owns a harness and its JSONL journal. Custom synchronous SQLite filesystem operations persist journal sidecars before the Pi commit marker. No CodingTools, execution environment, shell, installs, tests, source edits, agent pushes, automatic merges, Sandbox, Containers, Agents SDK or native CI are exposed.

Four scope-checked tools are registered: `read_file`, `list_files`, `read_commit`, `read_diff`. Selected source SHAs are immutable. Paths cannot traverse directories, cross repositories, follow symlinks/submodules or read binary/non-UTF-8/oversize files. Every source API request rechecks writer ACL, local session revocation, actual active WorkOS session and organizational membership; dispatch and publication also recheck them. Journal directory listing was hardened to reject other journal scopes and use literal prefix matching instead of SQL LIKE wildcards. A targeted isolation check and the official storage conformance suite pass.

The documented [Workers AI GPT OSS 120B model](https://developers.cloudflare.com/workers-ai/models/gpt-oss-120b/) is the final default: `@cf/openai/gpt-oss-120b`, low reasoning, host-owned Cloudflare binding. Official model metadata/types and actual account availability were checked. No BYOK or OpenAI account authorization is involved: inference is provided by Cloudflare’s existing authorized account. Dollar costs are estimates from documented model prices, not billing receipts or a free-inference claim.

Limits: 3 model requests/job, 1200 output tokens/request (including provider reasoning), 60000 serialized request bytes, 48000 aggregate source bytes, 16000 bytes/file, 120 source API reads, 12 logical tool calls, 8 files, 16 path segments and a 45-second cancellation deadline. Already-pending provider/storage I/O may take longer to settle; no hard wall-clock completion guarantee is claimed. One active job/repo, 12 jobs/repo/day, 3 attempts per retained scope and a deployment DO reservation of 36 model dispatches/day. Latest 20 terminal jobs/journals are retained; D1 audits remain. Cancellation prevents new reads, dispatches and publication but cannot guarantee cancellation of a provider request already submitted. Provider/JSON/evidence failures do not automatically retry. Busy watchdog alarms are rescheduled, and settling cancelled work preserves any queued retry’s alarm. A process crash reports interrupted work and requires explicit bounded retry, preserving the journal rather than replaying an uncertain charged request.

Two distinct real verification boundaries were exercised:

1. [Local immutable Git + real Workers AI REST](raw/live-read-review.json): actual private project commit `12bfa66…`, base `c844019…`, selected `src/review-coordinator.ts`; Pi called read/list/commit/diff and a real model-selected read_file tool round. Two model requests, 26944 source bytes, 17 source API reads, refs before/after identical, final findings empty, `testsRun:false`. This is not a WorkOS login or hosted app job.
2. [Real workerd DO + remote Workers AI binding](raw/worker-pi-smoke.json): durable SQLite/Pi journal closed/reopened with value 42; 36 reservations allowed and the 37th rejected with 429 in an isolated verifier DO; actual `src/pi-storage.ts` object bytes/SHA from the same private commit, flattened only inside the source snapshot adapter; one real model request, final findings empty. This is not a live app-owned repository and did not consume production review quotas.

Diff tools currently report selected paths’ changed object hashes/modes, with actual target file contents read separately; a full textual patch/before-content review is not claimed. Findings validate source SHA, read path, line range and literal evidence, not semantic correctness. A trusted broker may post validated findings as idempotent private issues only after owner opt-in and current access checks; the model itself has no publication tool. Tests prove this publication mechanism with clearly labeled inference doubles.

Initial real requests produced malformed citations, output truncation and valid citations with incorrect explanations. These failures were retained rather than relabeled as successes. [Quality assessment](raw/model-quality-assessment.json) explains why SQL-injection and async/timeout allegations were rejected. Final prompts require tracing helpers and concrete deterministic defects; final real scans returned no findings. **Accepted actionable live findings: 0; published live finding issues: 0.** Human quality acceptance remains required before enabling automatic broker publication.

## Verification receipts

| Check | Result | Receipt |
| --- | --- | --- |
| TypeScript | Passed | [typecheck](raw/typecheck.txt) |
| Application tests | 53 passed, 0 failed | [tests](raw/tests.txt) |
| Pi journal | 23 official conformance checks + 1 scope/isolation check passed | [journal](raw/pi-journal-conformance.txt) |
| Workers dependency/bundle build | Passed | [build](raw/build.txt) |
| Local production Worker auth/CSRF denials | 7 passed | [workerd auth](raw/worker-auth-smoke.json) |
| Core desktop/mobile journeys | 19 checks each at 1440/390 | [desktop](raw/ui-1440.json), [mobile](raw/ui-390.json) |
| Collaboration browser journeys | 10 checks each, two independent contexts, no page errors | [collaboration](raw/ui-collaboration.json) |
| Connected picker | 4 checks, local provider contract doubles | [picker](raw/ui-picker.json) |
| Deployed unauthorized/CSRF/ACL checks | 27/27 passed | [denials](raw/deployed-core-smoke.json) |
| Deployed browser/TLS/login gate | 6 passed at 390/1440, actual GitHub human-login stop | [browser](raw/deployed-browser.json) |
| Real Pi/model/DO | Completed under boundaries above | [Git/provider](raw/live-read-review.json), [workerd/binding](raw/worker-pi-smoke.json) |

These engineering tests were run by this job on trusted implementation/local fixtures. The review agent never ran tests or executed imported repository code. Genuine callback/code exchange/session refresh/logout and two human users’ hosted ACL/comment/revocation flows are not verified.

Screenshots: [mobile deployed gate](ui-live-gate-390.png), [desktop deployed gate](ui-live-gate-1440.png), [mobile issue detail](issue-detail-390.png), [desktop issue detail](issue-detail-1440.png), [mobile workspace/issues](issues-390.png), [desktop workspace/issues](issues-1440.png), [mobile profile](ui-390-profile-viewport.png), [desktop profile](ui-1440-profile-viewport.png), [mobile picker fixture](ui-picker-fixture-390.png), [desktop picker fixture](ui-picker-fixture-1440.png), [mobile review unavailable state](review-blocked-local-390.png), [inspected reference](theme-reference.png). Authenticated product screenshots are local test-account journeys; hosted screenshots prove only the real anonymous gate/GitHub login stop.

## Private self-import and history preservation

`POST /api/bundles?name=…` accepts an unrestricted v2 SHA-1 Git bundle through actual app authentication and CSRF controls. It reserves a fresh private owner destination, records operation intent, validates branch/tag refs, streamed pack checksum, native receiver report status and advertised destination refs, and revokes the ephemeral native write transport credential. Source objects are never rewritten. Unsupported/prerequisite headers, corrupt packs or receiver failures retain failed intent. Limits: 64 KiB header, 512 branch/tag refs, 100 MiB compressed upload, 200000 objects; Artifacts receiver limits remain 32 MB/blob and 1 GB/repo. A compressed cap cannot prove receiver repository storage limits; receiver validation is mandatory. LFS/submodule contents require separate migration. Symbolic HEAD/default-branch equivalence outside this project’s main branch is not guaranteed by the bundle route.

Local authenticated real-Git upload tests compare all branch/tag tips, all reachable object contents and commit authors/dates; corruption and unauthorized attempts fail. They are not Artifacts hosted acceptance. The own-source preflight at deployed commit `adaf464…` has 592 reachable objects, 15096806 uncompressed object bytes, largest historical blob 525863 bytes, bundle 10756902 bytes. [Preflight](raw/private-bundle-preflight.json). The final main-tip bundle and metadata are regenerated after documentation publication and recorded in the external handoff; `.tmp/gitflare-private.bundle` stays private/ignored. There is still no live destination to compare.

After authenticating, use the private bundle picker, then obtain an app-issued read capability and compare every source/destination published branch/tag ref, reachable object IDs and bytes, commit metadata and tree file bytes/modes. Retain GitHub until these checks and genuine collaborator acceptance pass. No authoritative cutover has occurred, and no original public source was modified.

## Exact human prerequisite

[Latest scoped WorkOS query](raw/workos-github-credentials.json) still returns **no dedicated GitHub OAuth credential record**. [Keychain/session probe](raw/human-auth-blocker.json) confirms dedicated client ID/secret absent and the real provider user has **0 active sessions**. API-secret acceptance and `gh` identity are not Gitflare login. The real deployed browser reaches GitHub `/login`; credentials/2FA/consent were not entered or bypassed. Native in-app browser bootstrap failed with `missing field sandboxPolicy`; after that failure standalone Chrome/Playwright was used for the recorded real browser journeys.

Required human action:

1. Sign into GitHub as vasanthsreeram and WorkOS Dashboard, completing any 2FA/sudo-mode prompts.
2. In **lintlabs → Gitflare → Staging → Authentication → OAuth providers → GitHub → Manage**, use the displayed WorkOS provider Redirect URI to register a dedicated Gitflare GitHub OAuth App. Homepage: `https://gitflare.lintlabs.org`. The GitHub app callback is the WorkOS provider callback, not Gitflare’s `/auth/callback`.
3. Configure those dedicated credentials in Gitflare Staging and enable **Return GitHub OAuth tokens**. Leave additional scopes empty for the public picker; private own-source upload needs no GitHub repository-token scope. If using the checked setup script, save client ID/secret in Keychain Access services `gitflare/github-client-id` and `gitflare/github-client-secret`, account `gitflare`; run `python3 scripts/configure-github-integration.py` only after the dedicated provider credential record exists. Do not put secrets in chat/files/shell arguments. No unrelated environment is modified.
4. Use deployed **Sign in with GitHub** and complete real consent/identity verification. A second genuine collaborator must independently sign in and verify their email; no second human account or membership was invented.

The earlier `/Users/admin/.hermes/profiles/vastelegram/work/gitflare-github-auth-import-result.md` retains the exact source-ref/preflight receipts for cloudnee, himaldb and formninja. After human setup, resume callback/account/import/session and two-user acceptance, then hosted read-only review and optional owner-enabled issue publication. Stop at any mandatory new human consent prompt.

## Backlog split

All #1–#6 remain open. Issue tracking/commenting/collaboration and static Pi reading are implemented and locally accepted; #4’s agent assignment/PR linkage and #6’s full PR/push acceptance remain unfinished. #5’s executable/write issue-to-PR workflow stays deferred. R2 remains optional artifact storage, never compute or transactional journal authority.

Research-only private issues: [#7 BYOK](https://github.com/vasanthsreeram/cf-native-forge/issues/7), [#8 Codex OAuth](https://github.com/vasanthsreeram/cf-native-forge/issues/8), [#9 Grok OAuth](https://github.com/vasanthsreeram/cf-native-forge/issues/9). Body sources and acceptance gates are in [planning](planning/). Official OpenAI Sign in with ChatGPT distinguishes OSS/local token sharing from hosted/commercial partner registration; hosted Gitflare is not assumed authorized. Official xAI API keys/account docs and consumer/Build auth do not establish a supported third-party hosted Grok OAuth grant. Unsupported/unknown avenues are explicit; no local Codex/Grok CLI consumer credentials were accessed for agent inference. Documentation-only OpenAI Developer Docs MCP was registered during official-auth research; no provider OAuth implementation was added.
