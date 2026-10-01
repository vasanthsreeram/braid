# Cloudflare-native CI and deferred repo agents

> Historical planning baseline. Implementation is now authorized; see [current implementation status](../implementation.md). Original scope/research is retained below.

Research date: **2026-10-01 (UTC)**. Primary documentation was fetched live on this date; numerical limits below are documentation observations, not measurements of this project's Cloudflare account. No deployments, runner experiments, code, configuration, or Git operations were performed.

**Scope decision / recommendation:** build a small native CI service, not a GitHub Actions clone. Workers handle the control plane; Linux Containers provide the execution plane; Workflows coordinate durable runs; Queues buffer dispatch. **Agents SDK + Sandbox repo-edit/test agents are KIV (keep in view), explicitly NOT MVP.** Native CI feasibility is conditional on the validation gates below, particularly beta APIs, untrusted-code containment, and reliable cancellation.

**Native forge integration:** source checkout and task publishing use Cloudflare Artifacts repositories/capabilities. References below to GitHub credentials describe optional upstream import or future source-provider integration, not a required GitHub-backed CI control plane. Agents remain KIV; sandbox CI is deterministic execution, not hosted-agent implementation.

## 1. Verified platform facts

### Workers are isolates, not a generic Linux runner

Workers execute in V8 isolates. Multiple concurrent requests can share an isolate; global mutable state is not durable or a reliable distributed lock [S1]. Workers provide a subset of Node.js APIs, including non-functional import stubs. In particular, `node:child_process` is listed as a non-functional stub [S2]. Node compatibility therefore does **not** provide shell execution, arbitrary native binaries, a Docker daemon, or the semantics of a GitHub-hosted Ubuntu machine. Workflows and Queue consumers also run Worker code; neither turns it into Linux.

Use a separate Dynamic Worker only for intentionally constrained JS/Python/Wasm workloads exposed to narrow capabilities, not by evaluating untrusted repository code inside the privileged control-plane Worker. Cloudflare separately documents Linux sandboxes as Containers: each instance is a microVM with its own kernel and network [S7]. This is the appropriate candidate for dependency installation, repository checkout, compilers, test processes, and native tools. An isolate-only CI promise would be misleading.

### Availability and verified limits

