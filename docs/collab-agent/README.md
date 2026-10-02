# Gitflare collaboration and read-only review

This work implements repository-local issues, append-only issue/review discussion, verified collaborator assignment, cream/orange UI, private bundle upload and Pi Durable static review. Live acceptance boundaries and the final deployment/source receipt are recorded in RESULT.md after verification. Do not interpret local test identities or standalone model verification as a WorkOS human login or app-owned repository import.

## Permission contract

Existing repository/organization ACLs remain authoritative. Owner/admin manages invitations, grants and existing review/merge decisions; writer creates and updates issues and requests/cancels scans; authenticated repo reader appends comments to existing issues and immutable proposals and reads private aggregates. Contributors retain task/proposal privileges. Anonymous public readers cannot read issues, collaborators, discussions or jobs. Assignees must be current readable collaborators with a profile recorded from successful authentication and, for organizations, active WorkOS membership. Profiles expose names/opaque IDs to collaborators, not their emails. Revocation is rechecked at every private route and each agent source read/dispatch/publication.

Issues use repo-local sequential numbers, author, state, assignee, labels, immutable comments and version guards. One SQL update or insert plus SQLite triggers commits the state/comment and audit atomically. A stale save/comment returns 409; the UI retains the draft. Bounded lists return at most 100 issues and 200 comments/audit entries.

## Runtime and limits

Official [Pi Durable announcement](https://earendil.com/posts/pi-durable/) and [README](https://github.com/earendil-works/pi/blob/main/packages/durable/README.md) were read before implementation. @earendil-works/pi-durable, pi-ai and chord are pinned to 1.0.0 in package-lock.json. Experimental API risk remains. Workers builds use custom provider adapters and portable JSONL, never CodingTools, a shell environment, Sandbox, Containers, Agents SDK or CI.

One ReviewCoordinator DO owns a repo's active harness. Its journal filesystem is backed by synchronous DO SQLite statements, exclusively for Pi transcript state. Journal sidecars persist before a commit marker; Pi recovers an incomplete tail. No async SQL transaction is falsely mapped to DO transactionSync. A separate deployment DO reserves at most 36 model dispatches/day. Reviews allow at most 12 jobs/repo/day, 3 attempts per scope, 3 model requests/job, 1200 output tokens/request, 60000 serialized request bytes, 48000 source bytes, 120 source API reads, 12 logical tool calls, 8 selected paths, 16 path segments, 16000 bytes/text file and 45 seconds. Only the latest 20 terminal jobs/journals are retained per repo; D1 audit remains.

Selected SHA/path scope is host-owned. Broker tools read/list/commit/diff, with regular-file/UTF-8 checks; symlinks and submodules cannot be followed. Repository data and model outputs are hostile text. Model-request failure has zero automatic retries. Crash recovery reports interrupted work and requires explicit bounded retry rather than replaying an uncertain charged request. Cancellation prevents new reads/dispatch/publication, though a submitted Workers AI binding request may finish on the provider. No provider cancellation guarantee is claimed.

The documented [Workers AI Qwen3 model](https://developers.cloudflare.com/workers-ai/models/qwen3-30b-a3b-fp8/) is selected and wired through AI. No provider subscription credentials are read. Static findings must cite an actually read source SHA/path and exact evidence inside validated line ranges; this validates provenance, not the correctness of every model explanation. No tests were run by the agent. Only the trusted broker can publish findings as private issues, after explicit repo-owner policy enablement, current writer access, idempotent source/evidence key and audit. The model has no issue-write or source-write tool.

## Private upload

POST /api/bundles accepts application/x-git-bundle through ordinary authenticated app identity and CSRF controls. It reserves a fresh app-owned private destination, records import intent, rejects unsupported/prerequisite headers and refs, streams a bounded SHA-1 pack with checksum checks, requires native object/ref acceptance, revokes the ephemeral transport token and compares destination branches/tags. Receiver-enforced Artifacts constraints remain 32 MB/blob and 1 GB/repository. A compressed upload is capped at 100 MiB / 200000 objects; this is not a claim that all 1 GB repositories fit this upload path. Failed receiver validation retains failed intent and never rewrites source/history. LFS/submodule contents are separate migrations.

Create a source bundle with `git bundle create private.bundle --branches --tags` (no shallow clone or prerequisites), preflight all reachable historical blob sizes/uncompressed total, then upload while genuinely signed into Gitflare. Retain GitHub. Compare all branch/tag tips, reachable object IDs and checkout bytes/modes using an app-issued read credential before cutover. Bundle upload alone only verifies refs, not an authoritative cutover. No GitHub CLI token is an app login.

## Planning

Private GitHub issues [#7 BYOK](https://github.com/vasanthsreeram/cf-native-forge/issues/7), [#8 Codex OAuth](https://github.com/vasanthsreeram/cf-native-forge/issues/8), [#9 Grok OAuth](https://github.com/vasanthsreeram/cf-native-forge/issues/9) are research only. Their checked primary sources, restrictions and acceptance gates are in planning/. #1–#6 remain open pending their full acceptance; write agents and executed checks are deferred.
