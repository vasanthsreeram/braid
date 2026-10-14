# Current implementation and verification

Updated 2026-10-14 Singapore. The app is named **Braid** (renamed from Gitflare in `574dd54`); the domain `gitflare.lintlabs.org` and the Worker `cf-native-forge-evaluation` keep their old names. Source, migrated destination and evaluation resources are private. [Raw deployment/provider/migration receipts](core/raw) are separate from the unchanged historical benchmarks.

Status since 2026-10-02, from the commit history (claims of the commit author, not re-measured for this update):

- GitHub sign-in works against live WorkOS (`58f6d59`: first real logins, fixes for the provider/runtime mismatches they exposed).
- Coding agent runs (`f47d9e6`) and swarms (`e40f7f7`) exist and ran live once: a 3-agent swarm on one real repository, braided in one at a time with two automatic catch-ups.
- Deployed R2 LFS above 100 MiB is still blocked by missing bucket-scoped signing credentials (README).

| Feature | Implemented / exercised | Remaining live boundary |
|---|---|---|
| WorkOS login | Real provider authorize/code exchange, PKCE, encrypted cookies and strict client-pinned JWT verifier; GitHub sign-in against live WorkOS (`58f6d59`) | Multi-user and organization flows not re-verified |
| Sessions/orgs | Refresh rotation, org switch, POST/Origin protection, provider revoke/logout; live session and org-membership check on every authenticated request; local deny record | Contract tests use explicitly injected test provider; actual WorkOS lifecycle unverified |
| Ownership/ACL | Personal sharing, selected active org membership plus explicit reader/contributor/writer/admin; no implicit provider admin grant | Live multi-user/org flow requires WorkOS |
| Sharing/invites | Admin grants/list/revoke; seven-day verified-email-bound links, atomic one-time acceptance; revoked/expired/wrong email denied | UI and API tested locally; no email service sends invitations |
| Visibility/discovery | Private default, explicit repo-ID confirmation, task repos private, D1 name search over own/shared/public views, withdrawal and token revocation | Evaluation `ALLOW_PUBLIC=false`; no remote repo published |
| Create/browse | UI and API repo/task creation; immutable tree/file/README/history browsing; nested file UI | Local real bare Git; deployed app binding flow needs real identity |
| Native Git | Actual Artifacts clone/fetch/push, branch/tag fork, read/write scope, revoke, publisher | 12 direct provider checks pass; separate from app-authenticated credential flow |
| URL import | Strict public GitHub identity, recorded refs, native importer then checksum-verified streaming fallback; no depth/branch truncation | Native 40 MB limit measured; app full import unverified through WorkOS; Git-only limitations visible |
| Substantial migration | Maggie-s_Farm_consolidated: full original one-commit history, all 287 objects and 289 checkout files; no drift/LFS/submodules | Direct provider import; no fake D1 owner/adoption |
| Proposals/review/publish | Immutable base/candidate, ancestry/diff, explicit approval, trusted expected-ref publisher, fenced intent/recovery | Local UI/API and actual native atomic ref race verified; deployed authenticated end-to-end flow blocked |
| R2 LFS/dedupe | Standard Batch/basic/verify/download, checksum-verified CDC manifests/chunks, isolation, fork inheritance; local >100 MiB benchmarks retained | Real R2 direct staging credentials absent; no >100 MiB Cloudflare claim |
| Remote deployment | Correct account, dedicated Worker/D1/R2/Artifacts; 13 unauthenticated denial checks pass; bucket public access disabled | Authentication gate only until WorkOS configured |
| CI/Agents/Sandbox/Containers | Coding agent runs and swarms (see [Agents](#agents)): one agent per run on its own strand in a Cloudflare Container, Pi Durable loop on Workers AI, proposal into Changes. CI/check API still absent | Live runs exercised once, on one repository (`e40f7f7`) |

Run with Node ≥22.15, Git, npm and installed Chrome. git-lfs is required only for retained developer benchmarks.

```sh
npm ci
npm run typecheck
npm test
npm run test:worker
npm run test:ui
npm run test:ui:core
WRANGLER_SEND_METRICS=false npm run build
npm run dev                          # 127.0.0.1 only; explicit local test identity
npm run test:deployed                # deployed denials only
```

The local harness has real SQLite/bare Git/filesystem objects and an ephemeral loopback identity. It is absent from the production bundle. Provider auth contract tests inject a test transport/verifier explicitly; production never accepts that injection. The Worker requires WorkOS even for assets and ignores local/dev auth variables. Artifacts binding operations are always remote, so `test:worker` intentionally omits the binding and tests authentication only.

The old benchmark receipts, >100 MiB local LFS results, and five-repetition local HTTP/GitHub comparison remain unchanged under `docs/benchmarks/`. They are not measurements of deployed WorkOS/Artifacts/R2 latency. The added remote Git exercise is functional verification with finite synthetic commits, not a load benchmark.

## Minimal dedicated WorkOS setup

Historical (2026-10-02). Sign-in has worked against live WorkOS since `58f6d59` (2026-10-09), so the missing-key and 503 statements below no longer describe the live site.

Gitflare / Staging now exists with dedicated client `client_01M3WQ9VJ9G2MH74MYP7WBD708`, issuer verified through public OIDC discovery, and callback/logout/login/homepage configured for `https://gitflare.lintlabs.org`. Nonsecret runtime values and the custom domain are persisted in `wrangler.jsonc`. [Current setup, identity IDs and evidence](auth/result.md) supersede the original deployment gate receipts below.

The remaining auth setup is a **dedicated Gitflare Staging API key**. In WorkOS Dashboard, select lintlabs → Gitflare → Staging → API keys; reveal the project's initial key if supported, or create a key named “Gitflare Worker” for this environment/application. Save it manually in macOS Keychain Access as service `gitflare/workos-api-key`, account `gitflare`. Do not paste it into chat, source, an `.env`, or a shell command. Run `python3 scripts/configure-core-secrets.py`; it reads this entry into memory and installs only `WORKOS_API_KEY` through Wrangler stdin. The existing session seal secret remains in `cf-native-forge/session-secret` and Worker secrets. MCP OAuth does not supply an application API key.

Then execute a real login/callback/session/refresh/logout and organization/repository authorization exercise before treating the deployed product as functional. Until then `/auth/login` and callback deliberately return 503. Organization invitations require an existing active WorkOS membership; repo links do not provision org seats.

## Minimal R2 setup

Already-existing S3 credentials restricted to bucket `cf-native-forge-lfs-evaluation` on account `7efeb52ec5727a903edd8ef7ae8eb925`: access key ID and secret access key with object read/write authority. If unavailable, generation needs explicit user authorization; no account-wide key is created. Store under `cf-native-forge/r2-access-key-id` and `cf-native-forge/r2-secret-access-key`, account `cf-native-forge`; run `python3 scripts/configure-core-secrets.py --r2`. Account/bucket names are already configured. Verify with actual git-lfs before marking this live.

The dedicated bucket has public r2.dev access disabled and a one-day expiry rule for **only** `staging-v1/`. Tenant chunk/manifests are outside that prefix. No naive chunk garbage collection is installed.

## API

`GET /api/me`; `GET /api/repos?q=`; `GET /api/discovery?q=`; `POST /api/repos {name,url?}`; repo GET; grants GET/POST `{user,role|null}`; invites GET/POST `{email,role}` or `{revoke}`; `POST /api/invites/:id` accepts the link for a verified matching email. Visibility POST `{visibility,confirm}`. Repo `/log?ref=`, `/tree?sha=`, `/file?ref=&path=` return bounded safe source text. `/tasks` POST forks a private task. `/token` POST `{scope}` issues a 60-second native read or task-write credential. Canonical write issuance returns 403. If public visibility is enabled, authenticated readers may obtain a short-lived read credential for an explicitly public repo; withdrawal revokes it. Anonymous native token issuance remains denied.

`/proposals` GET/POST `{task,base,candidate}`; `/diff?proposal=` GET; `/review` POST `{id,status}`; `/merge` GET reads intent and POST `{id}` publishes an approved candidate; `/reconcile` POST checks actual refs/fences. Empty canonical seeding uses 40 zeroes as base and follows the same task/proposal/approval flow. `/check` is absent.

`/auth/login` and callback are GET; logout/refresh/organization are POST with exact Origin. LFS paths use SHA256/basic and explicit bearer/Basic access tokens. Git credentials are scoped native capabilities, not Git author emails or the WorkOS server key. API/LFS access rechecks live WorkOS state; native capabilities bypass the app until expiry or explicit provider revoke. ACL/visibility/logout paths revoke tracked tokens; externally revoked WorkOS sessions can leave already-issued native capabilities valid for at most their 60-second TTL.

## Agents

An agent works on its own strand: a private task fork of the canonical repository, created through the same `createTask` path as `POST /tasks`. The agent edits a checkout of that strand inside a Cloudflare Container, Braid commits and pushes the result to the strand, then opens an immutable proposal through the same `openProposal` path as `POST /proposals`. Nothing reaches the canonical history until a person approves and braids it in.

API (all under `/api/repos/:id/agent-runs`; never public-read; the existing `/agents` path remains the read-only reviewer):

- `POST {goal}` → `202 {runId,status:"queued"}`. Writer role, canonical repository, repository ready, goal 3–2000 characters without control characters. At most 3 active runs per repository (409; enforced synchronously in the per-repository registry before any await, for a whole swarm at once), at most 20 runs per repository per day (429) and 60 per day for the whole deployment (429). Without a session every agent/swarm route answers 401 (not 404) before any repository lookup, so the app refreshes its session.
- `POST /:runId/catch-up` (writer) → `202`. Only when the run is `proposed`, its proposal is not rejected, not braided, and its base is no longer the canonical head (otherwise 409 with a plain reason).
- `GET` → `{runs:[…]}` (latest 20; reader). `GET /:runId` → status, strand, base, candidate, proposal, summary, request count and the last 50 progress events (reader). `POST /:runId/cancel` (writer).
- Statuses: `queued`, `setting_up`, `working`, `pushing`, `catching_up`, `proposed`, `failed`, `cancelled`. The stored principal (including its session id) is never returned.

Runtime (`src/agent-run.ts`, `src/agents.ts`, entry `src/main.ts`):

- `AgentRun` Durable Object (SQLite). Instance `repo:<id>` is the registry (membership, admission caps, list); `run:<runId>` holds one run; `deployment-agent-budget` holds the daily deployment cap. A 30-second alarm heartbeat keeps the run alive, enforces the 20-minute wall limit and resumes an interrupted run (at most 2 resumes). Completed phases are persisted, so a resume never recreates the strand, re-pushes or opens a second proposal.
- Container: `scheduling_policy: "durable_object"`, the Cloudflare-managed `cloudflare/debian-trixie` image, `standard-1`, `enableInternet: false`. Git and CA certificates are installed with apt through an outbound HTTP intercept that only passes GET/HEAD to `deb.debian.org` and is closed right after install. No Dockerfile.
- Git credentials never enter the container. The strand remote's HTTPS host is intercepted by the `AgentGitGate` entrypoint, which mints a fresh 60-second Artifacts token per request for this run's strand only (revoked when the response ends), forwards only `info/refs`, `git-upload-pack` and — only during the push step — `git-receive-pack` for that exact repository path. Git trusts the intercept CA via `http.sslCAInfo`.
- Agent loop: Pi Durable `Harness` with the built-in `CodingTools` (read, write, edit, bash) over an `ExecutionEnv` implemented on `ctx.container.exec`; file tools are confined to `/work/repo` and `/tmp`. The Workers AI provider wrapper is shared with the reviewer (`workersAIModels` in `src/read-agent.ts`). Model `@cf/openai/gpt-oss-120b` by default (optional `AGENT_MODEL` var, `@cf/…` only). Budgets: 15 model requests per run (across resumes), 16 minutes of model loop, 120 seconds per command, 4096 output tokens per request. The Pi journal lives in the run object's SQLite (`src/pi-storage.ts`).
- Every phase and every model request rechecks the live session (local revocation, WorkOS session, organization membership) and the writer ACL; losing access stops the run before any push or proposal.
- Commits use author `Braid agent <agent@braid.invalid>`, are pushed to the strand's default branch, and the proposal's base is the canonical head at strand creation. If the canonical head moved meanwhile, the proposal is refused (409) and the run fails with that message; the pushed strand remains.
- UI: the **Agents** tab (`web/agents.js`, `web/agents.css`) starts runs, polls live status every 4 seconds while a run is active, shows the progress log and links to the proposal in Changes.

| Agents | Verified | Not yet verified |
|---|---|---|
| API ACL, validation, caps, strand exclusion, public-read denial | Contract tests (`test/agents.test.ts`) with a runtime double | — |
| Run engine phases, gated push window, resume without duplicate push/proposal, cancellation, ACL loss | Engine tests with container/model/app doubles | — |
| Pi CodingTools driving the container ExecutionEnv via Workers AI-shaped tool calls; request budget cutoff | Test with real Pi Durable harness + JSONL journal, scripted model, in-memory container exec | Real `gpt-oss-120b` tool-use quality on coding tasks |
| Container start, apt via intercept, HTTPS intercept of the Artifacts host, clone/push through the gate | Exercised live by the swarm run in `e40f7f7` (commit author's claim) | Other repositories |
| End-to-end run on the live site | Once, on one repository (`e40f7f7`, commit author's claim) | Runs on several repositories |

### Swarms and catching up

- `POST /api/repos/:id/swarms {goal, agents: 2..3}` (writer) → `202 {swarmId, swarm}`. One Workers AI request (`src/swarm.ts` `planSwarm`, same model as the agents) gets the goal and up to 200 repository paths and must answer `{"tasks":[{title, goal, files}]}`. Validation is strict and has no fallback: exactly `agents` sub-tasks, titles 3–80 characters and unique, goals 10–1500 characters, safe relative paths only (no `..`, absolute paths or `.git`), at most 12 files each, and no file (or directory prefix) declared by two sub-tasks. Anything else is a 502 with the reason; no runs start. Free slots are prechecked before the planner call and re-checked atomically when the runs are created.
- Each sub-task becomes an ordinary agent run on its own strand named `swarm-<sid8>-<n>-<slug>`. Its goal is the sub-task goal plus the overall goal as context and the files it owns. The deployment budget reserves all of a swarm's runs in one step.
- `GET /api/repos/:id/swarms` (latest 10) and `GET …/swarms/:sid` (reader) → plan plus per-sub-task status: `working`, `catching_up`, `proposed`, `approved`, `braided`, `rejected`, `failed`, `cancelled`.
- **Catching up** (`catchUpOnce` in `src/agents.ts`). A proposal is stale once anything else is braided in, because proposals require base = canonical head. The agent run is resumed with a 12-minute budget: new container, clone the strand, fetch the candidate's branch, fetch the canonical head through `AgentGitGate` (which now also lets the run *read*, never write, the canonical repository), then `git rebase --onto <new head> <old base>`. On conflicts the Pi loop gets only the conflicted files (at most 6 extra model requests in total, at most 3 rebase rounds); remaining conflict markers fail the catch-up. Sanity checks: the result descends from the new head, `git diff --check` reports no conflict marker, and it is not empty. The rebased commit is pushed to a new strand branch `braid/attempt-<n>` (no force-push; the strand's default branch keeps the original), a fresh proposal is opened with base = new head, and the old proposal is retired as `rejected` (the D1 table's CHECK has no other terminal state) with a review comment saying it was superseded, by which proposal, and whether the agent resolved conflicts. A person still approves and braids it in. At most 4 catch-ups per run.
- The same catch-up runs in place, reusing the container, when a run's own proposal is refused as stale because something was braided in while it worked (previously the run failed).
- UI: Agents tab has **Start a swarm** (goal, 2 or 3 agents, Plan and start), a list of swarm sub-tasks with live status (polled every 4 seconds while any is busy), and a **Catch up** button on a proposed run. A stale braid attempt in Changes points to it.

| Swarms / catch-up | Verified | Not yet verified |
|---|---|---|
| Concurrency (3 per repo, whole swarm atomically), planner validation, swarm view, ACL and 401 | `test/swarm.test.ts` | — |
| Catch-up: clean rebase, conflict resolved by the resolver, leftover markers, in-place catch-up, new proposal on the new head, superseded old proposal, strand default branch untouched, re-approved proposal braids in | `test/swarm.test.ts` with real local Git (bare repositories, real rebase/push) behind a container-exec double and a resolver double | Real `gpt-oss-120b` conflict-resolution quality |
| Planner JSON quality, three containers at once, catch-up through the gate on Artifacts | One live 3-agent swarm with two automatic catch-ups (`e40f7f7`, commit author's claim) | Swarms on other repositories |

Known limitations: no Internet in the container (package installs, tests needing downloads fail); one container per run, git installed per run (no snapshot reuse yet); no streaming of tool output; a model that ends without edits fails the run rather than asking for clarification; catching up is started by a person (Catch up), not automatically when another proposal is braided in; a catch-up container is not counted against the 3-run limit; no automatic braid queue.

## Publishing

Publish with the `cf` CLI: `cf deploy`. `cf deploy` reads `cloudflare.config.ts` (plus `wrangler.config.ts` for the assets directory) and ignores `wrangler.jsonc`, so keep the two configurations in step. Always run `cf deploy --dry-run` first and check that it names the Worker `cf-native-forge-evaluation` and lists every binding.

Status on 2026-10-14 (measured with cf 1.0.0-beta.14): `cf deploy --dry-run` stops with an error before listing bindings. cf writes `script_name` on every Durable Object binding declared in `cloudflare.config.ts`, then refuses to attach the `AgentRun` container to a class bound that way. With the `AGENTS` binding removed (diagnostic only, not committed), the dry run passes and lists every other binding. So `cf deploy` cannot publish Braid yet, and there is no `deploy` script. `npm run build` (Wrangler dry run of `wrangler.jsonc`) still passes.

Not measured: how cf treats the existing Durable Object migration tags (`v1-review`, `v2-agent-run`) when `exports` declares the same classes, and whether cf reuses the existing container application name `cf-native-forge-evaluation-agentrun`.
