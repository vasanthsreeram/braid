// The Cloudflare "Build the next GitHub" stripe field.
//
// Everything in this file is copied from Cloudflare's own renderer as shipped
// on https://www.cloudflare.com/git-competition/ : the engine bundle itself
// (`stripes-engine.js`, vendored byte-for-byte out of `/_astro/index.B9v-dCIg.js`),
// the two greyscale mask shaders, the fullscreen-triangle vertex shader, the
// shader wrapper, the source-canvas factory, and the config override — all
// lifted from the island chunk `/_astro/_git-competition.BxZ7M6Pq.js`.
//
// The engine paints greyscale mask input as drifting stripe bands, so the two
// graphics are just two masks: an animated falling-block board and a
// three-into-one branch diagram.
//
// One deliberate change: the tetris mask is written against an 11-row board on
// Cloudflare's page. This app's Blocks game is 10 x 18, so the board geometry
// (cell size, board height, cell index, spawn height, idle skyline height) is
// interpolated from FIELD_COLS/FIELD_ROWS below. No other line of the mask
// differs, and the finalist mask is untouched.

import {
  createStripesEngine,
  DEFAULT_ENGINE_CONFIG,
  paintFramesOverlay,
} from "./stripes-engine.js";

export const FIELD_COLS = 10;
export const FIELD_ROWS = 18;

// Cloudflare's idle board settles 1-4 rows high on an 11-row field; keep that
// proportion on this app's taller board.
const SKYLINE = Math.round((FIELD_ROWS * 4) / 11);

const VERTEX_SHADER = `#version 300 es
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const wrapMask = (body) => `#version 300 es
precision highp float;
precision highp int;
uniform vec3 iResolution;
uniform float iTime;
uniform vec4 iMouse;
out vec4 fragColorOut;
${body}
void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  fragColorOut = color;
}`;

// Falling-block board mask. Rows are counted from the bottom of the canvas.
const TETRIS_MASK = `
uniform float uPlaying;
uniform float uCells[${FIELD_COLS * FIELD_ROWS}];

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float sameCell(vec2 a, vec2 b) {
  return 1.0 - step(0.1, distance(a, b));
}

