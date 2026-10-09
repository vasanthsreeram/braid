// Captures the redesigned workspace screens at 1440px and 390px against the
// local loopback server, with a GitHub provider double for the import screen.
import { chromium } from "playwright";
import { serveLocal, git } from "./local.ts";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ZERO } from "../src/review.ts";
import type { GitPlane } from "../src/contracts.ts";

const out = "docs/ui-redesign";
await mkdir(out, { recursive: true });
const dir = await mkdtemp(join(tmpdir(), "braid-shots-")),
  local = await serveLocal(dir);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const errors: string[] = [];
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
local.s.github = {
  account: async () => ({ connected: true, login: "vas", setupReady: true }),
  repos: async (_p: any, u: URL) => ({
    page: Number(u.searchParams.get("page")),
    nextPage: u.searchParams.get("page") === "1" ? 2 : null,
    repos: [
      ["notes-app", "A tiny markdown notes app with offline sync.", false],
      ["dotfiles", "My shell, editor and terminal setup.", false],
      ["react-table", "Fork of a headless table library.", true],
      ["website", null, false],
    ].map(([name, description, fork]) => ({
      id: name,
      name,
      fullName: `vas/${name}`,
      visibility: "public",
      fork,
      sizeKiB: 120,
      description,
    })),
    searchLimited: false,
  }),
  source: async (_p: any, name: string) => ({
    name: name.split("/")[1],
    url: `https://github.com/${name}.git`,
  }),
  disconnect: async () => ({ ok: true, revoked: true }),
} as any;
(local.plane as GitPlane).source = async () => ({ refs: [] }) as any;
(local.plane as GitPlane).import = async (name: string) => local.plane.create(name);

const shot = async (page: any, name: string) => {
  const width = page.viewportSize().width;
  const scroll = await page.evaluate(
    () => document.documentElement.scrollWidth - innerWidth,
  );
  if (scroll > 0) throw Error(`${name} overflows by ${scroll}px at ${width}`);
  await page.screenshot({ path: `${out}/${width}-${name}.png`, fullPage: true });
};

