import test from "node:test";
import assert from "node:assert/strict";
import { generateKeyPair, SignJWT } from "jose";
import { verifyAccess, authRoute } from "../src/auth.ts";
import { directUpload } from "../src/cloudflare.ts";
const config = {
  WORKOS_CLIENT_ID: "client_test",
  WORKOS_ISSUER: "https://api.workos.com/user_management/client_test",
  ORIGIN: "https://forge.invalid",
};
test("WorkOS verifier enforces signature/algorithm, expiry, issuer, audience, session claims and tenant", async () => {
  const { publicKey, privateKey } = await generateKeyPair("RS256");
  const make = (
    claims: any = {},
    issuer = config.WORKOS_ISSUER,
    expiry = "1h",
  ) =>
    new SignJWT({ sub: "user_a", sid: "session_a", org_id: "org_a", ...claims })
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setIssuer(issuer)
      .setExpirationTime(expiry)
      .sign(privateKey);
  assert.deepEqual(await verifyAccess(config, await make(), publicKey), {
    id: "user_a",
    tenant: "org_a",
  });
  for (const token of [
    await make({}, "https://evil.invalid"),
    await make({}, config.WORKOS_ISSUER, "-1s"),
    await make({ aud: "wrong" }),
    await make({ org_id: "../other" }),
    await make({ sid: undefined }),
  ])
    await assert.rejects(verifyAccess(config, token, publicKey));
  const wrong = await generateKeyPair("RS256");
  await assert.rejects(verifyAccess(config, await make(), wrong.publicKey));
});
test("WorkOS callback without state fails locally without exchanging a fake code", async () => {
  const r = await authRoute(
    {
      ...config,
      SESSION_SECRET: "s".repeat(32),
      WORKOS_API_KEY: "unused-test-only",
    },
    new Request(config.ORIGIN + "/auth/callback?code=fake&state=fake"),
  );
  assert.equal(r!.status, 400);
});
test("presigned PUT is bounded in time, method, exact key and signed content length; never GET", async () => {
  const sign = directUpload({
    R2_ACCESS_KEY_ID: "test-only-id",
    R2_SECRET_ACCESS_KEY: "test-only-secret",
    R2_ACCOUNT_ID: "a".repeat(32),
    R2_BUCKET_NAME: "cf-native-forge-test",
  });
  const r = await sign({
    id: "t",
    tenant: "a",
    repo: "r",
    oid: "a".repeat(64),
    size: 101,
    key: "v1/tenants/a/staging/r/t",
    expires: Date.now() + 600000,
  });
  const url = new URL(r.href);
  assert.equal(url.searchParams.get("X-Amz-Expires"), "600");
  assert.ok(
    url.searchParams.get("X-Amz-SignedHeaders")?.includes("content-length"),
  );
  assert.equal(r.header["Content-Length"], "101");
  assert.equal(url.pathname, "/cf-native-forge-test/v1/tenants/a/staging/r/t");
});

test("provider-backed session lifecycle checks current session and org membership, rotates refresh, rejects CSRF and clears revoked sessions", async () => {
  const { SignJWT, jwtDecrypt } = await import("jose");
  const { livePrincipal, sessionCookie, readSession, authenticate } =
    await import("../src/auth.ts");
  const c = {
    ...config,
    WORKOS_API_KEY: "test-only",
    SESSION_SECRET: "x".repeat(32),
  };
  let active = true,
    member = true,
    revoked = false,
    refreshes = 0;
  const token = () =>
    new SignJWT({ sub: "user_a", org_id: "org_a", sid: "session_a" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode("test-only-key-that-is-long-enough"));
  const io = {
    verify: async () => ({ id: "user_a", tenant: "org_a" }),
    revoked: async () => revoked,
    revoke: async () => {
      revoked = true;
    },
    request: (async (url: any, init: any) => {
      const u = new URL(url);
      let result: any;
      if (u.pathname.endsWith("/sessions"))
        result = {
          data: [
            {
              id: "session_a",
              user_id: "user_a",
              organization_id: "org_a",
              status: active ? "active" : "revoked",
            },
          ],
        };
      else if (u.pathname.endsWith("organization_memberships"))
        result = {
          data: [
            {
              user_id: "user_a",
              organization_id: "org_a",
              status: member ? "active" : "inactive",
            },
          ],
        };
      else if (u.pathname.endsWith("/users/user_a"))
        result = {
          id: "user_a",
          email: "user@example.invalid",
          email_verified: true,
        };
      else if (u.pathname.endsWith("/authenticate")) {
        const body = JSON.parse(init.body);
        assert.equal(body.grant_type, "refresh_token");
        assert.equal(body.refresh_token, "refresh1");
        refreshes++;
        result = { access_token: await token(), refresh_token: "refresh2" };
      } else if (u.pathname.endsWith("/revoke")) {
        active = false;
        result = {};
      } else throw Error("Unexpected test provider call");
      return Response.json(result);
    }) as typeof fetch,
  };
  const access = await token();
  assert.equal((await livePrincipal(c, access, io)).emailVerified, true);
  member = false;
  await assert.rejects(livePrincipal(c, access, io));
  member = true;
  active = false;
  await assert.rejects(livePrincipal(c, access, io));
  active = true;
  const sealed = await sessionCookie(
    c,
    { access_token: access, refresh_token: "refresh1" },
    io,
  );
  const cookie = sealed.split(";")[0];
  const r = (path: string, origin = c.ORIGIN) =>
    new Request(c.ORIGIN + path, {
      method: "POST",
      headers: { cookie, origin },
    });
  assert.equal(
    (await authRoute(c, r("/auth/refresh", "https://evil.invalid"), io))!
      .status,
    403,
  );
  const refreshed = (await authRoute(c, r("/auth/refresh"), io))!;
  assert.equal(refreshed.status, 200);
  assert.equal(refreshes, 1);
  const next = await readSession(
    c,
    new Request(c.ORIGIN, {
      headers: { cookie: refreshed.headers.get("set-cookie")!.split(";")[0] },
    }),
  );
  assert.equal(next.refresh, "refresh2");
  assert.equal(
    (await authRoute(
      c,
      new Request(c.ORIGIN + "/auth/logout", { headers: { cookie } }),
      io,
    ))!.status,
    405,
  );
  const logout = (await authRoute(c, r("/auth/logout"), io))!;
  assert.equal(logout.status, 303);
  assert.ok(
    logout.headers
      .get("location")!
      .startsWith("https://api.workos.com/user_management/sessions/logout"),
  );
  assert.ok(logout.headers.get("set-cookie")!.includes("Max-Age=0"));
  assert.equal(
    await authenticate(
      c,
      new Request(c.ORIGIN, { headers: { authorization: "Bearer " + access } }),
      io,
    ),
    null,
  );
  assert.equal((await authRoute(c, r("/auth/refresh"), io))!.status, 401);
  revoked = false;
  const failedLogout = (await authRoute(c, r("/auth/logout"), {
    ...io,
    request: (async () =>
      new Response("unavailable", { status: 503 })) as typeof fetch,
  }))!;
  assert.equal(failedLogout.status, 503);
  assert.equal(revoked, true);
  assert.ok(failedLogout.headers.get("set-cookie")!.includes("Max-Age=0"));
});