| Component | Live-doc fact | CI implication / recommendation |
| --- | --- | --- |
| Workers | Free/Paid tiers; 128 MB memory **per isolate**; HTTP CPU 10 ms Free, 30 seconds default Paid, configurable to 5 minutes Paid [S3] | Keep orchestration cheap; stream uploads/downloads rather than buffering build output. CPU budget is not a Linux process budget. |
| Worker wall time | HTTP has no hard wall limit while client remains connected, but disconnect/response can cancel tasks; `waitUntil` extends at most 30 seconds afterward. Queue consumer wall limit is 15 minutes [S3] | A held HTTP connection or `waitUntil` is not durable job scheduling. Persist acceptance before returning. |
| Workflows | Available on Free and Paid [S4]. Per step: 10 ms Free or 30 seconds default / 5 minutes configurable Paid CPU; unlimited wall time; 1 MiB non-stream result and 1 MiB event payload; 100 MB Free / 1 GB Paid persisted instance state [S5] | Store artifact references, not artifacts, in Workflow results. Unlimited wall time does not grant unlimited CPU or keep a Linux instance alive automatically. |
| Workflow concurrency | Limits table: 100 Free / 50,000 Paid running instances; waiting instances excluded. Creation: 100/s Free, 300/s/account and 100/s/workflow Paid. Completed state/log retention: 3 days Free / 30 days Paid [S5] | These are orchestration ceilings, not CI execution slots. **Docs conflict:** the same page's explanatory prose still says 10,000 running instances. Do not choose capacity from either value until account validation/support clarification. |
| Workflow steps/retries | 1,024 steps Free; 10,000 default Paid, configurable to 25,000. Maximum retries per step 10,000 [S5] | Set much smaller product budgets; nested retries can otherwise multiply execution cost. |
| Queues | Available on Free/Paid [S15]; at-least-once delivery [S14]. 128 KB message, 100-message batch, 250 concurrent push consumer invocations, 5,000 messages/s/queue, 15-minute consumer wall time, maximum 100 retries. Retention Free fixed 24 hours; Paid configurable up to 14 days [S13] | Enqueue IDs/references. Queue invocation concurrency is neither active build concurrency nor exactly-once execution. |
| Linux Sandbox / Containers | Available on Workers Paid. Sandbox uses the **Durable Object scheduling policy, public beta** [S7, S9]. That policy does not support `max_instances`; account resource limits apply [S9] | Product must implement bounded admission. Do not claim `max_instances` protects the chosen sandbox policy. Do not infer GA status for all Containers from the landing page. |
| Container sizing | Named instances include lite: 1/16 vCPU, 256 MiB, 2 GB disk; standard-1: 1/2 vCPU, 4 GiB, 8 GB; standard-2: 1 vCPU, 6 GiB, 12 GB; standard-3: 2 vCPU, 8 GiB, 16 GB; standard-4: 4 vCPU, 12 GiB, 20 GB [S10] | Runtime policy accepts those names, **not `basic`**, even though the general instance table lists basic. Pin images/toolchains and select tested sizes [S9]. |
| Container account ceilings | Documented concurrent totals: 1,500 vCPU, 6 TiB memory, 30 TB disk; total image storage 50 GB [S10] | Not a guarantee of immediate placement, availability, or this account's effective quota. Validate cold starts and quota behavior. |
| Container lifetime | Inactivity timeout can be set up to 6 hours. Work inside the instance does not count as Durable Object activity. Restarted Durable Objects need timeout reapplied [S8] | A build can be killed by inactivity even while busy. Monitor using durable alarms/workflow coordination and apply a separate maximum job deadline. No blanket maximum job duration is asserted here. |
| Snapshots | Public beta; save writable root filesystem, not memory/processes or mounted filesystems. Maximum 20 GB; expire 30 days after creation/most recent restore [S8, S10] | Snapshot is not a running-process checkpoint or permanent artifact store. Fresh CI attempts should not resume stale process IDs. |
| Workers Logs | Free retention 3 days, Paid 7 days; sampling supported; Worker log data per request limited to 256 KB [S3, S18] | Platform logs are diagnostics, not a complete durable CI console log. |

**Documentation drift:** current Sandbox docs explicitly distinguish the current API from Sandbox SDK 0.x and provide migration guidance [S7]. Avoid combining old `Sandbox`/session lifecycle recipes with current direct Durable Object Container APIs. Workflow class-size rows and Agents script-size footnotes also lag the newer Workers size table; they are not used here as deployment-size guarantees. No target-account entitlement, regional SLA, or empirical throughput was verified.

## 2. Proposed native CI architecture (recommendations, not implemented)

1. **Worker ingress:** authenticate project/user or verify source webhook; validate a small job specification; resolve immutable repository commit and trusted pipeline definition. Create a durable run record before acknowledging submission. Untrusted PRs must not choose privileged pipeline policy.
2. **Durable job ledger / admission coordinator:** a Durable Object-backed authority tracks transitions, quota leases, concurrency groups, cancellation epochs, job attempts, and external-result publication. A query/index database may mirror it, but must not introduce competing authorities.
3. **Queue dispatch:** dispatch run IDs after durable acceptance using a recoverable outbox/reconciler. A consumer claims work and starts/locates its Workflow; it must not hold a message open for the entire Linux build. Acknowledge only after durable handoff, not just after an ephemeral API call.
4. **Workflow orchestration:** acquire execution capacity, provision one sandbox per job attempt, perform checkout/install/test/build through the execution controller, await completion using events or bounded polling, collect artifacts, finalize result, release capacity. Use persisted state to reconcile after interruption.
5. **Linux execution:** a pinned Container image supplies Git, shell, runtime, compilers, and required tools. Readiness must be checked; `start()` initiates boot before readiness [S9]. Run with restricted egress and no production credentials. Each attempt owns a fresh sandbox identity.
6. **R2 storage:** use attempt-scoped log chunks and artifacts plus an authenticated access layer. R2 supports streaming, multipart uploads, conditional writes, and strongly consistent writes [S19]. CI retention, ownership, checksums, quotas, and publication manifests remain application responsibilities.

