// Authoring helper: emits braid-promo v3 scene sub-compositions + index.html.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
const flen = (f) => +(+execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${f}"`).toString()).toFixed(3);

const P = "/Users/vas/Documents/videos/braid-promo";
const S = path.dirname(new URL(import.meta.url).pathname);
const timing = JSON.parse(fs.readFileSync(path.join(S, "timing.json"), "utf8"));
const words = {};
for (const t of timing) words[t.id] = JSON.parse(fs.readFileSync(`${P}/.hyperframes/words3/${t.id}.json`, "utf8"));
const LEAD = 0.15;
const w = (id, i) => +(LEAD + words[id][i].start).toFixed(3);

const C = { cream: "#faf7f2", deep: "#f1ebe1", ink: "#1f1a15", muted: "#5e5248", hair: "#e2d9cc", orange: "#e8590c", saffron: "#c99a2e", umber: "#7a5c46" };
const STRANDS = [C.orange, C.saffron, C.umber];
const f = (n) => +n.toFixed(1);

function sine(x0, x1, yc, amp, wl, ph, step = 8) {
  let d = "";
  for (let x = x0; x <= x1 + 0.01; x += step) {
    const y = yc + amp * Math.sin((2 * Math.PI * (x - x0)) / wl + ph);
    d += (d ? " L" : "M") + f(x) + "," + f(y);
  }
  return d;
}
const fanPath = (x0, y0, x1, y1) => `M${f(x0)},${f(y0)} C${f(x0 + (x1 - x0) * 0.5)},${f(y0)} ${f(x1 - (x1 - x0) * 0.35)},${f(y1)} ${f(x1)},${f(y1)}`;
const pth = (id, d, color, sw, extra = "") => `<path id="${id}" d="${d}" pathLength="1" fill="none" stroke="${color}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="1" stroke-dashoffset="1" ${extra}/>`;
const dot = (id, cx, cy, r, color, extra = "") => `<circle id="${id}" cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${C.cream}" stroke-width="4" ${extra}/>`;

const FONTS = [
  ["Inter Tight", 500, "normal", "inter-tight-500"], ["Inter Tight", 600, "normal", "inter-tight-600"], ["Inter Tight", 700, "normal", "inter-tight-700"],
  ["Inter Tight", 800, "normal", "inter-tight-800"], ["Inter Tight", 900, "normal", "inter-tight-900"],
  ["Instrument Serif", 400, "italic", "instrument-serif-italic"],
  ["IBM Plex Mono", 500, "normal", "ibm-plex-mono-500"], ["IBM Plex Mono", 600, "normal", "ibm-plex-mono-600"],
].map(([fam, wt, st, file]) => `@font-face { font-family: "${fam}"; font-weight: ${wt}; font-style: ${st}; font-display: block; src: url("assets/fonts/${file}.woff2") format("woff2"); }`).join("\n");

const BASE_CSS = (p) => `
#root { position: absolute; inset: 0; overflow: hidden; font-family: "Inter Tight", sans-serif; color: ${C.ink}; }
#${p}-ground { position: absolute; inset: 0; background: ${C.cream}; }
#root .svg { position: absolute; left: 0; top: 0; width: 1920px; height: 1080px; overflow: visible; }
#root .hl { position: absolute; left: 192px; font-weight: 800; letter-spacing: -0.045em; line-height: 1; white-space: nowrap; color: ${C.ink}; }
#root .em { font-family: "Instrument Serif", serif; font-style: italic; font-weight: 400; letter-spacing: -0.01em; color: ${C.orange}; font-size: 1.12em; line-height: 0.8; }
#root .w { display: inline-block; }
#root .sw { opacity: 0; }
#root .proof { position: absolute; left: 192px; top: 948px; display: flex; align-items: center; gap: 22px; font-family: "IBM Plex Mono", monospace; font-weight: 500; font-size: 25px; letter-spacing: 0.1em; text-transform: uppercase; color: ${C.muted}; white-space: nowrap; opacity: 0; }
#root .proof .tick { width: 40px; height: 3px; background: ${C.orange}; }
#root .label { font-family: "IBM Plex Mono", monospace; font-weight: 500; font-size: 22px; letter-spacing: 0.08em; color: ${C.muted}; white-space: nowrap; }
`;

const HELPERS = `
const tl = gsap.timeline({ paused: true });
const $ = (s) => root.querySelector(s);
const $$ = (s) => Array.prototype.slice.call(root.querySelectorAll(s));
function rise(el, t, dy, d) { tl.fromTo(el, { opacity: 0, y: dy == null ? 60 : dy }, { opacity: 1, y: 0, duration: d || 0.5, ease: "expo.out" }, t); }
function show(el, t) { tl.set(el, { opacity: 1 }, t); }
function hide(el, t) { tl.set(el, { opacity: 0 }, t); }
function draw(el, t, d, ease) { tl.fromTo(el, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: d, ease: ease || "power2.inOut" }, t); }
function pop(el, t, d) { tl.fromTo(el, { scale: 0, transformOrigin: "50% 50%" }, { scale: 1, duration: d || 0.4, ease: "back.out(2.6)" }, t); }
function proof(el, t) { tl.fromTo(el, { opacity: 0, x: -24 }, { opacity: 1, x: 0, duration: 0.45, ease: "power3.out" }, t); }
function count(el, from, to, t, d, fmt, ease) { const o = { v: from }; tl.to(o, { v: to, duration: d, ease: ease || "power2.out", onUpdate: function () { el.textContent = fmt ? fmt(o.v) : String(Math.round(o.v)); } }, t); tl.call(function () { el.textContent = fmt ? fmt(from) : String(from); }, null, Math.max(0, t - 0.001)); }
`;

function scene(t, css, html, js) {
  const p = `s${t.id}`;
  const cid = `v3-${t.id}-${t.name}`;
  const file = `compositions/v3/${t.id}-${t.name}.html`;
  const doc = `<!doctype html>
<html>
  <head><meta charset="UTF-8" /></head>
  <body>
    <template>
      <style>
${FONTS}
${BASE_CSS(p)}
${css}
      </style>
      <div id="root" data-composition-id="${cid}" data-width="1920" data-height="1080" data-duration="${t.dur}">
        <div id="${p}-ground" class="clip" data-start="0" data-duration="${t.dur}" data-track-index="0"></div>
${html}
      </div>
      <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
      <script>
        (function () {
          const root = document.querySelector('[data-composition-id="${cid}"]');
${HELPERS}
${js}
          window.__timelines["${cid}"] = tl;
        })();
      </script>
    </template>
  </body>
</html>
`;
  fs.mkdirSync(`${P}/compositions/v3`, { recursive: true });
  fs.writeFileSync(`${P}/${file}`, doc);
  return { ...t, cid, file };
}

const T = Object.fromEntries(timing.map((t) => [t.id, t]));
const out = [];
const sfx = []; // [absTime, file, dur, vol]
const S_ = (id, rel, file, dur, vol) => sfx.push([+(T[id].start + rel).toFixed(3), file, Math.min(dur, flen(`${P}/assets/sfx/${file}`)), vol]);

// ───────── 01 HOOK ─────────
{
  const id = "01", p = "s01";
  let fan = "";
  const N = 100, ox = 1240, oy = 560;
  for (let i = 0; i < N; i++) {
    const y = 110 + (i * (980 - 110)) / (N - 1);
    fan += pth(`${p}-f${i}`, fanPath(ox, oy, 1960, y), STRANDS[i % 3], 2.2, `class="fan" opacity="0.9"`);
  }
  out.push(scene(T[id], `
#${p}-l1 { top: 170px; font-size: 120px; }
#${p}-num { top: 290px; font-size: 380px; color: ${C.orange}; letter-spacing: -0.06em; line-height: 1; font-variant-numeric: tabular-nums; }
#${p}-l3 { top: 690px; font-size: 120px; }
#${p}-origin { }
`, `
        <svg class="svg" viewBox="0 0 1920 1080">${fan}${dot(`${p}-o`, ox, oy, 12, C.ink)}</svg>
        <div id="${p}-l1" class="hl"><span class="w sw">You</span> <span class="w sw">can</span> <span class="w sw">run</span></div>
        <div id="${p}-num" class="hl sw">100</div>
        <div id="${p}-l3" class="hl"><span class="w sw">coding</span> <span class="w sw">agents</span> <span class="w sw">now.</span></div>
`, `
const l1 = $$("#${p}-l1 .w"), l3 = $$("#${p}-l3 .w");
rise(l1[0], ${w(id, 0)}); rise(l1[1], ${w(id, 1)}); rise(l1[2], ${w(id, 2)});
tl.fromTo($("#${p}-num"), { opacity: 0, scale: 0.6, transformOrigin: "0% 60%" }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.8)" }, ${w(id, 4) - 0.05});
count($("#${p}-num"), 1, 100, ${w(id, 4) - 0.05}, 0.55, null, "power3.out");
rise(l3[0], ${w(id, 5)}); rise(l3[1], ${w(id, 6)}); rise(l3[2], ${w(id, 7)});
pop($("#${p}-o"), ${w(id, 4) - 0.1}, 0.3);
$$("#root .fan").forEach(function (el, i) { draw(el, ${w(id, 4)} + (i % 25) * 0.028 + Math.floor(i / 25) * 0.05, 0.75, "power3.out"); });
`));
  S_(id, w(id, 4) - 0.05, "pop.wav", 0.12, 0.45);
  S_(id, w(id, 4), "whoosh-short.wav", 0.6, 0.35);
}

// ───────── 02 CAN'T ─────────
{
  const id = "02", p = "s02";
  // tangle: three scribbles
  const knot = (k) => {
    let d = "M" + (560 + k * 30) + "," + 840;
    for (let j = 0; j < 9; j++) {
      const x = 760 + Math.sin(j * 1.9 + k * 2.1) * 170 + j * 40;
      const y = 830 + Math.cos(j * 2.3 + k * 1.3) * 70;
      const cx = x + Math.sin(j + k) * 120, cy = y - 90 * Math.cos(j * 1.7 + k);
      d += ` Q${f(cx)},${f(cy)} ${f(x)},${f(y)}`;
    }
    return d + " L1400," + (840 + k * 6);
  };
  const svg = [0, 1, 2].map((k) => pth(`${p}-k${k}`, knot(k), STRANDS[k], 5)).join("");
  out.push(scene(T[id], `
#${p}-a { left: 0; right: 0; text-align: center; top: 230px; font-size: 210px; }
#${p}-b { left: 0; right: 0; text-align: center; top: 440px; font-size: 260px; }
#${p}-b .em { font-size: 1.15em; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080"><path d="M0,840 L560,840" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/><path d="M1400,846 L1920,846" fill="none" stroke="${C.ink}" stroke-width="8" stroke-linecap="round"/>${svg}</svg>
        <div id="${p}-a" class="hl"><span class="w sw">Your</span> <span class="w sw">repo</span></div>
        <div id="${p}-b" class="hl"><span id="${p}-cant" class="w sw em">can&rsquo;t.</span></div>
`, `
const a = $$("#${p}-a .w");
rise(a[0], ${w(id, 0)}, 40, 0.35); rise(a[1], ${w(id, 1)}, 40, 0.35);
tl.fromTo($("#${p}-cant"), { opacity: 0, scale: 1.25, transformOrigin: "50% 60%" }, { opacity: 1, scale: 1, duration: 0.28, ease: "power4.out" }, ${w(id, 2)});
var sh = [14, -12, 9, -6, 3, 0];
sh.forEach(function (x, i) { tl.to($("#${p}-b"), { x: x, duration: 0.045, ease: "none" }, ${w(id, 2)} + 0.28 + i * 0.045); });
[0, 1, 2].forEach(function (k) { draw($("#${p}-k" + k), ${w(id, 2) - 0.1} + k * 0.06, 0.55, "power2.out"); });
`));
  S_(id, w(id, 2), "impact-thud.wav", 0.6, 0.6);
  S_(id, w(id, 2) + 0.05, "glitch-hit.wav", 0.4, 0.25);
}

// ───────── 03 PAIN ─────────
{
  const id = "03", p = "s03";
  const cutB = w(id, 4) - 0.04, cutC = w(id, 7) - 0.04;
  let cards = "";
  for (let i = 0; i < 12; i++) {
    const rot = [-3, 2, -1.5, 3.5, -2.5, 1, -4, 2.5, -1, 3, -2, 1.5][i];
    const x = 1120 + [0, 30, -20, 40, 10, -30, 25, -10, 35, 0, -25, 15][i];
    cards += `<div class="card" data-layout-allow-occlusion id="${p}-c${i}" style="left:${x}px;top:${872 - i * 62}px;rotate:${rot * 0.6}deg"><span class="pr">#${412 + i * 7}</span><span class="bar" style="width:${150 + ((i * 53) % 140)}px"></span><span class="tag">review requested</span></div>`;
  }
  out.push(scene(T[id], `
#root .grp { position: absolute; inset: 0; opacity: 0; }
#${p}-ga { opacity: 1; }
#${p}-a1 { top: 190px; font-size: 130px; }
#${p}-clock { position: absolute; left: 192px; top: 330px; font-weight: 800; font-size: 330px; letter-spacing: -0.05em; line-height: 1; font-variant-numeric: tabular-nums; color: ${C.ink}; }
#${p}-clock .am { font-size: 0.38em; letter-spacing: -0.02em; margin-left: 24px; color: ${C.muted}; }
#${p}-mk { position: absolute; left: 1180px; top: 395px; display: flex; flex-direction: column; gap: 30px; font-family: "IBM Plex Mono", monospace; font-weight: 600; font-size: 44px; }
#${p}-mk .m1 { color: ${C.orange}; } #${p}-mk .m2 { color: ${C.muted}; } #${p}-mk .m3 { color: ${C.umber}; }
#${p}-b1 { top: 190px; font-size: 150px; }
#${p}-c1 { top: 190px; font-size: 130px; }
#${p}-c2 { top: 330px; font-size: 130px; }
#root .card { position: absolute; width: 560px; height: 58px; background: #ffffff; border: 2px solid ${C.hair}; border-radius: 14px; display: flex; align-items: center; gap: 22px; padding: 0 26px; opacity: 0; }
#root .card .pr { font-family: "IBM Plex Mono", monospace; font-weight: 600; font-size: 24px; color: ${C.umber}; }
#root .card .bar { height: 14px; border-radius: 7px; background: ${C.hair}; }
#root .card .tag { margin-left: auto; font-family: "IBM Plex Mono", monospace; font-size: 18px; font-weight: 500; color: ${C.orange}; border: 2px solid ${C.orange}; border-radius: 99px; padding: 2px 12px; white-space: nowrap; }
`, `
        <div id="${p}-ga" class="grp">
          <div id="${p}-a1" class="hl sw">Conflicts</div>
          <div id="${p}-clock" class="sw"><span id="${p}-hh">2:00</span><span class="am">am</span></div>
          <div id="${p}-mk"><span class="m1 sw">&lt;&lt;&lt;&lt;&lt;&lt;&lt; HEAD</span><span class="m2 sw">=======</span><span class="m3 sw">&gt;&gt;&gt;&gt;&gt;&gt;&gt; agent-17</span></div>
        </div>
        <div id="${p}-gb" class="grp">
          <svg class="svg" viewBox="0 0 1920 1080">
            <g id="${p}-mainL"><path d="M-20,720 L940,720" stroke="${C.ink}" stroke-width="10" stroke-linecap="round" fill="none"/>${dot(`${p}-d0`, 300, 720, 13, C.ink)}${dot(`${p}-d1`, 560, 720, 13, C.ink)}${dot(`${p}-d2`, 820, 720, 13, C.ink)}</g>
            <g id="${p}-mainR"><path d="M980,720 L1940,720" stroke="${C.ink}" stroke-width="10" stroke-linecap="round" fill="none"/>${dot(`${p}-d3`, 1100, 720, 13, C.ink)}${dot(`${p}-d4`, 1360, 720, 13, C.ink)}${dot(`${p}-d5`, 1620, 720, 13, C.ink)}</g>
            <path id="${p}-crack" d="M960,640 L940,690 L985,712 L950,760 L975,800" fill="none" stroke="${C.orange}" stroke-width="7" stroke-linejoin="round" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>
          </svg>
          <div id="${p}-b1" class="hl"><span class="w sw">Main,</span> <span class="w sw">broken.</span> <span class="w sw em">again.</span></div>
          <div id="${p}-lbl" class="label sw" style="position:absolute;left:192px;top:770px">main</div>
        </div>
        <div id="${p}-gc" class="grp">
          <div id="${p}-c1" class="hl"><span class="w sw">A</span> <span class="w sw">review</span> <span class="w sw">pile</span></div>
          <div id="${p}-c2" class="hl"><span class="w sw">that</span> <span class="w sw em">never</span> <span class="w sw">ends.</span></div>
          ${cards}
        </div>
`, `
// A — 2 a.m.
rise($("#${p}-a1"), ${w(id, 0)}, 40, 0.35);
tl.fromTo($("#${p}-clock"), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.35, ease: "expo.out" }, ${w(id, 2) - 0.05});
var mk = $$("#${p}-mk span"); mk.forEach(function (el, i) { rise(el, ${w(id, 1)} + i * 0.12, 20, 0.3); });
// B — main broken
hide($("#${p}-ga"), ${cutB}); show($("#${p}-gb"), ${cutB});
var b = $$("#${p}-b1 .w"); rise(b[0], ${cutB}, 40, 0.35); rise(b[1], ${w(id, 5)}, 40, 0.35); rise(b[2], ${w(id, 6)}, 40, 0.4);
show($("#${p}-lbl"), ${cutB});
draw($("#${p}-crack"), ${w(id, 5)}, 0.18, "none");
tl.to($("#${p}-mainR"), { y: 70, rotation: 6, svgOrigin: "980 720", duration: 0.5, ease: "bounce.out" }, ${w(id, 5) + 0.12});
tl.to($("#${p}-mainL"), { y: 18, rotation: -2, svgOrigin: "940 720", duration: 0.5, ease: "power3.out" }, ${w(id, 5) + 0.12});
// C — review pile
hide($("#${p}-gb"), ${cutC}); show($("#${p}-gc"), ${cutC});
var c = $$("#${p}-c1 .w, #${p}-c2 .w");
var ct = [${cutC}, ${w(id, 8)}, ${w(id, 9)}, ${w(id, 10)}, ${w(id, 11)}, ${w(id, 12)}];
c.forEach(function (el, i) { rise(el, ct[i], 40, 0.35); });
$$("#root .card").forEach(function (el, i) { tl.fromTo(el, { opacity: 0, y: -260 }, { opacity: 1, y: 0, duration: 0.32, ease: "power4.in" }, ${cutC + 0.1} + i * 0.16); });
`));
  S_(id, w(id, 2) - 0.05, "clack.wav", 0.3, 0.4);
  S_(id, cutB, "whoosh-short.wav", 0.5, 0.25);
  S_(id, w(id, 5), "error-buzz.wav", 0.5, 0.3);
  S_(id, w(id, 5) + 0.15, "impact-thud.wav", 0.5, 0.35);
  for (let i = 0; i < 12; i += 2) S_(id, cutC + 0.1 + i * 0.16 + 0.3, "card-flick.wav", 0.18, 0.35);
}

// ───────── 04 MEET BRAID ─────────
{
  const id = "04", p = "s04";
  const br = [0, 1, 2].map((k) => pth(`${p}-s${k}`, sine(-40, 2440, 860, 46, 360, (k * 2 * Math.PI) / 3), STRANDS[k], 7)).join("");
  out.push(scene(T[id], `
#${p}-meet { left: 0; right: 0; text-align: center; top: 330px; font-size: 150px; }
#${p}-word { left: 0; right: 0; text-align: center; top: 230px; font-size: 330px; letter-spacing: -0.06em; }
#${p}-tag { left: 0; right: 0; text-align: center; top: 610px; font-size: 64px; font-weight: 600; letter-spacing: -0.02em; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080"><g id="${p}-br">${br}</g></svg>
        <div id="${p}-meet" class="hl sw">Meet</div>
        <div id="${p}-word" class="hl sw">Braid</div>
        <div id="${p}-tag" class="hl"><span class="w sw">Where</span> <span class="w sw">parallel</span> <span class="w sw">work</span> <span class="w sw">comes</span> <span class="w sw em">together.</span></div>
`, `
rise($("#${p}-meet"), ${w(id, 0)}, 40, 0.3);
hide($("#${p}-meet"), ${w(id, 1) - 0.02});
tl.fromTo($("#${p}-word"), { opacity: 0, scale: 0.82, transformOrigin: "50% 60%" }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.7)" }, ${w(id, 1) - 0.02});
[0, 1, 2].forEach(function (k) { draw($("#${p}-s" + k), 0.05 + k * 0.08, 0.9, "power3.out"); });
tl.fromTo($("#${p}-br"), { x: 0 }, { x: -360, duration: ${T[id].dur}, ease: "none" }, 0);
var tg = $$("#${p}-tag .w"); var tt = [${w(id, 2)}, ${w(id, 3)}, ${w(id, 4)}, ${w(id, 5)}, ${w(id, 6)}];
tg.forEach(function (el, i) { rise(el, tt[i], 30, 0.4); });
`));
  S_(id, 0, "whoosh-big.wav", 1.1, 0.4);
  S_(id, w(id, 1) - 0.02, "impact-boom.wav", 1.2, 0.55);
  S_(id, w(id, 6), "shimmer.wav", 1.4, 0.28);
}

// ───────── 05 OWN STRAND ─────────
{
  const id = "05", p = "s05";
  const MY = 700, lanes = [500, 560, 620, 780, 840, 900], bx = [330, 470, 610, 750, 890, 1030];
  let svg = `<path id="${p}-main" d="M-20,${MY} L1940,${MY}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`;
  for (let i = 0; i < 6; i++) {
    const x = bx[i], y = lanes[i];
    svg += pth(`${p}-b${i}`, `M${x},${MY} C${x + 110},${MY} ${x + 70},${y} ${x + 200},${y} L1960,${y}`, STRANDS[i % 3], 5);
    svg += dot(`${p}-a${i}`, x + 200, y, 11, STRANDS[i % 3]);
  }
  svg += dot(`${p}-m0`, 190, MY, 12, C.ink);
  out.push(scene(T[id], `
#${p}-h1 { top: 150px; font-size: 120px; }
#${p}-h2 { top: 272px; font-size: 120px; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080">${svg}</svg>
        <div id="${p}-h1" class="hl"><span class="w sw">Every</span> <span class="w sw">agent</span> <span class="w sw">gets</span></div>
        <div id="${p}-h2" class="hl"><span class="w sw">its</span> <span class="w sw">own</span> <span class="w sw em">strand.</span></div>
        <div id="${p}-pf" class="proof"><span class="tick"></span>A private fork per task &middot; pinned to an exact commit &middot; Cloudflare Artifacts</div>
`, `
var h = $$("#${p}-h1 .w, #${p}-h2 .w"); var ht = [${w(id, 0)}, ${w(id, 1)}, ${w(id, 2)}, ${w(id, 3)}, ${w(id, 4)}, ${w(id, 5)}];
h.forEach(function (el, i) { rise(el, ht[i], 40, 0.4); });
draw($("#${p}-main"), 0, 0.5, "power3.out"); pop($("#${p}-m0"), 0.1, 0.3);
for (var i = 0; i < 6; i++) {
  draw($("#${p}-b" + i), 0.45 + i * 0.14, 0.7, "power2.out");
  pop($("#${p}-a" + i), 0.62 + i * 0.14, 0.3);
  tl.to($("#${p}-a" + i), { attr: { cx: 1560 + (i % 2) * 90 }, duration: 1.7, ease: "power2.inOut" }, ${w(id, 6)} + i * 0.05);
}
proof($("#${p}-pf"), ${w(id, 5) + 0.25});
`));
  for (let i = 0; i < 6; i += 2) S_(id, 0.62 + i * 0.14, "tick.wav", 0.08, 0.35);
  S_(id, w(id, 6), "whoosh-short.wav", 0.6, 0.25);
}

// ───────── 06 MAIN STAYS CLEAN ─────────
{
  const id = "06", p = "s06";
  const MY = 760, LY = 600, GX = 1000, QX = 1160, SP = 120, FX = 1090;
  let svg = `<path d="M${GX},${MY} L1940,${MY}" stroke="${C.hair}" stroke-width="5" stroke-dasharray="4 14" stroke-linecap="round" fill="none"/>`;
  svg += `<path id="${p}-main" d="M-20,${MY} L${GX},${MY}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`;
  svg += pth(`${p}-lane`, `M1960,${LY} L1100,${LY} C1040,${LY} ${GX},${LY + 60} ${GX},${MY}`, C.saffron, 4);
  svg += `<rect id="${p}-gate" x="${FX - 5}" y="${LY - 46}" width="10" height="92" rx="5" fill="${C.ink}"/>`;
  const base = [GX - 3 * SP, GX - 2 * SP, GX - SP];
  base.forEach((x, i) => (svg += dot(`${p}-c${i}`, x, MY, 13, C.ink)));
  const qcol = [C.orange, C.umber, C.saffron, C.orange, C.umber];
  for (let i = 0; i < 5; i++) svg += dot(`${p}-q${i}`, QX + i * SP, LY, 14, qcol[i]);
  const h = [
    ["Changes line up.", null], ["One at a time.", null], ["Nothing gets", "overwritten."], ["Main stays", "clean."],
  ];
  const hHtml = h.map(([a, e], i) => `<div id="${p}-h${i}" class="hl sw" style="top:150px;font-size:130px">${a}${e ? ` <span class="em">${e}</span>` : ""}</div>`).join("\n");
  // event schedule: braid-ins of q0,q1,q2 then race q3 (lands) vs q4 (refused), then q4 lands
  const t1 = w(id, 4), t2 = w(id, 6), t3 = w(id, 9) - 0.05, tr = w(id, 10), t5 = w(id, 13) + 0.1;
  out.push(scene(T[id], ``, `
        <svg class="svg" viewBox="0 0 1920 1080">${svg}</svg>
${hHtml}
        <div class="label" style="position:absolute;left:192px;top:800px">main</div>
        <div id="${p}-pf" class="proof"><span class="tick"></span>Fenced merge &middot; 30 racing at once &rarr; exactly 1 lands, 29 catch up</div>
`, `
var GX = ${GX}, MY = ${MY}, LY = ${LY}, QX = ${QX}, SP = ${SP};
draw($("#${p}-main"), 0, 0.45, "power3.out");
draw($("#${p}-lane"), 0.05, 0.5, "power3.out");
[0, 1, 2].forEach(function (i) { pop($("#${p}-c" + i), 0.1 + i * 0.06, 0.3); });
pop($("#${p}-gate"), 0.3, 0.3);
for (var i = 0; i < 5; i++) pop($("#${p}-q" + i), 0.35 + i * 0.07, 0.3);
// headline swaps
show($("#${p}-h0"), ${w(id, 0)}); tl.fromTo($("#${p}-h0"), { y: 40 }, { y: 0, duration: 0.4, ease: "expo.out" }, ${w(id, 0)});
hide($("#${p}-h0"), ${w(id, 6)}); show($("#${p}-h1"), ${w(id, 6)});
hide($("#${p}-h1"), ${w(id, 10)}); show($("#${p}-h2"), ${w(id, 10)});
hide($("#${p}-h2"), ${w(id, 13)}); show($("#${p}-h3"), ${w(id, 13)});
[1, 2, 3].forEach(function (k) { tl.fromTo($("#${p}-h" + k), { y: 30 }, { y: 0, duration: 0.3, ease: "expo.out" }, [0, ${w(id, 6)}, ${w(id, 10)}, ${w(id, 13)}][k]); });
// main commits: absolute positions over time
var commits = ["#${p}-c0", "#${p}-c1", "#${p}-c2"];
function land(sel, t) {
  // move along the lane into main at GX
  tl.to($(sel), { attr: { cx: GX }, duration: 0.34, ease: "power1.out" }, t);
  tl.to($(sel), { attr: { cy: MY }, duration: 0.34, ease: "power2.in" }, t);
  // shift existing commits left
  commits.forEach(function (c, j) { tl.to($(c), { attr: { cx: GX - (commits.length - j) * SP }, duration: 0.25, ease: "power2.out" }, t + 0.34); });
  tl.fromTo($("#${p}-gate"), { fill: "${C.orange}" }, { fill: "${C.ink}", duration: 0.35 }, t + 0.1);
  commits.push(sel);
}
function shiftQueue(idx, t) { for (var k = idx; k < 5; k++) tl.to($("#${p}-q" + k), { attr: { cx: QX + (k - idx) * SP }, duration: 0.25, ease: "power2.out" }, t); }
land("#${p}-q0", ${t1}); shiftQueue(1, ${t1 + 0.2});
land("#${p}-q1", ${t2}); shiftQueue(2, ${t2 + 0.2});
land("#${p}-q2", ${t3}); shiftQueue(3, ${t3 + 0.2});
// race: q4 rushes alongside q3, hits the gate, bounces back
tl.to($("#${p}-q4"), { attr: { cx: ${FX + 20} }, duration: 0.2, ease: "power2.in" }, ${tr});
tl.to($("#${p}-q4"), { attr: { cx: QX }, duration: 0.45, ease: "back.out(3)" }, ${tr + 0.2});
land("#${p}-q3", ${tr});
tl.fromTo($("#${p}-gate"), { scaleY: 1.35, transformOrigin: "50% 50%" }, { scaleY: 1, duration: 0.4, ease: "elastic.out(1,0.4)" }, ${tr + 0.2});
land("#${p}-q4", ${t5});
proof($("#${p}-pf"), ${w(id, 11)});
`));
  [t1, t2, t3, tr, t5].forEach((t) => S_(id, t + 0.34, "pop.wav", 0.12, 0.42));
  S_(id, tr + 0.2, "bonk.wav", 0.3, 0.35);
  S_(id, w(id, 15), "ding.wav", 1.0, 0.35);
}

// ───────── 07 CATCH-UP ─────────
{
  const id = "07", p = "s07";
  const MY = 760, LY = 590;
  let svg = `<path id="${p}-main" d="M-20,${MY} L1940,${MY}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`;
  [260, 420, 580].forEach((x, i) => (svg += dot(`${p}-c${i}`, x, MY, 13, C.ink)));
  [740, 900, 1060].forEach((x, i) => (svg += dot(`${p}-n${i}`, x, MY, 13, C.ink)));
  const bx = 420;
  svg += `<g id="${p}-br">${pth(`${p}-b`, `M${bx},${MY} C${bx + 110},${MY} ${bx + 70},${LY} ${bx + 200},${LY} L${bx + 520},${LY}`, C.orange, 6)}${dot(`${p}-w0`, bx + 280, LY, 12, C.orange)}${dot(`${p}-w1`, bx + 440, LY, 12, C.orange)}<text id="${p}-stale" x="${bx + 210}" y="${LY - 34}" font-family="IBM Plex Mono" font-weight="600" font-size="24" letter-spacing="2" fill="${C.umber}" opacity="0">STALE</text><text id="${p}-ok" x="${bx + 210}" y="${LY - 34}" font-family="IBM Plex Mono" font-weight="600" font-size="24" letter-spacing="2" fill="${C.orange}" opacity="0">CAUGHT UP</text></g>`;
  out.push(scene(T[id], `
#${p}-h0 { top: 150px; font-size: 140px; }
#${p}-h1 { top: 150px; font-size: 120px; }
#${p}-h2 { top: 272px; font-size: 120px; }
#${p}-timer { position: absolute; right: 192px; top: 150px; text-align: right; opacity: 0; }
#${p}-timer .v { font-weight: 800; font-size: 200px; letter-spacing: -0.05em; line-height: 1; font-variant-numeric: tabular-nums; color: ${C.orange}; }
#${p}-timer .u { font-weight: 700; font-size: 90px; letter-spacing: -0.03em; color: ${C.orange}; margin-left: 8px; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080">${svg}</svg>
        <div id="${p}-h0" class="hl sw">Fall <span class="em">behind?</span></div>
        <div id="${p}-h1" class="hl"><span class="w sw">Your</span> <span class="w sw">work</span></div>
        <div id="${p}-h2" class="hl"><span class="w sw">catches</span> <span class="w sw em">itself</span> <span class="w sw">up.</span></div>
        <div id="${p}-timer"><span id="${p}-tv" class="v">0.0</span><span class="u">s</span></div>
        <div id="${p}-pf" class="proof"><span class="tick"></span>Fast catch-up &middot; rebased inside the Worker &middot; 2.4&ndash;2.9 s &middot; no container</div>
`, `
draw($("#${p}-main"), 0, 0.4, "power3.out");
[0, 1, 2].forEach(function (i) { pop($("#${p}-c" + i), 0.05 + i * 0.05, 0.3); });
draw($("#${p}-b"), 0.12, 0.45, "power2.out"); pop($("#${p}-w0"), 0.35, 0.3); pop($("#${p}-w1"), 0.45, 0.3);
rise($("#${p}-h0"), ${w(id, 0)}, 40, 0.4);
// main moves ahead -> strand goes stale
[0, 1, 2].forEach(function (i) { pop($("#${p}-n" + i), ${w(id, 1)} + i * 0.13, 0.3); });
tl.to($("#${p}-b"), { opacity: 0.35, duration: 0.2 }, ${w(id, 1) + 0.3});
show($("#${p}-stale"), ${w(id, 1) + 0.3});
hide($("#${p}-h0"), ${w(id, 2)});
var h = $$("#${p}-h1 .w, #${p}-h2 .w"); var ht = [${w(id, 2)}, ${w(id, 3)}, ${w(id, 4)}, ${w(id, 5)}, ${w(id, 6)}];
h.forEach(function (el, i) { rise(el, ht[i], 40, 0.4); });
// catch up: slide branch base onto the new head (x +640)
tl.to($("#${p}-br"), { x: 640, duration: 0.55, ease: "expo.inOut" }, ${w(id, 4)});
tl.to($("#${p}-b"), { opacity: 1, duration: 0.2 }, ${w(id, 4) + 0.45});
hide($("#${p}-stale"), ${w(id, 4) + 0.3}); show($("#${p}-ok"), ${w(id, 4) + 0.55});
// timer
show($("#${p}-timer"), ${w(id, 4)});
count($("#${p}-tv"), 0, 2.4, ${w(id, 4)}, ${(w(id, 8) - w(id, 4) + 0.1).toFixed(2)}, function (v) { return v.toFixed(1); }, "power1.out");
tl.fromTo($("#${p}-timer"), { scale: 1 }, { scale: 1.08, duration: 0.12, yoyo: true, repeat: 1, transformOrigin: "100% 50%" }, ${w(id, 8) + 0.1});
proof($("#${p}-pf"), ${w(id, 7)});
`));
  S_(id, w(id, 1), "tick.wav", 0.08, 0.3);
  S_(id, w(id, 1) + 0.26, "tick.wav", 0.08, 0.3);
  S_(id, w(id, 4), "scan-sweep.wav", 1.0, 0.25);
  S_(id, w(id, 8) + 0.1, "success-chime.wav", 1.0, 0.3);
}

// ───────── 08 REVIEW WHAT MATTERS ─────────
{
  const id = "08", p = "s08";
  const MY = 840, lanes = [540, 610, 680, 750], cols = [C.umber, C.orange, C.saffron, C.orange];
  let svg = `<path id="${p}-main" d="M-20,${MY} L1940,${MY}" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/>`;
  for (let i = 0; i < 4; i++) svg += pth(`${p}-s${i}`, `M-20,${lanes[i]} L${i === 0 ? 860 : 820 + (4 - i) * 70},${lanes[i]}`, cols[i], 5);
  for (let i = 1; i < 4; i++) {
    const x = 820 + (4 - i) * 70, y = lanes[i];
    svg += pth(`${p}-t${i}`, `M${x},${y} C${x + 110},${y} ${x + 80},${MY} ${x + 200},${MY}`, cols[i], 5);
    svg += dot(`${p}-j${i}`, x + 200, MY, 12, cols[i]);
  }
  svg += pth(`${p}-t0`, `M860,${lanes[0]} L1270,${lanes[0]}`, C.umber, 5);
  svg += `<g id="${p}-knot"><circle cx="1240" cy="${lanes[0]}" r="22" fill="${C.cream}" stroke="${C.umber}" stroke-width="5"/><path d="M1229,${lanes[0] - 11} L1251,${lanes[0] + 11} M1251,${lanes[0] - 11} L1229,${lanes[0] + 11}" stroke="${C.umber}" stroke-width="5" stroke-linecap="round"/></g>`;
  out.push(scene(T[id], `
#${p}-h1 { top: 150px; font-size: 120px; }
#${p}-h2 { top: 272px; font-size: 120px; }
#${p}-card { position: absolute; left: 1290px; top: ${lanes[0] - 70}px; width: 440px; height: 140px; background: #ffffff; border: 3px solid ${C.ink}; border-radius: 18px; padding: 22px 28px; opacity: 0; }
#${p}-card .t { font-weight: 800; font-size: 44px; letter-spacing: -0.03em; color: ${C.ink}; }
#${p}-card .s { margin-top: 8px; }
#${p}-auto { position: absolute; left: 1150px; top: ${MY + 26}px; opacity: 0; color: ${C.ink}; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080">${svg}</svg>
        <div id="${p}-h1" class="hl"><span class="w sw">Review</span> <span class="w sw">only</span></div>
        <div id="${p}-h2" class="hl"><span class="w sw">what</span> <span class="w sw em">matters.</span></div>
        <div id="${p}-card"><div class="t">Held for you</div><div class="s label">overlaps what landed</div></div>
        <div id="${p}-auto" class="label">clean parts &rarr; braided in automatically</div>
        <div id="${p}-pf" class="proof"><span class="tick"></span>Auto-braid lands only clean, in-plan parts &middot; everything else waits</div>
`, `
var h = $$("#${p}-h1 .w, #${p}-h2 .w"); var ht = [${w(id, 3)}, ${w(id, 2)}, ${w(id, 4)}, ${w(id, 5)}];
rise(h[0], ${w(id, 3)}, 40, 0.4); rise(h[1], ${w(id, 2)}, 40, 0.4); rise(h[2], ${w(id, 4)}, 40, 0.4); rise(h[3], ${w(id, 5)}, 40, 0.45);
draw($("#${p}-main"), 0, 0.45, "power3.out");
for (var i = 0; i < 4; i++) draw($("#${p}-s" + i), 0.15 + i * 0.12, 0.9, "power2.out");
var mt = [0, ${w(id, 6)}, ${w(id, 8)}, ${w(id, 10)}];
for (var k = 1; k < 4; k++) { draw($("#${p}-t" + k), mt[k], 0.32, "power2.in"); pop($("#${p}-j" + k), mt[k] + 0.3, 0.35); }
tl.fromTo($("#${p}-auto"), { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, ease: "power3.out" }, ${w(id, 8) + 0.35});
draw($("#${p}-t0"), ${w(id, 13) - 0.2}, 0.4, "power2.in");
pop($("#${p}-knot"), ${w(id, 14)}, 0.35);
tl.fromTo($("#${p}-card"), { opacity: 0, scale: 0.85, transformOrigin: "0% 50%" }, { opacity: 1, scale: 1, duration: 0.4, ease: "back.out(2)" }, ${w(id, 14) + 0.1});
tl.fromTo($("#${p}-card"), { borderColor: "${C.ink}" }, { borderColor: "${C.orange}", duration: 0.2, yoyo: true, repeat: 1 }, ${w(id, 15)});
proof($("#${p}-pf"), ${w(id, 15)});
`));
  [6, 8, 10].forEach((k) => S_(id, w(id, k) + 0.3, "pop.wav", 0.12, 0.4));
  S_(id, w(id, 14) + 0.1, "stamp-thud.wav", 0.5, 0.45);
}

// ───────── 09 SWARM ─────────
{
  const id = "09", p = "s09";
  const lanes = [560, 620, 680, 740, 800, 860], JX = 860, JY = 710;
  let svg = "";
  for (let i = 0; i < 6; i++) svg += pth(`${p}-s${i}`, `M-20,${lanes[i]} L300,${lanes[i]} C620,${lanes[i]} 640,${JY} ${JX},${JY}`, STRANDS[i % 3], 5);
  svg += pth(`${p}-m`, `M${JX},${JY} L1010,${JY}`, C.ink, 10);
  svg += dot(`${p}-j`, JX, JY, 14, C.ink);
  out.push(scene(T[id], `
#${p}-h1 { top: 150px; font-size: 130px; }
#${p}-h2 { top: 290px; font-size: 130px; }
#${p}-ctr { position: absolute; left: 1060px; top: 470px; white-space: nowrap; opacity: 0; }
#${p}-ctr .v { font-weight: 800; font-size: 300px; letter-spacing: -0.06em; line-height: 1; font-variant-numeric: tabular-nums; color: ${C.ink}; }
#${p}-ctr .u { font-weight: 700; font-size: 120px; letter-spacing: -0.03em; color: ${C.orange}; margin-left: 10px; }
#${p}-sub { position: absolute; left: 1068px; top: 790px; font-weight: 600; font-size: 46px; letter-spacing: -0.015em; color: ${C.ink}; white-space: nowrap; opacity: 0; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080">${svg}</svg>
        <div id="${p}-h1" class="hl sw">6 agents.</div>
        <div id="${p}-h2" class="hl sw">1 <span class="em">goal.</span></div>
        <div id="${p}-ctr"><span id="${p}-v" class="v">0</span><span class="u">s</span></div>
        <div id="${p}-sub">All braided in. Zero clicks.</div>
        <div id="${p}-pf" class="proof"><span class="tick"></span>6-agent swarm, auto-braid &middot; measured live 2026-10-10 &middot; 9 catch-ups, all fast</div>
`, `
rise($("#${p}-h1"), ${w(id, 0)}, 40, 0.4); rise($("#${p}-h2"), ${w(id, 2)}, 40, 0.4);
for (var i = 0; i < 6; i++) draw($("#${p}-s" + i), 0.1 + i * 0.1, 1.1, "power2.inOut");
pop($("#${p}-j"), 1.25, 0.3); draw($("#${p}-m"), 1.3, 0.3, "power2.out");
show($("#${p}-ctr"), ${w(id, 4) - 0.1});
count($("#${p}-v"), 0, 113, ${w(id, 4) - 0.1}, ${(w(id, 9) - w(id, 4) + 0.1).toFixed(2)}, null, "power2.out");
tl.fromTo($("#${p}-ctr"), { scale: 1.12, transformOrigin: "0% 60%" }, { scale: 1, duration: 0.45, ease: "back.out(2.4)" }, ${w(id, 9)});
tl.fromTo($("#${p}-sub"), { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }, ${w(id, 9) + 0.1});
proof($("#${p}-pf"), ${w(id, 6)});
`));
  S_(id, w(id, 4) - 0.1, "riser-short.wav", 1.2, 0.3);
  S_(id, w(id, 9), "stamp-thud.wav", 0.5, 0.55);
}

// ───────── 10 QUEUE ─────────
{
  const id = "10", p = "s10";
  const N = 100, JX = 1010, JY = 760;
  let fan = "";
  for (let i = 0; i < N; i++) {
    const y = 470 + (i * (900 - 470)) / (N - 1);
    fan += pth(`${p}-f${i}`, fanPath(-20, y, JX, JY), STRANDS[i % 3], 2, `class="fan"`);
  }
  let dots = "";
  for (let i = 0; i < 16; i++) dots += dot(`${p}-d${i}`, JX + 40 + i * 54, JY, 10, C.ink, `class="hd"`);
  const hs = [["100 strands.", ""], ["Every one ", "lands."], ["One ", "straight", " history."]];
  out.push(scene(T[id], `
#${p}-ctr { position: absolute; left: 1250px; top: 600px; white-space: nowrap; opacity: 0; }
#${p}-ctr .v { font-weight: 800; font-size: 96px; letter-spacing: -0.04em; font-variant-numeric: tabular-nums; color: ${C.ink}; }
#${p}-ctr .l { margin-left: 18px; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080"><g id="${p}-fan">${fan}</g>${pth(`${p}-line`, `M${JX},${JY} L1940,${JY}`, C.ink, 9)}${dots}</svg>
        <div id="${p}-h0" class="hl sw" style="top:150px;font-size:150px">100 strands<span style="color:${C.orange}">.</span></div>
        <div id="${p}-h1" class="hl sw" style="top:150px;font-size:150px">Every one <span class="em">lands.</span></div>
        <div id="${p}-h2" class="hl sw" style="top:150px;font-size:150px">One <span class="em">straight</span> history.</div>
        <div id="${p}-ctr"><span id="${p}-v" class="v">0</span><span class="label l">/ 99 braided in</span></div>
        <div id="${p}-pf" class="proof"><span class="tick"></span>Braid queue &middot; 100 strands queued at once &middot; N catch-ups, not N&sup2;</div>
`, `
rise($("#${p}-h0"), ${w(id, 1) - 0.05}, 40, 0.4);
$$("#root .fan").forEach(function (el, i) { draw(el, 0.15 + (i % 20) * 0.045 + Math.floor(i / 20) * 0.07, 0.9, "power2.out"); });
hide($("#${p}-h0"), ${w(id, 6)}); show($("#${p}-h1"), ${w(id, 6)});
tl.fromTo($("#${p}-h1"), { y: 30 }, { y: 0, duration: 0.3, ease: "expo.out" }, ${w(id, 6)});
draw($("#${p}-line"), ${w(id, 6) - 0.2}, 0.5, "power2.out");
$$("#root .hd").forEach(function (el, i) { pop(el, ${w(id, 6)} + i * 0.07, 0.25); });
show($("#${p}-ctr"), ${w(id, 6)});
count($("#${p}-v"), 0, 99, ${w(id, 6)}, 1.3, null, "power1.out");
hide($("#${p}-h1"), ${w(id, 9)}); show($("#${p}-h2"), ${w(id, 9)});
tl.fromTo($("#${p}-h2"), { y: 30 }, { y: 0, duration: 0.3, ease: "expo.out" }, ${w(id, 9)});
tl.to($("#${p}-fan"), { opacity: 0.22, duration: 0.4, ease: "power2.out" }, ${w(id, 9)});
tl.to($("#${p}-line"), { attr: { "stroke-width": 16 }, duration: 0.35, ease: "back.out(2)" }, ${w(id, 10)});
proof($("#${p}-pf"), ${w(id, 4)});
`));
  S_(id, 0.1, "whoosh-big.wav", 1.1, 0.3);
  S_(id, w(id, 6), "riser-short.wav", 1.2, 0.22);
  S_(id, w(id, 10), "impact-boom.wav", 1.2, 0.45);
}

// ───────── 11 VISION ─────────
{
  const id = "11", p = "s11";
  const N = 36, JX = 900, JY = 820;
  let fan = "";
  for (let i = 0; i < N; i++) {
    const y = 600 + (i * (1060 - 600)) / (N - 1);
    fan += pth(`${p}-f${i}`, fanPath(-20, y, JX, JY), STRANDS[i % 3], 3, `class="fan"`);
  }
  out.push(scene(T[id], `
#${p}-a { left: 0; right: 0; text-align: center; top: 240px; font-size: 140px; }
#${p}-b { left: 0; right: 0; text-align: center; top: 420px; font-size: 140px; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080">${fan}${pth(`${p}-line`, `M${JX},${JY} L1940,${JY}`, C.ink, 12)}</svg>
        <div id="${p}-a" class="hl"><span class="w sw">Hundreds</span> <span class="w sw">of</span> <span class="w sw">agents.</span></div>
        <div id="${p}-b" class="hl"><span class="w sw">One</span> <span class="w sw em">clean</span> <span class="w sw">history.</span></div>
`, `
var a = $$("#${p}-a .w, #${p}-b .w"); var at = [${w(id, 0)}, ${w(id, 1)}, ${w(id, 2)}, ${w(id, 3)}, ${w(id, 4)}, ${w(id, 5)}];
a.forEach(function (el, i) { rise(el, at[i], 40, 0.45); });
$$("#root .fan").forEach(function (el, i) { draw(el, 0.05 + (i % 12) * 0.05 + Math.floor(i / 12) * 0.08, 1.0, "power2.out"); });
draw($("#${p}-line"), ${w(id, 3)}, 0.7, "power3.inOut");
`));
  S_(id, w(id, 4), "shimmer.wav", 1.4, 0.25);
}

// ───────── 12 LOCKUP ─────────
{
  const id = "12", p = "s12";
  const br = [0, 1, 2].map((k) => pth(`${p}-s${k}`, sine(-400, 2700, 540, 26, 300, (k * 2 * Math.PI) / 3), STRANDS[k], 6)).join("");
  out.push(scene(T[id], `
#${p}-word { left: 0; right: 0; text-align: center; top: 200px; font-size: 270px; letter-spacing: -0.06em; }
#${p}-tag { left: 0; right: 0; text-align: center; top: 600px; font-size: 52px; font-weight: 600; letter-spacing: -0.02em; }
#${p}-built { left: 0; right: 0; text-align: center; top: 724px; font-size: 46px; font-weight: 700; letter-spacing: -0.02em; }
#${p}-prod { position: absolute; left: 0; right: 0; text-align: center; top: 796px; font-family: "IBM Plex Mono", monospace; font-weight: 500; font-size: 25px; letter-spacing: 0.12em; color: ${C.muted}; }
#${p}-url { position: absolute; left: 0; right: 0; top: 868px; display: flex; justify-content: center; }
#${p}-url span { font-family: "IBM Plex Mono", monospace; font-weight: 600; font-size: 44px; letter-spacing: 0.01em; color: ${C.cream}; background: ${C.ink}; padding: 12px 34px; border-radius: 99px; }
`, `
        <svg class="svg" viewBox="0 0 1920 1080"><g id="${p}-br">${br}</g></svg>
        <div id="${p}-word" class="hl sw">Braid</div>
        <div id="${p}-tag" class="hl sw">Where parallel work comes <span class="em">together.</span></div>
        <div id="${p}-built" class="hl sw">Built natively on Cloudflare</div>
        <div id="${p}-prod" class="sw">WORKERS &middot; DURABLE OBJECTS &middot; ARTIFACTS &middot; CONTAINERS</div>
        <div id="${p}-url" class="sw"><span>gitflare.lintlabs.org</span></div>
`, `
[0, 1, 2].forEach(function (k) { draw($("#${p}-s" + k), 0 + k * 0.07, 0.8, "power3.out"); });
tl.fromTo($("#${p}-br"), { x: 0 }, { x: -600, duration: ${T[id].dur}, ease: "none" }, 0);
tl.fromTo($("#${p}-word"), { opacity: 0, scale: 0.84, transformOrigin: "50% 60%" }, { opacity: 1, scale: 1, duration: 0.55, ease: "back.out(1.7)" }, ${w(id, 2) - 0.05});
rise($("#${p}-tag"), ${w(id, 2) + 0.3}, 30, 0.45);
rise($("#${p}-built"), ${w(id, 3)}, 30, 0.45);
rise($("#${p}-prod"), ${w(id, 6)}, 20, 0.45);
tl.fromTo($("#${p}-url"), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5, ease: "back.out(2)" }, ${w(id, 6) + 0.45});
`));
  S_(id, w(id, 2) - 0.05, "impact-thud.wav", 0.6, 0.5);
  S_(id, w(id, 6) + 0.45, "success-chime.wav", 1.0, 0.3);
}

// ───────── INDEX ─────────
const total = +(timing.at(-1).start + timing.at(-1).dur).toFixed(3);
let hosts = "", vo = "", fx = "";
out.forEach((t, i) => {
  hosts += `      <div id="el-${t.cid}" class="scene" data-composition-id="${t.cid}" data-composition-src="${t.file}" data-start="${t.start}" data-duration="${t.dur}" data-track-index="1" data-track-kind="graphics" data-width="1920" data-height="1080"></div>\n`;
  vo += `      <audio id="el-vo-${t.id}" src="assets/vo3/vo-${t.id}.wav" data-start="${t.vo}" data-duration="${t.vodur}" data-track-index="10" data-volume="1"></audio>\n`;
});
sfx.sort((a, b) => a[0] - b[0]).forEach(([t, file, dur, vol], i) => {
  fx += `      <audio id="el-sfx3-${i}" src="assets/sfx/${file}" data-start="${t}" data-duration="${dur}" data-track-index="${20 + (i % 2)}" data-volume="${vol}"></audio>\n`;
});
const index = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1920, height=1080" />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 1920px; height: 1080px; overflow: hidden; background: ${C.cream}; }
      #root { position: relative; width: 100%; height: 100%; overflow: hidden; background: ${C.cream}; }
      .scene { position: absolute; inset: 0; width: 100%; height: 100%; }
    </style>
  </head>
  <body>
    <!-- braid-promo v3 (2026-10-10): light "Braid Cream" cut. v2 source archived in .archive-v2/ -->
    <div id="root" data-composition-id="main" data-start="0" data-duration="${total}" data-width="1920" data-height="1080">
${hosts}
      <!-- voiceover: Qwen TTS (qwen-tts, voice longanlingxin) -->
${vo}
      <!-- music bed -->
      <audio id="el-bgm" src="assets/bgm/bed-v3.wav" data-start="0" data-duration="${total}" data-track-index="11" data-volume="0.4"></audio>

      <!-- sfx -->
${fx}    </div>
    <script>
      var tl = gsap.timeline({ paused: true }); tl.to({}, { duration: ${total} }, 0); window.__timelines["main"] = tl;
    </script>
  </body>
</html>
`;
fs.writeFileSync(`${P}/index.html`, index);
fs.writeFileSync(path.join(S, "sfx.json"), JSON.stringify(sfx, null, 1));
console.log("scenes", out.length, "sfx", sfx.length, "total", total);
