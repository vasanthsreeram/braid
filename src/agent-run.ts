// Durable Object + outbound gates for coding agent runs. Imports `cloudflare:workers`,
// so it is only reachable from the deployed entry (main.ts), never from Node tests.
import { WorkerEntrypoint } from "cloudflare:workers";
import type { DurableObjectState } from "@cloudflare/workers-types";
import type { Env } from "./worker.ts";
import type { Principal, Repo, Services } from "./contracts.ts";
import { SQLCatalog } from "./catalog.ts";
import { Collaboration } from "./issues.ts";
import { NativeGit, R2Store } from "./cloudflare.ts";
import { authorize, createTask, head, openProposal } from "./app.ts";
import { subGoal, swarmStrandName, type SubTask, type SwarmRecord } from "./swarm.ts";
import { workos } from "./auth.ts";
import { check, Fault } from "./storage.ts";
import { journalFiles } from "./pi-storage.ts";
import { JsonlStorage } from "@earendil-works/pi-durable/storage/jsonl";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import {
  AGENT_LIMITS,
  AGENT_AUTHOR,
  CA_FILE,
  TERMINAL,
  WORKDIR,
  activeRun,
  admitRun,
  agentLoop,
  resolveGoal,
  startCatchUp,
  containerExec,
  publicRun,
  record,
  runAgent,
  type Exec,
  type RunRecord,
  type Workspace,
} from "./agents.ts";

const IMAGE = "cloudflare/debian-trixie";
const APT_HOST = "deb.debian.org";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const terminal = (s: string) => (TERMINAL as string[]).includes(s);

/**
 * Outbound HTTPS gate for the strand remote. The container never holds a Git credential:
 * each request gets a fresh 60-second Artifacts token minted here, scoped to this run's
 * strand only. Reads (upload-pack) are always allowed; writes (receive-pack) only while
 * the run is in its push step.
 */
type GateProps = {
  physical: string;
  write: boolean;
  /** The canonical repository, readable (never writable) so a run can catch up. */
  canonical?: { physical: string; path: string };
};
export class AgentGitGate extends WorkerEntrypoint<Env, GateProps> {
  async fetch(request: Request): Promise<Response> {
    const props = (this.ctx as any).props as GateProps;
    try {
      const u = new URL(request.url);
      const service =
        u.searchParams.get("service") ??
        (u.pathname.endsWith("/git-upload-pack")
          ? "git-upload-pack"
          : u.pathname.endsWith("/git-receive-pack")
            ? "git-receive-pack"
            : "");
      const canon = props.canonical;
      const target =
        canon &&
        service === "git-upload-pack" &&
        (u.pathname === canon.path + "/info/refs" || u.pathname === canon.path + "/git-upload-pack")
          ? canon.physical
          : props.physical;
      check(
        service === "git-upload-pack" ||
          (service === "git-receive-pack" && props.write && target === props.physical),
        403,
        "Strand access denied",
      );
      const git = new NativeGit(this.env.ARTIFACTS);
      const token = await git.token(target, service === "git-receive-pack" ? "write" : "read");
      const revoke = () => git.revoke(target, token.id).catch(() => {});
      try {
        const remote = new URL(token.remote);
        const base = remote.pathname.replace(/\/$/, "");
        const allowed =
          u.host === remote.host &&
          ((request.method === "GET" && u.pathname === base + "/info/refs") ||
            (request.method === "POST" && u.pathname === base + "/" + service));
        check(allowed, 403, "Strand access denied");
        const headers = new Headers();
        for (const h of ["content-type", "accept", "content-encoding", "git-protocol", "user-agent"]) {
          const v = request.headers.get(h);
          if (v) headers.set(h, v);
        }
        headers.set("authorization", "Bearer " + token.plaintext);
        const upstream = await fetch(remote.origin + u.pathname + u.search, {
          method: request.method,
          headers,
          body: request.method === "POST" ? request.body : undefined,
          redirect: "manual",
          ...(request.method === "POST" ? { duplex: "half" } : {}),
        } as RequestInit);
        if (!upstream.body) {
          await revoke();
          return new Response(null, upstream);
        }
        const { readable, writable } = new TransformStream();
        this.ctx.waitUntil(upstream.body.pipeTo(writable).catch(() => {}).finally(revoke));
        return new Response(readable, upstream);
      } catch (e) {
        await revoke();
        throw e;
      }
    } catch (e: any) {
      return new Response(e instanceof Fault ? e.message : "Strand gate failed", {
        status: e instanceof Fault ? e.status : 502,
      });
    }
  }
}
/** Plain-HTTP Debian mirror passthrough, open only while git is being installed. */
export class AgentAptGate extends WorkerEntrypoint<Env, { open: boolean }> {
  async fetch(request: Request): Promise<Response> {
    const props = (this.ctx as any).props as { open: boolean };
    const u = new URL(request.url);
    if (
      !props.open ||
      !["GET", "HEAD"].includes(request.method) ||
      u.hostname !== APT_HOST ||
      !/^\/debian(-security)?\//.test(u.pathname)
    )
      return new Response("Package mirror closed", { status: 403 });
    return fetch("http://" + APT_HOST + u.pathname, { method: request.method });
  }
}