For MVP, choose an explicit supported Linux toolchain and native command-step contract. Windows/macOS builds, unrestricted third-party actions, privileged deployment steps, arbitrary user-supplied images, and arbitrary Docker/service-container workflows should not be promised. Agents add no required capability to deterministic CI orchestration and are deferred.

### Concurrency, retry, idempotency, and cancellation

**Verified:** Workflows exposes pause/resume, terminate, restart, status, and subscriptions. Normal `create` rejects an already-used ID within retention; `createBatch` skips existing IDs idempotently. Restart-from-step reuses earlier cached step results. `terminate()` does not run rollbacks unless requested; deleting a running instance stops execution without rollbacks [S6]. Queues can redeliver [S14]; DLQs receive failures after the retry budget, and without a DLQ exhausted messages are permanently deleted [S16]. The background-process guide shows explicit process-group management, boot IDs to disambiguate restored PIDs, logs and exit-code files, and durable alarms [S12]. Those are a recipe, not a built-in managed CI runner.

**Recommendations:**

- Distinguish run ID, attempt ID, step ID, container incarnation, and publication ID. Use a stable dedupe key incorporating project, trigger/delivery identity, commit and pipeline version. Keep product dedupe records beyond Workflow retention; retained Workflow IDs alone are insufficient.
- Enforce global, project, user, and resource-weighted budgets with durable leases/fencing. A retry cannot create a second live sandbox under the same lease. Account quotas and Queue concurrency are insufficient admission policy.
- Retry transient scheduling/network/platform failures with bounded backoff; ordinary test failure is a terminal test result, not an automatic infrastructure retry. An uncertain process launch must be reconciled, not blindly relaunched. Publishing results/artifacts needs conditional writes and an outbox, since Workflow persistence does not atomically commit external side effects.
- Cancellation must first persist intent and fence all later completions, then stop the **Linux process tree or destroy the attempt's entire sandbox**, terminate orchestration as appropriate, abort uploads, and release the lease exactly once. Workflow termination alone does not prove the independently started Linux process stopped. Graceful TERM is best effort; sandbox destruction is the containment fallback.
- A cancellation tombstone must cause late Queue messages, old callbacks, or retries to be ignored/acknowledged without resurrection. A new rerun uses a new attempt. Pausing orchestration does not imply pausing Linux processes or billing.
- Run a watchdog/reconciler for orphan sandboxes, lost exit codes, expired leases, abandoned uploads, and missing completion publication. Cleanup must not rely solely on finally blocks or rollback callbacks.

### Logs, artifacts, caches, and secrets

**Facts:** sandbox instance disk/files disappear when the instance stops unless saved externally or snapshotted [S8]. Current background-process examples write logs on disk, which can fill [S12]. Cache API content does not replicate beyond the originating data center [S17]. Worker secrets are encrypted bindings but readable by Worker code [S20]. Isolation does not protect a credential placed inside the sandbox from the code running there [S11].

**Recommendations:**

