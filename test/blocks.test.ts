import test from "node:test";
import assert from "node:assert/strict";
const { BlocksGame, ROWS, COLS } = await import(
  new URL("../web/public/blocks-engine.js", import.meta.url).href
);

test("blocks: movement, wall collisions, rotation and landing preview", () => {
  const game = new BlocksGame(() => 0);
  const original = JSON.stringify(game.piece.cells);
  assert.equal(game.rotate(), true);
  assert.notEqual(JSON.stringify(game.piece.cells), original);
  for (let i = 0; i < 20; i++) game.move(-1);
  assert.equal(game.move(-1), false);
  assert.equal(game.fits(game.piece), true);
  assert.ok(game.ghost().y > game.piece.y);
  assert.equal(game.fits({ ...game.ghost(), y: game.ghost().y + 1 }), false);
});
test("blocks: hard drop clears a full row and preserves incomplete rows", () => {
  const game = new BlocksGame(() => 0);
  game.board[ROWS - 1] = Array.from({ length: COLS }, (_, i) =>
    i >= 3 && i <= 6 ? 0 : 2,
  );
  game.board[ROWS - 2][0] = 3;
  game.drop();
  assert.equal(game.lines, 1);
  assert.equal(game.score, 132);
  assert.equal(game.board[ROWS - 1][0], 3);
  assert.equal(game.board.length, ROWS);
  assert.ok(game.board[0].every((v: number) => v === 0));
});
test("blocks: consecutive clears, soft drop points and restart", () => {
  const game = new BlocksGame(() => 0);
  game.piece = {
    cells: [
      [1, 1],
      [1, 1],
    ],
    type: 1,
    x: 4,
    y: 0,
  };
  for (const y of [ROWS - 1, ROWS - 2])
    game.board[y] = Array.from({ length: COLS }, (_, x) =>
      x === 4 || x === 5 ? 0 : 1,
    );
  game.step(true);
  assert.equal(game.score, 1);
  game.drop();
  assert.equal(game.lines, 2);
  assert.ok(game.score >= 300);
  game.restart();
  assert.equal(game.lines, 0);
  assert.equal(game.score, 0);
  assert.equal(game.over, false);
  assert.ok(game.board.flat().every((v: number) => !v));
});
test("blocks: spawn obstruction ends game and prevents further mutations", () => {
  const game = new BlocksGame(() => 0);
  game.board[0].fill(1);
  game.board[1].fill(1);
  game.spawn();
  assert.equal(game.over, true);
  const snapshot = JSON.stringify(game.board);
  assert.equal(game.move(1), false);
  assert.equal(game.rotate(), false);
  assert.equal(game.step(), false);
  game.drop();
  assert.equal(JSON.stringify(game.board), snapshot);
});
test("blocks: a bag contains each of the seven shapes exactly once", () => {
  const game = new BlocksGame(() => 0.42);
  const seen = [
    game.piece.type,
    game.next,
    ...Array.from({ length: 5 }, () => game.drawType()),
  ];
  assert.equal(new Set(seen).size, 7);
});
