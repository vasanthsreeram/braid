"use strict";
let credential = "",
  selected,
  selectedRepo,
  discoveryView = false,
  refreshFlight;
const $ = (id) => document.getElementById(id);
$("local").hidden = !["127.0.0.1", "localhost"].includes(
  window.location.hostname,
);
if (!$("local").hidden) $("local").closest("details").open = true;
async function api(path, body, retry = true) {
  const headers = {};
  if (credential) headers.Authorization = "Bearer " + credential;
  if (body) headers["Content-Type"] = "application/json";
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && !credential && retry) {
    refreshFlight ||= fetch("/auth/refresh", { method: "POST" })
      .then((r) => {
        if (!r.ok) throw Error("Session ended. Sign in again.");
      })
      .finally(() => {
        refreshFlight = undefined;
      });
    await refreshFlight;
    return api(path, body, false);
  }
  const type = r.headers.get("content-type");
  const v = type?.includes("json") ? await r.json() : await r.text();
  if (!r.ok) throw Error(v.message || v || "Request failed");
  return v;
}
let pendingActions = 0;
function workspaceView(view) {
  $("workspace").dataset.view = view;
  $("detail").hidden = view !== "repository";
  $("profile-view").hidden = view !== "profile";
  $("view-kicker").textContent =
    view === "repository"
      ? "YOUR WORKSPACE / REPOSITORY"
      : view === "profile"
        ? "YOUR WORKSPACE / CONTRIBUTIONS"
        : discoveryView
          ? "YOUR WORKSPACE / DISCOVER"
          : "YOUR WORKSPACE / OVERVIEW";
  $("view-title").textContent =
    view === "repository"
      ? "Repository."
      : view === "profile"
        ? "Contribution history."
        : discoveryView
          ? "Discover."
          : "Repositories.";
  for (const id of ["mine", "discover", "profile"]) {
    const active =
      view === "profile"
        ? id === "profile"
        : discoveryView
          ? id === "discover"
          : id === "mine";
    if (active) $(id).setAttribute("aria-current", "page");
    else $(id).removeAttribute("aria-current");
  }
}
function repositoryMode(mode, tab) {
  $("detail").dataset.mode = mode;
  for (const button of document.querySelectorAll(".repo-tabs button")) {
    if (button.id === tab) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
}
$("back-repos").onclick = () => {
  workspaceView("overview");
  window.history.replaceState(null, "", location.pathname);
  $("view-title").tabIndex = -1;
  $("view-title").focus({ preventScroll: true });
};
const modes = {
  readme: "source",
  history: "source",
  issues: "issues",
  agents: "agents",
  proposals: "proposals",
  access: "access",
  clone: "clone",
  reconcile: "receipt",
};
document.querySelector(".repo-tabs").addEventListener(
  "click",
  (e) => {
    const button = e.target.closest("button");
    if (button && modes[button.id]) repositoryMode(modes[button.id], button.id);
  },
  true,
);
function action(fn) {
  return async (e) => {
    e?.preventDefault();
    pendingActions++;
    $("workspace").setAttribute("aria-busy", "true");
    document.body.classList.add("busy");
    try {
      $("notice").textContent = "";
      await fn(e);
    } catch (err) {
      $("notice").textContent = err.message;
    } finally {
      if (!--pendingActions) {
        $("workspace").removeAttribute("aria-busy");
        document.body.classList.remove("busy");
      }
    }
  };
}
async function list(discovery = false) {
  discoveryView = discovery;
  const { repos } = await api(
    (discovery ? "/api/discovery" : "/api/repos") +
      "?q=" +
      encodeURIComponent($("query").value),
  );
  $("repos").replaceChildren();
  $("repos").dataset.empty = String(!repos.length);
  for (const r of repos) {
    const row = document.createElement("div");
    row.className = "repo";
    const title = document.createElement("strong");
    title.textContent = r.name;
    const badge = document.createElement("span");
    badge.textContent = r.visibility + " / " + r.state;
    const button = document.createElement("button");
    button.textContent = "Open";
    button.onclick = action(() => open(r.id));
    row.append(title, badge, button);
    $("repos").append(row);
  }
  if (!repos.length) $("repos").textContent = "No repositories in this view.";
}
async function open(id) {
  selected = id;
  const r = await api("/api/repos/" + id);
  selectedRepo = r;
  workspaceView("repository");
  repositoryMode("source", "readme");
  detailEpoch++;
  $("issue-detail").hidden = true;
  activeJob = undefined;
  activeIssue = undefined;
  $("issues-view").hidden = true;
  $("agents-view").hidden = true;
  for (const id of ["grant", "invite", "visibility", "reconcile", "access"])
    $(id).hidden = r.role !== "admin";
  $("task").hidden =
    !!r.parent || !["contributor", "writer", "admin"].includes(r.role);
  $("git-credential").hidden = true;
  $("git-secret").value = "";
  $("files").replaceChildren();
  $("commit-list").replaceChildren();
  $("detail").hidden = false;
  const name = document.createElement("span"),
    meta = document.createElement("small");
  name.className = "repo-heading-name";
  name.textContent = r.name;
  meta.textContent = `${r.visibility} / ${r.role} / ${r.id}`;
  $("repo-header").replaceChildren(name, meta);
  $("content").textContent = JSON.stringify(r.git, null, 2);

  $("proposal").hidden = !!r.parent;
  $("reviews").replaceChildren();
}
$("connect").onclick = action(async () => {
  credential = $("credential").value;
  $("credential").value = "";
  const p = await api("/api/me");
  currentActor = p;
  $("identity").textContent = p.name ?? p.id + " / " + p.tenant;
  await list();
  await restoreRoute();
  await githubAccount();
  $("credential").closest("details").open = false;
});
$("local").onclick = action(async () => {
  const r = await fetch("/__local_identity");
  if (!r.ok)
    throw Error("Local identity is only available in the loopback harness.");
  const v = await r.json();
  credential = v.credential;
  $("environment").textContent = "LOCAL: filesystem storage + bare Git";
  const p = await api("/api/me");
  currentActor = p;
  $("identity").textContent = p.name ?? p.id;
  await list();
  await restoreRoute();
  await githubAccount();
  $("local").closest("details").open = false;
});
$("mine").onclick = action(async () => {
  discoveryView = false;
  workspaceView("overview");
  window.history.replaceState(null, "", location.pathname);
  await list();
});
$("discover").onclick = action(async () => {
  discoveryView = true;
  workspaceView("overview");
  window.history.replaceState(null, "", location.pathname);
  await list(true);
});
$("create").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  if (!b.url) delete b.url;
  await api("/api/repos", b);
  e.target.reset();
  await list();
});
$("task").onsubmit = action(async (e) => {
  await api(
    "/api/repos/" + selected + "/tasks",
    Object.fromEntries(new FormData(e.target)),
  );
  await list();
  workspaceView("overview");
});
$("grant").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  b.role = b.role || null;
  await api("/api/repos/" + selected + "/grants", b);
  $("notice").textContent = "Access updated.";
});
$("proposal").onsubmit = action(async (e) => {
  await api(
    "/api/repos/" + selected + "/proposals",
    Object.fromEntries(new FormData(e.target)),
  );
  $("notice").textContent = "Immutable proposal recorded.";
});
$("readme").onclick = action(async () => {
  $("content").textContent = await api(
    "/api/repos/" + selected + "/file?path=README.md",
  );
});
async function showCommit(id, sha) {
  await open(id);
  const c = await api(`/api/repos/${id}/commit?sha=${sha}`);
  $("content").textContent =
    `${c.sha}\n\n${c.message}\n\nAuthor: ${c.author.name} <${c.author.email}>\nAuthor date: ${new Date(c.authoredAt * 1000).toISOString()}\nCommitter: ${c.committer.name} <${c.committer.email}>\nCommitter date: ${new Date(c.committedAt * 1000).toISOString()}\nParents: ${c.parents.join(" ")}\n\nGit identities are self-declared; they are not verified WorkOS identities.`;
  $("browse").elements.ref.value = sha;
  await browseTree(c.tree, "", sha);
  window.history.replaceState(null, "", `?repo=${id}&commit=${sha}`);
  $("detail").scrollIntoView({ block: "start" });
}
function commitLink(id, sha, label) {
  const link = document.createElement("a");
  link.href = `?repo=${id}&commit=${sha}`;
  link.textContent = label;
  link.onclick = action(() => showCommit(id, sha));
  return link;
}
$("history").onclick = action(async () => {
  const logs = await api("/api/repos/" + selected + "/log");
  $("content").textContent = logs.length
    ? "Select a commit to view its identity, timestamps and files. History list shows the latest 50 first-parent commits; contribution scans follow all parents."
    : "No reachable commits.";
  $("commit-list").replaceChildren(
    ...logs.map((c) => commitLink(selected, c.sha, `${c.sha} · ${c.message}`)),
  );
});
$("profile").onclick = action(async () => {
  const p = await api("/api/profile");
  workspaceView("profile");
  $("profile-summary").textContent =
    `${p.user} · ${p.total} commits · ${p.start} to ${p.end} (UTC)${p.email ? " · " + p.email : " · Verify your account email to see attribution"}`;
  $("profile-definition").textContent = p.definition;
  $("profile-limits").textContent =
    (p.incomplete ? "Partial scan. " : "Scan complete within stated limits. ") +
    p.limitations;
  $("heatmap").replaceChildren(
    ...p.days.map((d) => {
      const cell = document.createElement("span");
      cell.className = "day";
      cell.dataset.level =
        d.count === 0 ? "0" : d.count === 1 ? "1" : d.count < 5 ? "2" : "3";
      cell.title = `${d.date}: ${d.count} commits (UTC)`;
      return cell;
    }),
  );
  $("heatmap").parentElement.scrollLeft = $("heatmap").scrollWidth;
  $("activity-day").replaceChildren(
    ...[...p.days].reverse().map((d) => {
      const option = document.createElement("option");
      option.value = d.date;
      option.textContent = `${d.date} · ${d.count} commits`;
      return option;
    }),
  );
  const active = p.days.filter((d) => d.count > 0).at(-1);
  if (active) $("activity-day").value = active.date;
  const render = () => {
    const rows = p.activity.filter(
      (c) =>
        new Date(c.authoredAt * 1000).toISOString().slice(0, 10) ===
        $("activity-day").value,
    );
    $("activity").replaceChildren(
      ...rows.flatMap((c) =>
        c.repositories.map((r) =>
          commitLink(
            r.id,
            c.sha,
            `${r.name} · ${c.message.split("\n")[0]} · ${c.sha.slice(0, 12)}`,
          ),
        ),
      ),
    );
    if (!rows.length)
      $("activity").textContent = "No attributed commits on this day.";
  };
  $("activity-day").onchange = render;
  render();
  $("profile-view").scrollIntoView({ block: "start" });
});
$("proposals").onclick = action(async () => {
  const ps = await api("/api/repos/" + selected + "/proposals");
  $("reviews").replaceChildren();
  for (const p of ps) {
    const row = document.createElement("div");
    row.textContent = p.id + " · " + p.status + " · " + p.candidate;
    for (const status of selectedRepo.role === "admin"
      ? ["approved", "rejected"]
      : []) {
      const button = document.createElement("button");
      button.textContent = status;
      button.onclick = action(async () => {
        await api("/api/repos/" + selected + "/review", { id: p.id, status });
        $("notice").textContent = "Decision recorded.";
      });
      row.append(button);
    }
    const show = document.createElement("button");
    show.textContent = "View diff";
    show.onclick = action(async () => {
      const d = await api("/api/repos/" + selected + "/diff?proposal=" + p.id);
      $("content").textContent = d.files
        .map(
          (f) =>
            `${f.status} ${f.path}\n--- before (${f.beforeHash || "empty"})\n${f.before ?? "[preview unavailable]"}\n+++ after (${f.afterHash || "empty"})\n${f.after ?? "[preview unavailable]"}`,
        )
        .join("\n\n");
    });
    row.append(show);
    if (p.status === "approved" && selectedRepo.role === "admin") {
      const merge = document.createElement("button");
      merge.textContent = "Merge approved candidate";
      merge.onclick = action(async () => {
        const r = await api("/api/repos/" + selected + "/merge", { id: p.id });
        $("notice").textContent = "Merged " + r.candidate;
      });
      row.append(merge);
    }
    const comments = document.createElement("div");
    const render = async () =>
      comments.replaceChildren(
        ...(await api(repoAPI("discussion/" + p.id))).map((c) =>
          paragraph(c.author + " · " + c.body),
        ),
      );
    const form = document.createElement("form"),
      label = document.createElement("label"),
      field = document.createElement("textarea"),
      submit = document.createElement("button");
    label.textContent = "Review comment";
    field.name = "body";
    field.required = true;
    field.maxLength = 8000;
    label.append(field);
    submit.textContent = "Comment on review";
    form.append(label, submit);
    form.onsubmit = action(async () => {
      await api(repoAPI("discussion/" + p.id), { body: field.value });
      form.reset();
      await render();
    });
    row.append(comments, form);
    await render();
    $("reviews").append(row);
  }
});
async function restoreRoute() {
  const u = new URL(location.href),
    id = u.searchParams.get("repo"),
    sha = u.searchParams.get("commit");
  if (id && sha) await showCommit(id, sha);
  else if (id) {
    await open(id);
    if (u.searchParams.get("issue")) {
      await showIssues();
      await showIssue(Number(u.searchParams.get("issue")));
    }
  }
}
api("/api/me")
  .then((p) => {
    currentActor = p;
    $("identity").textContent = p.name ?? p.id;
    return list().then(restoreRoute).then(githubAccount);
  })
  .catch(() => {});

