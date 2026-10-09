import { chromium } from "playwright";
import { serveLocal } from "./local.ts";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const dir = await mkdtemp(join(tmpdir(), "cf-native-forge-ui-"));
const local = await serveLocal(dir);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
let checks = 0;
const errors: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(local.url);
  await page.getByRole("heading", { name: "Welcome to Braid" }).waitFor();
  checks++;
  await page.getByRole("button", { name: "Use local test identity" }).click();
  await page.locator("#repos-empty").waitFor();
  const identity = await page.locator("#identity").innerText();
  if (identity !== "local-owner")
    throw Error("Local test identity did not connect");
  checks++;
  await page
    .locator("#repos-empty")
    .getByRole("button", { name: "New repository" })
    .click();
  await page.locator("#create input[name=name]").fill("ui-synthetic-repo");
  await page.getByRole("button", { name: "Create repository" }).click();
  await page.locator("#repo-header").filter({ hasText: "ui-synthetic-repo" }).waitFor();
  checks++;
  if ((await page.locator("#repo-visibility").innerText()) !== "Private")
    throw Error("Private default absent");
  checks++;
  await page.getByRole("button", { name: "Strands", exact: true }).click();
  await page.getByRole("button", { name: "New strand", exact: true }).click();
  await page.locator("#task input[name=name]").fill("ui-task");
  await page.getByRole("button", { name: "Create strand", exact: true }).click();
  await page.locator("#repo-header").filter({ hasText: "ui-task" }).waitFor();
  checks++;
  await mkdir("docs/github-auth", { recursive: true });
  await page.screenshot({
    path: "docs/github-auth/ui-basic.png",
    fullPage: true,
  });
  await page.locator("#discover").click();
  await page.getByText("Nothing to explore yet", { exact: true }).waitFor();
  checks++;
  if (errors.length) throw Error("UI console errors: " + errors.join(";"));
  await writeFile(
    "docs/github-auth/raw/ui-basic.json",
    JSON.stringify(
      {
        version: 1,
        provider: "local loopback only",
        checks,
        passed: true,
        pageErrors: errors,
        screenshot: "docs/github-auth/ui-basic.png",
        browser:
          "headless system Google Chrome; in-app browser tool failed bootstrap due missing sandboxPolicy",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`UI smoke: ${checks} checks passed, no page errors.`);
} finally {
  await browser.close();
  await local.close();
  await rm(dir, { recursive: true, force: true });
}
