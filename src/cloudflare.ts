import type { Artifacts, R2Bucket } from "@cloudflare/workers-types";
import { AwsClient } from "aws4fetch";
import { publishHTTP, importHTTP, advertisedRefs } from "./git-http.ts";
import type { GitPlane, Ticket } from "./contracts.ts";
import type { ObjectStore } from "./storage.ts";
import { check, digest, root, ID } from "./storage.ts";
export class R2Store implements ObjectStore {
  constructor(private bucket: R2Bucket) {}
  async get(key: string) {
    const r = await this.bucket.get(key);
    return (r?.body as unknown as ReadableStream<Uint8Array>) ?? null;
  }
  async putIfAbsent(key: string, bytes: Uint8Array) {
    return !!(await this.bucket.put(key, bytes, {
      onlyIf: { etagDoesNotMatch: "*" },
      sha256: digest(bytes),
    }));
  }
  async listManifests(tenant: string, repo: string) {
    check(ID.test(repo), 400, "Invalid repository");
    const prefix = `${root(tenant)}/repos/${repo}/manifests/`;
    const page = await this.bucket.list({ prefix, limit: 129 });
    check(
      !page.truncated && page.objects.length <= 128,
      409,
      "Task fork limited to 128 LFS manifests",
    );
    return page.objects.map((o) => o.key.slice(prefix.length));
  }
  async delete(key: string) {
    await this.bucket.delete(key);
  }
}
export class NativeGit implements GitPlane {
  constructor(private artifacts: Artifacts) {}
  private async handle(name: string) {
    return (await this.artifacts.get(name)) as unknown as Awaited<
      ReturnType<Artifacts["get"]>
    > &
      Disposable;
  }
  private async discard(name: string, token: string) {
    using repo = await this.handle(name);
    await repo.revokeToken(token);
  }
  async refs(name: string) {
    const token = await this.token(name, "read");
    try {
      return (await advertisedRefs(token)).refs;
    } finally {
      await this.discard(name, token.id);
    }
  }
  async source(url: string) {
    return advertisedRefs({ remote: url });
  }
  async seal(name: string) {
    using repo = await this.handle(name);
    for (const t of (await repo.listTokens()).tokens)
      await repo.revokeToken(t.id);
  }
  async create(name: string) {
    const r = await this.artifacts.create(name, { setDefaultBranch: "main" });
    await this.discard(name, r.token);
  }
  async import(name: string, url: string) {
    // Native importer first. Its full-history limit is smaller than Git repo storage.
    // Fallback streams a complete ordinary-Git pack; no shallow/history rewrite or filesystem.
    let result;
    try {
      result = await this.artifacts.import({
        source: { url },
        target: { name },
      });
    } catch (e: any) {
      if (
        e.numericCode !== 10402 &&
        e.code !== "MEMORY_LIMIT" &&
        !String(e.message).includes("40MB import limit")
      )
        throw e;
      // The physical name is a fresh app-reserved UUID. Do not replace any existing repo.
      result = await this.artifacts.create(name, {
        setDefaultBranch: (await advertisedRefs({ remote: url })).defaultBranch,
      });
      try {
        await importHTTP(
          { remote: url },
          { remote: result.remote, plaintext: result.token },
        );
      } finally {
        await this.discard(name, result.token);
      }
      return;
    }
    await this.discard(name, result.token);
    const token = await this.token(name, "read");
    try {
      const source = await advertisedRefs({ remote: url }),
        dest = await advertisedRefs(token);
      check(
        JSON.stringify(source.refs) === JSON.stringify(dest.refs),
        502,
        "Native import branch/tag tips disagree; intent retained",
      );
    } finally {
      await this.discard(name, token.id);
    }
  }
  async fork(source: string, target: string) {
    using repo = await this.handle(source);
    const r = await repo.fork(target, {
      defaultBranchOnly: false,
      readOnly: false,
    });
    await this.discard(target, r.token);
  }
  async info(name: string) {
    using repo = await this.handle(name);
    return repo.info();
  }
  async log(name: string, ref: string) {
    using repo = await this.handle(name);
    return (await repo.log({ ref, limit: 50 })).map((x) => ({
      ...x,
      sha: x.hash,
      tree: x.treeHash,
    }));
  }
  async tree(name: string, sha: string) {
    using repo = await this.handle(name);
    return repo.readTree(sha);
  }
  async file(name: string, ref: string, path: string) {
    using repo = await this.handle(name);
    return (await repo.readFile({ ref, path })) as unknown as Blob | null;
  }
  async revoke(name: string, token: string) {
    await this.discard(name, token);
  }
  async commit(name: string, sha: string) {
    using repo = await this.handle(name);
    const c = await repo.readCommit(sha);
    return c ? { ...c, sha: c.hash, tree: c.treeHash } : null;
  }
  async publish(
    source: string,
    target: string,
    ref: string,
    base: string,
    candidate: string,
  ) {
    const read = await this.token(source, "read");
    let write: any;
    try {
      write = await this.token(target, "write");
      await publishHTTP(read, write, ref, base, candidate);
    } finally {
      await this.discard(source, read.id);
      if (write) await this.discard(target, write.id);
    }
  }
  async token(name: string, scope: "read" | "write") {
    using repo = await this.handle(name);
    return {
      ...(await repo.createToken(scope, 60)),
      remote: (await repo.info()).remote,
    };
  }
}
export interface SigningConfig {
  R2_ACCESS_KEY_ID?: string;
  R2_SECRET_ACCESS_KEY?: string;
  R2_ACCOUNT_ID?: string;
  R2_BUCKET_NAME?: string;
}
export function directUpload(c: SigningConfig) {
  return async (t: Ticket) => {
    check(
      c.R2_ACCESS_KEY_ID &&
        c.R2_SECRET_ACCESS_KEY &&
        /^[a-f0-9]{32}$/.test(c.R2_ACCOUNT_ID ?? "") &&
        /^cf-native-forge-[a-z0-9-]+$/.test(c.R2_BUCKET_NAME ?? ""),
      503,
      "R2 direct-upload credentials unavailable",
    );
    const signer = new AwsClient({
      accessKeyId: c.R2_ACCESS_KEY_ID,
      secretAccessKey: c.R2_SECRET_ACCESS_KEY,
      service: "s3",
      region: "auto",
    });
    const url = new URL(
      `https://${c.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${c.R2_BUCKET_NAME}/${t.key}`,
    );
    url.searchParams.set("X-Amz-Expires", "600");
    const header = {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(t.size),
    };
    const signed = await signer.sign(url, {
      method: "PUT",
      headers: header,
      aws: { signQuery: true, allHeaders: true },
    });
    // Keep PUT authority object-scoped. Clients do not receive bucket credentials or any GET capability.
    return { href: signed.url, header };
  };
}
