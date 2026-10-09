// Benchmark-only transport. Never imported by the Worker or ordinary local server.
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { performance } from "node:perf_hooks";
import { AsyncLocalStorage } from "node:async_hooks";
import { application } from "../src/app.ts";
import { localServices, cleanEnv } from "./local.ts";

export async function serveBenchmark(directory: string) {
  const local = await localServices(directory);
  const app = application(local.s);
  const authContext = new AsyncLocalStorage<{
    authorization: string;
    repo: string;
    policyOnly?: boolean;
  }>();
  const events: Array<Record<string, unknown>> = [];
  const capabilities = new Map<
    string,
    {
      repo: string;
      physical: string;
      scope: "read" | "write";
      expires: number;
      identityAuthorization: string;
    }
  >();
  let enabled = false;
  // Preserve all original LocalGit operations, replacing only info/token after
  // the native missing-transport probe. The real app authorizes token issuance.
  local.s.git = {
    refs: (n) => local.plane.refs(n),
    remove: (n) => local.plane.remove(n),
    source: (u) => local.plane.source(),
    seal: (n) => local.plane.seal(),
    revoke: (n, t) => local.plane.revoke(),
    commit: (n, s) => local.plane.commit(n, s),
    publish: (s, t, r, b, c) => local.plane.publish(s, t, r, b, c),
    create: (n) => local.plane.create(n),
    import: () => local.plane.import(),
    fork: (a, b) => local.plane.fork(a, b),
    log: (n, r) => local.plane.log(n, r),
    tree: (n, r) => local.plane.tree(n, r),
    file: (n, r, p) => local.plane.file(n, r, p),
    info: async (n) =>
      enabled
        ? {
            provider: "benchmark-loopback-http",
            remote: `${local.s.origin}/git/${(await local.catalog.list(local.principal, false)).find((r) => r.physical === n)!.id}.git`,
          }
        : local.plane.info(n),
    token: async (physical, scope) => {
      if (!enabled) return local.plane.token(physical, scope);
      const context = authContext.getStore();
      if (!context) throw Error("Missing benchmark request context");
      const repo = await local.catalog.get(context.repo);
      if (!repo || repo.physical !== physical)
        throw Error("Missing benchmark repository");
      if (context.policyOnly)
        return { provider: "benchmark-loopback-http", scope };
      const credential = randomBytes(32).toString("hex");
      capabilities.set(credential, {
        repo: repo.id,
        physical,
        scope,
        expires: Date.now() + 60000,
        identityAuthorization: context.authorization,
      });
      return {
        provider: "benchmark-loopback-http",
        scope,
        remote: `${local.s.origin}/git/${repo.id}.git`,
        credential,
        expiresIn: 60,
      };
    },
  };
  const server = createServer(async (req, res) => {
    const start = performance.now();
    let inputBytes = 0,
      outputBytes = 0;
    let childResource: Record<string, unknown> = {};
    const url = new URL(req.url ?? "/", local.s.origin);
    res.on("finish", () =>
      events.push({
        method: req.method,
        path: url.pathname,
        service: url.searchParams.get("service"),
        status: res.statusCode,
        inputBytes,
        outputBytes,
        wallMs: performance.now() - start,
        ...childResource,
      }),
    );
    const end = (status: number, body = "") => {
      outputBytes = Buffer.byteLength(body);
      res.writeHead(status);
      res.end(body);
    };
    try {
      if (req.headers.host !== new URL(local.s.origin).host) return end(403);
      if (url.pathname === "/__local_identity" && req.method === "GET") {
        res.setHeader("cache-control", "no-store");
        res.setHeader("content-type", "application/json");
        return end(200, JSON.stringify({ credential: local.token }));
      }
      if (enabled && url.pathname.startsWith("/git/")) {
        const match =
          /^\/git\/([a-zA-Z0-9_-]+)\.git\/(info\/refs|git-upload-pack|git-receive-pack)$/.exec(
            url.pathname,
          );
        if (!match) return end(404);
        const service =
          match[2] === "info/refs" ? url.searchParams.get("service") : match[2];
        if (!["git-upload-pack", "git-receive-pack"].includes(service ?? ""))
          return end(400);
        if ((match[2] === "info/refs" ? "GET" : "POST") !== req.method)
          return end(405);
        const raw = req.headers.authorization ?? "";
        const cap = capabilities.get(
          raw.startsWith("Bearer ") ? raw.slice(7) : "",
        );
        const scope = service === "git-receive-pack" ? "write" : "read";
        if (
          !cap ||
          cap.expires <= Date.now() ||
          cap.repo !== match[1] ||
          (scope === "write" && cap.scope !== "write")
        )
          return end(401);
        // Recheck current app ACL/canonical policy for every request, including
        // after a grant has been revoked. This is not a deployable auth mode.
        const authorization = await authContext.run(
          {
            authorization: cap.identityAuthorization,
            repo: cap.repo,
            policyOnly: true,
          },
          () =>
            app(
              new Request(`${local.s.origin}/api/repos/${cap.repo}/token`, {
                method: "POST",
                headers: {
                  authorization: cap.identityAuthorization,
                  "content-type": "application/json",
                },
                body: JSON.stringify({ scope }),
              }),
            ),
        );
        events.push({
          method: "POST",
          path: "/internal-app-policy/token",
          status: authorization.status,
          scope,
          inputBytes: 0,
          outputBytes: 0,
        });
        if (!authorization.ok) return end(authorization.status);
        const chunks: Buffer[] = [];
        for await (const b of req) {
          inputBytes += b.length;
          if (inputBytes > 8 * 1024 * 1024) return end(413);
          chunks.push(b);
        }
        const child = spawn("/usr/bin/time", ["-l", "git", "http-backend"], {
          env: {
            ...cleanEnv(),
            GIT_PROJECT_ROOT: local.plane.directory,
            GIT_HTTP_EXPORT_ALL: "1",
            PATH_INFO: `/${cap.physical}.git/${match[2]}`,
            REQUEST_METHOD: req.method!,
            QUERY_STRING: url.search.slice(1),
            CONTENT_TYPE: req.headers["content-type"] ?? "",
            CONTENT_LENGTH: String(inputBytes),
            REMOTE_USER: "benchmark-authenticated",
            REMOTE_ADDR: "127.0.0.1",
            HTTP_GIT_PROTOCOL: (req.headers["git-protocol"] as string) ?? "",
          },
          stdio: ["pipe", "pipe", "pipe"],
        });
        const stdout: Buffer[] = [];
        let bytes = 0,
          stderr = "";
        child.stdout.on("data", (b) => {
          bytes += b.length;
          if (bytes > 8 * 1024 * 1024) child.kill("SIGKILL");
          else stdout.push(b);
        });
        child.stderr.on("data", (b) => {
          if (stderr.length < 65536) stderr += b;
        });
        const timer = setTimeout(() => child.kill("SIGKILL"), 15000);
        child.stdin.on("error", () => {});
        child.stdin.end(Buffer.concat(chunks));
        const code = await new Promise<number | null>((resolve, reject) => {
          child.on("close", resolve);
          child.on("error", reject);
        }).finally(() => clearTimeout(timer));
        const time = stderr.match(
          /([\d.]+) real\s+([\d.]+) user\s+([\d.]+) sys/,
        );
        const rss = stderr.match(/(\d+)\s+maximum resident set size/);
        childResource = {
          childExitCode: code,
          userSeconds: time ? Number(time[2]) : null,
          systemSeconds: time ? Number(time[3]) : null,
          maxRssBytes: rss ? Number(rss[1]) : null,
        };
        if (code !== 0) return end(502);
        const buffer = Buffer.concat(stdout),
          at = buffer.indexOf("\r\n\r\n");
        if (at < 0) return end(502);
        const headers: Record<string, string> = {};
        let status = 200;
        for (const line of buffer.subarray(0, at).toString().split("\r\n")) {
          const i = line.indexOf(":");
          if (i < 0) continue;
          const key = line.slice(0, i).toLowerCase(),
            value = line.slice(i + 1).trim();
          if (key === "status") status = Number(value.split(" ")[0]);
          else headers[key] = value;
        }
        outputBytes = buffer.length - at - 4;
        res.writeHead(status, headers);
        res.end(buffer.subarray(at + 4));
        return;
      }
      const chunks: Buffer[] = [];
      for await (const b of req) {
        inputBytes += b.length;
        if (inputBytes > 65536) return end(413);
        chunks.push(b);
      }
      const response = await authContext.run(
        {
          authorization: req.headers.authorization ?? "",
          repo: url.pathname.split("/")[3] ?? "",
        },
        () =>
          app(
            new Request(url, {
              method: req.method,
              headers: new Headers(req.headers as Record<string, string>),
              ...(!["GET", "HEAD"].includes(req.method ?? "GET")
                ? { body: Buffer.concat(chunks) }
                : {}),
            }),
          ),
      );
      const body = Buffer.from(await response.arrayBuffer());
      outputBytes = body.length;
      // Credential responses stay solely in process memory, never event bodies.
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(body);
    } catch {
      if (!res.headersSent) end(500);
      else res.destroy();
    }
  });
  server.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  local.s.origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  return {
    ...local,
    url: local.s.origin,
    events,
    enableTransport() {
      enabled = true;
    },
    async close() {
      server.closeAllConnections();
      await new Promise<void>((r) => server.close(() => r()));
      local.db.close();
    },
  };
}
