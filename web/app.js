"use strict";
// Braid workspace client. Plain DOM, no framework; every string is set via textContent.
let credential = "",
  selected,
  selectedRepo,
  discoveryView = false,
  refreshFlight,
  currentActor,
  allRepos = [],
  headLog = [];
const ZERO = "0".repeat(40);
const $ = (id) => document.getElementById(id);
const isLocal = ["127.0.0.1", "localhost"].includes(window.location.hostname);
$("local").hidden = !isLocal;

async function api(path, body, retry = true, method = body ? "POST" : "GET") {
  const headers = {};
  if (credential) headers.Authorization = "Bearer " + credential;
  if (body) headers["Content-Type"] = "application/json";
  const r = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 401 && !credential && retry) {
    refreshFlight ||= fetch("/auth/refresh", { method: "POST" })
      .then((r) => {
        if (!r.ok) throw Error("Your session ended. Please sign in again.");
      })
      .finally(() => {
        refreshFlight = undefined;
      });
    await refreshFlight;
    return api(path, body, false, method);
  }
  const type = r.headers.get("content-type");
  const v = type?.includes("json") ? await r.json() : await r.text();
  if (!r.ok) throw Error(friendly(v.message || v || "Something went wrong."));
  return v;
}

// Server messages are precise but terse; translate the common ones into plain language.
const FRIENDLY = {
  "Not found": "That isn't available. It may have been removed, or you no longer have access.",
  "Authentication required": "Please sign in again.",
  "Canonical head moved; new proposal required":
    "This repository changed after these changes were proposed. Propose them again from the latest version. If an agent made them, open its run in Agents and choose Catch up.",
  "An approved proposal is required": "Approve these changes before braiding them in.",
  "Publication uncertain; reconcile retained intent before retrying":
    "We couldn't confirm the braid finished. Run Check repository in Settings, then try again.",
  "Publication disabled or unconfirmed":
    "Public repositories aren't enabled here, or the confirmation didn't match.",
  "Read-only review runtime unavailable":
    "Automated reviews aren't available on this server.",
  "Review runtime unavailable": "Automated reviews aren't available right now.",
  "Issue changed. Reload before saving.":
    "Someone else updated this issue. Reopen it to see their changes, then save again.",
  "Invalid proposal": "Those commits don't line up with this repository. Pick a strand and try again.",
  "Commit unavailable": "That commit couldn't be found.",
  "Invitation unavailable": "This invitation has expired or was already used.",
  "Sign in with the invitation's verified email":
    "This invitation was sent to a different email address. Sign in with that address to accept it.",
  "Tasks fork canonical repositories":
    "Strands can only be started from the original repository.",
  "Browse limited to 1 MiB": "This file is too large to show here (over 1 MB).",
  "Invalid ref": "That branch, tag or commit doesn't exist.",
  "Invalid path": "That file path isn't valid.",
  "Already reviewed": "These changes were already reviewed.",
  "Task repositories remain private": "Strands always stay private.",
  "GitHub connection unavailable": "GitHub import isn't available on this server.",
};
const friendly = (m) => FRIENDLY[m] ?? m;

/* ---------- small DOM helpers ---------- */
function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node[k] = v;
    else if (k in node && k !== "list") node[k] = v;
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat())
    if (c !== null && c !== undefined && c !== false)
      node.append(typeof c === "string" ? document.createTextNode(c) : c);
  return node;
}
const SVG = "http://www.w3.org/2000/svg";
const ICONS = {
  repo: "M4 2.5h7.5a1 1 0 0 1 1 1v10H5A1.5 1.5 0 0 1 3.5 12V3a.5.5 0 0 1 .5-.5zM3.5 12A1.5 1.5 0 0 1 5 10.5h7.5",
  folder: "M1.75 4a1 1 0 0 1 1-1h3.1l1.4 1.5h6a1 1 0 0 1 1 1v6.75a1 1 0 0 1-1 1H2.75a1 1 0 0 1-1-1z",
  file: "M4 1.75h5l3 3v9.5H4zM9 1.75v3h3",
  submodule: "M4 1.75h8v12.5H4zM6.5 5h3M6.5 8h3",
  up: "M8 13V3M3.5 7.5 8 3l4.5 4.5",
  open: "M8 2.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM8 7.25a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5z",
  closed: "M8 2.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM5.75 8.25l1.5 1.5 3-3.25",
  change:
    "M4 2a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM4 11a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 11a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM4 5v6M12 11V6.5a2 2 0 0 0-2-2H7.5",
  commit: "M8 5.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM1.5 8h4M10.5 8h4",
  lock: "M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3.5 7h9v6.5h-9z",
  globe: "M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2zM2 8h12M8 2c1.8 1.7 2.5 3.8 2.5 6S9.8 12.3 8 14M8 2C6.2 3.7 5.5 5.8 5.5 8s.7 4.3 2.5 6",
  person: "M8 2.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 13.5c.6-2.4 2.6-4 5-4s4.4 1.6 5 4",
};
function icon(name, cls = "") {
  const s = document.createElementNS(SVG, "svg");
  s.setAttribute("viewBox", "0 0 16 16");
  s.setAttribute("aria-hidden", "true");
  s.setAttribute("class", "icon " + cls);
  const p = document.createElementNS(SVG, "path");
  p.setAttribute("d", ICONS[name]);
  s.append(p);
  return s;
}
const short = (sha) => (sha ? sha.slice(0, 7) : "");
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
const ROLE = {
  reader: "Read",
  contributor: "Contribute",
  writer: "Write",
  admin: "Admin",
};
function badge(text, kind = "") {
  return el("span", { class: "badge" + (kind ? " badge-" + kind : ""), text });
}
function when(value) {
  if (!value) return "";
  const t = typeof value === "number" && value < 1e12 ? value * 1000 : value;
  const d = new Date(t);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return plural(Math.floor(diff / 60), "minute") + " ago";
  if (diff < 86400) return plural(Math.floor(diff / 3600), "hour") + " ago";
  if (diff < 86400 * 7) return plural(Math.floor(diff / 86400), "day") + " ago";
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
}
function fullDate(value) {
  const t = typeof value === "number" && value < 1e12 ? value * 1000 : value;
  return new Date(t).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
async function copy(text, what = "Copied") {
  await navigator.clipboard.writeText(text);
  say(what + " to clipboard.");
}
// A short SHA chip: shows 7 characters, full value on hover, click copies (or navigates).
function shaChip(sha, onclick) {
  return el("button", {
    type: "button",
    class: "sha",
    text: short(sha),
    title: onclick ? `View commit ${sha}` : `Copy ${sha}`,
    "aria-label": onclick ? `View commit ${short(sha)}` : `Copy commit ID ${short(sha)}`,
    onclick: onclick ?? action(() => copy(sha, "Commit ID copied")),
  });
}
function say(text) {
  $("notice").textContent = text;
}
$("notice-close").onclick = () => say("");

let pendingActions = 0;
function action(fn) {
  return async (e) => {
    e?.preventDefault?.();
    const button =
      e?.submitter ??
      (e?.currentTarget instanceof HTMLButtonElement ? e.currentTarget : null);
    if (button?.getAttribute("aria-busy") === "true") return;
    button?.setAttribute("aria-busy", "true");
    pendingActions++;
    $("workspace").setAttribute("aria-busy", "true");
    document.body.classList.add("busy");
    try {
      say("");
      await fn(e);
    } catch (err) {
      say(friendly(err.message));
    } finally {
      button?.removeAttribute("aria-busy");
      if (!--pendingActions) {
        $("workspace").removeAttribute("aria-busy");
        document.body.classList.remove("busy");
      }
    }
  };
}

/* ---------- views, menus, navigation ---------- */
const VIEWS = {
  signin: "signin-view",
  overview: "overview",
  new: "new-view",
  github: "github-view",
  profile: "profile-view",
  account: "account-view",
  repository: "detail",
};
function workspaceView(view) {
  const changed = $("workspace").dataset.view !== view;
  $("workspace").dataset.view = view;
  document.body.classList.toggle("signed-out", view === "signin");
  for (const [name, id] of Object.entries(VIEWS)) $(id).hidden = name !== view;
  const current =
    view === "profile"
      ? "profile"
      : view === "overview" && discoveryView
        ? "discover"
        : ["overview", "repository"].includes(view)
          ? "mine"
          : null;
  for (const id of ["mine", "discover", "profile"])
    if (id === current) $(id).setAttribute("aria-current", "page");
    else $(id).removeAttribute("aria-current");
  closeMenus();
  if (changed) window.scrollTo({ top: 0 });
}
function closeMenus() {
  for (const id of ["new-menu", "account-menu"]) $(id).hidden = true;
  for (const id of ["new-button", "account-button"])
    $(id).setAttribute("aria-expanded", "false");
  setClone(false);
}
function menuToggle(buttonId, menuId) {
  $(buttonId).onclick = (e) => {
    e.stopPropagation();
    const open = $(menuId).hidden;
    closeMenus();
    $(menuId).hidden = !open;
    $(buttonId).setAttribute("aria-expanded", String(open));
    if (open) $(menuId).querySelector("button")?.focus();
  };
}
menuToggle("new-button", "new-menu");
menuToggle("account-button", "account-menu");
document.addEventListener("click", (e) => {
  if (!e.target.closest(".menu-wrap")) closeMenus();
});
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const openMenu = ["new-menu", "account-menu", "git-credential"].find(
    (id) => !$(id).hidden,
  );
  if (!openMenu) return;
  closeMenus();
  $(
    { "new-menu": "new-button", "account-menu": "account-button" }[openMenu] ??
      "clone",
  ).focus();
});
function home() {
  window.history.replaceState(null, "", location.pathname);
}
const destinations = {
  overview: async () => {
    discoveryView = false;
    home();
    workspaceView("overview");
    await list(false);
  },
  new: async () => {
    home();
    workspaceView("new");
    $("create").elements.name.focus();
  },
  bundle: async () => {
    home();
    workspaceView("new");
    $("bundle-section").scrollIntoView({ block: "start" });
    $("bundle-import").elements.bundle.focus();
  },
  github: async () => {
    home();
    workspaceView("github");
    await githubAccount();
  },
  profile: () => showProfile(),
  account: async () => {
    home();
    renderAccount();
    workspaceView("account");
  },
  invite: async () => {
    discoveryView = false;
    home();
    workspaceView("overview");
    $("accept-invite").hidden = false;
    $("accept-invite").elements.invite.focus();
    await list(false);
  },
};
document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-go]");
  if (target && destinations[target.dataset.go])
    action(destinations[target.dataset.go])(e);
});
$("mine").onclick = action(async () => {
  $("query").value = "";
  await destinations.overview();
});
$("discover").onclick = action(async () => {
  $("query").value = "";
  discoveryView = true;
  home();
  workspaceView("overview");
  await list(true);
});
$("profile").onclick = action(() => showProfile());
$("search").onsubmit = action(async () => {
  if ($("workspace").dataset.view !== "overview") {
    home();
    workspaceView("overview");
  }
  await list(discoveryView);
});

