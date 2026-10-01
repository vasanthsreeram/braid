# Collaboration, discovery, GitHub import, and authentication

Research accessed **2026-10-01 UTC**. Scope: a Cloudflare-native GitHub alternative; documentation only. **Observed** statements below come from live primary documentation. **Recommended** statements are design choices, not implemented features or vendor guarantees. No Git commands, deployments, authenticated account probes, performance tests, or application/configuration changes were performed.

**Artifacts-first integration note:** Cloudflare Artifacts, not a bespoke Git server or raw R2 object database, is the proposed Git data plane. Its published tokens are repo-scoped read/write, not proven branch/path ACLs. The finer-grained policy below is a product requirement and remains an enforcement gap: use task-fork writes and a trusted canonical publisher until ref protection is verified. The native importer documents public HTTPS remotes; authenticated private transfer and complete ref/history preservation require separate validation. See [Artifacts and scale](artifacts-and-scale.md) and [architecture](../architecture.md), which take precedence over generic Git-hosting suggestions here.

## Executive decisions

1. **Separate visibility from collaboration.** Public/private is a visibility setting; “shared with me” is a relationship-derived view, not a third security mode. Keep organization membership, repository grants, and public discovery distinct.
2. **Use WorkOS AuthKit for identity and workspace membership, not as an implicit repository ACL.** Store resource-specific grants in the forge. WorkOS roles describe capabilities within an organization; they do not automatically answer who may read a particular repository.
3. **Start discovery with D1 metadata and FTS5.** Add semantic README/documentation search through Vectorize or AI Search only after enforcing authorization before retrieval and before answer generation.
4. **Start imports with GitHub.com URLs and selected-repository GitHub App access.** Code/history import is not a full GitHub migration. Inventory LFS and platform metadata explicitly and show unsupported components before starting.
5. **Keep browser sessions, forge Git/API credentials, agent credentials, and upstream GitHub import credentials separate.** Every credential authenticates a principal; the forge still authorizes each repository operation.

## 1. Observed vendor capabilities

### WorkOS

- AuthKit models users, organizations, and organization memberships; users can belong to multiple workspaces. Organization ownership lets resources remain with the organization when members leave. [W1]
- RBAC roles group permissions. A membership can use a single role or multiple roles; multiple-role permissions are additive. Organization-specific custom roles are supported. Session JWT role claims correspond to the organization membership selected for that session. [W2]
- Session access tokens include subject, issuer, expiry, session identifier, and—when applicable—`org_id`, `role`, and `permissions`. Refresh can switch organization when authorized. Refresh tokens can rotate and the application must retain the newly returned token. [W3]
- AuthKit now documents **both organization-owned and user-owned API keys**. A user-owned key carries its accessible organization and is revoked if that membership is deleted. Key validation returns owner and permissions; full secret values are returned only at creation. This is a usable credential-management option, not a resource-ACL system. The documented deletion behavior should not be generalized to deactivation or every role change without verification. [W4]
- CLI Auth documents device authorization and advises against embedding client secrets in distributed clients. [W5]
- Agent Registration documents anonymous/service-auth/refresh identity types, user claim ceremonies, and credential exchange. Its documentation explicitly says the feature must be enabled for the environment and to contact the account team if unavailable. Therefore it is an optional integration, not a baseline availability assumption. [W6]

### GitHub import authentication and scope

- GitHub installation access tokens expire after **one hour**. Token creation can narrow repositories and permissions, but cannot exceed what the installation was granted. Installation tokens support HTTP Git access when the app has the Contents repository permission. [G1]
- GitHub recommends minimum required App permissions. Repository, organization, enterprise, and account permissions are different categories. [G2]
- `GET /repos/{owner}/{repo}` requires **Metadata: read** for fine-grained credentials; public repositories can be requested without authentication. [G3]
- GitHub documents repository mirroring separately from LFS fetching/pushing. Its own GitHub Importer imports source/history, not issues or pull requests, and does not transfer LFS objects. That importer runs *into GitHub*; it is evidence of migration boundaries, not an API that imports into this forge. [G4, G5]

