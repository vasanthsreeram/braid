import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { request as httpRequest } from "node:http";
import { serveBenchmark } from "../scripts/benchmark-http-v2.ts";
import { git } from "../scripts/local.ts";
import { gitMeasured } from "../scripts/measure.ts";

test("benchmark transport requires app-authorized task capabilities and rechecks revoked identity", async () => {
  const directory = await mkdtemp(join(tmpdir(), "forge-bench-http-test-"));
  const service = await serveBenchmark(join(directory, "service"));
  const call = (path: string, body?: unknown, credential = service.token) =>
    fetch(service.url + path, {
      method: body === undefined ? "GET" : "POST",
      headers: {
        authorization: `Bearer ${credential}`,
        "content-type": "application/json",
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(15000),
    });
  try {
    const canonical = await (
      await call("/api/repos", { name: "private" })
    ).json();
    assert.equal(canonical.visibility, "private");
    const native = await (
      await call(`/api/repos/${canonical.id}/token`, { scope: "read" })
    ).json();
    assert.equal(native.provider, "local-bare-git");
    assert.equal(native.credential, undefined);
    assert.equal(
      (await call(`/git/${canonical.id}.git/info/refs?service=git-upload-pack`))
        .status,
      404,
    );
    service.enableTransport();
    assert.equal(
      (await call(`/api/repos/${canonical.id}/token`, { scope: "write" }))
        .status,
      403,
    );
    const task = await (
      await call(`/api/repos/${canonical.id}/tasks`, { name: "task" })
    ).json();
    const write = await (
      await call(`/api/repos/${task.id}/token`, { scope: "write" })
    ).json();
    const read = await (
      await call(`/api/repos/${task.id}/token`, { scope: "read" })
    ).json();
    assert.equal(
      (
        await call(
          `/git/${task.id}.git/info/refs?service=git-receive-pack`,
          undefined,
          read.credential,
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await call(
          `/git/${canonical.id}.git/info/refs?service=git-upload-pack`,
          undefined,
          read.credential,
        )
      ).status,
      401,
    );
    assert.equal(
      (
        await call(
          `/git/${task.id}.git/info/refs?service=git-upload-pack`,
          undefined,
          "invalid",
        )
      ).status,
      401,
    );
    const wrongHostStatus = await new Promise<number | undefined>(
      (resolve, reject) => {
        const request = httpRequest(
          write.remote + "/info/refs?service=git-upload-pack",
          {
            headers: { host: "example.invalid" },
            timeout: 15000,
          },
          (response) => {
            response.resume();
            response.on("end", () => resolve(response.statusCode));
          },
        );
        request.on("error", reject);
        request.on("timeout", () => request.destroy(Error("HTTP timeout")));
        request.end();
      },
    );
    assert.equal(wrongHostStatus, 403);
    const client = join(directory, "client"),
      consumer = join(directory, "consumer");
    await mkdir(client);
    await git(["init", "--initial-branch=main"], client);
    await git(["config", "user.name", "Synthetic Test"], client);
    await git(["config", "user.email", "test@example.invalid"], client);
    await writeFile(join(client, "body.txt"), "actual HTTP Git body\n");
    await git(["add", "."], client);
    await git(["commit", "-m", "body"], client);
    const env = (credential: string) => ({
      GIT_CONFIG_COUNT: "2",
      GIT_CONFIG_KEY_0: "http.extraHeader",
      GIT_CONFIG_VALUE_0: `Authorization: Bearer ${credential}`,
      GIT_CONFIG_KEY_1: "credential.helper",
      GIT_CONFIG_VALUE_1: "",
    });
    await gitMeasured(
      "test",
      0,
      "push",
      ["push", write.remote, "HEAD:refs/heads/main"],
      client,
      env(write.credential),
    );
    await gitMeasured(
      "test",
      0,
      "clone",
      ["clone", "--no-local", read.remote, consumer],
      undefined,
      env(read.credential),
    );
    assert.equal(
      await readFile(join(consumer, "body.txt"), "utf8"),
      "actual HTTP Git body\n",
    );
    assert.equal(
      await git(["rev-parse", "HEAD"], consumer),
      await git(["rev-parse", "HEAD"], client),
    );
    assert.equal(
      await git(["remote", "get-url", "origin"], consumer),
      read.remote,
    );
    assert.ok(
      service.events.some(
        (e) =>
          e.path === `/git/${task.id}.git/git-receive-pack` && e.status === 200,
      ),
    );
    assert.ok(
      service.events.some(
        (e) =>
          e.path === `/git/${task.id}.git/git-upload-pack` && e.status === 200,
      ),
    );
    service.credentials.set("benchmark-reader", {
      id: "reader",
      tenant: service.principal.tenant,
    });
    await call(`/api/repos/${task.id}/grants`, {
      user: "reader",
      role: "reader",
    });
    const guestRead = await (
      await call(
        `/api/repos/${task.id}/token`,
        { scope: "read" },
        "benchmark-reader",
      )
    ).json();
    assert.equal(
      (
        await call(
          `/git/${task.id}.git/info/refs?service=git-upload-pack`,
          undefined,
          guestRead.credential,
        )
      ).status,
      200,
    );
    await call(`/api/repos/${task.id}/grants`, { user: "reader", role: null });
    assert.equal(
      (
        await call(
          `/git/${task.id}.git/info/refs?service=git-upload-pack`,
          undefined,
          guestRead.credential,
        )
      ).status,
      404,
    );
    service.credentials.delete(service.token);
    assert.equal(
      (
        await call(
          `/git/${task.id}.git/info/refs?service=git-upload-pack`,
          undefined,
          read.credential,
        )
      ).status,
      404,
    );
  } finally {
    await service.close();
    await rm(directory, { recursive: true, force: true });
  }
});
