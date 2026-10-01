import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
export const digest = (bytes: Uint8Array) => bytesToHex(sha256(bytes));
export const HASH = /^[0-9a-f]{64}$/;
export const ID = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
export const MAX_OBJECT = 256 * 1024 * 1024;
export class Fault extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function check(
  condition: unknown,
  status: number,
  message: string,
): asserts condition {
  if (!condition) throw new Fault(status, message);
}
export interface ObjectStore {
  get(key: string): Promise<ReadableStream<Uint8Array> | null>;
  putIfAbsent(key: string, bytes: Uint8Array): Promise<boolean>;
  delete(key: string): Promise<void>;
  listManifests(tenant: string, repo: string): Promise<string[]>;
}
export interface Chunk {
  hash: string;
  size: number;
}
export interface Manifest {
  version: 1;
  algorithm: "gear32-v1";
  min: number;
  target: number;
  max: number;
  oid: string;
  size: number;
  chunks: Chunk[];
}
export const CDC = Object.freeze({
  version: 1,
  algorithm: "gear32-v1",
  min: 512 * 1024,
  target: 1024 * 1024,
  max: 4 * 1024 * 1024,
} as const);
// Deterministic 32-bit gear rolling hash. Fixed table derived from xorshift32(seed=0x51f15e).
// This is a documented gear CDC equivalent, not a claim to implement normalized FastCDC.
export const GEAR = (() => {
  let x = 0x51f15e;
  return Uint32Array.from({ length: 256 }, () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return x >>> 0;
  });
})();
export async function* chunks(
  stream: ReadableStream<Uint8Array>,
  params = CDC,
  limit = MAX_OBJECT,
): AsyncGenerator<Uint8Array> {
  const reader = stream.getReader();
  let buffer = new Uint8Array(params.max),
    n = 0,
    rolling = 0,
    total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      check(total <= limit, 413, "Object exceeds upload envelope");
      for (const byte of value) {
        buffer[n++] = byte;
        rolling = ((rolling << 1) + GEAR[byte]) >>> 0;
        if (
          n >= params.min &&
          ((rolling & (params.target - 1)) === 0 || n === params.max)
        ) {
          yield buffer.slice(0, n);
          n = 0;
          rolling = 0;
        }
      }
    }
    if (n) yield buffer.slice(0, n);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