### Cloudflare

- D1 explicitly supports SQLite **FTS5**, including `fts5vocab`. [C1]
- D1 read replicas are asynchronous; the Sessions API provides sequential consistency. A session starting `first-primary` reads from the latest primary state. A bookmark only guarantees at least that prior state, not freshness against an unrelated administrator’s subsequent revocation. [C2]
- Workers KV is eventually consistent; changes can take **60 seconds or more** to appear elsewhere, including negative-lookups. It is unsuitable as the sole authority for immediate revocation. [C3]
- Vectorize supports metadata filters and namespaces; namespace filtering occurs before metadata filtering, and a vector belongs to one namespace. [C4]
- AI Search supports metadata-based pre-retrieval filtering. Its current documentation limits custom metadata fields to **five per instance**, and indexed string filtering to the first **64 UTF-8 bytes**. Stored string arrays are not indexed/filterable. These constraints make arbitrary collaborator lists a poor fit. [C5, C6]
- R2 public bucket access exposes objects through public URLs; disabling `r2.dev` does not disable an attached public custom domain. [C7]
- Workers have isolate memory and invocation-specific CPU/duration constraints; documentation reports **128 MB per isolate**. This is not evidence that an arbitrary native Git subprocess or large pack import can run in a normal Worker. [C8]

## 2. Recommended repository and sharing model

### Ownership and visibility

Each repository has an immutable internal ID, one owner (user or organization), a mutable namespace/slug, and visibility `private` or `public`. A personal namespace is not automatically a WorkOS organization; choose deliberately whether to provision a personal workspace. Do not use email or URL slug as the durable authorization identity.

| Property/view | Meaning | Default access | Discovery behavior |
|---|---|---|---|
| Public repository | Explicit publication of repository content | Anonymous read of published Git content and designated public metadata | Eligible for public Explore and public search |
| Private repository | Content and existence restricted | Owner and explicit/inherited authorized principals | Excluded from public listings, counts, feeds, autocomplete, and snippets |
| Shared with me | A query over active direct/team grants | Exactly the granted role; no extra privilege from being “shared” | Visible only to the recipient after authorization |
| Organization repository | Repository owned by a workspace | Configured org base policy plus repo/team grants | Membership alone need not imply read |
| Invitation | Pending offer of access | **No access until accepted** by the intended authenticated principal | Not public; bounded expiry and one-time acceptance |

**Recommended:** Private by default for creation and imports. Publishing requires explicit confirmation that Git history, README, issues, releases, and imported attachments can become public. Public visibility never publishes token values, audit trails, CI secrets, private security reports, collaborator email addresses, or internal administration data. Make these separate resources with separate policies.

“Unlisted” is optional and must be described as **public to anyone with the URL**, not private. Do not introduce it in the MVP unless there is a concrete need. Similarly, organization-wide “internal” visibility is a separate policy, not a synonym for private.

### Resource roles and policy

Use a small repository role hierarchy with explicit permissions:

| Repo role | Typical capabilities | Not automatically allowed |
|---|---|---|
| Reader | Browse/clone; read ordinary issues and PRs | Push, change grants, view security-only resources |
| Contributor | Reader plus create/comment on issues and propose changes through permitted forks/branches | Push protected branches or manage collaborators |
| Writer | Contributor plus push ordinary permitted refs | Override branch rules, change visibility, transfer/delete |
| Maintainer | Writer plus triage, merge within branch rules, manage normal repo settings | Ownership transfer/deletion or org administration unless separately granted |
| Admin | Manage repo grants, protected rules, visibility, transfer/delete with safeguards | Change WorkOS org owners/billing or disclose unrelated org repositories |

Owner control is separate from routine write access. Define whether org owners/admins have emergency repo-admin access; make that policy explicit and audited rather than deriving it accidentally from a role name. Require reauthentication for publication, transfer, deletion, and credential creation where appropriate.

