import { EncryptJWT, jwtDecrypt } from "jose";
import type { Principal } from "./contracts.ts";
import type { SQL } from "./catalog.ts";
import { workos, type AuthConfig } from "./auth.ts";
import { check, digest, Fault } from "./storage.ts";
export interface GitHubConfig extends AuthConfig {
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}
interface Account {
  user: string;
  github_id: string;
  login: string;
  sealed: string | null;
  updated: number;
}
const repoName = /^[A-Za-z0-9_-]+\/[A-Za-z0-9_.-]+$/;
// Public repositories only. Private repository authority requires a separate, selected-repo grant.
export class GitHubAccounts {
  constructor(
    private c: GitHubConfig,
    private db: SQL,
    private request: typeof fetch = fetch,
  ) {}
  private key() {
    check(
      this.c.SESSION_SECRET && this.c.SESSION_SECRET.length >= 32,
      503,
      "GitHub connection unavailable",
    );
    return new Uint8Array(
      Buffer.from(
        digest(
          new TextEncoder().encode(
            "gitflare/github/v1\0" + this.c.SESSION_SECRET,
          ),
        ),
        "hex",
      ),
    );
  }
  private row(user: string) {
    return this.db
      .prepare("SELECT * FROM github_accounts WHERE user=?")
      .bind(user)
      .first<Account>();
  }
  private async clear(user: string) {
    await this.db
      .prepare("UPDATE github_accounts SET sealed=NULL,updated=? WHERE user=?")
      .bind(Date.now(), user)
      .run();
  }
  private async api(
    path: string,
    token: string,
    method = "GET",
    basic = false,
    body?: unknown,
  ) {
    const r = await this.request("https://api.github.com" + path, {
      method,
      redirect: "error",
      signal: AbortSignal.timeout(15000),
      headers: {
        authorization: (basic ? "Basic " : "Bearer ") + token,
        accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
        "user-agent": "Gitflare",
        "content-type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    check(
      r.ok,
      r.status === 401
        ? 401
        : r.status === 404
          ? 404
          : r.status === 403 || r.status === 429
            ? 429
            : 503,
      r.status === 401
        ? "GitHub authorization ended; reconnect GitHub"
        : r.status === 404
          ? "GitHub repository unavailable"
          : r.status === 403 || r.status === 429
            ? "GitHub rate limit or permission restriction; try later"
            : "GitHub request failed",
    );
    return {
      value: r.status === 204 ? null : ((await r.json()) as any),
      response: r,
    };
  }
  async connect(p: Principal, oauth: any) {
    check(
      this.c.GITHUB_CLIENT_ID && this.c.GITHUB_CLIENT_SECRET,
      503,
      "GitHub repository connection needs dedicated app setup",
    );
    check(
      oauth?.provider === "GitHubOAuth" &&
        typeof oauth.access_token === "string",
      401,
      "GitHub provider token required",
    );
    // WorkOS has verified the user; independently bind the provider token to their linked GitHub identity.
    const identities = await workos(
      this.c,
      `/user_management/users/${p.id}/identities`,
      undefined,
      { request: this.request },
    );
    const { value: user, response } = await this.api(
      "/user",
      oauth.access_token,
    );
    check(
      Number.isSafeInteger(user.id) &&
        user.id > 0 &&
        /^[A-Za-z0-9_-]+$/.test(user.login),
      502,
      "Invalid GitHub identity",
    );
    check(
      Array.isArray(identities) &&
        identities.some(
          (i: any) =>
            i.type === "OAuth" &&
            i.provider === "GitHubOAuth" &&
            String(i.idp_id) === String(user.id),
        ),
      401,
      "GitHub identity does not match the verified WorkOS identity",
    );
    const scopes = (
      response.headers.get("x-oauth-scopes") ??
      (Array.isArray(oauth.scopes) ? oauth.scopes.join(",") : "")
    )
      .split(/[ ,]+/)
      .filter(Boolean);
    check(
      scopes.every((s: string) => ["read:user", "user:email"].includes(s)),
      403,
      "Reconnect GitHub with public-listing permissions only",
    );
    const previous = await this.row(p.id);
    check(
      !previous?.sealed || previous.github_id === String(user.id),
      409,
      "Disconnect the existing GitHub account before changing identity",
    );
    const exp = Math.min(
      Math.floor(Date.now() / 1000) + 30 * 86400,
      typeof oauth.expires_at === "number" ? oauth.expires_at : Infinity,
    );
    check(
      exp > Date.now() / 1000,
      401,
      "GitHub token expired; reconnect GitHub",
    );
    const sealed = await new EncryptJWT({
      access: oauth.access_token,
      github_id: String(user.id),
    })
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuer(this.c.ORIGIN)
      .setAudience("gitflare-github")
      .setSubject(p.id)
      .setIssuedAt()
      .setExpirationTime(exp)
      .encrypt(this.key());
    await this.db
      .prepare(
        "INSERT INTO github_accounts VALUES (?,?,?,?,?) ON CONFLICT(user) DO UPDATE SET github_id=excluded.github_id,login=excluded.login,sealed=excluded.sealed,updated=excluded.updated",
      )
      .bind(p.id, String(user.id), user.login, sealed, Date.now())
      .run();
  }
  async account(p: Principal) {
    const row = await this.row(p.id);
    let connected = !!row?.sealed;
    let login = row?.login ?? null;
    if (connected) {
      try {
        login = (await this.current(p)).login;
      } catch (e) {
        if (e instanceof Fault && [401, 409].includes(e.status))
          connected = false;
        else throw e;
      }
    }
    return {
      connected,
      login,
      access: "public",
      privateAccess: false,
      setupReady: !!this.c.GITHUB_CLIENT_ID && !!this.c.GITHUB_CLIENT_SECRET,
      reconnect: "/auth/login",
      revokeUrl: "https://github.com/settings/connections/applications",
    };
  }
  private async token(p: Principal) {
    const row = await this.row(p.id);
    check(row?.sealed, 409, "Connect GitHub to list your public repositories");
    try {
      const { payload } = await jwtDecrypt(row.sealed, this.key(), {
        issuer: this.c.ORIGIN,
        audience: "gitflare-github",
        subject: p.id,
      });
      check(
        payload.github_id === row.github_id &&
          typeof payload.access === "string",
        401,
        "GitHub connection invalid",
      );
      return { row, token: payload.access };
    } catch {
      await this.clear(p.id);
      throw new Fault(409, "GitHub authorization ended; reconnect GitHub");
    }
  }
  private async current(p: Principal) {
    const v = await this.token(p);
    try {
      const { value: user } = await this.api("/user", v.token);
      check(
        String(user.id) === v.row.github_id,
        401,
        "GitHub identity changed; reconnect GitHub",
      );
      check(
        /^[A-Za-z0-9_-]+$/.test(user.login),
        502,
        "Invalid GitHub identity",
      );
      return { ...v, login: user.login as string };
    } catch (e: any) {
      if (e.status === 401) await this.clear(p.id);
      throw e;
    }
  }
  async repos(p: Principal, url: URL) {
    const page = Number(url.searchParams.get("page") ?? "1"),
      q = (url.searchParams.get("q") ?? "").trim();
    check(
      Number.isInteger(page) && page >= 1 && page <= 100,
      400,
      "Page must be between 1 and 100",
    );
    check(
      q.length <= 100 && /^[A-Za-z0-9_. -]*$/.test(q),
      400,
      "Search accepts repository-name words only",
    );
    const v = await this.current(p);
    const path = q
      ? "/search/repositories?" +
        new URLSearchParams({
          q: `user:${v.login} is:public ${q} in:name`,
          per_page: "30",
          page: String(page),
          sort: "updated",
          order: "desc",
        })
      : "/user/repos?" +
        new URLSearchParams({
          visibility: "public",
          affiliation: "owner",
          sort: "updated",
          direction: "desc",
          per_page: "30",
          page: String(page),
        });
    const { value, response } = await this.api(path, v.token);
    const rows = q ? value.items : value;
    check(Array.isArray(rows), 502, "Invalid GitHub repositories response");
    const repos = rows
      .filter(
        (r: any) =>
          r.private === false &&
          String(r.owner?.id) === v.row.github_id &&
          repoName.test(r.full_name),
      )
      .map((r: any) => ({
        id: r.id,
        name: r.name,
        fullName: r.full_name,
        visibility: "public",
        fork: r.fork === true,
        sizeKiB: r.size ?? null,
        description:
          typeof r.description === "string"
            ? r.description.slice(0, 500)
            : null,
      }));
    return {
      login: v.login,
      access: "public",
      repos,
      page,
      nextPage:
        page < 100 && /rel="next"/.test(response.headers.get("link") ?? "")
          ? page + 1
          : null,
      searchLimited: q
        ? value.incomplete_results === true || value.total_count > 1000
        : false,
    };
  }
  async source(p: Principal, name: unknown) {
    check(
      typeof name === "string" &&
        repoName.test(name) &&
        !name.split("/").some((x) => x === "." || x === ".."),
      400,
      "Invalid GitHub repository",
    );
    const v = await this.current(p);
    check(
      name.split("/")[0].toLowerCase() === v.login.toLowerCase(),
      404,
      "GitHub repository unavailable",
    );
    const { value: r } = await this.api("/repos/" + name, v.token);
    check(
      r.private === false,
      403,
      "Private repository import requires selected-repository authorization",
    );
    check(
      String(r.owner?.id) === v.row.github_id && repoName.test(r.full_name),
      404,
      "GitHub repository unavailable",
    );
    return {
      url: `https://github.com/${r.full_name}.git`,
      name: r.name.replace(/[^A-Za-z0-9_-]/g, "-"),
    };
  }
  async disconnect(p: Principal) {
    const row = await this.row(p.id);
    let token: string | undefined;
    if (row?.sealed) {
      try {
        token = (await this.token(p)).token;
      } catch {}
    }
    // Local denial is retained even when the upstream revocation call fails.
    await this.clear(p.id);
    if (!token)
      return {
        ok: true,
        revoked: !row,
        revokeUrl: "https://github.com/settings/connections/applications",
      };
    check(
      this.c.GITHUB_CLIENT_ID && this.c.GITHUB_CLIENT_SECRET,
      503,
      "Connection removed locally; revoke Gitflare in GitHub application settings",
    );
    try {
      await this.api(
        `/applications/${encodeURIComponent(this.c.GITHUB_CLIENT_ID)}/token`,
        btoa(this.c.GITHUB_CLIENT_ID + ":" + this.c.GITHUB_CLIENT_SECRET),
        "DELETE",
        true,
        { access_token: token },
      );
    } catch {
      return {
        ok: true,
        revoked: false,
        revokeUrl: "https://github.com/settings/connections/applications",
      };
    }
    return { ok: true, revoked: true };
  }
}
