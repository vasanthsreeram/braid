# Independent verification

Parent independently executed after the build worker completed:

- GitHub source and benchmark repository both reported `PRIVATE` through authenticated `gh repo view`.
- `npm run typecheck`: exit 0.
- `npm test`: 26 tests, 26 passed, 0 failed/skipped; duration 3131.053959 ms.
- `npm run test:worker`: 7 local workerd checks passed (401, 503, 401, 401, 403, 401, 404). This is local auth enforcement, not live WorkOS/Cloudflare integration.
- `WRANGLER_SEND_METRICS=false npm run build`: dry-run succeeded, 138.03 KiB / gzip 35.59 KiB. No deployment.
- `npm run bench:lfs -- --repetitions 2 --mib 112 --output <private local verification file>`: 74 measured commands, 30 microbenchmark rows; **10 actual above-100-MiB LFS full checkouts verified**, plus 30 whole/fixed/CDC file reconstructions. Local-only service, not remote R2.

Independent LFS raw output is retained outside the repository under the active Hermes profile's private work directory. Original three-repetition benchmark/raw files and generated report remain committed for reproduction.

Remote main matched the tested build commit before this verification record. Published Cloudflare latency/spend remains **unmeasured**, with Artifacts authentication and WorkOS configuration blockers recorded in the implementation and report. GitHub LFS remains unmeasured. Local Git versus GitHub results do not establish a Cloudflare performance advantage. Spend values in the report are partial projections, not observed total iteration invoices.