/* ---------- identity ---------- */
function renderIdentity(p) {
  const name = p.name ?? p.id;
  $("identity").textContent = name;
  $("identity-sub").textContent =
    p.email ?? (isLocal && credential ? "Local test server" : "");
  $("avatar").textContent =
    name
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("") || "?";
}
function renderAccount() {
  const p = currentActor ?? {};
  const rows = [
    ["Name", p.name ?? "Not set"],
    ["Email", p.email ? p.email + (p.emailVerified ? " (verified)" : "") : "Not shared"],
    ["Account ID", p.id],
    ["Organization", p.tenant],
  ];
  $("account-details").replaceChildren(
    ...rows.flatMap(([k, v]) => [
      el("dt", { text: k }),
      el("dd", { class: k.endsWith("ID") || k === "Organization" ? "mono" : "", text: v ?? "" }),
    ]),
  );
}
async function signedIn() {
  const p = await api("/api/me");
  currentActor = p;
  renderIdentity(p);
  workspaceView("overview");
  await list(false);
  await restoreRoute();
  await githubAccount();
}
$("connect").onclick = action(async () => {
  credential = $("credential").value;
  $("credential").value = "";
  await signedIn();
});
$("local").onclick = action(async () => {
  const r = await fetch("/__local_identity");
  if (!r.ok)
    throw Error("The local test identity only works on the local test server.");
  credential = (await r.json()).credential;
  await signedIn();
});
$("organization").onsubmit = action(async (e) => {
  const r = await fetch("/auth/organization", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.fromEntries(new FormData(e.target))),
  });
  if (!r.ok)
    throw Error(
      "Couldn't switch organization. Check that you're an active member.",
    );
  const p = await api("/api/me");
  currentActor = p;
  renderIdentity(p);
  renderAccount();
  say("Organization switched.");
});

/* ---------- repository list ---------- */
async function list(discovery = discoveryView) {
  discoveryView = discovery;
  const q = $("query").value.trim();
  const { repos } = await api(
    (discovery ? "/api/discovery" : "/api/repos") + "?q=" + encodeURIComponent(q),
  );
  if (!discovery && !q) allRepos = repos;
  $("view-title").textContent = discovery ? "Explore" : "Repositories";
  $("view-subtitle").textContent = q
    ? `Results for “${q}”`
    : discovery
      ? "Public repositories in your organization."
      : "Your private repositories and the ones shared with you.";
  $("overview-actions").hidden = discovery;
  const byId = new Map(allRepos.map((r) => [r.id, r]));
  // Strands live inside their repository's strand map; list them on their own
  // only when searching or when their parent isn't visible to this viewer.
  const shown = repos.filter(
    (r) => discovery || q || !(r.parent && byId.has(r.parent)),
  );
  $("repos").replaceChildren(
    ...shown.map((r) => {
      const name = el("button", {
        type: "button",
        class: "link-button",
        text: r.name,
        onclick: action(() => open(r.id)),
      });
      const parent = r.parent ? byId.get(r.parent) : null;
      const sub =
        r.state === "creating"
          ? "Import in progress"
          : r.state === "failed"
            ? "Import didn't finish. Open it and check Settings › Troubleshooting."
            : r.parent
              ? `Strand of ${parent?.name ?? "another repository"}`
              : r.owner !== currentActor?.id
                ? "Shared with you"
                : "";
      return el(
        "div",
        { class: "repo row", "data-id": r.id },
        icon(r.parent ? "change" : "repo", "row-icon"),
        el(
          "div",
          { class: "row-main" },
          el("div", { class: "row-title" }, name),
          sub ? el("span", { class: "row-sub", text: sub }) : null,
        ),
        el(
          "div",
          { class: "row-side" },
          r.state === "creating"
            ? badge("Importing", "creating")
            : r.state === "failed"
              ? badge("Failed", "failed")
              : null,
          badge(r.visibility === "public" ? "Public" : "Private"),
        ),
      );
    }),
  );
  window.Braid?.decorateRepos($("repos"), repos, { discovery });
  const empty = !repos.length;
  $("repos-empty").hidden = !empty;
  if (empty) {
    $("repos-empty-title").textContent = q
      ? "No matching repositories"
      : discovery
        ? "Nothing to explore yet"
        : "No repositories yet";
    $("repos-empty-text").textContent = q
      ? "Try a different name, or clear the search."
      : discovery
        ? "When someone in your organization makes a repository public, it shows up here."
        : "Bring your projects over from GitHub, or start something new.";
    $("repos-empty-actions").hidden = !!q || discovery;
  }
  // The empty state carries the same actions; avoid showing them twice.
  if (!discovery) $("overview-actions").hidden = empty && !q;
}

/* ---------- create & import ---------- */
$("create").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  if (!b.url) delete b.url;
  const repo = await api("/api/repos", b);
  e.target.reset();
  await list(false);
  await open(repo.id);
  say(b.url ? `Created ${repo.name} and started copying its history.` : `Created ${repo.name}.`);
});
$("bundle-import").onsubmit = action(async (e) => {
  const form = e.target,
    file = form.elements.bundle.files[0];
  if (!file) throw Error("Choose a Git bundle file to upload.");
  say("Uploading your bundle…");
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
  if (!r.ok) throw Error(friendly(value.message || "The bundle upload failed."));
  form.reset();
  await list(false);
  await open(value.id);
  say("Bundle imported. Keep your original copy until you've checked this one.");
});

/* ---------- GitHub import ---------- */
let githubPage = 1,
  githubNext = null,
  githubQuery = "",
  githubFlight = false;
async function githubAccount() {
  let account;
  try {
    account = await api("/api/github");
  } catch {
    account = { connected: false, setupReady: false };
  }
  $("github-account").textContent = account.connected
    ? `Connected as @${account.login}`
    : account.setupReady
      ? "Connect your GitHub account"
      : "GitHub import isn't set up here yet";
  $("github-account-help").textContent = account.connected
    ? "Only your public repositories are listed. Everything you import stays private."
    : account.setupReady
      ? "We'll list your public repositories so you can pick which ones to bring over."
      : "You can still copy any public repository by its URL from New repository.";
  const connect = $("github-connect");
  connect.textContent = account.connected ? "Reconnect" : "Connect GitHub";
  connect.className = "btn " + (account.connected ? "btn-ghost" : "btn-primary");
  connect.hidden = !account.connected && !account.setupReady;
  $("github-disconnect").hidden = !account.connected;
  $("github-import-all").hidden = !account.connected;
  $("github-picker").hidden = !account.connected;
  $("github-repos").replaceChildren();
  if (account.connected) await githubRepos(1);
}
function importBadge(imports) {
  if (imports.some((i) => i.state === "ready")) return badge("Imported", "imported");
  if (imports.some((i) => i.state === "creating")) return badge("Importing", "importing");
  if (imports.some((i) => i.state === "failed")) return badge("Failed", "failed");
  return null;
}
async function githubRepos(page) {
  if (githubFlight) return;
  githubFlight = true;
  $("github-status").textContent = "Loading your repositories…";
  $("github-previous").disabled = $("github-next").disabled = true;
  try {
    const data = await api(
      `/api/github/repos?page=${page}&q=${encodeURIComponent(githubQuery)}`,
    );
    githubPage = data.page;
    githubNext = data.nextPage;
    $("github-repos").replaceChildren(
      ...data.repos.map((repo) => {
        const ready = repo.imports.find((i) => i.state === "ready");
        const creating = repo.imports.some((i) => i.state === "creating");
        const button = el("button", {
          type: "button",
          class: "btn btn-secondary",
          text: ready ? "Open" : creating ? "Importing…" : "Import",
          "aria-label": `${ready ? "Open" : "Import"} ${repo.fullName}`,
          disabled: !ready && creating,
        });
        button.onclick = action(async () => {
          if (ready) return open(ready.id);
          button.disabled = true;
          button.textContent = "Importing…";
          try {
            const imported = await api("/api/github/import", {
              repository: repo.fullName,
            });
            await list(false);
            say(
              imported.state === "ready"
                ? `Imported ${repo.fullName}. It's private to you.`
                : `Importing ${repo.fullName}. It'll show up in Repositories when it's done.`,
            );
          } finally {
            button.disabled = false;
          }
          await githubRepos(githubPage);
        });
        return el(
          "div",
          { class: "repo row" },
          icon("repo", "row-icon"),
          el(
            "div",
            { class: "row-main" },
            el(
              "div",
              { class: "row-title" },
              el("strong", { text: repo.fullName }),
              repo.fork ? badge("Fork") : null,
              importBadge(repo.imports),
            ),
            repo.description
              ? el("span", { class: "row-sub", text: repo.description })
              : null,
          ),
          el("div", { class: "row-side" }, button),
        );
      }),
    );
    $("github-page").textContent = `Page ${githubPage}`;
    $("github-status").textContent = data.searchLimited
      ? "GitHub limits search results. Try a more specific name."
      : data.repos.length
        ? "Imported repositories are private until you choose to share them."
        : githubQuery
          ? `No repositories match “${githubQuery}”.`
          : "No public repositories on this page.";
  } catch (e) {
    $("github-status").textContent = friendly(e.message);
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
  say(
    result.revoked
      ? "GitHub disconnected."
      : "GitHub disconnected here. To fully revoke access, remove Braid in your GitHub settings.",
  );
  if (!result.revoked)
    $("notice").append(
      " ",
      el("a", {
        href: "https://github.com/settings/connections/applications",
        text: "Open GitHub settings",
      }),
    );
});
// Imports every public repository the connected account owns, one at a time.
// Already-imported or in-flight sources are skipped; failures do not stop the run.
$("github-import-all").onclick = action(async () => {
  const button = $("github-import-all");
  button.disabled = true;
  const pending = [];
  try {
    for (let page = 1; page; ) {
      say(`Finding your public repositories (page ${page})…`);
      const data = await api(`/api/github/repos?page=${page}&q=`);
      for (const repo of data.repos)
        if (!repo.imports.some((i) => ["ready", "creating"].includes(i.state)))
          pending.push(repo.fullName);
      page = data.nextPage;
    }
    let done = 0;
    const failed = [];
    for (const name of pending) {
      say(`Importing ${name} (${done + failed.length + 1} of ${pending.length})…`);
      try {
        await api("/api/github/import", { repository: name });
        done++;
      } catch (e) {
        failed.push(`${name} (${friendly(e.message)})`);
      }
    }
    await list(false);
    say(
      pending.length
        ? `Imported ${done} of ${plural(pending.length, "repository").replace("repositorys", "repositories")}.` +
            (failed.length ? ` Couldn't import: ${failed.join(", ")}.` : "")
        : "All your public repositories are already imported.",
    );
    await githubRepos(1);
  } finally {
    button.disabled = false;
  }
});

