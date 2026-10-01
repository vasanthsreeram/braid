import type { GitPlane, Principal, Repo } from "./contracts.ts";
import { SHA } from "./review.ts";

export interface Commit {
  sha: string;
  tree: string;
  parents: string[];
  message: string;
  author: { name: string; email: string };
  committer: { name: string; email: string };
  authoredAt: number;
  committedAt: number;
}
// Traverse every parent from every advertised branch/tag. Provider log() is first-parent
// only, so it cannot establish a full contribution history after merges.
export async function reachable(git: GitPlane, repo: Repo, limit = 1000) {
  const refs = await git.refs(repo.physical);
  const queue = [...new Set(refs.map((r) => r.sha))],
    seen = new Set<string>();
  const commits: Commit[] = [];
  let incomplete = false;
  while (queue.length && seen.size < limit) {
    const batch = queue
      .splice(0, Math.min(8, limit - seen.size))
      .filter((sha) => {
        if (seen.has(sha)) return false;
        seen.add(sha);
        return SHA.test(sha);
      });
    const rows = await Promise.all(
      batch.map((sha) => git.commit(repo.physical, sha)),
    );
    for (const c of rows) {
      if (!c) {
        incomplete = true;
        continue;
      }
      if (
        !c.author ||
        !c.committer ||
        !Number.isFinite(c.authoredAt) ||
        !Number.isFinite(c.committedAt) ||
        !Number.isFinite(new Date(c.authoredAt! * 1000).getTime()) ||
        !Number.isFinite(new Date(c.committedAt! * 1000).getTime())
      ) {
        incomplete = true;
      } else commits.push(c as Commit);
      queue.push(...c.parents.filter((sha) => !seen.has(sha)));
    }
  }
  return {
    commits,
    incomplete: incomplete || queue.some((sha) => !seen.has(sha)),
  };
}

export function contributions(
  p: Principal,
  histories: { repo: Repo; commits: Commit[] }[],
  now = Date.now(),
) {
  const end = new Date(now).toISOString().slice(0, 10);
  const start = new Date(Date.parse(end) - 364 * 86400000)
    .toISOString()
    .slice(0, 10);
  const unique = new Map<
    string,
    Commit & { repositories: { id: string; name: string }[] }
  >();
  if (p.emailVerified && p.email)
    for (const { repo, commits } of histories)
      for (const c of commits) {
        if (c.author.email.toLowerCase() !== p.email.toLowerCase()) continue;
        const day = new Date(c.authoredAt * 1000).toISOString().slice(0, 10);
        if (day < start || day > end) continue;
        const prior = unique.get(c.sha);
        if (prior) {
          if (!prior.repositories.some((r) => r.id === repo.id))
            prior.repositories.push({ id: repo.id, name: repo.name });
        } else
          unique.set(c.sha, {
            ...c,
            repositories: [{ id: repo.id, name: repo.name }],
          });
      }
  const activity = [...unique.values()].sort(
    (a, b) => b.authoredAt - a.authoredAt || a.sha.localeCompare(b.sha),
  );
  const days = Array.from({ length: 365 }, (_, i) => ({
    date: new Date(Date.parse(start) + i * 86400000).toISOString().slice(0, 10),
    count: 0,
  }));
  for (const c of activity)
    days[Math.floor((c.authoredAt * 1000 - Date.parse(start)) / 86400000)]
      .count++;
  return {
    user: p.id,
    email: p.emailVerified ? p.email : null,
    attribution: "verified-email-match",
    timezone: "UTC",
    start,
    end,
    total: activity.length,
    days,
    activity,
    definition:
      "Unique reachable Git commit IDs, matched by author email to your current verified account email; author date in UTC. Commit identity is self-declared and does not prove account ownership. Shared fork/import history counts once. Only repositories you can currently read are included.",
    limitations:
      "Commits only; no issue/review/push-event counts. Rolling 365 days. Traversal capped at 1,000 objects per repository and 20 visible repositories; annotated tag objects may be unavailable through readCommit. Incomplete scans are explicitly marked. Removed/unreachable commits and former emails are excluded.",
  };
}
