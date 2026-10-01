import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";
import { cpus, platform, release, arch } from "node:os";
import { serveBenchmark } from "./benchmark-http-v2.ts";
import { git } from "./local.ts";
import { sourceFixtures, SEED, fileHash } from "./fixtures.ts";
import {
  rows,
  command,
  gitMeasured,
  csv,
  type Measurement,
} from "./measure.ts";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Gitflare comparison v2 (synthetic/private; loopback benchmark transport only)
Usage: npm run bench:comparison -- [--github] [--repetitions 5] [--output PATH.json]
  --github           Opt in to the existing PRIVATE dedicated GitHub benchmark repo.
  --repetitions N    2–5, default 5; three deterministic edits per backend/repetition.
  --output PATH      New JSON path only; also writes CSV. Never overwrites a run.
  --help, -h         Print help and exit; no fixtures, services or provider requests.
GitHub repo: vasanthsreeram/cf-native-forge-benchmark-20261002-v1
Timeout: 60s per Git/gh command; 15s HTTP/CGI. No LFS/provider provisioning.`);
  process.exit(0);
}
const options = new Set(["--github", "--repetitions", "--output"]);
for (let i = 0; i < args.length; i++) {
  if (!options.has(args[i])) throw Error(`Unknown option: ${args[i]}`);
  if (args[i] !== "--github" && (!args[++i] || args[i].startsWith("--")))
    throw Error("Missing option value");
}
const value = (k: string, d: string) =>
  args.includes(k) ? args[args.indexOf(k) + 1] : d;
const repetitions = Number(value("--repetitions", "5"));
if (!Number.isInteger(repetitions) || repetitions < 2 || repetitions > 5)
  throw Error("Repetitions must be 2–5");
const github = args.includes("--github"),
  startedAt = new Date().toISOString();
const runId =
  startedAt.replace(/[^0-9]/g, "") + "-" + randomBytes(3).toString("hex");
const output = resolve(
  value("--output", "docs/benchmarks/raw/gitflare-comparison-v2.json"),
);
if (!output.endsWith(".json")) throw Error("Output must end in .json");
for (const p of [output, output.replace(/\.json$/, ".csv")]) {
  if (
    await stat(p).then(
      () => true,
      (e) => {
        if (e.code === "ENOENT") return false;
        throw e;
      },
    )
  )
    throw Error("Refuse to overwrite results");
}
const work = resolve(".tmp", `gitflare-comparison-v2-${runId}`);
await mkdir(work, { recursive: true, mode: 0o700 });
const repoName = "vasanthsreeram/cf-native-forge-benchmark-20261002-v1";
const privacy: unknown[] = [],
  orders: string[][] = [],
  trials: unknown[] = [],
  nativeProbes: unknown[] = [];
const serverRuns: unknown[] = [],
  commits: string[] = [],
  manifests: Record<string, string>[] = [];
let fixture: Awaited<ReturnType<typeof sourceFixtures>> = [],
  failure: string | null = null;
const cpuStart = process.cpuUsage(),
  usageStart = process.resourceUsage();
const hash = (s: string | Buffer) =>
  createHash("sha256").update(s).digest("hex");
const fixedDate = (edit: number) => ({
  GIT_AUTHOR_DATE: `2026-10-01T00:0${edit}:00Z`,
  GIT_COMMITTER_DATE: `2026-10-01T00:0${edit}:00Z`,
});
const editText = (i: number) =>
  `// deterministic edit ${i} seed=${SEED}\nexport const accepted = ${i};\n`;
async function phase<T>(
  backend: string,
  rep: number,
  operation: string,
  action: () => Promise<T>,
  fields: Record<string, unknown> = {},
) {
  const start = performance.now(),
    cpu = process.cpuUsage();
  const row: Measurement = {
    backend,
    repetition: rep,
    operation,
    wallMs: 0,
    userSeconds: null,
    systemSeconds: null,
    maxRssBytes: null,
    exitCode: 0,
    timeout: false,
    ...fields,
  };
  try {
    return await action();
  } catch (e) {
    row.exitCode = 1;
    row.timeout =
      e instanceof Error && ["TimeoutError", "AbortError"].includes(e.name);
    row.error = e instanceof Error ? e.message : "Phase failed";
    throw e;
  } finally {
    const d = process.cpuUsage(cpu);
    row.wallMs = performance.now() - start;
    row.nodeUserMs = d.user / 1000;
    row.nodeSystemMs = d.system / 1000;
    rows.push(row);
  }
}
async function privateCheck(name: string, stage: string) {
  const r = await command("github-control", 0, `privacy-${stage}`, "gh", [
    "repo",
    "view",
    name,
    "--json",
    "isPrivate,url",
  ]);
  const info = JSON.parse(r.stdout);
  privacy.push({ stage, name, ...info });
  if (!info.isPrivate) throw Error("Refuse non-private repository");
  return info.url + ".git";
}
const gitEnv = (credential?: string): Record<string, string> =>
  credential
    ? {
        GIT_CONFIG_COUNT: "2",
        GIT_CONFIG_KEY_0: "http.extraHeader",
        GIT_CONFIG_VALUE_0: `Authorization: Bearer ${credential}`,
        GIT_CONFIG_KEY_1: "credential.helper",
        GIT_CONFIG_VALUE_1: "",
      }
    : {};
