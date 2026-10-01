import {
  mkdir,
  rm,
  writeFile,
  copyFile,
  stat,
  readFile,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { join, resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { cpus } from "node:os";
import { serveLocal, git } from "./local.ts";
import { largeFixtures, SEED, fileHash } from "./fixtures.ts";
import { rows, gitMeasured, csv } from "./measure.ts";
import { microbench } from "./microbench.ts";
const argv = process.argv.slice(2);
if (argv.includes("--help") || argv.includes("-h")) {
  console.log(
    "Usage: npm run bench:lfs -- [--repetitions 2–3] [--mib 101–128] [--output PATH.json]\nLocal-only real LFS/storage benchmark; default 3 repetitions, 112 MiB. Help runs no workload.",
  );
  process.exit(0);
}
const value = (k: string, d: string) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : d;
};
const reps = Number(value("--repetitions", "3")),
  mib = Number(value("--mib", "112"));
if (!Number.isInteger(reps) || reps < 2 || reps > 3)
  throw Error("LFS repetitions must be 2–3");
const work = resolve(".tmp/bench-lfs-v1"),
  out = resolve(value("--output", "docs/benchmarks/raw/lfs-v1.json"));
await rm(work, { recursive: true, force: true });
await mkdir(work, { recursive: true });
console.log(`Generating deterministic ${mib} MiB fixtures; seed=${SEED}.`);
const files = await largeFixtures(join(work, "fixtures"), mib);
const summaries = [];
for (let rep = 1; rep <= reps; rep++) {
  const dir = join(work, "rep-" + rep);
  const local = await serveLocal(join(dir, "service"));
  const auth = { authorization: "Bearer " + local.token };
  const api = async (path: string, body: unknown) => {
    const r = await fetch(local.url + path, {
      method: "POST",
      headers: { ...auth, "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw Error("Local API failed " + r.status);
    return r.json();
  };
  try {
    const repo = await api("/api/repos", { name: "large-file-test" }),
      origin = local.plane.path(repo.physical),
      client = join(dir, "client"),
      consumer = join(dir, "consumer");
    const env = {
      GIT_CONFIG_COUNT: "2",
      GIT_CONFIG_KEY_0: "lfs.url",
      GIT_CONFIG_VALUE_0: `${local.url}/lfs/${repo.id}`,
      GIT_CONFIG_KEY_1: `http.${local.url}/.extraHeader`,
      GIT_CONFIG_VALUE_1: "Authorization: Bearer " + local.token,
    };
    await git(["clone", origin, client]);
    await git(["config", "user.name", "Synthetic Benchmark"], client);
    await git(["config", "user.email", "synthetic@example.invalid"], client);
    await gitMeasured(
      "local-lfs",
      rep,
      "lfs-install",
      ["lfs", "install", "--local", "--skip-repo"],
      client,
      env,
    );
    await gitMeasured(
      "local-lfs",
      rep,
      "lfs-track",
      ["lfs", "track", "asset.bin"],
      client,
      env,
    );
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      await copyFile(file.path, join(client, "asset.bin"));
      await gitMeasured(
        "local-lfs",
        rep,
        "lfs-clean-add",
        ["add", "."],
        client,
        env,
      );
      await gitMeasured(
        "local-lfs",
        rep,
        "lfs-pointer-commit",
        ["commit", "-m", `LFS fixture ${file.name}`],
        client,
        {
          ...env,
          GIT_AUTHOR_DATE: `2026-10-01T00:0${i}:00Z`,
          GIT_COMMITTER_DATE: `2026-10-01T00:0${i}:00Z`,
        },
      );
      const pointer = await git(["show", "HEAD:asset.bin"], client);
      if (
        !pointer.includes("oid sha256:" + file.sha256) ||
        !pointer.startsWith("version https://git-lfs.github.com/spec/v1")
      )
        throw Error("Actual LFS pointer mismatch");
      const before = { ...local.store.counters },
        cpu = process.cpuUsage(),
        start = performance.now();
      const push = await gitMeasured(
        "local-lfs",
        rep,
        "lfs-basic-push",
        ["lfs", "push", "origin", "HEAD"],
        client,
        env,
      );
      push.row.version = file.name;
      push.row.logicalBytes = (await stat(file.path)).size;
      push.row.serverCpuMs =
        (process.cpuUsage(cpu).user + process.cpuUsage(cpu).system) / 1000;
      push.row.serverWallMs = performance.now() - start;
      push.row.storeDelta = Object.fromEntries(
        Object.entries(local.store.counters).map(([k, v]) => [
          k,
          v - before[k as keyof typeof before],
        ]),
      );
      push.row.serverRssBytes = process.memoryUsage().rss;
      await gitMeasured(
        "local-lfs",
        rep,
        "git-pointer-push",
        ["push", "origin", "HEAD:main"],
        client,
        env,
      );
      if (i === 0) {
        await gitMeasured(
          "local-lfs",
          rep,
          "full-git-clone-no-smudge",
          ["clone", "--no-local", origin, consumer],
          undefined,
          env,
        );
        await gitMeasured(
          "local-lfs",
          rep,
          "consumer-lfs-install",
          ["lfs", "install", "--local", "--skip-repo"],
          consumer,
          env,
        );
      } else {
        await gitMeasured(
          "local-lfs",
          rep,
          "git-fetch",
          ["fetch", "origin", "main"],
          consumer,
          env,
        );
        await rm(join(consumer, "asset.bin"), { force: true });
        await gitMeasured(
          "local-lfs",
          rep,
          "git-checkout",
          ["checkout", "--detach", "FETCH_HEAD"],
          consumer,
          env,
        );
      }
      // Each checkout uses an empty LFS cache to measure full downloads of identical content, not a partial checkout.
      await rm(join(consumer, ".git/lfs/objects"), {
        recursive: true,
        force: true,
      });
      await rm(join(consumer, "asset.bin"), { force: true });
      const prior = { ...local.store.counters };
      const downloadCpu = process.cpuUsage();
      const pull = await gitMeasured(
        "local-lfs",
        rep,
        "lfs-full-pull-checkout",
        ["lfs", "pull", "origin"],
        consumer,
        { ...env, GIT_LFS_SKIP_SMUDGE: "" },
      );
      pull.row.version = file.name;
      pull.row.logicalBytes = (await stat(file.path)).size;
      pull.row.serverCpuMs =
        (process.cpuUsage(downloadCpu).user +
          process.cpuUsage(downloadCpu).system) /
        1000;
      pull.row.storeDelta = Object.fromEntries(
        Object.entries(local.store.counters).map(([k, v]) => [
          k,
          v - prior[k as keyof typeof prior],
        ]),
      );
      pull.row.correctness = await fileHash(join(consumer, "asset.bin"));
      if (pull.row.correctness !== file.sha256)
        throw Error("LFS checkout integrity failed");
      // Bound temp disk: original client needs current object for next pushes; retain only latest object cache.
      const oid = file.sha256;
      await rm(join(client, ".git/lfs/objects"), {
        recursive: true,
        force: true,
      });
      const cache = join(
        client,
        ".git/lfs/objects",
        oid.slice(0, 2),
        oid.slice(2, 4),
      );
      await mkdir(cache, { recursive: true });
      await copyFile(file.path, join(cache, oid));
    }
    summaries.push({
      repetition: rep,
      storeCounters: local.store.counters,
      provider: "local-filesystem simulating R2 API operations",
      allFiveCheckoutsVerified: true,
    });
    console.log(
      `Local LFS repetition ${rep}/${reps}: five >100 MiB uploads/checkouts verified.`,
    );
  } finally {
    await local.close();
    await rm(dir, { recursive: true, force: true });
  }
}
const micro = await microbench(files, join(work, "micro"), reps);
const result = {
  version: 1,
  category: "large-files",
  timestamp: new Date().toISOString(),
  seed: SEED,
  repetitions: reps,
  mib,
  environment: {
    node: process.version,
    cpu: cpus()[0].model,
    network: "127.0.0.1 loopback only",
    gitLfs: await git(["lfs", "version"]),
  },
  files: await Promise.all(
    files.map(async (f) => ({
      ...f,
      path: ".tmp/generated/" + f.name,
      bytes: (await stat(f.path)).size,
    })),
  ),
  cold: "fresh service storage and Git clients each repetition; empty consumer LFS cache before every checkout",
  warm: "same repo, verified manifests/chunks retained across five versions within repetition",
  transport:
    "actual git-lfs 3.7.0 Batch/basic PUT and GET on Node loopback using production application handler; Git remote is real local bare Git, not Artifacts",
  rangeResume: "unsupported; rejected with 416",
  cloudflare: {
    measured: false,
    blocker:
      "Artifacts API 401, unverified Paid entitlement; no WorkOS or R2 S3 credentials. Direct R2 staging is implemented but has no live compatibility result.",
  },
  githubLfs: {
    measured: false,
    blocker:
      "Read-only billing usage/packages probes returned 404 and require user scope; remaining included quota cannot be confirmed. No upload or quota purchase attempted.",
  },
  summaries,
  measurements: rows,
  micro,
};
await mkdir(join(out, ".."), { recursive: true });
await writeFile(out, JSON.stringify(result, null, 2) + "\n");
await writeFile(out.replace(/\.json$/, ".csv"), csv(rows));
await writeFile(
  out.replace(/\.json$/, "-micro.csv"),
  csv(micro as unknown as Record<string, unknown>[]),
);
console.log(
  JSON.stringify({
    output: out,
    measurements: rows.length,
    microRows: micro.length,
    correctness: `${reps * files.length} actual >100 MiB LFS checkouts verified`,
  }),
);
