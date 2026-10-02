import type {
  Artifacts,
  D1Database,
  R2Bucket,
  Fetcher,
  Ai,
  DurableObjectNamespace,
} from "@cloudflare/workers-types";
import { pushBundle } from "./bundle.ts";
import { reviewClient } from "./review-coordinator.ts";
export { ReviewCoordinator } from "./review-coordinator.ts";
import { application } from "./app.ts";
import { Collaboration } from "./issues.ts";
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
  AI: Ai;
  REVIEWS: DurableObjectNamespace;
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
            ? `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Gitflare · Sign in</title><style>:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#faf8f3;color:#292722;font:16px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}header{height:82px;padding:20px 5vw;border-bottom:1px solid #ded8cd;background:#fffdfa;font-weight:800;font-size:21px;letter-spacing:-.7px}main{max-width:1100px;margin:12vh auto;padding:32px 5vw;display:grid;grid-template-columns:1.2fr .8fr;gap:70px}h1{font-size:clamp(42px,6vw,64px);line-height:1.08;letter-spacing:-2.4px;margin:20px 0 28px;font-weight:650}.eyebrow{font:11px ui-monospace,monospace;letter-spacing:1.7px;color:#b8430c}button{min-height:44px;font:inherit;padding:10px 20px;margin-bottom:16px;border:1px solid #c5bdb0;border-radius:24px;background:#fffdfa}a{display:inline-flex;align-items:center;min-height:48px;padding:12px 24px;background:#b8430c;color:#fff;border-radius:28px;text-decoration:none;font-weight:600}p{color:#6c655d}.card{background:#fffdfa;border:1px solid #ded8cd;border-radius:18px;padding:30px;align-self:center}.card p{padding:14px 0;border-bottom:1px solid #ded8cd}.card p:last-child{border:0}.mark{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:10px;background:#ff681e;color:#fff;margin-right:10px;font-size:25px}:focus-visible{outline:3px solid #a4380b;outline-offset:4px}@media(max-width:700px){main{grid-template-columns:1fr;gap:26px;margin:5vh auto}.card{padding:22px}h1{font-size:48px}}</style></head><body><header><span class="mark">↗</span>GITFLARE</header><main><div><p class="eyebrow">PRIVATE REPOSITORIES / SHARED WORK</p><h1>Good work<br>starts together.</h1><p>Code, issues, and conversations in one private workspace.</p><p>Authentication required · Sign in to continue.</p>${authReady(env) ? "" : "<p>Sign-in is temporarily unavailable while setup is completed.</p>"}${authReady(env) && cookie(request, "__Host-forge") ? '<form method="post" action="/auth/refresh"><button>Resume session</button></form>' : ""}<a href="/auth/login${url.searchParams.get("invite") && /^[A-Za-z0-9_-]+$/.test(url.searchParams.get("invite")!) ? "?invite=" + encodeURIComponent(url.searchParams.get("invite")!) : ""}">Sign in with GitHub</a></div><aside class="card"><p class="eyebrow">A HOME FOR YOUR NEXT COMMIT</p><h2>Keep the context.</h2><p>Private Git history with your authors, dates, branches, and tags.</p><p>Issues and collaboration with clear repository permissions.</p><p>Read-only reviews with source citations and evidence.</p></aside></main></body></html>`
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
      collaboration: new Collaboration(env.DB as any),
      reviews: reviewClient(env),
      bundle: async (repo, bundle) => {
        const git = new NativeGit(env.ARTIFACTS);
        await git.create(repo.physical);
        const token = await git.token(repo.physical, "write");
        try {
          return await pushBundle(bundle, token);
        } finally {
          await git.revoke(repo.physical, token.id);
        }
      },
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
