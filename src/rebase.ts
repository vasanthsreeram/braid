// Fast catch-up: rebase a one-commit strand onto the canonical head inside the Worker,
// without a container, when the strand's changes and the changes that landed meanwhile
// touch different paths (the common case for a planned swarm). Runtime-neutral: Git
// objects are encoded here, then pushed by the caller over smart HTTP.
//
// Safety: every tree read from storage is re-encoded and must hash to its known id before
// it is changed, so an encoding mismatch fails closed (the caller falls back to a container
// rebase). Overlapping paths are never merged here.
import { sha1 } from "@noble/hashes/legacy.js";
import { check } from "./storage.ts";
import { SHA } from "./review.ts";

export interface TreeEntry {
  name: string;
  mode: string;
  hash: string;
  type: string;
}
export interface TreeReader {
  tree(name: string, sha: string): Promise<unknown>;
  commit(
    name: string,
    sha: string,
  ): Promise<{
    sha: string;
    tree: string;
    parents: string[];
    message?: string;
    author?: { name: string; email: string };
    authoredAt?: number;
  } | null>;
}
export const FAST = {
  /** Trees read while diffing or rebuilding; larger changes use the container path. */
  trees: 600,
  files: 2000,
};
export const AUTHOR = { name: "Braid agent", email: "agent@braid.invalid" };

const enc = new TextEncoder();
const hex = (b: Uint8Array) => [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
const unhex = (s: string) => Uint8Array.from(s.match(/../g)!.map((x) => parseInt(x, 16)));
function concat(parts: Uint8Array[]) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}
export interface GitObject {
  type: "commit" | "tree" | "blob";
  data: Uint8Array;
  hash: string;
}
export function gitObject(type: GitObject["type"], data: Uint8Array): GitObject {
  const head = enc.encode(`${type} ${data.length}\0`);
  return { type, data, hash: hex(sha1(concat([head, data]))) };
}
/** Git's tree mode spelling (no leading zero for trees). */
function mode(e: TreeEntry) {
  if (e.type === "tree") return "40000";
  const m = String(e.mode).replace(/^0+/, "");
  check(/^[0-7]{5,6}$/.test(m), 422, "Unsupported tree entry mode");
  return m;
}
/** Tree object bytes: entries sorted by name, directories compared as "name/". */
export function encodeTree(entries: TreeEntry[]): GitObject {
  const key = (e: TreeEntry) => enc.encode(e.name + (e.type === "tree" ? "/" : ""));
  const sorted = [...entries].sort((a, b) => {
    const x = key(a),
      y = key(b);
    for (let i = 0; i < Math.min(x.length, y.length); i++) if (x[i] !== y[i]) return x[i] - y[i];
    return x.length - y.length;
  });
  const parts: Uint8Array[] = [];
  for (const e of sorted) {
    check(SHA.test(e.hash) && e.name && !e.name.includes("/") && !e.name.includes("\0"), 422, "Invalid tree entry");
    parts.push(enc.encode(`${mode(e)} ${e.name}\0`), unhex(e.hash));
  }
  return gitObject("tree", concat(parts));
}
const ident = (s: string) => s.replace(/[<>\n\0]/g, "").trim() || "unknown";
export function encodeCommit(o: {
  tree: string;
  parent: string;
  author: { name: string; email: string };
  authoredAt: number;
  committer: { name: string; email: string };
  committedAt: number;
  message: string;
}): GitObject {
  const who = (p: { name: string; email: string }, t: number) =>
    `${ident(p.name)} <${ident(p.email)}> ${Math.floor(t)} +0000`;
  const message = o.message.endsWith("\n") ? o.message : o.message + "\n";
  return gitObject(
    "commit",
    enc.encode(
      `tree ${o.tree}\nparent ${o.parent}\nauthor ${who(o.author, o.authoredAt)}\n` +
        `committer ${who(o.committer, o.committedAt)}\n\n${message}`,
    ),
  );
}

/* ---------------- tree diff ---------------- */

/** Path → new entry (null = deleted), files only, between two root trees in one repository. */
export async function treeChanges(
  git: TreeReader,
  repo: string,
  from: string | null,
  to: string | null,
  budget = { trees: FAST.trees },
): Promise<Map<string, TreeEntry | null>> {
  const out = new Map<string, TreeEntry | null>();
  const read = async (sha: string | null): Promise<TreeEntry[]> => {
    if (!sha) return [];
    check(--budget.trees >= 0, 413, "Too many directories for a fast catch-up");
    const t = (await git.tree(repo, sha)) as TreeEntry[] | null;
    check(Array.isArray(t), 422, "Tree unavailable");
    return t;
  };
  const walk = async (a: string | null, b: string | null, prefix: string) => {
    if (a === b) return;
    const [x, y] = await Promise.all([read(a), read(b)]);
    const left = new Map(x.map((e) => [e.name, e])),
      right = new Map(y.map((e) => [e.name, e]));
    for (const name of new Set([...left.keys(), ...right.keys()])) {
      const l = left.get(name),
        r = right.get(name),
        path = prefix + name;
      if (l && r && l.hash === r.hash && l.type === r.type && mode(l) === mode(r)) continue;
      const lt = l?.type === "tree" ? l.hash : null,
        rt = r?.type === "tree" ? r.hash : null;
      if (lt || rt) await walk(lt, rt, path + "/");
      if (l && l.type !== "tree" && !(r && r.type !== "tree")) out.set(path, null);
      if (r && r.type !== "tree") out.set(path, r);
      check(out.size <= FAST.files, 413, "Too many files for a fast catch-up");
    }
  };
  await walk(from, to, "");
  return out;
}
/** Paths changed on both sides, including a file on one side under a directory on the other. */
export function overlapping(a: Iterable<string>, b: Iterable<string>) {
  const bs = new Set(b);
  const dirs = new Set<string>();
  for (const p of bs) {
    const parts = p.split("/");
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join("/"));
  }
  const hits: string[] = [];
  for (const p of a) {
    const parts = p.split("/");
    if (bs.has(p) || dirs.has(p) || parts.some((_, i) => i > 0 && bs.has(parts.slice(0, i).join("/"))))
      hits.push(p);
  }
  return hits;
}

