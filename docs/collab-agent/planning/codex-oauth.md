Backlog only. No OpenAI OAuth flow, credentials or provider inference implemented.

Research checked 2026-10-02:
- [Codex authentication](https://developers.openai.com/codex/auth/) documents Codex product sign-in. It does not alone authorize reuse of that client's credentials by Gitflare.
- [Sign in with ChatGPT plan-usage overview](https://developers.openai.com/siwc/token-sharing-open-source) now documents an optional OAuth inference capability for open-source and locally hosted apps. It directs paid or remotely hosted apps to an interest/partner process. Gitflare is a private remotely hosted service; we cannot treat the OSS path as approval for this deployment.
- [Request a client ID](https://developers.openai.com/siwc/request-client-id) describes availability to selected commercial partners. Gitflare has no verified dedicated registration or approval.
- [Models and inference](https://developers.openai.com/siwc/token-sharing-open-source/models-and-inference) documents account-specific model discovery and the public Responses endpoint for authorized plan-usage access, with stream=true and store=false.
- [Preview limitations](https://developers.openai.com/siwc/token-sharing-open-source/preview-limitations) lists restrictions including unsupported request fields and hosted tools; our Workers AI adapter cannot simply be reused.
- [OpenAI Services Agreement](https://openai.com/policies/services-agreement/) and provider-specific SIWC terms require review for the exact hosted distribution and customer relationship.

Status: documented avenue exists for qualified integrations; applicability/approval for this private hosted service is UNKNOWN/BLOCKED. Codex subscription eligibility is not evidence of a transferable hosted third-party token grant.

Acceptance gates:
- Obtain written provider eligibility/registration for this hosted private app and exact scopes, redirect URLs, token audience, refresh/revoke/tenant policy and user-facing usage terms. Do not submit registrations or upgrade plans as part of this planning issue.
- Dedicated Gitflare client and genuine user consent with state, nonce, PKCE, verified issuer/audience/scopes. Never borrow OpenAI/Codex client IDs, ~/.codex/auth.json, Keychain CLI tokens or another application's consumer session.
- Per-user encrypted token store; host/account/workspace selection and catalog are bound to actual provider identity. WorkOS identity remains separate. No email-only linking or permission inference from findings.
- Implement an explicitly bounded provider adapter compatible with current SIWC limitations. Prove completion/error/revocation handling and charged-request uncertainty without tests or arbitrary execution tools.
- If hosted access is unsupported or denied, keep OAuth unavailable and use the separately approved BYOK API-key route. Recheck docs before implementation.

Dependencies: #1/#2/#6 and BYOK planning. Full issue-to-PR #5 remains deferred. Link from an app product issue only after genuine private self-import.