- Stream bounded stdout/stderr chunks to R2 with run/attempt/stream/sequence identifiers; live UI uses cursors and reconnectable streams. Store terminal status and truncation/incomplete flags separately. Rate-limit output and cap disk/memory; never print the entire build log through Worker console.
- Artifacts are untrusted: limit total bytes/count, reject traversal and symlink escapes, verify digest/manifest, authorize downloads, render HTML as unsafe content or serve on a separate origin, and apply explicit retention/deletion policies. A sandbox's claimed test result is evidence, not permission to execute a privileged deployment.
- Use content-addressed R2 dependency caches scoped by tenant/repo, trust class, platform, toolchain/image digest, lockfile and cache format. Cache misses must be harmless. Fork/PR runs must not overwrite protected-branch caches. Do not use the edge Cache API as the authoritative shared build cache, and do not restore whole job snapshots across trust boundaries.
- Keep source-provider and publication credentials in trusted Workers/gateways. Give sandbox checkout narrowly authorized access to one repository and immutable commit. Cloudflare documents a read-only Git HTTPS gateway allowing upload-pack and rejecting receive-pack without exposing the token [S21].
- Restrict outbound HTTPS destinations **and methods/path/repository**, reject redirects that could forward credentials elsewhere, and retain `enableInternet: false` while using interception. Registry access remains an exfiltration channel and needs threat analysis. Never pass the Cloudflare account token, GitHub App key, production secrets, or broad R2 credentials into repository tests.
- Log redaction is defense in depth, not a security boundary: malicious code can encode secrets. If a build genuinely requires a secret inside its process, classify that as trusted execution with explicit owner approval, not safe untrusted PR execution.

## 3. Arbitrary untrusted code: what is and is not isolated

Cloudflare states that each Linux sandbox instance is a microVM and separates it from the Worker/other sandboxes [S7]. **Within a single sandbox, every process shares the Linux system, files and localhost.** Current docs say deployed processes have root-equivalent capabilities; a separate Linux user/file permissions do not isolate tasks [S11]. Separate sessions are therefore not tenant security boundaries.

Allocate one fresh sandbox per trust unit/job attempt. Derive its name from authenticated ownership plus an unguessable attempt identity; an arbitrary URL parameter is not authorization. Validate control APIs independently of the model/repository. Never mount another tenant's files, global writable cache, or unrestricted bucket. Bound network, resource usage and billing at the control plane. Protect internal APIs against SSRF, confused-deputy requests, and fabricated completion callbacks.

This is not a claim that arbitrary hostile code is risk-free. Kernel/platform vulnerabilities, cross-tenant naming mistakes, token-proxy policy errors, dependency supply chains, egress leaks, denial-of-wallet, malicious logs/artifacts and unsafe previews remain open risks. Preview apps require a separate origin; Cloudflare explicitly warns that previews served on the application hostname can use its cookies and APIs [S11].

## 4. GitHub Actions compatibility tradeoffs

**Verified baseline:** Actions workflows are repository YAML, event-triggered jobs on runners, with script or reusable-action steps [S24]. GitHub-hosted runners provide Linux/Windows/macOS tool environments and a runner application; most are fresh VMs, with a documented single-CPU container exception [S25]. A Linux environment alone is not the Actions runner protocol or workflow engine.

| Approach | Recommendation / cost |
| --- | --- |
| Native CI job format with source-provider checks/status links | **Preferred MVP.** Explicit supported commands, predictable security/cost, independent storage and orchestration. Existing workflows need migration. |
| Import a documented subset of Actions YAML | Possible later adapter, not compatibility claim. Reject unsupported fields rather than silently changing meaning. Expression contexts, matrix/needs, reusable/composite/JS/Docker actions, job outputs, workspace/env file semantics, concurrency/cancellation, environments/approvals, cache/artifact APIs and OIDC require independent implementation or delegation. |
| Run genuine Actions runner inside Containers | Later validation option. Requires runner registration/connectivity, lifecycle/cleanup, platform resource fit, and host features. GitHub still coordinates Actions; Cloudflare hosting does not remove that dependency or guarantee billing savings. No successful compatibility test is claimed. |
| Translate arbitrary YAML or use an emulator | Not recommended for MVP. Semantics and action security are a large maintenance surface, separate from native build execution. |

