import { BlocksGame, COLS, ROWS, SHAPES, NAMES } from "./blocks-engine.js";

const root = document.getElementById("blocks");
if (root) {
  const el = (id) => document.getElementById(id);
  const canvas = el("block-canvas"),
    ctx = canvas.getContext("2d");
  const nextCanvas = el("block-next"),
    nextCtx = nextCanvas.getContext("2d");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const colors = [
    "#ff681e",
    "#edae28",
    "#ba4f24",
    "#ee8744",
    "#d96126",
    "#c89445",
    "#ff9b52",
  ];
  let game,
    started = false,
    paused = false,
    visible = true,
    timer,
    decorationY = -3,
    decorationCycle = 0;
  let width = 480,
    height = 514;
  // Hand-composed, original skyline. No game or third-party artwork is embedded.
  const skyline = [0, 0, 3, 5, 4, 7, 6, 9, 11, 10, 8, 6, 4, 3];
  const sculpture = skyline.flatMap((h, x) =>
    Array.from({ length: h }, (_, n) => ({
      x,
      y: 17 - n,
      color: (Math.floor(x / 2) + Math.floor(n / 2)) % colors.length,
    })),
  );
  function tile(context, x, y, size, color, ghost = false) {
    const pad = Math.max(1.4, size * 0.065),
      s = size - 2 * pad;
    if (ghost) {
      context.strokeStyle = "#ce9a71";
      context.lineWidth = 1;
      context.strokeRect(x + pad, y + pad, s, s);
      return;
    }
    context.fillStyle = colors[color];
    context.fillRect(x + pad, y + pad, s, s);
    context.strokeStyle = "#fff8e966";
    context.lineWidth = 1;
    for (let n = 5; n < s - 3; n += 6) {
      context.beginPath();
      context.moveTo(x + pad + n, y + pad + 4);
      context.lineTo(x + pad + n, y + pad + s - 4);
      context.stroke();
    }
  }
  function grid(cols, size, ox, oy) {
    ctx.strokeStyle = "#e8e1d580";
    ctx.lineWidth = 1;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * size, oy);
      ctx.lineTo(ox + x * size, oy + ROWS * size);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(ox, oy + y * size);
      ctx.lineTo(ox + cols * size, oy + y * size);
      ctx.stroke();
    }
    ctx.strokeStyle = "#c09c7c";
    for (const [x, y, dx, dy] of [
      [ox, oy, 1, 1],
      [ox + cols * size, oy, -1, 1],
      [ox, oy + ROWS * size, 1, -1],
      [ox + cols * size, oy + ROWS * size, -1, -1],
    ]) {
      ctx.beginPath();
      ctx.moveTo(x + dx * 7, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * 7);
      ctx.stroke();
    }
  }
  function draw() {
    ctx.clearRect(0, 0, width, height);
    const cols = started ? COLS : 14;
    const size = Math.min((width - 12) / cols, (height - 20) / ROWS);
    const ox = (width - cols * size) / 2,
      oy = height - ROWS * size - 10;
    grid(cols, size, ox, oy);
    if (!started) {
      sculpture.forEach((c) =>
        tile(ctx, ox + c.x * size, oy + c.y * size, size, c.color),
      );
      const x = 3 + (decorationCycle % 3);
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [1, 2],
      ].forEach(([dx, dy]) => {
        if (decorationY + dy >= 0 && decorationY + dy < 11)
          tile(
            ctx,
            ox + (x + dx) * size,
            oy + (decorationY + dy) * size,
            size,
            decorationCycle % colors.length,
          );
      });
      return;
    }
    game.board.forEach((r, y) =>
      r.forEach((v, x) => {
        if (v) tile(ctx, ox + x * size, oy + y * size, size, v - 1);
      }),
    );
    const piece = (p, ghost) =>
      p.cells.forEach((r, y) =>
        r.forEach((v, x) => {
          if (v)
            tile(
              ctx,
              ox + (p.x + x) * size,
              oy + (p.y + y) * size,
              size,
              p.type,
              ghost,
            );
        }),
      );
    if (!game.over) {
      piece(game.ghost(), true);
      piece(game.piece, false);
    }
    nextCtx.clearRect(0, 0, 72, 48);
    SHAPES[game.next].forEach((r, y) =>
      r.forEach((v, x) => {
        if (v) tile(nextCtx, 6 + x * 12, 2 + y * 12, 12, game.next);
      }),
    );
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  function stopTimer() {
    clearTimeout(timer);
    timer = undefined;
  }
  function schedule() {
    stopTimer();
    if (
      !visible ||
      document.hidden ||
      (started ? paused || game.over : motion.matches)
    )
      return;
    // Event-driven rendering; idle game gravity ≤ 2 Hz, decoration ≤ 6 Hz. No RAF loop.
    timer = setTimeout(
      () => {
        timer = undefined;
        if (started) act("gravity");
        else {
          decorationY += 0.2;
          if (decorationY > 9) {
            decorationY = -3;
            decorationCycle++;
          }
          draw();
        }
        schedule();
      },
      started ? Math.max(160, 650 - Math.floor(game.lines / 10) * 55) : 180,
    );
  }
  function announce(text) {
    el("block-live").textContent = text;
  }
  function update() {
    el("block-score").textContent = String(game.score);
    el("block-lines").textContent = String(game.lines);
    el("block-next-label").textContent = NAMES[game.next];
    el("block-state").textContent = game.over
      ? "GAME OVER / TRY AGAIN"
      : paused
        ? "PAUSED / YOUR MOVE"
        : "IN PLAY / YOUR MOVE";
    el("block-overlay").hidden = !(paused || game.over);
    el("block-overlay").replaceChildren(
      document.createTextNode(game.over ? "Good game." : "Paused"),
    );
    const message = document.createElement("span");
    message.textContent = game.over
      ? "Restart for another round."
      : "Take your time.";
    el("block-overlay").append(message);
    el("block-pause").textContent = paused ? "Resume" : "Pause";
    el("block-pause").disabled = game.over;
    el("block-play").textContent = "Restart Blocks ↗";
    draw();
  }
  function start() {
    game = new BlocksGame();
    started = true;
    paused = false;
    el("block-controls").hidden = false;
    el("block-instructions").textContent =
      "Fill a row to clear it. Keep the stack low.";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "region");
    canvas.setAttribute(
      "aria-label",
      "Blocks board. Arrow keys move and rotate; Space drops; Escape pauses.",
    );
    canvas.removeAttribute("aria-hidden");
    canvas.focus({ preventScroll: true });
    announce("Game started. Focus the board to use arrow keys.");
    update();
    schedule();
  }
  function pause() {
    if (!started || game.over) return;
    paused = !paused;
    announce(paused ? "Game paused." : "Game resumed.");
    update();
    schedule();
  }
  function act(action) {
    if (!started || paused || game.over) return;
    const lines = game.lines,
      score = game.score,
      previousPiece = game.piece;
    if (action === "left") game.move(-1);
    if (action === "right") game.move(1);
    if (action === "rotate") game.rotate();
    if (action === "down" || action === "gravity") game.step(action === "down");
    if (action === "drop") game.drop();
    update();
    if (game.over) {
      announce(`Game over. Score ${game.score}. ${game.lines} lines cleared.`);
      stopTimer();
    } else if (
      game.lines !== lines ||
      (game.score !== score && action === "drop") ||
      (previousPiece !== game.piece &&
        ["down", "gravity"].includes(action) &&
        game.piece.y === 0)
    ) {
      announce(
        `${game.lines !== lines ? `${game.lines - lines} row cleared. ` : ""}Score ${game.score}. Lines ${game.lines}.`,
      );
    }
  }
  el("block-play").addEventListener("click", start);
  el("block-restart").addEventListener("click", start);
  el("block-pause").addEventListener("click", () => {
    pause();
    if (!paused) canvas.focus({ preventScroll: true });
  });
  root
    .querySelectorAll("[data-block-action]")
    .forEach((button) =>
      button.addEventListener("click", () => act(button.dataset.blockAction)),
    );
  // Capture only a focused board; page scrolling, navigation and ordinary forms stay native.
  canvas.addEventListener("keydown", (e) => {
    const actions = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "rotate",
      ArrowDown: "down",
      " ": "drop",
    };
    if (!started || e.ctrlKey || e.metaKey || e.altKey || e.isComposing) return;
    if (e.key === "Escape") {
      e.preventDefault();
      if (!e.repeat) pause();
    } else if (actions[e.key]) {
      e.preventDefault();
      act(actions[e.key]);
    }
  });
  const suspend = () => {
    stopTimer();
    if (started && !paused && !game.over) {
      paused = true;
      update();
      announce("Game paused while away. Choose Resume to continue.");
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) suspend();
    else schedule();
  });
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (!visible) suspend();
      else schedule();
    },
    { threshold: 0.05 },
  ).observe(canvas);
  motion.addEventListener("change", () => {
    if (!started && motion.matches) {
      decorationY = -3;
      draw();
    }
    schedule();
  });
  new ResizeObserver(resize).observe(canvas);
  window.addEventListener("pagehide", suspend);
  resize();
  schedule();
}
