// Gitflare streaming-route renderer.
//
// Structure follows the reference pipeline that the Cloudflare Challenge page
// uses for the same idea: a greyscale luminance mask of three routes easing
// into one line, box nodes, an arrival panel, travelling dots and a pulsing
// ring; then that luminance is quantised into vertical tick cells and mapped
// through an ink -> orange -> cream ramp, with a bloom pass behind it.
//
// Constants are our own; the design space is 560 x 480.

const VERTEX = `#version 300 es
void main() {
  vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
out vec4 fragColorOut;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;

const vec2 DESIGN = vec2(560.0, 480.0);
const float ROUTE_X0 = 0.14;
const float ROUTE_X1 = 0.82;
const float TRUNK_Y = 0.5;
const float CELL_PX = 11.0;

const vec3 INK = vec3(0.055, 0.05, 0.045);
const vec3 AMBER = vec3(1.0, 0.66, 0.26);
const vec3 ORANGE = vec3(1.0, 0.42, 0.11);
const vec3 SCARLET = vec3(0.86, 0.2, 0.06);
const vec3 CREAM = vec3(1.0, 0.96, 0.9);

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Crisp axis-aligned box in normalised space.
float boxMask(vec2 uv, vec2 centre, vec2 half1) {
  vec2 d = abs(uv - centre) - half1;
  return 1.0 - step(0.0, max(d.x, d.y));
}

// One route easing from startY to the shared trunk line. The line carries a
// bar field: hard vertical ticks of varied length rather than a solid stroke.
float route(vec2 uv, float startY, float cellX) {
  float progress = smoothstep(0.12, 0.82, uv.x);
  float y = mix(startY, TRUNK_Y, progress * progress * (3.0 - 2.0 * progress));
  float offset = abs(uv.y - y);
  // Tick length swings per cell so the stream has an irregular profile.
  float reach = 0.012 + 0.009 * hash(vec2(cellX, startY * 91.0));
  return 1.0 - smoothstep(reach * 0.5, reach, offset);
}

vec2 routePoint(float progress, float startY) {
  float x = mix(ROUTE_X0, ROUTE_X1, progress);
  float curve = progress * progress * (3.0 - 2.0 * progress);
  return vec2(x, mix(startY, TRUNK_Y, curve));
}

// A wider, softer copy of a route, used for the bloom pass.
float routeBloom(vec2 uv, float startY) {
  float progress = smoothstep(0.12, 0.82, uv.x);
  float y = mix(startY, TRUNK_Y, progress * progress * (3.0 - 2.0 * progress));
  return 1.0 - smoothstep(0.012, 0.06, abs(uv.y - y));
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  uv.y = 1.0 - uv.y;
  // Aspect-correct so the three routes keep the reference proportions.
  vec2 asp = vec2(uResolution.x / uResolution.y, 1.0);

  vec2 cell = floor(gl_FragCoord.xy / CELL_PX);
  // Hard tick gate: every cell either draws a bar or stays dark, which is what
  // breaks the luminance mask into a bar field.
  float tick =
    step(0.3, hash(vec2(cell.x, 7.0))) * step(0.16, hash(vec2(cell.x, 19.0)));

  float paths = max(
    route(uv, 0.24, cell.x),
    max(route(uv, 0.5, cell.x), route(uv, 0.76, cell.x))
  );
  paths *= tick;

  float nodes = boxMask(uv, vec2(0.1, 0.24), vec2(0.035, 0.045));
  nodes = max(nodes, boxMask(uv, vec2(0.1, 0.5), vec2(0.035, 0.045)));
  nodes = max(nodes, boxMask(uv, vec2(0.1, 0.76), vec2(0.035, 0.045)));

  float arrival = boxMask(uv, vec2(0.87, 0.5), vec2(0.055, 0.08));

  // Three dots running the routes, each offset in phase.
  float signals = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float progress = fract(uTime * 0.16 + fi * 0.28);
    signals = max(
      signals,
      1.0 - smoothstep(0.008, 0.026, distance(uv, routePoint(progress, 0.24 + fi * 0.26)))
    );
  }

  // Hashed cell texture over the node boxes, as in the reference mask.
  float textureValue = 0.68 + 0.32 * step(0.48, hash(cell));

  float value = max(paths * 0.58, nodes * textureValue);
  value = max(max(value, arrival), signals);

  float bar = value;

  // Expanding ring from the arrival panel.
  float ring = 1.0 - smoothstep(
    0.0,
    0.016,
    abs(distance(uv, vec2(0.87, 0.5)) - fract(uTime * 0.25) * 0.16)
  );
  bar = max(bar, ring * 0.7);

  // Bloom: a wider, softer copy of the same mask.
  float bloom = max(
    routeBloom(uv, 0.24),
    max(routeBloom(uv, 0.5), routeBloom(uv, 0.76))
  );

  // Luminance ramp: ink -> scarlet -> orange -> amber -> cream, matching the
  // engine's default stripe bands.
  float level = clamp(bar, 0.0, 1.0);
  vec3 colour = INK;
  colour = mix(colour, SCARLET, smoothstep(0.10, 0.34, level));
  colour = mix(colour, ORANGE, smoothstep(0.30, 0.58, level));
  colour = mix(colour, AMBER, smoothstep(0.55, 0.80, level));
  colour = mix(colour, CREAM, smoothstep(0.82, 1.0, level));
  colour += AMBER * bloom * 0.09;

  // Pointer proximity lifts the field slightly, without moving it.
  float pointer = smoothstep(0.34, 0.0, length((uv - uPointer) * asp));
  colour = mix(colour, CREAM, pointer * bloom * 0.5);

  // Panel interiors stay dark so the bars read as leaving a frame.
  colour = mix(colour, INK * 1.6, arrival * step(0.5, hash(cell)) * 0.4);
  colour = mix(colour, INK * 1.4, nodes * step(0.42, hash(cell)) * 0.3);

  // Vignette to seat the field in the page.
  float vignette = smoothstep(1.05, 0.25, length((uv - 0.5) * vec2(1.15, 1.0)));
  colour *= mix(0.74, 1.04, vignette);

  fragColorOut = vec4(colour, 1.0);
}`;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("route: shader did not compile - " + log);
  }
  return shader;
}

