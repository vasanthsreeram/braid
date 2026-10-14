import { bindings, defineConfig, defineContainer, exports } from "cf/config";

// cf deploy reads this file and ignores wrangler.jsonc. Keep both in step.
const accountId = "7efeb52ec5727a903edd8ef7ae8eb925";
const workerName = "cf-native-forge-evaluation";

// AgentRun starts a Cloudflare-managed image chosen in code (src/agent-run.ts),
// so the application declares no image. The name is Wrangler's default for this
// Worker and class, which keeps the existing container application.
const agentRunContainer = defineContainer({
  name: `${workerName}-agentrun`,
  schedulingPolicy: "durable-object",
});

export default defineConfig({
  accountId,
  worker: {
    name: workerName,
    compatibilityDate: "2026-10-01",
    compatibilityFlags: ["nodejs_compat"],
    entrypoint: "src/main.ts",
    workersDev: true,
    previewUrls: false,
    domains: ["gitflare.lintlabs.org"],
    limits: { cpuMs: 300000 },
    observability: { enabled: true },
    assets: { runWorkerFirst: true },
    env: {
      WORKOS_CLIENT_ID: bindings.text("client_01M3WQ9VJ9G2MH74MYP7WBD708"),
      WORKOS_ACCESS_TOKEN_ISSUER: bindings.text("https://api.workos.com"),
      WORKOS_ISSUER: bindings.text(
        "https://api.workos.com/user_management/client_01M3WQ9VJ9G2MH74MYP7WBD708",
      ),
      ORIGIN: bindings.text("https://gitflare.lintlabs.org"),
      ALLOW_PUBLIC: bindings.text("false"),
      R2_ACCOUNT_ID: bindings.text(accountId),
      R2_BUCKET_NAME: bindings.text("cf-native-forge-lfs-evaluation"),
      ASSETS: bindings.assets(),
      ARTIFACTS: bindings.artifacts({ namespace: "cf-native-forge-evaluation" }),
      BUCKET: bindings.r2({ name: "cf-native-forge-lfs-evaluation" }),
      DB: bindings.d1({
        name: "cf-native-forge-evaluation",
        id: "200d9a4f-b51b-451a-86ab-43b1b29847d3",
      }),
      AI: bindings.ai(),
      REVIEWS: bindings.durableObject({ worker: workerName, exportName: "ReviewCoordinator" }),
      // Blocks `cf deploy` (cf 1.0.0-beta.14 to beta.16): cf writes script_name on every
      // Durable Object binding and refuses a container on a class bound that way.
      // Keep this binding so cf fails closed. Removing it would deploy agents broken.
      AGENTS: bindings.durableObject({ worker: workerName, exportName: "AgentRun" }),
    },
    // Replaces Wrangler's migrations v1-review and v2-agent-run.
    exports: {
      ReviewCoordinator: exports.durableObject({ storage: "sqlite" }),
      AgentRun: exports.durableObject({ storage: "sqlite", container: agentRunContainer }),
    },
  },
  containers: [agentRunContainer],
});
