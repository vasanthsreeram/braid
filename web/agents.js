// Agents tab: an agent working on its own strand. Plain DOM; all text via textContent.
// Depends only on the small window.braidApp surface exposed by app.js.
const LABEL = {
  queued: "Queued",
  setting_up: "Setting up",
  working: "Working",
  pushing: "Pushing",
  catching_up: "Catching up",
  proposed: "Proposed",
  failed: "Failed",
  cancelled: "Cancelled",
};
const DONE = ["proposed", "failed", "cancelled"];
const POLL_MS = 4000;
// Swarm sub-task statuses (from GET /swarms).
const TASK_LABEL = {
  planning: "Planning",
  working: "Working",
  catching_up: "Catching up",
  proposed: "Proposed",
  approved: "Approved",
  braided: "Braided in",
  rejected: "Rejected",
  failed: "Failed",
  cancelled: "Cancelled",
};
const TASK_BUSY = ["planning", "working", "catching_up"];
let swarms = [];
let runs = [];
let selectedRun;
let detail;
let timer;
let repoId;

const app = () => window.braidApp;
const panel = () => document.getElementById("agent-runs-view");

function statusBadge(status, labels = LABEL) {
  return app().el("span", {
    class: "badge agent-status agent-status-" + status,
    text: labels[status] ?? status,
  });
}

function build() {
  const { el, action, canWrite } = app();
  const root = panel();
  root.replaceChildren();
  const intro = el(
    "div",
    { class: "card form-card agent-start" },
    el("h2", { text: "Ask an agent" }),
    el("p", {
      class: "muted",
      text:
        "An agent works on its own strand: a private copy of this repository, in a sandbox with no Internet access. " +
        "When it's done, its changes appear in Changes as a proposal for review. Nothing reaches this repository until someone braids it in.",
    }),
  );
  if (canWrite()) {
    const form = el(
      "form",
      { id: "agent-run-form" },
      el(
        "label",
        { class: "field" },
        el("span", { text: "What should the agent do?" }),
        el("textarea", {
          name: "goal",
          rows: "4",
          required: true,
          maxlength: "2000",
          placeholder: "For example: Fix the typo in the README's install section.",
        }),
      ),
      el(
        "div",
        { class: "form-actions" },
        el("span", {
          class: "hint",
          text: "Up to 15 model steps and 20 minutes. Up to 3 agents at a time per repository.",
        }),
        el("button", { class: "btn btn-primary", text: "Start agent" }),
      ),
    );
    form.onsubmit = action(async (e) => {
      const goal = e.target.elements.goal.value.trim();
      if (!goal) throw Error("Describe what the agent should do.");
      const r = await app().api(app().repoAPI("agent-runs"), { goal });
      e.target.reset();
      selectedRun = r.runId;
      await refresh();
    });
    intro.append(form);
  } else
    intro.append(
      el("p", { class: "muted", text: "Only people who can write to this repository can start agents." }),
    );
  const swarmCard = el(
    "div",
    { class: "card form-card agent-swarm" },
    el("h2", { text: "Start a swarm" }),
    el("p", {
      class: "muted",
      text:
        "A planner splits one goal into separate parts and starts an agent on each, at the same time, each on its own strand. " +
        "Every part comes back as its own proposal. If one is braided in first, the others can catch up onto it.",
    }),
  );
  if (canWrite()) {
    const form = el(
      "form",
      { id: "swarm-form" },
      el(
        "label",
        { class: "field" },
        el("span", { text: "What should the agents do together?" }),
        el("textarea", {
          name: "goal",
          rows: "3",
          required: true,
          maxlength: "2000",
          placeholder:
            "For example: Add three short guides in docs/: install.md, models.md and troubleshooting.md, each a standalone page.",
        }),
      ),
      el(
        "div",
        { class: "form-actions" },
        el(
          "label",
          { class: "agent-count" },
          el("span", { text: "Agents" }),
          el(
            "select",
            { name: "agents" },
            el("option", { value: "2", text: "2" }),
            el("option", { value: "3", text: "3", selected: true }),
          ),
        ),
        el("span", { id: "swarm-status", class: "hint", role: "status" }),
        el("button", { class: "btn btn-primary", text: "Plan and start" }),
      ),
    );
    form.onsubmit = action(async (e) => {
      const f = e.target;
      const goal = f.elements.goal.value.trim();
      if (!goal) throw Error("Describe what the agents should do.");
      const button = f.querySelector("button");
      const status = document.getElementById("swarm-status");
      button.disabled = true;
      status.textContent = "Planning the parts…";
      try {
        const r = await app().api(app().repoAPI("swarms"), { goal, agents: Number(f.elements.agents.value) });
        f.reset();
        status.textContent = `Started ${r.swarm?.tasks?.length ?? ""} agents.`;
      } catch (err) {
        status.textContent = "";
        throw err;
      } finally {
        button.disabled = false;
      }
      await refresh();
    });
    swarmCard.append(form);
  }
  root.append(
    intro,
    swarmCard,
    el("div", { id: "agent-swarms" }),
    el(
      "div",
      { class: "card agent-runs" },
      el(
        "div",
        { class: "card-head" },
        el("h2", { text: "Runs" }),
        el(
          "div",
          { class: "tools" },
          el("button", {
            type: "button",
            class: "btn btn-secondary",
            text: "Refresh",
            onclick: action(refresh),
          }),
        ),
      ),
      el("div", { id: "agent-run-list" }),
    ),
    el("div", { id: "agent-run-detail", class: "card agent-run-detail", hidden: true }),
  );
}

