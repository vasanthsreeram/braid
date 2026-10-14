// Read-only custom-host verification. Never authenticates or performs repository/model operations.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const origin = "https://gitflare.lintlabs.org";
const checks: {
  path: string;
  method: string;
  status: number;
  passed: boolean;
}[] = [];
const hash = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
const root = await fetch(origin);
assert.equal(root.status, 401);
const csp = root.headers.get("content-security-policy")!;
assert.match(csp, /default-src 'none'/);
assert.match(csp, /script-src 'self'/);
assert.match(csp, /style-src 'self'/);
assert.match(csp, /form-action 'self'/);
assert.doesNotMatch(csp, /unsafe-inline|unsafe-eval/);
assert.match(root.headers.get("cache-control")!, /no-store/);
assert.equal(root.headers.get("x-content-type-options"), "nosniff");
const html = await root.text();
assert.match(html, /Great code\./);
assert.match(html, /Gitrah Blocks/);
assert.doesNotMatch(
  html,
  /LOCALFIXTURE|fixture-owner|local-owner|temporarily unavailable/,
);
checks.push({ path: "/", method: "GET", status: root.status, passed: true });
const assets = [];
for (const path of [
  "/public/welcome.css",
  "/public/blocks.js",
  "/public/blocks-engine.js",
  "/public/gitgraphics.js",
  "/public/route.js",
  "/public/stripes-engine.js",
]) {
  const response = await fetch(origin + path);
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type")!,
    path.endsWith("css") ? /text\/css/ : /text\/javascript/,
  );
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("cache-control")!, /must-revalidate/);
  const remote = new Uint8Array(await response.arrayBuffer());
  const local = await readFile("web" + path);
  assert.equal(
    hash(remote),
    hash(local),
    path + " must match private committed source",
  );
  assets.push({
    path,
    sha256: hash(remote),
    bytes: remote.byteLength,
    sourceMatches: true,
  });
  checks.push({ path, method: "GET", status: 200, passed: true });
  const head = await fetch(origin + path, { method: "HEAD" });
  assert.equal(head.status, 200);
  checks.push({ path, method: "HEAD", status: 200, passed: true });
}
for (const path of [
  "/api/repos",
  "/api/discovery",
  "/api/profile",
  "/app.js",
  "/style.css",
  "/index.html",
  "/public/",
  "/public/not-public.js",
  "/public/../app.js",
  "/public/%2e%2e/app.js",
  "/public/%2f..%2fapp.js",
  "/public/blocks.js",
  "/public/welcome.css.map",
  "/public/%77elcome.css",
  "/public/welcome.css/",
  "/src/worker.ts",
  "/.git/config",
  "/__local_identity",
]) {
  const r = await fetch(origin + path);
  assert.ok([401, 403, 404].includes(r.status), path + " must be denied");
  assert.doesNotMatch(
    await r.text(),
    /use strict|Gitrah · Workspace|LOCALFIXTURE|fixture-owner|WORKOS_API_KEY/,
  );
  checks.push({ path, method: "GET", status: r.status, passed: true });
}
const login = await fetch(origin + "/auth/login", { redirect: "manual" });
assert.equal(login.status, 302);
const redirect = new URL(login.headers.get("location")!);
assert.equal(redirect.hostname, "api.workos.com");
assert.equal(redirect.searchParams.get("provider"), "GitHubOAuth");
assert.equal(redirect.searchParams.get("code_challenge_method"), "S256");
checks.push({
  path: "/auth/login",
  method: "GET",
  status: login.status,
  passed: true,
});
await writeFile(
  "docs/ui-polish/receipts/live-http.json",
  JSON.stringify(
    {
      origin,
      checkedAt: new Date().toISOString(),
      checks,
      assets,
      csp,
      passed: true,
      authBoundary:
        "Real login route creates PKCE redirect. No human/provider login completed, authenticated screen claim, paid inference or live repository mutation.",
      cookiesOrTokensRecorded: false,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `${checks.length} read-only live HTTP checks passed; public asset bytes match committed source`,
);