/* ---------- repository page ---------- */
let detailEpoch = 0;
let activeIssue,
  collaborators = [],
  activeJob,
  lastReview,
  activeProposal,
  activeStrand,
  proposals = [],
  code = { ref: "HEAD", root: null, crumbs: [], logs: [] };
const repoAPI = (suffix) => `/api/repos/${selected}/${suffix}`;
const canWrite = () => ["writer", "admin"].includes(selectedRepo?.role);
const TABS = {
  "tab-code": "code",
  issues: "issues",
  proposals: "changes",
  agents: "reviews",
  "tab-agents": "agents",
  "tab-settings": "settings",
};
const PANELS = {
  code: "code-view",
  issues: "issues-view",
  changes: "proposals-view",
  reviews: "agents-view",
  agents: "agent-runs-view",
  settings: "settings-view",
};
function repositoryMode(mode) {
  $("detail").dataset.mode = mode;
  for (const [m, id] of Object.entries(PANELS)) $(id).hidden = m !== mode;
  for (const [id, m] of Object.entries(TABS))
    if (m === mode) $(id).setAttribute("aria-current", "page");
    else $(id).removeAttribute("aria-current");
  setClone(false);
}
function route(extra = "") {
  window.history.replaceState(null, "", `?repo=${selected}${extra}`);
}
async function open(id, { showSource = true } = {}) {
  const r = await api("/api/repos/" + id);
  selected = id;
  selectedRepo = r;
  detailEpoch++;
  activeJob = activeIssue = activeProposal = undefined;
  headLog = [];
  workspaceView("repository");
  repositoryMode("code");
  $("issue-detail").hidden = true;
  $("invite-result").hidden = true;
  $("reconcile-result").hidden = true;
  $("git-secret").value = "";
  $("task").hidden = $("proposal").hidden = true;
  // Drop the previous repository's code so it never flashes or lingers.
  $("files").replaceChildren();
  $("commit-meta").replaceChildren();
  codeSection([]);
  $("tab-settings").hidden = r.role !== "admin";
  $("tab-agents").hidden = !!r.parent;
  $("new-task").hidden =
    !!r.parent || !["contributor", "writer", "admin"].includes(r.role);
  $("new-proposal").hidden = !!r.parent;

  // Header: owner / name, visibility, and where a task came from.
  const ownerName =
    r.owner === currentActor?.id
      ? (currentActor.name ?? currentActor.id)
      : "Shared";
  $("repo-header").replaceChildren(
    el("button", {
      type: "button",
      class: "owner",
      text: ownerName,
      title: "All repositories",
      onclick: action(destinations.overview),
    }),
    el("span", { class: "sep", text: "/", "aria-hidden": "true" }),
    el("strong", { text: r.name }),
  );
  $("repo-visibility").textContent = r.visibility === "public" ? "Public" : "Private";
  const parent = r.parent ? allRepos.find((x) => x.id === r.parent) : null;
  $("repo-parent").hidden = !r.parent;
  $("repo-parent").replaceChildren(
    r.parent
      ? parent
        ? el(
            "span",
            {},
            "Strand of ",
            el("button", {
              type: "button",
              text: parent.name,
              onclick: action(() => open(parent.id)),
            }),
          )
        : "Strand of another repository"
      : "",
  );
  $("proposals-view").querySelector(".toolbar-text").textContent = r.parent
    ? "This is a strand. Push commits here, then propose them from the original repository's Strands tab."
    : "Every change starts as a strand: a private fork pinned to a commit. Proposals are reviewed, then braided in.";
  activeStrand = undefined;
  if (r.parent || !r.role) window.Braid?.hide();
  else window.Braid?.showRepo(r);
  if (r.owner !== currentActor?.id)
    api(repoAPI("collaborators"))
      .then((people) => {
        const owner = people.find((x) => x.user === r.owner);
        if (owner && selected === id)
          $("repo-header").querySelector(".owner").textContent = owner.name;
      })
      .catch(() => {});
  route();
  if (showSource) await showCode();
}

/* --- Clone popover --- */
function setClone(open) {
  $("git-credential").hidden = !open;
  $("clone").setAttribute("aria-expanded", String(open));
}
$("clone").onclick = (e) => {
  e.stopPropagation();
  const opening = $("git-credential").hidden;
  closeMenus();
  if (!opening) return;
  setClone(true);
  $("git-remote").value = selectedRepo.git?.remote ?? "";
  $("git-scope").value = selectedRepo.parent ? "write" : "read";
  $("git-help").textContent = selectedRepo.parent
    ? "Choose Read and write to push your commits to this strand."
    : "To change this repository, push to a strand and propose your changes.";
  $("git-remote").focus();
  $("git-remote").select();
};
$("git-remote-copy").onclick = action(() => copy($("git-remote").value, "Git address copied"));
$("git-mint").onclick = action(async () => {
  const t = await api(repoAPI("token"), { scope: $("git-scope").value });
  if (!t.plaintext)
    throw Error(
      "This server doesn't hand out Git passwords. Use the Git address directly.",
    );
  $("git-secret").value = t.plaintext;
  $("git-help").textContent =
    `Password ready. It expires ${when(t.expiresAt) === "just now" ? "in a minute" : "at " + new Date(t.expiresAt).toLocaleTimeString()} and is cleared from this page after 60 seconds.`;
  setTimeout(() => {
    $("git-secret").value = "";
  }, 60000);
});
$("git-copy").onclick = action(() => {
  if (!$("git-secret").value) throw Error("Generate a password first.");
  return copy($("git-secret").value, "Password copied");
});

/* --- Tabs --- */
$("tab-code").onclick = action(async () => {
  route();
  await showCode();
});
$("issues").onclick = action(async () => {
  route("&tab=issues");
  await showIssues();
});
$("proposals").onclick = action(async () => {
  route("&tab=changes");
  await showProposals();
});
$("agents").onclick = action(async () => {
  route("&tab=reviews");
  await showAgents();
});
$("tab-agents").onclick = action(async () => {
  route("&tab=agents");
  await showAgentRuns();
});
$("tab-settings").onclick = action(async () => {
  route("&tab=settings");
  await showSettings();
});

