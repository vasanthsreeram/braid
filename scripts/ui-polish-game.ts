import assert from "node:assert/strict";
import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { uiWorker } from "./ui-polish-worker.ts";
const local = process.env.UI_POLISH_ORIGIN ? null : await uiWorker(true);
const origin = process.env.UI_POLISH_ORIGIN ?? local!.url;
const hosted = !local;
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const checks: string[] = [],
  errors: string[] = [];
const network: { path: string; status: number }[] = [];
const prefix = hosted ? "live" : "local";
const consoleErrors: string[] = [];
try {
  for (const width of [1440, 390]) {
    const page = await browser.newPage({
      viewport: { width, height: 960 },
      reducedMotion: "reduce",
      ...(width === 390
        ? { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }
        : {}),
    });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !/responded with a status of (401|404)/.test(message.text())
      )
        consoleErrors.push(message.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400)
        network.push({ path: new URL(r.url()).pathname, status: r.status() });
    });
    const response = await page.goto(origin);
    assert.equal(response!.status(), 401);
    assert.match(
      response!.headers()["content-security-policy"],
      /script-src 'self'/,
    );
    assert.doesNotMatch(
      response!.headers()["content-security-policy"],
      /unsafe-inline|unsafe-eval/,
    );
    await page
      .getByRole("heading", {
        name: "Great code. Shared context. Your next move.",
      })
      .waitFor();
    await page.waitForFunction(
      () =>
        document.querySelector<HTMLCanvasElement>("#block-canvas")!.width > 0 &&
        document
          .querySelector<HTMLCanvasElement>("#block-canvas")!
          .getContext("2d")!
          .getImageData(0, 0, 300, 300)
          .data.some((v) => v !== 0),
    );
    const image = () =>
      page
        .locator("#block-canvas")
        .evaluate((c: HTMLCanvasElement) => c.toDataURL());
    const staticImage = await image();
    await page.waitForTimeout(900);
    assert.equal(
      await image(),
      staticImage,
      "Reduced motion must leave decoration static",
    );
    assert.equal(
      await page.locator("#block-canvas").getAttribute("aria-hidden"),
      "true",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.equal(
      await page.locator('a[href^="/auth/login"]').first().getAttribute("href"),
      "/auth/login",
    );
    await page.screenshot({
      path: `docs/ui-polish/screenshots/${prefix}-welcome-${width}.png`,
      fullPage: true,
    });
    await page.screenshot({
      path: `docs/ui-polish/screenshots/${prefix}-welcome-${width}-viewport.png`,
      fullPage: false,
    });
    checks.push(
      `${width}: 401 gate, strict CSP, rendered original sculpture, reduced-motion static, sign-in link, no page overflow`,
    );
    await page.getByRole("button", { name: "Play Blocks" }).click();
    const board = page.getByRole("region", { name: /^Blocks board/ });
    await board.waitFor();
    const started = await image();
    await board.press("ArrowLeft");
    assert.notEqual(await image(), started);
    const moved = await image();
    await board.press("ArrowUp");
    // A square has rotational symmetry; movement and drop remain observable for every random piece.
    await board.press("ArrowRight");
    assert.notEqual(await image(), moved);
    await board.press("ArrowDown");
    await board.press("Space");
    assert.ok(Number(await page.locator("#block-score").innerText()) > 0);
    assert.equal(
      (await page.locator("#block-next-label").innerText()) === "",
      false,
    );
    await board.press("Escape");
    await page.getByRole("button", { name: "Resume", exact: true }).waitFor();
    const pausedImage = await image();
    await page.waitForTimeout(800);
    assert.equal(await image(), pausedImage);
    await board.press("ArrowLeft");
    assert.equal(await image(), pausedImage);
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.getByRole("button", { name: "Pause", exact: true }).waitFor();
    await page.getByRole("button", { name: "Restart", exact: true }).click();
    assert.equal(await page.locator("#block-score").innerText(), "0");
    assert.equal(await page.locator("#block-lines").innerText(), "0");
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    const leftButton = page.getByRole("button", {
      name: "Move left",
      exact: true,
    });
    const priorTouch = await image();
    if (width === 390) await leftButton.tap();
    else await leftButton.click();
    assert.notEqual(await image(), priorTouch);
    const drop = page.getByRole("button", { name: "Hard drop", exact: true });
    if (width === 390) await drop.tap();
    else await drop.click();
    assert.ok(Number(await page.locator("#block-score").innerText()) > 0);
    const small = await page
      .locator("button:visible")
      .evaluateAll((nodes) =>
        nodes
          .filter(
            (n) =>
              n.getBoundingClientRect().height < 44 ||
              n.getBoundingClientRect().width < 44,
          )
          .map((n) => n.textContent),
      );
    assert.deepEqual(small, []);
    // Buttons retain native Space behavior: no document-level game capture.
    await page.locator(".header-signin").focus();
    const score = await page.locator("#block-score").innerText();
    await page.keyboard.press("Space");
    assert.equal(await page.locator("#block-score").innerText(), score);
    await page.locator("#blocks").scrollIntoViewIfNeeded();
    await board.focus();
    await page.screenshot({
      path: `docs/ui-polish/screenshots/${prefix}-blocks-playing-${width}.png`,
      fullPage: true,
    });
    checks.push(
      `${width}: Play, focused keyboard move/rotate/soft drop/hard drop, next, Escape pause, timer freeze, resume, restart, ${width === 390 ? "real touch tap" : "pointer controls"}, 44px controls, unfocused Space stays native`,
    );
    // Offscreen and hidden-page suspension, using a visibility event in a test-only DOM harness.
    await page.setViewportSize({ width, height: 300 });
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await page.getByRole("button", { name: "Resume", exact: true }).waitFor();
    await page.setViewportSize({ width, height: 960 });
    await board.scrollIntoViewIfNeeded();
    await page.getByRole("button", { name: "Resume", exact: true }).click();
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", {
        configurable: true,
        value: true,
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.getByRole("button", { name: "Resume", exact: true }).waitFor();
    const hiddenImage = await image();
    await page.waitForTimeout(800);
    assert.equal(await image(), hiddenImage);
    await page.evaluate(() => {
      delete (document as any).hidden;
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await page.setViewportSize({
      width: width === 1440 ? 390 : 1440,
      height: 960,
    });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.ok(
      await page
        .locator("#block-canvas")
        .evaluate(
          (c: HTMLCanvasElement) =>
            c.width <= Math.ceil(c.getBoundingClientRect().width * 2),
        ),
    );
    checks.push(
      `${width}: offscreen auto-pause, hidden-page event stops timer, responsive resize/DPR capped at 2`,
    );
    await page.close();
  }
  const motionPage = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "no-preference",
  });
  motionPage.on("pageerror", (e) => errors.push(e.message));
  await motionPage.goto(origin);
  const motionBoard = motionPage.locator("#block-canvas");
  await motionPage.waitForTimeout(2200);
  const decoration = await motionBoard.evaluate((c: HTMLCanvasElement) =>
    c.toDataURL(),
  );
  await motionPage.waitForTimeout(600);
  assert.notEqual(
    await motionBoard.evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    decoration,
  );
  await motionPage.setViewportSize({ width: 1440, height: 300 });
  await motionPage.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await motionPage.waitForTimeout(250);
  const offscreen = await motionBoard.evaluate((c: HTMLCanvasElement) =>
    c.toDataURL(),
  );
  await motionPage.waitForTimeout(600);
  assert.equal(
    await motionBoard.evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    offscreen,
  );
  await motionPage.setViewportSize({ width: 1440, height: 960 });
  await motionBoard.scrollIntoViewIfNeeded();
  await motionPage.emulateMedia({ reducedMotion: "reduce" });
  await motionPage.waitForTimeout(250);
  const reduced = await motionBoard.evaluate((c: HTMLCanvasElement) =>
    c.toDataURL(),
  );
  await motionPage.waitForTimeout(600);
  assert.equal(
    await motionBoard.evaluate((c: HTMLCanvasElement) => c.toDataURL()),
    reduced,
  );
  await motionPage.close();
  checks.push(
    "Decorative falling blocks animate with motion enabled, stop offscreen, and stop after a live reduced-motion preference change",
  );
  // Only the local harness substitutes a seeded board. Nothing is exposed in production.
  if (!hosted) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 960 },
      reducedMotion: "reduce",
    });
    await page.route("**/public/blocks-engine.js", async (route) => {
      const response = await route.fetch();
      const source = (await response.text())
        .replace(
          "constructor(random = Math.random)",
          "constructor(random = () => 0)",
        )
        .replace(
          "this.board = emptyBoard();",
          "this.board = emptyBoard(); this.board[ROWS-1] = Array.from({length:COLS}, (_,x) => x>=3 && x<=6 ? 0 : 2);",
        );
      await route.fulfill({ response, body: source });
    });
    await page.goto(origin);
    await page.getByRole("button", { name: "Play Blocks" }).click();
    await page.getByRole("region", { name: /^Blocks board/ }).press("ArrowUp");
    await page.getByRole("region", { name: /^Blocks board/ }).press("ArrowUp");
    await page.getByRole("region", { name: /^Blocks board/ }).press("ArrowUp");
    await page.getByRole("region", { name: /^Blocks board/ }).press("ArrowUp");
    await page.getByRole("region", { name: /^Blocks board/ }).press("Space");
    assert.equal(await page.locator("#block-lines").innerText(), "1");
    assert.ok(Number(await page.locator("#block-score").innerText()) >= 100);
    assert.match(await page.locator("#block-live").innerText(), /row cleared/);
    checks.push(
      "local harness: four actual rotations and hard drop complete a deterministic row, score and aria-live update",
    );
    await page.close();
  }
  assert.deepEqual(errors, []);
  assert.deepEqual(consoleErrors, []);
  const unexpected = network.filter(
    (r) =>
      !(
        ["/", "/favicon.ico"].includes(r.path) && [401, 404].includes(r.status)
      ),
  );
  assert.deepEqual(unexpected, []);
  await writeFile(
    `docs/ui-polish/receipts/${prefix}-game.json`,
    JSON.stringify(
      {
        origin,
        hosted,
        checks,
        passed: true,
        pageErrors: errors,
        consoleErrors,
        network,
        note: hosted
          ? "Anonymous custom-host only; no OAuth login or private user session"
          : "Isolated local workerd; no remote bindings. Seeded row and hidden event are test-harness-only.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`${checks.length} ${prefix} game/browser groups passed`);
} finally {
  await browser.close();
  await local?.close();
}
