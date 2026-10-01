import type {
  Artifacts,
  D1Database,
  R2Bucket,
  Fetcher,
} from "@cloudflare/workers-types";
import { application } from "./app.ts";
import { SQLCatalog } from "./catalog.ts";
import {
  NativeGit,
  R2Store,
  directUpload,
  type SigningConfig,
} from "./cloudflare.ts";
import { authenticate, authRoute, workos, type AuthConfig } from "./auth.ts";
export interface Env extends AuthConfig, SigningConfig {
  DB: D1Database;
  BUCKET: R2Bucket;
  ARTIFACTS: Artifacts;
  ASSETS: Fetcher;
  ALLOW_PUBLIC: string;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Production entry point has no local/dev authentication branch, even if someone sets a dev variable.
    const catalog = new SQLCatalog(env.DB as any);
    const authIO = {
      revoked: async (sid: string) =>
        !!(await env.DB.prepare("SELECT id FROM revoked_sessions WHERE id=?")
          .bind(sid)
          .first()),
      revoke: async (sid: string) => {
        await env.DB.prepare(
          "INSERT OR IGNORE INTO revoked_sessions VALUES (?,?)",
        )
          .bind(sid, Date.now())
          .run();
      },
      logoutTokens: async (user: string) => {
        const tokens = await env.DB.prepare(
          "SELECT t.id,r.physical FROM native_tokens t JOIN repos r ON r.id=t.repo WHERE t.user=?",
        )
          .bind(user)
          .all<{ id: string; physical: string }>();
        const git = new NativeGit(env.ARTIFACTS);
        for (const t of tokens.results) {
          await git.revoke(t.physical, t.id);
          await catalog.removeToken(t.id);
        }
      },
    };
    const auth = await authRoute(env, request, authIO);
    if (auth) return auth;
    const path = new URL(request.url).pathname;
    if (!path.startsWith("/api/") && !path.startsWith("/lfs/")) {
      const principal = await authenticate(env, request, authIO);
      if (!principal)
        return new Response(
          path === "/"
            ? '<!doctype html><html lang="en"><meta charset="utf-8"><title>CF Native Forge</title><h1>CF Native Forge</h1><p>Authentication required</p><a href="/auth/login">Sign in with WorkOS</a></html>'
            : "Authentication required",
          {
            status: 401,
            headers: {
              "cache-control": "no-store",
              "content-type":
                path === "/"
                  ? "text/html; charset=utf-8"
                  : "text/plain; charset=utf-8",
              "content-security-policy":
                "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
              "x-content-type-options": "nosniff",
            },
          },
        );
      const response = (await env.ASSETS.fetch(
        request as any,
      )) as unknown as Response;
      response.headers.set(
        "content-security-policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      );
      return response;
    }
    return application({
      catalog,
      store: new R2Store(env.BUCKET),
      git: new NativeGit(env.ARTIFACTS),
      authenticate: (r) => authenticate(env, r, authIO),
      origin: env.ORIGIN,
      allowPublic: env.ALLOW_PUBLIC === "true",
      member: async (organization, user) => {
        const memberships = await workos(
          env,
          `/user_management/organization_memberships?organization_id=${organization}&user_id=${user}&limit=100`,
        );
        return (
          memberships.data?.some(
            (m: any) =>
              m.organization_id === organization &&
              m.user_id === user &&
              m.status === "active",
          ) === true
        );
      },
      presign: directUpload(env),
    })(request);
  },
};