export function createRouteEngine(canvas) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("route: WebGL2 is unavailable");

  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("route: program did not link - " + log);
  }
  gl.useProgram(program);

  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uPointer = gl.getUniformLocation(program, "uPointer");

  let pointer = new Float32Array([-1, -1]);
  let elapsed = 0;
  let raf = 0;
  let running = false;
  let visible = true;
  let last = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
  }

  function draw(time) {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uResolution, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uPointer, pointer[0], pointer[1]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const delta = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    if (visible) elapsed += delta;
    draw(elapsed);
  }

  function start() {
    if (running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function onResize() {
    resize();
    if (!running) draw(elapsed);
  }

  function onPointer(event) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer = new Float32Array([
      (event.clientX - rect.left) / rect.width,
      (event.clientY - rect.top) / rect.height,
    ]);
  }

  function onVisibility() {
    if (document.hidden) stop();
    else if (visible && !reduced.matches) start();
  }

  function onMotionChange() {
    if (reduced.matches) {
      stop();
      draw(0.6);
    } else if (visible) start();
  }

  resize();
  draw(0.6);

  const observer = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting);
    if (visible && !document.hidden && !reduced.matches) start();
    else stop();
  });
  observer.observe(canvas);
  addEventListener("resize", onResize);
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("visibilitychange", onVisibility);
  reduced.addEventListener("change", onMotionChange);

  return {
    dispose() {
      observer.disconnect();
      removeEventListener("resize", onResize);
      removeEventListener("pointermove", onPointer);
      removeEventListener("visibilitychange", onVisibility);
      reduced.removeEventListener("change", onMotionChange);
      stop();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}

export default createRouteEngine;
