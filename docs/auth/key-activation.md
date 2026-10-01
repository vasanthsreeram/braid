# WorkOS key activation

The dedicated Gitflare WorkOS API key is stored in macOS Keychain under service `gitflare/workos-api-key`, account `gitflare`, and installed as Worker secret `WORKOS_API_KEY` using `scripts/configure-core-secrets.py` through stdin. No key value is recorded here.

Independent checks after installation:
- WorkOS authenticated API request returned HTTP 200. No user response data was printed or saved.
- Actual deployed `GET /auth/login` returned HTTP 302 to WorkOS with Gitflare client ID, canonical `https://gitflare.lintlabs.org/auth/callback`, and S256 PKCE.
- Callback with fake code/state and no state cookie returned HTTP 400; no identity issued.
- Updated deployed smoke assertions reflect configured authentication, not the prior missing-key 503 state.

A Python urllib login probe initially received HTTP 403; the real Node fetch subsequently verified the 302. This discrepancy is recorded rather than interpreted as an application login failure.

An actual user sign-in/code exchange, established app session and authenticated workflows are still not verified by these checks. The dedicated R2 signing credentials are a separate remaining large-file blocker. Earlier handoff missing-WorkOS-key statements describe the pre-activation state and are superseded by this document.
