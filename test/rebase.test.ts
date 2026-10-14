// Fast catch-up against real Git: objects built by rebase.ts must be byte-exact (git
// index-pack recomputes every hash) and produce the tree a real rebase would.
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { planFastRebase, encodePack, encodeTree, overlapping, type TreeReader } from "../src/rebase.ts";

const git = (cwd: string, args: string[], input?: Buffer | string) =>
  execFileSync("git", args, {
    cwd,
    input,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: "T",
      GIT_AUTHOR_EMAIL: "t@example.com",
      GIT_COMMITTER_NAME: "T",
      GIT_COMMITTER_EMAIL: "t@example.com",
    },
  })
    .toString()
    .trim();

/** TreeReader over a local repository, shaped like the Artifacts binding's answers. */
function reader(dir: string): TreeReader {
  const kind = (mode: string, type: string) =>
    type === "tree" ? "tree" : mode === "100755" ? "exec" : mode === "120000" ? "symlink" : type === "commit" ? "gitlink" : "blob";
  return {
    async tree(_: string, sha: string) {
      const out = git(dir, ["ls-tree", "-z", sha]);
      return out
        .split("\0")
        .filter(Boolean)
        .map((line) => {
          const [meta, name] = line.split("\t");
          const [mode, type, hash] = meta.split(" ");
          // Artifacts reports trees as "040000"; encodeTree must normalise it.
          return { name, mode: type === "tree" ? "040000" : mode, hash, type: kind(mode, type) };
        });
    },
    async commit(_: string, sha: string) {
      const raw = git(dir, ["cat-file", "commit", sha]);
      const [head, ...rest] = raw.split("\n\n");
      const tree = head.match(/^tree (\w+)/m)![1];
      const parents = [...head.matchAll(/^parent (\w+)/gm)].map((m) => m[1]);
      const a = head.match(/^author (.*) <(.*)> (\d+) /m)!;
      return {
        sha,
        tree,
        parents,
        message: rest.join("\n\n") + "\n",
        author: { name: a[1], email: a[2] },
        authoredAt: Number(a[3]),
      };
    },
  };
}
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "braid-rebase-"));
  git(dir, ["init", "-q", "-b", "main"]);
  return dir;
}
const write = (dir: string, path: string, text: string) => {
  mkdirSync(join(dir, path, ".."), { recursive: true });
  writeFileSync(join(dir, path), text);
};
const commit = (dir: string, msg: string) => {
  git(dir, ["add", "-A"]);
  git(dir, ["commit", "-q", "-m", msg]);
  return git(dir, ["rev-parse", "HEAD"]);
};

test("encodeTree reproduces real tree hashes (sorting, modes, nested dirs)", async () => {
  const dir = repo();
  try {
    write(dir, "a.txt", "a");
    write(dir, "a-b/x.txt", "x");
    write(dir, "a/y.txt", "y");
    write(dir, "run.sh", "#!/bin/sh\n");
    chmodSync(join(dir, "run.sh"), 0o755);
    commit(dir, "init");
    const r = reader(dir);
    const root = git(dir, ["rev-parse", "HEAD^{tree}"]);
    const entries = (await r.tree("", root)) as any[];
    assert.equal(encodeTree(entries).hash, root);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("fast rebase of disjoint changes is byte-exact and matches the expected tree", async () => {
  const dir = repo();
  try {
    write(dir, "README.md", "hello\n");
    write(dir, "docs/index.md", "index\n");
    const base = commit(dir, "base");
    // The strand: one commit adding a guide, editing a nested file, deleting another.
    git(dir, ["checkout", "-q", "-b", "strand"]);
    write(dir, "docs/install.md", "install\n");
    write(dir, "src/deep/a.ts", "export const a = 1;\n");
    rmSync(join(dir, "README.md"));
    const candidate = commit(dir, "Agent: install guide\n\nbody");
    // Meanwhile canonical moved: another strand landed different files.
    git(dir, ["checkout", "-q", "main"]);
    write(dir, "docs/models.md", "models\n");
    write(dir, "src/deep/b.ts", "export const b = 2;\n");
    const onto = commit(dir, "Agent: models guide");

    const plan = await planFastRebase({
      git: reader(dir),
      canonical: "c",
      strand: "s",
      base,
      candidate,
      onto,
      now: 1_760_000_000_000,
    });
    assert.ok(plan.ok, JSON.stringify(plan));
    if (!plan.ok) return;
    assert.deepEqual(plan.files.sort(), ["README.md", "docs/install.md", "src/deep/a.ts"]);

    // Every object in the pack is re-hashed by git; a single wrong byte fails here.
    const pack = await encodePack(plan.objects);
    const target = mkdtempSync(join(tmpdir(), "braid-rebase-target-"));
    try {
      git(target, ["init", "-q", "--bare"]);
      git(dir, ["push", "-q", target, "main", "strand"]);
      git(target, ["index-pack", "--stdin", "--fix-thin"], Buffer.from(pack));
      git(target, ["update-ref", "refs/heads/rebased", plan.commit.hash]);
      git(target, ["fsck", "--strict", "--no-dangling"]);
      assert.equal(git(target, ["rev-parse", "rebased^"]), onto);
      // Expected: what `git rebase` produces for the same change.
      git(dir, ["checkout", "-q", "strand"]);
      git(dir, ["rebase", "-q", "--onto", onto, base]);
      assert.equal(git(target, ["rev-parse", "rebased^{tree}"]), git(dir, ["rev-parse", "HEAD^{tree}"]));
      assert.match(git(target, ["log", "-1", "--format=%an|%s", "rebased"]), /^T\|Agent: install guide$/);
    } finally {
      rmSync(target, { recursive: true, force: true });
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("overlapping changes are refused (same file, or file vs directory)", async () => {
  assert.deepEqual(overlapping(["docs/a.md"], ["docs/a.md"]), ["docs/a.md"]);
  assert.deepEqual(overlapping(["docs"], ["docs/a.md"]), ["docs"]);
  assert.deepEqual(overlapping(["docs/a.md/x"], ["docs/a.md"]), ["docs/a.md/x"]);
  assert.deepEqual(overlapping(["docs/a.md"], ["docs/b.md", "src/a.md"]), []);

  const dir = repo();
  try {
    write(dir, "docs/index.md", "index\n");
    const base = commit(dir, "base");
    git(dir, ["checkout", "-q", "-b", "strand"]);
    write(dir, "docs/index.md", "mine\n");
    const candidate = commit(dir, "mine");
    git(dir, ["checkout", "-q", "main"]);
    write(dir, "docs/index.md", "theirs\n");
    const onto = commit(dir, "theirs");
    const plan = await planFastRebase({ git: reader(dir), canonical: "c", strand: "s", base, candidate, onto });
    assert.equal(plan.ok, false);
    if (!plan.ok) assert.deepEqual(plan.conflicts, ["docs/index.md"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("multi-commit strands are left to the container path", async () => {
  const dir = repo();
  try {
    write(dir, "a", "1");
    const base = commit(dir, "base");
    git(dir, ["checkout", "-q", "-b", "strand"]);
    write(dir, "b", "1");
    commit(dir, "one");
    write(dir, "c", "1");
    const candidate = commit(dir, "two");
    git(dir, ["checkout", "-q", "main"]);
    write(dir, "d", "1");
    const onto = commit(dir, "theirs");
    const plan = await planFastRebase({ git: reader(dir), canonical: "c", strand: "s", base, candidate, onto });
    assert.equal(plan.ok, false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