async function identity(directory: string) {
  await git(["config", "user.name", "Synthetic Benchmark"], directory);
  await git(["config", "user.email", "synthetic@example.invalid"], directory);
}
async function verify(directory: string, edit: number) {
  const head = await git(["rev-parse", "HEAD"], directory);
  if (head !== commits[edit]) throw Error("Commit mismatch");
  const tracked = (await git(["ls-files"], directory)).split("\n");
  if (tracked.length !== Object.keys(manifests[edit]).length)
    throw Error("File count mismatch");
  for (const name of tracked)
    if ((await fileHash(join(directory, name))) !== manifests[edit][name])
      throw Error("Body integrity mismatch");
  const history = Number(await git(["rev-list", "--count", "HEAD"], directory));
  if (history !== edit + 1) throw Error("Full history mismatch");
  if (await git(["status", "--porcelain"], directory))
    throw Error("Dirty checkout");
  return {
    head,
    files: tracked.length,
    fullHistoryCommits: history,
    allSha256Match: true,
  };
}
try {
  let githubRemote = "";
  if (github) {
    await privateCheck("vasanthsreeram/cf-native-forge", "source-before");
    githubRemote = await privateCheck(repoName, "benchmark-before");
  }
  const fixtureDir = join(work, "fixture");
  fixture = await sourceFixtures(fixtureDir);
  const manifest = Object.fromEntries(fixture.map((f) => [f.name, f.sha256]));
  manifest["README.md"] = await fileHash(join(fixtureDir, "README.md"));
  await git(["init", "--initial-branch=main"], fixtureDir);
  await identity(fixtureDir);
  await git(["add", "."], fixtureDir);
  await gitMeasured(
    "fixture",
    0,
    "baseline-commit",
    ["commit", "-m", "synthetic baseline v1"],
    fixtureDir,
    fixedDate(0),
  );
  commits.push(await git(["rev-parse", "HEAD"], fixtureDir));
  manifests.push({ ...manifest });
  for (let i = 1; i <= 3; i++) {
    const path = `src/file-00${i}.ts`;
    await writeFile(join(fixtureDir, path), editText(i));
    manifest[path] = hash(editText(i));
    await git(["add", "."], fixtureDir);
    await gitMeasured(
      "fixture",
      0,
      "edit-commit",
      ["commit", "-m", `synthetic edit ${i}`],
      fixtureDir,
      fixedDate(i),
    );
    commits.push(await git(["rev-parse", "HEAD"], fixtureDir));
    manifests.push({ ...manifest });
  }
  // Seeded Fisher-Yates for paired backend blocks; randomization is reproducible.
  let random = SEED;
  const shuffle = (a: string[]) => {
    for (let i = a.length - 1; i > 0; i--) {
      random ^= random << 13;
      random ^= random >>> 17;
      random ^= random << 5;
      const j = (random >>> 0) % (i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  for (let rep = 1; rep <= repetitions; rep++) {
    const order = shuffle(
      github
        ? ["bare-git", "gitflare-harness-http", "github"]
        : ["bare-git", "gitflare-harness-http"],
    );
    orders.push(order);
    for (const backend of order) {
      console.log(JSON.stringify({ repetition: rep, backend, stage: "start" }));
      const dir = join(work, `${rep}-${backend}`);
      await mkdir(dir, { recursive: true });
      const service =
        backend === "gitflare-harness-http"
          ? await serveBenchmark(join(dir, "service"))
          : null;
      let apiCredential = "",
        taskId = "",
        origin = backend === "github" ? githubRemote : join(dir, "bare.git");
      const branch = `bench-v2-${runId}-${rep}`;
      const request = async (
        operation: string,
        path: string,
        body?: unknown,
        expected = 200,
        authenticated = true,
      ) =>
        phase(
          backend,
          rep,
          operation,
          async () => {
            const response = await fetch(service!.url + path, {
              method: body === undefined ? "GET" : "POST",
              headers: {
                ...(authenticated
                  ? { authorization: `Bearer ${apiCredential}` }
                  : {}),
                "content-type": "application/json",
              },
              ...(body === undefined ? {} : { body: JSON.stringify(body) }),
              signal: AbortSignal.timeout(15000),
            });
            const bytes = Buffer.from(await response.arrayBuffer());
            // No response bodies/credentials logged; explicit safe error messages only.
            if (response.status !== expected)
              throw Error(
                `API ${operation}: expected ${expected}, got ${response.status}`,
              );
            return {
              status: response.status,
              text: bytes.toString(),
              data: response.headers
                .get("content-type")
                ?.includes("application/json")
                ? JSON.parse(bytes.toString())
                : null,
            };
          },
          { expectedStatus: expected, expectedDenial: expected >= 400 },
        );
      const token = async (scope: string) =>
        (
          await request(`credential-${scope}`, `/api/repos/${taskId}/token`, {
            scope,
          })
        ).data;
      try {
        const setupStart = performance.now();
        let readCredential = "",
          writeCredential = "";
        if (service) {
          apiCredential =
            (
              await request(
                "local-identity",
                "/__local_identity",
                undefined,
                200,
                false,
              )
            ).data?.credential ?? "";
          if (!apiCredential) throw Error("Missing local identity");
          await request("unauthenticated-me", "/api/me", undefined, 401, false);
          const me = (await request("authenticate-me", "/api/me")).data;
          if (me.id !== service.principal.id) throw Error("Identity mismatch");
          const canonical = (
            await request(
              "create-private-repo",
              "/api/repos",
              { name: `comparison-${rep}` },
              201,
            )
          ).data;
          if (canonical.visibility !== "private" || canonical.state !== "ready")
            throw Error("Invalid private repo state");
          const listed = (await request("list-repos", "/api/repos")).data.repos;
          if (
            !listed.some(
              (r: any) => r.id === canonical.id && r.visibility === "private",
            )
          )
            throw Error("Repo not listed privately");
          const opened = (
            await request("open-native-repo", `/api/repos/${canonical.id}`)
          ).data;
          const native = (
            await request(
              "native-read-token",
              `/api/repos/${canonical.id}/token`,
              { scope: "read" },
            )
          ).data;
          const denied = await request(
            "canonical-write-denied",
            `/api/repos/${canonical.id}/token`,
            { scope: "write" },
            403,
          );
          await request(
            "native-http-route-missing",
            `/git/${canonical.id}.git/info/refs?service=git-upload-pack`,
            undefined,
            404,
          );
          nativeProbes.push({
            repetition: rep,
            provider: native.provider,
            filesystemRemote: native.remote === opened.git.remote,
            credentialIssued: Boolean(native.credential),
            normalHttpGitStatus: 404,
            canonicalWriteStatus: denied.status,
            message: denied.data.message,
            ordinaryGitThroughUnmodifiedApp: "unmeasured: no transport",
          });
          service.enableTransport();
          const task = (
            await request(
              "create-task-fork",
              `/api/repos/${canonical.id}/tasks`,
              { name: `task-${rep}` },
              201,
            )
          ).data;
          taskId = task.id;
          if (task.parent !== canonical.id || task.visibility !== "private")
            throw Error("Task isolation mismatch");
          const write = await token("write"),
            read = await token("read");
          origin = write.remote;
          writeCredential = write.credential;
          readCredential = read.credential;
          if (
            !origin.startsWith(service.url + "/git/") ||
            origin !== read.remote
          )
            throw Error("Transport bypass detected");
        } else if (backend === "bare-git")
          await git(["init", "--bare", "--initial-branch=main", origin]);
        await gitMeasured(
          backend,
          rep,
          "seed-baseline",
          ["push", origin, `${commits[0]}:refs/heads/${branch}`],
          fixtureDir,
          gitEnv(writeCredential),
        );
        const client = join(dir, "client"),
          consumer = join(dir, "consumer");
        for (const [name, path] of [
          ["cold-client-clone", client],
          ["other-client-clone", consumer],
        ]) {
          await gitMeasured(
            backend,
            rep,
            name,
            [
              "clone",
              "--no-local",
              "--single-branch",
              "--branch",
              branch,
              origin,
              path,
            ],
            undefined,
            gitEnv(readCredential),
          );
          await phase(backend, rep, `${name}-verify`, () => verify(path, 0));
          if ((await git(["remote", "get-url", "origin"], path)) !== origin)
            throw Error("Remote mismatch");
        }
        await identity(client);
        rows.push({
          backend,
          repetition: rep,
          operation: "setup-through-two-verified-clones",
          wallMs: performance.now() - setupStart,
          userSeconds: null,
          systemSeconds: null,
          maxRssBytes: null,
          exitCode: 0,
          timeout: false,
          aggregate: true,
        });
        for (let edit = 1; edit <= 3; edit++) {
          const iterationStart = performance.now(),
            eventStart = service?.events.length ?? 0,
            rowStart = rows.length;
          if (service) {
            writeCredential = (await token("write")).credential;
            readCredential = (await token("read")).credential;
          }
          const coreStart = performance.now();
          await phase(
            backend,
            rep,
            "edit-file",
            () =>
              writeFile(join(client, `src/file-00${edit}.ts`), editText(edit)),
            { edit },
          );
          await gitMeasured(backend, rep, "edit-add", ["add", "."], client);
          await gitMeasured(
            backend,
            rep,
            "edit-commit",
            ["commit", "-m", `synthetic edit ${edit}`],
            client,
            fixedDate(edit),
          );
          await gitMeasured(
            backend,
            rep,
            "edit-push",
            ["push", "origin", `HEAD:refs/heads/${branch}`],
            client,
            gitEnv(writeCredential),
          );
          await gitMeasured(
            backend,
            rep,
            "other-client-fetch",
            ["fetch", "origin", branch],
            consumer,
            gitEnv(readCredential),
          );
          await gitMeasured(
            backend,
            rep,
            "full-checkout",
            ["checkout", "--detach", "FETCH_HEAD"],
            consumer,
          );
          const coreWallMs = performance.now() - coreStart;
          const verification = await phase(
            backend,
            rep,
            "verify-all-content-and-history",
            () => verify(consumer, edit),
            { edit },
          );
          const refs = await gitMeasured(
            backend,
            rep,
            "verify-remote-ref",
            ["ls-remote", "origin", `refs/heads/${branch}`],
            consumer,
            gitEnv(readCredential),
          );
          if (refs.stdout.split(/\s/)[0] !== commits[edit])
            throw Error("Remote ref mismatch");
          if (service) {
            await request("open-task-repo", `/api/repos/${taskId}`);
            const log = (
              await request("app-log", `/api/repos/${taskId}/log?ref=${branch}`)
            ).data;
            if (log[0]?.sha !== commits[edit])
              throw Error("Application log mismatch");
            const tree = (
              await request(
                "app-tree",
                `/api/repos/${taskId}/tree?sha=${commits[edit]}`,
              )
            ).data;
            if (!tree.some((x: any) => x.name === "src" && x.type === "tree"))
              throw Error("Application tree mismatch");
            const file = await request(
              "app-file",
              `/api/repos/${taskId}/file?ref=${commits[edit]}&path=src/file-00${edit}.ts`,
            );
            if (hash(file.text) !== manifests[edit][`src/file-00${edit}.ts`])
              throw Error("Application body mismatch");
          }
          const completeWallMs = performance.now() - iterationStart;
          for (const r of rows.slice(rowStart)) r.edit = edit;
          for (const [operation, wallMs] of [
            ["workflow-edit-through-checkout", coreWallMs],
            ["complete-verified-iteration", completeWallMs],
          ] as const) {
            rows.push({
              backend,
              repetition: rep,
              edit,
              operation,
              wallMs,
              aggregate: true,
              userSeconds: null,
              systemSeconds: null,
              maxRssBytes: null,
              exitCode: 0,
              timeout: false,
            });
          }
          const events = service?.events.slice(eventStart) ?? [];
          if (
            service &&
            !["git-receive-pack", "git-upload-pack"].every((s) =>
              events.some(
                (e) => e.path === `/git/${taskId}.git/${s}` && e.status === 200,
              ),
            )
          )
            throw Error("Missing HTTP Git traversal evidence");
          trials.push({
            backend,
            repetition: rep,
            edit,
            branch,
            verification,
            coreWallMs,
            completeWallMs,
            gitRemoteKind: service
              ? "loopback-authenticated-http-harness"
              : backend === "github"
                ? "private-github-https"
                : "direct-private-filesystem",
            apiRequests: events.filter((e) =>
              String(e.path).startsWith("/api/"),
            ).length,
            gitHttpRequests: events.filter((e) =>
              String(e.path).startsWith("/git/"),
            ).length,
            internalPolicyChecks: events.filter(
              (e) => e.path === "/internal-app-policy/token",
            ).length,
            httpInputBodyBytes: events.reduce(
              (a, e) => a + Number(e.inputBytes ?? 0),
              0,
            ),
            httpOutputBodyBytes: events.reduce(
              (a, e) => a + Number(e.outputBytes ?? 0),
              0,
            ),
          });
        }
        if (service) {
          await request(
            "anonymous-git-denied",
            `/git/${taskId}.git/info/refs?service=git-upload-pack`,
            undefined,
            401,
            false,
          );
          if (service.store.counters.newBytes !== 0)
            throw Error("Unexpected LFS writes");
        }
      } finally {
        if (service) {
          serverRuns.push({
            repetition: rep,
            events: service.events,
            objectStore: service.store.counters,
          });
          await service.close();
        }
      }
      console.log(
        JSON.stringify({ repetition: rep, backend, stage: "verified" }),
      );
    }
  }
} catch (e) {
  failure = e instanceof Error ? e.message : "Unknown benchmark failure";
} finally {
  if (github) {
    try {
      await privateCheck(repoName, "benchmark-after");
      await privateCheck("vasanthsreeram/cf-native-forge", "source-after");
    } catch (e) {
      failure ??= e instanceof Error ? e.message : "Privacy recheck failed";
    }
  }
  const cpu = process.cpuUsage(cpuStart),
    usage = process.resourceUsage();
  const result = {
    version: 2,
    runId,
    startedAt,
    completedAt: new Date().toISOString(),
    status: failure ? "failed" : "passed",
    failure,
    sourceBaseline: "29b9083",
    repetitions,
    github,
    githubRepo: github ? repoName : null,
    work,
    seed: SEED,
    orders,
    commits,
    fixture,
    manifests,
    environment: {
      node: process.version,
      platform: platform(),
      os: release(),
      arch: arch(),
      cpu: cpus()[0].model,
      git: await git(["--version"]),
      clientRegion:
        "Singapore (user environment; route/provider location unmeasured)",
    },
    semantics: {
      compression: 6,
      history:
        "full single-branch, no shallow/filter; 257 tracked files; --no-local",
      cold: "fresh destination and full checkout; OS/page/provider caches uncontrolled",
      pairing:
        "SEED Fisher-Yates backend block order per repetition; three sequential correlated edits",
      native:
        "real local API/SQLite/LocalGit; no WorkOS/Artifacts; normal Git unavailable without harness",
      transport:
        "benchmark-only LocalGit info/token wrapper and loopback git http-backend; app auth/ACL rechecked per request; only private task writes",
      bypasses:
        "zero Git data client filesystem remotes for harness; fixture creation/verification local; original API read token reports filesystem path; no canonical seeding/publishing",
      complete:
        "direct same-world stopwatch: credential refresh (harness), edit/add/commit/push/fetch/full checkout, all-file/history/ref verification, app open/log/tree/file (harness)",
      workflow:
        "direct same-world stopwatch edit/add/commit/push/fetch/full checkout; HTTP/credential checks included in transport; credential issuance before stopwatch",
      bodyCounters:
        "HTTP entity bodies only, not headers/TLS/wire/provider metering; includes in-memory credential JSON lengths without recording values",
      resources:
        "Git client /usr/bin/time process-tree counters; HTTP server CGI children separately; Node process CPU/RSS includes controller and server, not attributed per provider; overlapping counters must not be added",
    },
    privacy,
    nativeProbes,
    trials,
    serverRuns,
    nodeResources: {
      userMs: cpu.user / 1000,
      systemMs: cpu.system / 1000,
      maxRssKiB: usage.maxRSS,
      initialMaxRssKiB: usageStart.maxRSS,
      endingRssBytes: process.memoryUsage().rss,
    },
    measurements: rows,
  };
  await mkdir(join(output, ".."), { recursive: true });
  await writeFile(output, JSON.stringify(result, null, 2) + "\n", {
    flag: "wx",
  });
  await writeFile(output.replace(/\.json$/, ".csv"), csv(rows), { flag: "wx" });
  console.log(
    JSON.stringify({
      output,
      status: result.status,
      failure,
      trials: trials.length,
      measurements: rows.length,
    }),
  );
  if (failure) process.exitCode = 1;
}
