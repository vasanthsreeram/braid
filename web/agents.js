// Agents tab: an agent working on its own strand. Plain DOM; all text via textContent.
// Depends only on the small window.braidApp surface exposed by app.js.
const LABEL = {
  queued: "Queued",
  setting_up: "Setting up",
  working: "Working",
  pushing: "Pushing",
  proposed: "Proposed",
  failed: "Failed",
  cancelled: "Cancelled",
};
const DONE = ["proposed", "failed", "cancelled"];
const POLL_MS = 4000;
let runs = [];
let selectedRun;
let detail;
let timer;
let repoId;

const app = () => window.braidApp;
const panel = () => document.getElementById("agent-runs-view");

function statusBadge(status) {
  return app().el("span", {
    class: "badge agent-status agent-status-" + status,
    text: LABEL[status] ?? status,
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
          text: "Up to 15 model steps and 20 minutes. One agent at a time per repository.",
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
  root.append(
    intro,
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
  const v = await app().api(app().repoAPI("agent-runs"));
  if (current !== repoId) return;
  runs = v.runs ?? [];
  if (!selectedRun && runs.length) selectedRun = runs[0].id;
  if (selectedRun && runs.some((r) => r.id === selectedRun))
    detail = await app().api(app().repoAPI("agent-runs/" + selectedRun));
  else detail = undefined;
  if (current !== repoId) return;
  renderList();
  renderDetail();
  schedule();
}

function schedule() {
  clearTimeout(timer);
  const busy = runs.some((r) => !DONE.includes(r.status));
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
    detail = selectedRun = undefined;
  }
  build();
  await refresh();
}

window.braidAgents = { show };
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && app()?.isActive() && repoId === app().repo()?.id) schedule();
});
