import { open, mkdir, writeFile, copyFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
export const SEED = 0x51f15e;
export async function fileHash(path: string) {
  const h = createHash("sha256");
  for await (const b of createReadStream(path)) h.update(b);
  return h.digest("hex");
}
export async function largeFixtures(dir: string, mib = 112) {
  if (mib < 101 || mib > 128) throw Error("Fixture envelope is 101–128 MiB");
  await mkdir(dir, { recursive: true });
  const base = join(dir, "base.bin");
  const handle = await open(base, "w");
  let x = SEED;
  const b = Buffer.alloc(1024 * 1024);
  try {
    for (let i = 0; i < mib; i++) {
      for (let j = 0; j < b.length; j++) {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        b[j] = x & 255;
      }
      await handle.write(b);
    }
  } finally {
    await handle.close();
  }
  const sparse = join(dir, "sparse.bin");
  await copyFile(base, sparse);
  const s = await open(sparse, "r+");
  try {
    for (const p of [9, 41, 83])
      await s.write(Buffer.alloc(4096, p), 0, 4096, p * 1024 * 1024 + 123);
  } finally {
    await s.close();
  }
  const inserted = join(dir, "insert.bin"),
    out = await open(inserted, "w");
  try {
    let total = 0,
      done = false;
    for await (const part of createReadStream(sparse, {
      highWaterMark: 65536,
    })) {
      const at = 17 * 1024 * 1024 + 71;
      if (!done && total + part.length >= at) {
        const n = at - total;
        await out.write(part.subarray(0, n));
        await out.write(
          Buffer.from("cf-native-forge-insertion-v1\n".repeat(128)),
        );
        await out.write(part.subarray(n));
        done = true;
      } else await out.write(part);
      total += part.length;
    }
  } finally {
    await out.close();
  }
  // Different independent high-entropy compressed bytes: CDC cannot deduplicate this negative control.
  const control = join(dir, "entropy.gz"),
    c = await open(control, "w");
  x = SEED ^ 0xabcdef;
  try {
    for (let i = 0; i < mib; i++) {
      for (let j = 0; j < b.length; j++) {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        b[j] = x & 255;
      }
      await c.write(gzipSync(b, { level: 6, mtime: 0 } as any));
    }
  } finally {
    await c.close();
  }
  const changedControl = join(dir, "entropy-edited.gz"),
    e = await open(changedControl, "w");
  x = SEED ^ 0xabcdef;
  try {
    for (let i = 0; i < mib; i++) {
      for (let j = 0; j < b.length; j++) {
        x ^= x << 13;
        x ^= x >>> 17;
        x ^= x << 5;
        b[j] = x & 255;
      }
      b[100] ^= 1;
      await e.write(gzipSync(b, { level: 6, mtime: 0 } as any));
    }
  } finally {
    await e.close();
  }
  const files = [base, sparse, inserted, control, changedControl];
  return await Promise.all(
    files.map(async (path) => ({
      path,
      name: path.split("/").pop()!,
      sha256: await fileHash(path),
    })),
  );
}
export async function sourceFixtures(dir: string) {
  await mkdir(join(dir, "src"), { recursive: true });
  const hashes = [];
  for (let i = 0; i < 256; i++) {
    const text =
      `// synthetic source fixture v1 seed=${SEED} file=${i}\n` +
      Array.from(
        { length: 40 },
        (_, j) => `export const value_${j} = ${i * 100 + j};\n`,
      ).join("");
    const name = `src/file-${String(i).padStart(3, "0")}.ts`;
    await writeFile(join(dir, name), text);
    hashes.push({
      name,
      sha256: createHash("sha256").update(text).digest("hex"),
      bytes: Buffer.byteLength(text),
    });
  }
  await writeFile(
    join(dir, "README.md"),
    "# Synthetic benchmark v1\nNo personal source.\n",
  );
  return hashes;
}
