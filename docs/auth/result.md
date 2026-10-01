# Gitflare auth, domain, responsive UI and contribution result

Gitflare's real Worker is deployed at **https://gitflare.lintlabs.org**. Dedicated WorkOS Gitflare/Staging configuration is complete, and responsive application/contribution code is implemented. **Live application authentication remains blocked by its missing dedicated WorkOS API key.** An anonymous sign-in gate and a reachable hosted provider page are not evidence of an authenticated product. No live app session, app import, app merge or deployed contribution profile is claimed.

The existing core writer had exited before repository mutations. Its final source baseline was `d07c186`. The prior native Git migration, benchmarks, D1/R2/Artifacts resources and excluded feature scope are retained. No Agents SDK, compute Sandbox/Containers, native CI, imported-code execution, paid subscription or repository publication was introduced.

## Actual WorkOS MCP configuration

The native MCP client connects to `https://mcp.workos.com/mcp`, using the registered `workos` server and OS Keychain OAuth. Actual server tools called: **`whoami`, `list_operations`, `query`, `mutate`** (the parent proof calls these `mcp__workos__…`). [Discovery/schema receipt](raw/workos-tools.json), [operation index](raw/workos-operations.json), [caller proof](raw/workos-whoami-before.json).

Initially this turn exposed only the browser tool, and direct Keychain access waited on a macOS access prompt. Those attempts were stopped; no prompt was bypassed and no OAuth credential was extracted. The supported native `mcpServer/tool/call` interface restored MCP operation access. `scripts/workos-mcp.py` uses this interface without starting any model/agent turns; its mutations are restricted to Gitflare setup and its queries to nonsecret configuration. MCP OAuth is never used as an application API key.

| Gitflare identity | Observed nonsecret value |
|---|---|
| WorkOS team / caller role | lintlabs / ADMIN |
| New project | `project_01M3WQ9V2JJ6M2WRXJWYTBCHBW` |
| Staging environment | `environment_01M3WQ9V3GK4KJ67E7BXDB1YXB` |
| Default AuthKit application | `app_01M3WQ9VPR19MF2K8359SNVN0S`, named Gitflare |
| Client ID | `client_01M3WQ9VJ9G2MH74MYP7WBD708` |
| Exact discovered issuer | `https://api.workos.com/user_management/client_01M3WQ9VJ9G2MH74MYP7WBD708` |
| Hosted AuthKit domain observed in Chrome | `sunny-prophecy-65-staging.authkit.app` |
| Default callback | `https://gitflare.lintlabs.org/auth/callback` |
| Default logout return / initiate-login URI | `https://gitflare.lintlabs.org/auth/login` |
| Homepage | `https://gitflare.lintlabs.org` |

Executed mutations: `createProjectWithNewEnvironments` with `includeProductionEnvironment:false`, `setRedirectUris`, `setLogoutUris`, and `updateAuthkitApplication`. Redirect/logout lists were read first, dry-run validated, then persisted. AuthKit, Google OAuth and verified-email requirements were already enabled in the new staging defaults; no team security controls or existing application settings were changed. [Creation](raw/workos-create-project.json), [schemas](raw/workos-config-schemas.json), [dry run](raw/workos-routing-dryrun.json), [mutations](raw/workos-routing-mutations.json), [readback](raw/workos-settings-after.json).

The six environments belonging to LintLabs Course, lintedu and lintlabs's Project were independently compared before/after across AuthKit settings, redirects, logout URIs and default application configuration: **all unchanged**. [24-query comparison](raw/workos-other-apps-unchanged.json). WorkOS's staging/sandbox flag is the identity provider's test environment, not a compute sandbox.

The exact issuer was obtained from the client's [public OIDC discovery document](https://api.workos.com/user_management/client_01M3WQ9VJ9G2MH74MYP7WBD708/.well-known/openid-configuration), rather than guessed from generic examples. [Saved discovery](raw/workos-oidc-discovery.json). Runtime client/issuer/origin and hostname routing are persisted in `wrangler.jsonc`.

## Canonical domain and session behavior

Before mutation, `lintlabs.org` was confirmed active in account `7efeb52ec5727a903edd8ef7ae8eb925`; no Gitflare/wildcard DNS record, Gitflare Worker domain or zone Worker route occupied the hostname. Wrangler OAuth lacked DNS-read scope; existing DNS-capable Keychain credentials were used only to read this zone. Deployment attached only `gitflare.lintlabs.org` to `cf-native-forge-evaluation`. Cloudflare created its managed, proxied record and certificate. [Zone](raw/zones-before.json), [DNS before/after](raw/dns-before.json), [domain attachment](raw/domains-after.json).

All sibling DNS records, all other Worker custom domains and the zone's Worker routes were compared before/after and are unchanged. [Isolation proof](raw/domain-isolation.json). Final Worker version: **`0c04f6fd-5d30-4da8-88ab-485f99f11dc7`**. [Deploy receipt](raw/deploy.txt).

Chrome verified actual-hostname TLS 1.3, valid certificate acceptance, responsive gated UI, `/auth/login` 503, canonical redirects from HTTP and the legacy workers.dev URL, and hosted AuthKit pre-login with a Google option. No password/2FA prompts were bypassed. The hosted provider check used a direct authorization URL outside the app flow and did not create an app session. [Browser proof](raw/deployed-browser.json).

OAuth uses S256 PKCE and an encrypted ten-minute state/verifier cookie; invitations survive callback through a strictly bounded internal return path. Session cookies are Secure, HttpOnly, SameSite=Lax and `__Host-` scoped without Domain. The encrypted envelope is issued for this canonical origin. Every identity request checks the signed JWT, actual provider session and active organization membership; repository grants remain separate. POST refresh/switch/logout require exact Origin. Expired browser-page sessions have a POST resume form, while API refreshes are serialized. Logout retains the existing local denial/native-token revocation/provider revocation flow. These lifecycle behaviors are covered by labeled provider contract tests, **not live WorkOS session evidence**.

