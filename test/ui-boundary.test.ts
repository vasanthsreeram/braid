import { test } from "node:test";
import assert from "node:assert/strict";
import { uiWorker } from "../scripts/ui-polish-worker.ts";
import { welcome } from "../src/welcome.ts";

test("welcome: readiness, resume gating and invite escaping", () => {
  const offline = welcome(false, true, null);
  assert.match(offline, /Sign-in is temporarily unavailable/);
  assert.doesNotMatch(offline, /Resume session/);
  const ready = welcome(true, true, "invite_OK-123");
  assert.match(ready, /Resume session/);
  assert.match(ready, /\/auth\/login\?invite=invite_OK-123/);
  assert.doesNotMatch(
    welcome(true, false, '"><script>alert(1)</script>'),
    /alert\(1\)/,
  );
  assert.doesNotMatch(ready, /<style|<script[^>]*>[^<\s]/);
});

test("local workerd: exact public allowlist, CSP and private denials", async () => {
  const local = await uiWorker();
  try {
    const gate = await fetch(local.url);
    assert.equal(gate.status, 401);
    assert.match(
      gate.headers.get("content-security-policy")!,
      /default-src 'none'/,
    );
    assert.match(
      gate.headers.get("content-security-policy")!,
      /script-src 'self'/,
    );
    assert.doesNotMatch(
      gate.headers.get("content-security-policy")!,
      /unsafe-inline|unsafe-eval/,
    );
    assert.match(gate.headers.get("cache-control")!, /no-store/);
    assert.match(await gate.text(), /Sign-in is temporarily unavailable/);
    for (const path of [
      "/public/welcome.css",
    ]) {
      const r = await fetch(local.url + path);
      assert.equal(r.status, 200, path);
      assert.match(
        r.headers.get("content-type")!,
        path.endsWith("css") ? /text\/css/ : /text\/javascript/,
      );
      assert.equal(r.headers.get("x-content-type-options"), "nosniff");
      assert.match(r.headers.get("cache-control")!, /must-revalidate/);
      assert.equal(
        (await fetch(local.url + path, { method: "HEAD" })).status,
        200,
      );
      assert.equal(
        (await fetch(local.url + path, { method: "POST" })).status,
        401,
      );
    }
    for (const path of [
      "/app.js",
      "/style.css",
      "/braid.js",
      "/braid.css",
      "/index.html",
      "/favicon.ico",
      "/public/",
      "/public/other.js",
      "/public/../app.js",
      "/public/%2e%2e/app.js",
      "/public/%2f..%2fapp.js",
      "/public/blocks.js",
      "/public/route.js",
      "/public/welcome.css/../app.js",
      "/public/welcome.css.map",
      "/public/%77elcome.css",
      "/public/welcome.css/",
      "/src/worker.ts",
      "/.git/config",
      "/__local_identity",
      "/api/repos",
      "/api/discovery",
      "/api/repos/00000000-0000-4000-8000-000000000000/tree",
      "/api/profile",
    ]) {
      const r = await fetch(local.url + path);
      assert.equal(r.status, path.includes("/tree") ? 404 : 401, path);
      assert.doesNotMatch(
        await r.text(),
        /use strict|Gitflare · Workspace|local-owner|WORKOS_API_KEY/,
      );
    }
    assert.equal(
      (await fetch(local.url + "/auth/login", { redirect: "manual" })).status,
      503,
    );
  } finally {
    await local.close();
  }
});

test("local workerd: AuthKit-ready gate stays 401 and login retains PKCE redirect", async () => {
  const local = await uiWorker(true);
  try {
    const gate = await fetch(local.url + "/?invite=fixture_invite", {
      headers: { cookie: "__Host-forge=invalid-fixture" },
    });
    assert.equal(gate.status, 401);
    const html = await gate.text();
    assert.doesNotMatch(html, /temporarily unavailable/);
    assert.match(html, /Resume session/);
    assert.match(html, /auth\/login\?invite=fixture_invite/);
    const login = await fetch(local.url + "/auth/login", {
      redirect: "manual",
    });
    assert.equal(login.status, 302);
    const target = new URL(login.headers.get("location")!);
    assert.equal(target.hostname, "api.workos.com");
    assert.equal(target.searchParams.get("code_challenge_method"), "S256");
    assert.equal(target.searchParams.get("provider"), "GitHubOAuth");
    assert.equal((await fetch(local.url + "/app.js")).status, 401);
  } finally {
    await local.close();
  }
});
