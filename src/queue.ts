// Braid queue: proposals waiting to be braided in, one repository at a time, in order.
// Only the entry at the front is caught up, so N queued strands cost N catch-ups, not N².
// Runtime-neutral decisions (tested under Node); the Durable Object glue is in agent-run.ts.
import type { Principal, Proposal } from "./contracts.ts";
import { overlaps } from "./swarm.ts";

export const QUEUE = {
  /** Entries waiting per repository. */
  size: 200,
  /** Finished entries kept for the queue view. */
  log: 200,
  /** Steps per drain pass before yielding to the next alarm. */
  steps: 25,
  /** Re-kick a catch-up that never started after this long. */
  kickMs: 3 * 60 * 1000,
  /** Poll interval while the front entry is catching up. */
  pollMs: 5000,
};
/** auto: a swarm opted in, braided when clean; approved: a person approved it. */
export type QueueMode = "auto" | "approved";
export interface QueueEntry {
  proposal: string;
  run?: string;
  swarm?: string;
  mode: QueueMode;
  /** Paths the planner gave this part (auto mode stays inside them). */
  files?: string[];
  /** Who queued it; the queue acts with this person's (rechecked) authority. */
  actor: Principal;
  queued: number;
  state: "waiting" | "catching_up";
  kicked?: number;
  catchups?: number;
  note?: string;
}
export interface QueueOutcome {
  proposal: string;
  run?: string;
  swarm?: string;
  outcome: "braided" | "held" | "dropped";
  note: string;
  at: number;
  /** Milliseconds from queued to braided. */
  waited?: number;
}
export type Step =
  | { do: "braid"; approve: boolean }
  | { do: "catch_up" }
  | { do: "rebase" }
  | { do: "wait" }
  | { do: "follow"; proposal: string }
  | { do: "done"; outcome: QueueOutcome["outcome"]; note: string };

const BUSY = ["queued", "setting_up", "working", "pushing", "catching_up"];

export function decide(
  e: QueueEntry,
  c: {
    proposal?: Proposal;
    run?: { status: string; proposal?: string | null; conflicts?: boolean; error?: string | null };
    head: string;
    braided: boolean;
    now: number;
  },
): Step {
  const run = c.run;
  if (run?.proposal && run.proposal !== e.proposal) {
    // The agent caught up and proposed again. A clean rebase keeps its place in line
    // (and any approval); a conflict the agent resolved needs a person to look.
    if (run.conflicts)
      return { do: "done", outcome: "held", note: "The agent resolved conflicts while catching up; review it by hand" };
    return { do: "follow", proposal: run.proposal };
  }
  if (run && BUSY.includes(run.status)) return { do: "wait" };
  if (run && (run.status === "failed" || run.status === "cancelled"))
    return { do: "done", outcome: "held", note: run.error ? `The agent stopped: ${run.error}` : "The agent stopped" };
  if (!c.proposal) return { do: "done", outcome: "dropped", note: "The proposal no longer exists" };
  if (c.braided) return { do: "done", outcome: "braided", note: "Already braided in" };
  if (c.proposal.status === "rejected") return { do: "done", outcome: "dropped", note: "Rejected or replaced" };
  if (c.proposal.base !== c.head) {
    if (e.state === "catching_up" && e.kicked && c.now - e.kicked < QUEUE.kickMs) return { do: "wait" };
    return run ? { do: "catch_up" } : { do: "rebase" };
  }
  if (e.mode === "auto" && run?.conflicts)
    return { do: "done", outcome: "held", note: "The agent resolved conflicts; review it by hand" };
  return { do: "braid", approve: c.proposal.status === "open" };
}
/** Auto mode: every changed path must sit inside the part the planner assigned. */
export function outsideScope(changed: string[], declared: string[] | undefined) {
  if (!declared?.length) return [];
  return changed.filter((p) => !declared.some((d) => overlaps(p, d)));
}
/** Public view: no principals. */
export function queueView(entries: QueueEntry[], log: QueueOutcome[]) {
  return {
    entries: entries.map((e, i) => ({
      position: i + 1,
      proposal: e.proposal,
      run: e.run ?? null,
      swarm: e.swarm ?? null,
      mode: e.mode,
      state: e.state,
      queued: e.queued,
      note: e.note ?? null,
      by: e.actor?.name ?? null,
    })),
    recent: log,
  };
}
