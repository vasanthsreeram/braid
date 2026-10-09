import { chromium } from "playwright";
import { serveLocal } from "./local.ts";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { GitPlane } from "../src/contracts.ts";
const dir = await mkdtemp(join(tmpdir(), "gitflare-github-ui-"));
const local = await serveLocal(dir);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const checks: string[] = [],
  errors: string[] = [];
let connected = true,
  width = 390;
local.s.github = {
  account: async () => ({
    connected,
    login: "fixture-owner",
    setupReady: true,
  }),
  repos: async (p, u) => ({
    page: Number(u.searchParams.get("page")),
    nextPage: u.searchParams.get("page") === "1" ? 2 : null,
    repos: [
      {
        name: `example-${width}`,
        fullName: `fixture-owner/example-${width}`,
        visibility: "public",
        fork: false,
      },
    ],
    searchLimited: false,
  }),
  source: async () => ({
    name: `example-${width}`,
    url: `https://github.com/fixture-owner/example-${width}.git`,
  }),
  disconnect: async () => {
    connected = false;
    return { ok: true, revoked: true };
  },
};
(local.plane as GitPlane).source = async () => ({ refs: [] });
(local.plane as GitPlane).import = async (name) => local.plane.create(name);
try {
  for (width of [390, 1440]) {
    connected = true;
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(local.url);
    await page.getByRole("button", { name: "Use local test identity" }).click();
    await page.locator("[data-go=github]:visible").first().click();
    await page
      .getByText("Connected as @fixture-owner", { exact: true })
      .waitFor();
    await page
      .getByText(`fixture-owner/example-${width}`, { exact: true })
      .waitFor();
    await page.getByRole("button", { name: "Next page" }).click();
    await page.getByText("Page 2", { exact: true }).waitFor();
    if (
      !(await page
        .getByRole("button", { name: "Next page" })
        .isDisabled())
    )
      throw Error("Pagination boundary missing");
    await page.getByRole("button", { name: "Previous page" }).click();
    await page.getByText("Page 1", { exact: true }).waitFor();
    await page.locator("#github-query").fill("example");
    await page.locator("#github-search button").click();
    await page
      .getByText("Imported repositories are private until you choose to share them.", {
        exact: true,
      })
      .waitFor();
    await page
      .getByRole("button", { name: `Import fixture-owner/example-${width}`, exact: true })
      .click();
    await page
      .getByRole("button", { name: `Open fixture-owner/example-${width}`, exact: true })
      .waitFor();
    const destinations = await local.catalog.list(local.principal, false);
    const r = destinations.find((r) => r.name === `example-${width}`);
    if (!r || r.owner !== local.principal.id || r.visibility !== "private")
      throw Error("Private ownership not retained");
    const layout = await page.evaluate(() => ({
      width: innerWidth,
      scroll: document.documentElement.scrollWidth,
    }));
    if (layout.scroll > width) throw Error("GitHub picker overflow");
    const small = await page
      .locator(
        "#github-view button:visible,#github-view input:visible,#github-view a:visible",
      )
      .evaluateAll(
        (nodes) =>
          nodes.filter((n) => n.getBoundingClientRect().height < 44).length,
      );
    if (small) throw Error("GitHub picker touch target too small");
    await page.locator("#github-view").scrollIntoViewIfNeeded();
    await page.screenshot({
      path: `docs/collab-agent/ui-picker-fixture-${width}.png`,
      fullPage: true,
    });
    checks.push(
      `${width}px: connected fixture account, public badge, pagination/search, private import through app, ownership, import status, layout and touch targets`,
    );
    await page
      .getByRole("button", { name: "Disconnect", exact: true })
      .click();
    await page
      .getByText("Connect your GitHub account", {
        exact: true,
      })
      .waitFor();
    if (await page.locator("#github-picker").isVisible())
      throw Error("Disconnected repositories remain visible");
    checks.push(`${width}px: disconnect removes repository picker`);
    await page.close();
  }
  if (errors.length) throw Error("Browser page errors");
  await writeFile(
    "docs/collab-agent/raw/ui-picker.json",
    JSON.stringify(
      {
        boundary:
          "Local authenticated app with GitHub provider contract doubles and real empty local Git import destinations; no live Vas identity or GitHub imports",
        checks,
        errors,
        passed: true,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${checks.length} GitHub picker UI checks passed (local provider fixtures)`,
  );
} finally {
  await browser.close();
  await local.close();
  await rm(dir, { recursive: true, force: true });
}