float tetromino(vec2 cell, float kind) {
  float t = sameCell(cell, vec2(-1.0, 0.0)) + sameCell(cell, vec2(0.0, 0.0)) + sameCell(cell, vec2(1.0, 0.0)) + sameCell(cell, vec2(0.0, 1.0));
  float l = sameCell(cell, vec2(-1.0, 0.0)) + sameCell(cell, vec2(0.0, 0.0)) + sameCell(cell, vec2(1.0, 0.0)) + sameCell(cell, vec2(1.0, 1.0));
  float s = sameCell(cell, vec2(-1.0, 0.0)) + sameCell(cell, vec2(0.0, 0.0)) + sameCell(cell, vec2(0.0, 1.0)) + sameCell(cell, vec2(1.0, 1.0));
  float o = sameCell(cell, vec2(0.0, 0.0)) + sameCell(cell, vec2(1.0, 0.0)) + sameCell(cell, vec2(0.0, 1.0)) + sameCell(cell, vec2(1.0, 1.0));
  if (kind < 1.0) return min(t, 1.0);
  if (kind < 2.0) return min(l, 1.0);
  if (kind < 3.0) return min(s, 1.0);
  return min(o, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float cellSize = min(iResolution.x / ${FIELD_COLS + 2}.0, iResolution.y / ${FIELD_ROWS + 2.5});
  float boardWidth = cellSize * ${FIELD_COLS}.0;
  vec2 board = vec2((fragCoord.x - (iResolution.x - boardWidth) * 0.5) / cellSize, fragCoord.y / cellSize);
  vec2 cell = floor(board);
  vec2 within = fract(board);
  if (uPlaying > 0.5) {
    // The canvas is scaled 1.18x by CSS. Place row zero at the visible bottom edge.
    float artScale = 1.18;
    float bottomOffset = iResolution.y * (artScale - 1.0) / (2.0 * artScale);
    vec2 liveBoard = vec2(board.x, (fragCoord.y - bottomOffset) / cellSize);
    vec2 liveCell = floor(liveBoard);
    if (liveCell.x < 0.0 || liveCell.x >= ${FIELD_COLS}.0 || liveCell.y < 0.0 || liveCell.y >= ${FIELD_ROWS}.0) {
      fragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    int index = (${FIELD_ROWS - 1} - int(liveCell.y)) * ${FIELD_COLS} + int(liveCell.x);
    vec2 liveWithin = fract(liveBoard);
    float inset = step(0.08, liveWithin.x) * step(liveWithin.x, 0.92) * step(0.08, liveWithin.y) * step(liveWithin.y, 0.92);
    float value = step(0.5, uCells[index]) * inset;
    fragColor = vec4(vec3(value), 1.0);
    return;
  }
  float insideBoard = step(0.0, board.x) * step(board.x, ${FIELD_COLS}.0) * step(0.0, board.y) * step(board.y, ${FIELD_ROWS + 9}.0);
  float columns = ${FIELD_COLS}.0;

  float cycle = floor(iTime / 5.2);
  float progress = fract(iTime / 5.2);
  float fallX = 1.0 + floor(hash(vec2(cycle, 2.0)) * max(columns - 2.0, 1.0));
  float kind = floor(hash(vec2(cycle, 8.0)) * 4.0);
  float targetY = ${SKYLINE}.0;

  float height = 1.0 + floor(hash(vec2(cell.x, 4.0)) * ${SKYLINE}.0);
  float landingSpan = 1.0 - step(1.1, abs(cell.x - fallX));
  height = mix(height, targetY - 1.0, landingSpan);
  float settled = step(cell.y, height);

  float descent = smoothstep(0.0, 0.82, progress);
  float fallY = mix(${FIELD_ROWS + 3.5}, targetY, descent * descent);
  float falling = tetromino(cell - vec2(fallX, floor(fallY)), kind);
  float placeholder = tetromino(cell - vec2(fallX, targetY), kind);

  float inset = step(0.08, within.x) * step(within.x, 0.92) * step(0.08, within.y) * step(within.y, 0.92);
  float slotOuter = step(0.14, within.x) * step(within.x, 0.86) * step(0.14, within.y) * step(within.y, 0.86);
  float slotInner = step(0.3, within.x) * step(within.x, 0.7) * step(0.3, within.y) * step(within.y, 0.7);
  float slot = placeholder * (slotOuter - slotInner) * (1.0 - step(0.82, progress));
  float value = min((settled + falling) * inset + slot * 0.65, 1.0) * insideBoard;
  fragColor = vec4(vec3(value), 1.0);
}`;

// Three lines of work easing into one trunk, plus their node boxes.
const FINALIST_MASK = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float box(vec2 p, vec2 center, vec2 size) {
  vec2 distanceToEdge = abs(p - center) - size;
  return 1.0 - step(0.0, max(distanceToEdge.x, distanceToEdge.y));
}
float route(vec2 uv, float startY) {
  float progress = smoothstep(0.12, 0.82, uv.x);
  float y = mix(startY, 0.5, progress * progress * (3.0 - 2.0 * progress));
  return 1.0 - smoothstep(0.006, 0.018, abs(uv.y - y));
}
vec2 routePoint(float progress, float startY) {
  float x = mix(0.14, 0.82, progress);
  float curve = progress * progress * (3.0 - 2.0 * progress);
  return vec2(x, mix(startY, 0.5, curve));
}
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  float paths = max(route(uv, 0.24), max(route(uv, 0.5), route(uv, 0.76)));
  float nodes = box(uv, vec2(0.1, 0.24), vec2(0.035, 0.045));
  nodes = max(nodes, box(uv, vec2(0.1, 0.5), vec2(0.035, 0.045)));
  nodes = max(nodes, box(uv, vec2(0.1, 0.76), vec2(0.035, 0.045)));
  float destination = box(uv, vec2(0.87, 0.5), vec2(0.055, 0.08));
  float signals = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float progress = fract(iTime * 0.16 + fi * 0.28);
    signals = max(signals, 1.0 - smoothstep(0.008, 0.026, distance(uv, routePoint(progress, 0.24 + fi * 0.26))));
  }
  vec2 cell = floor(fragCoord / 12.0);
  float texture = 0.68 + 0.32 * step(0.48, hash(cell));
  float value = max(paths * 0.58, nodes * texture);
  value = max(max(value, destination), signals);
  float pulse = 1.0 - smoothstep(0.0, 0.018, abs(distance(uv, vec2(0.87, 0.5)) - fract(iTime * 0.25) * 0.16));
  fragColor = vec4(vec3(max(value, pulse * 0.7)), 1.0);
}`;

function override(config) {
  return {
    ...config,
    maxFps: 60,
    background: { ...config.background, transparent: true },
    transform: { ...config.transform, fit: "cover" },
    grid: { ...config.grid, overlapAmount: 1.2 },
    reveal: {
      ...config.reveal,
      enabled: true,
      type: "water",
      water: { ...config.reveal.water, intensity: 1.5 },
    },
    sparkle: {
      ...config.sparkle,
      stripe: {
        ...config.sparkle.stripe,
        enabled: true,
        coverage: 0.2,
        maxBrightness: 0.1,
        speed: 0.2,
        thickestCount: 4,
        hueDriftDeg: -34,
        saturationBoost: 0.75,
      },
      width: {
        ...config.sparkle.width,
        enabled: true,
        coverage: 0.5,
        swingPx: 2,
        swingPeriodMin: 0.5,
        swingPeriodMax: 1,
      },
    },
    edgeMask: { ...config.edgeMask, enabled: true, end: 0.16, power: 0.3 },
    clickWave: {
      ...config.clickWave,
      enabled: true,
      type: "detonation",
      detonation: {
        ...config.clickWave.detonation,
        maxConcurrent: 7,
        craterLifeMs: 5000,
      },
    },
    stripeDots: {
      ...config.stripeDots,
      enabled: true,
      density: 1,
      randomVisibility: 0.1,
      brightness: 0.2,
      hueDriftDeg: 10,
      saturationBoost: 0.5,
    },
    frames: {
      ...config.frames,
      enabled: true,
      fadeMs: 650,
      luminanceThreshold: 0.75,
      highlightedStripeCount: 16,
      maxFrames: 2,
      color: 16688896,
      fontSizePx: 8,
      connection: {
        ...config.frames.connection,
        enabled: true,
        maxDistanceRatio: 0.5,
      },
    },
    cursorTrail: {
      ...config.cursorTrail,
      enabled: true,
      particleAlpha: 0.08,
      particleLifeMs: 1000,
      spreadMinPx: 1,
      spreadMaxPx: 20,
      pushWobblePx: 12,
    },
    colors: {
      ...config.colors,
      imageColorLightness: 0,
      autoDetectBackground: false,
    },
    stripes: [
      { color: 16448250, startFrom: 0, width: 0.5, opacity: 0 },
      { color: 16775396, startFrom: 0.0628, width: 0.5, opacity: 1 },
      { color: 16642254, startFrom: 0.129, width: 1, opacity: 1 },
      { color: 16770470, startFrom: 0.1995, width: 1.5, opacity: 1 },
      { color: 16766337, startFrom: 0.2752, width: 1.5, opacity: 1 },
      { color: 16762705, startFrom: 0.3574, width: 2, opacity: 1 },
      { color: 16758836, startFrom: 0.4478, width: 2.5, opacity: 1 },
      { color: 16555008, startFrom: 0.5492, width: 3, opacity: 1 },
      { color: 16548864, startFrom: 0.6651, width: 3.5, opacity: 1 },
      { color: 16015393, startFrom: 0.8, width: 4, opacity: 1 },
    ],
  };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("git-competition: cannot create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`git-competition: shader did not compile - ${log}`);
  }
  return shader;
}

// Offscreen greyscale canvas the engine samples as its stripe input.
function createMaskSource(mask, width, height, label, withCells) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    preserveDrawingBuffer: true,
    stencil: false,
  });
  if (!gl) throw new Error(`${label}: WebGL2 is unavailable`);
  const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, wrapMask(mask));
  const program = gl.createProgram();
  if (!program) throw new Error(`${label}: cannot create program`);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(
      `${label}: program did not link - ${gl.getProgramInfoLog(program)}`,
    );
  }
  gl.useProgram(program);
  const resolution = gl.getUniformLocation(program, "iResolution");
  const time = gl.getUniformLocation(program, "iTime");
  const cells = withCells ? gl.getUniformLocation(program, "uCells[0]") : null;
  const playing = withCells ? gl.getUniformLocation(program, "uPlaying") : null;
  const cellData = withCells ? new Float32Array(FIELD_COLS * FIELD_ROWS) : null;
  let isPlaying = false;
  return {
    canvas,
    render(t) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform3f(resolution, canvas.width, canvas.height, 1);
      gl.uniform1f(time, t);
      if (playing) gl.uniform1f(playing, Number(isPlaying));
      if (cells && cellData) gl.uniform1fv(cells, cellData);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    ...(cellData && {
      // `cells` is row-major from the top; the mask indexes from the bottom.
      setCells(board) {
        isPlaying = board !== null;
        for (let y = 0; y < FIELD_ROWS; y++)
          for (let x = 0; x < FIELD_COLS; x++)
            cellData[y * FIELD_COLS + x] = board?.[y]?.[x] ?? 0;
      },
    }),
    resize(w, h) {
      canvas.width = Math.max(1, Math.round(w));
      canvas.height = Math.max(1, Math.round(h));
    },
    dispose() {
      gl.deleteProgram(program);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

// Drives one canvas pair exactly the way the Cloudflare island's effect does:
// a source canvas renders the mask each frame, the engine restyles it, and the
// 2D overlay canvas paints the engine's frame boxes on top.
//
// Returns a handle whose setCells() feeds the board (null = idle/attract mode)
// or null when the field cannot run, so callers keep their static fallback.
export function mountField({
  canvas,
  frames,
  active,
  mask,
  mode,
  label,
  onReady,
}) {
  const host = canvas.parentElement;
  if (!host) return null;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;

  const withCells = mode === "cells";
  let ready = false;
  let pendingCells = null;
  let source = null;

  const handle = {
    setCells(cells) {
      pendingCells = cells ?? null;
      if (source) source.setCells?.(pendingCells);
    },
    get mounted() {
      return ready;
    },
  };

  try {
    const engine = createStripesEngine(canvas);
    const rect = canvas.getBoundingClientRect();
    engine.setConfig(override(DEFAULT_ENGINE_CONFIG));
    const maskCanvas = createMaskSource(
      mask,
      rect.width,
      rect.height,
      label,
      withCells,
    );
    source = maskCanvas;
    source.setCells?.(pendingCells);
    source.render(0);
    engine.resize(rect.width, rect.height);
    engine.setSource(source.canvas);
    ready = true;

    let ticking = false;
    let frame = 0;
    let firstFrame = false;
    let visible = true;
    let elapsed = 0;
    let last = performance.now();
    const context = frames ? frames.getContext("2d") : null;

    const paintFrames = () => {
      if (!context || !frames) return;
      const data = engine.readFramesOverlay();
      if (!data) {
        context.clearRect(0, 0, frames.width, frames.height);
        return;
      }
      const width = Math.round(data.cssWidth * data.scale);
      const height = Math.round(data.cssHeight * data.scale);
      if (frames.width !== width || frames.height !== height) {
        frames.width = width;
        frames.height = height;
      }
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.clearRect(0, 0, width, height);
      paintFramesOverlay(context, data);
    };

    const tick = () => {
      const now = performance.now();
      elapsed += Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      source.render(elapsed);
      engine.updateSourceFrame(source.canvas);
      paintFrames();
      if (!firstFrame) {
        firstFrame = true;
        onReady?.();
      }
      frame = requestAnimationFrame(tick);
    };

    const sync = () => {
      const should = visible && active && !document.hidden;
      if (should === ticking) return;
      ticking = should;
      if (should) {
        last = performance.now();
        engine.start();
        frame = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
        engine.stop();
      }
    };

    const measure = () => {
      const box = canvas.getBoundingClientRect();
      if (box.width < 1 || box.height < 1) return;
      engine.resize(box.width, box.height);
      source.resize(box.width, box.height);
      source.render(elapsed);
      engine.setSource(source.canvas);
    };

    const point = (event) => {
      const box = canvas.getBoundingClientRect();
      return [event.clientX - box.left, event.clientY - box.top];
    };
    const onMove = (event) => engine.setCursor(...point(event));
    const onLeave = () => engine.setCursor(null);
    const onDown = (event) => engine.click(...point(event));

    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    measure();
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      sync();
    });
    intersection.observe(host);
    document.addEventListener("visibilitychange", sync);
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    host.addEventListener("pointerdown", onDown);
    sync();

    globalThis.addEventListener(
      "pagehide",
      () => {
        cancelAnimationFrame(frame);
        intersection.disconnect();
        observer.disconnect();
        document.removeEventListener("visibilitychange", sync);
        host.removeEventListener("pointermove", onMove);
        host.removeEventListener("pointerleave", onLeave);
        host.removeEventListener("pointerdown", onDown);
        engine.dispose();
        source.dispose();
      },
      { once: true },
    );
  } catch (error) {
    // No WebGL2, a lost context, or a shader failure: the caller keeps its
    // static fallback rather than showing an empty box.
    if (globalThis.console) console.warn(error.message);
    return null;
  }

  return handle;
}

export function mountTetris(canvas, options = {}) {
  return mountField({
    canvas,
    frames: null,
    active: true,
    mask: TETRIS_MASK,
    mode: "cells",
    label: "tetris-source",
    ...options,
  });
}

export function mountRoute(canvas, frames, options = {}) {
  return mountField({
    canvas,
    frames,
    active: true,
    mask: FINALIST_MASK,
    mode: "plain",
    label: "finalist-source",
    ...options,
  });
}
