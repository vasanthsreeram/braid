import test from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { sqlite } from "../scripts/local.ts";
import { readFile } from "node:fs/promises";
import { GitHubAccounts } from "../src/github.ts";
const c = {
  WORKOS_CLIENT_ID: "client_test",
  WORKOS_API_KEY: "fixture",
  SESSION_SECRET: "x".repeat(32),
  ORIGIN: "https://forge.invalid",
  GITHUB_CLIENT_ID: "fixture-client",
  GITHUB_CLIENT_SECRET: "fixture-secret",
};
const p = { id: "user_a", tenant: "user_a" };
const oauth = {
  provider: "GitHubOAuth",
  access_token: "fixture-per-user-token",
  scopes: ["user:email"],
};
async function harness() {
  const db = new DatabaseSync(":memory:");
  db.exec(await readFile("migrations/0004_github.sql", "utf8"));
  let revoked = false,
    deleted = false,
    identity = "42",
    githubId = 42,
    login = "alice",
    revokeSuccess = false;
  const urls: string[] = [];
  const request = (async (input: any, init: any) => {
    const u = new URL(input);
    urls.push(u.href);
    if (u.hostname === "api.workos.com")
      return Response.json([
        { provider: "GitHubOAuth", type: "OAuth", idp_id: identity },
      ]);
    if (init.method === "DELETE") {
      assert.equal(
        init.headers.authorization,
        "Basic " + btoa(c.GITHUB_CLIENT_ID + ":" + c.GITHUB_CLIENT_SECRET),
      );
      assert.equal(JSON.parse(init.body).access_token, oauth.access_token);
      return new Response(null, { status: revokeSuccess ? 204 : 503 });
    }
    assert.equal(init.headers.authorization, "Bearer " + oauth.access_token);
    if (revoked) return new Response(null, { status: 401 });
    if (u.pathname === "/user") return Response.json({ id: githubId, login });
    if (u.pathname === "/user/repos")
      return Response.json(
        [
          {
            id: 1,
            name: "example",
            full_name: "alice/example",
            private: false,
            fork: false,
            owner: { id: 42 },
          },
          {
            id: 2,
            name: "secret",
            full_name: "alice/secret",
            private: true,
            owner: { id: 42 },
          },
        ],
        {
          headers: {
            link: '<https://api.github.com/user/repos?page=2>; rel="next"',
          },
        },
      );
    if (u.pathname === "/repos/alice/example")
      return Response.json({
        id: 1,
        name: "example",
        full_name: "alice/example",
        private: false,
        owner: { id: 42 },
      });
    if (u.pathname === "/repos/alice/secret")
      return Response.json({
        id: 2,
        name: "secret",
        full_name: "alice/secret",
        private: true,
        owner: { id: 42 },
      });
    if (init.method === "DELETE") {
      deleted = true;
      return new Response(null, { status: 204 });
    }
    throw Error("Unexpected contract request");
  }) as typeof fetch;
  const accounts = new GitHubAccounts(c, sqlite(db), request);
  return {
    db,
    accounts,
    urls,
    setRevoked: () => (revoked = true),
    setIdentity: (v: string) => (identity = v),
    setGitHub: () => {
      githubId = 43;
      login = "bob";
      identity = "43";
    },
    setRevokeSuccess: () => {
      revokeSuccess = true;
    },
  };
}
test("connected account binds verified WorkOS identity and encrypts tokens per user (contract double)", async () => {
  const h = await harness();
  try {
    await h.accounts.connect(p, oauth);
    const row: any = h.db.prepare("SELECT * FROM github_accounts").get();
    assert.ok(!JSON.stringify(row).includes(oauth.access_token));
    assert.equal(row.github_id, "42");
    assert.equal((await h.accounts.account(p)).login, "alice");
    assert.equal(
      (await h.accounts.account({ id: "user_b", tenant: "user_b" })).connected,
      false,
    );
    // Moving ciphertext into another user's row must not transfer authority.
    h.db
      .prepare(
        "INSERT INTO github_accounts SELECT 'user_b',github_id,login,sealed,updated FROM github_accounts WHERE user='user_a'",
      )
      .run();
    await assert.rejects(
      h.accounts.repos({ id: "user_b", tenant: "user_b" }, new URL(c.ORIGIN)),
    );
    h.setIdentity("other");
    await assert.rejects(h.accounts.connect(p, oauth));
  } finally {
    h.db.close();
  }
});
test("picker only returns public owned repos with bounded pagination and refuses private imports (contract double)", async () => {
  const h = await harness();
  try {
    await h.accounts.connect(p, oauth);
    const listed = await h.accounts.repos(p, new URL(c.ORIGIN + "?page=1"));
    assert.deepEqual(
      listed.repos.map((r: any) => r.fullName),
      ["alice/example"],
    );
    assert.equal(listed.nextPage, 2);
    assert.ok(
      h.urls.some(
        (u) =>
          u.includes("visibility=public") && u.includes("affiliation=owner"),
      ),
    );
    await assert.rejects(
      h.accounts.repos(p, new URL(c.ORIGIN + "?page=999999")),
    );
    await assert.rejects(
      h.accounts.repos(p, new URL(c.ORIGIN + "?q=repo:someone/secret")),
    );
    const source = await h.accounts.source(p, "alice/example");
    assert.equal(source.url, "https://github.com/alice/example.git");
    await assert.rejects(h.accounts.source(p, "alice/secret"));
    await assert.rejects(h.accounts.source(p, "other/example"));
    h.setRevoked();
    await assert.rejects(h.accounts.repos(p, new URL(c.ORIGIN)));
    assert.equal((await h.accounts.account(p)).connected, false);
  } finally {
    h.db.close();
  }
});
test("disconnect removes local authority even if remote revocation is unavailable (contract double)", async () => {
  const h = await harness();
  try {
    await h.accounts.connect(p, oauth);
    const result = await h.accounts.disconnect(p);
    assert.equal(result.ok, true);
    assert.equal((await h.accounts.account(p)).connected, false);
    await assert.rejects(h.accounts.repos(p, new URL(c.ORIGIN)));
  } finally {
    h.db.close();
  }
});

test("a disconnected user can reconnect a newly verified GitHub identity", async () => {
  const h = await harness();
  try {
    await h.accounts.connect(p, oauth);
    await h.accounts.disconnect(p);
    h.setGitHub();
    await h.accounts.connect(p, oauth);
    assert.equal((await h.accounts.account(p)).login, "bob");
    h.setRevokeSuccess();
    assert.equal((await h.accounts.disconnect(p)).revoked, true);
  } finally {
    h.db.close();
  }
});
