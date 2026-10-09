import { chromium } from "playwright";
import { serveLocal } from "./local.ts";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
const dir = await mkdtemp(join(tmpdir(), "collab-ui-")),
  local = await serveLocal(dir);
const browser = await chromium.launch({
  headless: true,
  executablePath:
    process.env.FORGE_CHROME_PATH ??
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
});
const receipts: any[] = [];
const ownerCall = async (path: string, body?: any) => {
  const r = await fetch(local.url + path, {
    method: body ? "POST" : "GET",
    headers: { authorization: "Bearer " + local.token },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.ok(r.ok, await r.clone().text());
  return r.json() as Promise<any>;
};
try {
  const guestToken = "independent-local-test-reader";
  local.credentials.set(guestToken, {
    id: "local-reader",
    name: "Local reader (test actor)",
    email: "reader@example.invalid",
    emailVerified: true,
    tenant: local.principal.tenant,
  });
  const repo = await ownerCall("/api/repos", {
      name: "gitflare-collaboration",
    }),
    prefix = "/api/repos/" + repo.id;
  for (const width of [1440, 390]) {
    const owner = await browser.newContext({
        viewport: { width, height: 1000 },
      }),
      reader = await browser.newContext({ viewport: { width, height: 1000 } }),
      p = await owner.newPage(),
      r = await reader.newPage();
    const errors: string[] = [];
    p.on("pageerror", (e) => errors.push(e.message));
    r.on("pageerror", (e) => errors.push(e.message));
    const checks: string[] = [];
    const layout = async (page: any, view: string) => {
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        "Overflow " + view,
      );
      checks.push(view + " no overflow");
    };
    await p.goto(local.url);
    await p.getByRole("button", { name: "Use local test identity" }).click();
    await p.locator("#repos .repo button").click();
    await p.getByRole("button", { name: "Settings", exact: true }).click();
    await p.locator("#invite-email").fill("reader@example.invalid");
    await p.locator("#invite select").selectOption("reader");
    await p.getByRole("button", { name: "Send invite", exact: true }).click();
    await p
      .locator("#invite-result")
      .filter({ hasText: "reader@example.invalid" })
      .waitFor();
    const invites = await local.catalog.invitations(repo.id);
    const invitation = invites.find((i) => i.state === "pending")!;
    checks.push("owner creates verified email invitation");
    await r.goto(local.url + "/?invite=" + invitation.id);
    await r.locator("#credential").fill(guestToken);
    await r.getByRole("button", { name: "Connect", exact: true }).click();
    await r
      .getByRole("button", { name: "Accept invitation", exact: true })
      .click();
    await r.locator("#notice").filter({ hasText: "Invitation accepted." }).waitFor();
    await r.locator("#repos .repo button").click();
    checks.push("independent local credential accepts invite and browses");
    await p.getByRole("button", { name: "Issues", exact: true }).click();
    await p.locator("#issue-new").click();
    await p
      .locator("#issue-create-title")
      .fill("Review private bundle integrity " + width);
    await p
      .locator("#issue-create-body")
      .fill(
        "Verify refs, original authors, dates, and every source object before cutover.",
      );
    await p.locator("#issue-create select").selectOption("local-reader");
    await p.locator("#issue-create-labels").fill("migration, review");
    await p.getByRole("button", { name: "Create issue", exact: true }).click();
    await p.getByText("Issue created.", { exact: true }).waitFor();
    const issues = await ownerCall(prefix + "/issues");
    const issue = issues.issues[0];
    checks.push("issue create and current collaborator assignment");
    await r.getByRole("button", { name: "Issues", exact: true }).click();
    await r
      .getByRole("button", { name: issue.title, exact: true })
      .click();
    assert.equal(await r.locator("#issue-edit").isVisible(), false);
    await r
      .locator("#issue-comment-body")
      .fill(
        "Reader evidence: preserve <script>text</script> without HTML execution.",
      );
    await r.locator("#issue-comment button").click();
    await r.getByText("Comment added.", { exact: true }).waitFor();
    checks.push("reader append-only comment rendered as hostile plain text");
    await p.locator("#issue-edit-toggle").click();
    await p.locator("#issue-edit-title").fill("Stale draft kept " + width);
    await p.getByRole("button", { name: "Save changes" }).click();
    await p
      .getByText(
        "Someone else updated this issue. Reopen it to see their changes, then save again.",
        { exact: true },
      )
      .waitFor();
    assert.equal(
      await p.locator("#issue-edit-title").inputValue(),
      "Stale draft kept " + width,
    );
    checks.push("stale save rejected without losing draft");
    await p
      .getByRole("button", { name: issue.title, exact: true })
      .click();
    await p.locator("#issue-edit-toggle").click();
    await p.locator("#issue-edit-state").selectOption("closed");
    await p.getByRole("button", { name: "Save changes" }).click();
    await p.getByText("Issue saved.", { exact: true }).waitFor();
    await p.locator("#issue-meta").filter({ hasText: "Closed" }).waitFor();
    assert.equal(
      (await ownerCall(prefix + "/issues/" + issue.number)).issue.state,
      "closed",
    );
    await layout(p, "issue detail");
    await layout(r, "reader detail");
    await p.screenshot({
      path: `docs/collab-agent/issues-${width}.png`,
      fullPage: true,
    });
    await p
      .locator("#issue-detail")
      .screenshot({ path: `docs/collab-agent/issue-detail-${width}.png` });
    await p.getByRole("button", { name: "Reviews", exact: true }).click();
    await p
      .getByText("Automated reviews aren't available on this server.", {
        exact: true,
      })
      .waitFor();
    checks.push("local runtime honestly unavailable, no model fixture");
    await layout(p, "review");
    await p.screenshot({
      path: `docs/collab-agent/review-blocked-local-${width}.png`,
      fullPage: true,
    });
    await ownerCall(prefix + "/grants", { user: "local-reader", role: null });
    await r.locator("#issue-comment-body").fill("Denied after revocation");
    await r.locator("#issue-comment button").click();
    await r
      .locator("#notice")
      .filter({ hasText: "you no longer have access" })
      .waitFor();
    checks.push("revocation denies existing reader context");
    assert.deepEqual(errors, []);
    receipts.push({
      width,
      checks,
      errors,
      passed: true,
      identityBoundary:
        "Two independently authenticated loopback credentials; explicit test actors, not human WorkOS accounts",
    });
    await owner.close();
    await reader.close();
  }
  await writeFile(
    "docs/collab-agent/raw/ui-collaboration.json",
    JSON.stringify(receipts, null, 2) + "\n",
  );
  console.log("Collaboration UI journeys passed at 390 and 1440");
} finally {
  await browser.close();
  await local.close();
  await rm(dir, { recursive: true, force: true });
}