export function root(tenant: string) {
  check(ID.test(tenant), 400, "Invalid tenant");
  return `v1/tenants/${tenant}`;
}
export function manifestKey(tenant: string, repo: string, oid: string) {
  check(ID.test(repo) && HASH.test(oid), 400, "Invalid object");
  return `${root(tenant)}/repos/${repo}/manifests/${oid}`;
}
export function chunkKey(tenant: string, hash: string) {
  check(HASH.test(hash), 500, "Invalid chunk hash");
  return `${root(tenant)}/chunks/${hash}`;
}
export async function readBytes(
  stream: ReadableStream<Uint8Array>,
  max: number,
) {
  const reader = stream.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const v = await reader.read();
      if (v.done) break;
      size += v.value.length;
      check(size <= max, 500, "Stored object exceeds bounds");
      parts.push(v.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    bytes.set(part, offset);
    offset += part.length;
  }
  return bytes;
}
export function validateManifest(v: unknown, oid: string): Manifest {
  check(!!v && typeof v === "object", 500, "Corrupt manifest");
  const m = v as Manifest;
  check(
    m.version === 1 &&
      m.algorithm === CDC.algorithm &&
      m.min === CDC.min &&
      m.target === CDC.target &&
      m.max === CDC.max &&
      m.oid === oid &&
      HASH.test(m.oid),
    500,
    "Corrupt manifest",
  );
  check(
    Number.isSafeInteger(m.size) &&
      m.size >= 0 &&
      m.size <= MAX_OBJECT &&
      Array.isArray(m.chunks) &&
      m.chunks.length <= Math.ceil(MAX_OBJECT / CDC.min) + 1,
    500,
    "Corrupt manifest",
  );
  let sum = 0;
  m.chunks.forEach((c, i) => {
    check(
      c &&
        typeof c.hash === "string" &&
        HASH.test(c.hash) &&
        Number.isSafeInteger(c.size) &&
        c.size > 0 &&
        c.size <= CDC.max &&
        (i === m.chunks.length - 1 || c.size >= CDC.min),
      500,
      "Corrupt chunk entry",
    );
    sum += c.size;
  });
  check(
    sum === m.size && (m.size !== 0 || m.chunks.length === 0),
    500,
    "Corrupt manifest length",
  );
  return m;
}
export async function loadManifest(
  store: ObjectStore,
  tenant: string,
  repo: string,
  oid: string,
): Promise<Manifest | null> {
  const body = await store.get(manifestKey(tenant, repo, oid));
  if (!body) return null;
  try {
    return validateManifest(
      JSON.parse(new TextDecoder().decode(await readBytes(body, 128 * 1024))),
      oid,
    );
  } catch (e) {
    if (e instanceof Fault) throw e;
    throw new Fault(500, "Corrupt manifest");
  }
}
export interface IngestMetrics {
  logicalBytes: number;
  newChunkBytes: number;
  newChunks: number;
  chunkCount: number;
  manifestBytes: number;
}
export async function ingest(
  store: ObjectStore,
  tenant: string,
  repo: string,
  oid: string,
  size: number,
  stream: ReadableStream<Uint8Array>,
): Promise<IngestMetrics> {
  check(
    HASH.test(oid) &&
      Number.isSafeInteger(size) &&
      size >= 0 &&
      size <= MAX_OBJECT,
    422,
    "Invalid OID or size",
  );
  const whole = sha256.create();
  const entries: Chunk[] = [];
  let received = 0,
    newChunkBytes = 0,
    newChunks = 0;
  for await (const bytes of chunks(stream, CDC, size)) {
    received += bytes.length;
    whole.update(bytes);
    const hash = digest(bytes);
    entries.push({ hash, size: bytes.length });
    if (await store.putIfAbsent(chunkKey(tenant, hash), bytes)) {
      newChunkBytes += bytes.length;
      newChunks++;
    }
    // A preexisting chunk must also be verified: never publish a manifest over corrupt storage.
    else {
      const body = await store.get(chunkKey(tenant, hash));
      check(body, 500, "Missing chunk");
      const existing = await readBytes(body, CDC.max);
      check(
        existing.length === bytes.length && digest(existing) === hash,
        500,
        "Corrupt chunk",
      );
    }
  }
  check(
    received === size && bytesToHex(whole.digest()) === oid,
    422,
    "Whole-object SHA256 or size mismatch",
  );
  const m: Manifest = { ...CDC, oid, size, chunks: entries };
  const encoded = new TextEncoder().encode(JSON.stringify(m));
  // Conditional create is publication. Failed/abandoned ingests have only unreachable chunks.
  const created = await store.putIfAbsent(
    manifestKey(tenant, repo, oid),
    encoded,
  );
  if (!created) {
    const prior = await loadManifest(store, tenant, repo, oid);
    check(
      prior && JSON.stringify(prior) === JSON.stringify(m),
      409,
      "Immutable manifest conflict",
    );
  }
  return {
    logicalBytes: received,
    newChunkBytes,
    newChunks,
    chunkCount: entries.length,
    manifestBytes: created ? encoded.length : 0,
  };
}
export function download(
  store: ObjectStore,
  tenant: string,
  manifest: Manifest,
): ReadableStream<Uint8Array> {
  let i = 0,
    total = 0;
  const whole = sha256.create();
  // Verify each bounded chunk before emitting, then verify whole order/hash before the LAST chunk is emitted.
  // A corrupt earlier chunk aborts the stream. HTTP cannot change status once headers have gone out.
  return new ReadableStream({
    async pull(controller) {
      try {
        if (i === manifest.chunks.length) {
          check(
            total === manifest.size &&
              bytesToHex(whole.digest()) === manifest.oid,
            500,
            "Whole-object integrity failure",
          );
          controller.close();
          return;
        }
        const c = manifest.chunks[i++];
        const body = await store.get(chunkKey(tenant, c.hash));
        check(body, 500, "Missing chunk");
        const b = await readBytes(body, CDC.max);
        check(
          b.length === c.size && digest(b) === c.hash,
          500,
          "Chunk integrity failure",
        );
        whole.update(b);
        total += b.length;
        if (i === manifest.chunks.length) {
          check(
            total === manifest.size &&
              bytesToHex(whole.clone().digest()) === manifest.oid,
            500,
            "Whole-object integrity failure",
          );
        }
        controller.enqueue(b);
      } catch (e) {
        controller.error(e);
      }
    },
  });
}

export async function copyManifests(
  store: ObjectStore,
  tenant: string,
  source: string,
  target: string,
) {
  const oids = await store.listManifests(tenant, source);
  check(oids.length <= 128, 409, "Task fork limited to 128 LFS manifests");
  for (const oid of oids) {
    check(HASH.test(oid), 500, "Invalid stored manifest key");
    const m = await loadManifest(store, tenant, source, oid);
    check(m, 500, "Manifest disappeared");
    await store.putIfAbsent(
      manifestKey(tenant, target, oid),
      new TextEncoder().encode(JSON.stringify(m)),
    );
  }
}
