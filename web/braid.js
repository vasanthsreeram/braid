// Braid visual layer: strand map, repository sparklines, strand swatches and braid art.
// ES module, DOM only (no innerHTML). Talks to the workspace through window.BraidHost
// (set by app.js) and exposes window.Braid for app.js to call. Every API it reads is
// an existing read-only endpoint plus GET /api/repos/:id/strands.

const NS = "http://www.w3.org/2000/svg";
const ZERO = "0".repeat(40);
const host = () => window.BraidHost;
const reduceMotion = () =>
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

function svg(tag, attrs = {}, ...kids) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs))
    if (v !== undefined && v !== null && v !== false) node.setAttribute(k, v === true ? "" : String(v));
  for (const kid of kids.flat())
    if (kid !== null && kid !== undefined && kid !== false)
      node.append(typeof kid === "string" ? document.createTextNode(kid) : kid);
  return node;
}
function html(tag, props = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on")) node[k] = v;
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const kid of kids.flat())
    if (kid !== null && kid !== undefined && kid !== false)
      node.append(typeof kid === "string" ? document.createTextNode(kid) : kid);
  return node;
}
const short = (sha) => (sha ? sha.slice(0, 7) : "");
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
function ago(value) {
  if (!value) return "";
  const t = value < 1e12 ? value * 1000 : value;
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/* ---------- strand data ---------- */
// Status vocabulary shared by the map, the list, sparklines and badges.
export const STATUS_LABEL = {
  working: "working",
  proposed: "proposed",
  approved: "approved",
  braided: "braided in",
  rejected: "rejected",
};
export function strandStatus(st) {
  const ps = st.proposals ?? [];
  if (ps.some((p) => p.status === "open")) return "proposed";
  if (ps.some((p) => p.status === "approved" && !p.braided)) return "approved";
  const braided = ps.some((p) => p.braided);
  if (braided) return (st.ahead ?? 0) > 0 ? "working" : "braided";
  // Rejected stays rejected until new commits land on top of the rejected candidate.
  if (ps.length && ps.every((p) => p.status === "rejected") && (!st.tip || st.tip === ps.at(-1).candidate))
    return "rejected";
  return "working";
}
const ACTIVE = new Set(["working", "proposed", "approved"]);
export const strandColor = (i) => "s" + ((i % 3) + 1);

const cache = new Map(); // repo id -> { at, promise }
const TTL = 30_000;
export function strands(repoId, { fresh = false } = {}) {
  const hit = cache.get(repoId);
  if (!fresh && hit && Date.now() - hit.at < TTL) return hit.promise;
  const promise = host()
    .api(`/api/repos/${repoId}/strands`)
    .then((list) => list.map((st, i) => ({ ...st, index: i, status: strandStatus(st) })));
  cache.set(repoId, { at: Date.now(), promise });
  promise.catch(() => cache.delete(repoId));
  return promise;
}
function summary(list) {
  const active = list.filter((s) => ACTIVE.has(s.status)).length;
  let braidedAt = 0,
    braided = 0;
  for (const s of list)
    for (const p of s.proposals) {
      if (p.braided) braided++;
      if (p.braidedAt && p.braidedAt > braidedAt) braidedAt = p.braidedAt;
    }
  return { active, braided, braidedAt };
}

// At most 20 strand lookups in flight for the repository list.
let inFlight = 0;
const waiting = [];
function limited(fn) {
  return new Promise((resolve, reject) => {
    const run = () => {
      inFlight++;
      fn()
        .then(resolve, reject)
        .finally(() => {
          inFlight--;
          waiting.shift()?.();
        });
    };
    if (inFlight < 20) run();
    else waiting.push(run);
  });
}

/* ---------- logo & art ---------- */
// Same woven construction as the landing page logo: three strands leave one point,
// cross, and meet again.
const LOGO = [
  "M2.0 12.0 L2.8 12.2 L3.7 12.7 L4.5 13.6 L5.3 14.6 L6.2 15.7 L7.0 16.6 L7.8 17.1 L8.7 17.1 L9.5 16.5 L10.3 15.4 L11.2 13.8 L12.0 12.0 L12.8 10.2 L13.7 8.6 L14.5 7.5 L15.3 6.9 L16.2 6.9 L17.0 7.4 L17.8 8.3 L18.7 9.4 L19.5 10.4 L20.3 11.3 L21.2 11.8 L22.0 12.0",
  "M2.0 12.0 L2.8 12.4 L3.7 12.7 L4.5 12.6 L5.3 12.0 L6.2 11.0 L7.0 9.7 L7.8 8.3 L8.7 6.9 L9.5 5.9 L10.3 5.3 L11.2 5.3 L12.0 5.9 L12.8 7.1 L13.7 8.6 L14.5 10.4 L15.3 12.0 L16.2 13.4 L17.0 14.3 L17.8 14.7 L18.7 14.6 L19.5 14.1 L20.3 13.4 L21.2 12.6 L22.0 12.0",
  "M2.0 12.0 L2.8 11.4 L3.7 10.6 L4.5 9.9 L5.3 9.4 L6.2 9.3 L7.0 9.7 L7.8 10.6 L8.7 12.0 L9.5 13.6 L10.3 15.4 L11.2 16.9 L12.0 18.1 L12.8 18.7 L13.7 18.7 L14.5 18.1 L15.3 17.1 L16.2 15.7 L17.0 14.3 L17.8 13.0 L18.7 12.0 L19.5 11.4 L20.3 11.3 L21.2 11.6 L22.0 12.0",
];
export function logo(cls = "braid-logo") {
  return svg("svg", { class: cls, viewBox: "0 0 24 24", "aria-hidden": "true" }, ...LOGO.map((d) => svg("path", { d })));
}
// Three strands branch from an ink line, weave, and merge back (landing hero motif).
function wave(x0, x1, mid, amp, turns, phase, steps = 90) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const env = Math.sin(Math.PI * t) ** 0.9;
    const y = mid + amp * env * Math.sin(2 * Math.PI * turns * t + phase);
    pts.push(`${(x0 + (x1 - x0) * t).toFixed(1)} ${y.toFixed(1)}`);
  }
  return "M" + pts.join(" L");
}
export function art({ width = 360, height = 150, label, animate = true } = {}) {
  const mid = height / 2,
    a = 24,
    b = width - 24;
  const strandsDef = [
    [height * 0.36, 1.5, 0.35],
    [height * 0.4, 1.25, 2.4],
    [height * 0.3, 1.75, 4.3],
  ];
  const s = svg("svg", {
    class: "ba-art",
    viewBox: `0 0 ${width} ${height}`,
    role: label ? "img" : null,
    "aria-hidden": label ? null : "true",
    "aria-label": label,
  });
  s.append(
    svg("path", { class: "ba-trunk", d: `M0 ${mid} L${a} ${mid}` }),
    svg("path", { class: "ba-trunk", d: `M${b} ${mid} L${width} ${mid}` }),
  );
  strandsDef.forEach(([amp, turns, phase], i) => {
    const d = wave(a, b, mid, amp, turns, phase);
    s.append(
      svg("path", { class: "ba-halo", d }),
      svg("path", { class: `ba-strand ${strandColor(i)}`, d }),
      animate ? svg("path", { class: `ba-flow f${i + 1}`, d }) : null,
    );
  });
  s.append(svg("circle", { class: "ba-node", cx: a, cy: mid, r: 5 }), svg("circle", { class: "ba-node knot", cx: b, cy: mid, r: 6.5 }));
  return s;
}

