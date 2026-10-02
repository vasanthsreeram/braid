Backlog only. No Grok OAuth or consumer-token access implemented.

Research checked 2026-10-02:
- [xAI API quickstart](https://docs.x.ai/developers/quickstart) documents API-console key creation and bearer API requests.
- [API account FAQ](https://docs.x.ai/developers/faq/accounts) separates API billing from Grok consumer billing despite shared account identity.
- [Grok consumer FAQ](https://docs.x.ai/grok/faq) describes plan allowances across Grok products. That wording is not a documented OAuth grant to arbitrary hosted third-party services; its relationship to the API-account billing page needs provider clarification.
- [Grok Build enterprise deployment](https://docs.x.ai/build/enterprise) concerns the provider's own coding client. Its session/SSO authentication is not a public third-party client-registration contract.
- [Consumer terms](https://x.ai/legal/terms-of-service) and the [terms/policies index](https://x.ai/legal) must be checked against the commercial/API service terms applicable to hosted private-code inference.

Status: API-key access is documented. No official public contract for third-party hosted Grok subscription OAuth client registration, accepted inference audience/scopes, renewal and revocation was found in the reviewed material. This avenue is UNSUPPORTED/UNKNOWN for Gitflare until xAI supplies explicit documentation/approval; do not infer it from xAI sign-in or the provider's own CLI.

Acceptance gates:
- Obtain official authorization/registration documentation and permission for hosted third-party subscription inference. Record subscription eligibility, billing, scopes, endpoints, policy terms, retention and private-code transmission requirements.
- Dedicated Gitflare OAuth client and genuine consent; no Grok/X browser cookies, CLI sessions, another app's consumer tokens, copied client IDs or subscription entitlement scraping.
- Verified issuer/audience/state/PKCE, account binding, encrypted per-tenant token lifecycle, complete deletion/revocation and explicit budgets.
- Genuine two-account inference isolation and revocation/error tests through documented endpoints. Preserve the read-only broker and owner-controlled finding publication. No paid upgrade, writes, execution or automated merge.
- If there is no supported hosted OAuth avenue, retain a clearly unavailable OAuth UI and use only the separately authorized BYOK API-key design.

Dependencies: #1/#2/#6 and BYOK planning; compare dedicated Codex OAuth requirements without treating either provider as interchangeable. #5 remains deferred. Product issue linkage waits for genuine private self-import.