Authorization conceptually requires **all** applicable constraints: authenticated principal (except public read), active account/membership or grant, correct resource relationship, action permission, credential scope, and branch/resource policy. A token does not confer more authority than its owning principal currently has. If multiple grants are allowed, union role capabilities only within the same authorized repository and then intersect with token scope and branch restrictions.

Suggested local records: users and WorkOS ID mapping; organizations and memberships; repositories; teams and team memberships; repo grants; invitations; token-to-repository restrictions; protected refs; audit events. These are a conceptual data model, not schema/configuration added by this research.

### WorkOS roles versus repo ACLs

Use WorkOS organization roles for `org:members:manage`, `org:repositories:create`, and organization-level administration. Use local ACLs for `repo R:read`, `repo R:push`, and `repo R:admin`. A WorkOS JWT saying “member” or “admin” is not a universal cross-organization repository grant.

Validate the session signature using the documented issuer/key mechanism and check expiry, expected application context, and selected organization. Never trust client-supplied `org_id`, permission lists, owner IDs, or repo IDs without a server-side relationship check. Organization switching establishes context, not carte-blanche access.

For external collaborators, an explicit repo-scoped grant may suffice without full organization membership. If enterprise policy mandates SSO/membership, model a constrained guest membership and preserve the repo allowlist. Document whether removing org membership also removes guests and direct grants—otherwise offboarding is ambiguous.

Process WorkOS lifecycle events idempotently, verify webhook authenticity, and reconcile periodically. For security-sensitive decisions, use current authoritative membership/grant state rather than stale JWT role claims or search-index ACLs. Do not make ordinary replicated D1 reads or KV the sole authority for revocation; use primary-first reads or an explicitly designed strongly consistent authority. JWT expiry alone is not an immediate-revocation mechanism.

## 3. Human, Git, API, and agent credentials

| Credential | Purpose | Recommended restrictions |
|---|---|---|
| AuthKit browser session | Interactive login and workspace selection | Secure HttpOnly cookie/session handling, CSRF protection, controlled redirects, token refresh/rotation; no cookie copied into CLI |
| Human forge Git/API token | Git-over-HTTPS and scripted user API calls | User-owned, explicit repo IDs, read/write scopes, expiry, revocation, owner attribution |
| Agent/service credential | Automation with independently inspectable identity | Explicit sponsoring user/org, selected repos, expiry, least privilege, quotas, separate audit identity |
| GitHub App installation token | Temporary upstream access for import | Selected source repo, Contents read, short-lived; not accepted as a forge token |
| WorkOS server API key | Backend administrative integration | Server-only secret; never supplied to Git clients, users, agents, or browsers |

**Recommended:** Use Artifacts' existing Git smart HTTP data plane rather than implement a new Git object server. Workers validates the forge principal and repo ACL before minting a short-lived native Artifacts read/write capability. Mapping upload-pack to read and receive-pack to write is supported by the native scopes; per-ref policy is not established by that repo-scoped token. Use controlled canonical publishing and task-fork writes until an unavoidable enforcement gateway or native ref restriction is proven. SSH can be a later independent transport; ordinary HTTP Workers routing is not automatically an SSH Git service.

WorkOS user/org API keys can handle issuing, validation, and lifecycle; local token bindings still constrain repo IDs and actions. Treat organization-owned keys as service identities: deleting an individual member must not be assumed to revoke them. If choosing forge-native opaque tokens instead, store verifiers rather than reusable plaintext, reveal the secret once, and support rotation/revocation and usage auditing. Never imply WorkOS documents that storage scheme; it is the forge-native recommendation.

Use CLI device authorization for human login when supported by the selected WorkOS app type; a token exchange to repo-scoped Git credentials is a **proposed forge flow**, not something WorkOS automatically implements. Verify SDK/runtime compatibility and actual environment entitlement before committing to a Worker integration.

