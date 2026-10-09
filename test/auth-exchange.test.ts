import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { build } from "esbuild";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { EncryptJWT, jwtDecrypt, SignJWT } from "jose";
import { authRoute } from "../src/auth.ts";
import { digest } from "../src/storage.ts";
const c = {
  WORKOS_CLIENT_ID: "client_fixture",
  WORKOS_ISSUER: "https://api.workos.com/user_management/client_fixture",
  WORKOS_API_KEY: "fixture-key-never-live",
  SESSION_SECRET: "fixture-session-secret".repeat(3),
  ORIGIN: "https://forge.invalid",
};
async function flow() {
  const r = (await authRoute(c, new Request(c.ORIGIN + "/auth/login")))!;
  const u = new URL(r.headers.get("location")!);
  const cookie = r.headers.get("set-cookie")!.split(";")[0];
  return {
    cookie,
    state: u.searchParams.get("state")!,
    challenge: u.searchParams.get("code_challenge")!,
  };
}
function callback(f: Awaited<ReturnType<typeof flow>>) {
  return new Request(
    c.ORIGIN + "/auth/callback?code=fixture-code&state=" + f.state,
    { headers: { cookie: f.cookie } },
  );
}
test("exchange diagnostics allowlist malicious bodies, never mint sessions, and isolate correlations to the failing attempt", async () => {
  const secret = "attacker-secret-email@example.invalid-sk-token-cookie";
  const cases: [number, unknown, string, string][] = [
    [
      400,
      { error: "invalid_client", error_description: secret },
      "invalid_client",
      "generic",
    ],
    [
      401,
      { error: "invalid_request", message: secret },
      "invalid_request",
      "generic",
    ],
    [
      400,
      { error: "invalid_grant", error_description: "Invalid code verifier." },
      "invalid_grant",
      "pkce_rejected",
    ],
    [
      400,
      {
        error: "invalid_grant",
        error_description: "Invalid code verifier. " + secret,
      },
      "invalid_grant",
      "generic",
    ],
    [
      400,
      {
        error: "invalid_grant",
        error_description: "expired or reused: " + secret,
      },
      "invalid_grant",
      "generic",
    ],
    [
      400,
      { error: secret, error_description: secret, correlation: secret },
      "unexpected_response",
      "generic",
    ],
    [
      400,
      { error: { toString: "invalid_client" } },
      "unexpected_response",
      "generic",
    ],
    [400, [{ error: "invalid_client" }], "unexpected_response", "generic"],
    [
      429,
      { error: "invalid_client", request_id: secret },
      "rate_limit",
      "generic",
    ],
    [503, { error: "invalid_grant" }, "upstream", "generic"],
    [302, { error: "invalid_client" }, "unexpected_response", "generic"],
    [200, null, "unexpected_response", "generic"],
    [
      200,
      { accessToken: secret, refreshToken: secret },
      "unexpected_response",
      "generic",
    ],
    [
      200,
      { access_token: "", refresh_token: secret },
      "unexpected_response",
      "generic",
    ],
    [400, secret.repeat(2000), "unexpected_response", "generic"],
  ];
  const correlations = new Set<string>();
  for (const [status, body, category, reason] of cases) {
    const f = await flow();
    let calls = 0;
    const response = (await authRoute(c, callback(f), {
      request: (async (_url, init) => {
        calls++;
        assert.equal(init!.redirect, "manual");
        const b = JSON.parse(init!.body as string);
        assert.equal(b.client_id, c.WORKOS_CLIENT_ID);
        assert.equal(b.client_secret, c.WORKOS_API_KEY);
        assert.equal(b.grant_type, "authorization_code");
        assert.match(b.code_verifier, /^[A-Za-z0-9_-]{43}$/);
        return Response.json(body, {
          status,
          headers: { location: "https://evil.invalid/" },
        });
      }) as typeof fetch,
    }))!;
    assert.equal(calls, 1);
    assert.equal(
      response.status,
      ["invalid_client", "invalid_grant", "invalid_request"].includes(category)
        ? 401
        : 503,
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
    assert.match(
      response.headers.get("set-cookie")!,
      /^__Host-forge-flow=;.*Max-Age=0$/,
    );
    assert.equal(response.headers.get("location"), null);
    const b = (await response.json()) as any;
    assert.deepEqual(
      Object.keys(b).sort(),
      [
        "message",
        "phase",
        "category",
        "reason",
        "provider_status",
        "provider_code",
        "correlation",
        "retry",
        "advice",
      ].sort(),
    );
    assert.equal(b.category, category);
    assert.equal(b.reason, reason);
    assert.equal(b.provider_status, status);
    assert.equal(b.phase, "code_exchange");
    assert.equal(b.message, "Authentication failed");
    assert.equal(b.retry, "/auth/login");
    assert.match(b.correlation, /^[0-9a-f-]{36}$/);
    assert.ok(!correlations.has(b.correlation));
    correlations.add(b.correlation);
    for (const sensitive of [
      secret,
      c.WORKOS_API_KEY,
      c.SESSION_SECRET,
      f.cookie,
      f.state,
      f.challenge,
      "fixture-code",
    ])
      assert.ok(!JSON.stringify(b).includes(sensitive));
  }
});
test("transport exceptions and non-JSON responses discard arbitrary text and fail closed", async () => {
  for (const kind of [
    "network",
    "malformed_error",
    "malformed_success",
  ] as const) {
    const response = (await authRoute(c, callback(await flow()), {
      request: (async () => {
        if (kind === "network")
          throw Error(
            "https://provider.invalid/?code=secret&state=secret cookie=secret",
          );
        return new Response("<html>secret</html>", {
          status: kind === "malformed_error" ? 400 : 200,
        });
      }) as typeof fetch,
    }))!;
    const b = (await response.json()) as any;
    assert.equal(
      b.category,
      kind === "network" ? "network" : "unexpected_response",
    );
    assert.equal(
      b.provider_status,
      kind === "network" ? null : kind === "malformed_error" ? 400 : 200,
    );
    assert.ok(!JSON.stringify(b).includes("secret"));
    assert.equal(response.status, 503);
  }
});
test("expired, tampered, wrong-origin or malformed-verifier flow never reaches exchange or reveals provider diagnostics", async () => {
  const f = await flow();
  const key = new Uint8Array(
    Buffer.from(digest(new TextEncoder().encode(c.SESSION_SECRET)), "hex"),
  );
  const { payload } = await jwtDecrypt(
    f.cookie.slice(f.cookie.indexOf("=") + 1),
    key,
  );
  async function seal(issuer: string, verifier: unknown, expiry: string) {
    return (
      "__Host-forge-flow=" +
      (await new EncryptJWT({ ...payload, verifier })
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .setIssuer(issuer)
        .setAudience("forge-oauth")
        .setIssuedAt()
        .setExpirationTime(expiry)
        .encrypt(key))
    );
  }
  for (const value of [
    f.cookie + "tampered",
    await seal(c.ORIGIN, payload.verifier, "-1s"),
    await seal("https://other.invalid", payload.verifier, "10m"),
    await seal(c.ORIGIN, undefined, "10m"),
    await seal(c.ORIGIN, "bad", "10m"),
  ]) {
    let calls = 0;
    const response = (await authRoute(c, callback({ ...f, cookie: value }), {
      request: (async () => {
        calls++;
        throw Error("Must not reach provider");
      }) as typeof fetch,
    }))!;
    const b = (await response.json()) as any;
    assert.equal(calls, 0);
    assert.equal(b.phase, "oauth_state");
    assert.equal(b.category, undefined);
    assert.equal(b.correlation, undefined);
    assert.equal(b.retry, "/auth/login");
    assert.ok(response.status >= 400);
  }
});
test("real workerd fetch reaches the provider double and rejects redirects without forwarding credentials", async () => {
  let requests = 0,
    redirected = 0;
  const server = createServer((req, res) => {
    requests++;
    if (req.url === "/redirected") {
      redirected++;
      res.end("unexpected");
      return;
    }
    if (req.url === "/redirect") {
      res.writeHead(302, { location: "/redirected" });
      res.end();
      return;
    }
    assert.equal(req.headers.authorization, "Bearer " + c.WORKOS_API_KEY);
    res.writeHead(400, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid code verifier.",
      }),
    );
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const provider = `http://127.0.0.1:${address.port}`;
  const bundled = await build({
    stdin: {
      contents: `import { workos } from './src/auth.ts'; export default { async fetch(r) { try { await workos(${JSON.stringify(c)}, '/user_management/authenticate', {grant_type:'authorization_code',code:'fixture-code'}, { request: (_url, init) => fetch('${provider}' + new URL(r.url).pathname, init) }); return Response.json({unexpected:true}); } catch(e) {return Response.json({category:e.category,providerStatus:e.providerStatus});} } };`,
      resolveDir: process.cwd(),
      sourcefile: "auth-runtime-fixture.ts",
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "neutral",
    conditions: ["workerd"],
    external: ["node:*"],
  });
  const mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: bundled.outputFiles[0].text,
      compatibilityDate: "2026-10-01",
      compatibilityFlags: ["nodejs_compat"],
    }),
  );
  try {
    assert.deepEqual(
      await (await mf.dispatchFetch("http://localhost/exchange")).json(),
      { category: "invalid_grant", providerStatus: 400 },
    );
    assert.deepEqual(
      await (await mf.dispatchFetch("http://localhost/redirect")).json(),
      { category: "unexpected_response", providerStatus: 302 },
    );
    assert.equal(requests, 2);
    assert.equal(redirected, 0);
  } finally {
    await mf.dispose();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});