A job from this forge can expose source-provider checks without being a GitHub Actions run. Do not call native R2 artifact/cache APIs drop-in replacements for `actions/upload-artifact` or `actions/cache`. Linux-only Containers do not provide Windows/macOS runner equivalence; Docker-in-Docker, privileged actions and service-container networking require separate experiments rather than assumption.

## 5. KIV only: Agents SDK + Sandbox repo-edit/test agents

**Status: deferred feature, not an MVP dependency, acceptance criterion, or implementation commitment.** Revisit after CI isolation, job accounting, logs, and cancellation are proven.

### Verified capability and persistence boundaries

The Agents SDK supplies durable identity, state, sessions, connections and scheduled/recoverable work [S22]. Agent state automatically persists to per-instance SQLite and survives restarts/hibernation; `setState` broadcasts it to connected clients and clients can update it unless application policy prevents that [S23]. Agent/Workflow orchestration and sandbox files are **different storage domains**. The Sandbox tool docs explicitly say agent workspace tools are not the Linux sandbox filesystem; sandbox files need snapshots or external storage after instance termination [S26]. Agent state persistence does not checkpoint Linux processes, prove exactly-once tool calls, or confer repository authorization.

The Agents limits page currently reports 1 GB state per agent and 30-second refreshed CPU budgets, but is older than several platform pages [S27]. Do not derive concrete agent capacity from its “tens of millions” description or assume its reported storage/CPU values supersede current Durable Objects limits. Resolve effective limits in a later account experiment. Sandbox-backed agents require Paid Containers; the selected scheduling policy and snapshots are public beta.

### Recommended future design and repo permissions

- One tenant/project/task-scoped Agent identity coordinates a separate task sandbox, records base commit, requested scope, tool receipts, cancellation intent, latest snapshot/artifact pointers, and user approvals. Store secrets outside synchronized state; use server-owned transitions and authenticated/read-only client views.
- Clone exact base commit, edit in sandbox, run tests through the same bounded CI contract, and return patch plus test logs. Recovery reconciles actual filesystem/process state; snapshot restore does not resume processes. Use durable orchestration for external tools and receipts keyed by attempt.
- Treat repository instructions, dependencies and output as prompt-injection-prone data. An agent must not authorize its own repo writes or expand egress/permissions based on a file or test log. Human approval must be bound to the exact patch, base commit and requested side effect; stale approval is invalid after edits or branch movement.
- If integrating GitHub, use an App installation restricted to selected repositories, mint repository- and permission-downscoped tokens at the trusted gateway, and refresh there. GitHub documents installation tokens expiring after **one hour**, with optional repository and permission scoping [S28]. Agents SDK supplies no automatic GitHub permissions.
- Checkout/test needs Contents read only. Initially return a diff with **no repo write permissions**. Only an explicit later publish feature needs Contents write to a controlled feature branch and Pull requests write to open a PR. Checks write, if needed, belongs to a separate trusted result publisher. Do not grant administration, secrets, workflow write, merge or deployment capability by default. Enforce branch/path restrictions server-side; token scopes alone do not establish those product policies.
- Revalidate requester rights and installation status at each privileged operation. Never give push authority to untrusted tests. A separate approved publisher consumes a validated diff, rejects forbidden paths/oversized patches, checks base SHA, and refuses default/protected branch mutation. Auto-merge and autonomous production deployment remain excluded.

**Future re-entry gate:** clear user demand, model/spend quotas, prompt-injection evaluation, task authorization, durable tool recovery, sandbox cleanup/cancellation, private-source retention/deletion, and human-reviewed patch publication must be demonstrated before promoting this feature from KIV.

## 6. Open risks and implementation validation experiments

These are **described experiments only; not coded or executed**. Run on a dedicated non-production account/project with synthetic repositories, no production secrets, explicit spend caps and consent for destructive tests.

