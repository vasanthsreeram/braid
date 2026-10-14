import { defineWranglerConfig } from "wrangler/experimental-config";

// Build settings for `cf deploy`, which delegates bundling to Wrangler.
export default defineWranglerConfig({
  assetsDirectory: "web",
});
