"use strict";
let credential = "",
  selected;
const $ = (id) => document.getElementById(id);
$("local").hidden = !["127.0.0.1", "localhost"].includes(
  window.location.hostname,
);
async function api(path, body) {
  const headers = {};
  if (credential) headers.Authorization = "Bearer " + credential;
  if (body) headers["Content-Type"] = "application/json";
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
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
  const { repos } = await api(discovery ? "/api/discovery" : "/api/repos");
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
  $("detail").hidden = false;
  $("repo-header").textContent = r.name + " · " + r.visibility + " · " + r.id;
  $("content").textContent = JSON.stringify(r.git, null, 2);
  $("reviews").replaceChildren();
}
$("connect").onclick = action(async () => {
  credential = $("credential").value;
  $("credential").value = "";
  const p = await api("/api/me");
  $("identity").textContent = p.id + " / " + p.tenant;
  await list();
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
$("history").onclick = action(async () => {
  const logs = await api("/api/repos/" + selected + "/log");
  $("content").textContent = JSON.stringify(logs, null, 2);
  if (logs[0]) {
    const tree = await api(
      "/api/repos/" + selected + "/tree?sha=" + logs[0].tree,
    );
    $("content").textContent += "\n\n" + JSON.stringify(tree, null, 2);
  }
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
        $("notice").textContent =
          "Decision recorded; integration is a separate deferred action.";
      });
      row.append(button);
    }
    $("reviews").append(row);
  }
});
api("/api/me")
  .then((p) => {
    $("identity").textContent = p.id;
    return list();
  })
  .catch(() => {});