Cloudflare injected its zone analytics beacon into the gate, causing a CSP console error. Gitflare responses now use `no-store, no-transform`; the beacon injection/error disappeared without changing shared zone settings. This follows Cloudflare's [documented injection constraint](https://developers.cloudflare.com/web-analytics/get-started/). Strict CSP remains in place. Final browser console contains only expected 401/503 gate responses, with zero unexpected console/page errors.

## Responsive UI and real contribution history

Repository/import, file, commit, review/merge and access forms wrap at 390px and 1440px. Grid children shrink; source and heatmap panes scroll internally; controls have at least 44px height. Folder-parent navigation, commit details, profile-to-commit links and reconnect/reload of commit deep links are exercised in Chrome. [Mobile proof](raw/ui-390.json), [desktop proof](raw/ui-1440.json).

`GET /api/profile` is a private **self-only** profile. It computes 365 daily counts from currently reachable, persisted Git commits in currently readable, ready repositories. Every candidate repository gets the same canonical/task/tenant/grant authorization check used for source reads. Anonymous access returns 401; unauthorized commit detail returns 404. No arbitrary person's profile, private aggregate activity, repository name or commit is exposed to an unauthorized viewer.

Counting definition: author timestamp converted to **UTC**, rolling 365 calendar days through the current UTC day, author email matched case-insensitively to the signed-in account's **current verified email**, and one contribution per unique Git commit SHA across all accessible forks/copies. Git identities remain self-declared; an email match does not verify authorship or account ownership. An unverified account has no attributed commits. Imports transfer original objects, preserving original author/committer identities, timestamps, timezone offsets and commit IDs; the UI displays provider timestamps in UTC rather than rewriting them.

Traversal follows all parents from advertised branches/tags, rather than treating the provider's first-parent log as complete history. Daily counts link to repository/commit details and files. There are no fabricated/demo activity squares. The UI proof uses synthetic fixture repositories containing real persisted local Git commits and is labeled accordingly.

Supported activity is **commits only**. There are no issue, review, push-event or GitHub-parity claims. Each request scans at most 20 visible repositories and 1,000 objects per repository, marking partial scans. Annotated tags that `readCommit` cannot resolve also mark a partial scan. Repository history lists the newest 50 first-parent commits; commit detail is restricted to the bounded reachable window. Unreachable/deleted commits, former account emails, unauthorised repositories and older dates are excluded. There is no event ledger/backfill job; current reachable history is derived on demand. The earlier provider-only Maggie's Farm migration has no invented WorkOS/D1 owner and therefore does not silently populate an app profile. [Original preserved migration proof](../core/raw/migration-verification.json).

## Verification and human setup

| Check | Final result |
|---|---|
| `npm run typecheck` / `npm run build` | Pass ([types](raw/typecheck.txt), [bundle](raw/build.txt)) |
| `npm test` | 37 passed, 0 failed ([receipt](raw/tests.txt)); includes real merge-parent history, original timestamps/IDs, independent-copy/fork dedupe, unverified-email and revoked-grant denial, PKCE/state/cookies/resume contracts |
| `npm run test:worker` | 7 local workerd denials passed ([receipt](raw/worker-auth-smoke.json)) |
| `npm run test:ui` | 6 local Chrome checks passed ([receipt](raw/ui-basic.json)) |
| Desktop / mobile core UI | 19 checks each; no overflow or page errors; expected initial/reload local 401 and harness-only refresh 404 responses are recorded |
| `npm run test:deployed` | 15 actual-hostname private/auth denials passed ([receipt](raw/deployed-core-smoke.json)) |
| `npm run test:deployed:browser` | 7 checks passed; zero unexpected console errors ([receipt](raw/deployed-browser.json)) |
| WorkOS / DNS isolation | Six other environments and all sibling routing unchanged |

[Machine summary](raw/verification-summary.json). A provider-button locator failure is retained in [sanitized failed browser receipt](raw/deployed-browser-failed.txt); the fresh DOM showed Google was a link, and the corrected final run passes. Initial startup limitations and expected gate responses are not suppressed.

The WorkOS API key is absent from both Gitflare-specific Keychain names inspected, and runtime secret metadata lists only `SESSION_SECRET`. [Keychain availability](raw/keychain-availability.json), [Worker secret names](raw/worker-secret-names.json), [installer blocker](raw/secret-install-blocker.txt). MCP cannot reveal the application's key; no other product's key was used.

**Required human action:** WorkOS Dashboard → lintlabs → **Gitflare → Staging → API keys**. Reveal the initial Gitflare key if the dashboard permits it, or create an environment/application key named “Gitflare Worker”. In macOS Keychain Access, save that value as service **`gitflare/workos-api-key`**, account **`gitflare`**. Then run `python3 scripts/configure-core-secrets.py`. It transfers only the key to Worker secret `WORKOS_API_KEY` through stdin, never chat, command arguments, `.env`, logs or Git. Client ID, issuer and routes are already configured.

After installation, execute actual sign-in/callback/session/refresh/logout, org selection/revocation, and deployed create/import/share/review/merge/profile workflows before accepting live authentication as complete. Dedicated R2 S3 signing credentials remain separately missing from the core launch, so live large LFS remains unverified; this change does not claim to complete that gate.

Source/evidence publication targets only the existing **private** `vasanthsreeram/cf-native-forge` repository. The final delivery receipt outside the repository records the pushed commit and independent GitHub privacy/remote-head verification.