function renderList() {
  const { el, action, when } = app();
  const list = document.getElementById("agent-run-list");
  if (!list) return;
  list.replaceChildren(
    ...runs.map((r) =>
      el(
        "div",
        {
          class: "repo row clickable" + (r.id === selectedRun ? " selected" : ""),
          "data-id": r.id,
        },
        el(
          "div",
          { class: "row-main" },
          el("button", {
            type: "button",
            class: "link-button agent-goal",
            text: r.goal,
            onclick: action(() => select(r.id)),
          }),
          el("span", {
            class: "row-sub",
            text: [when(r.created), r.last].filter(Boolean).join(" · "),
          }),
        ),
        el("div", { class: "row-side" }, statusBadge(r.status)),
      ),
    ),
  );
  if (!runs.length)
    list.append(
      el("p", {
        class: "empty-inline",
        text: "No agent runs yet. Describe a change above and an agent will try it on its own strand.",
      }),
    );
}

function renderSwarms() {
  const { el, action, when } = app();
  const box = document.getElementById("agent-swarms");
  if (!box) return;
  box.replaceChildren(
    ...swarms.slice(0, 5).map((sw) =>
      el(
        "div",
        { class: "card agent-swarm-view", "data-swarm": sw.id },
        el(
          "div",
          { class: "card-head" },
          el("h2", { class: "agent-swarm-goal", text: "Swarm: " + sw.goal.split("\n")[0] }),
          el("span", { class: "muted", text: when(sw.created) }),
        ),
        el(
          "ol",
          { class: "agent-subtasks" },
          ...sw.tasks.map((t) =>
            el(
              "li",
              { class: "repo row clickable", "data-run": t.run },
              el(
                "div",
                { class: "row-main" },
                el("button", {
                  type: "button",
                  class: "link-button agent-goal",
                  text: `${t.n}. ${t.title}`,
                  onclick: action(() => select(t.run)),
                }),
                el("span", {
                  class: "row-sub",
                  text: [t.strand, t.files?.length ? t.files.join(", ") : null, t.error ?? t.last]
                    .filter(Boolean)
                    .join(" · "),
                }),
              ),
              el("div", { class: "row-side" }, statusBadge(t.status, TASK_LABEL)),
            ),
          ),
        ),
      ),
    ),
  );
}

