import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localServices, git, cleanEnv } from "../scripts/local.ts";
import { application, openProposal } from "../src/app.ts";
import {
  AGENT_LIMITS,
  WORKDIR,
  admitRun,
  runAgent,
  startCatchUp,
  type Exec,
  type RunRecord,
} from "../src/agents.ts";
import {
  SWARM,
  parsePlan,
  planSwarm,
  plannerInput,
  subGoal,
  swarmRequest,
  swarmStrandName,
  swarmView,
} from "../src/swarm.ts";
import { Fault, ID } from "../src/storage.ts";

const fault = (fn: () => unknown, status: number, re?: RegExp) =>
  assert.throws(fn, (e: any) => e instanceof Fault && e.status === status && (!re || re.test(e.message)));

/* ---------------- concurrency ---------------- */

test("admission: up to 6 concurrent runs per repository, checked for a whole swarm at once", () => {
  const now = Date.now();
  const active = (n: number) => Array.from({ length: n }, () => ({ status: "working", created: now - 1000 }));
  const L = AGENT_LIMITS.perRepoConcurrent;
  assert.equal(L, 6);
  admitRun(active(L - 1), now);
  fault(() => admitRun(active(L), now), 409, /6 agents are already working/);
  // A swarm of L needs L free slots; with one busy only L-1 remain.
  admitRun([], now, L);
  fault(() => admitRun(active(1), now, L), 409, /Only 5 of 6 agent slots/);
  // Catching up counts as active; a long-dead run (no update past the wall budget) does not.
  fault(() => admitRun([...active(L - 1), { status: "catching_up", created: now - 1000 }], now), 409);
  admitRun(
    [...active(L - 1), { status: "working", created: now - 3_600_000, updated: now - AGENT_LIMITS.wallMs - 6 * 60_000 }],
    now,
  );
  // A run that started yesterday but is active again (catching up) still counts.
  fault(
    () => admitRun([...active(L - 1), { status: "catching_up", created: now - 3_600_000, updated: now - 1000 }], now),
    409,
  );
  // Daily cap includes the whole swarm.
  const day = Array.from({ length: AGENT_LIMITS.perRepoDaily - 2 }, () => ({ status: "proposed", created: now - 5000 }));
  admitRun(day, now, 2);
  fault(() => admitRun(day, now, 3), 429);
});

/* ---------------- planner ---------------- */

const plan = (tasks: any[]) => JSON.stringify({ tasks });
const T = (title: string, files?: string[]) => ({
  title,
  goal: `Write the ${title} section clearly and briefly.`,
  ...(files ? { files } : {}),
});

