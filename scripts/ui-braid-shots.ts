// Captures the braid identity screens (strand map, strands, sparklines, empty states,
// activity) at 1440px and 390px, light and dark, against the local loopback server.
// Fixture: one repository with six strands in every state (braided in ×2, approved,
// proposed, working, rejected), plus repositories that exercise the list glyphs.
import { chromium, type Page } from "playwright";
import { serveLocal, git } from "./local.ts";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ZERO } from "../src/review.ts";

const out = "docs/ui-braid";
await mkdir(out, { recursive: true });
const dir = await mkdtemp(join(tmpdir(), "braid-identity-")),
  local = await serveLocal(dir);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const errors: string[] = [];
const captured: string[] = [];
const call = async (path: string, body?: any) => {
  const r = await fetch(local.url + path, {
    method: body ? "POST" : "GET",
    headers: { authorization: "Bearer " + local.token },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!r.ok) throw Error(path + ": " + (await r.text()));
  return r.json();
};
local.credentials.set(local.token, {
  ...local.principal,
  name: "Vas Rojin",
  email: "fixture@example.invalid",
  emailVerified: true,
} as any);

const shot = async (page: Page, name: string) => {
  const width = page.viewportSize()!.width;
  const scroll = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  if (scroll > 0) throw Error(`${name} overflows by ${scroll}px at ${width}`);
  // Let the map's resize pass settle, and capture from the top so the sticky bar sits once.
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(250);
  const path = `${out}/${width}-${name}.png`;
  await page.screenshot({ path, fullPage: true, animations: "disabled" });
  captured.push(path);
};

async function strand(repoId: string, name: string) {
  const task = await call(`/api/repos/${repoId}/tasks`, { name });
  const work = join(dir, "work-" + name);
  await git(["clone", local.plane.path(task.physical), work]);
  await git(["config", "user.name", "Vas Rojin"], work);
  await git(["config", "user.email", "fixture@example.invalid"], work);
  return {
    task,
    async commit(files: Record<string, string>, message: string) {
      for (const [file, text] of Object.entries(files)) {
        await mkdir(join(work, file, ".."), { recursive: true });
        await writeFile(join(work, file), text);
      }
      await git(["add", "."], work);
      await git(["commit", "-m", message], work);
      await git(["push", "origin", "HEAD:main"], work);
      return git(["rev-parse", "HEAD"], work);
    },
  };
}

try {
  // Empty workspace first.
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(local.url);
    await page.locator("#local").waitFor();
    await shot(page, "sign-in");
    await page.locator("#local").click();
    await page.locator("#repos-empty").waitFor();
    await shot(page, "empty-repositories");
    await page.close();
  }

  const repo = await call("/api/repos", { name: "braid-web" });
  const id = repo.id;
  const propose = (task: any, base: string, candidate: string) =>
    call(`/api/repos/${id}/proposals`, { task: task.id, base, candidate });
  const braid = async (p: any) => {
    await call(`/api/repos/${id}/review`, { id: p.id, status: "approved" });
    await call(`/api/repos/${id}/merge`, { id: p.id });
  };

  // 1. readme-refresh: the first three commits, braided in.
  const readme = await strand(id, "readme-refresh");
  await readme.commit(
    {
      "README.md":
        "# Braid web\n\nThe web client for **Braid**, where parallel work comes together.\n\n## Getting started\n\n1. Install dependencies with `npm install`.\n2. Run `npm run dev` and open the local URL.\n3. Sign in with the local test identity.\n\n> Everything here is private until you share it.\n",
      "package.json": '{ "name": "braid-web" }\n',
    },
    "Set up the project skeleton",
  );
  await readme.commit(
    { "src/app.ts": 'export function greet(name: string) {\n  return "Hello, " + name;\n}\n\nexport const version = 1;\n' },
    "Add the greeting module",
  );
  const c3 = await readme.commit({ "docs/notes.md": "Design notes.\n" }, "Write down the design notes");
  await braid(await propose(readme.task, ZERO, c3));

  // 2. trim-helper: two commits on top, braided in.
  const trim = await strand(id, "trim-helper");
  await trim.commit({ "src/format.ts": "export const trim = (s: string) => s.trim();\n" }, "Add a trim helper");
  const c5 = await trim.commit(
    { "src/format.ts": "export const trim = (s: string) => s.trim();\nexport const squash = (s: string) => s.replace(/\\s+/g, ' ');\n" },
    "Squash repeated whitespace",
  );
  await braid(await propose(trim.task, c3, c5));

  // 3. Strands forked from the current head.
  const excited = await strand(id, "excited-greetings");
  const dark = await strand(id, "dark-mode");
  const legacy = await strand(id, "legacy-cleanup");
  const mobile = await strand(id, "mobile-nav");

  const e1 = await excited.commit(
    {
      "src/app.ts":
        'export function greet(name: string, excited = false) {\n  const greeting = "Hello, " + name;\n  return excited ? greeting + "!" : greeting;\n}\n\nexport const version = 2;\n',
    },
    "Add excited greetings",
  );
  const pe = await propose(excited.task, c5, e1);
  await call(`/api/repos/${id}/review`, { id: pe.id, status: "approved" });

  await dark.commit({ "src/theme.css": ":root { color-scheme: light dark; }\n" }, "Follow the system colour scheme");
  const d2 = await dark.commit(
    { "src/theme.css": ":root { color-scheme: light dark; --bg: #faf7f2; }\n@media (prefers-color-scheme: dark) { :root { --bg: #15120f; } }\n" },
    "Add dark tokens",
  );
  await propose(dark.task, c5, d2);

  const l1 = await legacy.commit({ "src/legacy.ts": "// removed\n" }, "Remove the legacy API");
  const pl = await propose(legacy.task, c5, l1);
  await call(`/api/repos/${id}/review`, { id: pl.id, status: "rejected" });

  await mobile.commit({ "src/nav.ts": "export const nav = ['Home', 'Strands'];\n" }, "Sketch the mobile navigation");

  await call(`/api/repos/${id}/issues`, {
    title: "Sign-in button is hard to find on mobile",
    body: "On a 390px screen the button sits below the fold.",
    labels: ["bug", "mobile"],
    assignee: null,
  });

  // Other repositories for the list glyphs.
  await call("/api/repos", { name: "design-notes" });
  const mobileApp = await call("/api/repos", { name: "mobile-app" });
  await call(`/api/repos/${mobileApp.id}/tasks`, { name: "first-screen" });
  const failed = await call("/api/repos", { name: "old-import" });
  await local.catalog.state(failed.id, "failed");

  const scenes = async (page: Page, suffix = "") => {
    await page.goto(local.url);
    await page.locator("#local").click();
    await page.getByRole("button", { name: "braid-web", exact: true }).waitFor();
    await page.locator("#repos .row-braid").first().waitFor();
    await shot(page, "repo-list" + suffix);

    await page.getByRole("button", { name: "braid-web", exact: true }).click();
    await page.locator("#strand-map .sm-svg").waitFor();
    await page.locator("#readme-body h1").waitFor();
    await shot(page, "repo-strand-map" + suffix);

    await page.locator("#strand-map .sm-chip", { hasText: "dark-mode" }).click();
    await page.locator("#diff .dl.add").first().waitFor();
    await shot(page, "strands-diff" + suffix);

    if (!suffix) {
      await page.locator("#proposal-list").getByRole("button", { name: "excited-greetings", exact: true }).click();
      await page.getByRole("button", { name: "Braid in", exact: true }).waitFor();
      await shot(page, "strands-approved");
      await page.locator("#proposal-list").getByRole("button", { name: "mobile-nav", exact: true }).click();
      await page.locator("#strand-detail").getByRole("button", { name: "Open strand" }).waitFor();
      await shot(page, "strands-working");

      await page.locator("#mine").click();
      await page.getByRole("button", { name: "design-notes", exact: true }).click();
      await page.locator("#empty-repo").waitFor();
      await shot(page, "empty-repo");
      await page.locator("#proposals").click();
      await page.locator(".strands-empty").waitFor();
      await shot(page, "strands-empty");

      await page.locator("#profile").click();
      await page.locator("#activity .row").first().waitFor();
      await shot(page, "activity");
    }
  };

  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await scenes(page);
    await page.close();
    const darkPage = await browser.newPage({ viewport: { width, height: 900 }, colorScheme: "dark" });
    darkPage.on("pageerror", (e) => errors.push(e.message));
    await scenes(darkPage, "-dark");
    await darkPage.close();
  }
  if (errors.length) throw Error(errors.join("; "));
  await writeFile(
    `${out}/shots.json`,
    JSON.stringify({ widths: [1440, 390], schemes: ["light", "dark"], captured, errors, passed: true }, null, 2) + "\n",
  );
  console.log(`${captured.length} braid screenshots captured in ${out}`);
} finally {
  await browser.close();
  await local.close();
  await rm(dir, { recursive: true, force: true });
}
