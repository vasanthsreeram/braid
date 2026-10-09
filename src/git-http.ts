// Git smart HTTP only: no repository code is evaluated. The native server atomically
// compares the supplied old ref before applying the one requested fast-forward.
import { check, readBytes } from "./storage.ts";
import { sha1 } from "@noble/hashes/legacy.js";
import { SHA, ZERO } from "./review.ts";
const enc = new TextEncoder(),
  dec = new TextDecoder();
export const pkt = (value: string) =>
  (enc.encode(value).length + 4).toString(16).padStart(4, "0") + value;
export interface GitCredential {
  remote: string;
  plaintext?: string;
}
async function transferHTTP(
  source: GitCredential,
  target: GitCredential,
  updates: { ref: string; base: string; candidate: string }[],
  have: string,
  maxBytes: number,
  request = fetch,
) {
  check(
    updates.length > 0 &&
      updates.length <= 512 &&
      updates.every(
        (u) => SHA.test(u.base) && SHA.test(u.candidate) && validRef(u.ref),
      ),
    422,
    "Invalid publication",
  );
  const signal = AbortSignal.timeout(90000);
  const call = async (c: GitCredential, service: string, body: BodyInit) => {
    const r = await request(c.remote + "/" + service, {
      method: "POST",
      redirect: "manual",
      signal,
      headers: {
        ...(c.plaintext ? { authorization: "Bearer " + c.plaintext } : {}),
        "content-type": "application/x-" + service + "-request",
        accept: "application/x-" + service + "-result",
      },
      body,
      duplex: "half",
    } as RequestInit);
    check(r.ok && r.body, 502, `Git ${service} failed (${r.status})`);
    return r;
  };
  const wants = [...new Set(updates.map((u) => u.candidate))];
  const want =
    wants
      .map((sha, i) => pkt(`want ${sha}${i === 0 ? " ofs-delta" : ""}\n`))
      .join("") +
    "0000" +
    (have === ZERO ? "" : pkt(`have ${have}\n`)) +
    pkt("done\n");
  const upstream = await call(source, "git-upload-pack", want);
  const reader = upstream.body!.getReader();
  let pending = new Uint8Array(0);
  async function ensure(n: number) {
    while (pending.length < n) {
      const v = await reader.read();
      check(!v.done, 502, "Truncated Git pack response");
      const next = new Uint8Array(pending.length + v.value.length);
      next.set(pending);
      next.set(v.value, pending.length);
      pending = next;
    }
  }
  try {
    // Without side-band the ACK/NAK packet(s) precede the raw pack. No thin-pack.
    for (let i = 0; i < 16; i++) {
      await ensure(4);
      if (dec.decode(pending.slice(0, 4)) === "PACK") break;
      const h = dec.decode(pending.slice(0, 4));
      check(/^[a-f0-9]{4}$/.test(h), 502, "Invalid Git response");
      const length = parseInt(h, 16);
      check(length >= 4 && length <= 1024, 502, "Invalid Git negotiation");
      await ensure(length);
      const line = dec.decode(pending.slice(4, length));
      check(/^(ACK |NAK\n)/.test(line), 502, "Git negotiation rejected");
      pending = pending.slice(length);
    }
    await ensure(4);
    check(dec.decode(pending.slice(0, 4)) === "PACK", 502, "Missing pack");
    const prefix = enc.encode(
      updates
        .map((u, i) =>
          pkt(
            `${u.base} ${u.candidate} ${u.ref}${i === 0 ? "\0report-status" : ""}`,
          ),
        )
        .join("") + "0000",
    );
    let sentPrefix = false,
      total = 0,
      tail = new Uint8Array(0);
    const hash = sha1.create();
    const equal = (a: Uint8Array, b: Uint8Array) =>
      a.length === b.length && a.every((v, i) => v === b[i]);
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        if (!sentPrefix) {
          sentPrefix = true;
          controller.enqueue(prefix);
          return;
        }
        while (true) {
          const v = pending.length
            ? { done: false, value: pending }
            : await reader.read();
          pending = new Uint8Array(0);
          if (v.done) {
            check(tail.length === 24, 502, "Truncated Git pack checksum");
            // Native Artifacts currently appends a protocol flush to an unbanded pack.
            // Keep only 24 trailing bytes and verify SHA-1 to distinguish framing from checksum data.
            if (
              dec.decode(tail.slice(-4)) === "0000" &&
              equal(hash.clone().digest(), tail.slice(0, 20))
            ) {
              controller.enqueue(tail.slice(0, 20));
              total -= 4;
            } else {
              check(
                equal(hash.update(tail.slice(0, 4)).digest(), tail.slice(4)),
                502,
                "Git pack checksum mismatch",
              );
              controller.enqueue(tail);
            }
            controller.close();
            return;
          }
          total += v.value!.length;
          check(total <= maxBytes, 413, "Git pack exceeds transfer limit");
          const combined = new Uint8Array(tail.length + v.value!.length);
          combined.set(tail);
          combined.set(v.value!, tail.length);
          if (combined.length <= 24) {
            tail = combined;
            continue;
          }
          const emitted = combined.slice(0, -24);
          tail = combined.slice(-24);
          hash.update(emitted);
          controller.enqueue(emitted);
          return;
        }
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });
    const pushed = await call(target, "git-receive-pack", body);
    const reply = dec.decode(await readBytes(pushed.body!, 64 * 1024));
    // Exact packet payloads are required; HTTP 200 alone does not mean a merge succeeded.
    const lines: string[] = [];
    for (let pos = 0; pos < reply.length; ) {
      const h = reply.slice(pos, pos + 4);
      check(/^[a-f0-9]{4}$/.test(h), 502, "Malformed push receipt");
      const n = parseInt(h, 16);
      pos += 4;
      if (!n) break;
      check(
        n >= 4 && pos + n - 4 <= reply.length,
        502,
        "Truncated push receipt",
      );
      lines.push(reply.slice(pos, pos + n - 4));
      pos += n - 4;
    }
    check(
      lines.includes("unpack ok\n") &&
        updates.every((u) => lines.includes(`ok ${u.ref}\n`)),
      409,
      "Canonical push rejected; inspect head before retrying",
    );
    return { packBytes: total, receipt: lines };
  } finally {
    await reader.cancel().catch(() => {});
  }
}

