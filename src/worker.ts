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
import { runsClient } from "./agents.ts";
export { ReviewCoordinator } from "./review-coordinator.ts";
import { application } from "./app.ts";
import { welcome, publicWelcomeAssets, welcomeCSP } from "./welcome.ts";
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
import { GitHubAccounts, githubRoute, type GitHubConfig } from "./github.ts";
export interface Env extends GitHubConfig, SigningConfig {
  DB: D1Database;
  AI: Ai;
  REVIEWS: DurableObjectNamespace;
  /** Coding agent runs (AgentRun); absent in local/test configurations. */
  AGENTS?: DurableObjectNamespace;
  AGENT_MODEL?: string;
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
    const connect = await githubRoute(
      env,
      request,
      (r) => authenticate(env, r, authIO),
      github,
    );
    if (connect) return connect;
    const auth = await authRoute(env, request, authIO);
    if (auth) return auth;
    const path = new URL(request.url).pathname;
    // Exact public allowlist; private UI assets and APIs still pass their auth gates.
    if (
      Object.hasOwn(publicWelcomeAssets, path) &&
      ["GET", "HEAD"].includes(request.method)
    ) {
      const asset = await env.ASSETS.fetch(request as any);
      return new Response(
        request.method === "HEAD" ? null : (asset.body as any),
        {
          status: asset.status,
          headers: {
            "content-type": publicWelcomeAssets[path],
            "cache-control": "public, max-age=0, must-revalidate",
            "content-security-policy": welcomeCSP,
            "x-content-type-options": "nosniff",
          },
        },
      );
    }
    if (!path.startsWith("/api/") && !path.startsWith("/lfs/")) {
      const principal = await authenticate(env, request, authIO);
      if (!principal)
        return new Response(
          path === "/"
            ? welcome(
                authReady(env),
                !!cookie(request, "__Host-forge"),
                url.searchParams.get("invite"),
              )
            : "Authentication required",
          {
            status: 401,
            headers: {
              "cache-control": "no-store, no-transform",
              "content-type":
                path === "/"
                  ? "text/html; charset=utf-8"
                  : "text/plain; charset=utf-8",
              "content-security-policy": welcomeCSP,
              "x-content-type-options": "nosniff",
            },
          },
        );
      // Asset responses have immutable headers; copy before adding policy headers.
      const asset = (await env.ASSETS.fetch(request as any)) as unknown as Response;
      const response = new Response(asset.body, asset);
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
      runs: env.AGENTS
        ? runsClient(env.AGENTS as any, env.AGENT_MODEL)
        : undefined,
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