/* --- Code --- */
function codeSection(which) {
  for (const id of ["code-browser", "file-view", "readme-view", "commits-view", "commit-view", "empty-repo"])
    $(id).hidden = !which.includes(id);
}
async function ensureHeadLog() {
  if (!headLog.length) headLog = await api(repoAPI("log"));
  return headLog;
}
function refOptions() {
  const branch = selectedRepo.git?.defaultBranch;
  $("ref-options").replaceChildren(
    ...["HEAD", ...(branch ? [branch] : [])].map((v) => el("option", { value: v })),
  );
}
async function showCode(ref = "HEAD") {
  repositoryMode("code");
  refOptions();
  const logs = await api(repoAPI("log") + "?ref=" + encodeURIComponent(ref));
  if (ref === "HEAD") headLog = logs;
  $("ref-input").value = ref === "HEAD" ? (selectedRepo.git?.defaultBranch ?? "HEAD") : ref;
  if (!logs.length) {
    if (ref !== "HEAD" && ref !== selectedRepo.git?.defaultBranch)
      throw Error(`Nothing found for “${ref}”. Check the branch, tag or commit.`);
    code = { ref, root: null, crumbs: [], logs };
    $("breadcrumbs").replaceChildren(el("span", { class: "current", text: selectedRepo.name }));
    $("history").hidden = true;
    $("empty-repo-text").textContent = selectedRepo.parent
      ? "Nothing has been pushed to this strand yet. Use Clone to get its address and a password, then push your commits."
      : "Nothing has been braided in yet. Here's how to add your first commits:";
    $("empty-repo").querySelector(".steps").hidden = !!selectedRepo.parent;
    codeSection(["empty-repo"]);
    return;
  }
  $("history").hidden = false;
  code = { ref, root: logs[0].tree, crumbs: [], logs };
  renderLatest(logs);
  await showTree(logs[0].tree, [], ref);
}
function renderLatest(logs) {
  const c = logs[0];
  $("latest-commit").hidden = !c;
  if (!c) return;
  const first = (c.message ?? "").split("\n")[0];
  $("latest-commit").replaceChildren(
    icon("commit", "row-icon"),
    el("span", { class: "message", text: first, title: c.message }),
    shaChip(c.sha, action(() => showCommit(selected, c.sha))),
    el("span", {
      class: "muted",
      text: logs.length >= 50 ? "50+ commits" : plural(logs.length, "commit"),
    }),
  );
}
function crumbBar(crumbs, file) {
  const parts = [
    crumbs.length || file
      ? el("button", {
          type: "button",
          text: selectedRepo.name,
          onclick: action(() => showTree(code.root, [], code.ref)),
        })
      : el("span", { class: "current", text: selectedRepo.name }),
  ];
  crumbs.forEach((c, i) => {
    parts.push(el("span", { class: "sep", text: "/", "aria-hidden": "true" }));
    const last = i === crumbs.length - 1 && !file;
    parts.push(
      last
        ? el("span", { class: "current", text: c.name })
        : el("button", {
            type: "button",
            text: c.name,
            onclick: action(() => showTree(c.sha, crumbs.slice(0, i + 1), code.ref)),
          }),
    );
  });
  if (file) {
    parts.push(el("span", { class: "sep", text: "/", "aria-hidden": "true" }));
    parts.push(el("span", { class: "current", text: file }));
  }
  $("breadcrumbs").replaceChildren(...parts);
}
async function showTree(sha, crumbs, ref, keep = []) {
  const tree = (await api(repoAPI("tree") + "?sha=" + sha)) || [];
  code.crumbs = crumbs;
  code.ref = ref;
  const prefix = crumbs.map((c) => c.name + "/").join("");
  crumbBar(crumbs);
  const sorted = [...tree].sort(
    (a, b) =>
      (a.type === "tree" ? 0 : 1) - (b.type === "tree" ? 0 : 1) ||
      a.name.localeCompare(b.name),
  );
  const rows = [];
  if (crumbs.length)
    rows.push(
      el(
        "div",
        { class: "row parent" },
        icon("up", "row-icon"),
        el("button", {
          type: "button",
          class: "file-link",
          text: "..",
          "aria-label": "Up to parent folder",
          onclick: action(() =>
            showTree(
              crumbs.length > 1 ? crumbs.at(-2).sha : code.root,
              crumbs.slice(0, -1),
              ref,
            ),
          ),
        }),
      ),
    );
  for (const f of sorted) {
    const kind = f.type === "tree" ? "folder" : f.type === "commit" ? "submodule" : "file";
    rows.push(
      el(
        "div",
        { class: "row" },
        icon(kind, "row-icon " + kind),
        kind === "submodule"
          ? el("span", { class: "file-link", text: f.name + " (submodule)" })
          : el("button", {
              type: "button",
              class: "file-link",
              text: f.name,
              "aria-label": (kind === "folder" ? "Folder " : "File ") + prefix + f.name,
              onclick: action(() =>
                kind === "folder"
                  ? showTree(f.hash, [...crumbs, { name: f.name, sha: f.hash }], ref)
                  : showFile(prefix + f.name, ref, crumbs),
              ),
            }),
      ),
    );
  }
  if (!rows.length) rows.push(el("p", { class: "empty-inline", text: "This folder is empty." }));
  $("files").replaceChildren(...rows);
  $("latest-commit").hidden = !!crumbs.length || !code.logs.length;
  const readme = tree.find(
    (f) => f.type === "blob" && /^readme(\.(md|markdown|txt|rst))?$/i.test(f.name),
  );
  codeSection(["code-browser", ...keep, ...(readme ? ["readme-view"] : [])]);
  if (readme) {
    const text = await api(
      repoAPI("file") + "?ref=" + encodeURIComponent(ref) + "&path=" + encodeURIComponent(prefix + readme.name),
    );
    const body = $("readme-body");
    body.classList.toggle("plain", !/\.(md|markdown)$/i.test(readme.name));
    body.replaceChildren(
      ...(/\.(md|markdown)$/i.test(readme.name) || !readme.name.includes(".")
        ? markdown(text)
        : [el("pre", { text })]),
    );
    $("readme-view").querySelector(".code-box-head span").textContent = readme.name;
  }
}
async function showFile(path, ref, crumbs) {
  const text = await api(
    repoAPI("file") + "?ref=" + encodeURIComponent(ref) + "&path=" + encodeURIComponent(path),
  );
  crumbBar(crumbs, path.split("/").at(-1));
  $("file-path").textContent = path.split("/").at(-1);
  const lines = text.split("\n").length - (text.endsWith("\n") ? 1 : 0);
  const size = new Blob([text]).size;
  $("file-meta").textContent = `${plural(lines, "line")} · ${size < 1024 ? size + " bytes" : (size / 1024).toFixed(1) + " KB"}`;
  $("content").textContent = text;
  codeSection(["file-view"]);
}
$("browse").onsubmit = action(async (e) => {
  const ref = new FormData(e.target).get("ref").trim() || "HEAD";
  await showCode(ref);
});
$("history").onclick = action(async () => {
  const logs = code.logs.length ? code.logs : await ensureHeadLog();
  $("commits-note").textContent = logs.length >= 50 ? "Latest 50" : "";
  $("commit-list").replaceChildren(
    ...logs.map((c) => {
      const [first] = (c.message ?? "").split("\n");
      const author = c.author?.name;
      const at = c.authoredAt ?? c.author?.timestamp;
      return el(
        "div",
        { class: "row" },
        icon("commit", "row-icon"),
        el(
          "div",
          { class: "row-main" },
          el("a", {
            href: `?repo=${selected}&commit=${c.sha}`,
            text: first || "(no message)",
            onclick: action(() => showCommit(selected, c.sha)),
          }),
          author || at
            ? el("span", {
                class: "row-sub",
                text: [author, at ? when(at) : ""].filter(Boolean).join(" · "),
              })
            : null,
        ),
        el("div", { class: "row-side" }, shaChip(c.sha)),
      );
    }),
  );
  crumbBar([]);
  codeSection(["commits-view"]);
});
async function showCommit(id, sha) {
  $("commit-meta").replaceChildren();
  if (selected !== id || $("detail").hidden) await open(id, { showSource: false });
  repositoryMode("code");
  refOptions();
  const c = await api(`/api/repos/${id}/commit?sha=${sha}`);
  window.history.replaceState(null, "", `?repo=${id}&commit=${sha}`);
  const [title, ...rest] = c.message.split("\n");
  $("commit-title").textContent = title || "(no message)";
  const body = rest.join("\n").trim();
  $("commit-body").hidden = !body;
  $("commit-body").textContent = body;
  const person = (p) => `${p.name} <${p.email}>`;
  const meta = [
    ["Commit", el("span", { class: "mono", text: c.sha }), el("button", {
      type: "button",
      class: "sha",
      text: "Copy",
      "aria-label": "Copy commit ID",
      onclick: action(() => copy(c.sha, "Commit ID copied")),
    })],
    ["Author", person(c.author)],
    ["Authored", fullDate(c.authoredAt)],
  ];
  if (person(c.committer) !== person(c.author))
    meta.push(["Committed by", person(c.committer)]);
  if (c.committedAt !== c.authoredAt) meta.push(["Committed", fullDate(c.committedAt)]);
  meta.push([
    c.parents.length > 1 ? "Parents" : "Parent",
    ...(c.parents.length
      ? c.parents.map((p) => shaChip(p, action(() => showCommit(id, p))))
      : ["None (first commit)"]),
  ]);
  $("commit-meta").replaceChildren(
    ...meta.flatMap(([k, ...v]) => [el("dt", { text: k }), el("dd", {}, ...v)]),
  );
  $("ref-input").value = sha;
  code = { ref: sha, root: c.tree, crumbs: [], logs: [] };
  await showTree(c.tree, [], sha, ["commit-view"]);
  $("history").hidden = false;
  window.scrollTo({ top: 0 });
}

/* --- Minimal, safe Markdown (DOM only, no HTML injection) --- */
function inline(text) {
  const out = [];
  const re =
    /(`[^`]+`)|(\*\*[^*]+\*\*|__[^_]+__)|(!?\[[^\]]*\]\([^)\s]+(?:\s+"[^"]*")?\))|(\*[^*\s][^*]*\*|\b_[^_\s][^_]*_\b)|(https?:\/\/[^\s<>()]+)/g;
  let last = 0,
    m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    if (m[1]) out.push(el("code", { text: t.slice(1, -1) }));
    else if (m[2]) out.push(el("strong", {}, inline(t.slice(2, -2))));
    else if (m[3]) {
      const image = t.startsWith("!");
      const [, label, href] = t.match(/!?\[([^\]]*)\]\(([^)\s]+)/);
      if (image) out.push(label ? el("span", { class: "muted", text: label }) : "");
      else if (/^(https?:|mailto:)/i.test(href))
        out.push(el("a", { href, rel: "noopener noreferrer", target: "_blank" }, inline(label)));
      else out.push(el("span", { title: href }, inline(label)));
    } else if (m[4]) out.push(el("em", {}, inline(t.slice(1, -1))));
    else if (m[5]) out.push(el("a", { href: t, rel: "noopener noreferrer", target: "_blank", text: t }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}
function markdown(src) {
  const lines = src.replace(/\r\n?/g, "\n").replace(/<!--[\s\S]*?-->/g, "").split("\n");
  const blocks = [];
  let i = 0;
  const strip = (s) => s.replace(/<\/?[a-zA-Z][^>]*>/g, "");
  while (i < lines.length) {
    const line = lines[i];
    if (/^\s*$/.test(line)) {
      i++;
      continue;
    }
    const fence = line.match(/^\s*(```|~~~)/);
    if (fence) {
      const body = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(fence[1])) body.push(lines[i++]);
      i++;
      blocks.push(el("pre", {}, el("code", { text: body.join("\n") })));
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (h) {
      blocks.push(el("h" + Math.min(h[1].length, 4), {}, inline(strip(h[2]))));
      i++;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push(el("hr"));
      i++;
      continue;
    }
    if (/^\s*>/.test(line)) {
      const body = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ""));
      blocks.push(el("blockquote", {}, markdown(body.join("\n"))));
      continue;
    }
    const listMatch = line.match(/^\s*([-*+]|\d+[.)])\s+/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items = [];
      while (i < lines.length && /^\s*([-*+]|\d+[.)])\s+/.test(lines[i])) {
        let item = lines[i++].replace(/^\s*([-*+]|\d+[.)])\s+/, "");
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]))
          item += " " + lines[i++].trim();
        item = item.replace(/^\[( |x)\]\s+/i, (_, x) => (x.trim() ? "☑ " : "☐ "));
        items.push(el("li", {}, inline(strip(item))));
      }
      blocks.push(el(ordered ? "ol" : "ul", {}, items));
      continue;
    }
    if (/^\s{4,}\S/.test(line)) {
      const body = [];
      while (i < lines.length && (/^\s{4,}/.test(lines[i]) || /^\s*$/.test(lines[i]))) body.push(lines[i++].slice(4));
      blocks.push(el("pre", {}, el("code", { text: body.join("\n").trimEnd() })));
      continue;
    }
    const para = [];
    while (
      i < lines.length &&
      !/^\s*$/.test(lines[i]) &&
      !/^(#{1,6}\s|\s*(```|~~~)|\s*>|\s*([-*+]|\d+[.)])\s+)/.test(lines[i])
    )
      para.push(lines[i++].trim());
    const text = strip(para.join(" ")).trim();
    if (text) blocks.push(el("p", {}, inline(text)));
  }
  return blocks;
}

