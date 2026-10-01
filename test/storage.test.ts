import test from "node:test";
import assert from "node:assert/strict";
import {
  ingest,
  chunks,
  CDC,
  digest,
  download,
  loadManifest,
  manifestKey,
  chunkKey,
  validateManifest,
  type ObjectStore,
} from "../src/storage.ts";
class Memory implements ObjectStore {
  objects = new Map<string, Uint8Array>();
  async get(k: string) {
    const v = this.objects.get(k);
    return v ? stream(v) : null;
  }
  async putIfAbsent(k: string, v: Uint8Array) {
    if (this.objects.has(k)) return false;
    this.objects.set(k, v.slice());
    return true;
  }
  async listManifests(t: string, r: string) {
    const p = `v1/tenants/${t}/repos/${r}/manifests/`;
    return [...this.objects.keys()]
      .filter((k) => k.startsWith(p))
      .map((k) => k.slice(p.length));
  }
  async delete(k: string) {
    this.objects.delete(k);
  }
}
function stream(b: Uint8Array, block = 65536) {
  let n = 0;
  return new ReadableStream<Uint8Array>({
    pull(c) {
      if (n >= b.length) c.close();
      else {
        c.enqueue(b.slice(n, n + block));
        n += block;
      }
    },
  });
}
export function fixture(n: number) {
  let x = 123;
  return Uint8Array.from({ length: n }, () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x & 255;
  });
}
const data = fixture(9 * 1024 * 1024 + 71),
  oid = digest(data);
test("CDC boundaries are deterministic across network segmentation, bounded, golden hash", async () => {
  const collect = async (block: number) => {
    const a = [];
    for await (const b of chunks(stream(data, block)))
      a.push({ size: b.length, hash: digest(b) });
    return a;
  };
  const a = await collect(1023);
  assert.deepEqual(a, await collect(256 * 1024));
  assert.ok(
    a.every(
      (x, i) => x.size <= CDC.max && (i === a.length - 1 || x.size >= CDC.min),
    ),
  );
  assert.equal(
    a.reduce((n, c) => n + c.size, 0),
    data.length,
  );
  assert.equal(
    digest(new TextEncoder().encode(JSON.stringify(a))),
    "adbef1d7da77720747df961ff7792971637d27e95638f99ef5c0e5519d3162b6",
  );
});
test("verified ingest / exact streaming reconstruction / idempotent manifest and chunk dedupe", async () => {
  const s = new Memory();
  const first = await ingest(s, "a", "r", oid, data.length, stream(data));
  const m = await loadManifest(s, "a", "r", oid);
  assert.ok(m);
  assert.deepEqual(
    new Uint8Array(await new Response(download(s, "a", m)).arrayBuffer()),
    data,
  );
  const second = await ingest(s, "a", "r", oid, data.length, stream(data));
  assert.equal(second.newChunkBytes, 0);
  assert.equal(second.manifestBytes, 0);
  assert.equal(first.logicalBytes, data.length);
});
test("same tenant different repo cannot discover manifest; different tenant has separate chunks", async () => {
  const s = new Memory();
  await ingest(s, "a", "r", oid, data.length, stream(data));
  assert.equal(await loadManifest(s, "a", "other", oid), null);
  assert.equal(await loadManifest(s, "b", "r", oid), null);
  const second = await ingest(s, "b", "r", oid, data.length, stream(data));
  assert.equal(second.newChunkBytes, data.length);
});
for (const which of ["SHA", "short", "long", "interrupted"] as const)
  test(`failed ${which} ingest never publishes`, async () => {
    const s = new Memory();
    let body = stream(which === "short" ? data.subarray(0, 100) : data);
    const expected = which === "SHA" ? "a".repeat(64) : oid;
    let size = which === "long" ? 100 : data.length;
    if (which === "interrupted") {
      let i = 0;
      body = new ReadableStream({
        pull(c) {
          if (i++) c.error(new Error("disconnect"));
          else c.enqueue(data.subarray(0, CDC.max));
        },
      });
    }
    await assert.rejects(ingest(s, "a", "r", expected, size, body));
    assert.equal(await s.get(manifestKey("a", "r", expected)), null);
  });
test("concurrent duplicate ingest has one immutable publication", async () => {
  const s = new Memory();
  await Promise.all([
    ingest(s, "a", "r", oid, data.length, stream(data)),
    ingest(s, "a", "r", oid, data.length, stream(data)),
  ]);
  assert.ok(await loadManifest(s, "a", "r", oid));
});
for (const which of ["missing", "corrupt", "length", "order"] as const)
  test(`download detects ${which} chunks or manifest`, async () => {
    const s = new Memory();
    await ingest(s, "a", "r", oid, data.length, stream(data));
    const m = (await loadManifest(s, "a", "r", oid))!;
    const key = chunkKey("a", m.chunks[0].hash);
    if (which === "missing") s.objects.delete(key);
    if (which === "corrupt") s.objects.get(key)![0] ^= 1;
    if (which === "length")
      s.objects.set(key, s.objects.get(key)!.slice(0, -1));
    if (which === "order") m.chunks.reverse();
    await assert.rejects(new Response(download(s, "a", m)).arrayBuffer());
  });
test("manifest rejects traversal, unknown version, inconsistent bounds/length and excessive entries", () => {
  const valid = { ...CDC, oid: digest(new Uint8Array()), size: 0, chunks: [] };
  for (const m of [
    { ...valid, version: 2 },
    { ...valid, size: 1 },
    { ...valid, max: 2 },
    { ...valid, size: 1, chunks: [{ hash: "../../other", size: 1 }] },
    { ...valid, chunks: Array(1000).fill({ hash: oid, size: 1 }) },
  ])
    assert.throws(() => validateManifest(m, valid.oid));
  assert.throws(() => manifestKey("../tenant", "r", oid));
});
test("zero-byte LFS object checks SHA and roundtrips", async () => {
  const s = new Memory(),
    d = new Uint8Array();
  const id = digest(d);
  await ingest(s, "a", "r", id, 0, stream(d));
  assert.equal(
    (
      await new Response(
        download(s, "a", (await loadManifest(s, "a", "r", id))!),
      ).arrayBuffer()
    ).byteLength,
    0,
  );
});
test("corrupt preexisting content-addressed chunk prevents publication", async () => {
  const s = new Memory();
  await ingest(s, "a", "r", oid, data.length, stream(data));
  await s.delete(manifestKey("a", "r", oid));
  const m = [...s.objects.keys()].find((k) => k.includes("/chunks/"))!;
  s.objects.get(m)![0] ^= 1;
  await assert.rejects(ingest(s, "a", "r", oid, data.length, stream(data)));
  assert.equal(await loadManifest(s, "a", "r", oid), null);
});
