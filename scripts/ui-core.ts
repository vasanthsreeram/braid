import { chromium } from "playwright";
import { serveLocal, git } from "./local.ts";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ZERO } from "../src/review.ts";
const dir = await mkdtemp(join(tmpdir(), "forge-core-ui-")),
  local = await serveLocal(dir);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const page = await browser.newPage({
    viewport: {
      width: Number(process.env.FORGE_UI_WIDTH ?? 1440),
      height: 1100,
    },
  }),
  errors: string[] = [],
  checks: string[] = [];
page.on("pageerror", (e) => errors.push(e.message));
const network: { path: string; status: number }[] = [],
  consoleErrors: string[] = [];
page.on("response", (r) => {
  if (r.status() >= 400)
    network.push({ path: new URL(r.url()).pathname, status: r.status() });
});
page.on("console", (m) => {
  if (m.type() === "error") consoleErrors.push(m.text());
});
const layout = async (view: string) => {
  const dimensions = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  if (dimensions.scroll > dimensions.width)
    throw Error(`Page overflow in ${view}: ${JSON.stringify(dimensions)}`);
  const small = await page
    .locator("button:visible, input:visible, select:visible")
    .evaluateAll((nodes) =>
      nodes
        .filter((n) => n.getBoundingClientRect().height < 44)
        .map((n) => n.outerHTML.slice(0, 90)),
    );
  if (small.length) throw Error(`Touch targets too small in ${view}: ${small}`);
  checks.push(view + " responsive layout and touch targets");
};
const call = async (path: string, body?: any) => {
  const r = await fetch(local.url + path, {
    method: body ? "POST" : "GET",
    headers: { authorization: "Bearer " + local.token },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!r.ok) throw Error(await r.text());
  return r.json();
};
try {
  local.credentials.set(local.token, {
    ...local.principal,
    email: "fixture@example.invalid",
    emailVerified: true,
  });
  const repo = await call("/api/repos", { name: "core-ui-private" });
  const task = await call("/api/repos/" + repo.id + "/tasks", {
    name: "core-ui-task",
  });
  const work = join(dir, "work");
  await git(["clone", local.plane.path(task.physical), work]);
  await git(["config", "user.name", "Fixture"], work);
  await git(["config", "user.email", "fixture@example.invalid"], work);
  await mkdir(join(work, "folder"));
  await writeFile(
    join(work, "README.md"),
    "# Reviewed fixture\nSafe source text.",
  );
  await writeFile(join(work, "folder", "nested.txt"), "Nested fixture content");
  await git(["add", "."], work);
  await git(["commit", "-m", "review fixture"], work);
  await git(["push", "origin", "HEAD:main"], work);
  const candidate = await git(["rev-parse", "HEAD"], work);
  const proposal = await call("/api/repos/" + repo.id + "/proposals", {
    task: task.id,
    base: ZERO,
    candidate,
  });
  await page.goto(local.url);
  await page.getByRole("button", { name: "Use local test identity" }).click();
  await page.getByText("core-ui-private", { exact: true }).waitFor();
  checks.push("local identity and private list");
  await page.getByText("Create or import a repository", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "Optional public GitHub URL" })
    .fill("https://github.com/vasanthsreeram/Maggie-s_Farm_consolidated");
  await layout("repository list and import form");
  await page
    .getByRole("textbox", { name: "Optional public GitHub URL" })
    .fill("");
  await page.locator("#query").fill("core-ui-private");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await page
    .getByText("core-ui-task", { exact: true })
    .waitFor({ state: "hidden" });
  if ((await page.locator(".repo").count()) !== 1)
    throw Error("Search did not filter task");
  checks.push("own/shared name search");
  await page.getByRole("button", { name: "Open", exact: true }).click();
  await page.getByRole("button", { name: "Proposals", exact: true }).click();
  await page.getByRole("button", { name: "View diff", exact: true }).click();
  await page.getByText("Safe source text.", { exact: false }).waitFor();
  checks.push("immutable added-file diff preview");
  await layout("review and merge forms");
  await page.getByRole("button", { name: "approved", exact: true }).click();
  await page.getByText("Decision recorded.", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Proposals", exact: true }).click();
  await page
    .getByRole("button", { name: "Merge approved candidate", exact: true })
    .click();
  await page.getByText("Merged " + candidate, { exact: true }).waitFor();
  if (
    (await git([
      "--git-dir",
      local.plane.path(repo.physical),
      "rev-parse",
      "HEAD",
    ])) !== candidate
  )
    throw Error("UI merge receipt disagrees with Git");
  checks.push("UI approve and actual controlled merge");
  await page.getByRole("button", { name: "README", exact: true }).click();
  await page
    .locator("#content")
    .filter({ hasText: "# Reviewed fixture" })
    .waitFor();
  checks.push("README text browsing");
  await page.getByRole("button", { name: "Browse", exact: true }).click();
  await page
    .getByRole("button", { name: "Folder: folder", exact: true })
    .click();
  await page
    .getByRole("button", { name: "File: folder/nested.txt", exact: true })
    .click();
  await page.getByText("Nested fixture content", { exact: true }).waitFor();
  checks.push("nested tree and file browse");
  await layout("nested file browsing");
  await page
    .getByRole("button", { name: "History & files", exact: true })
    .click();
  await page.locator("#commit-list").filter({ hasText: candidate }).waitFor();
  await page.locator("#commit-list a").click();
  await page.locator("#content").filter({ hasText: "Author date:" }).waitFor();
  checks.push("immutable commit history and detail navigation");
  await layout("commit details");
  await page.getByText("Collaboration & repository controls", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "Invite by verified email" })
    .fill("guest@example.invalid");
  await page
    .getByRole("button", { name: "Create invitation link", exact: true })
    .click();
  await page
    .locator("#content")
    .filter({ hasText: "guest@example.invalid" })
    .waitFor();
  checks.push("email invitation link creation");
  await page.getByRole("button", { name: "Access", exact: true }).click();
  await page
    .getByRole("button", { name: "Revoke invitation", exact: true })
    .click();
  if ((await local.catalog.invitations(repo.id))[0].state !== "revoked")
    throw Error("Invitation revoke not persisted");
  checks.push("invitation listing and revocation");
  await page
    .getByRole("button", { name: "Clone / push credential", exact: true })
    .click();
  if (
    (await page.locator("#git-remote").inputValue()) !==
    local.plane.path(repo.physical)
  )
    throw Error("Clone remote mismatch");
  checks.push(
    "clone credential panel (filesystem harness, no native credential claim)",
  );
  await page
    .getByRole("button", { name: "Reconcile operation", exact: true })
    .click();
  await page
    .locator("#content")
    .filter({ hasText: '"state": "merged"' })
    .waitFor();
  checks.push("merge receipt reconciliation");
  await page.getByRole("button", { name: "Discover", exact: true }).click();
  await page
    .getByText("No repositories in this view.", { exact: true })
    .waitFor();
  checks.push("private evaluation discovery contains no publication");
  await page
    .getByRole("button", { name: "My contribution profile", exact: true })
    .click();
  await page
    .locator("#profile-summary")
    .filter({ hasText: "1 commits" })
    .waitFor();
  await page.locator("#activity a").first().waitFor();
  if ((await page.locator("#heatmap .day").count()) !== 365)
    throw Error("Missing real daily counts");
  await layout("contribution profile");
  await page.screenshot({
    path: `docs/collab-agent/ui-${process.env.FORGE_UI_WIDTH ?? 1440}-profile.png`,
    fullPage: true,
  });
  await page.screenshot({
    path: `docs/collab-agent/ui-${process.env.FORGE_UI_WIDTH ?? 1440}-profile-viewport.png`,
    fullPage: false,
  });
  await page.locator("#activity a").first().click();
  await page.locator("#content").filter({ hasText: "Author date:" }).waitFor();
  await layout("profile to commit navigation");
  await page.reload();
  await page
    .getByRole("button", { name: "Use local test identity", exact: true })
    .click();
  await page.locator("#content").filter({ hasText: "Author date:" }).waitFor();
  checks.push(
    "commit deep link survives reload after local identity reconnect",
  );

  const unexpected = network.filter(
    (r) => !["/api/me", "/auth/refresh", "/favicon.ico"].includes(r.path),
  );
  if (unexpected.length) throw Error(JSON.stringify(unexpected));
  const unexpectedConsole = consoleErrors.filter(
    (message) => !/responded with a status of (401|404)/.test(message),
  );
  if (unexpectedConsole.length) throw Error(unexpectedConsole.join("; "));
  if (errors.length) throw Error(errors.join("; "));
  await page.screenshot({
    path: `docs/collab-agent/ui-${process.env.FORGE_UI_WIDTH ?? 1440}.png`,
    fullPage: true,
  });
  await writeFile(
    `docs/collab-agent/raw/ui-${process.env.FORGE_UI_WIDTH ?? 1440}.json`,
    JSON.stringify(
      {
        boundary:
          "local loopback app + real bare Git; provider identity not emulated",
        browser:
          "installed system Chrome; in-app bootstrap failed missing sandboxPolicy",
        checks,
        passed: true,
        pageErrors: errors,
        network,
        consoleErrors,
        viewport: page.viewportSize(),
        screenshot: `docs/collab-agent/ui-${process.env.FORGE_UI_WIDTH ?? 1440}.png`,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`${checks.length} core UI checks passed`);
} finally {
  await browser.close();
  await local.close();
  await rm(dir, { recursive: true, force: true });
}
