import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
import { randomBytes, createHash } from "node:crypto";
const origin = "https://gitflare.lintlabs.org";
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const checks: any[] = [],
  errors: string[] = [],
  network: any[] = [],
  consoleErrors: string[] = [];
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text());
    });
    page.on("response", (r) => {
      if (r.status() >= 400)
        network.push({
          width,
          path: new URL(r.url()).pathname,
          status: r.status(),
        });
    });
    const response = await page.goto(origin);
    await page.getByRole("link", { name: "Sign in with WorkOS" }).waitFor();
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
      touchTarget: document.querySelector("a")!.getBoundingClientRect().height,
    }));
    const tls = await response!.securityDetails();
    checks.push({
      width,
      path: "/",
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
      path: `docs/auth/ui-deployed-${width}.png`,
      fullPage: true,
    });
    const loginResponse = await Promise.all([
      page.waitForNavigation(),
      page.getByRole("link", { name: "Sign in with WorkOS" }).click(),
    ]);
    checks.push({
      width,
      path: "/auth/login",
      status: loginResponse[0]?.status(),
      passed:
        loginResponse[0]?.status() === 503 &&
        (await page.locator("body").innerText()).includes(
          "WorkOS environment unavailable",
        ),
    });
    await page.close();
  }
  const alias = await fetch(
    "https://cf-native-forge-evaluation.s-vasanthrojin.workers.dev/",
    { redirect: "manual" },
  );
  checks.push({
    check: "workers.dev canonical redirect",
    status: alias.status,
    location: alias.headers.get("location"),
    passed:
      alias.status === 308 && alias.headers.get("location") === origin + "/",
  });
  const insecure = await fetch("http://gitflare.lintlabs.org/", {
    redirect: "manual",
  });
  checks.push({
    check: "HTTP to HTTPS",
    status: insecure.status,
    location: insecure.headers.get("location"),
    passed:
      [301, 308].includes(insecure.status) &&
      insecure.headers.get("location") === origin + "/",
  });
  // Provider reachability only: the Worker intentionally cannot start an app flow
  // until its server API key exists. This does not establish an app session.
  const authorize = new URL("https://api.workos.com/user_management/authorize");
  const verifier = randomBytes(32).toString("base64url");
  for (const [k, v] of Object.entries({
    client_id: "client_01M3WQ9VJ9G2MH74MYP7WBD708",
    redirect_uri: origin + "/auth/callback",
    response_type: "code",
    provider: "authkit",
    state: randomBytes(16).toString("hex"),
    code_challenge: createHash("sha256").update(verifier).digest("base64url"),
    code_challenge_method: "S256",
  }))
    authorize.searchParams.set(k, v);
  const provider = await browser.newPage({
    viewport: { width: 390, height: 900 },
  });
  provider.on("pageerror", (e) => errors.push(e.message));
  const response = await provider.goto(authorize.href);
  await provider.screenshot({
    path: "docs/auth/ui-hosted-provider.png",
    fullPage: true,
  });
  await provider
    .getByRole("link", { name: "Continue with Google", exact: true })
    .waitFor({ timeout: 15000 });
  checks.push({
    check: "direct hosted provider pre-login (outside app flow)",
    url: provider.url().split("?")[0],
    status: response?.status(),
    googleVisible: true,
    passed: response?.status() === 200,
  });
  await provider.screenshot({
    path: "docs/auth/ui-hosted-provider.png",
    fullPage: true,
  });
  const unexpectedConsole = consoleErrors.filter(
    (message) => !/responded with a status of (401|503)/.test(message),
  );
  const passed =
    checks.every((c) => c.passed) &&
    !errors.length &&
    !unexpectedConsole.length;
  await writeFile(
    "docs/auth/raw/deployed-browser.json",
    JSON.stringify(
      {
        origin,
        at: new Date().toISOString(),
        boundary:
          "Real deployed anonymous UI and provider pre-login only. No authenticated WorkOS session: dedicated Worker API key missing. Responsive authenticated features tested in a separate local Git harness.",
        checks,
        errors,
        network,
        consoleErrors,
        unexpectedConsole,
        passed,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${checks.filter((c) => c.passed).length}/${checks.length} deployed browser checks pass; authenticated app session remains blocked`,
  );
  if (!passed) process.exitCode = 1;
} finally {
  await browser.close();
}