export function validRef(ref: string) {
  return (
    /^refs\/(heads|tags)\/[A-Za-z0-9_][A-Za-z0-9_./-]{0,255}$/.test(ref) &&
    !ref.includes("..") &&
    !ref.includes("//") &&
    !ref.endsWith("/") &&
    !ref.endsWith(".") &&
    !ref.split("/").some((p) => p.startsWith(".") || p.endsWith(".lock"))
  );
}
export async function advertisedRefs(
  c: GitCredential,
  request = fetch,
  service = "git-upload-pack",
) {
  const r = await request(c.remote + "/info/refs?service=" + service, {
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
    headers: c.plaintext ? { authorization: "Bearer " + c.plaintext } : {},
  });
  check(r.ok && r.body, 502, "Git refs unavailable");
  const bytes = await readBytes(r.body, 1024 * 1024);
  let pos = 0,
    defaultBranch = "main";
  const refs: { ref: string; sha: string }[] = [];
  while (pos < bytes.length) {
    const h = dec.decode(bytes.slice(pos, pos + 4));
    check(/^[a-f0-9]{4}$/.test(h), 502, "Invalid ref advertisement");
    const n = parseInt(h, 16);
    pos += 4;
    if (!n) continue;
    check(
      n >= 4 && pos + n - 4 <= bytes.length,
      502,
      "Truncated ref advertisement",
    );
    const line = dec.decode(bytes.slice(pos, pos + n - 4));
    pos += n - 4;
    if (line.startsWith("# service=")) continue;
    const [entry, capabilities = ""] = line
      .replace(/\n$/, " ")
      .trimEnd()
      .split("\0");
    const symref = capabilities.match(
      /(?:^| )symref=HEAD:refs\/heads\/([^ ]+)/,
    );
    if (symref) defaultBranch = symref[1];
    const space = entry.indexOf(" ");
    const sha = entry.slice(0, space),
      ref = entry.slice(space + 1);
    if (
      ref === "HEAD" ||
      ref.endsWith("^{}") ||
      sha === ZERO ||
      (!ref.startsWith("refs/heads/") && !ref.startsWith("refs/tags/"))
    )
      continue;
    check(SHA.test(sha) && validRef(ref), 422, "Unsupported source ref name");
    refs.push({ ref, sha });
    check(refs.length <= 512, 413, "Import limited to 512 branch/tag refs");
  }
  refs.sort((a, b) => a.ref.localeCompare(b.ref));
  check(
    new Set(refs.map((r) => r.ref)).size === refs.length,
    502,
    "Duplicate source ref",
  );
  return { defaultBranch, refs };
}
export async function publishHTTP(
  source: GitCredential,
  target: GitCredential,
  ref: string,
  base: string,
  candidate: string,
  request = fetch,
) {
  const actual = await advertisedRefs(target, request, "git-receive-pack");
  check(
    (actual.refs.find((r) => r.ref === ref)?.sha ?? ZERO) === base,
    409,
    "Canonical head moved; native ref comparison rejected stale publisher",
  );
  return transferHTTP(
    source,
    target,
    [{ ref, base, candidate }],
    base,
    64 * 1024 * 1024,
    request,
  );
}
export async function importHTTP(
  source: GitCredential,
  target: GitCredential,
  request = fetch,
) {
  const before = await advertisedRefs(source, request),
    existing = await advertisedRefs(target, request);
  check(existing.refs.length === 0, 409, "Import destination must be empty");
  check(before.refs.length > 0, 422, "Empty source repository");
  const result = await transferHTTP(
    source,
    target,
    before.refs.map((r) => ({ ref: r.ref, base: ZERO, candidate: r.sha })),
    ZERO,
    128 * 1024 * 1024,
    request,
  );
  const after = await advertisedRefs(source, request),
    destination = await advertisedRefs(target, request);
  check(
    JSON.stringify(before.refs) === JSON.stringify(after.refs),
    409,
    "Source moved during import; destination retained for reconciliation",
  );
  check(
    JSON.stringify(before.refs) === JSON.stringify(destination.refs),
    502,
    "Imported branch/tag tips disagree",
  );
  return { ...result, ...before, gitOnly: true };
}

// Copies source branch/tag tips that the destination lacks or disagrees on.
// Used after the native importer, which brings over only part of the refs.
export async function completeRefsHTTP(
  source: GitCredential,
  target: GitCredential,
  request = fetch,
) {
  const want = await advertisedRefs(source, request),
    have = await advertisedRefs(target, request);
  const current = new Map(have.refs.map((r) => [r.ref, r.sha]));
  const updates = want.refs
    .filter((r) => current.get(r.ref) !== r.sha)
    .map((r) => ({ ref: r.ref, base: current.get(r.ref) ?? ZERO, candidate: r.sha }));
  // Advertise one tip the destination already has so the pack omits shared history.
  const known = have.refs.find((r) => want.refs.some((w) => w.sha === r.sha));
  if (updates.length)
    await transferHTTP(
      source,
      target,
      updates,
      known?.sha ?? ZERO,
      128 * 1024 * 1024,
      request,
    );
  const destination = await advertisedRefs(target, request);
  check(
    JSON.stringify(want.refs) === JSON.stringify(destination.refs),
    502,
    "Imported branch/tag tips disagree",
  );
  return updates.length;
}
