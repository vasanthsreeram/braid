import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { git } from "../scripts/local.ts";
import { publishHTTP, pkt, advertisedRefs } from "../src/git-http.ts";
async function rpc(args: string[], input?: Uint8Array) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const p = spawn("git", ["-c", "core.hooksPath=/dev/null", ...args], {
        stdio: ["pipe", "pipe", "pipe"],
      }),
      out: Buffer[] = [],
      err: Buffer[] = [];
    const timer = setTimeout(() => {
      p.kill();
      reject(Error("Git RPC deadline"));
    }, 10000);
    p.stdout.on("data", (b) => out.push(b));
    p.stderr.on("data", (b) => err.push(b));
    p.on("error", reject);
    p.on("exit", (code) => {
      clearTimeout(timer);
      code === 0
        ? resolve(new Uint8Array(Buffer.concat(out)))
        : reject(Error(Buffer.concat(err).toString()));
    });
    p.stdin.end(input);
  });
}
test("real Git RPC publisher verifies raw packs with and without native flush, preserves old-head CAS and rejects damaged packs", async () => {
  const root = await mkdtemp(join(tmpdir(), "forge-http-"));
  try {
    const target = join(root, "target.git"),
      source = join(root, "source.git"),
      work = join(root, "work");
    await git(["init", "--bare", "--initial-branch=main", target]);
    await git(["clone", target, work]);
    await git(["config", "user.name", "Fixture"], work);
    await git(["config", "user.email", "fixture@example.invalid"], work);
    await writeFile(join(work, "README.md"), "base");
    await git(["add", "."], work);
    await git(["commit", "-m", "base"], work);
    await git(["push", "origin", "HEAD:main"], work);
    const base = await git(["rev-parse", "HEAD"], work);
    await git(["clone", "--bare", target, source]);
    await git(["remote", "set-url", "origin", source], work);
    await writeFile(join(work, "README.md"), "candidate");
    await git(["add", "."], work);
    await git(["commit", "-m", "candidate"], work);
    await git(["push", "origin", "HEAD:main"], work);
    const candidate = await git(["rev-parse", "HEAD"], work);
    let flush = false,
      corrupt = false;
    const request: typeof fetch = async (url, init) => {
      const u = new URL(String(url)),
        dir = u.pathname.startsWith("/source/") ? source : target;
      const service =
        u.searchParams.get("service") || u.pathname.split("/").at(-1)!;
      let bytes: Uint8Array;
      if (init?.method === "POST") {
        const input = new Uint8Array(
          await new Response(init.body as BodyInit).arrayBuffer(),
        );
        bytes = await rpc([service.slice(4), "--stateless-rpc", dir], input);
        if (service === "git-upload-pack") {
          if (corrupt) bytes[bytes.length - 1] ^= 1;
          if (flush) {
            const v = new Uint8Array(bytes.length + 4);
            v.set(bytes);
            v.set(new TextEncoder().encode("0000"), bytes.length);
            bytes = v;
          }
        }
      } else {
        const adv = await rpc([
          service.slice(4),
          "--stateless-rpc",
          "--advertise-refs",
          dir,
        ]);
        bytes = new Uint8Array(
          Buffer.concat([
            Buffer.from(pkt("# service=" + service + "\n") + "0000"),
            adv,
          ]),
        );
      }
      let pos = 0;
      const body = new ReadableStream<Uint8Array>({
        pull(c) {
          if (pos === bytes.length) {
            c.close();
            return;
          }
          const length = (pos % 17) + 1;
          c.enqueue(bytes.slice(pos, pos + length));
          pos = Math.min(pos + length, bytes.length);
        },
      });
      return new Response(body);
    };
    const s = {
        remote: "https://git.invalid/source/repo.git",
        plaintext: "test-memory",
      },
      t = {
        remote: "https://git.invalid/target/repo.git",
        plaintext: "test-memory",
      };
    assert.equal((await advertisedRefs(t, request)).refs[0].sha, base);
    corrupt = true;
    await assert.rejects(
      publishHTTP(s, t, "refs/heads/main", base, candidate, request),
    );
    assert.equal(await git(["--git-dir", target, "rev-parse", "HEAD"]), base);
    corrupt = false;
    for (flush of [false, true]) {
      await git(["--git-dir", target, "update-ref", "refs/heads/main", base]);
      const result = await publishHTTP(
        s,
        t,
        "refs/heads/main",
        base,
        candidate,
        request,
      );
      assert.ok(result.receipt.includes("ok refs/heads/main\n"));
      assert.equal(
        await git(["--git-dir", target, "rev-parse", "HEAD"]),
        candidate,
      );
      await assert.rejects(
        publishHTTP(s, t, "refs/heads/main", base, candidate, request),
        /head moved/,
      );
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