/* --- Issues --- */
function paragraph(text, className = "") {
  return el("p", { text, class: className });
}
const personName = (id) => collaborators.find((c) => c.user === id)?.name ?? id;
function assignees(select, current = null) {
  select.replaceChildren(
    new Option("No one", ""),
    ...collaborators.map((c) => new Option(`${c.name} (${ROLE[c.role] ?? c.role})`, c.user)),
  );
  if (current && !collaborators.some((c) => c.user === current))
    select.add(new Option(`${current} (no longer has access)`, current));
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
  repositoryMode("issues");
  collaborators = await api(repoAPI("collaborators"));
  $("issue-new").hidden = !canWrite();
  assignees($("issue-create").elements.assignee);
  const search = new URLSearchParams(new FormData($("issue-search")));
  const { issues } = await api(repoAPI("issues") + "?" + search);
  $("issue-list").replaceChildren(
    ...issues.map((i) =>
      el(
        "div",
        { class: "repo row" + (activeIssue?.number === i.number ? " selected" : "") },
        icon(i.state === "closed" ? "closed" : "open", "state-dot " + i.state),
        el(
          "div",
          { class: "row-main" },
          el(
            "div",
            { class: "row-title" },
            el("button", {
              type: "button",
              class: "link-button",
              text: i.title,
              onclick: action(() => showIssue(i.number)),
            }),
            ...i.labels.map((l) => el("span", { class: "label-chip", text: l })),
          ),
          el("span", {
            class: "row-sub",
            text:
              `#${i.number} · ${i.state === "closed" ? "closed" : "opened"} by ${personName(i.author)}` +
              (i.updated ? ` · updated ${when(i.updated)}` : "") +
              (i.assignee ? ` · assigned to ${personName(i.assignee)}` : ""),
          }),
        ),
      ),
    ),
  );
  if (!issues.length)
    $("issue-list").append(
      el("p", {
        class: "empty-inline",
        text: search.get("q") || search.get("state")
          ? "No issues match these filters."
          : "No issues yet. Issues are a good place to plan work and report problems.",
      }),
    );
}
async function showIssue(number) {
  const epoch = ++detailEpoch,
    repo = selected;
  $("issue-detail").hidden = true;
  const { issue, comments, audit } = await api(repoAPI("issues/" + number));
  if (epoch !== detailEpoch || repo !== selected) return;
  activeIssue = issue;
  $("issue-detail").hidden = false;
  $("issue-heading").replaceChildren(
    issue.title,
    " ",
    el("span", { class: "muted", text: "#" + issue.number }),
  );
  $("issue-meta").replaceChildren(
    badge(issue.state === "closed" ? "Closed" : "Open", issue.state),
    `Opened by ${personName(issue.author)} · updated ${when(issue.updated)}`,
    issue.assignee ? ` · assigned to ${personName(issue.assignee)}` : "",
    ...issue.labels.map((l) => el("span", { class: "label-chip", text: l })),
  );
  $("issue-body").textContent = issue.body || "No description provided.";
  $("issue-body").classList.toggle("muted", !issue.body);
  const form = $("issue-edit");
  form.hidden = true;
  $("issue-edit-toggle").hidden = !canWrite();
  $("issue-edit-toggle").textContent = "Edit";
  for (const k of ["title", "body", "state"]) form.elements[k].value = issue[k];
  form.elements.labels.value = issue.labels.join(", ");
  assignees(form.elements.assignee, issue.assignee);
  $("issue-comments").replaceChildren(
    ...comments.map((c) =>
      el(
        "div",
        { class: "comment" },
        el(
          "div",
          { class: "comment-head" },
          el("strong", { text: personName(c.author) }),
          ` commented ${when(c.created)}`,
        ),
        el("div", { class: "comment-body", text: c.body }),
      ),
    ),
  );
  if (!comments.length)
    $("issue-comments").append(paragraph("No comments yet.", "muted"));
  $("issue-audit").replaceChildren(
    ...audit.map((a) =>
      paragraph(
        `${String(a.event).replaceAll("_", " ")} by ${personName(a.actor)} · ${fullDate(a.created)}`,
      ),
    ),
  );
  for (const row of $("issue-list").querySelectorAll(".row"))
    row.classList.toggle(
      "selected",
      row.querySelector(".row-sub")?.textContent.startsWith(`#${number} `),
    );
  window.history.replaceState(null, "", `?repo=${selected}&issue=${number}`);
}
$("issue-new").onclick = () => {
  $("issue-create-panel").hidden = false;
  $("issue-create-title").focus();
};
$("issue-cancel").onclick = () => {
  $("issue-create").reset();
  $("issue-create-panel").hidden = true;
};
$("issue-edit-toggle").onclick = () => {
  const show = $("issue-edit").hidden;
  $("issue-edit").hidden = !show;
  $("issue-edit-toggle").textContent = show ? "Close editor" : "Edit";
  if (show) $("issue-edit-title").focus();
};
$("issue-search").onsubmit = action(showIssues);
$("issue-create").onsubmit = action(async (e) => {
  const issue = await api(repoAPI("issues"), issueForm(e.target));
  e.target.reset();
  $("issue-create-panel").hidden = true;
  await showIssues();
  await showIssue(issue.number);
  say("Issue created.");
});
$("issue-edit").onsubmit = action(async (e) => {
  await api(repoAPI("issues/" + activeIssue.number), {
    ...issueForm(e.target),
    version: activeIssue.version,
  });
  await showIssues();
  await showIssue(activeIssue.number);
  say("Issue saved.");
});
$("issue-comment").onsubmit = action(async (e) => {
  await api(repoAPI(`issues/${activeIssue.number}/comments`), {
    body: e.target.elements.body.value,
    version: activeIssue.version,
  });
  e.target.reset();
  await showIssue(activeIssue.number);
  say("Comment added.");
});