For agents, start with explicit user-issued repo-scoped credentials or approved service identities. Evaluate WorkOS Agent Registration later; anonymous registrations must have no private-repo read, push, import-credential, billing, or administration access. A successful claim proves a binding, not consent to unlimited repository access. Store an agent identity alongside its sponsor and audit both. Never infer authorization from commit author email; Git author/committer fields are user-controlled metadata, not authenticated principal identity.

## 4. GitHub URL import

### Minimal permission matrix

| Import feature | GitHub access recommendation | Boundary |
|---|---|---|
| Public repository metadata | Unauthenticated API where allowed | Rate limits and unavailable/private sources still need clear handling |
| Private repository metadata | GitHub App Metadata read | Repo is within selected installation; permission documented for metadata endpoint [G3] |
| Git history/code | GitHub App Contents read | Installation-token HTTP Git access; no source write required [G1] |
| Issues/comments/labels/milestones | Optional Issues read | Separate API pipeline; not a Git clone |
| PR metadata/reviews/comments | Optional Pull requests read | Separate pipeline; fork commits and refs need separate completeness handling |
| Actions logs/artifacts | Optional Actions read if offered | Does not provide a working destination CI environment or reusable secrets |
| Future sync | Only permissions/events needed for advertised sync | A one-time importer does not need broad org write/admin or source write |

Request no organization member/admin permissions for simple URL-to-code import. Avoid Contents write, Workflows write, and broad OAuth `repo` scope when a selected-repository read-only App suffices. Additional migration permissions are feature-specific; confirm each REST endpoint’s fine-grained permission contract before enabling it. In particular, do not claim “Contents read” alone imports every platform feature or all possible LFS configurations.

Authenticate the installer through the forge, bind the authorized GitHub installation to the intended owner, and mint a token narrowed to the actual repository. An installation has its own authority; AuthKit social login with GitHub is **not** equivalent to installing this GitHub App or granting it private-repo import rights. Use separate CSRF/state checks and verified callbacks. Do not accept an arbitrary installation ID from a browser as proof of authority.

### User experience and job lifecycle

1. Accept a GitHub.com repository URL or `owner/repo`; normalize to a canonical source identity. Preflight source reachability and authorized App installation for private sources.
2. Ask for destination owner/slug and visibility (private default). Check destination-create permission and uniqueness. Record selected source repository ID, default branch, observed source visibility, and import consent.
3. Present a component inventory: Git history/refs, LFS, submodules, wiki, issues, PRs, releases, and workflow files; label each supported, separately migrated, or unsupported.
4. Create a hidden/staging destination and resumable asynchronous job. Report real component progress and failures; do not show fabricated percentages or successful completion before verification.
5. Fetch advertised source refs and reachable Git objects without shallow/single-branch shortcuts when full history is promised. Verify object integrity and source/destination ref tips, default branch, tag preservation, and completeness limitations. Publish the destination atomically only after required checks.
6. Produce an import report with timestamps, source identity, component status, ref/object verification, missing LFS/assets, unsupported features, and retry instructions. Delete transient secrets/staging data according to retention policy.

Use an idempotent job identity and destination lease to prevent retries/concurrent imports from clobbering a repo. Snapshot observed refs or detect source movement during import; report the captured state rather than claiming a continually changing source was imported atomically. A future mirror-sync feature needs an explicit conflict and deletion policy and must not overwrite destination user work silently.

### Migration boundaries

