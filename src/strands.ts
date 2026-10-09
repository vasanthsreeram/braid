// Read-only strand summary for a canonical repository: every task fork ("strand")
// with its fork base, tip and immutable proposals, plus whether each proposal has
// been braided into the canonical history. Bounded: 50 strands, 50-commit windows.
import type { GitPlane, Proposal, Repo, Catalog } from "./contracts.ts";
import { ZERO } from "./review.ts";

export interface StrandProposal {
  id: string;
  status: Proposal["status"];
  base: string;
  candidate: string;
  author: string;
  braided: boolean;
  braidedAt?: number;
}
export interface Strand {
  id: string;
  // Null when the caller can see the proposal but not the task fork itself.
  name: string | null;
  state: Repo["state"] | null;
  base?: string;
  tip?: string;
  ahead?: number;
  proposals: StrandProposal[];
}

const LIMIT = 50;

export async function strands(
  s: { catalog: Catalog; git: GitPlane },
  repo: Repo,
  canRead: (id: string) => Promise<boolean>,
): Promise<Strand[]> {
  if (repo.parent) return [];
  const [children, proposals, canonical] = await Promise.all([
    s.catalog.children(repo.id),
    s.catalog.proposals(repo.id),
    repo.state === "ready"
      ? s.git.log(repo.physical, "HEAD").catch(() => [])
      : Promise.resolve([]),
  ]);
  const order = canonical.map((c: any) => c.sha as string);
  const onCanonical = new Map(order.map((sha, i) => [sha, i]));
  const byTask = new Map<string, Proposal[]>();
  for (const p of proposals)
    byTask.set(p.task, [...(byTask.get(p.task) ?? []), p]);

  const known = new Map(children.map((c) => [c.id, c]));
  const ids = [
    ...children.map((c) => c.id),
    // Proposals can outlive a fork's catalog row; keep them on the map.
    ...[...byTask.keys()].filter((id) => !known.has(id)),
  ].slice(0, LIMIT);

  const result = await Promise.all(
    ids.map(async (id): Promise<Strand | null> => {
      const child = known.get(id);
      const visible = !!child && (await canRead(id).catch(() => false));
      const own = byTask.get(id) ?? [];
      if (!visible && !own.length) return null;
      const strand: Strand = {
        id,
        name: visible ? child!.name : null,
        state: visible ? child!.state : null,
        proposals: own.map((p) => ({
          id: p.id,
          status: p.status,
          base: p.base,
          candidate: p.candidate,
          author: p.author,
          braided: p.status === "approved" && onCanonical.has(p.candidate),
        })),
      };
      if (visible && child!.state === "ready") {
        const log: any[] = await s.git
          .log(child!.physical, "HEAD")
          .catch(() => []);
        if (log.length) {
          strand.tip = log[0].sha;
          const fork = log.findIndex((c) => onCanonical.has(c.sha));
          strand.ahead = fork >= 0 ? fork : log.length;
          if (fork > 0) strand.base = log[fork].sha;
          // fork === 0: the tip is already on the canonical line (fresh, or braided by
          // fast-forward). The latest proposal base, when there is one, is the real fork point.
          else if (fork === 0) strand.base = strand.proposals.at(-1)?.base ?? log[0].sha;
        } else {
          strand.ahead = 0;
          if (!order.length) strand.base = ZERO;
        }
      }
      strand.base ??= strand.proposals.at(-1)?.base;
      return strand;
    }),
  );
  const list = result.filter((x): x is Strand => !!x);

  // Timestamp only the most recent braid; one commit read, not one per proposal.
  let newest: StrandProposal | undefined;
  for (const st of list)
    for (const p of st.proposals)
      if (
        p.braided &&
        (!newest ||
          onCanonical.get(p.candidate)! < onCanonical.get(newest.candidate)!)
      )
        newest = p;
  if (newest) {
    const c = await s.git.commit(repo.physical, newest.candidate).catch(() => null);
    const at = c?.committedAt ?? c?.authoredAt;
    if (typeof at === "number" && Number.isFinite(at)) newest.braidedAt = at;
  }
  return list.sort((a, b) =>
    (a.name ?? "￿").localeCompare(b.name ?? "￿") || a.id.localeCompare(b.id),
  );
}
