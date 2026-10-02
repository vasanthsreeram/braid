import type { DurableObjectState } from "@cloudflare/workers-types";
import type { Env } from "./worker.ts";
import type { Principal, Repo, Services } from "./contracts.ts";
import { SQLCatalog } from "./catalog.ts";
import { Collaboration } from "./issues.ts";
import { NativeGit } from "./cloudflare.ts";
import { authorize } from "./app.ts";
import { workos } from "./auth.ts";
import { check, digest } from "./storage.ts";
import {
  reviewScope,
  ReadBroker,
  piReview,
  REVIEW_MODEL,
  LIMITS,
} from "./read-agent.ts";
import { JsonlStorage } from "@earendil-works/pi-durable/storage/jsonl";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { journalFiles } from "./pi-storage.ts";
export class ReviewCoordinator {
  private running = false;
  private controller?: AbortController;
  constructor(
    private ctx: DurableObjectState,
    private env: Env,
  ) {
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS jobs (id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL, status TEXT NOT NULL, data TEXT NOT NULL, created INTEGER NOT NULL)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS pi_files (path TEXT PRIMARY KEY, content BLOB NOT NULL)",
    );
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS budget (day TEXT PRIMARY KEY, requests INTEGER NOT NULL)",
    );
  }
  rows(q: string, ...args: any[]): any[] {
    return this.ctx.storage.sql.exec(q, ...args).toArray();
  }
  async fetch(request: Request) {
    try {
      const u = new URL(request.url);
      if (u.pathname === "/reserve") {
        const day = new Date().toISOString().slice(0, 10);
        const row = this.rows(
          "INSERT INTO budget VALUES (?,1) ON CONFLICT(day) DO UPDATE SET requests=requests+1 WHERE requests<36 RETURNING requests",
          day,
        )[0];
        check(row, 429, "Daily deployment model budget exhausted");
        return Response.json({ requests: row.requests });
      }
      const b = (await request.json()) as any;
      if (u.pathname === "/list")
        return Response.json(
          this.rows("SELECT data FROM jobs ORDER BY created DESC LIMIT 20").map(
            (row) => {
              const { actor, ...safe } = JSON.parse(row.data);
              return safe;
            },
          ),
        );
      if (u.pathname === "/request") {
        const scope = reviewScope(b.repo, b.body),
          fingerprint = await digest(
            new TextEncoder().encode(
              JSON.stringify({
                sha: scope.sha,
                base: scope.base,
                paths: [...scope.paths].sort(),
                model: REVIEW_MODEL,
              }),
            ),
          );
        const same = this.rows(
          "SELECT * FROM jobs WHERE fingerprint=? ORDER BY created DESC LIMIT 1",
          fingerprint,
        )[0];
        if (
          same &&
          (!["failed", "cancelled", "interrupted"].includes(same.status) ||
            !b.body.retry)
        )
          return Response.json(JSON.parse(same.data));
        check(
          this.rows(
            "SELECT id FROM jobs WHERE status IN ('queued','running') LIMIT 1",
          ).length === 0,
          409,
          "One review may run per repository",
        );
        check(
          this.rows(
            "SELECT COUNT(*) AS n FROM jobs WHERE fingerprint=?",
            fingerprint,
          )[0].n < 3,
          429,
          "Review retry limit reached",
        );
        check(
          this.rows(
            "SELECT COUNT(*) AS n FROM jobs WHERE created>?",
            Date.now() - 86400000,
          )[0].n < 12,
          429,
          "Repository daily job budget exhausted",
        );
        for (const stale of this.rows(
          "SELECT id FROM jobs WHERE status NOT IN ('queued','running') ORDER BY created DESC LIMIT -1 OFFSET 19",
        )) {
          this.rows(
            "DELETE FROM pi_files WHERE path LIKE ?",
            "/" + stale.id + "/%",
          );
          this.rows("DELETE FROM jobs WHERE id=?", stale.id);
        }
        const id = crypto.randomUUID(),
          job = {
            id,
            repo: b.repo,
            actor: b.actor,
            scope,
            fingerprint,
            status: "queued",
            created: Date.now(),
            actorId: b.actor.id,
            model: REVIEW_MODEL,
            limits: LIMITS,
            testsRun: false,
            progress: "Queued for scoped static review",
          };
        this.rows(
          "INSERT INTO jobs VALUES (?,?,?,?,?)",
          id,
          fingerprint,
          "queued",
          JSON.stringify(job),
          job.created,
        );
        await new Collaboration(this.env.DB as any).audit(
          b.repo.id,
          b.actor.id,
          "review_queued",
          { id, sha: scope.sha, model: REVIEW_MODEL },
        );
        await this.ctx.storage.setAlarm(Date.now() + 100);
        return Response.json(job);
      }
      check(typeof b.job === "string", 404, "Review unavailable");
      const row = this.rows("SELECT * FROM jobs WHERE id=?", b.job)[0];
      check(row, 404, "Review unavailable");
      const job = JSON.parse(row.data);
      if (
        u.pathname === "/cancel" &&
        ["queued", "running"].includes(job.status)
      ) {
        job.status = "cancelled";
        job.progress =
          "Cancelled; no further source reads or findings publication";
        this.save(job);
        this.controller?.abort();
        await new Collaboration(this.env.DB as any).audit(
          job.repo.id,
          b.actor.id,
          "review_cancelled",
          { id: job.id },
        );
      }
      return Response.json(job);
    } catch (e: any) {
      return Response.json(
        { message: e.status ? e.message : "Review runtime unavailable" },
        { status: e.status ?? 503 },
      );
    }
  }
  save(job: any) {
    this.rows(
      "UPDATE jobs SET status=?,data=? WHERE id=?",
      job.status,
      JSON.stringify(job),
      job.id,
    );
  }
  async alarm() {
    if (this.running) {
      await this.ctx.storage.setAlarm(Date.now() + 5000);
      return;
    }
    // A process crash consumes its reserved request. Never replay an uncertain paid
    // model call automatically. Pi transcript remains durable; explicit bounded retry
    // gets a new job, with source/finding deduplication in the trusted broker.
    for (const row of this.rows("SELECT * FROM jobs WHERE status='running'")) {
      const job = JSON.parse(row.data);
      job.status = "interrupted";
      job.progress = "Worker restarted during review. Explicit retry required.";
      this.save(job);
    }
    const row = this.rows(
      "SELECT * FROM jobs WHERE status='queued' ORDER BY created LIMIT 1",
    )[0];
    if (!row) return;
    const job = JSON.parse(row.data);
    this.running = true;
    this.controller = new AbortController();
    job.status = "running";
    job.progress = "Reading selected files, commit and diff";
    this.save(job);
    await this.ctx.storage.setAlarm(Date.now() + LIMITS.timeoutMs + 5000);
    const timer = setTimeout(() => this.controller?.abort(), LIMITS.timeoutMs);
    const c = new Collaboration(this.env.DB as any),
      git = new NativeGit(this.env.ARTIFACTS),
      catalog = new SQLCatalog(this.env.DB as any);
    const access = async () => {
      check(!this.controller?.signal.aborted, 409, "Review cancelled");
      const p: Principal = job.actor;
      check(
        p.session &&
          !(await this.env.DB.prepare(
            "SELECT id FROM revoked_sessions WHERE id=?",
          )
            .bind(p.session)
            .first()),
        401,
        "Session revoked",
      );
      await authorize(
        { catalog, allowPublic: false },
        p,
        job.repo.id,
        "writer",
      );
      const sessions = await workos(
        this.env,
        `/user_management/users/${p.id}/sessions?limit=100`,
      );
      check(
        sessions.data?.some(
          (s: any) =>
            s.id === p.session &&
            s.status === "active" &&
            s.user_id === p.id &&
            (!s.expires_at || Date.parse(s.expires_at) > Date.now()) &&
            (s.organization_id ?? p.id) === p.tenant,
        ),
        401,
        "Session inactive",
      );
      check(!this.controller?.signal.aborted, 409, "Review cancelled");
      if (p.tenant !== p.id) {
        const memberships = await workos(
          this.env,
          `/user_management/organization_memberships?user_id=${p.id}&organization_id=${p.tenant}&limit=100`,
        );
        check(
          memberships.data?.some(
            (m: any) =>
              m.user_id === p.id &&
              m.organization_id === p.tenant &&
              m.status === "active",
          ),
          401,
          "Membership inactive",
        );
      }
      check(!this.controller?.signal.aborted, 409, "Review cancelled");
    };
    try {
      await access();
      const broker = new ReadBroker(git, job.scope, access),
        storage = await JsonlStorage.open(
          "/" + job.id,
          journalFiles(this.ctx.storage.sql, "/" + job.id),
          BACKGROUND_CONTEXT,
          { fsync: true },
        );
      const reserve = async () => {
        await access();
        const budget = this.env.REVIEWS.get(
          this.env.REVIEWS.idFromName("deployment-inference-budget"),
        );
        const r = await budget.fetch("https://internal/reserve", {
          method: "POST",
        });
        check(r.ok, 429, "Daily deployment model budget exhausted");
        job.requests = (job.requests ?? 0) + 1;
        job.progress = "Requesting bounded static review";
        this.save(job);
      };
      const result = await piReview(
        storage,
        broker,
        async (input, signal) => {
          check(!signal.aborted, 409, "Cancelled");
          const inference = this.env.AI.run(REVIEW_MODEL as any, input);
          return await Promise.race([
            inference,
            new Promise((_, reject) => {
              signal.addEventListener(
                "abort",
                () => reject(Error("Review cancelled")),
                { once: true },
              );
            }),
          ]);
        },
        reserve,
        this.controller.signal,
      );
      await access();
      check(
        this.rows("SELECT status FROM jobs WHERE id=?", job.id)[0].status !==
          "cancelled",
        409,
        "Cancelled",
      );
      job.result = result;
      job.published = [];
      if (await c.policy(job.repo.id))
        for (const f of result.findings) {
          await access();
          if (!(await c.policy(job.repo.id))) break;
          const key = await digest(
            new TextEncoder().encode(
              JSON.stringify([f.sha, f.path, f.start, f.end, f.evidence]),
            ),
          );
          const existing = await c.finding(job.repo.id, key);
          const issue =
            existing ??
            (await c.create(
              job.repo.id,
              job.actor,
              {
                title: f.title,
                body: `Static review · ${REVIEW_MODEL}\nSource: ${f.sha}\nPath: ${f.path}:${f.start}-${f.end}\nEvidence:\n${f.evidence}\n\n${f.explanation}\n\nNo tests or repository code were executed.`,
                assignee: null,
                labels: ["static-review", f.severity],
              },
              key,
            ));
          job.published.push(issue.number);
          await c.audit(job.repo.id, job.actor.id, "finding_published", {
            job: job.id,
            issue: issue.number,
            sha: f.sha,
            key,
          });
        }
      job.status = "completed";
      job.progress = "Static review complete; tests were not run";
    } catch (e: any) {
      const status = this.rows("SELECT status FROM jobs WHERE id=?", job.id)[0]
        ?.status;
      job.status =
        status === "cancelled"
          ? "cancelled"
          : this.controller.signal.aborted
            ? "failed"
            : "failed";
      job.progress =
        job.status === "cancelled"
          ? "Review cancelled"
          : "Review failed; explicit retry available";
      job.error = e.status
        ? e.message
        : "Provider, evidence validation or runtime failed";
    } finally {
      clearTimeout(timer);
      job.finished = Date.now();
      this.save(job);
      await c.audit(job.repo.id, job.actor.id, "review_" + job.status, {
        id: job.id,
        sha: job.scope.sha,
        model: REVIEW_MODEL,
        requests: job.requests ?? 0,
      });
      this.running = false;
      this.controller = undefined;
      if (this.rows("SELECT id FROM jobs WHERE status='queued' LIMIT 1").length)
        await this.ctx.storage.setAlarm(Date.now() + 100);
      else await this.ctx.storage.deleteAlarm();
    }
  }
}
export function reviewClient(env: Env) {
  const call = async (repo: Repo, path: string, body: any) => {
    const stub = env.REVIEWS.get(env.REVIEWS.idFromName("repo:" + repo.id));
    const response = await stub.fetch("https://internal/" + path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const v = (await response.json()) as any;
    check(response.ok, response.status, v.message ?? "Review unavailable");
    const { actor, ...safe } = v;
    return safe;
  };
  return {
    list: (repo: Repo) => call(repo, "list", {}),
    request: (repo: Repo, actor: Principal, body: any) =>
      call(repo, "request", { repo, actor, body }),
    get: (repo: Repo, job: string) => call(repo, "get", { job }),
    cancel: (repo: Repo, job: string, actor?: Principal) =>
      call(repo, "cancel", { job, actor }),
  };
}