test("email verification required: pending token stays sealed, code completes sign-in, wrong origin/code rejected (contract double)", async () => {
  const pending = "pending_fixture_token_abc123";
  const calls: any[] = [];
  const access = await new SignJWT({ sub: "user_a", sid: "session_a" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode("test-only-key-that-is-long-enough"));
  const io = {
    verify: async () => ({ id: "user_a", tenant: "user_a" }),
    request: (async (url: any, init: any) => {
      const u = new URL(url);
      if (u.pathname.endsWith("/sessions"))
        return Response.json({
          data: [{ id: "session_a", user_id: "user_a", status: "active" }],
        });
      if (u.pathname.endsWith("/users/user_a"))
        return Response.json({ id: "user_a", email: "person@example.invalid", email_verified: true });
      const body = JSON.parse(init.body);
      calls.push(body);
      if (body.grant_type === "authorization_code")
        return Response.json(
          {
            code: "email_verification_required",
            message: "Email ownership must be verified before authentication.",
            pending_authentication_token: pending,
            email: "person@example.invalid",
            email_verification_id: "email_verification_fixture",
          },
          { status: 403 },
        );
      if (body.code !== "123456")
        return Response.json({ error: "invalid_grant", error_description: "bad" }, { status: 400 });
      return Response.json({ access_token: access, refresh_token: "refresh1", user: { id: "user_a" } });
    }) as typeof fetch,
  };
  const f = await flow();
  const handoff = (await authRoute(c, callback(f), io))!;
  assert.equal(handoff.status, 303);
  assert.equal(handoff.headers.get("location"), "/auth/verify");
  const verifyCookie = handoff.headers
    .getSetCookie()
    .find((v) => v.startsWith("__Host-forge-verify="))!
    .split(";")[0];
  assert.ok(!verifyCookie.includes(pending));
  const page = (await authRoute(
    c,
    new Request(c.ORIGIN + "/auth/verify", { headers: { cookie: verifyCookie } }),
    io,
  ))!;
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes("pe…@example.invalid") && !html.includes(pending));
  const post = (code: string, origin = c.ORIGIN) =>
    authRoute(
      c,
      new Request(c.ORIGIN + "/auth/verify", {
        method: "POST",
        headers: { cookie: verifyCookie, origin, "content-type": "application/x-www-form-urlencoded" },
        body: "code=" + code,
      }),
      io,
    );
  assert.equal((await post("123456", "https://evil.invalid"))!.status, 403);
  assert.equal((await post("12ab"))!.status, 400);
  assert.equal((await post("000000"))!.status, 400);
  const done = (await post("123456"))!;
  assert.equal(done.status, 303);
  assert.equal(done.headers.get("location"), "/");
  assert.ok(done.headers.getSetCookie().some((v) => v.startsWith("__Host-forge=") && !v.includes("Max-Age=0")));
  const last = calls.at(-1);
  assert.equal(last.grant_type, "urn:workos:oauth:grant-type:email-verification:code");
  assert.equal(last.pending_authentication_token, pending);
});