| Experiment | Evidence / pass criterion |
| --- | --- |
| Entitlement/API version probe | Record actual Paid entitlement, scheduling-policy availability, supported SDK/API versions, sizes and quotas. Resolve Workflow 50,000-table vs 10,000-prose contradiction. A reproducible supported version matrix is required. |
| Linux toolchain fit | Checkout immutable synthetic repos and install/build/test Node, Python and a native-compiler case using pinned images. Record cold/warm startup, CPU/memory/disk, exit codes and wall duration; reject out-of-scope platforms/features explicitly. |
| Duplicate delivery and uncertain launch | Redeliver submission/Queue events and interrupt between process start and receipt persistence. Exactly one active attempt owns each execution lease; no duplicate result publication; recovery never blindly reruns an uncertain side effect. |
| Concurrency and quota pressure | Burst above project/global weighted budgets and simulate quota errors. Measured active execution never exceeds configured budgets; waiting runs progress without starvation or runaway creation retries. |
| Cancel races / process escape | Cancel queued, booting, running and uploading jobs; run descendants that ignore TERM/create new process groups. Whole-sandbox destruction must stop residual execution; stale callbacks cannot mark success or resurrect cancelled work. Record cancel-to-stop latency and billing tail. |
| Request disconnect / controller restart | Disconnect log UI, restart/deploy controller mid-build, interrupt alarms and simulate lost instance. Job must recover or report infrastructure failure, not silently vanish; reapply inactivity timeout and reconcile orphan leases. |
| Tenant/egress boundary | Try another attempt's identity, snapshot/artifact namespace, localhost services, non-allowlisted ports/hosts, redirects and repo paths. Forbidden requests fail; proxy credentials never appear in files/env/logs. Validate direct-network bypass remains disabled. |
| Logs and artifact abuse | Generate output beyond Worker limits, flood disk, upload traversal/symlink/HTML artifacts, disconnect/reconnect clients and interrupt multipart upload. Logs remain bounded, ordered/replayable with explicit incompleteness; unsafe artifacts cannot access app origin or cross tenant boundaries. |
| Cache poisoning | Untrusted PR writes a cache matching protected build inputs. Protected run must refuse it; tenant and trust scopes are enforced; failed digest check or absent cache is a safe miss. |
| Cost and retention | Measure idle/active CPU-memory-disk, egress, orchestrator/queue operations and R2 growth; apply cancellation and cleanup. Verify artifact/cache/log expiry, abandoned upload cleanup and owner deletion. Do not estimate savings solely from headline pricing. |
| Actions adapter (only if requested later) | Run a corpus covering expressions/matrix/needs/actions/env files/service containers/cancellation/artifacts/OIDC; compare observable results to real Actions. Publish a strict supported/unsupported matrix, not “Actions compatible” based on one shell job. |
| KIV agent recovery/security | Hibernate/restart mid-edit/tool call, restore snapshot, expire/revoke repo token, move branch after approval, and inject malicious repo/log instructions. No unauthorized write or repeated privileged operation; recovery preserves auditable receipts and returns a validated diff. |

Residual decisions: source-provider integration contract, trusted pipeline selection, container placement/reliability, beta policy evolution, registry allowlist practicality, build-secret policy, teardown guarantees, CI retention, cost model and any Actions import scope. These remain research/design questions, not verified features.

## 7. Primary source register

All URLs below were read live **2026-10-01**; Cloudflare pages were fetched using their `index.md` representations. Last-updated dates are document metadata where noted, not test dates.