try {
  // Empty state first, before any repository exists.
  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(local.url);
    await page.locator("#local").waitFor();
    await shot(page, "sign-in");
    await page.locator("#local").click();
    await page.locator("#repos-empty").waitFor();
    await shot(page, "empty-state");
    await page.close();
  }

  // Fixture: a merged repository with README, a pending modification, issues.
  const repo = await call("/api/repos", { name: "braid-web" });
  const task = await call(`/api/repos/${repo.id}/tasks`, { name: "readme-refresh" });
  const work = join(dir, "work");
  await git(["clone", local.plane.path(task.physical), work]);
  await git(["config", "user.name", "Vas Rojin"], work);
  await git(["config", "user.email", "fixture@example.invalid"], work);
  await mkdir(join(work, "src"));
  await mkdir(join(work, "docs"));
  await writeFile(
    join(work, "README.md"),
    "# Braid web\n\nThe web client for **Braid**, where parallel work comes together.\n\n## Getting started\n\n1. Install dependencies with `npm install`.\n2. Run `npm run dev` and open the local URL.\n3. Sign in with the local test identity.\n\n## Project layout\n\n- `src/` holds the application code\n- `docs/` holds design notes\n\n```sh\nnpm run dev\n```\n\n> Everything here is private until you share it.\n",
  );
  await writeFile(
    join(work, "src", "app.ts"),
    'export function greet(name: string) {\n  return "Hello, " + name;\n}\n\nexport const version = 1;\n',
  );
  await writeFile(join(work, "docs", "notes.md"), "Design notes.\n");
  await writeFile(join(work, "package.json"), '{ "name": "braid-web" }\n');
  await git(["add", "."], work);
  await git(["commit", "-m", "Set up the project skeleton"], work);
  await git(["push", "origin", "HEAD:main"], work);
  const first = await git(["rev-parse", "HEAD"], work);
  const p1 = await call(`/api/repos/${repo.id}/proposals`, {
    task: task.id,
    base: ZERO,
    candidate: first,
  });
  await call(`/api/repos/${repo.id}/review`, { id: p1.id, status: "approved" });
  await call(`/api/repos/${repo.id}/merge`, { id: p1.id });
  await writeFile(
    join(work, "src", "app.ts"),
    'export function greet(name: string, excited = false) {\n  const greeting = "Hello, " + name;\n  return excited ? greeting + "!" : greeting;\n}\n\nexport const version = 2;\n',
  );
  await writeFile(join(work, "src", "format.ts"), "export const trim = (s: string) => s.trim();\n");
  await git(["add", "."], work);
  await git(["commit", "-m", "Add excited greetings and a trim helper"], work);
  await git(["push", "origin", "HEAD:main"], work);
  const second = await git(["rev-parse", "HEAD"], work);
  await call(`/api/repos/${repo.id}/proposals`, {
    task: task.id,
    base: first,
    candidate: second,
  });
  await call("/api/repos", { name: "design-notes" });
  await call("/api/repos", { name: "mobile-app" });
  const i1 = await call(`/api/repos/${repo.id}/issues`, {
    title: "Sign-in button is hard to find on mobile",
    body: "On a 390px screen the button sits below the fold.\nMove it up or make it sticky.",
    labels: ["bug", "mobile"],
    assignee: null,
  });
  await call(`/api/repos/${repo.id}/issues`, {
    title: "Write a short contributing guide",
    body: "",
    labels: ["docs"],
    assignee: null,
  });
  await call(`/api/repos/${repo.id}/issues/${i1.number}/comments`, {
    body: "I can take this one. Probably a CSS-only fix.",
    version: i1.version,
  });

  for (const width of [1440, 390]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(local.url);
    await page.locator("#local").click();
    await page.getByRole("button", { name: "braid-web", exact: true }).waitFor();
    await shot(page, "repo-list");
    await page.locator("#new-button").click();
    await shot(page, "new-menu");
    await page.getByRole("button", { name: /Import from GitHub Bring/ }).click();
    await page.getByText("vas/notes-app", { exact: true }).waitFor();
    await shot(page, "github-import");
    await page.locator("#mine").click();
    await page.getByRole("button", { name: "braid-web", exact: true }).click();
    await page.locator("#readme-body h1").waitFor();
    await shot(page, "repo-code");
    await page.locator("#clone").click();
    await shot(page, "repo-clone");
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Changes", exact: true }).click();
    await page
      .locator("#proposal-list .row")
      .filter({ hasText: "Open" })
      .getByRole("button")
      .click();
    await page.locator("#diff .dl.add").first().waitFor();
    await shot(page, "changes-diff");
    await page.getByRole("button", { name: "Propose changes", exact: true }).click();
    await page.locator("#proposal-summary").filter({ hasText: "readme-refresh" }).waitFor();
    await shot(page, "changes-propose");
    await page.getByRole("button", { name: "Issues", exact: true }).click();
    await page
      .getByRole("button", { name: "Sign-in button is hard to find on mobile" })
      .click();
    await page.locator("#issue-comments .comment").waitFor();
    await shot(page, "issues");
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page.locator("#access-list .row").first().waitFor();
    await shot(page, "settings");
    await page.locator("#profile").click();
    await page.locator("#activity .row").first().waitFor();
    await shot(page, "activity");
    await page.close();
  }
  if (errors.length) throw Error(errors.join("; "));
  await writeFile(
    `${out}/shots.json`,
    JSON.stringify({ widths: [1440, 390], errors, passed: true }, null, 2) + "\n",
  );
  console.log("Redesign screenshots captured in " + out);
} finally {
  await browser.close();
  await local.close();
  await rm(dir, { recursive: true, force: true });
}