/* ---------------- plan ---------------- */

export type FastPlan =
  | {
      ok: true;
      tree: string;
      commit: GitObject;
      objects: GitObject[];
      files: string[];
    }
  | { ok: false; reason: string; conflicts?: string[] };

/**
 * Build the rebased commit for `candidate` (one commit on `base` in `strand`) on top of
 * `onto` (in `canonical`). Returns the new objects (trees + commit) or why the fast path
 * does not apply. Blobs are not copied: the strand already has its own, and the caller
 * copies `onto` into the strand before pushing these objects.
 */
export async function planFastRebase(o: {
  git: TreeReader;
  canonical: string;
  strand: string;
  base: string;
  candidate: string;
  onto: string;
  now?: number;
  committer?: { name: string; email: string };
}): Promise<FastPlan> {
  const c = await o.git.commit(o.strand, o.candidate);
  if (!c) return { ok: false, reason: "candidate unavailable" };
  if (c.parents.length !== 1 || c.parents[0] !== o.base)
    return { ok: false, reason: "the change is not a single commit on its base" };
  const [b, h] = await Promise.all([o.git.commit(o.canonical, o.base), o.git.commit(o.canonical, o.onto)]);
  if (!b || !h) return { ok: false, reason: "history unavailable" };
  const budget = { trees: FAST.trees };
  const mine = await treeChanges(o.git, o.strand, b.tree, c.tree, budget);
  const theirs = await treeChanges(o.git, o.canonical, b.tree, h.tree, budget);
  if (!mine.size) return { ok: false, reason: "the change is empty" };
  const conflicts = overlapping(mine.keys(), theirs.keys());
  if (conflicts.length) return { ok: false, reason: "both sides changed the same paths", conflicts };

  const objects: GitObject[] = [];
  const build = async (sha: string | null, changes: Map<string, TreeEntry | null>): Promise<string | null> => {
    let entries: TreeEntry[] = [];
    if (sha) {
      check(--budget.trees >= 0, 413, "Too many directories for a fast catch-up");
      const t = (await o.git.tree(o.canonical, sha)) as TreeEntry[] | null;
      check(Array.isArray(t), 422, "Tree unavailable");
      // Fail closed if our encoding does not reproduce what storage holds.
      check(encodeTree(t).hash === sha, 422, "Tree encoding mismatch");
      entries = t;
    }
    const byName = new Map(entries.map((e) => [e.name, e]));
    const nested = new Map<string, Map<string, TreeEntry | null>>();
    for (const [path, e] of changes) {
      const i = path.indexOf("/");
      if (i < 0) {
        if (e) byName.set(path, { ...e, name: path });
        else byName.delete(path);
      } else {
        const seg = path.slice(0, i);
        if (!nested.has(seg)) nested.set(seg, new Map());
        nested.get(seg)!.set(path.slice(i + 1), e);
      }
    }
    for (const [seg, sub] of nested) {
      const cur = byName.get(seg);
      const child = await build(cur?.type === "tree" ? cur.hash : null, sub);
      if (child) byName.set(seg, { name: seg, mode: "40000", hash: child, type: "tree" });
      else if (cur?.type === "tree") byName.delete(seg);
    }
    if (!byName.size && sha !== h.tree) return null;
    const t = encodeTree([...byName.values()]);
    objects.push(t);
    return t.hash;
  };
  const tree = (await build(h.tree, mine))!;
  const commit = encodeCommit({
    tree,
    parent: o.onto,
    author: c.author ?? AUTHOR,
    authoredAt: c.authoredAt ?? (o.now ?? Date.now()) / 1000,
    committer: o.committer ?? AUTHOR,
    committedAt: (o.now ?? Date.now()) / 1000,
    message: c.message ?? "Rebased change",
  });
  objects.push(commit);
  return { ok: true, tree, commit, objects, files: [...mine.keys()] };
}

/* ---------------- pack ---------------- */

const TYPE = { commit: 1, tree: 2, blob: 3 } as const;
async function deflate(data: Uint8Array) {
  const stream = new Blob([data as BlobPart]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
/** A version-2 pack of whole (non-delta) objects. */
export async function encodePack(objects: GitObject[]) {
  const seen = new Set<string>();
  const unique = objects.filter((x) => !seen.has(x.hash) && seen.add(x.hash));
  const head = new Uint8Array(12);
  head.set(enc.encode("PACK"));
  const view = new DataView(head.buffer);
  view.setUint32(4, 2);
  view.setUint32(8, unique.length);
  const parts: Uint8Array[] = [head];
  for (const x of unique) {
    let size = x.data.length;
    const bytes = [(TYPE[x.type] << 4) | (size & 0x0f)];
    size >>= 4;
    while (size > 0) {
      bytes[bytes.length - 1] |= 0x80;
      bytes.push(size & 0x7f);
      size >>= 7;
    }
    parts.push(Uint8Array.from(bytes), await deflate(x.data));
  }
  const body = concat(parts);
  return concat([body, sha1(body)]);
}