- **S1** Workers isolates/execution: https://developers.cloudflare.com/workers/reference/how-workers-works/ (updated 2026-09-18).
- **S2** Node compatibility and non-functional child-process stub: https://developers.cloudflare.com/workers/runtime-apis/nodejs/ (2026-08-12).
- **S3** Workers limits: https://developers.cloudflare.com/workers/platform/limits/ (2026-09-05).
- **S4** Workflows availability: https://developers.cloudflare.com/workflows/ (2026-09-18).
- **S5** Workflow limits and conflicting concurrency prose: https://developers.cloudflare.com/workflows/reference/limits/ (2026-09-21).
- **S6** Workflow instance/retry/restart/terminate APIs: https://developers.cloudflare.com/workflows/build/workers-api/ (2026-09-28).
- **S7** Sandbox environments, microVM isolation and availability: https://developers.cloudflare.com/sandbox/ (2026-09-30).
- **S8** Lifetime, inactivity, deploys and snapshot persistence: https://developers.cloudflare.com/sandbox/concepts/lifetime/ (2026-09-30).
- **S9** Scheduling-policy beta, runtime sizes, no max_instances, readiness and image selection: https://developers.cloudflare.com/containers/configuration/scheduling-policy/ (2026-09-30).
- **S10** Containers sizing/account/snapshot limits: https://developers.cloudflare.com/containers/platform/limits/ (2026-09-30).
- **S11** Sandbox root-equivalent processes, shared trust boundary, egress and preview safety: https://developers.cloudflare.com/sandbox/concepts/security/ (2026-09-30).
- **S12** Background processes, process groups, boot IDs, output files and alarms: https://developers.cloudflare.com/sandbox/commands/run-background-processes/ (2026-09-30).
- **S13** Queue limits: https://developers.cloudflare.com/queues/platform/limits/ (2026-04-21).
- **S14** At-least-once delivery: https://developers.cloudflare.com/queues/reference/delivery-guarantees/ (2026-04-21).
- **S15** Queues availability: https://developers.cloudflare.com/queues/ (2026-04-21).
- **S16** DLQ behavior: https://developers.cloudflare.com/queues/configuration/dead-letter-queues/ (2026-04-21). Its no-consumer retention prose must be reconciled with configured plan retention before adopting a retention promise.
- **S17** Data-center-local Cache API: https://developers.cloudflare.com/workers/runtime-apis/cache/ (2026-08-14).
- **S18** Workers Logs retention, sampling and export: https://developers.cloudflare.com/workers/observability/logs/workers-logs/ (2026-09-30).
- **S19** R2 stream/multipart/conditional operations and consistency: https://developers.cloudflare.com/r2/api/workers/workers-api-reference/ (2026-07-31).
- **S20** Worker encrypted secret bindings: https://developers.cloudflare.com/workers/configuration/secrets/ (2026-07-03).
- **S21** Credential-free sandbox checkout via restricted HTTPS gateway: https://developers.cloudflare.com/sandbox/network/clone-a-private-repository/ (2026-09-30).
- **S22** Agents runtime overview: https://developers.cloudflare.com/agents/ (2026-09-18).
- **S23** SQLite state persistence and bidirectional sync: https://developers.cloudflare.com/agents/runtime/lifecycle/state/ (2026-06-03).
- **S24** GitHub Actions workflow semantics: https://docs.github.com/en/actions/concepts/workflows-and-actions/workflows.
- **S25** GitHub-hosted runner environments: https://docs.github.com/en/actions/concepts/runners/github-hosted-runners.
- **S26** Agents Sandbox integration, distinct workspace/filesystem and security: https://developers.cloudflare.com/agents/tools/sandbox/ (2026-09-30).
- **S27** Agents reported limits (treat cautiously against newer platform docs): https://developers.cloudflare.com/agents/platform/limits/ (2026-06-03).
- **S28** GitHub App installation token scoping and expiry: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app.

Retrieval issues: a guessed standalone Workers `child_process` documentation URL returned 404; the live Node compatibility index provides the actual verified stub classification. Python's HTTP client returned 403 on a doc request; curl successfully retrieved the primary documentation. Initial target `docs/` directory was absent; this Markdown write creates the required documentation path only.
