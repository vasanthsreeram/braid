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
import { authenticate, authRoute, type AuthConfig } from "./auth.ts";
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
    const auth = await authRoute(env, request);
    if (auth) return auth;
    const path = new URL(request.url).pathname;
    if (!path.startsWith("/api/") && !path.startsWith("/lfs/")) {
      const principal = await authenticate(env, request);
      if (!principal)
        return new Response("Authentication required", {
          status: 401,
          headers: { "cache-control": "no-store" },
        });
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
      catalog: new SQLCatalog(env.DB as any),
      store: new R2Store(env.BUCKET),
      git: new NativeGit(env.ARTIFACTS),
      authenticate: (r) => authenticate(env, r),
      origin: env.ORIGIN,
      allowPublic: env.ALLOW_PUBLIC === "true",
      presign: directUpload(env),
    })(request);
  },
};
