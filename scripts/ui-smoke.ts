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
  await page
    .getByRole("heading", { name: "Build together. Keep control." })
    .waitFor();
  checks++;
  await page.getByRole("button", { name: "Use local test identity" }).click();
  await page.getByText("LOCAL: filesystem storage + bare Git").waitFor();
  const identity = await page.locator("#identity").innerText();
  if (identity !== "local-owner")
    throw Error("Local test identity did not connect");
  checks++;
  await page
    .getByPlaceholder("Repository name", { exact: true })
    .fill("ui-synthetic-repo");
  await page.getByRole("button", { name: "Create private repo" }).click();
  await page.getByText("ui-synthetic-repo", { exact: true }).waitFor();
  checks++;
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await page.locator("#detail").waitFor({ state: "visible" });
  if (!(await page.locator("#repo-header").innerText()).includes("private"))
    throw Error("Private default absent");
  checks++;
  await page.getByPlaceholder("New task name", { exact: true }).fill("ui-task");
  await page.getByRole("button", { name: "Fork task", exact: true }).click();
  await page.getByText("ui-task", { exact: true }).waitFor();
  checks++;
  await mkdir("docs/benchmarks", { recursive: true });
  await page.screenshot({
    path: "docs/benchmarks/ui-local.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Discover", exact: true }).click();
  await page.getByText("No repositories in this view.").waitFor();
  checks++;
  if (errors.length) throw Error("UI console errors: " + errors.join(";"));
  await writeFile(
    "docs/benchmarks/raw/ui-v1.json",
    JSON.stringify(
      {
        version: 1,
        provider: "local loopback only",
        checks,
        passed: true,
        pageErrors: errors,
        screenshot: "docs/benchmarks/ui-local.png",
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
