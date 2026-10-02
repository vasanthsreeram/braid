Backlog only. No provider-key settings or token ingestion implemented.

Gitflare currently uses its Cloudflare Workers AI binding for bounded static reviews. Add optional user-owned API credentials only after the read-only review and tenant-isolation gates in #2/#6 are accepted. This is separate from app identity and provider subscription OAuth; #1 remains the epic.

Research checked 2026-10-02:
- [OpenAI API production security](https://developers.openai.com/api/docs/guides/production-best-practices): API secrets belong on the server with explicit project/usage controls.
- [OpenAI Services Agreement](https://openai.com/policies/services-agreement/): review customer authority, downstream users, credentials, privacy and applicable service terms before launch.
- [xAI API quickstart](https://docs.x.ai/developers/quickstart): documented API access uses an API key from the API console.
- [xAI API account FAQ](https://docs.x.ai/developers/faq/accounts): account identity can be shared with Grok, but the page distinguishes API billing from consumer billing. Consumer plan descriptions elsewhere do not establish a third-party credential grant.
- [Workers AI data usage](https://developers.cloudflare.com/workers-ai/platform/data-usage/): record retention and private-code disclosure policies for every provider.

Acceptance gates:
- Explicit owner opt-in for private-source transmission, provider identity/model catalog and budget preview; no automatic paid upgrade or silent provider fallback.
- KMS/envelope encryption with per-user/tenant/provider binding; secrets never in browser persistence, Git, D1 plaintext, error logs or transcripts. Store only encrypted credentials and opaque references. Rotate/revoke/delete with auditable, secret-free receipts.
- Only documented provider endpoints and authentication scopes. Reject arbitrary proxy URLs/SSRF, consumer cookies, another app's OAuth tokens and local CLI credential imports.
- Prove two genuine accounts remain isolated, concurrent revocation stops further dispatch, provider errors do not leak secrets, and durable retries respect charged-request uncertainty.
- Keep source reads, findings publication and all existing ACL checks independent from provider credential ownership. No write agent, execution or CI scope expansion.

Dependencies: #1, #2, #6; coordinate the separate Codex OAuth and Grok OAuth planning issues. Product issues may link here after the private self-project import is genuinely verified.
