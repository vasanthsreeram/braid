# Gitflare code-exchange repair

The deterministic exchange blocker is corrected and deployed. Genuine human login acceptance remains pending.

## Reproduced cause and correction

The WorkOS helper used `redirect: "error"`. Cloudflare `workerd` only implements `follow` and `manual`; it throws a TypeError before sending this request. The callback's generic exception handler consequently returned exactly `{"message":"Authentication failed","phase":"code_exchange"}`. A native workerd probe reproduced the exception, and a fresh **intentionally invalid-code** request to the previous live version reproduced that response. Neither probe is a real user login. [Runtime receipt](raw/runtime-before.json), [deployed before receipt](raw/deployed-before-invalid-probe.json).

The helper now uses `manual` and rejects every non-2xx response, including redirects. Credentials cannot follow redirects. The same helper services code exchange, session checks and refresh. A regression test exercises actual workerd fetch against a local provider double and proves that a redirect target receives no request. The [workerd implementation](https://github.com/cloudflare/workerd/blob/main/src/workerd/api/http.c%2B%2B) confirms the runtime limitation; Cloudflare's Request documentation currently lists `error`, contrary to this implementation and observed runtime.

This establishes a real runtime cause for the reported response, not merely a PKCE hypothesis. The original human callback was not replayed, and no successful human code exchange has been observed. Additional provider/account failures could become visible after this blocker.

## Contract and environment checks

The official [WorkOS SDK](https://github.com/workos/workos-node) explicitly supports confidential-client PKCE. Its [code serializer](https://github.com/workos/workos-node/blob/main/src/user-management/serializers/authenticate-with-code-options.serializer.ts) sends `client_id`, `client_secret`, `code`, `code_verifier` and `grant_type: authorization_code`. Gitflare's JSON request uses these fields. The [REST response contract](https://workos.com/docs/reference/authkit/authentication) and [response deserializer](https://github.com/workos/workos-node/blob/main/src/user-management/serializers/authentication-response.serializer.ts) confirm snake-case access/refresh tokens and authentication method; Gitflare consumes raw REST JSON, without an SDK camel-case conversion. Malformed success payloads fail before session creation. Existing success tests cover the REST-shaped exchange, signature verification, live session lookup, encrypted session cookie, refresh rotation and revocation using provider doubles.

Authenticated WorkOS MCP, using Codex's keyring, confirms Gitflare Staging `environment_01M3WQ9V3GK4KJ67E7BXDB1YXB`, default application `app_01M3WQ9VPR19MF2K8359SNVN0S`, and client `client_01M3WQ9VJ9G2MH74MYP7WBD708`. The only callback is `https://gitflare.lintlabs.org/auth/callback`. Actual deployed vars agree and both required secrets are bound. [WorkOS configuration](raw/workos-configuration.json), [deployed settings](raw/deployed-settings.json).

The dedicated Keychain key reads WorkOS users with HTTP 200; subsequent scoped API-key usage metadata advanced for Gitflare's default application key. No users or key values were retained. The deployed secret cannot be read back, and invalid-code rejection did not advance key-usage metadata, so that rejection alone is **not** proof of deployed secret equality. The verified dedicated key was subsequently synchronized to `WORKOS_API_KEY` through captured Keychain output and Wrangler stdin. No key was created or rotated; no plaintext credential file was created. [Key environment check](raw/key-environment-check.json), [secret synchronization](raw/secret-sync.json).

No WorkOS provider configuration was mutated. GitHub is enabled, scopes are empty, provider-token return is disabled, and the dedicated GitHub credential record remains `Invalid` with no client ID. This is separate from the reproduced runtime failure: a staging/demo authorization can still issue an app code. Missing dedicated GitHub credentials are not asserted as the cause of the user's `code_exchange` response.

## Safe failed-attempt diagnostics

Only the state-validated callback's failed exchange returns fixed category, fixed reason, numeric provider status (or null for transport failure), and an app-generated random correlation UUID. Categories are `invalid_client`, `invalid_grant`, `invalid_request`, `rate_limit`, `upstream`, `network`, and `unexpected_response`. Unknown or malicious content maps to a generic category/reason; provider error bodies are capped at 16 KiB and discarded. No provider correlation/header value is echoed.

`pkce_rejected` is mapped only for exact `invalid_grant` plus `Invalid code verifier.`. That exact provider wording was observed in the deliberately invalid-code diagnostic, not in the user's real callback. No arbitrary strings or guessed expired/reused descriptions are matched. All callback failures clear the flow cookie and advise a fresh `/auth/login`; expired/reused flows must never replay the callback.

The encrypted ten-minute flow retains state and S256 verifier binding. The sealed verifier is also checked for the generated 43-character base64url shape. Host-only `Secure; HttpOnly; SameSite=Lax; Path=/` cookies, JWE issuer/audience, JWT signature/client checks, live session/membership checks, revocation and GitHub-only policy remain enforced. Observability remains disabled. No authorization code, state, verifier, body, cookie, API key, access/refresh/GitHub token, email or arbitrary provider message is emitted by the new diagnostics. Diagnostics are returned directly to the failing attempt and stored in no shared tenant endpoint.

## Live evidence and validation

After deployment, the fresh intentionally invalid-code probe reaches WorkOS and yields HTTP 400 `invalid_grant`, safe reason `pkce_rejected`, instead of the pre-request runtime exception. After dedicated-key synchronization it still yields the same sanitized rejection, correlation `6613b9ba-c2ae-4624-bc68-b26b4ff0404f`. **This is provider rejection evidence, not a real token-exchange/login test and not proof of a real PKCE defect.** [After repair](raw/deployed-after-invalid-probe.json), [after key sync](raw/deployed-final-invalid-probe.json).

The final Worker version after secret synchronization is `106fdbac-33ce-470a-9bd7-7b2eb0fb7436`. Downloaded deployed `worker.js` exactly matches the dry-run build, SHA-256 `dd93b64a07b0588e8b26c1df27b49e9027c93e45953831a99169b2c83cb608ce`. The original code deploy version was `fe9412e4-236c-4718-ab6b-416de9912eda`. [Deployed code check](raw/deployed-code-check.json).

- Typecheck and build passed.
- Full test suite: **57 passed, 0 failed**. Includes malicious/oversized/error bodies, malformed success, transport exceptions, expired/tampered/wrong-origin/bad-verifier flows, real workerd redirect rejection, successful provider-shaped exchange and session lifecycle doubles. [Test receipt](raw/tests.txt).
- Deployed denial smoke: **27/27** passed, including `/api/me` denial, configured login redirect and state-less callback rejection. [Deployed receipt](raw/deployed-denials.json).
- Local workerd denial smoke: **7/7** passed. [Runtime boundary receipt](raw/worker-denials.json).
- Private GitHub repository visibility was verified; no imports, agent jobs, fabricated users or seeded administrators were used.

The in-app browser connection failed, Brave Apple Events timed out, and the full CDP browser connection timed out. Direct CDP DOM inspection of an existing GitHub tab succeeded and showed the actual sign-in heading plus username/password fields. A fresh navigation through `/auth/login` in the existing normal-profile Brave session reached GitHub `/login`, with actual username/password fields and no consent or OTP submitted. It did not reach a callback or establish an app session. Browser state is not inferred from old callback URLs. [Browser availability](raw/browser-availability.json), [fresh attempt](raw/fresh-browser-attempt.json).

## Outstanding human acceptance

Start once at https://gitflare.lintlabs.org/auth/login and complete GitHub login/2FA/consent normally. If it fails, share only `phase`, `category`, `reason`, `provider_status`, and `correlation`. Never send callback URLs, codes, state, cookies or tokens. If it succeeds, verify actual `/api/me` returns HTTP 200 with the genuine human WorkOS principal, then refresh and recheck the session. Real callback plus authenticated `/api/me` and genuine session/refresh checks remain unverified until that happens. Imports and agent jobs remain gated on that proof.
