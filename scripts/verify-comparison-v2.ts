// Independent post-run check: fresh process, actual clients/storage and optional
// fresh GitHub clone, rather than trusting success fields in the benchmark.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { serveLocal, git } from "./local.ts";
import { command, gitMeasured } from "./measure.ts";
import { fileHash } from "./fixtures.ts";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(
    "Usage: tsx scripts/verify-comparison-v2.ts [RESULT.json] [--github]\nReads original .tmp clients/storage; optionally fresh-clones one private GitHub fixture ref. Writes new RESULT-verification.json, refuses overwrite.",
  );
  process.exit(0);
}
if (
  args.filter((a) => !a.startsWith("--")).length > 1 ||
  args.some((a) => a.startsWith("--") && a !== "--github")
)
  throw Error("Unknown verification option");
const path = resolve(
  args.find((a) => !a.startsWith("--")) ??
    "docs/benchmarks/raw/gitflare-comparison-v2.json",
);
const raw = JSON.parse(await readFile(path, "utf8"));
assert.equal(raw.status, "passed");
assert.equal(raw.failure, null);
assert.equal(raw.trials.length, raw.repetitions * (raw.github ? 3 : 2) * 3);
assert.ok(raw.measurements.every((r: any) => r.exitCode === 0 && !r.timeout));
const v1 = JSON.parse(
  await readFile(resolve("docs/benchmarks/raw/code-v1.json"), "utf8"),
);
assert.deepEqual(raw.commits, v1.commits);
// Rebuild expectations from each precomputed fixture body/hash, independent of
// the run's manifests and successful verification flags.
const expected: Record<string, string> = Object.fromEntries(
  raw.fixture.map((f: any) => [f.name, f.sha256]),
);
expected["README.md"] = createHash("sha256")
  .update("# Synthetic benchmark v1\nNo personal source.\n")
  .digest("hex");
for (let i = 1; i <= 3; i++)
  expected[`src/file-00${i}.ts`] = createHash("sha256")
    .update(
      `// deterministic edit ${i} seed=${raw.seed}\nexport const accepted = ${i};\n`,
    )
    .digest("hex");
const checks: unknown[] = [];
const inventories: unknown[] = [];
async function checkout(directory: string) {
  assert.equal(await git(["rev-parse", "HEAD"], directory), raw.commits[3]);
  assert.equal(await git(["rev-list", "--count", "HEAD"], directory), "4");
  const names = (await git(["ls-files"], directory)).split("\n");
  assert.deepEqual(names.sort(), Object.keys(expected).sort());
  for (const name of names)
    assert.equal(await fileHash(join(directory, name)), expected[name]);
  assert.equal(await git(["status", "--porcelain"], directory), "");
  // Ephemeral auth must never have been persisted in any client config.
  const config = await readFile(join(directory, ".git/config"), "utf8");
  assert.ok(!/extraheader|authorization|credential\s*=/i.test(config));
  return {
    files: names.length,
    fullHistoryCommits: 4,
    bodySha256Match: true,
    noPersistedCredential: true,
  };
}
for (let rep = 1; rep <= raw.repetitions; rep++) {
  for (const backend of raw.orders[rep - 1]) {
    const dir = join(raw.work, `${rep}-${backend}`);
    for (const client of ["client", "consumer"])
      checks.push({
        rep,
        backend,
        client,
        ...(await checkout(join(dir, client))),
      });
    const consumer = join(dir, "consumer");
    const objects = (
      await git(["rev-list", "--objects", "HEAD"], consumer)
    ).split("\n");
    inventories.push({
      rep,
      backend,
      reachableObjects: objects.length,
      consumerCountObjects: await git(["count-objects", "-v"], consumer),
      note: "Post-run local consumer object inventory, not network bytes or provider storage.",
    });
    if (backend === "gitflare-harness-http") {
      const service = await serveLocal(join(dir, "service"));
      try {
        const headers = { authorization: `Bearer ${service.token}` };
        const repos = await (
          await fetch(service.url + "/api/repos", { headers })
        ).json();
        assert.ok(repos.repos.every((r: any) => r.visibility === "private"));
        const task = repos.repos.find((r: any) => r.parent);
        assert.ok(task);
        const prefix = `/api/repos/${task.id}`;
        const log = await (
          await fetch(service.url + prefix + `/log?ref=${raw.commits[3]}`, {
            headers,
          })
        ).json();
        assert.equal(log[0].sha, raw.commits[3]);
        for (let i = 1; i <= 3; i++) {
          const r = await fetch(
            service.url +
              prefix +
              `/file?ref=${raw.commits[3]}&path=src/file-00${i}.ts`,
            { headers },
          );
          assert.equal(r.status, 200);
          assert.equal(
            createHash("sha256")
              .update(Buffer.from(await r.arrayBuffer()))
              .digest("hex"),
            expected[`src/file-00${i}.ts`],
          );
        }
        assert.equal((await fetch(service.url + prefix)).status, 404);
        checks.push({
          rep,
          originalLocalApplicationReopened: true,
          privateRepos: repos.repos.length,
          apiLogAndThreeFileBodiesMatch: true,
          anonymousOpenStatus: 404,
        });
      } finally {
        await service.close();
      }
      const events = raw.serverRuns.find(
        (s: any) => s.repetition === rep,
      ).events;
      const successfulTransport = events.filter(
        (e: any) => e.path.startsWith("/git/") && e.status === 200,
      );
      assert.ok(successfulTransport.length > 0);
      assert.equal(
        successfulTransport.length,
        events.filter(
          (e: any) =>
            e.path === "/internal-app-policy/token" && e.status === 200,
        ).length,
      );
    }
  }
}
if (args.includes("--github")) {
  assert.equal(raw.github, true);
  const r = await command("verification", 0, "privacy", "gh", [
    "repo",
    "view",
    raw.githubRepo,
    "--json",
    "isPrivate,url",
  ]);
  const info = JSON.parse(r.stdout);
  assert.equal(info.isPrivate, true);
  const branch = raw.trials.find(
    (t: any) => t.backend === "github" && t.repetition === raw.repetitions,
  ).branch;
  const directory = join(raw.work, "independent-github-clone");
  await gitMeasured("verification", 0, "fresh-github-clone", [
    "clone",
    "--no-local",
    "--single-branch",
    "--branch",
    branch,
    info.url + ".git",
    directory,
  ]);
  checks.push({
    freshGithubClone: true,
    isPrivate: true,
    branch,
    ...(await checkout(directory)),
  });
}
const result = {
  version: 2,
  verifiedAt: new Date().toISOString(),
  input: path,
  inputSha256: await fileHash(path),
  passed: true,
  matchedV1Commits: true,
  checks,
  inventories,
  note: "Independent fresh process; original local app reopened without HTTP wrapper; post-run filesystem inspections are verification, outside measured workflows.",
};
const out = path.replace(/\.json$/, "-verification.json");
await mkdir(join(out, ".."), { recursive: true });
await writeFile(out, JSON.stringify(result, null, 2) + "\n", { flag: "wx" });
console.log(
  JSON.stringify({ output: out, passed: true, checks: checks.length }),
);