| Component | What Git history import preserves | Separate requirement/limitation |
|---|---|---|
| Commits, trees, blobs, branch/tag refs | Original reachable objects and IDs if not rewritten | Advertised/permitted refs only; unreachable/deleted objects and hidden refs cannot be promised |
| Signed commits/tags | Signature-bearing object bytes when unchanged | Destination signature trust/identity verification must be implemented; signatures are not automatically “verified” badges |
| LFS | Pointer files and `.gitattributes` | Fetch/verify actual objects and serve an LFS-compatible endpoint; otherwise mark pointers unresolved. Converting pointers to ordinary blobs rewrites history/IDs |
| Submodules | `.gitmodules` and gitlink entries | Child repos are not cloned into the parent; private child authorization and rewritten remote URLs need explicit handling |
| Wiki | Nothing from the main repo alone | Wiki is a separate Git repository when available; separate source/destination support |
| Issues and PRs | No platform discussion/relationship data | API migration, identity mapping, attachments, comments, review state, and source-number mapping; some fidelity may be unavailable |
| Pull-request refs | Only refs actually fetched and accepted | Fetching a PR ref is not recreating PR reviews, permissions, mergeability, or discussion; preserve provenance rather than implying equivalence |
| Releases | Tag objects, not release descriptions/assets | Separate metadata/assets transfer with quotas and verification |
| GitHub Actions | Workflow YAML already tracked in Git | No automatic runner/event compatibility, logs/artifacts, caches, schedules, environments, approvals, variables, or reusable secrets |
| Branch rules, settings, collaborators | No corresponding Git objects | Explicit mapping/confirmation; do not recreate source collaborators’ destination authority silently |
| Stars, forks, watchers, social graph | Nothing | Optional provenance only; do not present imported source popularity as destination-native engagement |

A source ZIP is a snapshot, not full-history import. GitHub’s importer limitations [G5] reinforce this distinction but do not determine which optional components this forge might later support. Label the MVP **“Import code and Git history”**, not “Move everything from GitHub.” Never automatically run imported workflow files, scripts, package installation, or repository hooks.

### SSRF and credential safety

**Observed:** OWASP recommends allowlisting known destinations, avoiding arbitrary complete URLs when possible, disabling redirect following, and validating IPv4/IPv6 resolution to prevent DNS-based bypasses. [S1]

**Recommended:**

- Initially accept only canonical HTTPS GitHub.com repository identities. Reject userinfo, custom ports, query/fragment credential tricks, encoded/path-confusion inputs, lookalike hosts, and arbitrary protocols such as local file, SSH helpers, or `ext`. Reconstruct upstream URLs from validated owner/repo fields rather than forwarding the supplied string.
- Treat API redirects, clone redirects, LFS endpoints from repository configuration, submodule URLs, release assets, README images, and attachments as **new destinations**. Do not pass source authorization to a changed origin. Permit only explicitly required GitHub-controlled endpoints; isolate unauthenticated asset requests. Test actual endpoint behavior rather than guessing a complete hostname list.
- Enforce egress policy in the actual importer runtime. For any later general-host importer, block loopback/private/link-local/metadata/reserved addresses, validate all A/AAAA answers at connection time, handle rebinding and IPv4-mapped IPv6, and revalidate redirects. An initial frontend URL check is insufficient.
- Run Git processing in an isolated job without ambient credentials, shell interpolation, unsafe remote helpers, repository hooks, or automatic recursive submodule/LFS fetching. Apply byte/object/ref/time/concurrency quotas and defenses against malformed packs, decompression abuse, path traversal, symlinks, and unsafe file extraction.
- Keep App private keys and WorkOS server credentials in server-side secrets; transient installation tokens only in protected job memory/storage. Never persist credential-bearing remote URLs or print them in clone errors, process listings, logs, traces, events, or UI. Prefer runtime credential injection over embedding secrets in URLs.
- Mint/refresh upstream tokens when needed; one-hour expiry is not a job-duration promise. A long-running import needs renewal without granting wider access.
- Treat historical repository contents as potentially containing secrets. Publication confirmation and optional scanning do not prove history is secret-free. Untrusted README/rendered text must be sanitized; do not interpret imported text as instructions to an agent or administrator.

## 5. Discovery and search on Cloudflare

### Recommended discovery surfaces