$("search").onsubmit = action(() => list(discoveryView));
$("organization").onsubmit = action(async (e) => {
  const r = await fetch("/auth/organization", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
  });
  if (!r.ok)
    throw Error("Organization switch failed. Check active membership.");
  await list();
  const p = await api("/api/me");
  currentActor = p;
  $("identity").textContent = p.name ?? p.id + " / " + p.tenant;
});
$("accept-invite").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  await api("/api/invites/" + encodeURIComponent(b.invite), {});
  $("notice").textContent = "Invitation accepted.";
  await list();
});
const pendingInvite = new URL(location.href).searchParams.get("invite");
if (pendingInvite) {
  $("accept-invite").elements.invite.value = pendingInvite;
  $("accept-invite").closest("details").open = true;
}
$("invite").onsubmit = action(async (e) => {
  const i = await api(
    "/api/repos/" + selected + "/invites",
    Object.fromEntries(new FormData(e.target)),
  );
  $("content").textContent =
    "Share this invitation link with " +
    i.email +
    " (expires in seven days):\n" +
    i.url;
});
$("visibility").onsubmit = action(async (e) => {
  await api(
    "/api/repos/" + selected + "/visibility",
    Object.fromEntries(new FormData(e.target)),
  );
  await open(selected);
  await list(discoveryView);
});
$("access").onclick = action(async () => {
  $("grant").closest("details").open = true;
  const grants = await api("/api/repos/" + selected + "/grants"),
    invites = await api("/api/repos/" + selected + "/invites");
  $("reviews").replaceChildren();
  for (const g of grants) {
    const row = document.createElement("div");
    row.textContent = g.user + " · " + g.role;
    const revoke = document.createElement("button");
    revoke.textContent = "Revoke access";
    revoke.onclick = action(async () => {
      await api("/api/repos/" + selected + "/grants", {
        user: g.user,
        role: null,
      });
      row.remove();
    });
    row.append(revoke);
    $("reviews").append(row);
  }
  for (const i of invites) {
    const row = document.createElement("div");
    row.textContent = i.email + " · " + i.role + " · " + i.state;
    if (i.state === "pending") {
      const revoke = document.createElement("button");
      revoke.textContent = "Revoke invitation";
      revoke.onclick = action(async () => {
        await api("/api/repos/" + selected + "/invites", { revoke: i.id });
        row.remove();
      });
      row.append(revoke);
    }
    $("reviews").append(row);
  }
});
async function browseTree(sha, prefix, ref, parents = []) {
  const tree = await api("/api/repos/" + selected + "/tree?sha=" + sha);
  $("files").replaceChildren();
  if (parents.length) {
    const back = document.createElement("button");
    back.textContent = "Back to parent folder";
    const prior = parents.at(-1);
    back.onclick = action(() =>
      browseTree(prior.sha, prior.prefix, prior.ref, parents.slice(0, -1)),
    );
    $("files").append(back);
  }
  for (const f of tree || []) {
    const button = document.createElement("button");
    button.textContent =
      (f.type === "tree" ? "Folder: " : "File: ") + prefix + f.name;
    button.onclick = action(async () => {
      if (f.type === "tree")
        await browseTree(f.hash, prefix + f.name + "/", ref, [
          ...parents,
          { sha, prefix, ref },
        ]);
      else
        $("content").textContent = await api(
          "/api/repos/" +
            selected +
            "/file?ref=" +
            encodeURIComponent(ref) +
            "&path=" +
            encodeURIComponent(prefix + f.name),
        );
    });
    $("files").append(button);
  }
}
$("browse").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  if (b.path)
    $("content").textContent = await api(
      "/api/repos/" +
        selected +
        "/file?ref=" +
        encodeURIComponent(b.ref) +
        "&path=" +
        encodeURIComponent(b.path),
    );
  else {
    const logs = await api(
      "/api/repos/" + selected + "/log?ref=" + encodeURIComponent(b.ref),
    );
    $("content").textContent = JSON.stringify(logs, null, 2);
    if (logs[0]) await browseTree(logs[0].tree, "", logs[0].sha);
  }
});
$("clone").onclick = action(async () => {
  $("git-credential").hidden = false;
  $("git-remote").value = selectedRepo.git.remote;
  $("git-scope").value = "read";
  $("git-help").textContent = selectedRepo.parent
    ? "Use a write credential to push to this task repository."
    : "Canonical writes require an approved proposal. Start by forking a task.";
});
$("git-mint").onclick = action(async () => {
  const t = await api("/api/repos/" + selected + "/token", {
    scope: $("git-scope").value,
  });
  if (!t.plaintext)
    throw Error(t.note || "Native credentials require Artifacts.");
  $("git-secret").value = t.plaintext;
  $("git-help").textContent =
    "Expires " +
    t.expiresAt +
    ". Use Git's HTTP credential prompt with any username and this password.";
  setTimeout(() => {
    $("git-secret").value = "";
  }, 60000);
});
$("git-copy").onclick = action(() =>
  navigator.clipboard.writeText($("git-secret").value),
);
$("reconcile").onclick = action(async () => {
  $("content").textContent = JSON.stringify(
    await api("/api/repos/" + selected + "/reconcile", {}),
    null,
    2,
  );
});

