// Original falling-block rules, independent of DOM and rendering.
export const COLS = 10;
export const ROWS = 18;
export const SHAPES = [
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  [
    [1, 1],
    [1, 1],
  ],
  [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
];
export const NAMES = [
  "bar",
  "square",
  "tee",
  "right corner",
  "left corner",
  "right zigzag",
  "left zigzag",
];
const emptyBoard = () =>
  Array.from({ length: ROWS }, () => Array(COLS).fill(0));
export class BlocksGame {
  constructor(random = Math.random) {
    this.random = random;
    this.restart();
  }
  drawType() {
    if (!this.bag.length) {
      this.bag = SHAPES.map((_, i) => i);
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }
  restart() {
    this.board = emptyBoard();
    this.bag = [];
    this.score = 0;
    this.lines = 0;
    this.over = false;
    this.next = this.drawType();
    this.spawn();
  }
  spawn() {
    const type = this.next;
    this.next = this.drawType();
    this.piece = { type, cells: SHAPES[type].map((r) => [...r]), x: 3, y: 0 };
    if (!this.fits(this.piece)) this.over = true;
  }
  fits({ cells, x, y }) {
    return cells.every((r, dy) =>
      r.every(
        (v, dx) =>
          !v ||
          (x + dx >= 0 &&
            x + dx < COLS &&
            y + dy >= 0 &&
            y + dy < ROWS &&
            !this.board[y + dy][x + dx]),
      ),
    );
  }
  move(dx) {
    if (this.over) return false;
    const p = { ...this.piece, x: this.piece.x + dx };
    if (!this.fits(p)) return false;
    this.piece = p;
    return true;
  }
  rotate() {
    if (this.over) return false;
    const cells = this.piece.cells[0].map((_, x) =>
      this.piece.cells.map((r) => r[x]).reverse(),
    );
    for (const dx of [0, -1, 1, -2, 2]) {
      const p = { ...this.piece, cells, x: this.piece.x + dx };
      if (this.fits(p)) {
        this.piece = p;
        return true;
      }
    }
    return false;
  }
  ghost() {
    let p = { ...this.piece };
    while (this.fits({ ...p, y: p.y + 1 })) p.y++;
    return p;
  }
  step(soft = false) {
    if (this.over) return false;
    const p = { ...this.piece, y: this.piece.y + 1 };
    if (this.fits(p)) {
      this.piece = p;
      if (soft) this.score++;
    } else this.lock();
    return true;
  }
  drop() {
    if (this.over) return;
    const p = this.ghost();
    this.score += (p.y - this.piece.y) * 2;
    this.piece = p;
    this.lock();
  }
  lock() {
    const { cells, x, y, type } = this.piece;
    cells.forEach((r, dy) =>
      r.forEach((v, dx) => {
        if (v) this.board[y + dy][x + dx] = type + 1;
      }),
    );
    const remaining = this.board.filter((r) => !r.every(Boolean));
    const cleared = ROWS - remaining.length;
    this.lines += cleared;
    this.score +=
      [0, 100, 300, 500, 800][cleared] * (1 + Math.floor(this.lines / 10));
    this.board = [
      ...Array.from({ length: cleared }, () => Array(COLS).fill(0)),
      ...remaining,
    ];
    this.spawn();
  }
}