/* ---------- small glyphs ---------- */
// Repository sparkline: a tiny strand map. Ink history up to a head node; each active
// strand (up to three) fans out of the head and runs on; a loop on the left when
// something was braided in. Neutral line when there is nothing to show.
export function sparkline({ active = [], braided = 0, state = "ready", task = false } = {}) {
  const s = svg("svg", { class: "bg-spark", viewBox: "0 0 56 32", "aria-hidden": "true" });
  const y = 16;
  if (state === "failed") {
    s.append(
      svg("path", { class: "bg-ink", d: `M4 ${y} L23 ${y}` }),
      svg("path", { class: "bg-ink", d: `M33 ${y} L52 ${y}` }),
      svg("path", { class: "bg-break", d: `M25 ${y - 6} L31 ${y + 6}` }),
    );
    return s;
  }
  if (state === "creating") {
    s.append(svg("path", { class: "bg-ink bg-pending", d: `M4 ${y} L52 ${y}` }));
    return s;
  }
  if (task) {
    const d = `M10 ${y + 6} C 17 ${y + 6}, 17 ${y - 6}, 25 ${y - 6} L 50 ${y - 6}`;
    s.append(
      svg("path", { class: "bg-ink faint", d: `M4 ${y + 6} L52 ${y + 6}` }),
      svg("path", { class: "bg-strand s1", d }),
      svg("circle", { class: "bg-node", cx: 10, cy: y + 6, r: 2.6 }),
      svg("circle", { class: "bg-end s1", cx: 50, cy: y - 6, r: 2.4 }),
    );
    return s;
  }
  const head = active.length ? (braided ? 29 : 20) : braided ? 34 : 40;
  s.append(
    svg("path", { class: "bg-ink", d: `M4 ${y} L${head} ${y}` }),
    svg("path", { class: "bg-ink bg-future", d: `M${head} ${y} L52 ${y}` }),
  );
  if (braided) {
    const a = 5,
      b = head - 8;
    const d = `M${a} ${y} C ${a + 4} ${y}, ${a + 3} ${y + 9}, ${(a + b) / 2} ${y + 9} C ${b - 3} ${y + 9}, ${b - 4} ${y}, ${b} ${y}`;
    s.append(svg("path", { class: "bg-halo", d }), svg("path", { class: "bg-strand s3", d }), svg("circle", { class: "bg-knot", cx: b, cy: y, r: 2.6 }));
  }
  const lanes = [-8, 8, -13];
  active.slice(0, 3).forEach((color, i) => {
    const ly = y + lanes[i],
      x2 = head + 9 + i * 3;
    const d = `M${head} ${y} C ${head + 5} ${y}, ${x2 - 5} ${ly}, ${x2} ${ly} L 51 ${ly}`;
    s.append(svg("path", { class: "bg-halo", d }), svg("path", { class: `bg-strand ${color}`, d }));
  });
  s.append(svg("circle", { class: "bg-head", cx: head, cy: y, r: 2.8 }));
  return s;
}
// Tiny strand swatch for list rows: open trail, loop (braided) or broken (rejected).
export function swatch(index, status) {
  const c = strandColor(index);
  const s = svg("svg", { class: `bg-swatch is-${status}`, viewBox: "0 0 32 24", "aria-hidden": "true" });
  const y = 17;
  s.append(svg("path", { class: "bg-ink", d: `M2 ${y} L30 ${y}` }));
  if (status === "braided") {
    const d = `M4 ${y} C 9 ${y}, 9 6, 16 6 C 23 6, 23 ${y}, 28 ${y}`;
    s.append(svg("path", { class: "bg-halo", d }), svg("path", { class: `bg-strand ${c}`, d }), svg("circle", { class: `bg-knot ${c}`, cx: 28, cy: y, r: 3 }));
  } else {
    const d = `M5 ${y} C 11 ${y}, 11 7, 17 7 L 29 7`;
    s.append(
      svg("path", { class: "bg-halo", d }),
      svg("path", { class: `bg-strand ${c}${status === "rejected" ? " bg-dashed" : ""}`, d }),
      svg("circle", { class: "bg-node", cx: 5, cy: y, r: 2.4 }),
    );
    if (status === "proposed" || status === "approved")
      s.append(svg("circle", { class: `bg-end ${status === "approved" ? "filled " + c : c}`, cx: 29, cy: 7, r: 2.6 }));
  }
  return s;
}