/* --- Strands (task forks and their proposals) --- */
const STATUS = { open: "Proposed", approved: "Approved", rejected: "Rejected", merged: "Braided" };
const STATUS_KIND = { open: "proposed", approved: "approved", rejected: "rejected", merged: "braided" };
let strandList = [];
const strandOf = (id) => strandList.find((s) => s.id === id);
const taskName = (id) => strandOf(id)?.name ?? allRepos.find((r) => r.id === id)?.name;
function strandGlyph(taskId, status) {
  const st = strandOf(taskId);
  if (!window.Braid || !st) return icon("change", "row-icon");
  const g = window.Braid.swatch(st.index, status);
  g.classList.add("row-icon");
  return g;
}
async function refreshRepos() {
  allRepos = (await api("/api/repos?q=")).repos;
}
async function showProposals(keep = activeProposal?.id, keepStrand = activeStrand) {
  repositoryMode("changes");
  await refreshRepos();
  proposals = selectedRepo.parent ? [] : await api(repoAPI("proposals"));
  strandList =
    selectedRepo.parent || !window.Braid
      ? []
      : await window.Braid.strands(selected, { fresh: true }).catch(() => []);
  if (!selectedRepo.parent) window.Braid?.showRepo(selectedRepo, { fresh: false });
  // An approved proposal whose commit is already on the default branch has been braided in.
  if (proposals.some((p) => p.status === "approved")) {
    const onBranch = new Set((await ensureHeadLog()).map((c) => c.sha));
    for (const p of proposals)
      if (p.status === "approved" && onBranch.has(p.candidate)) p.status = "merged";
  }
  const order = { open: 0, approved: 1, working: 2, merged: 3, rejected: 4 };
  const by = (p) => (p.author === currentActor?.id ? "you" : personName(p.author));
  const rows = [
    ...proposals.map((p) => ({
      rank: order[p.status] ?? 9,
      name: taskName(p.task) ?? "a strand",
      node: el(
        "div",
        { class: "repo row clickable strand-row" + (keep === p.id ? " selected" : ""), "data-id": p.id, "data-strand": p.task },
        strandGlyph(p.task, STATUS_KIND[p.status] ?? p.status),
        el(
          "div",
          { class: "row-main" },
          el("button", {
            type: "button",
            class: "link-button",
            text: taskName(p.task) ?? "a strand",
            onclick: action(() => showProposal(p.id)),
          }),
          el("span", {
            class: "row-sub",
            text: `Proposal ${short(p.candidate)} onto ${p.base === ZERO ? "an empty repository" : short(p.base)} · by ${by(p)}`,
          }),
        ),
        el("div", { class: "row-side" }, badge(STATUS[p.status] ?? p.status, STATUS_KIND[p.status] ?? p.status)),
      ),
    })),
    // Strands still being worked on (no proposal yet, or new commits after a braid).
    ...strandList
      .filter((st) => st.status === "working" && st.name)
      .map((st) => ({
        rank: order.working,
        name: st.name,
        node: el(
          "div",
          { class: "repo row clickable strand-row" + (keepStrand === st.id && !keep ? " selected" : ""), "data-strand": st.id },
          strandGlyph(st.id, "working"),
          el(
            "div",
            { class: "row-main" },
            el("button", {
              type: "button",
              class: "link-button",
              text: st.name,
              onclick: action(() => showWorkingStrand(st.id)),
            }),
            el("span", {
              class: "row-sub",
              text: st.ahead
                ? `${plural(st.ahead, "new commit")} since ${short(st.base)} · no proposal yet`
                : `Branched from ${st.base && st.base !== ZERO ? short(st.base) : "an empty repository"} · nothing pushed yet`,
            }),
          ),
          el("div", { class: "row-side" }, badge("Working", "working")),
        ),
      })),
  ].sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  $("proposal-list").replaceChildren(...rows.map((r) => r.node));
  if (!rows.length) {
    const canStart = !selectedRepo.parent && !$("new-task").hidden;
    $("proposal-list").append(
      el(
        "div",
        { class: "empty strands-empty" },
        el("div", { class: "empty-art", "aria-hidden": "true" }, window.Braid?.art({ width: 320, height: 120 })),
        el("h2", { text: selectedRepo.parent ? "Proposals live on the original repository" : "No strands yet" }),
        el("p", {
          class: "muted",
          text: selectedRepo.parent
            ? "Push your commits to this strand, then propose them from the original repository."
            : "Start a strand to get a private fork pinned to the latest commit. Push to it, propose, and braid it in.",
        }),
        canStart
          ? el("div", { class: "empty-actions" }, el("button", {
              type: "button",
              class: "btn btn-primary",
              text: "Start a strand",
              onclick: () => $("new-task").click(),
            }))
          : null,
      ),
    );
  }
  $("proposal-list").classList.toggle("flush", !rows.length);
  const current = proposals.find((p) => p.id === keep);
  $("strand-detail").hidden = true;
  if (current) await showProposal(current.id);
  else {
    $("proposal-detail").hidden = true;
    if (keepStrand && strandOf(keepStrand)?.status === "working") showWorkingStrand(keepStrand);
    else window.Braid?.select(null);
  }
}
// The proposal (or working state) a strand click should land on.
function strandFocus(st) {
  const ps = st.proposals ?? [];
  return (
    ps.find((p) => p.status === "open") ??
    ps.find((p) => p.status === "approved" && !p.braided) ??
    (st.status === "working" ? undefined : ps.at(-1))
  );
}
async function openStrand(id) {
  route("&tab=changes");
  const st = (await window.Braid?.strands(selected).catch(() => []))?.find((s) => s.id === id);
  const p = st ? strandFocus(st) : undefined;
  await showProposals(p?.id ?? null, p ? undefined : id);
  const target = $(p ? "proposal-detail" : "strand-detail");
  if (!target.hidden) target.scrollIntoView({ block: "nearest" });
}
function showWorkingStrand(id) {
  const st = strandOf(id);
  if (!st) return;
  activeStrand = id;
  activeProposal = undefined;
  $("proposal-detail").hidden = true;
  for (const row of $("proposal-list").querySelectorAll(".row"))
    row.classList.toggle("selected", !row.dataset.id && row.dataset.strand === id);
  window.Braid?.select(id);
  const canPropose = !selectedRepo.parent && st.ahead > 0;
  $("strand-detail").hidden = false;
  $("strand-detail").replaceChildren(
    el(
      "div",
      { class: "proposal-head" },
      el(
        "div",
        {},
        el("h2", {}, strandGlyph(id, "working"), st.name, badge("Working", "working")),
        el(
          "p",
          { class: "muted" },
          st.ahead
            ? `${plural(st.ahead, "commit")} on this strand haven't been proposed yet.`
            : "Nothing has been pushed to this strand yet.",
          st.base && st.base !== ZERO ? " Pinned to " : "",
          st.base && st.base !== ZERO ? shaChip(st.base) : "",
        ),
      ),
      el(
        "div",
        { class: "proposal-actions" },
        el("button", {
          type: "button",
          class: "btn btn-secondary",
          text: "Open strand",
          onclick: action(() => open(id)),
        }),
        canPropose
          ? el("button", {
              type: "button",
              class: "btn btn-primary",
              text: "Propose changes",
              onclick: action(async () => {
                await $("new-proposal").onclick();
                $("proposal-task").value = id;
                await proposalDefaults();
              }),
            })
          : null,
      ),
    ),
    el("p", {
      class: "hint strand-hint",
      text: "Use Clone on the strand to push commits. When it's ready, propose it here; once approved, braid it in.",
    }),
  );
  if (window.innerWidth < 860) $("strand-detail").scrollIntoView({ block: "start" });
}
async function showProposal(id) {
  const p = proposals.find((x) => x.id === id);
  if (!p) return;
  activeProposal = p;
  activeStrand = p.task;
  $("strand-detail").hidden = true;
  window.Braid?.select(p.task);
  for (const row of $("proposal-list").querySelectorAll(".row"))
    row.classList.toggle("selected", row.dataset.id === id);
  $("proposal-detail").hidden = false;
  $("proposal-title").replaceChildren(
    strandGlyph(p.task, STATUS_KIND[p.status] ?? p.status),
    taskName(p.task) ?? "a strand",
    badge(STATUS[p.status] ?? p.status, STATUS_KIND[p.status] ?? p.status),
  );
  $("proposal-meta").replaceChildren(
    "Proposal ",
    shaChip(p.candidate),
    p.base === ZERO ? " into an empty repository" : " on top of ",
    p.base === ZERO ? "" : shaChip(p.base),
  );
  const actions = [];
  if (selectedRepo.role === "admin" && p.status === "open") {
    actions.push(
      el("button", {
        type: "button",
        class: "btn btn-secondary",
        text: "Reject",
        onclick: action(() => decide(p, "rejected")),
      }),
      el("button", {
        type: "button",
        class: "btn btn-primary",
        text: "Approve",
        onclick: action(() => decide(p, "approved")),
      }),
    );
  }
  if (selectedRepo.role === "admin" && p.status === "approved")
    actions.push(
      el("button", {
        type: "button",
        class: "btn btn-primary btn-braid",
        text: "Braid in",
        onclick: action(async () => {
          await api(repoAPI("merge"), { id: p.id });
          headLog = [];
          await showProposals(p.id);
          say(`Braided in. ${selectedRepo.name} now points to ${short(p.candidate)}.`);
        }),
      }),
    );
  $("proposal-actions").replaceChildren(...actions);
  const d = await api(repoAPI("diff") + "?proposal=" + p.id);
  if (activeProposal?.id !== id) return;
  renderDiff(d.files);
  await renderDiscussion();
  if (window.innerWidth < 860) $("proposal-detail").scrollIntoView({ block: "start" });
}
async function decide(p, status) {
  await api(repoAPI("review"), { id: p.id, status });
  await showProposals(p.id);
  say(status === "approved" ? "Approved. Ready to braid in." : "Proposal rejected.");
}
async function renderDiscussion() {
  const comments = await api(repoAPI("discussion/" + activeProposal.id));
  $("proposal-comments").replaceChildren(
    ...comments.map((c) =>
      el(
        "div",
        { class: "comment" },
        el(
          "div",
          { class: "comment-head" },
          el("strong", { text: c.author === currentActor?.id ? (currentActor.name ?? c.author) : personName(c.author) }),
          c.created ? ` commented ${when(c.created)}` : "",
        ),
        el("div", { class: "comment-body", text: c.body }),
      ),
    ),
  );
  if (!comments.length)
    $("proposal-comments").append(paragraph("No comments yet.", "muted"));
}
$("proposal-comment").onsubmit = action(async (e) => {
  await api(repoAPI("discussion/" + activeProposal.id), {
    body: e.target.elements.body.value,
  });
  e.target.reset();
  await renderDiscussion();
  say("Comment added.");
});
// Line diff via LCS on the changed middle; large files fall back to remove/add blocks.
function lineDiff(a, b) {
  let s = 0;
  while (s < a.length && s < b.length && a[s] === b[s]) s++;
  let ea = a.length,
    eb = b.length;
  while (ea > s && eb > s && a[ea - 1] === b[eb - 1]) {
    ea--;
    eb--;
  }
  const A = a.slice(s, ea),
    B = b.slice(s, eb),
    ops = a.slice(0, s).map((t) => [" ", t]);
  if (A.length * B.length > 4e6 || !A.length || !B.length)
    ops.push(...A.map((t) => ["-", t]), ...B.map((t) => ["+", t]));
  else {
    const n = A.length,
      m = B.length,
      L = new Uint16Array((n + 1) * (m + 1));
    for (let i = n - 1; i >= 0; i--)
      for (let j = m - 1; j >= 0; j--)
        L[i * (m + 1) + j] =
          A[i] === B[j]
            ? L[(i + 1) * (m + 1) + j + 1] + 1
            : Math.max(L[(i + 1) * (m + 1) + j], L[i * (m + 1) + j + 1]);
    let i = 0,
      j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && A[i] === B[j]) {
        ops.push([" ", A[i++]]);
        j++;
      } else if (j >= m || (i < n && L[(i + 1) * (m + 1) + j] >= L[i * (m + 1) + j + 1]))
        ops.push(["-", A[i++]]);
      else ops.push(["+", B[j++]]);
    }
  }
  ops.push(...a.slice(ea).map((t) => [" ", t]));
  return ops;
}
const toLines = (t) => (t === "" ? [] : t.replace(/\n$/, "").split("\n"));
function renderDiff(files) {
  let adds = 0,
    dels = 0;
  const nodes = files.map((f) => {
    const head = el(
      "div",
      { class: "diff-file-head" },
      icon("file", "row-icon"),
      el("span", { class: "path", text: f.path }),
      badge(f.status === "added" ? "Added" : f.status === "deleted" ? "Deleted" : "Modified",
        f.status === "added" ? "open" : f.status === "deleted" ? "rejected" : ""),
    );
    const box = el("div", { class: "diff-file" }, head);
    const beforeMissing = f.status !== "added" && f.before == null;
    const afterMissing = f.status !== "deleted" && f.after == null;
    if (beforeMissing || afterMissing) {
      box.append(el("p", { class: "diff-note", text: "No preview for this file. It may be binary or too large to show." }));
      return box;
    }
    const ops = lineDiff(toLines(f.before ?? ""), toLines(f.after ?? ""));
    let a = 0,
      b = 0,
      fa = 0,
      fd = 0;
    const show = ops.map((op, k) =>
      op[0] !== " " ||
      ops.slice(Math.max(0, k - 3), k + 4).some((o) => o[0] !== " "),
    );
    const rows = [];
    let hidden = 0;
    const flushGap = () => {
      if (!hidden) return;
      rows.push(
        el("div", { class: "dl gap" },
          el("span", { class: "ln" }), el("span", { class: "ln" }), el("span", { class: "mark" }),
          el("span", { text: `⋯ ${plural(hidden, "unchanged line")}` })),
      );
      hidden = 0;
    };
    ops.forEach(([kind, text], k) => {
      if (kind !== "+") a++;
      if (kind !== "-") b++;
      if (kind === "+") fa++;
      if (kind === "-") fd++;
      if (!show[k]) {
        hidden++;
        return;
      }
      flushGap();
      rows.push(
        el(
          "div",
          { class: "dl" + (kind === "+" ? " add" : kind === "-" ? " del" : "") },
          el("span", { class: "ln", text: kind === "+" ? "" : String(a) }),
          el("span", { class: "ln", text: kind === "-" ? "" : String(b) }),
          el("span", { class: "mark", text: kind === " " ? "" : kind }),
          el("span", { text }),
        ),
      );
    });
    flushGap();
    adds += fa;
    dels += fd;
    head.insertBefore(
      el("span", { class: "counts" }, el("span", { class: "add", text: "+" + fa }), " ", el("span", { class: "del", text: "−" + fd })),
      head.lastChild,
    );
    box.append(
      rows.length
        ? el("div", { class: "diff-lines" }, el("div", { class: "diff-table" }, rows))
        : el("p", { class: "diff-note", text: "Only file permissions changed." }),
    );
    return box;
  });
  $("diff").replaceChildren(
    el(
      "p",
      { class: "diff-summary" },
      `${plural(files.length, "file")} changed · `,
      el("span", { class: "add", text: `${adds} additions` }),
      ", ",
      el("span", { class: "del", text: `${dels} deletions` }),
    ),
    ...nodes,
  );
  if (!files.length) $("diff").replaceChildren(paragraph("No file changes.", "muted"));
}
$("new-task").onclick = () => {
  $("proposal").hidden = true;
  $("task").hidden = false;
  $("task").elements.name.focus();
};
document.addEventListener("click", (e) => {
  const close = e.target.closest("[data-close]");
  if (close) $(close.dataset.close).hidden = true;
});
$("task").onsubmit = action(async (e) => {
  const task = await api(repoAPI("tasks"), Object.fromEntries(new FormData(e.target)));
  e.target.reset();
  $("task").hidden = true;
  await refreshRepos();
  await open(task.id);
  say(`Strand ${task.name} is ready. Use Clone to push your commits here, then propose them.`);
});
async function proposalDefaults() {
  const task = $("proposal-task").value;
  const base = (await api(repoAPI("log")))[0];
  const f = $("proposal").elements;
  f.base.value = base?.sha ?? ZERO;
  if (!task) return;
  const tip = (await api(`/api/repos/${task}/log`))[0];
  f.candidate.value = tip?.sha ?? "";
  const name = taskName(task);
  $("proposal-summary").textContent = !tip
    ? `${name} has no commits yet. Push to it first.`
    : tip.sha === base?.sha
      ? `${name} has no new commits compared with this repository.`
      : `Proposes the latest commit on ${name} (${short(tip.sha)}: “${(tip.message ?? "").split("\n")[0]}”) ` +
        (base ? `on top of ${short(base.sha)}.` : "as the first commits here.");
}
$("new-proposal").onclick = action(async () => {
  $("task").hidden = true;
  await refreshRepos();
  const tasks = allRepos.filter((r) => r.parent === selected);
  $("proposal-task").replaceChildren(
    ...tasks.map((t) => new Option(t.name, t.id)),
  );
  $("proposal").hidden = false;
  $("proposal").querySelector("button:not([type])").disabled = !tasks.length;
  if (!tasks.length) {
    $("proposal-summary").textContent =
      "You don't have a strand for this repository yet. Choose New strand first.";
    return;
  }
  await proposalDefaults();
  $("proposal-task").focus();
});
$("proposal-task").onchange = action(proposalDefaults);
$("proposal").onsubmit = action(async (e) => {
  const p = await api(repoAPI("proposals"), Object.fromEntries(new FormData(e.target)));
  $("proposal").hidden = true;
  await showProposals(p.id);
  say("Changes proposed. They're waiting for review.");
});