- **Explore:** public repositories only; explicit topic/language/license filters and clearly defined sorting (recently active, newly published, destination-native stars). Keep “imported source stars” visually separate, if retained at all.
- **My repositories:** owned repos plus optional member-workspace views; do not blend direct sharing and organization-wide access invisibly.
- **Shared with me:** active direct/team grants, with granting owner, role, and optional expiry. No pending invitation privilege.
- **Organization directory:** repositories readable to the caller under the configured base policy and grants; never a raw organization-ID listing.
- **Search:** explicit public-only versus authorized “my workspaces” scope. Counts, facets, snippets, pagination, related items, activity feeds, and suggestions must obey the same access rules as content.

Avoid fake trending metrics. If adding trending, document the actual time window, signals, bot exclusion, and abuse controls; no ranking/performance benchmark was run for this research.

### Product choices

| Cloudflare component | Recommended role | Authorization caveat |
|---|---|---|
| Workers | API/UI policy enforcement and search orchestration | Authenticate/authorize server-side for every surface, including Git and raw downloads |
| D1 relational metadata + FTS5 | MVP repo names/descriptions/topics and bounded README lexical search | Join readable repo IDs before ranking/pagination/counting; FTS is not an ACL |
| R2 | LFS objects if implemented, release/assets, logs and extracted/indexable documents; Artifacts owns Git objects/packs | Access through authorized Worker or narrowly scoped signed capabilities; not publicly expose the backing mixed-visibility bucket |
| KV/cache | Public discovery cache, non-sensitive settings | Not sole revocation/ACL authority; public-to-private transitions require invalidation and final current-policy checks |
| Vectorize | Optional semantic code/docs discovery with explicit namespace/filter strategy | Namespace is one-dimensional; repo/team authorization still needs enforcement and current-state recheck |
| AI Search | Optional managed README/documentation retrieval and answers | Five custom fields and string-prefix limits constrain ACL modeling; array grants are not a filterable collaborator list |
| Queues/Workflows (architectural recommendation) | Deferred indexing/import orchestration and retries | Exactly how Git processing runs remains a runtime feasibility question, not solved by queueing |

Prefer D1 FTS5 first: predictable lexical behavior, relational filtering, minimal moving parts. Bound document extraction; indexing every historical blob or generated dependency tree is a separate product/scale decision. Maintain an index revision/commit and exclude binary/generated/vendor content. Exact code symbol/regex search and semantic retrieval have different semantics; do not label either as GitHub-equivalent code search without evaluation.

For semantic retrieval, derive filters from server-authorized repo IDs/tenant context, not request-provided filters. Organization namespace alone is insufficient when members can read different private repos. Recheck current ACLs on candidate IDs **before fetching content, creating snippets, or passing documents to an LLM**. Authorization only after an answer is generated is too late: restricted content may already have contaminated the answer. If an index cannot prefilter a complex sharing policy safely, partition it or fall back to per-authorized-repository queries; do not broaden the search and hope to redact afterwards.

Restrict search/backend credentials to server-side Workers and keep IDs short enough for documented metadata filtering behavior. Index updates and deletions are not an immediate privacy boundary. Current-policy checks must suppress revoked/private results while deletion/reindex/cache purge converges. Namespace-plus-metadata filtering still needs tests for result starvation when unauthorized candidates dominate top-k; oversampling is not a proof of recall or confidentiality.

**Visibility transition:** First change the authoritative policy, then suppress external discovery/content through live checks, enqueue cache/index removals, and audit completion. Public-to-private cannot retract copies people already cloned or downloaded. A pre-signed URL is a bearer capability that may survive until expiry; bound its lifetime and document whether immediate revocation is supported.

## 6. Verification gates before implementation claims

