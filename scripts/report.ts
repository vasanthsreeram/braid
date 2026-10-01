import { readFile, writeFile } from "node:fs/promises";
const code = JSON.parse(
  await readFile("docs/benchmarks/raw/code-v1.json", "utf8"),
);
const lfs = JSON.parse(
  await readFile("docs/benchmarks/raw/lfs-v1.json", "utf8"),
);
const sum = (a: any[], k: string) =>
  a.reduce((n, r) => n + Number(r[k] ?? 0), 0);
const fmt = (x: number, n = 2) => x.toFixed(n);
const median = (a: number[]) => {
  const s = [...a].sort((a, b) => a - b);
  return s.length % 2
    ? s[(s.length - 1) / 2]
    : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const percentile = (a: number[], q: number) =>
  [...a].sort((a, b) => a - b)[Math.ceil(q * a.length) - 1];
let text = `# Measured benchmark v1\n\nMeasured ${code.completedAt ?? code.startedAt} (UTC; local environment is Asia/Singapore). **No deployed Cloudflare performance result exists.** GitHub normal Git and local bare Git were measured; large-file service and dedupe runs are local only. Raw [code JSON](raw/code-v1.json), [code CSV](raw/code-v1.csv), [LFS JSON](raw/lfs-v1.json), [LFS CSV](raw/lfs-v1.csv), [micro CSV](raw/lfs-v1-micro.csv), [read-only account probes](raw/cloudflare-probes-v1.json), and [UI check](raw/ui-v1.json), [local Worker auth smoke](raw/worker-auth-smoke-v1.json).\n\n## Workload and environment\n\nVersion 1 seed ${code.seed}; 256 synthetic source files + README, ${sum(code.fixture, "bytes")} fixture source bytes. Identical baseline and three edit commits for each backend: ${code.commits.map((s: string) => "\u0060" + s + "\u0060").join(", ")}. Full-history single-branch clone/fetch/full checkout on both backends, compression 6, no shallow/filter shortcuts. ${code.repetitions} repetitions; paired order ${code.orders.map((o: string[]) => o.join("→")).join(", ")}. Two task clients maximum; main edit loop sequential. Task workflows are normal Git branches, **not** GitHub API forks or Artifacts native forks.\n\n${code.environment.cpu}; ${code.environment.platform} ${code.environment.os} ${code.environment.arch}; ${code.environment.node}; ${code.environment.git}. Client location is user-reported Singapore; network route/remote placement were not measured. The superseded code pilot overlapped LFS work; the final code rerun completed after LFS. Other machine background load is uncontrolled: this is a modest feasibility benchmark, not a controlled capacity comparison. LFS subprocess timings include server work on the same machine.\n\nCold means a fresh empty client, full history of the same single fixture branch, and full checkout with local hardlinks disabled. Provider/OS/page caches are uncontrolled. Warm means an existing clone after the preceding pushes; both backends fetch and check out the same full commit. GitHub may reuse server objects across repetitions. Large-file downloads empty the consumer LFS cache before each checkout. No provider-cold/startup claim.\n\n## Normal Git latency\n\nMilliseconds; p50 is median, p95 is nearest rank. **N=3/6/9 is too small for a tail-latency conclusion**; p95 usually equals maximum. Repeated edits inside a repetition are correlated.\n\n| Backend | Operation | N | p50 ms | p95 ms | Min–max ms |\n|---|---|---:|---:|---:|---:|\n`;
const summaries = [];
for (const backend of ["local", "github"])
  for (const operation of [
    "cold-client-clone",
    "edit-commit",
    "edit-push",
    "warm-fetch",
    "checkout",
    "task-clone",
    "task-branch-push",
    "canonical-compare-and-push",
  ]) {
    const rows = code.measurements.filter(
      (r: any) =>
        r.backend === backend && r.operation === operation && r.exitCode === 0,
    );
    if (!rows.length) continue;
    const a = rows.map((r: any) => r.wallMs);
    text += `| ${backend} | ${operation} | ${a.length} | ${fmt(median(a))} | ${fmt(percentile(a, 0.95))} | ${fmt(Math.min(...a))}–${fmt(Math.max(...a))} |\n`;
    summaries.push({
      backend,
      operation,
      n: a.length,
      p50Ms: median(a),
      p95Ms: percentile(a, 0.95),
    });
  }
const failures = code.measurements.filter((r: any) => r.exitCode !== 0),
  timeouts = code.measurements.filter((r: any) => r.timeout);
text += `\n${code.measurements.length} measured commands including four fixture preparation commits. ${failures.length} expected canonical lease rejections, ${timeouts.length} timeouts; no unexpected command failures. Every edit produced the same commit ID and another client fetched/checked out it with matching content. All ${code.repetitions * (code.github ? 2 : 1)} two-client canonical races accepted exactly one candidate and rejected the stale peer. This demonstrates ordinary Git compare-and-push on dedicated disposable branches, not an enforced forge publisher. A superseded [pilot run](raw/pilot/code-v1-uncontrolled-refs.json) retained growing remote refs and uncontrolled task timestamps; it is preserved but excluded from these comparisons. Final task commit IDs are fixed and matched across backends. Raw user/system CPU and maximum RSS from macOS /usr/bin/time are included (per subprocess process-tree counters, not provider CPU). Logical Git object counts/bytes and local consumer pack/loose sizes are recorded in inventories; remote pack byte counts, GitHub storage metering and provider operation counts were unavailable; they are not inferred from latency.\n\nLocal Git has lower latency here. That result includes the obvious loopback/network difference; it establishes no Cloudflare-vs-GitHub win. Canonical contention remains serialized even with independent task branches.\n\n## Actual LFS clients, local-only service\n\n${lfs.repetitions} repetitions × five versions; ${lfs.measurements.length} measured commands. ${lfs.environment.gitLfs}. Git metadata uses a local bare remote; LFS uses real git-lfs Batch/basic HTTP PUT/verify/GET against the shared application handler on 127.0.0.1. All **${lfs.repetitions * 5} full uploads and full pull/checkouts** matched their SHA256 OIDs; every file exceeds 100 MiB. Initial file ${lfs.mib} MiB; sparse replaces three 4 KiB spans; insertion adds ${lfs.files[2].bytes - lfs.files[1].bytes} bytes; control is independent seeded gzip-compressed high-entropy bytes, then one changed byte per compressed MiB block. Hashes and exact sizes are in raw JSON. This success does not validate Workers' 100 MB ingress envelope or direct R2 upload compatibility.\n\n| Version | Size MiB | Upload N / median ms | Full pull/check out N / median ms |\n|---|---:|---:|---:|\n`;
for (const f of lfs.files) {
  const pushes = lfs.measurements.filter(
      (r: any) => r.operation === "lfs-basic-push" && r.version === f.name,
    ),
    pulls = lfs.measurements.filter(
      (r: any) =>
        r.operation === "lfs-full-pull-checkout" && r.version === f.name,
    );
  text += `| ${f.name} | ${fmt(f.bytes / 1048576, 3)} | ${pushes.length} / ${fmt(median(pushes.map((r: any) => r.wallMs)))} | ${pulls.length} / ${fmt(median(pulls.map((r: any) => r.wallMs)))} |\n`;
}
text += `\nCPU/RSS for child git-lfs and local Node server are separately recorded. Node RSS is a process-wide observation including fixture-generation/GC history, not per-invocation Workers memory. No upload bandwidth benefit is claimed: each changed version transfers the whole object through standard basic. Repeat OID upload can be omitted after the manifest exists. Range/resume is unsupported and tested as HTTP 416.\n\n## Storage/compute experiment\n\nSame five fixture files, three repetitions each of whole-file, fixed 1 MiB, and gear CDC. All ${lfs.micro.length} full reconstructions checked chunk hashes/lengths, whole-file SHA and bytes. Counters are **local simulated R2 operations**, never provider usage or invoices. Logical file bytes / newly written physical chunk bytes are distinct. Physical means content-object file size; actual disk block allocation, replicas and remote storage metering were not measured. Manifest bytes are additional.\n\n| Strategy | Total new chunks MiB / repetition | Manifest bytes | Simulated A/B calls | Ingest CPU ms / repetition (median) | Download CPU ms / repetition (median) |\n|---|---:|---:|---:|---:|---:|\n`;
const projections = [];
for (const strategy of ["whole", "fixed-1MiB", "gear32-v1"]) {
  const all = lfs.micro.filter((r: any) => r.strategy === strategy),
    one = all.filter((r: any) => r.repetition === 1);
  const physical = sum(one, "newPhysicalBytes"),
    manifest = sum(one, "manifestBytes"),
    a = sum(one, "simulatedClassA"),
    b = sum(one, "simulatedClassB");
  const cpu = (key: string) =>
    median(
      Array.from({ length: lfs.repetitions }, (_, i) => i + 1).map((rep) =>
        sum(
          all.filter((r: any) => r.repetition === rep),
          key,
        ),
      ),
    );
  text += `| ${strategy} | ${fmt(physical / 1048576, 3)} | ${manifest} | ${a} / ${b} | ${fmt(cpu("ingestCpuMs"))} | ${fmt(cpu("downloadCpuMs"))} |\n`;
  const unrounded =
    ((physical + manifest) / 1e9) * 0.015 + (a / 1e6) * 4.5 + (b / 1e6) * 0.36;
  projections.push({
    strategy,
    physicalBytes: physical,
    manifestBytes: manifest,
    simulatedClassA: a,
    simulatedClassB: b,
    storage30DayUsdUnrounded: ((physical + manifest) / 1e9) * 0.015,
    operationUsdUnrounded: (a / 1e6) * 4.5 + (b / 1e6) * 0.36,
    workloadUsdUnrounded: unrounded,
    usdPerAcceptedEditUnrounded: unrounded / 4,
    acceptedEdits: 4,
    retentionDays: 30,
    providerMeasured: false,
  });
}
text += `\n| Edit | Whole new MiB | Fixed new MiB | CDC new MiB |\n|---|---:|---:|---:|\n`;
for (const f of lfs.files) {
  const values = ["whole", "fixed-1MiB", "gear32-v1"].map(
    (strategy) =>
      lfs.micro.find(
        (r: any) =>
          r.strategy === strategy && r.repetition === 1 && r.version === f.name,
      ).newPhysicalBytes,
  );
  text += `| ${f.name} | ${values.map((v) => fmt(v / 1048576, 3)).join(" | ")} |\n`;
}
const whole = projections[0].physicalBytes,
  cdc = projections[2].physicalBytes;
text += `\nCDC reduced total new chunk bytes by ${fmt((1 - cdc / whole) * 100)}% against whole-file storage for this mix. Fixed chunking is better for the aligned sparse edit (3 MiB vs roughly 8.19 MiB); CDC is better for insertion (roughly 2.39 MiB vs 95 MiB), and offers little saving for the changed high-entropy gzip control. CDC adds hashing/boundary CPU and dozens of read/write calls per object; the local ingest CPU is substantially higher than whole-file storage, and that compute cost may offset storage savings in a real deployment. This synthetic mix is not a population estimate or confidence interval. Raw phase wall time, CPU, object counts and cumulative Node peak RSS are available.\n\n## Iteration spend: projected storage component, not measured invoices\n\nPricing accessed 2026-10-01 UTC / 2026-10-02 Singapore. At [R2 Standard pricing](https://developers.cloudflare.com/r2/pricing/), storage is $0.015/GB-month, A calls $4.50/million and B calls $0.36/million; included allowances are 10 GB-month, 1 million A and 10 million B. Model assumes one five-version workload, final objects retained 30 days, decimal GB, no allowance applied, and four accepted file edits after baseline. Values below are **unrounded linear allocation estimates from local counters**. They exclude staging, retries, failed-upload orphans, D1, Workers/DO/Sandbox/auth and application overhead. Conditional writes/error billing may differ live.\n\n| Strategy | Storage 30 days USD | Request allocation USD | Workload USD | USD / accepted file edit |\n|---|---:|---:|---:|---:|\n`;
for (const p of projections)
  text += `| ${p.strategy} | ${fmt(p.storage30DayUsdUnrounded, 6)} | ${fmt(p.operationUsdUnrounded, 6)} | ${fmt(p.workloadUsdUnrounded, 6)} | ${fmt(p.usdPerAcceptedEditUnrounded, 6)} |\n`;
text += `\nR2 rounds usage upward to billing units; those small allocation values are **not** predicted charges. With unused included allowance this isolated storage component would fit; remaining account allowance is unknown. If an exhausted account crossed new storage/A/B billable units, aggregate invoice deltas could differ substantially (for example $0.015 + $4.50 + $0.36 for crossing one of each unit). No remote CF storage was consumed by this run, so no CF workload invoice exists. Local hardware/electricity opportunity cost is unmeasured, not assigned $0.\n\n[Artifacts pricing](https://developers.cloudflare.com/artifacts/platform/pricing/) requires Workers Paid; operations/storage billing starts October 14, 2026, with 10,000 operations + 1 GB-month included and overage $0.15/1,000 + $0.50/GB-month. No Artifacts operation count/storage test exists here; these rates cannot turn local Git timings into CF spend.\n\nGitHub code benchmark completed nine accepted edits per backend plus six task-branch edits and three canonical winners per backend. GitHub normal Git has no observed per-push charge here; account subscription/quota/invoice reads were unavailable, so **USD per accepted code iteration is unknown**, not zero. The dedicated benchmark repository remains private and retained. [GitHub LFS metering](https://docs.github.com/en/billing/concepts/product-billing/git-lfs) charges storage per complete object version and download bandwidth against account quota. Remaining quota was not readable; **GitHub LFS was not measured** and no allocation was purchased. No oversized ordinary-Git rejection was used as a comparison. AI/hosted-agent/model token spend is explicitly excluded; CDC does not imply fewer model tokens.\n\n## Live blockers and retained resources\n\nSix existing CF tokens were verified active via Keychain read-only probes. Artifacts list returned 401/code 10000; subscription reads 403. BugGuide credential can read the intended account, Workers settings and R2 listing, but Paid entitlement is not proven. No API tokens were created/rotated and no plan/resource change was attempted. WorkOS/forge credentials were absent from Keychain service names; no live WorkOS login request or fake provider response was substituted. GitHub billing usage/packages probes returned 404 with missing user-scope diagnostic; no auth-scope refresh was performed.\n\nReal remote measurement: [private GitHub benchmark](https://github.com/${code.github?.repo ?? "vasanthsreeram/cf-native-forge-benchmark-20261002-v1"}), verified private at create and after tests. No GitHub LFS/Actions/hosted model usage; no CF namespace/Worker/D1/bucket was provisioned. Raw data and synthetic remote refs retained; retained normal-Git storage is small but metered size/subscription allocation unknown. Local generated fixtures live in ignored .tmp; disposable LFS services were removed after each repetition. UI screenshot is a local synthetic view, not a deployed demo.\n\n## Reproduce\n\n\u0060npm ci && npm run typecheck && npm test && WRANGLER_SEND_METRICS=false npm run build\u0060\n\n\u0060env -u GH_TOKEN -u GITHUB_TOKEN npm run bench -- --github --repetitions 3 --output docs/benchmarks/raw/code-v1.json\u0060\n\n\u0060npm run bench:lfs -- --repetitions 3 --mib 112 && npm run test:ui && npm run report\u0060\n\nRemote opt-in creates/reuses only the dedicated cf-native-forge-benchmark-* private repository and uniquely named synthetic refs; it checks privacy before writes and afterward. The code CLI also runs local-only without --github. No automatic GitHub Actions workflow exists. Pin versions and commands are in package-lock.json and [implementation status](../implementation.md).\n`;
await writeFile("docs/benchmarks/report-v1.md", text);
await writeFile(
  "docs/benchmarks/raw/cost-projections-v1.json",
  JSON.stringify(
    {
      version: 1,
      pricingAccessed: "2026-10-01 UTC",
      providerMeasured: false,
      kind: "unrounded storage-only linear allocation estimates from simulated local API counters",
      projections,
      latencies: summaries,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Generated docs/benchmarks/report-v1.md and raw/cost-projections-v1.json from actual raw results.",
);