/* --- Reviews (read-only agent) --- */
const JOB = {
  queued: "Waiting to start",
  running: "Reviewing",
  completed: "Finished",
  failed: "Failed",
  cancelled: "Cancelled",
  interrupted: "Interrupted",
};
async function showAgents() {
  repositoryMode("reviews");
  $("agent-policy").hidden = selectedRepo.owner !== currentActor?.id;
  $("agent-start").closest(".card").hidden = !canWrite();
  const logs = await ensureHeadLog();
  const commitOption = (c) => new Option(`${short(c.sha)} · ${(c.message ?? "").split("\n")[0]}`.slice(0, 90), c.sha);
  $("agent-sha").replaceChildren(...logs.map(commitOption));
  $("agent-base").replaceChildren(new Option("Nothing — review files as they are", ""), ...logs.slice(1).map(commitOption));
  for (const id of ["agent-refresh", "agent-cancel", "agent-retry"]) $(id).hidden = true;
  if (!logs.length) $("agent-status").textContent = "Reviews need at least one commit.";
  const policy = await api(repoAPI("agents/policy"));
  $("agent-policy").elements.publish.checked = policy.publish;
  if (!activeJob) {
    const jobs = await api(repoAPI("agents"));
    if (jobs.length) {
      lastReview = { sha: jobs[0].scope.sha, base: jobs[0].scope.base, paths: jobs[0].scope.paths };
      await renderJob(jobs[0]);
    } else $("agent-status").textContent = "No reviews yet. Pick a commit and some files to get started.";
  }
}
$("agent-policy").onsubmit = action(async (e) => {
  await api(repoAPI("agents/policy"), { publish: e.target.elements.publish.checked });
  say("Review settings saved.");
});
async function renderJob(job) {
  activeJob = job;
  $("agent-status").textContent =
    `${JOB[job.status] ?? job.status}${job.progress ? " · " + job.progress : ""}${job.error ? " · " + friendly(job.error) : ""}`;
  $("agent-refresh").hidden = false;
  $("agent-cancel").hidden = !["queued", "running"].includes(job.status);
  $("agent-retry").hidden = !["failed", "cancelled", "interrupted"].includes(job.status);
  $("agent-findings").replaceChildren();
  for (const f of job.result?.findings ?? [])
    $("agent-findings").append(
      el(
        "div",
        { class: "finding" },
        el("h3", { text: f.title }),
        el("a", {
          href: `?repo=${selected}&commit=${f.sha}`,
          text: `${f.path}, lines ${f.start}–${f.end} at ${short(f.sha)}`,
          title: f.sha,
          onclick: action(() => showCommit(selected, f.sha)),
        }),
        el("pre", { text: f.evidence }),
        paragraph(f.explanation),
      ),
    );
  if (job.status === "completed" && !job.result?.findings.length)
    $("agent-findings").append(
      paragraph("The reviewer didn't find anything to flag in these files. That's not the same as passing tests.", "muted"),
    );
  if (job.result)
    $("agent-findings").append(
      paragraph(
        `Reviewed by ${job.model} · ${plural(job.result.requests, "request")} · ${Math.round(job.result.sourceBytes / 1024)} KB read` +
          ((job.published ?? []).length ? ` · issues created: ${job.published.join(", ")}` : ""),
        "hint",
      ),
    );
}
$("agent-start").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  lastReview = {
    sha: b.sha,
    paths: b.paths.split("\n").map((s) => s.trim()).filter(Boolean),
    ...(b.base ? { base: b.base } : {}),
  };
  await renderJob(await api(repoAPI("agents"), lastReview));
});
$("agent-refresh").onclick = action(async () => {
  if (activeJob) await renderJob(await api(repoAPI("agents/" + activeJob.id)));
});
$("agent-cancel").onclick = action(async () => {
  if (activeJob) await renderJob(await api(repoAPI(`agents/${activeJob.id}/cancel`), {}));
});
$("agent-retry").onclick = action(async () => {
  if (lastReview) await renderJob(await api(repoAPI("agents"), { ...lastReview, retry: true }));
});

