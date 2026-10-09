import { SHA, ZERO } from "./review.ts";
import {
  pkt,
  validRef,
  advertisedRefs,
  type GitCredential,
} from "./git-http.ts";
import { check, readBytes } from "./storage.ts";
import { sha1 } from "@noble/hashes/legacy.js";
const enc = new TextEncoder(),
  dec = new TextDecoder();
export const MAX_BUNDLE = 100 * 1024 * 1024;
// Stream only an unrestricted v2 SHA-1 bundle. Prerequisites, arbitrary source
// URLs, ref deletions and non-branch/tag refs are rejected before target creation.
export async function openBundle(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  let pending = new Uint8Array(0),
    headerEnd = -1;
  try {
    while (headerEnd < 0) {
      const next = await reader.read();
      check(!next.done, 422, "Truncated bundle");
      const b = new Uint8Array(pending.length + next.value.length);
      b.set(pending);
      b.set(next.value, pending.length);
      pending = b;
      for (let i = 0; i < Math.min(pending.length - 1, 65536); i++)
        if (pending[i] === 10 && pending[i + 1] === 10) {
          headerEnd = i + 2;
          break;
        }
      check(
        headerEnd >= 0 || pending.length <= 65536,
        413,
        "Bundle header exceeds 64 KiB",
      );
    }
    const lines = dec.decode(pending.subarray(0, headerEnd - 1)).split("\n");
    check(
      lines.shift() === "# v2 git bundle",
      422,
      "Only unrestricted v2 SHA-1 Git bundles are supported",
    );
    const refs = lines.filter(Boolean).map((l) => {
      const sha = l.slice(0, 40),
        ref = l.slice(41);
      check(
        SHA.test(sha) && l[40] === " " && validRef(ref),
        422,
        "Bundle has prerequisites or unsupported refs",
      );
      return { ref, sha };
    });
    check(
      refs.length > 0 &&
        refs.length <= 512 &&
        new Set(refs.map((r) => r.ref)).size === refs.length,
      422,
      "Expected 1–512 unique branch/tag refs",
    );
    pending = pending.slice(headerEnd);
    return {
      refs: refs.sort((a, b) => a.ref.localeCompare(b.ref)),
      reader,
      pending,
    };
  } catch (e) {
    await reader.cancel().catch(() => {});
    throw e;
  }
}
export async function pushBundle(
  bundle: Awaited<ReturnType<typeof openBundle>>,
  target: GitCredential,
  request = fetch,
) {
  let { pending } = bundle;
  let total = 0,
    tail = new Uint8Array(0),
    first = true,
    packStart = true;
  const hash = sha1.create();
  const prefix = enc.encode(
    bundle.refs
      .map((r, i) =>
        pkt(`${ZERO} ${r.sha} ${r.ref}${i === 0 ? "\0report-status" : ""}`),
      )
      .join("") + "0000",
  );
  const stream = new ReadableStream<Uint8Array>({
    async pull(c) {
      try {
        if (first) {
          first = false;
          c.enqueue(prefix);
          return;
        }
        for (;;) {
          const n = pending.length
            ? { done: false, value: pending }
            : await bundle.reader.read();
          pending = new Uint8Array(0);
          if (n.done) {
            check(
              tail.length === 20 &&
                hash.digest().every((b, i) => b === tail[i]),
              422,
              "Bundle pack checksum mismatch",
            );
            c.enqueue(tail);
            c.close();
            return;
          }
          const b = n.value!;
          total += b.length;
          check(
            total <= MAX_BUNDLE,
            413,
            "Compressed bundle exceeds 100 MiB upload limit",
          );
          const merged = new Uint8Array(tail.length + b.length);
          merged.set(tail);
          merged.set(b, tail.length);
          if (packStart && merged.length >= 12) {
            check(
              dec.decode(merged.slice(0, 4)) === "PACK" &&
                new DataView(merged.buffer).getUint32(4) === 2,
              422,
              "Expected Git pack v2",
            );
            check(
              new DataView(merged.buffer).getUint32(8) <= 200000,
              413,
              "Bundle exceeds 200000 objects",
            );
            packStart = false;
          }
          if (merged.length <= 20) {
            tail = merged;
            continue;
          }
          const out = merged.slice(0, -20);
          hash.update(out);
          tail = merged.slice(-20);
          c.enqueue(out);
          return;
        }
      } catch (e) {
        await bundle.reader.cancel().catch(() => {});
        c.error(e);
      }
    },
    cancel(reason) {
      return bundle.reader.cancel(reason);
    },
  });
  try {
    const response = await request(target.remote + "/git-receive-pack", {
      method: "POST",
      headers: {
        authorization: "Bearer " + target.plaintext,
        "content-type": "application/x-git-receive-pack-request",
        accept: "application/x-git-receive-pack-result",
      },
      body: stream,
      redirect: "manual",
      signal: AbortSignal.timeout(120000),
      duplex: "half",
    } as RequestInit);
    check(response.ok && response.body, 502, "Native bundle receiver failed");
    const bytes = await readBytes(response.body, 65536);
    const reply = dec.decode(bytes);
    const lines: string[] = [];
    let pos = 0;
    while (pos < reply.length) {
      const h = reply.slice(pos, pos + 4);
      check(/^[0-9a-f]{4}$/.test(h), 502, "Invalid native receipt");
      const n = parseInt(h, 16);
      pos += 4;
      if (n === 0) continue;
      check(
        n >= 4 && pos + n - 4 <= reply.length,
        502,
        "Invalid native receipt",
      );
      lines.push(reply.slice(pos, pos + n - 4));
      pos += n - 4;
    }
    check(
      lines.includes("unpack ok\n") &&
        bundle.refs.every((r) => lines.includes(`ok ${r.ref}\n`)),
      502,
      "Native object/ref validation failed; import retained as failed",
    );
    const destination = await advertisedRefs(target, request);
    check(
      JSON.stringify(destination.refs) === JSON.stringify(bundle.refs),
      502,
      "Destination refs differ from uploaded bundle",
    );
    return { packBytes: total, refs: destination.refs };
  } finally {
    await bundle.reader.cancel().catch(() => {});
  }
}
