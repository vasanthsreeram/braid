import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { localServices } from "../scripts/local.ts";
import { application } from "../src/app.ts";
import {
  AGENT_LIMITS,
  WORKDIR,
  admitRun,
  agentGoal,
  agentLoop,
  agentModel,
  containerEnv,
  publicRun,
  runAgent,
  type Exec,
  type RunRecord,
} from "../src/agents.ts";
import { Fault } from "../src/storage.ts";
import { journalFiles } from "../src/pi-storage.ts";
import { JsonlStorage } from "@earendil-works/pi-durable/storage/jsonl";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";

async function harness() {
  const dir = await mkdtemp(join(tmpdir(), "agents-"));
  const l = await localServices(dir);
  const actors = {
    owner: l.token,
    writer: "agents-writer-credential",
    reader: "agents-reader-credential",
    outsider: "agents-outsider-credential",
    other: "agents-other-tenant-credential",
  };
  for (const name of ["writer", "reader", "outsider", "other"])
    l.credentials.set(actors[name as keyof typeof actors], {
      id: name,
      name: "Test " + name,
      tenant: name === "other" ? "other-tenant" : l.principal.tenant,
      email: name + "@example.invalid",
      emailVerified: true,
    });
  const call = (
    actor: keyof typeof actors | null,
    path: string,
    body?: any,
  ) =>
    application(l.s)(
      new Request(l.s.origin + path, {
        method: body ? "POST" : "GET",
        headers: actor ? { authorization: "Bearer " + actors[actor] } : {},
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  const repo = (await (
    await call("owner", "/api/repos", { name: "agents-private" })
  ).json()) as any;
  for (const actor of ["writer", "reader"] as const)
    await call("owner", `/api/repos/${repo.id}/grants`, { user: actor, role: actor });
  const calls: any[] = [];
  const runs = {
    start: async (r: any, p: any, goal: string) => {
      calls.push({ op: "start", repo: r.id, actor: p.id, goal });
      return { runId: "run-1", status: "queued" };
    },
    list: async (r: any) => {
      calls.push({ op: "list", repo: r.id });
      return [{ id: "run-1", status: "working" }];
    },
    get: async (r: any, run: string) => {
      calls.push({ op: "get", repo: r.id, run });
      return { id: run, status: "working" };
    },
    cancel: async (r: any, run: string, p: any) => {
      calls.push({ op: "cancel", repo: r.id, run, actor: p.id });
      return { id: run, status: "cancelled" };
    },
  };
  return {
    ...l,
    repo,
    call,
    calls,
    runs,
    prefix: `/api/repos/${repo.id}/agent-runs`,
    close: async () => {
      l.db.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}

test("agent runs API: ACL per role, validation, strands excluded, runtime absent", async () => {
  const h = await harness();
  try {
    // Without the runtime the endpoint says so, but only to someone who can read.
    assert.equal((await h.call("owner", h.prefix)).status, 503);
    assert.equal((await h.call("outsider", h.prefix)).status, 404);
    h.s.runs = h.runs;
    for (const actor of [null, "outsider", "other"] as const) {
      assert.equal((await h.call(actor, h.prefix)).status, 404, String(actor));
      // Anonymous writes stop at the Origin gate (403); signed-in strangers see 404.
      const denied = actor ? [404] : [403, 404];
      assert.ok(
        denied.includes((await h.call(actor, h.prefix, { goal: "Fix the README" })).status),
      );
      assert.equal((await h.call(actor, h.prefix + "/run-1")).status, 404);
      assert.ok(
        denied.includes((await h.call(actor, h.prefix + "/run-1/cancel", {})).status),
      );
    }
    // Readers may watch, never start or cancel.
    assert.equal((await h.call("reader", h.prefix)).status, 200);
    assert.equal((await h.call("reader", h.prefix + "/run-1")).status, 200);
    assert.equal(
      (await h.call("reader", h.prefix, { goal: "Fix the README" })).status,
      404,
    );
    assert.equal((await h.call("reader", h.prefix + "/run-1/cancel", {})).status, 404);
    assert.ok(!h.calls.some((c) => c.op === "start" || c.op === "cancel"));
    // Validation happens before the runtime is called.
    for (const body of [
      {},
      { goal: 7 },
      { goal: "  " },
      { goal: "x".repeat(AGENT_LIMITS.goalChars + 1) },
      { goal: "bad\u0007bell" },
    ])
      assert.equal((await h.call("writer", h.prefix, body)).status, 422);
    assert.ok(!h.calls.some((c) => c.op === "start"));
    const started = await h.call("writer", h.prefix, { goal: "  Fix the README typo \r\n" });
    assert.equal(started.status, 202);
    assert.deepEqual(await started.json(), { runId: "run-1", status: "queued" });
    assert.deepEqual(h.calls.find((c) => c.op === "start"), {
      op: "start",
      repo: h.repo.id,
      actor: "writer",
      goal: "Fix the README typo",
    });
    assert.equal((await h.call("writer", h.prefix + "/run-1/cancel", {})).status, 200);
    assert.equal(h.calls.find((c) => c.op === "cancel").actor, "writer");
    // Malformed run ids and unknown sub-actions are not routed to the runtime.
    assert.equal((await h.call("writer", h.prefix + "/bad%21id")).status, 404);
    assert.equal((await h.call("writer", h.prefix + "/run-1/other", {})).status, 404);
    // Agents run on the original repository, never on a strand.
    const task = (await (
      await h.call("owner", `/api/repos/${h.repo.id}/tasks`, { name: "strand" })
    ).json()) as any;
    assert.equal(
      (await h.call("owner", `/api/repos/${task.id}/agent-runs`, { goal: "Fix it" })).status,
      400,
    );
    // Revoking the grant removes access immediately.
    await h.call("owner", `/api/repos/${h.repo.id}/grants`, { user: "writer", role: null });
    assert.equal((await h.call("writer", h.prefix)).status, 404);
    assert.equal((await h.call("writer", h.prefix, { goal: "Fix the README" })).status, 404);
    // Public visibility never exposes runs anonymously.
    h.s.allowPublic = true;
    await h.catalog.visibility(h.repo.id, "public");
    assert.equal((await h.call(null, h.prefix)).status, 404);
    assert.equal((await h.call(null, h.prefix + "/run-1")).status, 404);
  } finally {
    await h.close();
  }
});

test("agent run admission: one active run per repository and a daily cap", () => {
  const now = Date.now();
  admitRun([], now);
  const fault = (fn: () => void, status: number) =>
    assert.throws(fn, (e: any) => e instanceof Fault && e.status === status);
  for (const status of ["queued", "setting_up", "working", "pushing"])
    fault(() => admitRun([{ status, created: now - 1000 }], now), 409);
  // A run that outlived the wall budget plus slack no longer blocks (crashed object).
  admitRun([{ status: "working", created: now - AGENT_LIMITS.wallMs - 6 * 60_000 }], now);
  admitRun([{ status: "proposed", created: now - 1000 }], now);
  const day = Array.from({ length: AGENT_LIMITS.perRepoDaily }, (_, i) => ({
    status: "failed",
    created: now - 1000 * (i + 1),
  }));
  fault(() => admitRun(day, now), 429);
  admitRun(day.map((r) => ({ ...r, created: now - 86_400_001 })), now);
  admitRun(day.slice(1), now);
});

test("agent goal/model validation and public projection never expose the session", () => {
  assert.equal(agentGoal({ goal: " a\r\nb " }), "a\nb");
  assert.throws(() => agentGoal(null));
  assert.equal(agentModel(undefined), "@cf/openai/gpt-oss-120b");
  assert.equal(agentModel("https://evil.example"), "@cf/openai/gpt-oss-120b");
  assert.equal(agentModel("@cf/meta/llama-4-scout"), "@cf/meta/llama-4-scout");
  const r = baseRecord();
  const pub = publicRun(r) as any;
  assert.equal(pub.actor, "writer");
  assert.equal(pub.repo, "repo-1");
  assert.ok(!JSON.stringify(pub).includes("session-secret"));
});

/* ---------- engine with container / model / app doubles ---------- */

function baseRecord(): RunRecord {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    repo: {
      id: "repo-1",
      tenant: "t",
      owner: "o",
      name: "r",
      physical: "p",
      visibility: "private",
      state: "ready",
      parent: null,
    },
    actor: { id: "writer", tenant: "t", session: "session-secret" },
    goal: "Fix the README typo",
    model: "@cf/openai/gpt-oss-120b",
    status: "queued",
    created: Date.now(),
    updated: Date.now(),
    deadline: Date.now() + AGENT_LIMITS.wallMs,
    requests: 0,
    attempts: 0,
    events: [],
  };
}
const BASE = "a".repeat(40);
const CAND = "b".repeat(40);
function engine(
  r: RunRecord,
  over: Partial<Parameters<typeof runAgent>[1]> & { ws?: any } = {},
) {
  const ws = over.ws ?? fakeWorkspaceWithExec();
  const proposals: any[] = [];
  const controller = new AbortController();
  let saves = 0;
  const deps = {
    signal: controller.signal,
    access: async () => {},
    save: async () => {
      saves++;
    },
    strand: async () => ({
      task: { ...r.repo, id: "task-1", physical: "task-phys", name: "agent-00000000", parent: r.repo.id },
      remote: "https://acct.artifacts.cloudflare.net/git/ns/task-phys.git",
      branch: "main",
      base: BASE,
    }),
    remote: async () => ({ remote: "https://acct.artifacts.cloudflare.net/git/ns/task-phys.git", branch: "main" }),
    workspace: ws.workspace,
    loop: async () => {
      ws.makeDirty();
      return { completed: true, summary: "Fixed the typo." };
    },
    propose: async (task: string, base: string, candidate: string) => {
      proposals.push({ task, base, candidate });
      return { id: "proposal-1" };
    },
    ...over,
  };
  return { deps, ws, proposals, controller, saves: () => saves };
}
function fakeWorkspaceWithExec(opts: { dirty?: boolean } = {}) {
  const enc = (s: string) => new TextEncoder().encode(s);
  const state = { head: BASE, dirty: !!opts.dirty, push: false };
  const ws: any = { log: [] as string[], prepared: 0, destroyed: 0, pushes: 0 };
  const exec: Exec = async (cmd) => {
    const c = cmd.join(" ");
    ws.log.push(c);
    const out = (s: string, exitCode = 0) => ({ exitCode, stdout: enc(s), stderr: new Uint8Array() });
    if (c === "git rev-parse HEAD") return out(state.head + "\n");
    if (c === "git status --porcelain") return out(state.dirty ? " M README.md\n" : "");
    if (c === "git add -A") return out("");
    if (cmd[0] === "git" && cmd.includes("commit")) {
      assert.ok(c.includes("user.name=Braid agent"));
      assert.ok(c.includes("user.email=agent@braid.invalid"));
      state.head = CAND;
      state.dirty = false;
      return out("");
    }
    if (cmd[0] === "git" && cmd[1] === "push") {
      assert.ok(state.push, "push only inside the push window");
      assert.equal(cmd.at(-1), "HEAD:refs/heads/main");
      ws.pushes++;
      return out("");
    }
    return out("unexpected", 1);
  };
  ws.makeDirty = () => {
    state.dirty = true;
  };
  ws.workspace = {
    prepare: async () => {
      ws.prepared++;
      return exec;
    },
    allowPush: async (b: boolean) => {
      state.push = b;
    },
    destroy: async () => {
      ws.destroyed++;
    },
  };
  return ws;
}

test("engine: strand → container → loop → commit → gated push → proposal", async () => {
  const r = baseRecord();
  const e = engine(r);
  await runAgent(r, e.deps as any);
  assert.equal(r.status, "proposed", r.error ?? "");
  assert.equal(r.task?.id, "task-1");
  assert.equal(r.base, BASE);
  assert.equal(r.candidate, CAND);
  assert.equal(r.proposal, "proposal-1");
  assert.equal(r.summary, "Fixed the typo.");
  assert.deepEqual(e.proposals, [{ task: "task-1", base: BASE, candidate: CAND }]);
  assert.equal(e.ws.pushes, 1);
  assert.ok(e.ws.destroyed >= 1, "container destroyed");
  assert.ok(r.events.length > 0 && r.events.length <= AGENT_LIMITS.events);
  assert.ok(r.finished);
});

test("engine: no changes fails clearly; ACL loss and cancellation stop the run", async () => {
  {
    const r = baseRecord();
    const e = engine(r, { loop: async () => ({ completed: true, summary: "Nothing to do." }) });
    await runAgent(r, e.deps as any);
    assert.equal(r.status, "failed");
    assert.match(r.error!, /without changing any files/);
    assert.equal(e.proposals.length, 0);
    assert.equal(e.ws.pushes, 0);
  }
  {
    const r = baseRecord();
    let n = 0;
    const e = engine(r, {
      access: async () => {
        if (++n > 1) throw new Fault(404, "Not found");
      },
    });
    await runAgent(r, e.deps as any);
    assert.equal(r.status, "failed");
    assert.equal(r.error, "Not found");
    assert.equal(e.ws.pushes, 0, "no push after access was lost");
    assert.equal(e.proposals.length, 0);
  }
  {
    const r = baseRecord();
    const e: any = engine(r);
    e.deps.loop = async () => {
      r.status = "cancelled";
      e.controller.abort();
      return { completed: false, summary: "", stopped: "Agent stopped" };
    };
    await runAgent(r, e.deps);
    assert.equal(r.status, "cancelled");
    assert.equal(e.ws.pushes, 0);
    assert.equal(e.proposals.length, 0);
    assert.ok(e.ws.destroyed >= 1);
  }
});

test("engine: budget-stopped loop with edits still proposes; resume never re-pushes or re-proposes", async () => {
  {
    const r = baseRecord();
    const e: any = engine(r);
    e.deps.loop = async () => {
      e.ws.makeDirty();
      return { completed: false, summary: "", stopped: "Model request budget reached (15)" };
    };
    await runAgent(r, e.deps);
    assert.equal(r.status, "proposed");
    assert.ok(r.events.some((x) => /budget reached/.test(x.text)));
  }
  {
    // Interrupted after the push: the resumed attempt only opens the proposal.
    const r = { ...baseRecord(), task: { id: "task-1", physical: "task-phys", name: "agent-x" }, base: BASE, candidate: CAND, status: "pushing" as const, attempts: 1 };
    const e = engine(r, {
      strand: async () => assert.fail("strand must not be recreated"),
    });
    await runAgent(r, e.deps as any);
    assert.equal(r.status, "proposed");
    assert.equal(e.ws.prepared, 0, "no container for a pushed candidate");
    assert.deepEqual(e.proposals, [{ task: "task-1", base: BASE, candidate: CAND }]);
  }
  {
    // Interrupted while working: strand reused, container prepared again.
    const r = { ...baseRecord(), task: { id: "task-1", physical: "task-phys", name: "agent-x" }, base: BASE, status: "working" as const, attempts: 1 };
    const e = engine(r, { strand: async () => assert.fail("strand must not be recreated") });
    await runAgent(r, e.deps as any);
    assert.equal(r.status, "proposed");
    assert.equal(e.ws.prepared, 1);
  }
  {
    // Already proposed: nothing repeats.
    const r = { ...baseRecord(), task: { id: "task-1", physical: "task-phys", name: "agent-x" }, base: BASE, candidate: CAND, proposal: "proposal-0" };
    const e = engine(r);
    await runAgent(r, e.deps as any);
    assert.equal(r.proposal, "proposal-0");
    assert.equal(e.proposals.length, 0);
  }
});

/* ---------- Pi coding loop over the container ExecutionEnv ---------- */

/** In-memory container filesystem behind the same exec protocol the real adapter uses. */
function memoryContainer() {
  const files = new Map<string, Uint8Array>();
  const commands: string[] = [];
  const enc = (s: string) => new TextEncoder().encode(s);
  const exec: Exec = async (cmd, o = {}) => {
    const ok = (s: string | Uint8Array = "") => ({
      exitCode: 0,
      stdout: typeof s === "string" ? enc(s) : s,
      stderr: new Uint8Array(),
    });
    const no = () => ({ exitCode: 1, stdout: new Uint8Array(), stderr: enc("No such file or directory") });
    const path = cmd.at(-1)!;
    if (cmd[0] === "stat" && cmd[2] === "%s") return files.has(path) ? ok(String(files.get(path)!.length)) : no();
    if (cmd[0] === "stat") return files.has(path) ? ok(`regular file|${files.get(path)!.length}|0|${path}`) : no();
    if (cmd[0] === "cat") return files.has(path) ? ok(files.get(path)!) : no();
    if (cmd[0] === "test") return files.has(path) ? ok() : no();
    if (cmd[0] === "realpath") return ok(path + "\n");
    if (cmd[0] === "sh" && cmd[2].includes("cat >")) {
      files.set(path, o.stdin ?? new Uint8Array());
      return ok();
    }
    if (cmd[0] === "bash") {
      commands.push(cmd[2]);
      if (cmd[2] === "sleep 999") return { exitCode: 124, stdout: new Uint8Array(), stderr: new Uint8Array(), timedOut: true };
      return ok("ran: " + cmd[2] + "\n");
    }
    return no();
  };
  return { files, commands, exec };
}
function facade(db: DatabaseSync) {
  return {
    exec(q: string, ...p: any[]) {
      const s = db.prepare(q);
      if (q.trim().startsWith("SELECT")) return { toArray: () => s.all(...p) };
      s.run(...p);
      return { toArray: () => [] };
    },
  };
}

test("container ExecutionEnv: confined paths, file round trip, bounded commands", async () => {
  const c = memoryContainer();
  const events: string[] = [];
  const env = containerEnv(c.exec, "container:test", (t) => events.push(t));
  const ctx = BACKGROUND_CONTEXT;
  assert.deepEqual(await env.absolutePath("src/a.ts", ctx), { ok: true, value: WORKDIR + "/src/a.ts" });
  for (const p of ["../../etc/passwd", "/etc/cloudflare/certs/x", "/work/other"])
    assert.equal((await env.absolutePath(p, ctx)).ok, false, p);
  assert.equal((await env.writeFile("notes.md", "hello", ctx)).ok, true);
  assert.deepEqual(await env.readTextFile(WORKDIR + "/notes.md", ctx), { ok: true, value: "hello" });
  const missing = await env.readTextFile("absent.md", ctx);
  assert.equal(missing.ok, false);
  assert.equal((missing as any).error.code, "not_found");
  assert.equal((await env.writeFile("/root/.ssh/x", "no", ctx)).ok, false);
  const ran = await env.exec("echo hi", { onOutput: (t) => events.push("out:" + t) }, ctx);
  assert.deepEqual(ran, { ok: true, value: { exitCode: 0 } });
  const slow = await env.exec("sleep 999", { timeout: 9999 }, ctx);
  assert.equal(slow.ok, false);
  assert.equal((slow as any).error.code, "timeout");
  assert.ok(events.includes("Wrote notes.md"));
  assert.ok(events.some((e) => e.startsWith("Ran: echo hi")));
});

test("Pi coding loop: Workers AI tool calls drive CodingTools in the container; budget stops the loop", async () => {
  const dir = await mkdtemp(join(tmpdir(), "agent-loop-"));
  const db = new DatabaseSync(join(dir, "pi.sqlite"));
  try {
    const c = memoryContainer();
    c.files.set(WORKDIR + "/README.md", new TextEncoder().encode("Instal it\n"));
    const env = containerEnv(c.exec, "container:loop");
    const script = [
      { tool_calls: [{ id: "c1", type: "function", function: { name: "read", arguments: JSON.stringify({ path: "README.md" }) } }] },
      { tool_calls: [{ id: "c2", type: "function", function: { name: "edit", arguments: JSON.stringify({ path: "README.md", edits: [{ oldText: "Instal it", newText: "Install it" }] }) } }] },
      { tool_calls: [{ id: "c3", type: "function", function: { name: "bash", arguments: JSON.stringify({ command: "cat README.md" }) } }] },
      { content: "Fixed the README typo." },
    ];
    const inputs: any[] = [];
    let requests = 0;
    const open = (name: string) =>
      JsonlStorage.open("/" + name, journalFiles(facade(db), "/" + name), BACKGROUND_CONTEXT, { fsync: true });
    const result = await agentLoop({
      storage: await open("run-a"),
      env,
      goal: "Fix the README typo",
      model: "@cf/openai/gpt-oss-120b",
      signal: new AbortController().signal,
      log: () => {},
      before: async () => {
        if (++requests > AGENT_LIMITS.requests) throw new Fault(429, "Model request budget reached (15)");
      },
      infer: async (input) => {
        inputs.push(input);
        const step = script[inputs.length - 1];
        return { choices: [{ message: { content: step.content ?? null, tool_calls: step.tool_calls } }], usage: {} };
      },
    });
    assert.equal(result.completed, true);
    assert.equal(result.summary, "Fixed the README typo.");
    assert.equal(new TextDecoder().decode(c.files.get(WORKDIR + "/README.md")), "Install it\n");
    assert.deepEqual(c.commands, ["cat README.md"]);
    assert.deepEqual(
      inputs[0].tools.map((t: any) => t.function.name).sort(),
      ["bash", "edit", "read", "write"],
    );
    assert.match(inputs[0].messages[0].content, /own strand/);
    assert.equal(inputs[0].max_tokens, AGENT_LIMITS.outputTokens);
    // A model that never stops is cut off by the request budget.
    let n = 0;
    const loop = await agentLoop({
      storage: await open("run-b"),
      env,
      goal: "Loop forever",
      model: "@cf/openai/gpt-oss-120b",
      signal: new AbortController().signal,
      log: () => {},
      before: async () => {
        if (++n > 3) throw new Fault(429, "Model request budget reached (3)");
      },
      infer: async () => ({
        choices: [{ message: { content: null, tool_calls: [{ id: "x" + n, type: "function", function: { name: "bash", arguments: '{"command":"true"}' } }] } }],
      }),
    });
    assert.equal(loop.completed, false);
    assert.equal(loop.stopped, "Model request budget reached (3)");
    assert.equal(n, 4);
  } finally {
    db.close();
    await rm(dir, { recursive: true, force: true });
  }
});
