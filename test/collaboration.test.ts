import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localServices } from "../scripts/local.ts";
import { application } from "../src/app.ts";
const input = {
  title: "Investigate missed update",
  body: "Steps and source evidence",
  assignee: null,
  labels: ["bug"],
  state: "open",
};
async function harness() {
  const dir = await mkdtemp(join(tmpdir(), "collab-"));
  const l = await localServices(dir);
  const actors = {
    owner: l.token,
    writer: "independent-writer-credential",
    reader: "independent-reader-credential",
    outsider: "independent-outsider-credential",
    other: "independent-other-tenant-credential",
  };
  for (const name of ["writer", "reader", "outsider", "other"])
    l.credentials.set(actors[name as keyof typeof actors], {
      id: name,
      name: "Test " + name,
      tenant: name === "other" ? "other-tenant" : l.principal.tenant,
      email: name + "@example.invalid",
      emailVerified: true,
    });
  const call = (actor: keyof typeof actors, path: string, body?: any) =>
    application(l.s)(
      new Request(l.s.origin + path, {
        method: body ? "POST" : "GET",
        headers: { authorization: "Bearer " + actors[actor] },
        body: body ? JSON.stringify(body) : undefined,
      }),
    );
  const repo = (await (
    await call("owner", "/api/repos", { name: "collaboration-private" })
  ).json()) as any;
  for (const actor of ["writer", "reader"] as const) {
    await call("owner", `/api/repos/${repo.id}/grants`, {
      user: actor,
      role: actor,
    });
    await call(actor, "/api/me");
  }
  const prefix = `/api/repos/${repo.id}`;
  return {
    ...l,
    repo,
    call,
    prefix,
    close: async () => {
      l.db.close();
      await rm(dir, { recursive: true, force: true });
    },
  };
}
test("issues: independent local principals create, assign, comment, CAS race, state/search/audit, revocation and tenant denials", async () => {
  const h = await harness();
  try {
    const r = await h.call("writer", h.prefix + "/issues", {
      ...input,
      assignee: "reader",
    });
    assert.equal(r.status, 201);
    const first = (await r.json()) as any;
    assert.equal(first.number, 1);
    assert.equal(first.version, 1);
    assert.equal(
      (await h.call("reader", h.prefix + "/issues", input)).status,
      404,
    );
    assert.equal(
      (
        await h.call("writer", h.prefix + "/issues", {
          ...input,
          assignee: "outsider",
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await h.call("writer", h.prefix + "/issues", {
          ...input,
          assignee: "arbitrary-user",
        })
      ).status,
      404,
    );
    assert.equal((await h.call("other", h.prefix + "/issues")).status, 404);
    assert.equal(
      (await h.call("outsider", h.prefix + "/collaborators")).status,
      404,
    );
    const raced = await Promise.all([
      h.call("writer", h.prefix + "/issues/1", {
        ...input,
        title: "writer update",
        version: 1,
      }),
      h.call("owner", h.prefix + "/issues/1", {
        ...input,
        title: "owner update",
        version: 1,
      }),
    ]);
    assert.deepEqual(raced.map((r) => r.status).sort(), [200, 409]);
    const comment = await h.call("reader", h.prefix + "/issues/1/comments", {
      body: "Read-only collaborator adds evidence <script>alert(1)</script>",
      version: 2,
    });
    assert.equal(comment.status, 201);
    assert.equal(((await comment.json()) as any).version, 3);
    assert.equal(
      (
        await h.call("reader", h.prefix + "/issues/1/comments", {
          body: "stale comment",
          version: 2,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await h.call("reader", h.prefix + "/issues/1", {
          ...input,
          state: "closed",
          version: 3,
        })
      ).status,
      404,
    );
    assert.equal(
      (
        await h.call("writer", h.prefix + "/issues/1", {
          ...input,
          state: "closed",
          version: 3,
        })
      ).status,
      200,
    );
    const detail = (await (
      await h.call("reader", h.prefix + "/issues/1")
    ).json()) as any;
    assert.equal(detail.comments.length, 1);
    assert.equal(detail.issue.state, "closed");
    assert.equal(
      detail.audit.filter((e: any) => e.event === "commented").length,
      1,
    );
    assert.equal(
      detail.audit.filter((e: any) => e.event === "created").length,
      1,
    );
    const matching = (await (
      await h.call("writer", h.prefix + "/issues?q=missed&state=closed")
    ).json()) as any;
    assert.equal(matching.issues.length, 1);
    const literal = (await (
      await h.call("writer", h.prefix + "/issues?q=%25")
    ).json()) as any;
    assert.equal(literal.issues.length, 0);
    await h.call("owner", h.prefix + "/grants", { user: "reader", role: null });
    assert.equal((await h.call("reader", h.prefix + "/issues")).status, 404);
    assert.equal(
      (
        await h.call("reader", h.prefix + "/issues/1/comments", {
          body: "revoked",
          version: 4,
        })
      ).status,
      404,
    );
    assert.equal(
      (await h.call("reader", h.prefix + "/agents/any-job")).status,
      404,
    );
    assert.equal(
      (
        await h.call("writer", h.prefix + "/issues", {
          ...input,
          assignee: "reader",
        })
      ).status,
      404,
    );
    const two = await Promise.all([
      h.call("writer", h.prefix + "/issues", input),
      h.call("owner", h.prefix + "/issues", input),
    ]);
    assert.ok(two.every((r) => r.status === 201));
    assert.deepEqual(
      (await Promise.all(two.map((r) => r.json() as Promise<any>)))
        .map((i) => i.number)
        .sort(),
      [2, 3],
    );
  } finally {
    await h.close();
  }
});
test("verified invitations bind local actors; reader review discussion, current roles, private aggregates and publication policy", async () => {
  const h = await harness();
  try {
    const invite = (await (
      await h.call("owner", h.prefix + "/invites", {
        email: "outsider@example.invalid",
        role: "reader",
      })
    ).json()) as any;
    h.credentials.set("unverified", {
      id: "outsider",
      tenant: h.principal.tenant,
      email: "outsider@example.invalid",
      emailVerified: false,
    });
    const deny = await application(h.s)(
      new Request(h.s.origin + "/api/invites/" + invite.id, {
        method: "POST",
        headers: { authorization: "Bearer unverified" },
        body: "{}",
      }),
    );
    assert.equal(deny.status, 403);
    assert.equal(
      (await h.call("other", "/api/invites/" + invite.id, {})).status,
      403,
    );
    assert.equal(
      (await h.call("outsider", "/api/invites/" + invite.id, {})).status,
      200,
    );
    assert.equal((await h.call("outsider", h.prefix + "/issues")).status, 200);
    await h.catalog.propose({
      id: "local-proposal",
      repo: h.repo.id,
      task: h.repo.id,
      base: "0".repeat(40),
      candidate: "1".repeat(40),
      author: "writer",
      status: "open",
    });
    assert.equal(
      (
        await h.call("reader", h.prefix + "/discussion/local-proposal", {
          body: "Review observation",
        })
      ).status,
      200,
    );
    assert.equal(
      (
        await h.call("reader", h.prefix + "/review", {
          id: "local-proposal",
          status: "approved",
        })
      ).status,
      404,
    );
    assert.equal(
      (await h.call("other", h.prefix + "/discussion/local-proposal")).status,
      404,
    );
    h.s.reviews = {
      request: async () => ({ status: "blocked", realInference: false }),
      get: async () => ({}),
      cancel: async () => ({}),
    };
    assert.equal(
      (await h.call("writer", h.prefix + "/agents/policy", { publish: true }))
        .status,
      404,
    );
    assert.equal(
      (await h.call("owner", h.prefix + "/agents/policy", { publish: true }))
        .status,
      200,
    );
    assert.equal(
      (
        await h.call("reader", h.prefix + "/agents", {
          sha: "1".repeat(40),
          paths: ["README.md"],
        })
      ).status,
      404,
    );
    await h.call("owner", h.prefix + "/grants", {
      user: "outsider",
      role: null,
    });
    assert.equal(
      (await h.call("outsider", h.prefix + "/discussion/local-proposal"))
        .status,
      404,
    );
    h.s.allowPublic = true;
    await h.catalog.visibility(h.repo.id, "public");
    h.s.authenticate = async () => null;
    assert.equal((await h.call("owner", h.prefix + "/issues")).status, 404);
    assert.equal((await h.call("owner", h.prefix + "/agents/any")).status, 404);
  } finally {
    await h.close();
  }
});
