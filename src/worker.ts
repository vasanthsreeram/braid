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
import {
  cookie,
  authenticate,
  authReady,
  authRoute,
  workos,
  type AuthConfig,
} from "./auth.ts";
import { GitHubAccounts, type GitHubConfig } from "./github.ts";
export interface Env extends GitHubConfig, SigningConfig {
  DB: D1Database;
  BUCKET: R2Bucket;
  ARTIFACTS: Artifacts;
  ASSETS: Fetcher;
  ALLOW_PUBLIC: string;
}
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (
      url.hostname ===
        "cf-native-forge-evaluation.s-vasanthrojin.workers.dev" ||
      (url.hostname === new URL(env.ORIGIN).hostname &&
        url.protocol !== "https:")
    ) {
      return new Response(null, {
        status: ["GET", "HEAD"].includes(request.method) ? 308 : 421,
        headers: {
          location: env.ORIGIN + url.pathname + url.search,
          "cache-control": "no-store, no-transform",
        },
      });
    }
    // Production entry point has no local/dev authentication branch, even if someone sets a dev variable.
    const catalog = new SQLCatalog(env.DB as any);
    const github = new GitHubAccounts(env, env.DB as any);
    const authIO = {
      connectGitHub: (p: import("./contracts.ts").Principal, tokens: any) =>
        github.connect(p, tokens),
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
            ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gitflare · Sign in</title><style>body{margin:0;background:#0c1014;color:#e5e7eb;font:16px/1.6 system-ui}main{max-width:540px;margin:12vh auto;padding:32px 24px}h1{font-size:42px}button{min-height:44px;font:inherit;padding:8px 18px;margin-bottom:16px}a{display:inline-flex;align-items:center;min-height:44px;padding:8px 18px;background:#98cbbb;color:#0c1914;border-radius:6px;text-decoration:none}p{color:#a6b0ba}</style></head><body><main><p>PRIVATE REPOSITORIES · SHARED WORK</p><h1>Gitflare</h1><p>Authentication required</p><p>Sign in to browse your repositories and contribution history.</p>${authReady(env) ? "" : "<p>Sign-in is temporarily unavailable while setup is completed.</p>"}${authReady(env) && cookie(request, "__Host-forge") ? '<form method="post" action="/auth/refresh"><button>Resume session</button></form>' : ""}<a href="/auth/login${url.searchParams.get("invite") && /^[A-Za-z0-9_-]+$/.test(url.searchParams.get("invite")!) ? "?invite=" + encodeURIComponent(url.searchParams.get("invite")!) : ""}">Sign in with GitHub</a></main></body></html>`
            : "Authentication required",
          {
            status: 401,
            headers: {
              "cache-control": "no-store, no-transform",
              "content-type":
                path === "/"
                  ? "text/html; charset=utf-8"
                  : "text/plain; charset=utf-8",
              "content-security-policy":
                "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'",
              "x-content-type-options": "nosniff",
            },
          },
        );
      const response = (await env.ASSETS.fetch(
        request as any,
      )) as unknown as Response;
      response.headers.set("cache-control", "no-store, no-transform");
      response.headers.set(
        "content-security-policy",
        "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'",
      );
      return response;
    }
    return application({
      catalog,
      github,
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