/* ---------- repository list ---------- */
let rowObserver;
export function decorateRepos(container, repos, { discovery = false } = {}) {
  rowObserver?.disconnect();
  const byId = new Map(repos.map((r) => [r.id, r]));
  const pending = [];
  for (const row of container.querySelectorAll(".row[data-id]")) {
    const r = byId.get(row.dataset.id);
    if (!r) continue;
    const icon = row.querySelector(".row-icon");
    const glyph = sparkline({ state: r.state, task: !!r.parent });
    glyph.classList.add("row-icon");
    if (icon) icon.replaceWith(glyph);
    else row.prepend(glyph);
    // Discovery rows may be public-read only; strands need repository access.
    if (!discovery && !r.parent && r.state === "ready") pending.push(row);
  }
  if (!pending.length) return;
  const load = (row) => {
    const r = byId.get(row.dataset.id);
    limited(() => strands(r.id))
      .then((list) => {
        if (!row.isConnected) return;
        const sum = summary(list);
        const active = list.filter((s) => ACTIVE.has(s.status)).map((s) => strandColor(s.index));
        const glyph = sparkline({ active, braided: sum.braided });
        glyph.classList.add("row-icon");
        row.querySelector(".bg-spark")?.replaceWith(glyph);
        const bits = [];
        if (sum.active) bits.push(plural(sum.active, "active strand"));
        if (sum.braidedAt) bits.push("braided " + ago(sum.braidedAt));
        else if (sum.braided) bits.push(plural(sum.braided, "strand") + " braided in");
        const main = row.querySelector(".row-main");
        main?.querySelector(".row-braid")?.remove();
        if (bits.length && main) main.append(html("span", { class: "row-braid", text: bits.join(" · ") }));
        row.setAttribute("data-strands", String(list.length));
      })
      .catch(() => {});
  };
  if (!("IntersectionObserver" in window)) return pending.forEach(load);
  rowObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          rowObserver.unobserve(e.target);
          load(e.target);
        }
    },
    { rootMargin: "200px 0px" },
  );
  pending.forEach((row) => rowObserver.observe(row));
}

