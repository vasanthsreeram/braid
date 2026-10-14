import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const origin = "https://braid.lintlabs.org";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const checks: any[] = [],
  errors: string[] = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    const response = await page.goto(origin);
    await page
      .getByRole("link", { name: "Sign in with GitHub", exact: true })
      .waitFor();
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      touchTarget: document.querySelector("a")!.getBoundingClientRect().height,
    }));
    const tls = await response!.securityDetails();
    checks.push({
      check: `${width}px deployed gate`,
      status: response?.status(),
      layout,
      tls,
      passed:
        response?.status() === 401 &&
        layout.scroll <= width &&
        layout.touchTarget >= 44 &&
        !!tls,
    });
    await page.screenshot({
      path: `docs/collab-agent/ui-live-gate-${width}.png`,
      fullPage: true,
    });
    const login = await page.request.get(origin + "/auth/login", {
      maxRedirects: 0,
    });
    const target = new URL(login.headers().location);
    const metadata = {
      provider: target.searchParams.get("provider"),
      redirect: target.searchParams.get("redirect_uri"),
      challengeMethod: target.searchParams.get("code_challenge_method"),
      statePresent: !!target.searchParams.get("state"),
      challengePresent: !!target.searchParams.get("code_challenge"),
    };
    checks.push({
      check: `${width}px real login redirect`,
      status: login.status(),
      ...metadata,
      passed:
        login.status() === 302 &&
        metadata.provider === "GitHubOAuth" &&
        metadata.redirect === origin + "/auth/callback" &&
        metadata.challengeMethod === "S256" &&
        metadata.statePresent &&
        metadata.challengePresent,
    });
    // Follow the actual app link; never fill credentials or collect query strings/cookies.
    await page
      .getByRole("link", { name: "Sign in with GitHub", exact: true })
      .click();
    await page.waitForURL((u) => u.hostname === "github.com", {
      timeout: 20000,
    });
    await page
      .getByRole("textbox", { name: "Username or email address", exact: true })
      .waitFor();
    checks.push({
      check: `${width}px GitHub login required`,
      url: new URL(page.url()).origin + new URL(page.url()).pathname,
      passed: true,
      boundary:
        "No user credentials entered; no code exchange/session established",
    });
    await page.screenshot({
      path: `docs/collab-agent/ui-live-github-login-${width}.png`,
      fullPage: true,
    });
    await page.close();
  }
  const passed = checks.every((c) => c.passed) && !errors.length;
  await writeFile(
    "docs/collab-agent/raw/deployed-browser.json",
    JSON.stringify(
      {
        origin,
        boundary:
          "Actual deployed anonymous gate, GitHub-only authorization and human sign-in blocker. This is not real account login or import evidence.",
        checks,
        errors,
        passed,
        at: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${checks.length} deployed browser checks passed; real GitHub sign-in still requires human credentials/consent`,
  );
  if (!passed) process.exitCode = 1;
} finally {
  await browser.close();
}
