import {
  createRemoteJWKSet,
  jwtVerify,
  EncryptJWT,
  jwtDecrypt,
  base64url,
} from "jose";
import type { Principal } from "./contracts.ts";
import { check, ID, Fault, digest } from "./storage.ts";
export interface AuthConfig {
  WORKOS_CLIENT_ID: string;
  WORKOS_ISSUER?: string;
  WORKOS_API_KEY?: string;
  SESSION_SECRET?: string;
  ORIGIN: string;
}
const cookie = (r: Request, n: string) =>
  r.headers
    .get("cookie")
    ?.split(";")
    .map((x) => x.trim())
    .find((x) => x.startsWith(n + "="))
    ?.slice(n.length + 1);
export const jwksURL = (id: string) =>
  new URL(`https://api.workos.com/sso/jwks/${id}`);
const sets = new Map<string, ReturnType<typeof createRemoteJWKSet>>();
export function authReady(c: AuthConfig) {
  return (
    /^client_[A-Za-z0-9]+$/.test(c.WORKOS_CLIENT_ID) &&
    !!c.WORKOS_ISSUER &&
    !!c.WORKOS_API_KEY &&
    !!c.SESSION_SECRET &&
    c.SESSION_SECRET.length >= 32 &&
    c.ORIGIN.startsWith("https://")
  );
}
function sessionKey(c: AuthConfig) {
  check(
    c.SESSION_SECRET && c.SESSION_SECRET.length >= 32,
    503,
    "AuthKit not configured",
  );
  return base64url.decode(
    base64url.encode(
      new Uint8Array(
        Buffer.from(digest(new TextEncoder().encode(c.SESSION_SECRET)), "hex"),
      ),
    ),
  );
}
export async function verifyAccess(
  c: AuthConfig,
  token: string,
  keySet?: Parameters<typeof jwtVerify>[1],
): Promise<Principal> {
  check(
    /^client_[A-Za-z0-9]+$/.test(c.WORKOS_CLIENT_ID) && c.WORKOS_ISSUER,
    503,
    "AuthKit not configured",
  );
  let keys = sets.get(c.WORKOS_CLIENT_ID);
  if (!keys) {
    keys = createRemoteJWKSet(jwksURL(c.WORKOS_CLIENT_ID), {
      timeoutDuration: 5000,
    });
    sets.set(c.WORKOS_CLIENT_ID, keys);
  }
  const { payload } = await jwtVerify(token, keySet ?? keys, {
    issuer: c.WORKOS_ISSUER,
    algorithms: ["RS256"],
    requiredClaims: ["sub", "exp", "iat", "sid"],
    maxTokenAge: "1h",
  });
  // JWKS is pinned to the application; WorkOS access tokens do not consistently carry aud.
  if (payload.aud !== undefined)
    check(payload.aud === c.WORKOS_CLIENT_ID, 401, "Invalid audience");
  const tenant =
    typeof payload.org_id === "string" ? payload.org_id : payload.sub;
  check(
    payload.sub && tenant && ID.test(payload.sub) && ID.test(tenant),
    401,
    "Invalid identity",
  );
  return { id: payload.sub, tenant };
}
export async function authenticate(
  c: AuthConfig,
  r: Request,
): Promise<Principal | null> {
  try {
    const auth = r.headers.get("authorization");
    let access: string | undefined;
    if (auth?.startsWith("Bearer ")) access = auth.slice(7);
    else if (auth?.startsWith("Basic ")) {
      const value = atob(auth.slice(6));
      access = value.slice(value.indexOf(":") + 1);
    } else {
      const sealed = cookie(r, "__Host-forge");
      if (sealed) {
        const { payload } = await jwtDecrypt(sealed, sessionKey(c), {
          issuer: c.ORIGIN,
          audience: "forge-session",
        });
        access =
          typeof payload.access === "string" ? payload.access : undefined;
      }
    }
    return access ? await verifyAccess(c, access) : null;
  } catch {
    return null;
  }
}
function sealedCookie(name: string, value: string, maxAge: number) {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
export async function authRoute(
  c: AuthConfig,
  r: Request,
): Promise<Response | null> {
  const u = new URL(r.url);
  if (!u.pathname.startsWith("/auth/")) return null;
  try {
    check(r.method === "GET", 405, "Unsupported method");
    if (u.pathname === "/auth/logout")
      return new Response(null, {
        status: 303,
        headers: {
          location: "/",
          "set-cookie": sealedCookie("__Host-forge", "", 0),
        },
      });
    check(authReady(c), 503, "WorkOS environment unavailable");
    if (u.pathname === "/auth/login") {
      const state = crypto.randomUUID();
      const verifier = base64url.encode(
        crypto.getRandomValues(new Uint8Array(32)),
      );
      const challenge = base64url.encode(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(verifier),
          ),
        ),
      );
      const flow = await new EncryptJWT({ state, verifier })
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .setIssuer(c.ORIGIN)
        .setAudience("forge-oauth")
        .setIssuedAt()
        .setExpirationTime("10m")
        .encrypt(sessionKey(c));
      const authorize = new URL(
        "https://api.workos.com/user_management/authorize",
      );
      for (const [k, v] of Object.entries({
        client_id: c.WORKOS_CLIENT_ID,
        redirect_uri: c.ORIGIN + "/auth/callback",
        response_type: "code",
        provider: "authkit",
        state,
        code_challenge: challenge,
        code_challenge_method: "S256",
      }))
        authorize.searchParams.set(k, v);
      return new Response(null, {
        status: 302,
        headers: {
          location: authorize.href,
          "set-cookie": sealedCookie("__Host-forge-flow", flow, 600),
          "cache-control": "no-store",
        },
      });
    }
    check(u.pathname === "/auth/callback", 404, "Not found");
    const flow = cookie(r, "__Host-forge-flow");
    check(flow, 400, "Missing OAuth state");
    const { payload } = await jwtDecrypt(flow, sessionKey(c), {
      issuer: c.ORIGIN,
      audience: "forge-oauth",
    });
    check(
      payload.state === u.searchParams.get("state") &&
        u.searchParams.get("code"),
      400,
      "Invalid OAuth state",
    );
    const exchange = await fetch(
      "https://api.workos.com/user_management/authenticate",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          client_id: c.WORKOS_CLIENT_ID,
          client_secret: c.WORKOS_API_KEY,
          grant_type: "authorization_code",
          code: u.searchParams.get("code"),
          code_verifier: payload.verifier,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );
    check(exchange.ok, 502, `WorkOS exchange failed (${exchange.status})`);
    const tokens: any = await exchange.json();
    check(typeof tokens.access_token === "string", 502, "Missing access token");
    await verifyAccess(c, tokens.access_token);
    // No refresh credential persisted yet: session expires within 15 min or access-token expiry.
    const sealed = await new EncryptJWT({ access: tokens.access_token })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuer(c.ORIGIN)
      .setAudience("forge-session")
      .setIssuedAt()
      .setExpirationTime("15m")
      .encrypt(sessionKey(c));
    const headers = new Headers({ location: "/", "cache-control": "no-store" });
    headers.append("set-cookie", sealedCookie("__Host-forge", sealed, 900));
    headers.append("set-cookie", sealedCookie("__Host-forge-flow", "", 0));
    return new Response(null, { status: 303, headers });
  } catch (e) {
    return Response.json(
      { message: e instanceof Fault ? e.message : "Authentication failed" },
      {
        status: e instanceof Fault ? e.status : 401,
        headers: { "cache-control": "no-store" },
      },
    );
  }
}