/* ---------- strand map ---------- */
let current = null; // { repo, log, strands, selected }
let mapEpoch = 0;
let lastWidth = 0;
const mapRoot = () => document.getElementById("strand-map");

export async function showRepo(repo, { fresh = true } = {}) {
  const root = mapRoot();
  if (!root) return;
  const epoch = ++mapEpoch;
  if (repo.parent || repo.state !== "ready" || !repo.role) {
    root.hidden = true;
    current = null;
    return;
  }
  if (current?.repo.id !== repo.id) {
    current = null;
    root.replaceChildren();
    root.hidden = true;
  }
  try {
    const [log, list] = await Promise.all([
      host().api(`/api/repos/${repo.id}/log`),
      strands(repo.id, { fresh }),
    ]);
    if (epoch !== mapEpoch) return;
    current = { repo, log, strands: list, selected: current?.selected ?? null };
    root.hidden = false;
    render();
  } catch {
    if (epoch === mapEpoch) root.hidden = true;
  }
}
export function refresh() {
  if (current) return showRepo(current.repo);
}
export function hide() {
  mapEpoch++;
  current = null;
  const root = mapRoot();
  if (root) root.hidden = true;
}
export function select(id) {
  if (!current) return;
  current.selected = id;
  const root = mapRoot();
  root?.classList.toggle("has-selection", !!id);
  for (const g of root?.querySelectorAll("[data-strand]") ?? [])
    g.classList.toggle("is-selected", g.dataset.strand === id);
}

function counts(list) {
  const c = {};
  for (const s of list) c[s.status] = (c[s.status] ?? 0) + 1;
  return ["braided", "proposed", "approved", "working", "rejected"]
    .filter((k) => c[k])
    .map((k) => `${c[k]} ${STATUS_LABEL[k]}`);
}