/* --- Settings --- */
async function showSettings() {
  repositoryMode("settings");
  $("delete-repo-name").textContent = selectedRepo.name;
  $("delete-repo-confirm").value = "";
  $("visibility-select").value = selectedRepo.visibility;
  syncVisibility();
  $("repo-technical").replaceChildren(
    ...[
      ["Repository ID", selectedRepo.id],
      ["Git address", selectedRepo.git?.remote],
      ["Default branch", selectedRepo.git?.defaultBranch],
    ]
      .filter(([, v]) => v)
      .flatMap(([k, v]) => [el("dt", { text: k }), el("dd", { class: "mono", text: v })]),
  );
  await loadAccess();
}
function syncVisibility() {
  const toPublic = $("visibility-select").value === "public" && selectedRepo.visibility !== "public";
  $("visibility-confirm").hidden = !toPublic;
  $("visibility-confirm-label").textContent = `Type “${selectedRepo.name}” to confirm`;
}
$("visibility-select").onchange = syncVisibility;
$("visibility").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  if (b.visibility === selectedRepo.visibility) return say("Nothing changed.");
  if (b.visibility === "public" && b.confirm !== selectedRepo.name)
    throw Error(`Type “${selectedRepo.name}” exactly to make this repository public.`);
  await api(repoAPI("visibility"), {
    visibility: b.visibility,
    ...(b.visibility === "public" ? { confirm: selectedRepo.id } : {}),
  });
  e.target.reset();
  await open(selected, { showSource: false });
  await showSettings();
  await list(discoveryView);
  say(`This repository is now ${b.visibility}.`);
});
async function loadAccess() {
  const [grants, invites, people] = await Promise.all([
    api(repoAPI("grants")),
    api(repoAPI("invites")),
    api(repoAPI("collaborators")).catch(() => []),
  ]);
  const nameOf = (id) => people.find((p) => p.user === id)?.name ?? id;
  const rows = [
    el(
      "div",
      { class: "row" },
      icon("person", "row-icon"),
      el("div", { class: "row-main" }, el("strong", { text: selectedRepo.owner === currentActor?.id ? `${nameOf(selectedRepo.owner)} (you)` : nameOf(selectedRepo.owner) })),
      el("div", { class: "row-side" }, badge("Owner")),
    ),
  ];
  for (const g of grants) {
    const row = el(
      "div",
      { class: "row" },
      icon("person", "row-icon"),
      el("div", { class: "row-main" }, el("strong", { text: nameOf(g.user) })),
      el(
        "div",
        { class: "row-side" },
        badge(ROLE[g.role] ?? g.role),
        el("button", {
          type: "button",
          class: "btn btn-ghost",
          text: "Remove",
          "aria-label": `Remove ${nameOf(g.user)}`,
          onclick: action(async () => {
            await api(repoAPI("grants"), { user: g.user, role: null });
            row.remove();
            say(`${nameOf(g.user)} no longer has access.`);
          }),
        }),
      ),
    );
    rows.push(row);
  }
  for (const i of invites) {
    const row = el(
      "div",
      { class: "row" },
      icon("person", "row-icon"),
      el(
        "div",
        { class: "row-main" },
        el("strong", { text: i.email }),
        el("span", { class: "row-sub", text: `Invited to ${ROLE[i.role]?.toLowerCase() ?? i.role}` }),
      ),
      el(
        "div",
        { class: "row-side" },
        badge(i.state === "pending" ? "Invite pending" : i.state[0].toUpperCase() + i.state.slice(1), i.state === "accepted" ? "open" : i.state === "pending" ? "creating" : ""),
        i.state === "pending"
          ? el("button", {
              type: "button",
              class: "btn btn-ghost",
              text: "Revoke invite",
              onclick: action(async () => {
                await api(repoAPI("invites"), { revoke: i.id });
                await loadAccess();
                say(`Invitation for ${i.email} revoked.`);
              }),
            })
          : null,
      ),
    );
    rows.push(row);
  }
  $("access-list").replaceChildren(...rows);
}
$("access").onclick = action(loadAccess);
$("invite").onsubmit = action(async (e) => {
  const i = await api(repoAPI("invites"), Object.fromEntries(new FormData(e.target)));
  e.target.reset();
  const link = el("input", { readOnly: true, value: i.url, class: "mono", "aria-label": "Invitation link" });
  $("invite-result").hidden = false;
  $("invite-result").replaceChildren(
    paragraph(`Invitation created for ${i.email}. Send them this link — it works for 7 days.`),
    el(
      "span",
      { class: "copy-row" },
      link,
      el("button", {
        type: "button",
        class: "btn btn-secondary",
        text: "Copy link",
        onclick: action(() => copy(i.url, "Invitation link copied")),
      }),
    ),
  );
  await loadAccess();
});
$("grant").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  b.role = b.role || null;
  await api(repoAPI("grants"), b);
  e.target.reset();
  await loadAccess();
  say(b.role ? "Access updated." : "Access removed.");
});
$("delete-repo").onsubmit = action(async () => {
  const name = selectedRepo.name;
  await api(
    `/api/repos/${selected}`,
    { confirm: $("delete-repo-confirm").value.trim() },
    true,
    "DELETE",
  );
  await destinations.overview();
  $("notice").textContent = `Deleted ${name}.`;
});
$("reconcile").onclick = action(async () => {
  const r = await api(repoAPI("reconcile"), {});
  $("reconcile-result").hidden = false;
  $("reconcile-raw").textContent = JSON.stringify(r, null, 2);
  $("reconcile-summary").textContent =
    "integrated" in r
      ? r.integrated
        ? "An interrupted merge has now finished. Everything is up to date."
        : "An interrupted merge didn't go through. Nothing was changed, so you can merge again."
      : r.state === "ready"
        ? "The import finished. This repository is ready to use."
        : !r.intent
          ? "Everything looks good. Nothing needed fixing."
          : r.intent.state === "merged"
            ? "Everything looks good. The last merge completed successfully."
            : r.intent.state === "failed"
              ? "The last merge didn't complete. Nothing was changed; you can try again."
              : "Everything looks good.";
  if (r.state === "ready" || r.integrated) {
    await open(selected, { showSource: false });
    await showSettings();
    $("reconcile-result").hidden = false;
  }
});

/* ---------- activity ---------- */
async function showProfile() {
  const p = await api("/api/profile");
  home();
  workspaceView("profile");
  $("profile-summary").textContent =
    `${plural(p.total, "commit")} in the last year` +
    (p.email
      ? `, matched to ${p.email}.`
      : ". Verify your account email so we can match your commits.") +
    (p.incomplete ? " Some history wasn't scanned." : "");
  $("profile-definition").textContent = p.definition;
  $("profile-limits").textContent = p.limitations;
  $("heatmap").replaceChildren(
    ...p.days.map((d) => {
      const cell = el("span", {
        class: "day",
        title: `${plural(d.count, "commit")} on ${d.date}`,
      });
      cell.dataset.level = d.count === 0 ? "0" : d.count === 1 ? "1" : d.count < 5 ? "2" : "3";
      return cell;
    }),
  );
  $("heatmap").parentElement.scrollLeft = $("heatmap").scrollWidth;
  const label = (iso) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  $("activity-day").replaceChildren(
    ...[...p.days].reverse().map((d) => new Option(`${label(d.date)} · ${plural(d.count, "commit")}`, d.date)),
  );
  const active = p.days.filter((d) => d.count > 0).at(-1);
  if (active) $("activity-day").value = active.date;
  const render = () => {
    const rows = p.activity.filter(
      (c) => new Date(c.authoredAt * 1000).toISOString().slice(0, 10) === $("activity-day").value,
    );
    $("activity").replaceChildren(
      ...rows.flatMap((c) =>
        c.repositories.map((r) =>
          el(
            "div",
            { class: "row" },
            icon("commit", "row-icon"),
            el(
              "div",
              { class: "row-main" },
              el("a", {
                href: `?repo=${r.id}&commit=${c.sha}`,
                text: c.message.split("\n")[0] || "(no message)",
                onclick: action(() => showCommit(r.id, c.sha)),
              }),
              el("span", { class: "row-sub", text: r.name }),
            ),
            el("div", { class: "row-side" }, shaChip(c.sha)),
          ),
        ),
      ),
    );
    if (!rows.length) $("activity").append(paragraph("No commits on this day.", "empty-inline"));
  };
  $("activity-day").onchange = render;
  render();
}

/* ---------- Agents tab hook (logic lives in agents.js) ---------- */
async function showAgentRuns() {
  repositoryMode("agents");
  await window.braidAgents?.show();
}
// The single surface agents.js uses; keep it small and stable.
window.braidApp = {
  api,
  el,
  action,
  say,
  when,
  badge,
  repoAPI: (suffix) => repoAPI(suffix),
  repo: () => selectedRepo,
  canWrite,
  isActive: () => $("detail").dataset.mode === "agents",
  openChange: async (id) => {
    route("&tab=changes");
    await showProposals(id);
  },
};

/* ---------- braid visual layer hooks (rendering lives in braid.js) ---------- */
window.BraidHost = {
  api,
  openStrand: (id) => action(() => openStrand(id))(),
  newStrand: () =>
    action(async () => {
      route("&tab=changes");
      await showProposals();
      $("new-task").click();
    })(),
};

/* ---------- routing & boot ---------- */
async function restoreRoute() {
  const u = new URL(location.href),
    id = u.searchParams.get("repo"),
    sha = u.searchParams.get("commit"),
    tab = u.searchParams.get("tab");
  if (id && sha) await showCommit(id, sha);
  else if (id) {
    const issue = u.searchParams.get("issue");
    await open(id, { showSource: !issue && !tab });
    if (issue) {
      await showIssues();
      await showIssue(Number(issue));
    } else if (tab === "issues") await showIssues();
    else if (tab === "changes" || tab === "strands") await showProposals();
    else if (tab === "reviews") await showAgents();
    else if (tab === "agents" && !selectedRepo.parent) await showAgentRuns();
    else if (tab === "settings" && selectedRepo.role === "admin") await showSettings();
    else if (tab) await showCode();
  }
}
const pendingInvite = new URL(location.href).searchParams.get("invite");
if (pendingInvite) {
  $("accept-invite").elements.invite.value = pendingInvite;
  $("accept-invite").hidden = false;
}
$("invite-dismiss").onclick = () => {
  $("accept-invite").hidden = true;
};
$("accept-invite").onsubmit = action(async (e) => {
  const b = Object.fromEntries(new FormData(e.target));
  const r = await api("/api/invites/" + encodeURIComponent(b.invite.trim()), {});
  $("accept-invite").hidden = true;
  home();
  await list(false);
  say("Invitation accepted. The repository is now in your list.");
  if (r.repo) {
    const repo = allRepos.find((x) => x.id === r.repo);
    if (repo) say(`Invitation accepted. You now have access to ${repo.name}.`);
  }
});
{
  const result = new URL(location.href).searchParams.get("github");
  const messages = {
    connected: "GitHub connected. Pick the repositories you want to import.",
    denied: "GitHub connection was cancelled.",
    identity: "That GitHub account doesn't match the one you signed in with. Use the same GitHub account.",
    state: "The GitHub connection timed out. Please try again.",
    exchange: "GitHub didn't finish connecting. Please try again.",
    setup: "GitHub import isn't set up on this server yet.",
    connect: "Couldn't connect to GitHub. Please try again.",
  };
  if (result && messages[result]) {
    say(messages[result]);
    history.replaceState(null, "", location.pathname);
    workspaceView("github");
  }
}
api("/api/me")
  .then(async (p) => {
    currentActor = p;
    renderIdentity(p);
    const githubFirst = $("workspace").dataset.view === "github";
    if (!githubFirst) workspaceView("overview");
    await list(false);
    if (!githubFirst) await restoreRoute();
    await githubAccount();
  })
  .catch(() => {
    if (!currentActor) workspaceView("signin");
  });
