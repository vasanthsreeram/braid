import {
  createRemoteJWKSet,
  jwtVerify,
  EncryptJWT,
  jwtDecrypt,
  base64url,
  decodeJwt,
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
export interface AuthIO {
  request?: typeof fetch;
  verify?: (token: string) => Promise<Principal>;
  revoked?: (sid: string) => Promise<boolean>;
  revoke?: (sid: string) => Promise<void>;
  logoutTokens?: (user: string) => Promise<void>;
}
export const cookie = (r: Request, n: string) =>
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
    /^https:\/\/[^/]+$/.test(c.ORIGIN)
  );
}
function sessionKey(c: AuthConfig) {
  check(
    c.SESSION_SECRET && c.SESSION_SECRET.length >= 32,
    503,
    "AuthKit not configured",
  );
  return new Uint8Array(
    Buffer.from(digest(new TextEncoder().encode(c.SESSION_SECRET)), "hex"),
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
  if (payload.aud !== undefined)
    check(payload.aud === c.WORKOS_CLIENT_ID, 401, "Invalid audience");
  const tenant =
    typeof payload.org_id === "string" ? payload.org_id : payload.sub;
  check(
    payload.sub &&
      tenant &&
      ID.test(payload.sub) &&
      ID.test(tenant) &&
      typeof payload.sid === "string" &&
      ID.test(payload.sid),
    401,
    "Invalid identity",
  );
  return { id: payload.sub, tenant };
}
export async function workos(
  c: AuthConfig,
  path: string,
  body?: unknown,
  io: AuthIO = {},
) {
  check(c.WORKOS_API_KEY, 503, "WorkOS environment unavailable");
  const r = await (io.request ?? fetch)("https://api.workos.com" + path, {
    method: body ? "POST" : "GET",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      authorization: "Bearer " + c.WORKOS_API_KEY,
      "content-type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  check(
    r.ok,
    r.status === 400 || r.status === 401 || r.status === 404 ? 401 : 503,
    "WorkOS request failed",
  );
  return r.status === 204 ? {} : ((await r.json()) as any);
}
// Check actual session and active organization membership on EVERY authenticated request.
// No stale JWT-only authorization, no implicit WorkOS role -> repository grant.
export async function livePrincipal(
  c: AuthConfig,
  token: string,
  io: AuthIO = {},
) {
  const p = await (io.verify ? io.verify(token) : verifyAccess(c, token));
  const sid = decodeJwt(token).sid;
  check(typeof sid === "string" && ID.test(sid), 401, "Invalid session");
  check(!(await io.revoked?.(sid)), 401, "Session revoked");
  const sessions = await workos(
    c,
    `/user_management/users/${p.id}/sessions?limit=100`,
    undefined,
    io,
  );
  check(
    sessions.data?.some(
      (s: any) =>
        s.id === sid &&
        s.status === "active" &&
        s.user_id === p.id &&
        (!s.expires_at || Date.parse(s.expires_at) > Date.now()) &&
        (s.organization_id ?? p.id) === p.tenant,
    ),
    401,
    "Session inactive",
  );
  if (p.tenant !== p.id) {
    const memberships = await workos(
      c,
      `/user_management/organization_memberships?user_id=${p.id}&organization_id=${p.tenant}&limit=100`,
      undefined,
      io,
    );
    check(
      memberships.data?.some(
        (m: any) =>
          m.user_id === p.id &&
          m.organization_id === p.tenant &&
          m.status === "active",
      ),
      401,
      "Organization membership inactive",
    );
  }
  const user = await workos(c, `/user_management/users/${p.id}`, undefined, io);
  check(user.id === p.id, 401, "User unavailable");
  return {
    ...p,
    session: sid,
    email: typeof user.email === "string" ? user.email : undefined,
    emailVerified: user.email_verified === true,
  };
}
export async function readSession(c: AuthConfig, r: Request) {
  const sealed = cookie(r, "__Host-forge");
  check(sealed, 401, "Session missing");
  const { payload } = await jwtDecrypt(sealed, sessionKey(c), {
    issuer: c.ORIGIN,
    audience: "forge-session",
  });
  check(
    typeof payload.access === "string" &&
      typeof payload.refresh === "string" &&
      typeof payload.sid === "string",
    401,
    "Invalid session",
  );
  return { access: payload.access, refresh: payload.refresh, sid: payload.sid };
}
export async function authenticate(
  c: AuthConfig,
  r: Request,
  io: AuthIO = {},
): Promise<Principal | null> {
  try {
    if (!authReady(c)) return null;
    const auth = r.headers.get("authorization");
    let access: string;
    if (auth?.startsWith("Bearer ")) access = auth.slice(7);
    else if (auth?.startsWith("Basic ")) {
      const raw = atob(auth.slice(6));
      check(raw.includes(":"), 401, "Invalid credential");
      access = raw.slice(raw.indexOf(":") + 1);
    } else access = (await readSession(c, r)).access;
    return await livePrincipal(c, access, io);
  } catch {
    return null;
  }
}
export function sealedCookie(name: string, value: string, maxAge: number) {
  return `${name}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}
export async function sessionCookie(
  c: AuthConfig,
  tokens: any,
  io: AuthIO = {},
) {
  check(
    typeof tokens.access_token === "string" &&
      typeof tokens.refresh_token === "string",
    502,
    "Incomplete token exchange",
  );
  const p = await livePrincipal(c, tokens.access_token, io);
  const sealed = await new EncryptJWT({
    access: tokens.access_token,
    refresh: tokens.refresh_token,
    sid: p.session,
  })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer(c.ORIGIN)
    .setAudience("forge-session")
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(sessionKey(c));
  check(sealed.length < 3800, 502, "Session exceeds cookie limit");
  return sealedCookie("__Host-forge", sealed, 7 * 86400);
}
export async function authRoute(
  c: AuthConfig,
  r: Request,
  io: AuthIO = {},
): Promise<Response | null> {
  const u = new URL(r.url);
  if (!u.pathname.startsWith("/auth/")) return null;
  try {
    check(authReady(c), 503, "WorkOS environment unavailable");
    if (
      ["/auth/logout", "/auth/refresh", "/auth/organization"].includes(
        u.pathname,
      )
    ) {
      check(r.method === "POST", 405, "Use POST for session changes");
      check(r.headers.get("origin") === c.ORIGIN, 403, "Origin required");
      const s = await readSession(c, r);
      check(!(await io.revoked?.(s.sid)), 401, "Session revoked");
      if (u.pathname === "/auth/logout") {
        // Retain a local deny record before contacting the provider. Errors cannot reopen the session.
        await io.revoke?.(s.sid);
        const user = decodeJwt(s.access).sub;
        if (user) await io.logoutTokens?.(user);
        await workos(
          c,
          "/user_management/sessions/revoke",
          { session_id: s.sid },
          io,
        );
        const logout = new URL(
          "https://api.workos.com/user_management/sessions/logout",
        );
        logout.searchParams.set("session_id", s.sid);
        logout.searchParams.set("return_to", c.ORIGIN + "/auth/login");
        return new Response(null, {
          status: 303,
          headers: {
            location: logout.href,
            "set-cookie": sealedCookie("__Host-forge", "", 0),
            "cache-control": "no-store",
          },
        });
      }
      let organization: string | undefined;
      if (u.pathname === "/auth/organization") {
        const b: any = await r.json();
        check(
          typeof b.organization === "string" &&
            /^org_[A-Za-z0-9]+$/.test(b.organization),
          400,
          "Invalid organization",
        );
        organization = b.organization;
      }
      // WorkOS rotates the refresh credential and checks membership at the provider.
      const tokens = await workos(
        c,
        "/user_management/authenticate",
        {
          client_id: c.WORKOS_CLIENT_ID,
          client_secret: c.WORKOS_API_KEY,
          grant_type: "refresh_token",
          refresh_token: s.refresh,
          ...(organization ? { organization_id: organization } : {}),
        },
        io,
      );
      check(
        decodeJwt(tokens.access_token).sub === decodeJwt(s.access).sub,
        401,
        "Refresh identity changed",
      );
      const next = await sessionCookie(c, tokens, io);
      if (r.headers.get("accept")?.includes("text/html"))
        return new Response(null, {
          status: 303,
          headers: {
            location: "/",
            "set-cookie": next,
            "cache-control": "no-store",
          },
        });
      return Response.json(
        { ok: true },
        { headers: { "set-cookie": next, "cache-control": "no-store" } },
      );
    }
    check(r.method === "GET", 405, "Unsupported method");
    if (u.pathname === "/auth/login") {
      const state = crypto.randomUUID(),
        verifier = base64url.encode(crypto.getRandomValues(new Uint8Array(32)));
      const challenge = base64url.encode(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(verifier),
          ),
        ),
      );
      const invite = u.searchParams.get("invite");
      const returnTo =
        invite && ID.test(invite)
          ? "/?invite=" + encodeURIComponent(invite)
          : "/";
      const flow = await new EncryptJWT({ state, verifier, returnTo })
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
    const tokens = await workos(
      c,
      "/user_management/authenticate",
      {
        client_id: c.WORKOS_CLIENT_ID,
        client_secret: c.WORKOS_API_KEY,
        grant_type: "authorization_code",
        code: u.searchParams.get("code"),
        code_verifier: payload.verifier,
      },
      io,
    );
    const returnTo =
      typeof payload.returnTo === "string" &&
      /^\/\?invite=[A-Za-z0-9_-]+$/.test(payload.returnTo)
        ? payload.returnTo
        : "/";
    const headers = new Headers({
      location: returnTo,
      "cache-control": "no-store",
    });
    headers.append("set-cookie", await sessionCookie(c, tokens, io));
    headers.append("set-cookie", sealedCookie("__Host-forge-flow", "", 0));
    return new Response(null, { status: 303, headers });
  } catch (e) {
    const headers = new Headers({ "cache-control": "no-store" });
    if (
      ["/auth/logout", "/auth/refresh", "/auth/organization"].includes(
        u.pathname,
      ) &&
      (!(e instanceof Fault) ||
        e.status === 401 ||
        (u.pathname === "/auth/logout" && e.status >= 500))
    )
      headers.set("set-cookie", sealedCookie("__Host-forge", "", 0));
    return Response.json(
      { message: e instanceof Fault ? e.message : "Authentication failed" },
      { status: e instanceof Fault ? e.status : 401, headers },
    );
  }
}
