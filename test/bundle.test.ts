import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { git, cleanEnv, localServices } from "../scripts/local.ts";
import { openBundle, pushBundle } from "../src/bundle.ts";
import { pkt } from "../src/git-http.ts";
import { application } from "../src/app.ts";
const stream = (b: Uint8Array) =>
  new ReadableStream<Uint8Array>({
    start(c) {
      for (let i = 0; i < b.length; i += 7) c.enqueue(b.slice(i, i + 7));
      c.close();
    },
  });
async function rpc(args: string[], input?: Uint8Array) {
  return new Promise<Uint8Array>((resolve, reject) => {
    const p = spawn("git", ["-c", "core.hooksPath=/dev/null", ...args], {
      env: cleanEnv(),
      stdio: ["pipe", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];
    p.stdout.on("data", (b) => chunks.push(b));
    p.stderr.resume();
    p.on("error", reject);
    p.on("exit", (code) =>
      code === 0
        ? resolve(new Uint8Array(Buffer.concat(chunks)))
        : reject(Error("Git receiver rejected pack")),
    );
    p.stdin.end(input);
  });
}
test("authenticated private bundle route: all branch/tag objects, author dates and bytes preserved; damaged/prerequisite/header/unauthenticated rejected", async () => {
  const dir = await mkdtemp(join(tmpdir(), "private-bundle-")),
    l = await localServices(dir);
  try {
    const work = join(dir, "work");
    await git(["init", "--initial-branch=main", work]);
    await git(["config", "user.name", "Original local author"], work);
    await git(["config", "user.email", "original@example.invalid"], work);
    await writeFile(join(work, "README.md"), "Original bytes\n");
    await git(["add", "."], work);
    await git(["commit", "-m", "Original history"], work);
    await git(["tag", "-a", "v1", "-m", "Original annotated tag"], work);
    await git(["branch", "second"], work);
    await git(
      ["bundle", "create", join(dir, "source.bundle"), "--branches", "--tags"],
      work,
    );
    const bytes = new Uint8Array(await readFile(join(dir, "source.bundle")));
    const request: typeof fetch = async (url, init) => {
      const target = l.plane.path(
        "cf-native-forge-" + new URL(String(url)).pathname.split("/")[1],
      );
      const service =
        new URL(String(url)).searchParams.get("service") || "git-receive-pack";
      let body: Uint8Array;
      if (init?.method === "POST") {
        body = await rpc(
          ["receive-pack", "--stateless-rpc", target],
          new Uint8Array(await new Response(init.body).arrayBuffer()),
        );
      } else {
        const adv = await rpc([
          service.slice(4),
          "--stateless-rpc",
          "--advertise-refs",
          target,
        ]);
        body = new Uint8Array(
          Buffer.concat([
            Buffer.from(pkt("# service=" + service + "\n") + "0000"),
            adv,
          ]),
        );
      }
      return new Response(new Uint8Array(body));
    };
    l.s.bundle = async (repo, b) => {
      await l.plane.create(repo.physical);
      return pushBundle(
        b,
        {
          remote: "https://local.invalid/" + repo.id,
          plaintext: "local-contract-only",
        },
        request,
      );
    };
    const upload = (credential: string, b: Uint8Array) =>
      application(l.s)(
        new Request(l.s.origin + "/api/bundles?name=private-copy", {
          method: "POST",
          headers: {
            authorization: "Bearer " + credential,
            "content-type": "application/x-git-bundle",
          },
          body: stream(b),
          duplex: "half",
        } as RequestInit),
      );
    assert.equal((await upload("bad", bytes)).status, 401);
    const imported = await upload(l.token, bytes);
    assert.equal(imported.status, 201);
    const repo = (await imported.json()) as any;
    assert.equal(repo.visibility, "private");
    assert.equal(repo.owner, l.principal.id);
    const target = l.plane.path(repo.physical);
    const refs = (path: string) =>
      git([
        "-C",
        path,
        "for-each-ref",
        "--format=%(objectname) %(refname)",
        "refs/heads",
        "refs/tags",
      ]);
    assert.equal(await refs(target), await refs(work));
    assert.equal(
      await git([
        "--git-dir",
        target,
        "rev-list",
        "--objects",
        "--all",
        "--no-object-names",
      ]),
      await git([
        "-C",
        work,
        "rev-list",
        "--objects",
        "--all",
        "--no-object-names",
      ]),
    );
    assert.equal(
      await git(["--git-dir", target, "show", "main:README.md"]),
      await git(["-C", work, "show", "main:README.md"]),
    );
    assert.equal(
      await git([
        "--git-dir",
        target,
        "show",
        "-s",
        "--format=%H %an %ae %at %ct",
        "main",
      ]),
      await git([
        "-C",
        work,
        "show",
        "-s",
        "--format=%H %an %ae %at %ct",
        "main",
      ]),
    );
    const corrupt = bytes.slice();
    corrupt[corrupt.length - 1] ^= 1;
    assert.equal((await upload(l.token, corrupt)).status, 502);
    assert.equal(
      (await l.catalog.list(l.principal, false)).filter(
        (r) => r.state === "failed",
      ).length,
      1,
    );
    await assert.rejects(
      openBundle(
        stream(
          new TextEncoder().encode(
            "# v2 git bundle\n-" + "a".repeat(40) + " prerequisite\n\nPACK",
          ),
        ),
      ),
    );
    await assert.rejects(
      openBundle(stream(new TextEncoder().encode("# v3 git bundle\n\nPACK"))),
    );
    await assert.rejects(openBundle(stream(new Uint8Array(65537).fill(97))));
  } finally {
    l.db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
