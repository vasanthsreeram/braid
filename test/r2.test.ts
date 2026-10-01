import test from "node:test";
import assert from "node:assert/strict";
import { Miniflare } from "miniflare";
import { R2Store } from "../src/cloudflare.ts";
import {
  digest,
  ingest,
  loadManifest,
  download,
  chunkKey,
} from "../src/storage.ts";
test("local Miniflare R2 binding: conditional publication, verified checksum, same-OID idempotency and corrupt-chunk abort", async () => {
  const mf = new Miniflare({
    host: "127.0.0.1",
    port: 0,
    telemetry: { enabled: false },
    workers: [
      {
        config: {
          name: "cf-native-forge-r2-local-test",
          compatibilityDate: "2026-10-01",
          manifest: {
            mainModule: "index.js",
            modules: {
              "index.js": {
                type: "esm",
                contents:
                  'export default {fetch(){return new Response("local emulator only", {status:401})}}',
              },
            },
          },
          env: { BUCKET: { type: "r2", name: "cf-native-forge-local-test" } },
        },
      },
    ],
  });
  try {
    const bucket = await mf.getR2Bucket("BUCKET");
    const store = new R2Store(bucket as any);
    const bytes = new TextEncoder().encode(
      "Actual local R2 binding, not a live provider measurement.",
    );
    const oid = digest(bytes);
    const first = await ingest(
      store,
      "tenant",
      "repo",
      oid,
      bytes.length,
      new Blob([bytes]).stream(),
    );
    assert.equal(first.newChunkBytes, bytes.length);
    const second = await ingest(
      store,
      "tenant",
      "repo",
      oid,
      bytes.length,
      new Blob([bytes]).stream(),
    );
    assert.equal(second.newChunkBytes, 0);
    assert.equal(second.manifestBytes, 0);
    const m = (await loadManifest(store, "tenant", "repo", oid))!;
    assert.deepEqual(
      new Uint8Array(
        await new Response(download(store, "tenant", m)).arrayBuffer(),
      ),
      bytes,
    );
    assert.deepEqual(await store.listManifests("tenant", "repo"), [oid]);
    await bucket.put(chunkKey("tenant", m.chunks[0].hash), "corrupt");
    await assert.rejects(
      new Response(download(store, "tenant", m)).arrayBuffer(),
    );
  } finally {
    await mf.dispose();
  }
});
