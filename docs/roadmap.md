# Remaining core requirements

The original proposal is retained in [the archive](archive/roadmap-planning.md). Native CI, Agents SDK, Sandbox, Containers and autonomous model/edit/test capabilities are excluded from this product scope.

The feasible core implementation and dedicated deployment are complete enough for the retained local/provider evidence. The following gates remain before claiming a fully exercised authenticated product:

1. Install the dedicated Gitflare/Staging API key as described in [current setup](auth/result.md); client ID, discovered issuer and canonical callback/logout URLs are configured. Exercise real login, refresh, org switching, revoked sessions and removed memberships through the deployed UI and API.
2. Supply already-existing bucket-scoped R2 S3 signing credentials, or explicitly authorize narrowly scoped credential generation. Exercise real git-lfs staging/verify/download above 100 MiB and confirm checksum, signature/length, CPU and deduplication behavior on the deployed adapter.
3. With a real identity, exercise the deployed binding paths for repository create/import/fork, invitations, native credentials, proposal/diff/review/publish/reconcile. The direct provider migration and Git tests are separate evidence.

The retained migrated Artifacts repository is not yet assigned to a forge user: no WorkOS identity was invented to populate D1 ownership. Import through the app after login, or perform a deliberate verified adoption under the actual owner's identity.

Operational bounds are explicit: listing/search returns at most 100 repositories; import is ordinary Git, ≤128 MiB pack / 512 branch/tag refs; review ancestry ≤256 commits, trees ≤256 directories / 2,000 files, text preview ≤256 KiB total; publish packs ≤64 MiB; LFS object ≤256 MiB and fork manifest associations ≤128. Source-code search, arbitrary huge imports, resume/ranges, automatic chunk garbage collection, and private upstream GitHub credentials are not promised.

An uncertain publisher whose ref remains at the base retains its fence for operator investigation. This is a documented safety boundary, not a claim that every failure automatically recovers. General service launch also requires fair-use/admission budgets appropriate to the intended users; the current endpoint is a private credential-blocked evaluation, with finite developer tests only.