test("planner: strict JSON validation, no fallback split", () => {
  const ok = parsePlan(plan([T("Install guide", ["docs/install.md"]), T("Usage guide", ["./docs/usage.md"])]), 2);
  assert.deepEqual(ok.map((t) => t.files), [["docs/install.md"], ["docs/usage.md"]]);
  // Fenced output and surrounding prose are tolerated; the JSON itself must be valid.
  assert.equal(parsePlan("Here:\n```json\n" + plan([T("A part"), T("B part")]) + "\n```", 2).length, 2);
  for (const [text, why] of [
    ["", /empty/],
    ["Sure! I would split it into two parts.", /not JSON/],
    ["{tasks: [}", /not valid JSON/],
    [JSON.stringify({ steps: [] }), /no "tasks"/],
    [plan([T("Only one")]), /1 sub-tasks instead of 2/],
    [plan([T("Same"), T("same")]), /both called/],
    [plan([{ title: "x", goal: "too short title" }, T("Fine title")]), /title of 3/],
    [plan([{ title: "Short goal", goal: "no" }, T("Fine title")]), /goal of 10/],
    [plan([T("Escape", ["../etc/passwd"]), T("Other")]), /safe relative path/],
    [plan([T("Absolute", ["/etc/hosts"]), T("Other")]), /safe relative path/],
    [plan([T("Git dir", [".git/config"]), T("Other")]), /safe relative path/],
    [plan([T("One", ["README.md"]), T("Two", ["README.md"])]), /both change README.md/],
    [plan([T("Dir", ["docs/"]), T("File", ["docs/a.md"])]), /both change docs\//],
    [plan([T("Many", Array.from({ length: SWARM.files + 1 }, (_, i) => `f${i}.md`)), T("Other")]), /lists files/],
  ] as [string, RegExp][])
    fault(() => parsePlan(text, 2), 502, why);
});

test("planner: one model request with the goal and file listing; model failure is a clear error", async () => {
  const inputs: any[] = [];
  const tasks = await planSwarm({
    goal: "Write three guides",
    agents: 3,
    paths: ["README.md", "docs/"],
    infer: async (input) => {
      inputs.push(input);
      return { choices: [{ message: { content: plan([T("Install", ["docs/install.md"]), T("Models", ["docs/models.md"]), T("Help", ["docs/help.md"])]) } }] };
    },
  });
  assert.equal(inputs.length, 1);
  assert.match(inputs[0].messages[0].content, /exactly 3 independent sub-tasks/);
  assert.match(inputs[0].messages[1].content, /README\.md\ndocs\//);
  assert.equal(tasks.length, 3);
  // Workers AI "response" shape is accepted too.
  assert.equal((await planSwarm({ goal: "g", agents: 2, paths: [], infer: async () => ({ response: plan([T("A one"), T("B two")]) }) })).length, 2);
  await assert.rejects(
    planSwarm({ goal: "g", agents: 2, paths: [], infer: async () => { throw Error("network"); } }),
    (e: any) => e.status === 502 && /didn't answer/.test(e.message),
  );
  await assert.rejects(
    planSwarm({ goal: "g", agents: 2, paths: [], infer: async () => ({ response: "I can't help" }) }),
    (e: any) => e.status === 502 && /usable plan/.test(e.message),
  );
  assert.equal(plannerInput("g", 2, Array.from({ length: 500 }, (_, i) => "f" + i)).messages[1].content.split("\n").length < 210, true);
});

test("swarm naming, sub-goal and request validation", () => {
  const sid = "1234abcd-0000-4000-8000-000000000000";
  const name = swarmStrandName(sid, 2, "Add a Troubleshooting guide!");
  assert.equal(name, "swarm-1234abcd-2-add-a-troubleshooting-guide");
  assert.ok(ID.test(name));
  assert.ok(ID.test(swarmStrandName(sid, 3, "x".repeat(200))));
  const goal = subGoal("Write guides", { title: "Install", goal: "Write docs/install.md", files: ["docs/install.md"] }, 1, 3);
  assert.match(goal, /agent 1 of 3/);
  assert.match(goal, /Do not change any other file/);
  assert.deepEqual(swarmRequest({ agents: 2 }), { agents: 2, autoBraid: false });
  assert.deepEqual(swarmRequest({}), { agents: 3, autoBraid: false });
  assert.deepEqual(swarmRequest({ agents: 6, autoBraid: true }), { agents: 6, autoBraid: true });
  for (const agents of [1, 7, 2.5, "3"]) fault(() => swarmRequest({ agents }), 422);
  fault(() => swarmRequest({ agents: 2, autoBraid: "yes" }), 422);
});

test("swarm view: plain status per sub-task", () => {
  const swarm = {
    id: "s",
    goal: "g",
    actor: "writer",
    created: 1,
    model: "m",
    tasks: ["w", "c", "p", "a", "b", "f"].map((run, i) => ({ n: i + 1, run, strand: "x", title: run, goal: "goal text", files: [] })),
  };
  const runs = new Map<string, any>([
    ["w", { status: "working" }],
    ["c", { status: "catching_up", proposal: "P1" }],
    ["p", { status: "proposed", proposal: "P1" }],
    ["a", { status: "proposed", proposal: "P2" }],
    ["b", { status: "proposed", proposal: "P3" }],
    ["f", { status: "failed", error: "boom" }],
  ]);
  const prop = (id: string, status: any, candidate = id) => [id, { id, status, candidate, base: "", task: "", repo: "", author: "" }] as const;
  const view = swarmView(
    swarm,
    runs,
    new Map([prop("P1", "open"), prop("P2", "approved"), prop("P3", "approved")]),
    (p) => p.id === "P3",
  );
  assert.deepEqual(view.tasks.map((t) => t.status), ["working", "catching_up", "proposed", "approved", "braided", "failed"]);
  assert.equal(view.status, "active");
});

/* ---------------- API: ACL, 401, validation, catch-up endpoint ---------------- */

async function api() {
  const dir = await mkdtemp(join(tmpdir(), "swarm-api-"));
  const l = await localServices(dir);
  for (const name of ["writer", "reader", "outsider"])
    l.credentials.set(name + "-credential", { id: name, tenant: l.principal.tenant, session: "s-" + name });
  const tokens: Record<string, string> = { owner: l.token, writer: "writer-credential", reader: "reader-credential", outsider: "outsider-credential" };
  const call = (actor: string | null, path: string, body?: any) =>
    application(l.s)(
      new Request(l.s.origin + path, {
        method: body ? "POST" : "GET",
        headers: {
          ...(actor ? { authorization: "Bearer " + tokens[actor] } : {}),
          ...(body ? { origin: l.s.origin } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  const repo = (await (await call("owner", "/api/repos", { name: "swarm-repo" })).json()) as any;
  for (const u of ["writer", "reader"]) await call("owner", `/api/repos/${repo.id}/grants`, { user: u, role: u });
  return { l, call, repo, dir, close: async () => { l.db.close(); await rm(dir, { recursive: true, force: true }); } };
}

test("swarms API: 401 without a session, reader may watch, writer starts; planner errors stop the swarm", async () => {
  const h = await api();
  try {
    const prefix = `/api/repos/${h.repo.id}/swarms`;
    // Unauthenticated callers get 401 (so the app refreshes), before any lookup — also for agent runs.
    for (const path of [prefix, prefix + "/abc", `/api/repos/${h.repo.id}/agent-runs`])
      assert.equal((await h.call(null, path)).status, 401, path);
    assert.equal((await h.call(null, prefix, { goal: "Write guides", agents: 2 })).status, 401);
    assert.equal((await h.call(null, "/api/repos/00000000-0000-4000-8000-000000000000/swarms")).status, 401);
    // No runtime: unavailable, but only to people who can read.
    assert.equal((await h.call("reader", prefix)).status, 503);
    assert.equal((await h.call("outsider", prefix)).status, 404);
    const calls: any[] = [];
    let capacity = { active: 0, limit: 3 };
    let planned: any = [
      { title: "Install", goal: "Write docs/install.md", files: ["docs/install.md"] },
      { title: "Usage", goal: "Write docs/usage.md", files: ["docs/usage.md"] },
    ];
    const swarm = { id: "sw-1", goal: "Write guides", actor: "writer", created: 1, model: "m", tasks: [] as any[] };
    h.l.s.runs = {
      start: async () => ({}),
      list: async () => [],
      get: async () => ({}),
      cancel: async () => ({}),
      capacity: async () => capacity,
      plan: async (_r, goal, agents, paths) => {
        calls.push({ op: "plan", goal, agents, paths });
        if (planned instanceof Error) throw planned;
        return planned;
      },
      swarm: async (_r, actor, body) => {
        calls.push({ op: "swarm", actor: actor.id, body });
        swarm.tasks = body.tasks.map((t: any, i: number) => ({ ...t, n: i + 1, run: "run-" + i, strand: "s" }));
        return { swarmId: "sw-1", runs: swarm.tasks.map((t) => t.run) };
      },
      swarms: async (_r, id) => ({
        swarms: !id || id === "sw-1" ? (swarm.tasks.length ? [swarm] : []) : [],
        runs: swarm.tasks.map((t: any) => ({ id: t.run, status: "working" })),
      }),
    };
    assert.equal((await h.call("outsider", prefix)).status, 404);
    assert.deepEqual(await (await h.call("reader", prefix)).json(), { swarms: [] });
    assert.equal((await h.call("reader", prefix, { goal: "Write guides", agents: 2 })).status, 404);
    for (const body of [{}, { goal: "Write guides", agents: 7 }, { goal: "Write guides", agents: 1 }, { goal: "x" }])
      assert.equal((await h.call("writer", prefix, body)).status, 422, JSON.stringify(body));
    assert.ok(!calls.length, "validation happens before the planner");
    capacity = { active: 2, limit: 3 };
    const busy = await h.call("writer", prefix, { goal: "Write guides", agents: 2 });
    assert.equal(busy.status, 409);
    assert.match(((await busy.json()) as any).message, /Only 1 of 3/);
    capacity = { active: 0, limit: 3 };
    planned = new Fault(502, "The planner's answer wasn't a usable plan (it was empty).");
    const bad = await h.call("writer", prefix, { goal: "Write guides", agents: 2 });
    assert.equal(bad.status, 502);
    assert.ok(!calls.some((c) => c.op === "swarm"), "no runs start without a valid plan");
    planned = [
      { title: "Install", goal: "Write docs/install.md", files: ["docs/install.md"] },
      { title: "Usage", goal: "Write docs/usage.md", files: ["docs/usage.md"] },
    ];
    const started = await h.call("writer", prefix, { goal: "  Write guides ", agents: 2 });
    assert.equal(started.status, 202);
    const v = (await started.json()) as any;
    assert.equal(v.swarmId, "sw-1");
    assert.deepEqual(v.swarm.tasks.map((t: any) => [t.title, t.status]), [["Install", "working"], ["Usage", "working"]]);
    assert.deepEqual(calls.find((c) => c.op === "swarm"), {
      op: "swarm",
      actor: "writer",
      body: { goal: "Write guides", tasks: planned, autoBraid: false },
    });
    // Auto-braid braids in without a click, so it needs the admin role.
    const auto = await h.call("writer", prefix, { goal: "Write guides", agents: 2, autoBraid: true });
    assert.ok(auto.status === 403 || auto.status === 404, String(auto.status));
    assert.equal((await h.call("reader", prefix + "/sw-1")).status, 200);
    assert.equal((await h.call("reader", prefix + "/sw-2")).status, 404);
    assert.equal((await h.call("reader", prefix + "/bad%21")).status, 404);
  } finally {
    await h.close();
  }
});

/** Seed a repository and push one commit per strand; returns helpers over real local Git. */
async function seeded(h: Awaited<ReturnType<typeof api>>) {
  const { l, repo, dir } = h;
  const clone = async (physical: string, name: string) => {
    const work = join(dir, name);
    await git(["clone", "-q", l.plane.path(physical), work]);
    await git(["config", "user.name", "Synthetic"], work);
    await git(["config", "user.email", "synthetic@example.invalid"], work);
    return work;
  };
  const seed = await clone(repo.physical, "seed");
  await writeFile(join(seed, "README.md"), "# Guide\n\nIntro line.\n\nEnd.\n");
  await git(["add", "."], seed);
  await git(["commit", "-q", "-m", "base"], seed);
  await git(["push", "-q", "origin", "HEAD:main"], seed);
  const base = await git(["rev-parse", "HEAD"], seed);
  const strand = async (name: string, file: string, content: string) => {
    const task = (await (await h.call("owner", `/api/repos/${repo.id}/tasks`, { name })).json()) as any;
    const work = await clone(task.physical, name);
    await writeFile(join(work, file), content);
    await git(["add", "."], work);
    await git(["commit", "-q", "-m", "work " + name], work);
    await git(["push", "-q", "origin", "HEAD:main"], work);
    return { task, candidate: await git(["rev-parse", "HEAD"], work) };
  };
  return { base, strand };
}

test("catch-up endpoint: only for a stale agent proposal; writer only; 401 without a session", async () => {
  const h = await api();
  try {
    const { base, strand } = await seeded(h);
    const a = await strand("first", "a.md", "a\n");
    const b = await strand("second", "b.md", "b\n");
    const pa = (await (await h.call("owner", `/api/repos/${h.repo.id}/proposals`, { task: a.task.id, base, candidate: a.candidate })).json()) as any;
    const pb = (await (await h.call("owner", `/api/repos/${h.repo.id}/proposals`, { task: b.task.id, base, candidate: b.candidate })).json()) as any;
    const caught: any[] = [];
    h.l.s.runs = {
      start: async () => ({}),
      list: async () => [],
      get: async (_r, run) => ({ id: run, status: run === "run-busy" ? "working" : "proposed", proposal: run === "run-a" ? pa.id : pb.id }),
      cancel: async () => ({}),
      catchUp: async (_r, run, proposal) => {
        caught.push({ run, proposal });
        return { id: run, status: "catching_up" };
      },
    };
    const url = (run: string) => `/api/repos/${h.repo.id}/agent-runs/${run}/catch-up`;
    const fresh = await h.call("writer", url("run-b"), {});
    assert.equal(fresh.status, 409);
    assert.match(((await fresh.json()) as any).message, /already on the latest commit/);
    // Braid the first proposal: the second is now stale.
    await h.call("owner", `/api/repos/${h.repo.id}/review`, { id: pa.id, status: "approved" });
    assert.equal((await h.call("owner", `/api/repos/${h.repo.id}/merge`, { id: pa.id })).status, 200);
    assert.equal((await h.call(null, url("run-b"), {})).status, 401);
    assert.equal((await h.call("reader", url("run-b"), {})).status, 404);
    assert.equal((await h.call("writer", url("run-busy"), {})).status, 409);
    assert.match(((await (await h.call("writer", url("run-a"), {})).json()) as any).message, /already braided in/);
    const ok = await h.call("writer", url("run-b"), {});
    assert.equal(ok.status, 202);
    assert.deepEqual(caught, [{ run: "run-b", proposal: pb.id }]);
  } finally {
    await h.close();
  }
});

/* ---------------- catch-up engine over real Git ---------------- */

const run = promisify(execFile);
/** Container double: runs real commands in a temp checkout standing in for /work/repo. */
function localContainer(work: string) {
  const state = { push: false, pushes: [] as string[], prepared: 0 };
  const exec: Exec = async (cmd, o = {}) => {
    if (cmd[0] === "git" && cmd.includes("push")) {
      assert.ok(state.push, "push only inside the push window");
      state.pushes.push(cmd.at(-1)!);
    }
    const cwd = (o.cwd ?? WORKDIR).replace(WORKDIR, work);
    try {
      const out = await run(cmd[0], cmd.slice(1), { cwd, env: { ...cleanEnv(), ...(o.env ?? {}) }, timeout: 60_000 });
      return { exitCode: 0, stdout: new TextEncoder().encode(out.stdout + (o.combined ? out.stderr : "")), stderr: new TextEncoder().encode(out.stderr) };
    } catch (e: any) {
      return { exitCode: typeof e.code === "number" ? e.code : 1, stdout: new TextEncoder().encode((e.stdout ?? "") + (o.combined ? e.stderr ?? "" : "")), stderr: new TextEncoder().encode(e.stderr ?? "") };
    }
  };
  const workspace = {
    prepare: async (remote: string, branch: string) => {
      state.prepared++;
      await rm(work, { recursive: true, force: true });
      await git(["clone", "-q", "--branch", branch, remote, work]);
      return exec;
    },
    allowPush: async (b: boolean) => {
      state.push = b;
    },
    destroy: async () => {},
  };
  return { state, exec, workspace };
}

async function catchUpScenario(kind: "clean" | "conflict" | "markers" | "inline") {
  const h = await api();
  const { l, repo, dir } = h;
  const { base, strand } = await seeded(h);
  // The agent's strand edits the intro; a competing change lands first.
  const agent = await strand("swarm-aaaa-1-intro", "README.md", "# Guide\n\nAgent intro.\n\nEnd.\n");
  const other =
    kind === "clean" || kind === "inline"
      ? await strand("other", "docs.md", "docs\n")
      : await strand("other", "README.md", "# Guide\n\nHuman intro.\n\nEnd.\n");
  const owner = l.principal;
  const canonical = (await l.catalog.get(repo.id))!;
  const old = kind === "inline" ? null : await openProposal(l.s, owner, canonical, { task: agent.task.id, base, candidate: agent.candidate });
  const po = await openProposal(l.s, owner, canonical, { task: other.task.id, base, candidate: other.candidate });
  await h.call("owner", `/api/repos/${repo.id}/review`, { id: po.id, status: "approved" });
  assert.equal((await h.call("owner", `/api/repos/${repo.id}/merge`, { id: po.id })).status, 200);
  const newHead = other.candidate;

  const r: RunRecord = {
    id: "00000000-0000-4000-8000-0000000000aa",
    repo: canonical,
    actor: { ...owner, session: "secret" },
    goal: "Rewrite the intro",
    model: "@cf/openai/gpt-oss-120b",
    status: kind === "inline" ? "pushing" : "proposed",
    created: Date.now(),
    updated: Date.now(),
    deadline: Date.now() + AGENT_LIMITS.wallMs,
    requests: 3,
    attempts: 0,
    events: [],
    task: { id: agent.task.id, physical: agent.task.physical, name: agent.task.name },
    branch: "main",
    base,
    candidate: agent.candidate,
    candidateRef: "main",
    ...(old ? { proposal: old.id } : {}),
    swarm: { id: "aaaa", n: 1, title: "Intro", files: ["README.md"] },
  };
  if (old) startCatchUp(r, "Another change was braided in first", old.id);
  const box = localContainer(join(dir, "container"));
  const resolves: string[][] = [];
  const supersedes: any[] = [];
  await runAgent(r, {
    signal: new AbortController().signal,
    access: async () => {},
    save: async () => {},
    strand: async () => assert.fail("no new strand"),
    remote: async (t) => ({ remote: l.plane.path(t.physical), branch: "main" }),
    canonical: async () => ({ remote: l.plane.path(repo.physical), branch: "main" }),
    workspace: box.workspace,
    loop: async () => assert.fail("no coding loop when catching up"),
    resolve: async (_env, files) => {
      resolves.push(files);
      if (kind !== "markers")
        await writeFile(join(dir, "container", "README.md"), "# Guide\n\nHuman intro. Agent intro.\n\nEnd.\n");
      return { completed: true, summary: "Merged both intros." };
    },
    propose: async (task, b, c) => openProposal(l.s, owner, canonical, { task, base: b, candidate: c }),
    supersede: async (from, to, note) => {
      supersedes.push({ from, to });
      await l.catalog.supersede(repo.id, from);
      await l.s.collaboration!.review(repo.id, from, owner, note);
    },
  });
  return { h, r, old, newHead, box, resolves, supersedes, agent };
}

test("catch-up: stale proposal rebases cleanly onto the new head, pushes braid/attempt-1, re-proposes and supersedes", async () => {
  const { h, r, old, newHead, box, resolves, supersedes, agent } = await catchUpScenario("clean");
  try {
    assert.equal(r.status, "proposed", r.error ?? "");
    assert.equal(resolves.length, 0, "no model requests without conflicts");
    assert.equal(r.base, newHead);
    assert.notEqual(r.proposal, old!.id);
    assert.deepEqual(box.state.pushes, ["HEAD:refs/heads/braid/attempt-1"]);
    assert.equal(r.catchups?.length, 1);
    assert.equal(r.catchups![0].conflicts, false);
    assert.deepEqual(r.catchups![0].files, ["README.md"]);
    const ps = await h.l.catalog.proposals(h.repo.id);
    const fresh = ps.find((p) => p.id === r.proposal)!;
    assert.equal(fresh.base, newHead);
    assert.equal(fresh.status, "open");
    assert.equal(ps.find((p) => p.id === old!.id)!.status, "rejected", "old proposal superseded");
    assert.deepEqual(supersedes, [{ from: old!.id, to: r.proposal }]);
    const notes = (await h.l.s.collaboration!.review(h.repo.id, old!.id)) as any[];
    assert.match(notes[0].body, /Superseded by a caught-up proposal.*without conflicts/);
    // The strand's default branch is untouched (no force-push); the rebased commit is on its own branch.
    assert.equal(await git(["--git-dir", h.l.plane.path(agent.task.physical), "rev-parse", "main"]), agent.candidate);
    assert.equal(await git(["--git-dir", h.l.plane.path(agent.task.physical), "rev-parse", "braid/attempt-1"]), r.candidate);
    // A person still approves; then it braids in on the fenced path.
    await h.call("owner", `/api/repos/${h.repo.id}/review`, { id: r.proposal, status: "approved" });
    assert.equal((await h.call("owner", `/api/repos/${h.repo.id}/merge`, { id: r.proposal })).status, 200);
    assert.equal(await git(["--git-dir", h.l.plane.path(h.repo.physical), "rev-parse", "main"]), r.candidate);
  } finally {
    await h.close();
  }
});

test("catch-up: conflicts go to the bounded Pi resolver; leftover markers fail without touching the old proposal", async () => {
  {
    const { h, r, newHead, resolves } = await catchUpScenario("conflict");
    try {
      assert.equal(r.status, "proposed", r.error ?? "");
      assert.deepEqual(resolves, [["README.md"]]);
      assert.equal(r.catchups![0].conflicts, true);
      assert.equal(r.base, newHead);
      const text = await git(["--git-dir", h.l.plane.path(r.task!.physical), "show", r.candidate + ":README.md"]);
      assert.match(text, /Human intro\. Agent intro\./);
      const notes = (await h.l.s.collaboration!.review(h.repo.id, r.catchups![0].from!)) as any[];
      assert.match(notes[0].body, /conflicts were resolved by the agent; please review/);
    } finally {
      await h.close();
    }
  }
  {
    const { h, r, old } = await catchUpScenario("markers");
    try {
      assert.equal(r.status, "failed");
      assert.match(r.error!, /^Couldn't catch up: Conflict markers remain in README\.md/);
      assert.equal(r.proposal, old!.id);
      const ps = await h.l.catalog.proposals(h.repo.id);
      assert.equal(ps.find((p) => p.id === old!.id)!.status, "open");
      assert.equal(ps.length, 2, "no new proposal");
    } finally {
      await h.close();
    }
  }
  assert.equal(AGENT_LIMITS.resolveRequests, 6);
});

test("catch-up: a run whose proposal is refused as stale catches up in place instead of failing", async () => {
  const { h, r, newHead, box } = await catchUpScenario("inline");
  try {
    assert.equal(r.status, "proposed", r.error ?? "");
    assert.equal(r.base, newHead);
    assert.equal(r.catchups?.[0].from, undefined);
    assert.equal(box.state.prepared, 1);
    assert.ok(r.events.some((e) => /Catching up: The repository moved while the agent worked/.test(e.text)));
    const ps = await h.l.catalog.proposals(h.repo.id);
    assert.equal(ps.find((p) => p.id === r.proposal)!.base, newHead);
  } finally {
    await h.close();
  }
});

test("catch-up attempts are bounded", () => {
  const r: any = { events: [], catchupCount: AGENT_LIMITS.catchUps };
  fault(() => startCatchUp(r, "again"), 409, /Caught up 6 times/);
  const ok: any = { events: [] };
  startCatchUp(ok, "first", "p-1");
  assert.deepEqual([ok.status, ok.catchup.n, ok.catchup.from], ["catching_up", 1, "p-1"]);
  void readFile;
});

test("braid queue API: admin queues (approving an open proposal); a braid-in notifies landed", async () => {
  const h = await api();
  try {
    const { base, strand } = await seeded(h);
    const a = await strand("first", "a.md", "a\n");
    const b = await strand("second", "b.md", "b\n");
    const propose = async (x: any) =>
      (await (await h.call("owner", `/api/repos/${h.repo.id}/proposals`, { task: x.task.id, base, candidate: x.candidate })).json()) as any;
    const pa = await propose(a),
      pb = await propose(b);
    const queued: any[] = [];
    let landed = 0;
    h.l.s.runs = {
      start: async () => ({}),
      list: async () => [],
      get: async () => ({}),
      cancel: async () => ({}),
      queue: async () => ({ entries: queued.map((q, i) => ({ position: i + 1, proposal: q.proposal })), recent: [] }),
      enqueue: async (_r, actor, body) => {
        queued.push({ actor: actor.id, ...body });
        return { entries: queued.map((q, i) => ({ position: i + 1, proposal: q.proposal })), recent: [] };
      },
      landed: async () => {
        landed++;
      },
    };
    const url = `/api/repos/${h.repo.id}/queue`;
    assert.equal((await h.call(null, url)).status, 401);
    assert.equal((await h.call("outsider", url)).status, 404);
    assert.equal((await h.call("reader", url)).status, 200);
    // Queuing braids in later without another click, so it is an admin action.
    assert.equal((await h.call("writer", url, { proposal: pb.id })).status, 404);
    assert.equal((await h.call("owner", url, { proposal: "nope" })).status, 409);
    const q = await h.call("owner", url, { proposal: pb.id });
    assert.equal(q.status, 202);
    assert.deepEqual(queued, [{ actor: h.l.principal.id, proposal: pb.id, mode: "approved" }]);
    const proposals = (await (await h.call("owner", `/api/repos/${h.repo.id}/proposals`)).json()) as any[];
    assert.equal(proposals.find((p) => p.id === pb.id).status, "approved");
    // A manual braid-in tells the runtime something landed.
    await h.call("owner", `/api/repos/${h.repo.id}/review`, { id: pa.id, status: "approved" });
    assert.equal((await h.call("owner", `/api/repos/${h.repo.id}/merge`, { id: pa.id })).status, 200);
    assert.equal(landed, 1);
    // The fence still holds for the now-stale proposal; the queue is the way through.
    const stale = await h.call("owner", `/api/repos/${h.repo.id}/merge`, { id: pb.id });
    assert.equal(stale.status, 409);
    assert.equal(landed, 1);
  } finally {
    await h.close();
  }
});