- Anonymous/private access denied across browse, raw objects, clone, search, facets, autocomplete, API, LFS, releases, feeds, and direct object URLs; errors do not reveal protected names.
- Same-role users in different orgs cannot cross tenant boundaries; “member” cannot read all repos accidentally; external guests have only selected grants.
- Membership deletion/deactivation, direct-grant removal, token revocation, role reduction, and public-to-private changes take effect under the explicitly chosen consistency model, including stale JWT/index/cache scenarios.
- Read-only tokens cannot push; writer cannot override protected refs; org-owned service keys are correctly governed after user offboarding; agent actions include sponsor and agent attribution.
- Private GitHub import uses only selected App installation repositories; callback state and installation ownership verified; expired token renewal succeeds without secret leakage.
- Full-history claim tested with multiple branches, annotated tags, signed objects, LFS pointers/objects, submodules, PR source refs, and source movement. Compare ref tips and object integrity; report omitted components.
- Malicious redirects, LFS/submodule remotes, private/reserved IP targets, credential-bearing URLs, oversized packs, and malformed objects fail safely without fetching privileged destinations or leaking secrets.
- Run an actual runtime feasibility spike before choosing pure Worker Git processing versus a Cloudflare-hosted isolated compute option. This report contains **no measured throughput, import-size envelope, latency, or cost benchmark**, and makes no claim that Git serving has been implemented.

## Sources and access notes

All sources below were fetched live with Python HTTP requests and accessed **2026-10-01 UTC**. Links use the final canonical documentation URL where a redirect was observed. WorkOS/Cloudflare rejected some requests without a browser-style User-Agent with HTTP 403; retrying with that header succeeded. One guessed AI Search filtering route returned 404; the canonical route was discovered from live documentation and successfully fetched. These are documentation retrieval issues, not product outages.

### WorkOS primary documentation

- **[W1]** Users and Organizations: https://workos.com/docs/authkit/users-organizations
- **[W2]** Roles and Permissions: https://workos.com/docs/authkit/roles-and-permissions
- **[W3]** Sessions: https://workos.com/docs/authkit/sessions
- **[W4]** API Keys: https://workos.com/docs/authkit/api-keys
- **[W5]** CLI Auth: https://workos.com/docs/authkit/cli-auth
- **[W6]** Agent Registration: https://workos.com/docs/authkit/agent-registration (the requested `/agent-auth` URL redirected here)
- AuthKit entry point, also fetched: https://workos.com/docs/authkit

### GitHub primary documentation

- **[G1]** Authenticating as a GitHub App installation: https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app-installation
- **[G2]** Choosing permissions for a GitHub App: https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- **[G3]** Get a repository, endpoint-specific fine-grained permissions: https://docs.github.com/en/rest/repos/repos#get-a-repository
- **[G4]** Duplicating a repository (mirror and separate LFS transfer): https://docs.github.com/en/repositories/creating-and-managing-repositories/duplicating-a-repository
- **[G5]** About GitHub Importer: https://docs.github.com/en/migrations/importing-source-code/using-github-importer/about-github-importer

### Cloudflare primary documentation

- **[C1]** D1 SQL statements / supported SQLite extensions: https://developers.cloudflare.com/d1/sql-api/sql-statements/
- **[C2]** D1 global read replication and Sessions API: https://developers.cloudflare.com/d1/best-practices/read-replication/
- **[C3]** How Workers KV works: https://developers.cloudflare.com/kv/concepts/how-kv-works/
- **[C4]** Vectorize metadata filtering: https://developers.cloudflare.com/vectorize/reference/metadata-filtering/
- **[C5]** AI Search metadata attributes: https://developers.cloudflare.com/ai-search/configuration/indexing/metadata/
- **[C6]** AI Search retrieval filtering: https://developers.cloudflare.com/ai-search/configuration/retrieval/filtering/
- **[C7]** R2 public buckets: https://developers.cloudflare.com/r2/data-access/public-buckets/
- **[C8]** Workers limits: https://developers.cloudflare.com/workers/platform/limits/

### Security primary guidance

- **[S1]** OWASP SSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html

Limits, feature names, permissions, and entitlement can change. Recheck the cited endpoint/feature documentation before implementation. Research verifies published capabilities, not the account’s WorkOS plan, Cloudflare configuration, SDK compatibility, or an operating forge.
