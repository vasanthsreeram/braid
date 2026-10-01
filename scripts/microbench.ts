import {
  mkdir,
  rm,
  stat,
  copyFile,
  writeFile,
  readFile,
} from "node:fs/promises";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { createHash } from "node:crypto";
import { chunks, CDC, digest } from "../src/storage.ts";
import { fileHash } from "./fixtures.ts";
export async function microbench(
  files: { path: string; name: string; sha256: string }[],
  directory: string,
  reps: number,
) {
  const rows = [];
  const strategies = ["whole", "fixed-1MiB", "gear32-v1"];
  for (let rep = 1; rep <= reps; rep++) {
    const order = rep % 2 ? strategies : [...strategies].reverse();
    for (const strategy of order) {
      const dir = join(directory, `${rep}-${strategy}`);
      await mkdir(dir, { recursive: true });
      const seen = new Set<string>();
      for (const file of files) {
        const start = performance.now(),
          cpu = process.cpuUsage();
        let logicalBytes = 0,
          newPhysicalBytes = 0,
          puts = 0,
          gets = 0,
          newObjects = 0;
        const entries: { hash: string; size: number }[] = [];
        const save = async (bytes: Uint8Array) => {
          logicalBytes += bytes.length;
          const hash = digest(bytes);
          entries.push({ hash, size: bytes.length });
          puts++;
          if (!seen.has(hash)) {
            seen.add(hash);
            await writeFile(join(dir, hash), bytes);
            newPhysicalBytes += bytes.length;
            newObjects++;
          }
        };
        if (strategy === "whole") {
          const size = (await stat(file.path)).size;
          logicalBytes = size;
          const hash = await fileHash(file.path);
          entries.push({ hash, size });
          puts = 1;
          if (!seen.has(hash)) {
            seen.add(hash);
            await copyFile(file.path, join(dir, hash));
            newPhysicalBytes = size;
            newObjects = 1;
          }
        } else if (strategy === "gear32-v1") {
          const stream = Readable.toWeb(
            createReadStream(file.path, { highWaterMark: 65536 }),
          ) as ReadableStream<Uint8Array>;
          for await (const b of chunks(stream)) await save(b);
        } else {
          let parts: Buffer[] = [],
            total = 0;
          for await (const part of createReadStream(file.path, {
            highWaterMark: 65536,
          })) {
            parts.push(part);
            total += part.length;
            if (total === 1024 * 1024) {
              await save(Buffer.concat(parts));
              parts = [];
              total = 0;
            }
          }
          if (total) await save(Buffer.concat(parts));
        }
        const manifest = Buffer.from(
          JSON.stringify({
            version: 1,
            strategy,
            oid: file.sha256,
            size: logicalBytes,
            chunks: entries,
          }),
        );
        await writeFile(join(dir, file.name + ".json"), manifest);
        const ingestWallMs = performance.now() - start,
          ingestCpu = process.cpuUsage(cpu),
          readStart = performance.now(),
          readCpu = process.cpuUsage();
        const whole = createHash("sha256");
        let readBytes = 0;
        // Full streamed reconstruction and integrity verification; counted reads are simulated object-store operations.
        for (const e of entries) {
          gets++;
          const h = createHash("sha256");
          let n = 0;
          for await (const part of createReadStream(join(dir, e.hash), {
            highWaterMark: 65536,
          })) {
            n += part.length;
            readBytes += part.length;
            whole.update(part);
            h.update(part);
          }
          if (n !== e.size || h.digest("hex") !== e.hash)
            throw Error("Microbenchmark chunk corruption");
        }
        if (readBytes !== logicalBytes || whole.digest("hex") !== file.sha256)
          throw Error("Microbenchmark reconstruction mismatch");
        const downloadCpu = process.cpuUsage(readCpu);
        rows.push({
          repetition: rep,
          strategy,
          version: file.name,
          logicalBytes,
          newPhysicalBytes,
          manifestBytes: manifest.length,
          newObjects,
          chunkCount: entries.length,
          simulatedClassA: puts + 1,
          simulatedClassB: gets + 1,
          ingestWallMs,
          ingestCpuMs: (ingestCpu.user + ingestCpu.system) / 1000,
          downloadWallMs: performance.now() - readStart,
          downloadCpuMs: (downloadCpu.user + downloadCpu.system) / 1000,
          nodeMaxRssKiB: process.resourceUsage().maxRSS,
          correct: true,
          counters: "local simulated R2 API; not provider usage or invoices",
        });
      }
      await rm(dir, { recursive: true, force: true });
      console.log(
        `Microbenchmark ${rep}/${reps} ${strategy}: verified five versions.`,
      );
    }
  }
  return rows;
}
