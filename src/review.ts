import type { GitPlane } from "./contracts.ts";
import { check } from "./storage.ts";
export const ZERO = "0".repeat(40);
export const SHA = /^[a-f0-9]{40}$/;
export function branchRef(branch: string) {
  check(
    /^[A-Za-z0-9_][A-Za-z0-9_./-]{0,127}$/.test(branch) &&
      !branch.includes("..") &&
      !branch.includes("//") &&
      !branch.endsWith("/") &&
      !branch.endsWith(".lock"),
    422,
    "Invalid default branch",
  );
  return "refs/heads/" + branch;
}
export async function descendant(
  git: GitPlane,
  source: string,
  base: string,
  candidate: string,
) {
  check(
    SHA.test(base) &&
      SHA.test(candidate) &&
      candidate !== ZERO &&
      candidate !== base,
    422,
    "Invalid candidate",
  );
  const first = await git.commit(source, candidate);
  check(first?.sha === candidate, 422, "Candidate unavailable");
  if (base === ZERO) return;
  const queue = [candidate],
    seen = new Set<string>();
  while (queue.length) {
    const sha = queue.pop()!;
    if (sha === base) return;
    if (seen.has(sha)) continue;
    check(
      seen.size < 256,
      413,
      "Review ancestry exceeds 256 commits; rebase task closer to the base",
    );
    seen.add(sha);
    const commit = await git.commit(source, sha);
    check(commit, 422, "Incomplete candidate history");
    queue.push(...commit.parents);
  }
  check(false, 409, "Candidate is not a descendant of the base");
}
export async function diff(
  git: GitPlane,
  source: string,
  base: string,
  candidate: string,
) {
  const entries = new Map<string, { before?: any; after?: any }>();
  let visited = 0;
  async function walk(
    sha: string,
    prefix: string,
    side: "before" | "after",
    depth = 0,
  ) {
    check(
      depth < 32 && ++visited <= 256,
      413,
      "Review tree exceeds browse limit",
    );
    const tree = (await git.tree(source, sha)) as any[] | null;
    check(Array.isArray(tree), 422, "Tree unavailable");
    for (const e of tree) {
      const path = prefix + e.name;
      if (e.type === "tree") await walk(e.hash, path + "/", side, depth + 1);
      else {
        check(entries.size < 2000, 413, "Review exceeds 2000 files");
        const v = entries.get(path) ?? {};
        v[side] = e;
        entries.set(path, v);
      }
    }
  }
  if (base !== ZERO) {
    const c = await git.commit(source, base);
    check(c, 422, "Base unavailable in task");
    await walk(c.tree, "", "before");
  }
  const c = await git.commit(source, candidate);
  check(c, 422, "Candidate unavailable");
  await walk(c.tree, "", "after");
  const changed = [...entries].filter(
    ([, v]) =>
      v.before?.hash !== v.after?.hash || v.before?.mode !== v.after?.mode,
  );
  let bytes = 0;
  const files = [];
  for (const [path, v] of changed) {
    let before: string | null = null,
      after: string | null = null;
    // Text previews are optional and bounded. Symlinks/submodules are never followed.
    for (const side of ["before", "after"] as const) {
      const e = v[side];
      if (!e || !["blob", "exec"].includes(e.type) || bytes >= 256 * 1024)
        continue;
      const blob = await git.file(
        source,
        side === "before" ? base : candidate,
        path,
      );
      if (!blob || blob.size > 16 * 1024 || bytes + blob.size > 256 * 1024)
        continue;
      const b = new Uint8Array(await blob.arrayBuffer());
      bytes += b.length;
      if (!b.includes(0)) {
        try {
          const text = new TextDecoder("utf-8", { fatal: true }).decode(b);
          if (side === "before") before = text;
          else after = text;
        } catch {}
      }
    }
    files.push({
      path,
      status: !v.before ? "added" : !v.after ? "deleted" : "modified",
      beforeHash: v.before?.hash ?? null,
      afterHash: v.after?.hash ?? null,
      beforeMode: v.before?.mode ?? null,
      afterMode: v.after?.mode ?? null,
      before,
      after,
    });
  }
  return { base, candidate, files };
}
