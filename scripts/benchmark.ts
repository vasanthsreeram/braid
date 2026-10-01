import { mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { cpus, platform, release, arch } from "node:os";
import { execFileSync } from "node:child_process";
import { sourceFixtures, SEED, fileHash } from "./fixtures.ts";
import { rows, gitMeasured, csv, command } from "./measure.ts";
import { git, cleanEnv } from "./local.ts";
const startedAt = new Date().toISOString();
const argv = process.argv.slice(2),
  value = (k: string, d: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : d;
  };
const repetitions = Number(value("--repetitions", "3"));
if (!Number.isInteger(repetitions) || repetitions < 2 || repetitions > 5)
  throw Error("Repetitions must be 2–5");
const github = argv.includes("--github"),
  remoteName = value(
    "--github-repo",
    "vasanthsreeram/cf-native-forge-benchmark-20261002-v1",
  );
if (!/^vasanthsreeram\/cf-native-forge-benchmark-[a-z0-9-]+$/.test(remoteName))
  throw Error("Only dedicated synthetic benchmark repos allowed");
const output = resolve(value("--output", "docs/benchmarks/raw/code-v1.json")),
  work = resolve(".tmp/bench-code-v1");
await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });
let remote: string | undefined;
if (github) {
  const env = cleanEnv();
  const run = (a: string[]) =>
    execFileSync("gh", a, {
      env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  let info: any;
  try {
    info = JSON.parse(
      run(["repo", "view", remoteName, "--json", "isPrivate,url"]),
    );
  } catch {
    run([
      "repo",
      "create",
      remoteName,
      "--private",
      "--disable-issues",
      "--disable-wiki",
      "--description",
      "Disposable private CF Native Forge synthetic benchmark v1; no Actions",
    ]);
    info = JSON.parse(
      run(["repo", "view", remoteName, "--json", "isPrivate,url"]),
    );
  }
  if (!info.isPrivate) throw Error("Refuse non-private benchmark repo");
  remote = info.url + ".git";
}
const fixtureDir = join(work, "fixture"),
  fixture = await sourceFixtures(fixtureDir);
await git(["init", "--initial-branch=main"], fixtureDir);
await git(["config", "user.name", "Synthetic Benchmark"], fixtureDir);
await git(["config", "user.email", "synthetic@example.invalid"], fixtureDir);
await git(["add", "."], fixtureDir);
const fixed = {
  GIT_AUTHOR_DATE: "2026-10-01T00:00:00Z",
  GIT_COMMITTER_DATE: "2026-10-01T00:00:00Z",
};
await gitMeasured(
  "fixture",
  0,
  "baseline-commit",
  ["commit", "-m", "synthetic baseline v1"],
  fixtureDir,
  fixed,
);
const base = await git(["rev-parse", "HEAD"], fixtureDir);
const commits = [base];
for (let i = 1; i <= 3; i++) {
  await writeFile(
    join(fixtureDir, `src/file-00${i}.ts`),
    `// deterministic edit ${i} seed=${SEED}\nexport const accepted = ${i};\n`,
  );
  await git(["add", "."], fixtureDir);
  await gitMeasured(
    "fixture",
    0,
    "edit-commit",
    ["commit", "-m", `synthetic edit ${i}`],
    fixtureDir,
    {
      GIT_AUTHOR_DATE: `2026-10-01T00:0${i}:00Z`,
      GIT_COMMITTER_DATE: `2026-10-01T00:0${i}:00Z`,
    },
  );
  commits.push(await git(["rev-parse", "HEAD"], fixtureDir));
}
const fixtureAfter = await fileHash(join(fixtureDir, "src/file-003.ts"));
const orders = [];
const inventories: unknown[] = [];
const taskCommits: Record<string, string> = {};
function inventory(directory: string) {
  const env = cleanEnv();
  const ids = execFileSync(
    "git",
    ["-C", directory, "rev-list", "--objects", "HEAD"],
    { env, encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .map((x) => x.split(" ")[0]);
  const lines = execFileSync(
    "git",
    ["-C", directory, "cat-file", "--batch-check=%(objecttype) %(objectsize)"],
    { env, encoding: "utf8", input: ids.join("\n") + "\n" },
  )
    .trim()
    .split("\n");
  const counts: Record<string, number> = {},
    bytes: Record<string, number> = {};
  for (const line of lines) {
    const [type, size] = line.split(" ");
    counts[type] = (counts[type] ?? 0) + 1;
    bytes[type] = (bytes[type] ?? 0) + Number(size);
  }
  const physical = execFileSync(
    "git",
    ["-C", directory, "count-objects", "-v"],
    { env, encoding: "utf8" },
  );
  return {
    reachableObjectCount: ids.length,
    objectCounts: counts,
    logicalObjectBytes: bytes,
    localConsumerGitCountObjects: physical,
    remotePhysicalBytes: null,
    note: "Mirrored branch logical objects verified by commit ID; consumer pack/loose sizes local, never provider storage or transferred bytes",
  };
}

const runId = new Date().toISOString().replace(/[^0-9]/g, "");
for (let rep = 1; rep <= repetitions; rep++) {
  const localRemote = join(work, "remote-" + rep + ".git");
  await git(["init", "--bare", "--initial-branch=main", localRemote]);
  const order = github
    ? rep % 2
      ? ["github", "local"]
      : ["local", "github"]
    : ["local"];
  orders.push(order);
  for (const backend of order) {
    const origin = backend === "local" ? localRemote : remote!;
    const branch = `bench-v1-${runId}-${rep}`;
    const client = join(work, `${backend}-${rep}-client`),
      consumer = join(work, `${backend}-${rep}-consumer`);
    await gitMeasured(
      backend,
      rep,
      "seed-baseline",
      ["push", origin, `${base}:refs/heads/${branch}`],
      fixtureDir,
    );
    await gitMeasured(backend, rep, "cold-client-clone", [
      "clone",
      "--no-local",
      "--single-branch",
      "--branch",
      branch,
      origin,
      client,
    ]);
    await gitMeasured(backend, rep, "second-client-clone", [
      "clone",
      "--no-local",
      "--single-branch",
      "--branch",
      branch,
      origin,
      consumer,
    ]);
    inventories.push({
      backend,
      repetition: rep,
      phase: "baseline",
      ...inventory(consumer),
    });
    await git(["config", "user.name", "Synthetic Benchmark"], client);
    await git(["config", "user.email", "synthetic@example.invalid"], client);
    for (let i = 1; i <= 3; i++) {
      await writeFile(
        join(client, `src/file-00${i}.ts`),
        `// deterministic edit ${i} seed=${SEED}\nexport const accepted = ${i};\n`,
      );
      await gitMeasured(backend, rep, "edit-add", ["add", "."], client);
      await gitMeasured(
        backend,
        rep,
        "edit-commit",
        ["commit", "-m", `synthetic edit ${i}`],
        client,
        {
          GIT_AUTHOR_DATE: `2026-10-01T00:0${i}:00Z`,
          GIT_COMMITTER_DATE: `2026-10-01T00:0${i}:00Z`,
        },
      );
      if ((await git(["rev-parse", "HEAD"], client)) !== commits[i])
        throw Error("Identical commit invariant failed");
      await gitMeasured(
        backend,
        rep,
        "edit-push",
        ["push", "origin", `HEAD:refs/heads/${branch}`],
        client,
      );
      await gitMeasured(
        backend,
        rep,
        "warm-fetch",
        ["fetch", "origin", branch],
        consumer,
      );
      await gitMeasured(
        backend,
        rep,
        "checkout",
        ["checkout", "--detach", "FETCH_HEAD"],
        consumer,
      );
      inventories.push({
        backend,
        repetition: rep,
        phase: `edit-${i}`,
        ...inventory(consumer),
      });
      if ((await git(["rev-parse", "HEAD"], consumer)) !== commits[i])
        throw Error("Checkout commit mismatch");
    }
    if ((await fileHash(join(consumer, "src/file-003.ts"))) !== fixtureAfter)
      throw Error("Checkout bytes mismatch");
    // Branch task lifecycle on both normal-Git backends. This is not a provider fork measurement.
    await Promise.all(
      [1, 2].map(async (t) => {
        const dir = join(work, `${backend}-${rep}-task-${t}`);
        await gitMeasured(backend, rep, "task-clone", [
          "clone",
          "--no-local",
          "--single-branch",
          "--branch",
          branch,
          origin,
          dir,
        ]);
        await git(["config", "user.name", "Synthetic Benchmark"], dir);
        await git(["config", "user.email", "synthetic@example.invalid"], dir);
        await git(["checkout", "-b", `task-v1-${runId}-${rep}-${t}`], dir);
        await writeFile(join(dir, `task-${t}.txt`), `synthetic task ${t}\n`);
        await git(["add", "."], dir);
        await gitMeasured(
          backend,
          rep,
          "task-commit",
          ["commit", "-m", `task ${t}`],
          dir,
          {
            GIT_AUTHOR_DATE: `2026-10-01T00:1${t}:00Z`,
            GIT_COMMITTER_DATE: `2026-10-01T00:1${t}:00Z`,
          },
        );
        const taskSHA = await git(["rev-parse", "HEAD"], dir);
        if (taskCommits[String(t)] && taskCommits[String(t)] !== taskSHA)
          throw Error("Task commits differ between backends");
        taskCommits[String(t)] = taskSHA;
        await gitMeasured(
          backend,
          rep,
          "task-branch-push",
          ["push", "origin", `HEAD:refs/heads/task-v1-${runId}-${rep}-${t}`],
          dir,
        );
      }),
    );
    // Canonical integration contention on a disposable branch. Both candidates based on same head; exactly one lease wins.
    const canonical = `integration-v1-${runId}-${rep}`;
    await git(
      ["push", origin, `${commits[3]}:refs/heads/${canonical}`],
      fixtureDir,
    );
    const leaseResults = await Promise.all(
      [1, 2].map(async (t) => {
        const dir = join(work, `${backend}-${rep}-task-${t}`);
        return gitMeasured(
          backend,
          rep,
          "canonical-compare-and-push",
          [
            "push",
            `--force-with-lease=refs/heads/${canonical}:${commits[3]}`,
            origin,
            `HEAD:refs/heads/${canonical}`,
          ],
          dir,
          {},
          true,
        );
      }),
    );
    if (leaseResults.filter((x) => x.code === 0).length !== 1)
      throw Error("Expected exactly one canonical winner");
  }
}
if (github) {
  const privacy = JSON.parse(
    execFileSync(
      "gh",
      ["repo", "view", remoteName, "--json", "isPrivate,url"],
      { env: cleanEnv(), encoding: "utf8" },
    ),
  );
  if (!privacy.isPrivate) throw Error("Privacy lost");
}
const result = {
  version: 1,
  runId,
  category: "normal-git",
  startedAt,
  completedAt: new Date().toISOString(),
  seed: SEED,
  repetitions,
  concurrency: 2,
  environment: {
    node: process.version,
    platform: platform(),
    os: release(),
    arch: arch(),
    cpu: cpus()[0].model,
    clientRegion:
      "Singapore (user environment; network routing not independently geolocated)",
    git: await git(["--version"]),
  },
  cold: "fresh destination, full-history single-branch clone with full checkout, --no-local; provider and OS caches uncontrolled",
  warm: "existing client after preceding clone/push; full fetch and checkout, no partial/shallow options",
  compression: 6,
  cloneScope:
    "--single-branch --branch <fixture> on both backends; full history and full checkout. Pilot uncontrolled all-ref cloning was superseded.",
  order:
    "paired alternating backend order with seed-fixed starting backend; not provider-cold",
  orders,
  fixture,
  commits,
  taskCommits,
  inventories,
  github: github ? { repo: remoteName, url: remote, isPrivate: true } : null,
  cloudflare: {
    measured: false,
    blocker:
      "Artifacts API 401; Paid entitlement unverifiable (subscriptions 403)",
  },
  measurements: rows,
};
await mkdir(join(output, ".."), { recursive: true });
await writeFile(output, JSON.stringify(result, null, 2) + "\n");
await writeFile(output.replace(/\.json$/, ".csv"), csv(rows));
console.log(
  JSON.stringify({
    output,
    measurements: rows.length,
    githubPrivate: github,
    correctness: "all commit and byte checks passed",
    canonical: "exactly one lease winner per paired race",
  }),
);
