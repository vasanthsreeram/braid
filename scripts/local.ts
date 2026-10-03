// Local harness only. This module is never imported by the production Worker bundle.
import {
  mkdir,
  readFile,
  writeFile,
  link,
  unlink,
  stat,
  readdir,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { Readable } from "node:stream";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve, dirname, join } from "node:path";
import { createServer } from "node:http";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { SQLCatalog, type SQL, type Statement } from "../src/catalog.ts";
import type { ObjectStore } from "../src/storage.ts";
import { ID, check } from "../src/storage.ts";
import type { GitPlane, Services, Principal } from "../src/contracts.ts";
import { Collaboration } from "../src/issues.ts";
import { application } from "../src/app.ts";
const exec = promisify(execFile);
export const cleanEnv = () => {
  const env = { ...process.env };
  delete env.GH_TOKEN;
  delete env.GITHUB_TOKEN;
  env.GIT_TERMINAL_PROMPT = "0";
  env.GIT_LFS_SKIP_SMUDGE = "1";
  env.GIT_CONFIG_NOSYSTEM = "1";
  return env;
};
export async function git(args: string[], cwd?: string) {
  return (
    await exec("git", ["-c", "core.hooksPath=/dev/null", ...args], {
      cwd,
      env: cleanEnv(),
      timeout: 60000,
      maxBuffer: 8 * 1024 * 1024,
    })
  ).stdout.trim();
}
export class FileStore implements ObjectStore {
  counters = { get: 0, put: 0, delete: 0, newBytes: 0, newObjects: 0 };
  constructor(public directory: string) {}
  path(key: string) {
    check(
      /^(?:v1\/tenants\/[a-zA-Z0-9_-]+\/(chunks\/[a-f0-9]{64}|repos\/[a-zA-Z0-9_-]+\/manifests\/[a-f0-9]{64}|staging\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)|staging-v1\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+)$/.test(
        key,
      ),
      500,
      "Unsafe object key",
    );
    return join(this.directory, key);
  }
  async get(key: string) {
    this.counters.get++;
    const p = this.path(key);
    try {
      await stat(p);
      return Readable.toWeb(
        createReadStream(p, { highWaterMark: 65536 }),
      ) as ReadableStream<Uint8Array>;
    } catch (e: any) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  async putIfAbsent(key: string, b: Uint8Array) {
    this.counters.put++;
    const p = this.path(key);
    await mkdir(dirname(p), { recursive: true });
    const temp = p + "." + randomBytes(12).toString("hex") + ".part";
    await writeFile(temp, b, { flag: "wx", mode: 0o600 });
    try {
      await link(temp, p);
      this.counters.newBytes += b.length;
      this.counters.newObjects++;
      return true;
    } catch (e: any) {
      if (e.code === "EEXIST") return false;
      throw e;
    } finally {
      await unlink(temp);
    }
  }
  async listManifests(tenant: string, repo: string) {
    check(ID.test(tenant) && ID.test(repo), 400, "Invalid manifest namespace");
    try {
      return (
        await readdir(
          join(
            this.directory,
            "v1",
            "tenants",
            tenant,
            "repos",
            repo,
            "manifests",
          ),
        )
      ).filter((x) => /^[a-f0-9]{64}$/.test(x));
    } catch (e: any) {
      if (e.code === "ENOENT") return [];
      throw e;
    }
  }
  async delete(key: string) {
    this.counters.delete++;
    await unlink(this.path(key)).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  }
}
export function sqlite(db: DatabaseSync): SQL {
  return {
    prepare(query: string): Statement {
      let params: unknown[] = [];
      return {
        bind(...p: unknown[]) {
          params = p;
          return this;
        },
        async first<T>() {
          return (db.prepare(query).get(...(params as any[])) as T) ?? null;
        },
        async all<T>() {
          return {
            results: db.prepare(query).all(...(params as any[])) as T[],
          };
        },
        async run() {
          const r = db.prepare(query).run(...(params as any[]));
          return { meta: { changes: Number(r.changes) } };
        },
      };
    },
  };
}
export class LocalGit implements GitPlane {
  constructor(public directory: string) {}
  path(name: string) {
    check(ID.test(name), 400, "Invalid local repo");
    return join(this.directory, name + ".git");
  }
  async refs(name: string) {
    return (
      await git([
        "--git-dir",
        this.path(name),
        "for-each-ref",
        "--format=%(objectname) %(refname)",
        "refs/heads",
        "refs/tags",
      ])
    )
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const [sha, ref] = l.split(" ");
        return { ref, sha };
      })
      .sort((a, b) => a.ref.localeCompare(b.ref));
  }
  async source(): Promise<never> {
    throw Error(
      "Local harness intentionally disables upstream GitHub requests",
    );
  }
  async seal() {}
  async create(name: string) {
    await mkdir(this.directory, { recursive: true });
    await git(["init", "--bare", "--initial-branch=main", this.path(name)]);
  }
  async import() {
    throw new Error("Local harness intentionally disables remote URL import");
  }
  async fork(source: string, target: string) {
    await git([
      "clone",
      "--bare",
      "--no-local",
      this.path(source),
      this.path(target),
    ]);
  }
  async info(name: string) {
    return {
      name,
      remote: this.path(name),
      provider: "local-bare-git",
      defaultBranch: "main",
    };
  }
  async log(name: string, ref: string) {
    check(
      ref.length <= 128 && !ref.startsWith("-") && !ref.includes("\0"),
      400,
      "Invalid ref",
    );
    try {
      const out = await git([
        "--git-dir",
        this.path(name),
        "log",
        "--first-parent",
        "-50",
        "--format=%H%x09%T%x09%s",
        ref,
        "--",
      ]);
      return out
        ? out.split("\n").map((l) => {
            const [sha, tree, message] = l.split("\t");
            return { sha, tree, message };
          })
        : [];
    } catch {
      return [];
    }
  }
  async tree(name: string, sha: string) {
    const out = await git(["--git-dir", this.path(name), "ls-tree", sha]);
    return out
      .split("\n")
      .filter(Boolean)
      .map((x) => {
        const [a, name] = x.split("\t");
        const [mode, type, hash] = a.split(" ");
        return { mode, type, hash, name };
      });
  }
  async file(name: string, ref: string, path: string) {
    check(
      !ref.startsWith("-") && !ref.includes("\0") && !path.includes("\0"),
      400,
      "Invalid file",
    );
    try {
      const { stdout } = await exec(
        "git",
        ["--git-dir", this.path(name), "show", `${ref}:${path}`],
        {
          env: cleanEnv(),
          timeout: 10000,
          maxBuffer: 1024 * 1024 + 1,
          encoding: "buffer",
        },
      );
      return new Blob([new Uint8Array(stdout)]);
    } catch {
      return null;
    }
  }
  async revoke() {}
  async commit(name: string, sha: string) {
    try {
      const parts = (
        await git([
          "--git-dir",
          this.path(name),
          "show",
          "-s",
          "--format=%H%x00%T%x00%P%x00%B%x00%an%x00%ae%x00%cn%x00%ce%x00%at%x00%ct",
          sha,
        ])
      ).split("\0");
      return {
        sha: parts[0],
        tree: parts[1],
        parents: parts[2].split(" ").filter(Boolean),
        message: parts[3].trimEnd(),
        author: { name: parts[4], email: parts[5] },
        committer: { name: parts[6], email: parts[7] },
        authoredAt: Number(parts[8]),
        committedAt: Number(parts[9]),
      };
    } catch {
      return null;
    }
  }
  async publish(
    source: string,
    target: string,
    ref: string,
    base: string,
    candidate: string,
  ) {
    await git([
      "--git-dir",
      this.path(target),
      "fetch",
      "--no-tags",
      this.path(source),
      candidate,
    ]);
    // update-ref's old OID comparison is atomic; the app checks ancestry before invoking it.
    await git([
      "--git-dir",
      this.path(target),
      "update-ref",
      ref,
      candidate,
      base,
    ]);
  }
  async token(name: string, scope: "read" | "write") {
    return {
      provider: "local-bare-git",
      scope,
      remote: this.path(name),
      note: "Filesystem access; no emulated Artifacts credential",
    };
  }
}
export async function localServices(
  directory: string,
  origin = "http://127.0.0.1:0",
) {
  await mkdir(directory, { recursive: true });
  const db = new DatabaseSync(join(directory, "catalog.sqlite"));
  db.exec(
    await readFile(
      new URL("../migrations/0001.sql", import.meta.url),
      "utf8",
    ).then((s) =>
      s
        .replaceAll("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
        .replaceAll("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS "),
    ),
  );
  db.exec(
    await readFile(
      new URL("../migrations/0002_core.sql", import.meta.url),
      "utf8",
    ).then((s) =>
      s
        .replaceAll("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")
        .replaceAll("CREATE TRIGGER ", "CREATE TRIGGER IF NOT EXISTS "),
    ),
  );
  db.exec(
    await readFile(
      new URL("../migrations/0003_operations.sql", import.meta.url),
      "utf8",
    ).then((s) => s.replaceAll("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ")),
  );
  db.exec(await readFile(new URL("../migrations/0005_collaboration.sql", import.meta.url), "utf8").then(s => s.replaceAll("CREATE TABLE ", "CREATE TABLE IF NOT EXISTS ").replaceAll("CREATE INDEX ", "CREATE INDEX IF NOT EXISTS ").replaceAll("CREATE TRIGGER ", "CREATE TRIGGER IF NOT EXISTS ")));
  const catalog = new SQLCatalog(sqlite(db)),
    store = new FileStore(join(directory, "objects")),
    plane = new LocalGit(join(directory, "git"));
  const token = randomBytes(32).toString("hex");
  const principal = { id: "local-owner", tenant: "local-tenant" };
  const credentials = new Map<string, Principal>([[token, principal]]);
  const s: Services = {
    catalog,
    collaboration: new Collaboration(sqlite(db)),
    store,
    git: plane,
    origin,
    allowPublic: false,
    localUpload: true,
    github: {
      account: async () => ({ connected: false, setupReady: false }),
      repos: async () => {
        throw Error("No GitHub authorization in local harness");
      },
      source: async () => {
        throw Error("No GitHub authorization in local harness");
      },
      disconnect: async () => ({ ok: true, revoked: true }),
    },
    async authenticate(r) {
      const raw = r.headers.get("authorization") ?? "";
      let candidate = raw.startsWith("Bearer ") ? raw.slice(7) : "";
      if (raw.startsWith("Basic ")) {
        try {
          candidate = atob(raw.slice(6)).split(":").slice(1).join(":");
        } catch {}
      }
      for (const [key, p] of credentials) {
        const b = Buffer.from(candidate);
        if (b.length === key.length && timingSafeEqual(b, Buffer.from(key)))
          return p;
      }
      return null;
    },
  };
  return { s, token, principal, catalog, store, plane, db, credentials };
}
export async function serveLocal(directory: string, port = 0) {
  const local = await localServices(directory);
  const server = createServer(async (req, res) => {
    try {
      if (req.headers.host !== new URL(local.s.origin).host) {
        res.writeHead(403);
        res.end("Loopback Host required");
        return;
      }
      const u = new URL(req.url ?? "/", local.s.origin);
      if (u.pathname === "/__local_identity") {
        res.setHeader("content-type", "application/json");
        res.setHeader("cache-control", "no-store");
        res.end(JSON.stringify({ credential: local.token }));
        return;
      }
      if (!u.pathname.startsWith("/api/") && !u.pathname.startsWith("/lfs/")) {
        const files: Record<string, string> = {
          "/": "index.html",
          "/app.js": "app.js",
          "/style.css": "style.css",
          // Public allowlist mirrors the Worker's; other paths stay private.
          "/public/blocks-engine.js": "public/blocks-engine.js",
          "/public/blocks.js": "public/blocks.js",
          "/public/route-engine.js": "public/route-engine.js",
          "/public/route.js": "public/route.js",
          "/public/welcome.css": "public/welcome.css",
        };
        if (u.pathname === "/auth/login") {
          res.writeHead(503);
          res.end(
            "WorkOS unavailable in local harness. Use a local API credential.",
          );
          return;
        }
        if (!files[u.pathname]) {
          res.writeHead(404);
          res.end();
          return;
        }
        res.setHeader(
          "content-type",
          u.pathname.endsWith(".js")
            ? "text/javascript"
            : u.pathname.endsWith(".css")
              ? "text/css"
              : "text/html",
        );
        res.end(
          await readFile(
            new URL("../web/" + files[u.pathname], import.meta.url),
          ),
        );
        return;
      }
      const request = new Request(u, {
        method: req.method,
        headers: new Headers(req.headers as any),
        ...(!["GET", "HEAD"].includes(req.method ?? "GET")
          ? { body: Readable.toWeb(req) as any, duplex: "half" }
          : {}),
      } as RequestInit);
      const response = await application(local.s)(request);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      if (response.body) {
        Readable.fromWeb(response.body as any)
          .on("error", () => res.destroy())
          .pipe(res);
      } else res.end();
    } catch {
      res.writeHead(500);
      res.end("Local harness error");
    }
  });
  server.listen(port, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address() as { port: number };
  local.s.origin = `http://127.0.0.1:${address.port}`;
  return {
    ...local,
    url: local.s.origin,
    server,
    async close() {
      server.closeAllConnections();
      await new Promise<void>((r) => server.close(() => r()));
      local.db.close();
    },
  };
}
