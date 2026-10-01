import { serveLocal } from "./local.ts";
const local = await serveLocal(".tmp/local", 8787);
console.log(
  `LOCAL ONLY — real local bare Git + filesystem objects; no Cloudflare/WorkOS emulation. ${local.url}`,
);
// Ephemeral test credentials stay in memory; the loopback UI can request its local identity.
process.on("SIGINT", async () => {
  await local.close();
  process.exit(0);
});
