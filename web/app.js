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
function action(fn) {
  return async (e) => {
    e?.preventDefault();
    try {
      $("notice").textContent = "";
      await fn(e);
    } catch (err) {
      $("notice").textContent = err.message;
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
  $("git-credential").hidden = true;
  $("git-secret").value = "";
  $("files").replaceChildren();
  $("commit-list").replaceChildren();
  $("detail").hidden = false;
  $("repo-header").textContent = r.name + " · " + r.visibility + " · " + r.id;
  $("content").textContent = JSON.stringify(r.git, null, 2);
  $("task").hidden = !!r.parent;
  $("proposal").hidden = !!r.parent;
  $("reviews").replaceChildren();
}
$("connect").onclick = action(async () => {
  credential = $("credential").value;
  $("credential").value = "";
  const p = await api("/api/me");
  $("identity").textContent = p.id + " / " + p.tenant;
  await list();
  await restoreRoute();
});
$("local").onclick = action(async () => {
  const r = await fetch("/__local_identity");
  if (!r.ok)
    throw Error("Local identity is only available in the loopback harness.");
  const v = await r.json();
  credential = v.credential;
  $("environment").textContent = "LOCAL: filesystem storage + bare Git";
  const p = await api("/api/me");
  $("identity").textContent = p.id;
  await list();
  await restoreRoute();
});
$("mine").onclick = action(() => list());
$("discover").onclick = action(() => list(true));
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
  $("profile-view").hidden = false;
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
    for (const status of ["approved", "rejected"]) {
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
    if (p.status === "approved") {
      const merge = document.createElement("button");
      merge.textContent = "Merge approved candidate";
      merge.onclick = action(async () => {
        const r = await api("/api/repos/" + selected + "/merge", { id: p.id });
        $("notice").textContent = "Merged " + r.candidate;
      });
      row.append(merge);
    }
    $("reviews").append(row);
  }
});
async function restoreRoute() {
  const u = new URL(location.href),
    id = u.searchParams.get("repo"),
    sha = u.searchParams.get("commit");
  if (id && sha) await showCommit(id, sha);
  else if (id) await open(id);
}
api("/api/me")
  .then((p) => {
    $("identity").textContent = p.id;
    return list().then(restoreRoute);
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
  $("identity").textContent = p.id + " / " + p.tenant;
});
$("accept-invite").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  await api("/api/invites/" + encodeURIComponent(b.invite), {});
  $("notice").textContent = "Invitation accepted.";
  await list();
});
const pendingInvite = new URL(location.href).searchParams.get("invite");
if (pendingInvite) $("accept-invite").elements.invite.value = pendingInvite;
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
