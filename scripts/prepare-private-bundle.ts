// Own trusted source only. Preflight/packaging does not authenticate to Gitflare,
// execute imported code, modify source refs, or establish a destination/cutover.
import { mkdir, writeFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { git } from "./local.ts";
const directory = resolve(".tmp");
await mkdir(directory, { recursive: true });
const refs = (
  await git([
    "for-each-ref",
    "--format=%(refname) %(objectname)",
    "refs/heads",
    "refs/tags",
  ])
)
  .split("\n")
  .filter(Boolean);
const extra = (
  await git([
    "for-each-ref",
    "--format=%(refname)",
    "refs/notes",
    "refs/replace",
  ])
)
  .split("\n")
  .filter(Boolean);
if (extra.length)
  throw Error(
    "Additional published refs need a supported migration; no silent omission",
  );
const inventory = await git(["rev-list", "--objects", "--branches", "--tags"]);
const ids = inventory.split("\n").map((row) => row.split(" ")[0]);
// Batch input avoids command-line size limits and prints metadata, never contents.
const { spawn } = await import("node:child_process");
const metadata = await new Promise<string>((resolve, reject) => {
  const p = spawn(
    "git",
    [
      "-c",
      "core.hooksPath=/dev/null",
      "cat-file",
      "--batch-check=%(objectname) %(objecttype) %(objectsize)",
    ],
    { stdio: ["pipe", "pipe", "pipe"] },
  );
  let out = "",
    error = "";
  p.stdout.on("data", (b) => (out += b));
  p.stderr.on("data", (b) => (error += b));
  p.on("error", reject);
  p.on("exit", (code) =>
    code === 0 ? resolve(out) : reject(Error("Object preflight failed")),
  );
  p.stdin.end(ids.join("\n") + "\n");
});
const objects = metadata
  .trim()
  .split("\n")
  .map((row) => {
    const [id, type, size] = row.split(" ");
    return { id, type, size: Number(size) };
  });
if (objects.some((o) => !Number.isSafeInteger(o.size) || o.size < 0))
  throw Error("Missing/corrupt source object");
const largest = objects
  .filter((o) => o.type === "blob")
  .sort((a, b) => b.size - a.size)[0];
const uncompressed = objects.reduce((n, o) => n + o.size, 0);
if (
  largest?.size > 32 * 1024 * 1024 ||
  uncompressed > 1024 * 1024 * 1024 ||
  objects.length > 200000
)
  throw Error(
    "Source exceeds migration preflight; preserve it without rewriting",
  );
const bundle = resolve(".tmp/gitflare-private.bundle");
await git(["bundle", "create", bundle, "--branches", "--tags"]);
await git(["bundle", "verify", bundle]);
const compressed = (await stat(bundle)).size;
if (compressed > 100 * 1024 * 1024)
  throw Error("Source bundle exceeds upload limit");
const advertised = (await git(["bundle", "list-heads", bundle]))
  .split("\n")
  .map((line) => {
    const [sha, ref] = line.split(" ");
    return ref + " " + sha;
  })
  .sort();
if (JSON.stringify(advertised) !== JSON.stringify([...refs].sort()))
  throw Error("Bundle refs differ from source");
const receipt = {
  boundary:
    "Private own-source preflight and verified unrestricted bundle only; destination app import is NOT performed",
  sourceCommit: await git(["rev-parse", "HEAD"]),
  refs,
  unsupportedAdditionalRefs: extra,
  bundle,
  compressedBytes: compressed,
  reachableObjects: objects.length,
  uncompressedObjectBytes: uncompressed,
  largestBlob: largest,
  inventorySha256: createHash("sha256").update(metadata).digest("hex"),
  artifactsLimits: {
    blobBytes: 32 * 1024 * 1024,
    repositoryBytes: 1024 * 1024 * 1024,
    receiverValidationStillRequired: true,
  },
  at: new Date().toISOString(),
};
await writeFile(resolve(".tmp/private-source-objects.txt"), metadata);
await writeFile(
  process.env.GITFLARE_PREFLIGHT_RECEIPT ??
    "docs/collab-agent/raw/private-bundle-preflight.json",
  JSON.stringify(receipt, null, 2) + "\n",
);
console.log(JSON.stringify(receipt, null, 2));