function render() {
  const root = mapRoot();
  if (!root || !current) return;
  const { repo, log, strands: list } = current;
  const canStart = ["contributor", "writer", "admin"].includes(repo.role);
  const cs = getComputedStyle(root);
  const inner = root.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const width = Math.max(240, inner || 800);
  lastWidth = root.clientWidth;
  const head = html(
    "div",
    { class: "sm-head" },
    html(
      "div",
      { class: "sm-title" },
      html("h2", { text: "Strand map" }),
      html("p", {
        class: "muted",
        text: list.length
          ? [plural(list.length, "strand"), ...counts(list)].join(" · ")
          : "No strands yet. Every change starts as a strand: a private fork pinned to a commit.",
      }),
    ),
    canStart
      ? html("button", {
          type: "button",
          class: "btn btn-secondary sm-new",
          text: list.length ? "New strand" : "Start a strand",
          "aria-label": (list.length ? "New strand" : "Start a strand") + " from the strand map",
          onclick: () => host()?.newStrand(),
        })
      : null,
  );
  const scroller = html("div", { class: "sm-scroll" });
  const drawing = draw(repo, log, list, width);
  scroller.append(drawing.svg);
  const legend = html(
    "ul",
    { class: "sm-legend", "aria-label": "Strands" },
    list.slice(0, 12).map((s) =>
      html(
        "li",
        {},
        html(
          "button",
          {
            type: "button",
            class: `sm-chip ${strandColor(s.index)} is-${s.status}`,
            "data-strand": s.id,
            "aria-label": `${s.name ?? "Strand"}, ${STATUS_LABEL[s.status]}. Show strand`,
            onclick: () => host()?.openStrand(s.id),
          },
          html("span", { class: "sm-dot", "aria-hidden": "true" }),
          html("span", { class: "sm-chip-name", text: s.name ?? "a strand" }),
          html("span", { class: "sm-chip-status", text: STATUS_LABEL[s.status] }),
        ),
      ),
    ),
    list.length > 12 ? html("li", { class: "sm-more muted", text: `+${list.length - 12} more in Strands` }) : null,
  );
  root.replaceChildren(...[head, scroller, list.length ? legend : null].filter(Boolean));
  if (drawing.width > width) {
    scroller.tabIndex = 0;
    scroller.setAttribute("role", "region");
    scroller.setAttribute("aria-label", "Strand map, scroll sideways for earlier history");
    scroller.scrollLeft = scroller.scrollWidth;
  }
  select(current.selected);
}