let githubPage = 1,
  githubNext = null,
  githubQuery = "",
  githubFlight = false;
async function githubAccount() {
  const account = await api("/api/github");
  $("github-account").textContent = account.connected
    ? `Connected as ${account.login} · public repository access`
    : account.setupReady
      ? "Connect GitHub to see your public repositories."
      : "GitHub repository connection is awaiting app setup. URL import remains available.";
  $("github-connect").textContent = account.connected
    ? "Reconnect GitHub"
    : "Connect GitHub";
  $("github-disconnect").hidden = !account.connected;
  $("github-picker").hidden = !account.connected;
  $("github-repos").replaceChildren();
  if (account.connected) await githubRepos(1);
}
async function githubRepos(page) {
  if (githubFlight) return;
  githubFlight = true;
  $("github-status").textContent = "Loading repositories…";
  $("github-previous").disabled = $("github-next").disabled = true;
  try {
    const data = await api(
      `/api/github/repos?page=${page}&q=${encodeURIComponent(githubQuery)}`,
    );
    githubPage = data.page;
    githubNext = data.nextPage;
    $("github-repos").replaceChildren();
    for (const repo of data.repos) {
      const row = document.createElement("div");
      row.className = "repo";
      const name = document.createElement("strong");
      name.textContent = repo.fullName;
      const badge = document.createElement("span");
      badge.textContent = `${repo.visibility}${repo.fork ? " · fork" : ""} · ${repo.imports.length ? repo.imports.map((i) => "import " + i.state).join(", ") : "not imported"}`;
      const button = document.createElement("button");
      const ready = repo.imports.find((i) => i.state === "ready");
      button.textContent = ready ? "Open import" : "Import privately";
      button.disabled =
        !ready && repo.imports.some((i) => i.state === "creating");
      button.onclick = action(async () => {
        if (ready) {
          await open(ready.id);
          return;
        }
        button.disabled = true;
        button.textContent = "Importing…";
        try {
          const imported = await api("/api/github/import", {
            repository: repo.fullName,
          });
          $("notice").textContent =
            imported.state === "ready"
              ? `Imported ${repo.fullName} privately.`
              : `Import of ${repo.fullName} is in progress. Open the destination to check its status.`;
          await list();
          await open(imported.id);
        } finally {
          button.disabled = false;
          button.textContent = "Refresh import status";
        }
        await githubRepos(githubPage);
      });
      row.append(name, badge, button);
      $("github-repos").append(row);
    }
    $("github-page").textContent = `Page ${githubPage}`;
    $("github-status").textContent = data.searchLimited
      ? "Search results are limited by GitHub; narrow your search."
      : data.repos.length
        ? "Public repositories · destinations stay private."
        : "No public repositories on this page.";
  } catch (e) {
    $("github-status").textContent = e.message;
    throw e;
  } finally {
    githubFlight = false;
    $("github-previous").disabled = githubPage <= 1;
    $("github-next").disabled = !githubNext;
  }
}
$("github-search").onsubmit = action(async () => {
  githubQuery = $("github-query").value.trim();
  await githubRepos(1);
});
$("github-previous").onclick = action(() => githubRepos(githubPage - 1));
$("github-next").onclick = action(() => githubRepos(githubNext));
$("github-disconnect").onclick = action(async () => {
  const result = await api("/api/github/disconnect", {});
  await githubAccount();
  $("notice").textContent = result.revoked
    ? "GitHub connection removed and token revoked."
    : "GitHub connection removed locally. Finish revocation in GitHub Settings → Applications.";
  if (!result.revoked) {
    const link = document.createElement("a");
    link.href = "https://github.com/settings/connections/applications";
    link.textContent = " Open GitHub application settings";
    $("notice").append(link);
  }
});