export class AgentRun {
  private live?: RunRecord;
  private controller?: AbortController;
  private work?: Promise<unknown>;
  constructor(
    private ctx: DurableObjectState,
    private env: Env,
  ) {
    const sql = ctx.storage.sql;
    // Registry tables (instance "repo:<id>") and run state (instance "run:<id>").
    sql.exec(
      "CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, status TEXT NOT NULL, created INTEGER NOT NULL, data TEXT NOT NULL)",
    );
    sql.exec("CREATE TABLE IF NOT EXISTS state (k TEXT PRIMARY KEY, v TEXT NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS budget (day TEXT PRIMARY KEY, n INTEGER NOT NULL)");
    sql.exec("CREATE TABLE IF NOT EXISTS swarms (id TEXT PRIMARY KEY, created INTEGER NOT NULL, data TEXT NOT NULL)");
  }
  private rows(q: string, ...args: any[]): any[] {
    return this.ctx.storage.sql.exec(q, ...args).toArray();
  }
  private stub(name: string) {
    return (this.env as any).AGENTS.get((this.env as any).AGENTS.idFromName(name));
  }
  private async call(name: string, path: string, body: any) {
    const r = await this.stub(name).fetch("https://internal/" + path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const v = (await r.json()) as any;
    check(r.ok, r.status, v?.message ?? "Agent runtime unavailable");
    return v;
  }
  private services(): Services {
    const env = this.env;
    return {
      catalog: new SQLCatalog(env.DB as any),
      git: new NativeGit(env.ARTIFACTS),
      store: new R2Store(env.BUCKET),
      collaboration: new Collaboration(env.DB as any),
      allowPublic: false,
      origin: env.ORIGIN,
      authenticate: async () => null,
    } as unknown as Services;
  }
  /** Live recheck of a stored principal: local revocation, WorkOS session, org membership, role. */
  private async liveAccess(s: Services, p: Principal, repo: string, role: "writer" | "admin") {
    const env = this.env;
    check(
      p.session &&
        !(await env.DB.prepare("SELECT id FROM revoked_sessions WHERE id=?").bind(p.session).first()),
      401,
      "Your session ended; the run stopped",
    );
    await authorize(s, p, repo, role);
    const sessions = await workos(env, `/user_management/users/${p.id}/sessions?limit=100`);
    check(
      sessions.data?.some(
        (x: any) =>
          x.id === p.session &&
          x.status === "active" &&
          x.user_id === p.id &&
          (!x.expires_at || Date.parse(x.expires_at) > Date.now()) &&
          (x.organization_id ?? p.id) === p.tenant,
      ),
      401,
      "Your session ended; the run stopped",
    );
    if (p.tenant !== p.id) {
      const memberships = await workos(
        env,
        `/user_management/organization_memberships?user_id=${p.id}&organization_id=${p.tenant}&limit=100`,
      );
      check(
        memberships.data?.some(
          (m: any) => m.user_id === p.id && m.organization_id === p.tenant && m.status === "active",
        ),
        401,
        "Organization membership inactive",
      );
    }
  }

  /* ---------------- registry helpers ---------------- */

  private summaries(): any[] {
    return this.rows("SELECT data FROM runs ORDER BY created DESC").map((r) => JSON.parse(r.data));
  }
  private summary(id: string): any {
    const row = this.rows("SELECT data FROM runs WHERE id=?", id)[0];
    return row ? JSON.parse(row.data) : undefined;
  }
  private admission() {
    return this.rows("SELECT status, created, data FROM runs").map((r) => ({
      status: r.status as string,
      created: r.created as number,
      updated: JSON.parse(r.data).updated as number | undefined,
    }));
  }

  async fetch(request: Request) {
    try {
      const path = new URL(request.url).pathname.slice(1);
      const b = (await request.json()) as any;
      switch (path) {
        /* ---- deployment-wide budget ---- */
        case "reserve": {
          const day = new Date().toISOString().slice(0, 10);
          const n = Number.isInteger(b.n) && b.n > 0 && b.n <= 8 ? b.n : 1;
          check(n <= AGENT_LIMITS.deploymentDaily, 429, "Daily agent run budget for this server is used up");
          const row = this.rows(
            "INSERT INTO budget VALUES (?,?) ON CONFLICT(day) DO UPDATE SET n=n+? WHERE n+?<=? RETURNING n",
            day,
            n,
            n,
            n,
            AGENT_LIMITS.deploymentDaily,
          )[0];
          check(row, 429, "Daily agent run budget for this server is used up");
          return Response.json({ n: row.n });
        }
        /* ---- per-repository registry ---- */
        case "start": {
          const now = Date.now();
          admitRun(this.admission(), now);
          const id = crypto.randomUUID();
          const summary = {
            id,
            goal: b.goal,
            status: "queued",
            created: now,
            updated: now,
            actor: b.actor.id,
            model: b.model,
          };
          // Row first (synchronous) so concurrent starts see it before any await.
          this.rows("INSERT INTO runs VALUES (?,?,?,?)", id, "queued", now, JSON.stringify(summary));
          try {
            await this.call("deployment-agent-budget", "reserve", { n: 1 });
            await this.call("run:" + id, "init", { id, repo: b.repo, actor: b.actor, goal: b.goal, model: b.model });
          } catch (e) {
            this.rows("DELETE FROM runs WHERE id=?", id);
            throw e;
          }
          this.prune();
          return Response.json({ runId: id, status: "queued" }, { status: 202 });
        }
        case "capacity": {
          const now = Date.now();
          return Response.json({
            active: this.admission().filter((r) => activeRun(r, now)).length,
            limit: AGENT_LIMITS.perRepoConcurrent,
          });
        }
        case "swarm": {
          const tasks = b.tasks as SubTask[];
          check(Array.isArray(tasks) && tasks.length >= 2 && tasks.length <= 4, 422, "Invalid plan");
          const now = Date.now();
          // Atomic: admission and every row are written before the first await.
          admitRun(this.admission(), now, tasks.length);
          const sid = crypto.randomUUID();
          const planned = tasks.map((t, i) => ({
            ...t,
            n: i + 1,
            run: crypto.randomUUID(),
            strand: swarmStrandName(sid, i + 1, t.title),
          }));
          const swarm: SwarmRecord = {
            id: sid,
            goal: b.goal,
            actor: b.actor.id,
            created: now,
            model: b.model,
            tasks: planned,
          };
          for (const t of planned)
            this.rows(
              "INSERT INTO runs VALUES (?,?,?,?)",
              t.run,
              "queued",
              now,
              JSON.stringify({
                id: t.run,
                goal: t.title,
                status: "queued",
                created: now,
                updated: now,
                actor: b.actor.id,
                model: b.model,
                swarm: sid,
                n: t.n,
                title: t.title,
              }),
            );
          this.rows("INSERT INTO swarms VALUES (?,?,?)", sid, now, JSON.stringify(swarm));
          try {
            await this.call("deployment-agent-budget", "reserve", { n: planned.length });
          } catch (e) {
            for (const t of planned) this.rows("DELETE FROM runs WHERE id=?", t.run);
            this.rows("DELETE FROM swarms WHERE id=?", sid);
            throw e;
          }
          for (const t of planned) {
            try {
              await this.call("run:" + t.run, "init", {
                id: t.run,
                repo: b.repo,
                actor: b.actor,
                goal: subGoal(b.goal, t, t.n, planned.length),
                model: b.model,
                strandName: t.strand,
                swarm: { id: sid, n: t.n, title: t.title, files: t.files },
              });
            } catch (e: any) {
              const data = { ...this.summary(t.run), status: "failed", error: e?.message ?? "Could not start" };
              this.rows("UPDATE runs SET status=?, data=? WHERE id=?", "failed", JSON.stringify(data), t.run);
            }
          }
          this.prune();
          for (const old of this.rows("SELECT id FROM swarms ORDER BY created DESC LIMIT -1 OFFSET 10"))
            this.rows("DELETE FROM swarms WHERE id=?", old.id);
          return Response.json({ swarmId: sid, runs: planned.map((t) => t.run) }, { status: 202 });
        }
        case "swarms": {
          const list = (
            b.id
              ? this.rows("SELECT data FROM swarms WHERE id=?", b.id)
              : this.rows("SELECT data FROM swarms ORDER BY created DESC LIMIT 10")
          ).map((r) => JSON.parse(r.data) as SwarmRecord);
          const ids = new Set(list.flatMap((sw) => sw.tasks.map((t) => t.run)));
          return Response.json({
            swarms: list,
            runs: this.summaries().filter((r) => ids.has(r.id)),
          });
        }
        case "list":
          return Response.json(this.summaries().slice(0, 20));
        case "update": {
          const row = this.rows("SELECT data FROM runs WHERE id=?", b.id)[0];
          check(row, 404, "Not found");
          const data = { ...JSON.parse(row.data), ...b.summary };
          this.rows("UPDATE runs SET status=?, data=? WHERE id=?", data.status, JSON.stringify(data), b.id);
          return Response.json({ ok: true });
        }
        case "catch-up-run": {
          check(typeof b.run === "string" && this.rows("SELECT id FROM runs WHERE id=?", b.run).length, 404, "Not found");
          return Response.json(await this.call("run:" + b.run, "catch-up", { proposal: b.proposal }));
        }
        case "get":
        case "cancel": {
          check(typeof b.run === "string" && this.rows("SELECT id FROM runs WHERE id=?", b.run).length, 404, "Not found");
          return Response.json(await this.call("run:" + b.run, "run-" + path, { actor: b.actor }));
        }
        /* ---- run instance ---- */
        case "init": {
          if (this.load()) return Response.json({ ok: true });
          const now = Date.now();
          const r: RunRecord = {
            id: b.id,
            repo: b.repo,
            actor: b.actor,
            goal: b.goal,
            model: b.model,
            status: "queued",
            created: now,
            updated: now,
            deadline: now + AGENT_LIMITS.wallMs,
            requests: 0,
            attempts: 0,
            events: [],
            ...(b.strandName ? { strandName: b.strandName } : {}),
            ...(b.swarm ? { swarm: b.swarm } : {}),
          };
          record(r, b.swarm ? `Queued as part ${b.swarm.n} of a swarm: ${b.swarm.title}` : "Queued");
          this.store(r);
          await this.audit(r, "agent_run_queued");
          await this.ctx.storage.setAlarm(now + 50);
          return Response.json({ ok: true });
        }
        case "catch-up": {
          const r = this.live ?? this.load();
          check(r, 404, "Not found");
          check(!this.work, 409, "This agent is busy");
          check(
            r.status === "proposed" && r.proposal && r.proposal === b.proposal,
            409,
            "This agent is not waiting on that proposal",
          );
          startCatchUp(r, "Another change was braided in first", r.proposal);
          r.deadline = Date.now() + AGENT_LIMITS.catchUpWallMs;
          r.attempts = 0;
          r.kicked = true;
          r.finished = undefined;
          this.store(r);
          await this.ctx.storage.setAlarm(Date.now() + 50);
          return Response.json(publicRun(r));
        }
        case "run-get": {
          const r = this.live ?? this.load();
          check(r, 404, "Not found");
          return Response.json(publicRun(r));
        }
        case "run-cancel": {
          const r = this.live ?? this.load();
          check(r, 404, "Not found");
          if (!terminal(r.status)) {
            r.status = "cancelled";
            r.error = "Cancelled";
            r.finished = Date.now();
            record(r, "Cancelled by " + (b.actor?.name ?? "a writer"));
            this.controller?.abort();
            await this.save(r);
            await this.destroyContainer();
            await this.audit(r, "agent_run_cancelled", b.actor?.id);
          }
          return Response.json(publicRun(r));
        }
      }
      throw new Fault(404, "Not found");
    } catch (e: any) {
      return Response.json(
        { message: e instanceof Fault ? e.message : "Agent runtime unavailable" },
        { status: e instanceof Fault ? e.status : 503 },
      );
    }
  }
  private prune() {
    for (const stale of this.rows("SELECT id FROM runs ORDER BY created DESC LIMIT -1 OFFSET 50"))
      this.rows("DELETE FROM runs WHERE id=?", stale.id);
  }
  private load(): RunRecord | undefined {
    const row = this.rows("SELECT v FROM state WHERE k='run'")[0];
    return row ? JSON.parse(row.v) : undefined;
  }
  private store(r: RunRecord) {
    r.updated = Date.now();
    this.rows(
      "INSERT INTO state VALUES ('run',?) ON CONFLICT(k) DO UPDATE SET v=excluded.v",
      JSON.stringify(r),
    );
  }
  private async save(r: RunRecord) {
    this.store(r);
    try {
      await this.call("repo:" + r.repo.id, "update", {
        id: r.id,
        summary: {
          status: r.status,
          updated: r.updated,
          proposal: r.proposal ?? null,
          task: r.task?.id ?? null,
          base: r.base ?? null,
          candidate: r.candidate ?? null,
          conflicts: r.catchups?.at(-1)?.conflicts ?? false,
          catchups: r.catchups?.length ?? 0,
          error: r.error ?? null,
          last: r.events.at(-1)?.text ?? null,
        },
      });
    } catch {}
  }
  private async audit(r: RunRecord, event: string, actor = r.actor.id) {
    try {
      await new Collaboration(this.env.DB as any).audit(r.repo.id, actor, event, {
        id: r.id,
        model: r.model,
        requests: r.requests,
        proposal: r.proposal ?? null,
        candidate: r.candidate ?? null,
        swarm: r.swarm?.id ?? null,
        catchups: r.catchups?.length ?? 0,
      });
    } catch {}
  }
  private async destroyContainer() {
    try {
      if (this.ctx.container?.running) await this.ctx.container.destroy();
    } catch {}
  }
  async alarm() {
    const r = this.live ?? this.load();
    if (!r || terminal(r.status)) {
      await this.destroyContainer();
      return;
    }
    if (Date.now() > r.deadline) {
      this.controller?.abort();
      r.error =
        r.status === "catching_up"
          ? "Couldn't catch up: time limit reached"
          : "Time limit reached (20 minutes)";
      r.status = "failed";
      r.finished = Date.now();
      record(r, r.error);
      await this.save(r);
      await this.destroyContainer();
      await this.audit(r, "agent_run_failed");
      return;
    }
    // Heartbeat: keeps the object (and its container) active and detects interruptions.
    await this.ctx.storage.setAlarm(Date.now() + 30_000);
    if (this.work) return;
    if (r.status !== "queued" && !r.kicked) {
      r.attempts++;
      if (r.attempts > AGENT_LIMITS.attempts) {
        r.status = "failed";
        r.error = "Interrupted too many times";
        r.finished = Date.now();
        record(r, r.error);
        await this.save(r);
        await this.destroyContainer();
        await this.audit(r, "agent_run_failed");
        return;
      }
      record(r, "Resuming after an interruption");
    }
    r.kicked = false;
    this.live = r;
    this.controller = new AbortController();
    this.work = this.execute(r, this.controller.signal).finally(() => {
      this.work = undefined;
      this.controller = undefined;
      this.live = undefined;
    });
    // Await the work inside the alarm: container exec streams are bound to the
    // invocation that started them, and a waitUntil'd run was killed (exit 137)
    // a few seconds after the alarm handler returned.
    const controller = this.controller;
    const deadline = setTimeout(() => controller.abort(), Math.max(0, r.deadline - Date.now()));
    try {
      await this.work;
    } finally {
      clearTimeout(deadline);
    }
  }
  private async execute(r: RunRecord, signal: AbortSignal) {
    const env = this.env;
    const s = this.services();
    const p: Principal = r.actor;
    const access = async () => {
      check(!signal.aborted, 409, "Agent stopped");
      await this.liveAccess(s, p, r.repo.id, "writer");
      check(!signal.aborted, 409, "Agent stopped");
    };
    const remoteOf = async (physical: string) => {
      const info = (await s.git.info(physical)) as { remote: string; defaultBranch: string };
      return { remote: info.remote, branch: info.defaultBranch };
    };
    let strandPhysical = r.task?.physical ?? "";
    const container = this.ctx.container;
    const exportsAny = (this.ctx as any).exports;
    // The gate also lets this run read (never write) the canonical repository, so a
    // stale proposal can be rebased onto the latest commit.
    const canonicalInfo = (await s.git.info(r.repo.physical)) as { remote: string; defaultBranch: string };
    const canonical = {
      physical: r.repo.physical,
      path: new URL(canonicalInfo.remote).pathname.replace(/\/$/, ""),
    };
    const gitGate = (write: boolean) =>
      exportsAny.AgentGitGate({ props: { physical: strandPhysical, write, canonical } });
    let host = "";
    const workspace: Workspace = {
      prepare: async (remote, branch) => {
        check(container, 503, "Containers are not available on this server");
        await this.destroyContainer();
        host = new URL(remote).host;
        container.start({
          image: IMAGE,
          // The managed image's default command is the node REPL, which exits at once
          // without stdin; the container then stops and kills every exec (exit 137).
          entrypoint: ["sleep", "infinity"],
          enableInternet: false,
          instance: "standard-1",
          env: { GIT_TERMINAL_PROMPT: "0", DEBIAN_FRONTEND: "noninteractive" },
        });
        await container.interceptOutboundHttp(APT_HOST, exportsAny.AgentAptGate({ props: { open: true } }));
        await container.interceptOutboundHttps(host, gitGate(false));
        this.ctx.waitUntil(container.monitor().catch(() => {}));
        try {
          await container.setInactivityTimeout(5 * 60_000);
        } catch {}
        const exec = containerExec(container);
        let ready = false;
        for (let i = 0; i < 90 && !ready; i++) {
          try {
            ready = (await exec(["true"], { timeoutMs: 10_000 })).exitCode === 0;
          } catch {}
          if (!ready) await sleep(1000);
          check(!signal.aborted, 409, "Agent stopped");
        }
        check(ready, 503, "The container did not start");
        const run = async (cmd: string[], what: string, timeoutMs = AGENT_LIMITS.commandMs) => {
          const out = await exec(cmd, { timeoutMs, combined: true });
          check(
            out.exitCode === 0,
            502,
            `${what} failed (exit ${out.exitCode})${out.timedOut ? " (timed out)" : ""}: ` +
              (new TextDecoder().decode(out.stdout).trim().split("\n").slice(-3).join(" ") +
                " | " +
                new TextDecoder().decode(out.stderr).trim().split("\n").slice(-3).join(" ")).slice(0, 600),
          );
        };
        // A freshly started container can restart once within its first seconds,
        // killing any process running then (exit 137). Wait until a short command
        // survives twice in a row before doing real work.
        for (let stable = 0, i = 0; stable < 2; i++) {
          check(i < 20, 503, "The container did not settle");
          const out = await exec(["sleep", "3"], { timeoutMs: 15_000 });
          stable = out.exitCode === 0 ? stable + 1 : 0;
        }
        await run(
          [
            "sh",
            "-c",
            "apt-get update -q 2>&1 | tail -n 2; apt-get install -y -q --no-install-recommends git ca-certificates 2>&1 | tail -n 2; command -v git",
          ],
          "Installing git",
          AGENT_LIMITS.setupMs,
        );
        await container.interceptOutboundHttp(APT_HOST, exportsAny.AgentAptGate({ props: { open: false } }));
        await run(["sh", "-c", `for i in $(seq 1 30); do [ -f ${CA_FILE} ] && exit 0; sleep 1; done; exit 1`], "Waiting for the gate certificate");
        for (const [k, v] of [
          ["http.sslCAInfo", CA_FILE],
          ["user.name", AGENT_AUTHOR.name],
          ["user.email", AGENT_AUTHOR.email],
          ["init.defaultBranch", branch],
          ["safe.directory", "*"],
          ["credential.helper", ""],
        ])
          await run(["git", "config", "--global", k, v], "Configuring git");
        await run(["mkdir", "-p", "/work"], "Preparing the workspace");
        await run(["git", "clone", "-q", "--branch", branch, remote, WORKDIR], "Cloning the strand");
        return exec as Exec;
      },
      allowPush: async (allowed) => {
        if (container?.running && host) await container.interceptOutboundHttps(host, gitGate(allowed));
      },
      destroy: () => this.destroyContainer(),
    };
    const piLoop = async (
      execEnv: any,
      dir: string,
      goal: string,
      turns: number,
      count: () => void,
    ) => {
      const storage = await JsonlStorage.open(dir, journalFiles(this.ctx.storage.sql, dir), BACKGROUND_CONTEXT, {
        fsync: true,
      });
      const work = AbortSignal.any([
        signal,
        AbortSignal.timeout(Math.max(0, Math.min(AGENT_LIMITS.workMs, r.deadline - Date.now() - 3 * 60_000))),
      ]);
      return agentLoop({
        storage,
        env: execEnv,
        goal,
        model: r.model,
        signal: work,
        turns,
        log: (t) => record(r, t),
        before: async () => {
          await access();
          count();
          await this.save(r);
        },
        infer: async (input, sig) => {
          check(!sig.aborted, 409, "Agent stopped");
          return Promise.race([
            env.AI.run(r.model as any, input),
            new Promise((_, reject) =>
              sig.addEventListener("abort", () => reject(Error("Agent stopped")), { once: true }),
            ),
          ]);
        },
      });
    };
    try {
      await runAgent(r, {
        signal,
        access,
        save: () => this.save(r),
        strand: async () => {
          const canonical = await authorize(s, p, r.repo.id, "writer");
          const task = await createTask(s, p, canonical, { name: r.strandName ?? "agent-" + r.id.slice(0, 8) });
          check(task.state === "ready", 409, "The strand is still being created; start a new run shortly");
          strandPhysical = task.physical;
          const { remote, branch } = await remoteOf(task.physical);
          return { task, remote, branch, base: (await head(s, task)).sha };
        },
        remote: (t) => {
          strandPhysical = t.physical;
          return remoteOf(t.physical);
        },
        workspace,
        loop: (execEnv) => piLoop(execEnv, `/${r.id}/a${r.attempts}`, r.goal, AGENT_LIMITS.requests, () => {
          check(r.requests < AGENT_LIMITS.requests, 429, `Model request budget reached (${AGENT_LIMITS.requests})`);
          r.requests++;
          record(r, `Thinking (model request ${r.requests} of ${AGENT_LIMITS.requests})`);
        }),
        canonical: async () => ({ remote: canonicalInfo.remote, branch: canonicalInfo.defaultBranch }),
        resolve: (execEnv, files, round) => {
          const c = r.catchup!;
          return piLoop(execEnv, `/${r.id}/c${c.n}r${round}`, resolveGoal(r, files), AGENT_LIMITS.resolveRequests, () => {
            check(
              c.requests < AGENT_LIMITS.resolveRequests,
              429,
              `Conflict resolution budget reached (${AGENT_LIMITS.resolveRequests} model requests)`,
            );
            c.requests++;
            r.requests++;
            record(r, `Resolving conflicts (model request ${c.requests} of ${AGENT_LIMITS.resolveRequests})`);
          });
        },
        supersede: async (from, to, note) => {
          await s.catalog.supersede(r.repo.id, from);
          await s.collaboration!.review(r.repo.id, from, p, `${note} New proposal: ${to}.`);
        },
        propose: async (task, base, candidate) => {
          const canonical = await s.catalog.get(r.repo.id);
          check(canonical, 404, "Repository unavailable");
          return openProposal(s, p, canonical, { task, base, candidate });
        },
        discard: async (task) => {
          const strand = await s.catalog.get(task.id);
          if (!strand || strand.parent !== r.repo.id) return;
          await s.catalog.remove(task.id);
          await s.git.remove(task.physical).catch(() => {});
        },
      });
    } finally {
      await this.audit(r, "agent_run_" + r.status);
      if (terminal(r.status)) await this.ctx.storage.deleteAlarm();
    }
  }
}