// Geometry: oldest → newest commits left to right on the ink line. Each strand leaves
// from its base commit on its own lane; braided strands loop back into the commit they
// landed as (a knot), open strands run on to the right edge.
function draw(repo, log, list, width) {
  const narrow = width < 560;
  const L = narrow ? 26 : 40,
    R = narrow ? 14 : 24,
    tailMin = narrow ? 150 : 300,
    laneGap = narrow ? 34 : 38;
  const all = [...log].reverse();
  const shown = all.slice(-24);
  const k = shown.length;
  const gap = k > 1 ? Math.max(narrow ? 34 : 44, Math.min(150, (width - L - R - tailMin) / (k - 1))) : 0;
  const total = Math.max(width, L + Math.max(0, k - 1) * gap + tailMin + R);
  const xOf = new Map(shown.map((c, i) => [c.sha, L + i * gap]));
  const headX = k ? L + (k - 1) * gap : L;
  const startX = L - (narrow ? 18 : 28);
  const endX = total - R;
  const baseX = (sha) => (sha && xOf.has(sha) ? xOf.get(sha) : !k || sha === ZERO ? startX : startX);

  // Build drawable items, at most 8 on the canvas (open strands first).
  const items = [];
  const ordered = [...list].sort((a, b) => rank(a) - rank(b));
  for (const s of ordered.slice(0, 8)) {
    const braid = [...s.proposals].reverse().find((p) => p.braided && xOf.has(p.candidate));
    const label = `${s.name ?? "a strand"} · ${STATUS_LABEL[s.status]}`;
    const lw = Math.min(260, label.length * 7.2 + 14);
    if (braid) {
      const bx = baseX(braid.base),
        mx = xOf.get(braid.candidate);
      const cx = (bx + mx) / 2;
      // On narrow canvases a loop is only labelled when the name fits inside it; the
      // legend below the map always names every strand.
      const labelled = !narrow || lw <= mx - bx + 8;
      const half = labelled ? lw / 2 : 0;
      items.push({ s, kind: "loop", bx, mx, label, labelled, x1: Math.min(bx, cx - half) - 2, x2: Math.max(mx - 3, cx + half + 6) });
    }
    if (s.status !== "braided") {
      const from = braid ? xOf.get(braid.candidate) : s.base ? baseX(s.base) : headX;
      items.push({ s, kind: "open", bx: from, label, x1: from + 3, x2: endX + 40, faded: !braid && s.base && s.base !== ZERO && !xOf.has(s.base) });
    }
  }
  // Interval packing onto lanes alternating above/below the ink line.
  const laneOrder = [-1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6];
  const used = new Map();
  for (const it of items.filter((i) => i.kind === "open").concat(items.filter((i) => i.kind === "loop"))) {
    for (const lane of laneOrder) {
      const spans = used.get(lane) ?? [];
      if (spans.every(([a, b]) => it.x2 < a || it.x1 > b)) {
        spans.push([it.x1, it.x2]);
        used.set(lane, spans);
        it.lane = lane;
        break;
      }
    }
  }
  const drawn = items.filter((i) => i.lane !== undefined);
  // A strand that is both braided and still open shares one lane colour, separate lanes.
  const above = Math.max(1, ...drawn.filter((i) => i.lane < 0).map((i) => -i.lane));
  const below = Math.max(list.length ? 1 : 0, ...drawn.filter((i) => i.lane > 0).map((i) => i.lane));
  const top = 30,
    bottom = 30;
  const mid = top + above * laneGap;
  const height = mid + below * laneGap + bottom;
  const laneY = (lane) => mid + lane * laneGap;

  const desc = list.length
    ? `Strand map for ${repo.name}. The main line has ${plural(log.length >= 50 ? 50 : log.length, "commit")}${log.length >= 50 ? " or more" : ""}. ` +
      list.map((s) => `${s.name ?? "A strand"}: ${STATUS_LABEL[s.status]}.`).join(" ")
    : `Strand map for ${repo.name}. The main line has ${plural(log.length, "commit")} and no strands yet.`;
  const root = svg("svg", {
    class: "sm-svg" + (reduceMotion() ? " still" : ""),
    width: total,
    height,
    viewBox: `0 0 ${total} ${height}`,
    role: "img",
    "aria-label": desc,
  });

  const branch = repo.git?.defaultBranch ?? "main";
  const tag = k ? branch : "empty repository";
  const tagW = tag.length * 6.8 + 12;
  // Ink line: earlier history fades in from the left, the future fades out to the right.
  if (all.length > shown.length || !k)
    root.append(svg("path", { class: "sm-ink sm-ink-faint", d: `M${startX - 14} ${mid} L${k ? L : startX} ${mid}` }));
  root.append(
    svg("path", { class: "sm-ink", d: `M${all.length > shown.length ? L : startX} ${mid} L${headX} ${mid}` }),
    svg("path", { class: "sm-ink sm-ink-future", d: `M${headX} ${mid} L${endX - tagW} ${mid}` }),
  );

  const strandLayer = svg("g", { class: "sm-strands" });
  const knots = svg("g", { class: "sm-knots" });
  const labelLayer = svg("g", { class: "sm-labels" });
  for (const it of drawn) {
    const c = strandColor(it.s.index);
    const y = laneY(it.lane);
    let d;
    if (it.kind === "loop") {
      const span = it.mx - it.bx;
      const dx = Math.min(36, span / 2);
      d =
        `M${it.bx} ${mid} C ${it.bx + dx * 0.6} ${mid}, ${it.bx + dx * 0.4} ${y}, ${it.bx + dx} ${y}` +
        ` L ${it.mx - dx} ${y} C ${it.mx - dx * 0.4} ${y}, ${it.mx - dx * 0.6} ${mid}, ${it.mx} ${mid}`;
    } else {
      const dx = Math.min(44, Math.max(24, (endX - it.bx) / 4));
      d = `M${it.bx} ${mid} C ${it.bx + dx * 0.6} ${mid}, ${it.bx + dx * 0.4} ${y}, ${it.bx + dx} ${y} L ${endX - 10} ${y}`;
    }
    const status = it.s.status;
    const g = svg("g", {
      class: `sm-strand ${c} is-${it.kind === "loop" ? "braided" : status}`,
      "data-strand": it.s.id,
    });
    g.append(
      svg("path", { class: "sm-hit", d }),
      svg("path", { class: "sm-halo", d }),
      svg("path", { class: `sm-line ${c}`, d }),
    );
    if (it.kind === "open" && (status === "working" || status === "proposed" || status === "approved"))
      g.append(svg("path", { class: "sm-flow", d }));
    if (it.kind === "loop") knots.append(svg("circle", { class: `sm-knot ${c}`, "data-strand": it.s.id, cx: it.mx, cy: mid, r: 7 }));
    else if (status === "proposed") g.append(svg("circle", { class: `sm-cap ${c}`, cx: endX - 10, cy: y, r: 5.5 }));
    else if (status === "approved") g.append(svg("circle", { class: `sm-cap filled ${c}`, cx: endX - 10, cy: y, r: 5.5 }));
    else if (status === "rejected")
      g.append(svg("path", { class: "sm-x", d: `M${endX - 14} ${y - 4} L${endX - 6} ${y + 4} M${endX - 6} ${y - 4} L${endX - 14} ${y + 4}` }));
    g.append(svg("title", {}, it.label));
    g.addEventListener("click", () => host()?.openStrand(it.s.id));
    strandLayer.append(g);

    if (it.kind === "loop" && !it.labelled) continue;
    // Labels: above lanes print above the line, below lanes print beneath it.
    const ty = it.lane < 0 ? y - 10 : y + 19;
    const name = it.s.name ?? "a strand";
    const status2 = it.kind === "loop" ? "braided in" : STATUS_LABEL[status];
    const text =
      it.kind === "loop"
        ? svg("text", { class: "sm-label", x: (it.bx + it.mx) / 2, y: ty, "text-anchor": "middle" })
        : svg("text", { class: "sm-label", x: endX - 22, y: ty, "text-anchor": "end" });
    text.append(svg("tspan", { class: "sm-label-name" }, name), svg("tspan", { class: "sm-label-status", dx: 6 }, status2));
    text.dataset.strand = it.s.id;
    text.addEventListener("click", () => host()?.openStrand(it.s.id));
    labelLayer.append(text);
  }
  if (!list.length) {
    // Ghost strand inviting the first one.
    const y = laneY(-1),
      dx = 40;
    const d = `M${headX} ${mid} C ${headX + dx * 0.6} ${mid}, ${headX + dx * 0.4} ${y}, ${headX + dx} ${y} L ${endX - 10} ${y}`;
    strandLayer.append(svg("path", { class: "sm-ghost", d }));
    labelLayer.append(svg("text", { class: "sm-label sm-label-ghost", x: endX - 22, y: y - 10, "text-anchor": "end" }, "your first strand"));
  }

  const nodes = svg("g", { class: "sm-commits" });
  shown.forEach((c, i) => {
    const x = L + i * gap,
      isHead = i === k - 1;
    nodes.append(
      svg(
        "circle",
        { class: "sm-commit" + (isHead ? " head" : ""), cx: x, cy: mid, r: isHead ? 6 : 4.5 },
        svg("title", {}, `${short(c.sha)} ${(c.message ?? "").split("\n")[0]}`),
      ),
    );
  });
  if (!k) nodes.append(svg("circle", { class: "sm-commit empty", cx: startX, cy: mid, r: 5 }));
  root.append(strandLayer, nodes, knots, labelLayer);
  // The branch tag sits where the canonical line runs on, so the ink reads as "main".
  root.append(svg("text", { class: "sm-head-tag", x: endX, y: mid + 4, "text-anchor": "end" }, tag));
  return { svg: root, width: total };
}
function rank(s) {
  return { proposed: 0, approved: 1, working: 2, rejected: 3, braided: 4 }[s.status] ?? 9;
}

/* ---------- boot ---------- */
function mountArt() {
  for (const slot of document.querySelectorAll("[data-braid-art]")) {
    if (slot.firstElementChild) continue;
    const [w, h] = (slot.dataset.braidArt || "360x150").split("x").map(Number);
    slot.append(art({ width: w || 360, height: h || 150 }));
  }
}
if ("ResizeObserver" in window) {
  let t;
  new ResizeObserver(() => {
    clearTimeout(t);
    t = setTimeout(() => {
      const root = mapRoot();
      if (current && root && !root.hidden && Math.abs(root.clientWidth - lastWidth) > 8) render();
    }, 120);
  }).observe(document.documentElement);
}
mountArt();

window.Braid = {
  strands,
  strandStatus,
  strandColor,
  STATUS_LABEL,
  showRepo,
  refresh,
  hide,
  select,
  decorateRepos,
  swatch,
  sparkline,
  logo,
  art,
};
document.dispatchEvent(new CustomEvent("braid:ready"));
