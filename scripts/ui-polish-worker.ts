// Isolated local Worker: deliberately no remote bindings or real provider credentials.
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
export async function uiWorker(ready = false) {
  await mkdir(".tmp", { recursive: true });
  const config = resolve(
    `.tmp/ui-polish-worker-${ready ? "ready" : "unconfigured"}.json`,
  );
  await writeFile(
    config,
    JSON.stringify({
      name: "gitflare-ui-local-only",
      main: "../src/worker.ts",
      compatibility_date: "2026-10-01",
      compatibility_flags: ["nodejs_compat"],
      vars: ready
        ? {
            WORKOS_CLIENT_ID: "client_LOCALFIXTURE",
            WORKOS_ISSUER: "https://fixture.invalid",
            WORKOS_API_KEY: "local-fixture-not-a-provider-key",
            SESSION_SECRET: "local-fixture-secret-never-used-in-production-000",
            ORIGIN: "https://fixture.invalid",
            ALLOW_PUBLIC: "false",
          }
        : {
            WORKOS_CLIENT_ID: "UNCONFIGURED",
            ORIGIN: "https://fixture.invalid",
            ALLOW_PUBLIC: "false",
          },
      assets: {
        directory: "../web",
        binding: "ASSETS",
        run_worker_first: true,
      },
    }),
  );
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    WRANGLER_SEND_METRICS: "false",
  };
  for (const key of [
    "GH_TOKEN",
    "GITHUB_TOKEN",
    "CLOUDFLARE_API_TOKEN",
    "CLOUDFLARE_API_KEY",
    "CLOUDFLARE_EMAIL",
  ])
    delete env[key];
  const child = spawn(
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
  child.stderr.on("data", () => {});
  const url = await new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      child.kill("SIGINT");
      reject(Error("Isolated local Worker startup timed out"));
    }, 30000);
    child.stdout.on("data", (chunk) => {
      log += chunk.toString();
      const match = log.match(/Ready on (http:\/\/localhost:\d+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(Error("Local Worker exited: " + code));
    });
  });
  return {
    url,
    close: async () => {
      const exit = new Promise<void>((resolve) =>
        child.once("exit", () => resolve()),
      );
      child.kill("SIGINT");
      await exit;
    },
  };
}