function renderDetail() {
  const { el, action, when, canWrite } = app();
  const box = document.getElementById("agent-run-detail");
  if (!box) return;
  if (!detail) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const active = !DONE.includes(detail.status);
  const tools = el("div", { class: "tools" });
  if (detail.proposal)
    tools.append(
      el("button", {
        type: "button",
        class: "btn btn-primary",
        text: "Review the changes",
        onclick: action(() => app().openChange(detail.proposal)),
      }),
    );
  if (detail.status === "proposed" && detail.proposal && canWrite())
    tools.append(
      el("button", {
        type: "button",
        class: "btn btn-secondary",
        text: "Catch up",
        title: "Rebase onto the latest commit and propose again",
        onclick: action(async () => {
          detail = await app().api(app().repoAPI(`agent-runs/${detail.id}/catch-up`), {});
          app().say("The agent is catching up onto the latest commit.");
          await refresh();
        }),
      }),
    );
  if (active && canWrite())
    tools.append(
      el("button", {
        type: "button",
        class: "btn btn-ghost",
        text: "Cancel run",
        onclick: action(async () => {
          detail = await app().api(app().repoAPI(`agent-runs/${detail.id}/cancel`), {});
          await refresh();
        }),
      }),
    );
  const facts = [
    `Started ${when(detail.created)}`,
    `${detail.requests ?? 0} of 15 model steps`,
    detail.task ? `Strand ${detail.task.name}` : null,
    detail.candidate ? `Commit ${detail.candidate.slice(0, 7)}` : null,
    detail.catchups?.length ? `Caught up ${detail.catchups.length}×` : null,
  ].filter(Boolean);
  box.replaceChildren(
    el(
      "div",
      { class: "card-head" },
      el("h2", { class: "agent-detail-title" }, statusBadge(detail.status), " ", detail.goal),
      tools,
    ),
    el("p", { class: "muted", text: facts.join(" · ") }),
    ...(detail.error ? [el("p", { class: "agent-error", role: "alert", text: detail.error })] : []),
    ...(detail.summary
      ? [el("h3", { text: "What the agent says it did" }), el("p", { class: "agent-summary", text: detail.summary })]
      : []),
    el("h3", { text: "Progress" }),
    el(
      "ol",
      { class: "agent-log", "aria-live": active ? "polite" : "off" },
      ...(detail.events ?? [])
        .slice()
        .reverse()
        .map((ev) =>
          el(
            "li",
            {},
            el("time", { text: new Date(ev.at).toLocaleTimeString() }),
            el("span", { text: ev.text }),
          ),
        ),
    ),
  );
}

async function select(id) {
  selectedRun = id;
  detail = await app().api(app().repoAPI("agent-runs/" + id));
  renderList();
  renderDetail();
}

async function refresh() {
  const current = repoId;
  const [v, sw] = await Promise.all([
    app().api(app().repoAPI("agent-runs")),
    app().api(app().repoAPI("swarms")).catch(() => ({ swarms: [] })),
  ]);
  if (current !== repoId) return;
  runs = v.runs ?? [];
  swarms = sw.swarms ?? [];
  if (!selectedRun && runs.length) selectedRun = runs[0].id;
  if (selectedRun && runs.some((r) => r.id === selectedRun))
    detail = await app().api(app().repoAPI("agent-runs/" + selectedRun));
  else detail = undefined;
  if (current !== repoId) return;
  renderSwarms();
  renderList();
  renderDetail();
  schedule();
}

function schedule() {
  clearTimeout(timer);
  const busy =
    runs.some((r) => !DONE.includes(r.status)) ||
    swarms.some((sw) => sw.tasks.some((t) => TASK_BUSY.includes(t.status)));
  if (!busy) return;
  timer = setTimeout(async () => {
    if (!app().isActive() || document.hidden || app().repo()?.id !== repoId) return;
    try {
      await refresh();
    } catch {
      schedule();
    }
  }, POLL_MS);
}

async function show() {
  const repo = app().repo();
  if (!repo) return;
  if (repoId !== repo.id) {
    repoId = repo.id;
    runs = [];
    swarms = [];
    detail = selectedRun = undefined;
  }
  build();
  await refresh();
}

window.braidAgents = { show };
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && app()?.isActive() && repoId === app().repo()?.id) schedule();
});
