import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
await mkdir(".tmp", { recursive: true });
const config = resolve(".tmp/wrangler-auth-smoke.json");
await writeFile(
  config,
  JSON.stringify({
    name: "cf-native-forge-auth-smoke",
    main: "../src/worker.ts",
    compatibility_date: "2026-10-01",
    compatibility_flags: ["nodejs_compat"],
    vars: {
      WORKOS_CLIENT_ID: "UNCONFIGURED",
      ORIGIN: "https://unconfigured.invalid",
      ALLOW_PUBLIC: "false",
    },
    assets: { directory: "../web", binding: "ASSETS", run_worker_first: true },
  }),
);
// No Artifacts binding: Wrangler's Artifacts binding is always remote, even in local mode.
const env: NodeJS.ProcessEnv = {
  ...process.env,
  WRANGLER_SEND_METRICS: "false",
};
delete env.GH_TOKEN;
delete env.GITHUB_TOKEN;
delete env.CLOUDFLARE_API_TOKEN;
const p = spawn(
  resolve("node_modules/.bin/wrangler"),
  [
    "dev",
    "--config",
    config,
    "--local",
    "--port",
    "0",
    "--inspector-port",
    "0",
  ],
  { env, stdio: ["pipe", "pipe", "pipe"] },
);
let log = "";
const url = await new Promise<string>((resolve, reject) => {
  const timer = setTimeout(() => {
    p.kill("SIGINT");
    reject(Error("Local workerd start timed out"));
  }, 30000);
  p.stdout.on("data", (b) => {
    log += b.toString();
    const m = log.match(/Ready on (http:\/\/localhost:\d+)/);
    if (m) {
      clearTimeout(timer);
      resolve(m[1]);
    }
  });
  p.on("error", reject);
  p.on("exit", (code) => {
    clearTimeout(timer);
    reject(Error("Local workerd exited " + code));
  });
});
try {
  const checks = [];
  const cases: [string, string, unknown, Record<string, string>, number][] = [
    ["/", "GET", undefined, {}, 401],
    ["/auth/login", "GET", undefined, {}, 503],
    ["/api/discovery", "GET", undefined, {}, 401],
    ["/api/repos", "GET", undefined, {}, 401],
    ["/api/repos", "POST", { name: "bad" }, {}, 403],
    [
      "/api/repos",
      "POST",
      { name: "bad" },
      { authorization: "Bearer local-owner" },
      401,
    ],
    [
      "/lfs/private/objects/" + "a".repeat(64),
      "GET",
      undefined,
      { authorization: "Bearer local-owner" },
      404,
    ],
  ];
  for (const [path, method, body, headers, expected] of cases) {
    const r = await fetch(url + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const value = await r.text();
    if (r.status !== expected)
      throw Error(
        `Local auth smoke ${path}: expected ${expected}, got ${r.status}`,
      );
    checks.push({ path, method, status: r.status, body: value, passed: true });
  }
  await writeFile(
    "docs/benchmarks/raw/worker-auth-smoke-v1.json",
    JSON.stringify(
      {
        version: 1,
        provider:
          "local workerd/Miniflare auth boundary only; no Artifacts/R2/D1 bindings or remote operations",
        checks,
        endpoint: url,
        runtime: "wrangler 4.146.0",
        passed: true,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `Local workerd auth smoke: ${checks.length} checks passed (${checks.map((x) => x.status).join(", ")}).`,
  );
} finally {
  p.kill("SIGINT");
  await new Promise<void>((r) => p.once("exit", () => r()));
}
