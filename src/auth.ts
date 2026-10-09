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
  // OIDC discovery is not the issuer of /user_management/authenticate session tokens.
  WORKOS_ACCESS_TOKEN_ISSUER?: string;
  WORKOS_API_KEY?: string;
  SESSION_SECRET?: string;
  ORIGIN: string;
}
export interface AuthIO {
  request?: typeof fetch;
  verify?: (token: string) => Promise<Principal>;
  revoked?: (sid: string) => Promise<boolean>;
  revoke?: (sid: string) => Promise<void>;
  connectGitHub?: (p: Principal, tokens: any) => Promise<void>;
  phase?: (phase: string) => void;
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
type ProviderCategory =
  | "invalid_client"
  | "invalid_grant"
  | "invalid_request"
  | "rate_limit"
  | "upstream"
  | "network"
  | "unexpected_response";
class WorkOSFailure extends Fault {
  readonly correlation = crypto.randomUUID();
  constructor(
    readonly category: ProviderCategory,
    readonly providerStatus: number | null,
    readonly reason: "pkce_rejected" | "generic" = "generic",
    readonly providerCode: string | null = null,
    readonly pending: { token: string; email: string } | null = null,
  ) {
    super(
      category === "invalid_client" ||
        category === "invalid_grant" ||
        category === "invalid_request"
        ? 401
        : 503,
      "Authentication failed",
    );
  }
}
// Bound untrusted error bodies. Never retain their contents in an exception/log.
async function providerErrorBody(r: Response): Promise<unknown> {
  if (!r.body) return null;
  const reader = r.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) return null;
      parts.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const part of parts) {
      bytes.set(part, offset);
      offset += part.byteLength;
    }
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  } finally {
    await reader.cancel().catch(() => {});
  }
}
const PENDING_CODES = new Set([
  "email_verification_required",
  "organization_selection_required",
  "mfa_enrollment",
  "mfa_challenge",
  "sso_required",
  "organization_authentication_methods_required",
]);
function providerFailure(status: number, body: unknown) {
  let category: ProviderCategory = "unexpected_response";
  let reason: "pkce_rejected" | "generic" = "generic";
  let code: string | null = null;
  let pending: { token: string; email: string } | null = null;
  if (status === 429) category = "rate_limit";
  else if (status >= 500) category = "upstream";
  else if (status === 400 || status === 401 || status === 403) {
    if (body && typeof body === "object" && !Array.isArray(body)) {
      const b = body as Record<string, unknown>;
      if (
        b.error === "invalid_client" ||
        b.error === "invalid_grant" ||
        b.error === "invalid_request"
      )
        category = b.error;
      // Exact provider wording observed in the intentionally invalid-code probe.
      // This classifies that response; it does not establish a real login cause.
      if (
        category === "invalid_grant" &&
        b.error_description === "Invalid code verifier."
      )
        reason = "pkce_rejected";
      // Fixed WorkOS pending-authentication codes only; never echo free text.
      if (typeof b.code === "string" && PENDING_CODES.has(b.code))
        code = b.code;
      if (
        code === "email_verification_required" &&
        typeof b.pending_authentication_token === "string" &&
        /^[A-Za-z0-9_-]{8,512}$/.test(b.pending_authentication_token) &&
        typeof b.email === "string" &&
        b.email.length <= 320
      )
        pending = { token: b.pending_authentication_token, email: b.email };
    }
  }
  return new WorkOSFailure(category, status, reason, code, pending);
}
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
    // Live AuthKit tokens carry the client-specific issuer; the documented
    // session-token issuer is also accepted. Both are pinned configuration.
    issuer: [
      c.WORKOS_ACCESS_TOKEN_ISSUER ?? "https://api.workos.com",
      c.WORKOS_ISSUER,
    ],
    algorithms: ["RS256"],
    requiredClaims: ["sub", "exp", "iat", "sid", "client_id"],
    maxTokenAge: "1h",
  });
  check(payload.client_id === c.WORKOS_CLIENT_ID, 401, "Invalid client");
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
  let r: Response;
  try {
    r = await (io.request ?? fetch)("https://api.workos.com" + path, {
      method: body ? "POST" : "GET",
      // workerd rejects redirect:"error" before any provider request. Manual
      // plus rejecting non-2xx responses also prevents credential forwarding.
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: {
        authorization: "Bearer " + c.WORKOS_API_KEY,
        "content-type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new WorkOSFailure("network", null);
  }
  if (!r.ok) throw providerFailure(r.status, await providerErrorBody(r));
  let data: any;
  try {
    data = r.status === 204 ? {} : await r.json();
  } catch {
    throw new WorkOSFailure("unexpected_response", r.status);
  }
  if (
    !data ||
    typeof data !== "object" ||
    (path === "/user_management/authenticate" &&
      (Array.isArray(data) ||
        typeof data.access_token !== "string" ||
        !data.access_token ||
        typeof data.refresh_token !== "string" ||
        !data.refresh_token))
  )
    throw new WorkOSFailure("unexpected_response", r.status);
  return data;
}
// Check actual session and active organization membership on EVERY authenticated request.
// No stale JWT-only authorization, no implicit WorkOS role -> repository grant.
export async function livePrincipal(
  c: AuthConfig,
  token: string,
  io: AuthIO = {},
) {
  io.phase?.("token_verification");
  const p = await (io.verify ? io.verify(token) : verifyAccess(c, token));
  const sid = decodeJwt(token).sid;
  check(typeof sid === "string" && ID.test(sid), 401, "Invalid session");
  check(!(await io.revoked?.(sid)), 401, "Session revoked");
  io.phase?.("session_lookup");
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
    io.phase?.("membership_lookup");
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
  io.phase?.("user_lookup");
  const user = await workos(c, `/user_management/users/${p.id}`, undefined, io);
  check(user.id === p.id, 401, "User unavailable");
  return {
    ...p,
    session: sid,
    email: typeof user.email === "string" ? user.email : undefined,
    emailVerified: user.email_verified === true,
    name:
      [user.first_name, user.last_name]
        .filter((v) => typeof v === "string")
        .join(" ") || p.id,
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
  // WorkOS spells this provider both "GitHubOAuth" and "GithubOAuth" across APIs.
  if (
    String(tokens.oauth_tokens?.provider).toLowerCase() === "githuboauth" &&
    io.connectGitHub
  ) {
    io.phase?.("github_connection");
    check(tokens.user?.id === p.id, 401, "Provider identity mismatch");
    // Repository listing is optional; a rejected provider token must not block sign-in.
    // The user can still connect explicitly through /auth/github.
    try {
      await io.connectGitHub(p, tokens.oauth_tokens);
    } catch {}
  }
  io.phase?.("session_sealing");
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
  let phase = "configuration";
  io = {
    ...io,
    phase: (next) => {
      phase = next;
    },
  };
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
    if (u.pathname === "/auth/verify") return await verifyEmail(c, r, io);
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
        provider: "GitHubOAuth",
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
    phase = "oauth_state";
    const flow = cookie(r, "__Host-forge-flow");
    check(flow, 400, "Missing OAuth state");
    const { payload } = await jwtDecrypt(flow, sessionKey(c), {
      issuer: c.ORIGIN,
      audience: "forge-oauth",
    });
    check(
      payload.state === u.searchParams.get("state") &&
        u.searchParams.get("code") &&
        typeof payload.verifier === "string" &&
        /^[A-Za-z0-9_-]{43}$/.test(payload.verifier),
      400,
      "Invalid OAuth state",
    );
    phase = "code_exchange";
    let tokens: any;
    try {
      tokens = await workos(
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
    } catch (e) {
      // GitHub identity matched an existing account whose email WorkOS has not verified.
      // WorkOS emails a one-time code; the pending token stays sealed server-side.
      if (!(e instanceof WorkOSFailure && e.pending)) throw e;
      const pending = await new EncryptJWT({
        pending: e.pending.token,
        email: e.pending.email,
        returnTo: payload.returnTo,
      })
        .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
        .setIssuer(c.ORIGIN)
        .setAudience("forge-verify")
        .setIssuedAt()
        .setExpirationTime("10m")
        .encrypt(sessionKey(c));
      const headers = new Headers({
        location: "/auth/verify",
        "cache-control": "no-store",
      });
      headers.append("set-cookie", sealedCookie("__Host-forge-verify", pending, 600));
      headers.append("set-cookie", sealedCookie("__Host-forge-flow", "", 0));
      return new Response(null, { status: 303, headers });
    }
    phase = "login_policy";
    check(
      tokens.authentication_method === "GitHubOAuth",
      401,
      "Sign in with GitHub required",
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
    // One attempt only: discard flow on failure and require a fresh login.
    // Diagnostics are returned only to this state-validated exchange request.
    if (u.pathname === "/auth/callback") {
      headers.set("set-cookie", sealedCookie("__Host-forge-flow", "", 0));
      headers.set("referrer-policy", "no-referrer");
    }
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
      {
        message: e instanceof Fault ? e.message : "Authentication failed",
        ...(u.pathname === "/auth/callback" ? { phase } : {}),
        ...(u.pathname === "/auth/callback" &&
        phase === "code_exchange" &&
        e instanceof WorkOSFailure
          ? {
              category: e.category,
              reason: e.reason,
              provider_status: e.providerStatus,
              provider_code: e.providerCode,
              correlation: e.correlation,
            }
          : {}),
        ...(u.pathname === "/auth/callback"
          ? {
              retry: "/auth/login",
              advice:
                "Start a fresh sign-in; do not reload or reuse the callback URL.",
            }
          : {}),
      },
      { status: e instanceof Fault ? e.status : 401, headers },
    );
  }
}

const verifyCSP =
  "default-src 'none'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return (name.length <= 2 ? name[0] + "…" : name.slice(0, 2) + "…") + "@" + (domain ?? "");
}
const escapeHTML = (v: string) =>
  v.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
function verifyPage(email: string, error = "", status = 200) {
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Verify your email · Braid</title><link rel="stylesheet" href="/public/welcome.css"></head><body class="verify"><main class="verify-card"><h1>Check your email</h1><p>GitHub sign-in matched an existing account. WorkOS sent a six-digit code to <strong>${escapeHTML(maskEmail(email))}</strong>. Enter it to link GitHub and finish signing in.</p>${error ? `<p role="alert" class="verify-error">${escapeHTML(error)}</p>` : ""}<form method="post" action="/auth/verify"><label for="code">Verification code</label><input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required autofocus><button type="submit">Verify and continue</button></form><p><a href="/auth/login">Start over</a></p></main></body></html>`,
    {
      status,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "content-security-policy": verifyCSP,
        "x-content-type-options": "nosniff",
        // no-referrer would make browsers send Origin: null on the form POST.
        "referrer-policy": "same-origin",
      },
    },
  );
}
async function verifyEmail(c: AuthConfig, r: Request, io: AuthIO) {
  const sealed = cookie(r, "__Host-forge-verify");
  if (!sealed)
    return new Response(null, {
      status: 303,
      headers: { location: "/auth/login", "cache-control": "no-store" },
    });
  let payload: any;
  try {
    ({ payload } = await jwtDecrypt(sealed, sessionKey(c), {
      issuer: c.ORIGIN,
      audience: "forge-verify",
    }));
  } catch {
    return new Response(null, {
      status: 303,
      headers: {
        location: "/auth/login",
        "set-cookie": sealedCookie("__Host-forge-verify", "", 0),
        "cache-control": "no-store",
      },
    });
  }
  check(typeof payload.pending === "string" && typeof payload.email === "string", 400, "Invalid verification state");
  if (r.method === "GET") return verifyPage(payload.email);
  check(r.method === "POST", 405, "Unsupported method");
  check(r.headers.get("origin") === c.ORIGIN, 403, "Origin required");
  const form = await r.formData();
  const code = String(form.get("code") ?? "").trim();
  if (!/^[0-9]{6}$/.test(code))
    return verifyPage(payload.email, "Enter the six-digit code from the email.", 400);
  let tokens: any;
  try {
    tokens = await workos(
      c,
      "/user_management/authenticate",
      {
        client_id: c.WORKOS_CLIENT_ID,
        client_secret: c.WORKOS_API_KEY,
        grant_type: "urn:workos:oauth:grant-type:email-verification:code",
        code,
        pending_authentication_token: payload.pending,
      },
      io,
    );
  } catch (e) {
    if (e instanceof WorkOSFailure && e.status === 401)
      return verifyPage(payload.email, "That code was not accepted. Check the latest email and try again, or start over.", 400);
    throw e;
  }
  const returnTo =
    typeof payload.returnTo === "string" &&
    /^\/\?invite=[A-Za-z0-9_-]+$/.test(payload.returnTo)
      ? payload.returnTo
      : "/";
  const headers = new Headers({ location: returnTo, "cache-control": "no-store" });
  headers.append("set-cookie", await sessionCookie(c, tokens, io));
  headers.append("set-cookie", sealedCookie("__Host-forge-verify", "", 0));
  return new Response(null, { status: 303, headers });
}