let detailEpoch = 0;
let activeIssue,
  collaborators = [],
  activeJob,
  lastReview;
const repoAPI = (suffix) => `/api/repos/${selected}/${suffix}`;
const canWrite = () => ["writer", "admin"].includes(selectedRepo?.role);
function paragraph(text, className = "") {
  const p = document.createElement("p");
  p.textContent = text;
  p.className = className;
  return p;
}
function assignees(select, current = null) {
  select.replaceChildren(
    new Option("Unassigned", ""),
    ...collaborators.map((c) => new Option(`${c.name} · ${c.role}`, c.user)),
  );
  if (current && !collaborators.some((c) => c.user === current))
    select.add(new Option(`${current} (access unavailable)`, current));
  select.value = current ?? "";
}
function issueForm(form) {
  const b = Object.fromEntries(new FormData(form));
  return {
    ...b,
    assignee: b.assignee || null,
    labels: b.labels
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  };
}
async function showIssues() {
  $("issues-view").hidden = false;
  $("agents-view").hidden = true;
  collaborators = await api(repoAPI("collaborators"));
  $("issue-create-panel").hidden = !canWrite();
  assignees($("issue-create").elements.assignee);
  const search = new URLSearchParams(new FormData($("issue-search")));
  const { issues } = await api(repoAPI("issues") + "?" + search);
  $("issue-list").replaceChildren();
  for (const i of issues) {
    const row = document.createElement("div");
    row.className = "repo";
    const name = document.createElement("strong");
    name.textContent = `#${i.number} ${i.title}`;
    const state = document.createElement("span");
    state.textContent =
      i.state + (i.labels.length ? " · " + i.labels.join(", ") : "");
    const button = document.createElement("button");
    button.textContent = "View issue";
    button.onclick = action(() => showIssue(i.number));
    row.append(name, state, button);
    $("issue-list").append(row);
  }
  if (!issues.length)
    $("issue-list").append(paragraph("No issues in this view."));
}
async function showIssue(number) {
  const epoch = ++detailEpoch,
    repo = selected;
  $("issue-detail").hidden = true;
  const { issue, comments, audit } = await api(repoAPI("issues/" + number));
  if (epoch !== detailEpoch || repo !== selected) return;
  activeIssue = issue;
  $("issue-detail").hidden = false;
  $("issue-heading").textContent = `#${issue.number} ${issue.title}`;
  $("issue-meta").textContent =
    `${issue.state} · by ${collaborators.find((c) => c.user === issue.author)?.name ?? issue.author} · version ${issue.version} · ${new Date(issue.updated).toLocaleString()}`;
  $("issue-body").textContent = issue.body || "No description yet.";
  const form = $("issue-edit");
  form.hidden = !canWrite();
  for (const k of ["title", "body", "state"]) form.elements[k].value = issue[k];
  form.elements.labels.value = issue.labels.join(", ");
  assignees(form.elements.assignee, issue.assignee);
  $("issue-comments").replaceChildren(
    ...comments.map((c) => {
      const div = document.createElement("div");
      div.className = "comment";
      div.append(
        paragraph(
          `${collaborators.find((p) => p.user === c.author)?.name ?? c.author} · ${new Date(c.created).toLocaleString()}`,
        ),
        paragraph(c.body),
      );
      return div;
    }),
  );
  $("issue-audit").replaceChildren(
    ...audit.map((a) =>
      paragraph(
        `${a.event} · version ${a.version} · ${a.actor} · ${new Date(a.created).toLocaleString()}`,
      ),
    ),
  );
  window.history.replaceState(null, "", `?repo=${selected}&issue=${number}`);
}
$("issues").onclick = action(showIssues);
$("issue-search").onsubmit = action(showIssues);
$("issue-create").onsubmit = action(async (e) => {
  const issue = await api(repoAPI("issues"), issueForm(e.target));
  e.target.reset();
  $("issue-create-panel").open = false;
  await showIssues();
  await showIssue(issue.number);
  $("notice").textContent = "Issue created.";
});
$("issue-edit").onsubmit = action(async (e) => {
  await api(repoAPI("issues/" + activeIssue.number), {
    ...issueForm(e.target),
    version: activeIssue.version,
  });
  await showIssues();
  await showIssue(activeIssue.number);
  $("notice").textContent = "Issue saved.";
});
$("issue-comment").onsubmit = action(async (e) => {
  await api(repoAPI(`issues/${activeIssue.number}/comments`), {
    body: e.target.elements.body.value,
    version: activeIssue.version,
  });
  e.target.reset();
  await showIssue(activeIssue.number);
  $("notice").textContent = "Comment added.";
});
async function showAgents() {
  $("agents-view").hidden = false;
  $("issues-view").hidden = true;
  $("agent-policy").hidden = selectedRepo.owner !== currentActor?.id;
  $("agent-start").hidden = !canWrite();
  const policy = await api(repoAPI("agents/policy"));
  $("agent-policy").elements.publish.checked = policy.publish;
  if (!activeJob) {
    const jobs = await api(repoAPI("agents"));
    if (jobs.length) {
      lastReview = {
        sha: jobs[0].scope.sha,
        base: jobs[0].scope.base,
        paths: jobs[0].scope.paths,
      };
      await renderJob(jobs[0]);
    } else
      $("agent-status").textContent =
        "Select a commit and paths to begin. Reviews never execute source.";
  }
}
let currentActor;
$("agents").onclick = action(showAgents);
$("agent-policy").onsubmit = action(async (e) => {
  await api(repoAPI("agents/policy"), {
    publish: e.target.elements.publish.checked,
  });
  $("notice").textContent = "Finding publication policy saved.";
});
async function renderJob(job) {
  activeJob = job;
  $("agent-status").textContent =
    `${job.status} · ${job.progress}${job.error ? " · " + job.error : ""}`;
  $("agent-cancel").disabled = !["queued", "running"].includes(job.status);
  $("agent-retry").disabled = !["failed", "cancelled", "interrupted"].includes(
    job.status,
  );
  $("agent-findings").replaceChildren();
  for (const f of job.result?.findings ?? []) {
    const row = document.createElement("div");
    row.className = "finding";
    const title = document.createElement("h3");
    title.textContent = f.title;
    const source = commitLink(
      selected,
      f.sha,
      `${f.path}:${f.start}–${f.end} · ${f.sha.slice(0, 12)}`,
    );
    const evidence = document.createElement("pre");
    evidence.textContent = f.evidence;
    row.append(title, source, evidence, paragraph(f.explanation));
    $("agent-findings").append(row);
  }
  if (job.status === "completed" && !job.result?.findings.length)
    $("agent-findings").append(
      paragraph(
        "No actionable finding returned within this review scope. This is not a test result.",
      ),
    );
  if (job.result)
    $("agent-findings").append(
      paragraph(
        `Model: ${job.model}. ${job.result.requests} request(s), ${job.result.sourceBytes} source bytes. No tests run. Published issues: ${(job.published ?? []).join(", ") || "none"}.`,
      ),
    );
}
$("agent-start").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  lastReview = {
    sha: b.sha,
    paths: b.paths
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean),
    ...(b.base ? { base: b.base } : {}),
  };
  await renderJob(await api(repoAPI("agents"), lastReview));
});
$("agent-refresh").onclick = action(async () => {
  if (activeJob) await renderJob(await api(repoAPI("agents/" + activeJob.id)));
});
$("agent-cancel").onclick = action(async () => {
  if (activeJob)
    await renderJob(await api(repoAPI(`agents/${activeJob.id}/cancel`), {}));
});
$("agent-retry").onclick = action(async () => {
  if (lastReview)
    await renderJob(
      await api(repoAPI("agents"), { ...lastReview, retry: true }),
    );
});
$("bundle-import").onsubmit = action(async (e) => {
  const form = e.target,
    file = form.elements.bundle.files[0];
  if (!file) throw Error("Choose a full-history Git bundle.");
  $("notice").textContent = "Uploading private Git history…";
  const r = await fetch(
    "/api/bundles?name=" + encodeURIComponent(form.elements.name.value),
    {
      method: "POST",
      headers: {
        "content-type": "application/x-git-bundle",
        ...(credential ? { authorization: "Bearer " + credential } : {}),
      },
      body: file,
    },
  );
  const value = await r.json();
  if (!r.ok) throw Error(value.message || "Bundle import failed");
  form.reset();
  await list();
  await open(value.id);
  $("notice").textContent =
    "Private bundle imported. Retain the source until destination objects and files are verified.";
});
