// Real bounded Cloudflare model + real private project Git objects. This verifier
// is a local source/model check, never an app login or a hosted app-owned import.
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn } from "node:child_process";
import { git, LocalGit } from "./local.ts";
import {
  ReadBroker,
  reviewScope,
  piReview,
  REVIEW_MODEL,
} from "../src/read-agent.ts";
import { openNodeJsonlStorage } from "@earendil-works/pi-durable/storage/jsonl/node";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
const dir = await mkdtemp(join(tmpdir(), "gitflare-live-review-")),
  source = resolve("."),
  plane = new LocalGit(dir);
let requests = 0;
const infer = (input: any, signal: AbortSignal) =>
  new Promise<any>((resolve, reject) => {
    if (++requests > 3)
      return reject(Error("Live verification budget exhausted"));
    const p = spawn("python3", ["scripts/review-inference.py"], {
      stdio: ["pipe", "pipe", "pipe"],
      signal,
    });
    let out = "";
    p.stdout.on("data", (b) => (out += b));
    p.stderr.resume();
    p.on("error", reject);
    p.on("exit", (code) => {
      if (code !== 0)
        return reject(Error("Cloudflare inference bridge failed"));
      try {
        const receipt = JSON.parse(out);
        if (receipt.httpStatus !== 200 || !receipt.success)
          throw Error(`Workers AI status ${receipt.httpStatus}`);
        resolve(receipt.result);
      } catch (e) {
        reject(e);
      }
    });
    p.stdin.end(JSON.stringify(input));
  });
try {
  await git([
    "clone",
    "--bare",
    "--no-local",
    source,
    plane.path("private-project"),
  ]);
  const sha = await git(["rev-parse", "HEAD"], source),
    base = await git(["rev-parse", "HEAD^"], source);
  const repo = {
    id: "local-verification-only",
    name: "cf-native-forge",
    physical: "private-project",
    owner: "local-verification-runner",
    tenant: "local-verification-only",
    visibility: "private" as const,
    state: "ready" as const,
    parent: null,
  };
  const refs = await plane.refs(repo.physical);
  const scope = reviewScope(repo, {
    sha,
    base,
    paths: ["src/bundle.ts", "src/pi-storage.ts", "src/issues.ts"],
  });
  const broker = new ReadBroker(plane, scope, async () => {});
  const control = new AbortController(),
    timer = setTimeout(() => control.abort(), 45000);
  try {
    const result = await piReview(
      await openNodeJsonlStorage(join(dir, "journal"), BACKGROUND_CONTEXT, {
        fsync: true,
      }),
      broker,
      infer,
      async () => {},
      control.signal,
    );
    const after = await plane.refs(repo.physical);
    if (JSON.stringify(refs) !== JSON.stringify(after))
      throw Error("Source refs changed");
    const receipt = {
      boundary:
        "Actual private cf-native-forge source snapshot and real Workers AI REST inference using existing Cloudflare deployment OAuth; local Pi Durable JSONL harness, NOT WorkOS app identity, hosted app job or app-owned import",
      sourceCommit: sha,
      base,
      provider: REVIEW_MODEL,
      sourceRefsBefore: refs,
      sourceRefsAfter: after,
      readOnly: true,
      ...result,
    };
    await writeFile(
      "docs/collab-agent/raw/live-read-review.json",
      JSON.stringify(receipt, null, 2) + "\n",
    );
    console.log(
      `Real model review: ${result.findings.length} cited findings, ${result.requests} request(s), ${result.sourceBytes} bytes, source ${sha}`,
    );
  } catch (e: any) {
    await writeFile(
      "docs/collab-agent/raw/live-read-review.json",
      JSON.stringify(
        {
          boundary:
            "Actual source/real provider attempt, no WorkOS app identity or import",
          sourceCommit: sha,
          provider: REVIEW_MODEL,
          requests,
          passed: false,
          error: e.message,
        },
        null,
        2,
      ) + "\n",
    );
    throw e;
  } finally {
    clearTimeout(timer);
  }
} finally {
  await rm(dir, { recursive: true, force: true });
}
