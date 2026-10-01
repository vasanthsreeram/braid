# Core architecture

The current scope replaces the original planning baseline, retained in [the archive](archive/architecture-planning.md). Native CI, Agents SDK, Sandbox, Containers, autonomous edits/tests/model features, and builds of imported code are excluded. No excluded feature is a prerequisite for the core forge.

| Component | Responsibility |
|---|---|
| Worker + assets | Authenticated API, repository and review UI, bounded Git pack forwarding |
| WorkOS AuthKit | Provider login, JWT identity, session rotation/revocation, active organization membership |
| D1 | Repository ownership, roles, email invitations, native token IDs, source snapshots, fenced publication intents |
| Artifacts | Canonical/task Git repositories, full refs/history, short-lived native Git credentials |
| R2 | Verified repo manifests and tenant chunks; dedicated staging prefix with one-day expiry |

A user creates a private canonical repository, forks a private task, obtains a 60-second task write credential, and pushes with standard Git. A proposal records immutable base/candidate SHAs. Reviewers inspect a bounded file diff and approve explicitly. The publisher rechecks the default branch and ancestry, acquires a D1 fence, copies verified LFS manifest associations, and forwards a Git pack with the exact expected old ref. Artifacts atomically rejects a competing stale write. Canonical write credentials never reach regular clients.

A transport error is not a merge receipt. The intent remains fenced. Reconciliation reads the exact ref and confirms the candidate or records divergence. If the head is still at the base, the fence remains held because a publisher may still be in flight. This conservative case requires operator investigation; there is no unsafe timeout-based retry.

Imports record the source branch/tag snapshot before native creation. Native import is attempted without branch/depth restrictions. When its 40 MB service limit is encountered, the fallback streams a full pack directly from canonical public GitHub HTTPS to an empty Artifacts destination; no Linux runner or intermediate server filesystem exists. Pack SHA-1, push receipts, source drift and destination tips are checked. A failed/in-progress operation cannot become ready from metadata alone: recorded refs must agree, inherited LFS metadata is reconciled, and initial credentials are revoked.

The app imports Git history only. Git LFS payloads, submodule repositories, issues and GitHub settings are not silently included in that claim. The substantial migration fixture had no historical LFS pointers or submodules and received independent full object/checkout verification. The deployed app importer still needs a real WorkOS session to be exercised.

Personal repositories allow explicit sharing across personal identities. Organization repositories require the selected active WorkOS membership and a separate repo grant; WorkOS admin roles confer no implicit repository permission. A task author's future access also depends on their parent contribution permission. Explicit task readers can be granted access to that private copy independently. Historical clones/downloads cannot be retracted.

All application Git code uses Workers bindings and HTTP. Node SQLite, bare Git, child processes and system Chrome exist only in local developer tools. Nothing evaluates imported repository code.
