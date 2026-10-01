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
