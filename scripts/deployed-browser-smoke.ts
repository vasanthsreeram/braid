import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const origin = "https://cf-native-forge-evaluation.s-vasanthrojin.workers.dev";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
try {
  const page = await browser.newPage({
    viewport: { width: 1000, height: 600 },
  });
  const checks = [];
  for (const [path, status, text] of [
    ["/", 401, "Authentication required"],
    ["/auth/login", 503, "WorkOS environment unavailable"],
  ] as const) {
    const response = await page.goto(origin + path);
    const body = await page.locator("body").innerText();
    checks.push({
      path,
      status: response?.status(),
      expected: status,
      body,
      passed: response?.status() === status && body.includes(text),
    });
  }
  await page.screenshot({ path: "docs/core/ui-deployed-gate.png" });
  const passed = checks.every((c) => c.passed);
  await writeFile(
    "docs/core/raw/deployed-browser.json",
    JSON.stringify(
      {
        origin,
        at: new Date().toISOString(),
        boundary:
          "installed Chrome on live unauthenticated gate only; real WorkOS unavailable",
        checks,
        passed,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${checks.filter((c) => c.passed).length}/${checks.length} live browser gate checks passed`,
  );
  if (!passed) process.exitCode = 1;
} finally {
  await browser.close();
}
