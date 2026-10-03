// Boots the streaming-route renderer, its coordinate labels, and a Canvas 2D
// fallback for devices without WebGL2.
import { createRouteEngine } from "./route-engine.js";

const DESIGN = { width: 560, height: 480 };
const LABELS = [
  { x: 91, y: 147, text: "175, 175" },
  { x: 557, y: 147, text: "504, 175" },
];

// Static stand-in with the same composition, drawn once.
function drawFallback(canvas) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(80, Math.round(rect.width || DESIGN.width));
  const height = Math.max(60, Math.round(rect.height || DESIGN.height));
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);

  context.fillStyle = "#1a1714";
  context.fillRect(0, 0, width, height);

  // Three routes easing into the trunk line, plus their node frames.
  const routes = [0.24, 0.5, 0.76];
  context.lineWidth = 1.2;
  for (const start of routes) {
    context.strokeStyle = "rgba(255, 122, 40, 0.55)";
    context.beginPath();
    for (let x = 0; x <= 1.0001; x += 0.02) {
      const progress = Math.min(1, Math.max(0, (x - 0.12) / 0.7));
      const eased = progress * progress * (3 - 2 * progress);
      const y = start + (0.5 - start) * eased;
      const px = x * width;
      const py = y * height;
      if (x === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();
  }

  const frame = (cx, cy, w, h, fill, stroke) => {
    context.fillStyle = fill;
    context.fillRect((cx - w) * width, (cy - h) * height, w * 2 * width, h * 2 * height);
    context.strokeStyle = stroke;
    context.lineWidth = 1.2;
    context.strokeRect((cx - w) * width, (cy - h) * height, w * 2 * width, h * 2 * height);
  };
  for (const start of routes) {
    frame(0.1, start, 0.035, 0.045, "rgba(255, 104, 30, 0.12)", "#ff681e");
  }
  frame(0.87, 0.5, 0.055, 0.08, "rgba(255, 104, 30, 0.16)", "#ff681e");
}

function mount(canvas) {
  const host = canvas.parentElement;
  if (!host) return;

  for (const label of LABELS) {
    const node = document.createElement("span");
    node.className = "route-label";
    node.setAttribute("aria-hidden", "true");
    node.textContent = label.text;
    node.style.left = ((label.x / DESIGN.width) * 100).toFixed(2) + "%";
    node.style.top = ((label.y / DESIGN.height) * 100).toFixed(2) + "%";
    host.append(node);
  }

  try {
    createRouteEngine(canvas);
  } catch (error) {
    // No WebGL2: keep the composition with a static Canvas 2D drawing.
    host.dataset.routeFallback = "true";
    drawFallback(canvas);
    addEventListener("resize", () => drawFallback(canvas), { passive: true });
    if (globalThis.console) console.warn(error.message);
  }
}

for (const canvas of document.querySelectorAll("canvas[data-route]")) {
  mount(canvas);
}
