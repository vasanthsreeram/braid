import { writeFile } from "node:fs/promises";
const origin = "https://gitflare.lintlabs.org";
const rows = [];
for (const [path, method, body, headers, status] of [
  ["/", "GET", undefined, {}, 401],
  ["/app.js", "GET", undefined, {}, 401],
  ["/api/github", "GET", undefined, {}, 401],
  ["/api/github/repos", "GET", undefined, {}, 401],
  [
    "/api/github/import",
    "POST",
    { repository: "vasanthsreeram/cloudnee" },
    { origin },
    401,
  ],
  ["/api/me", "GET", undefined, {}, 401],
  ["/api/profile", "GET", undefined, {}, 401],
  [
    "/api/repos/private/commit?sha=" + "a".repeat(40),
    "GET",
    undefined,
    {},
    404,
  ],
  ["/api/repos/private/issues", "GET", undefined, {}, 404],
  ["/api/repos/private/issues/1", "GET", undefined, {}, 404],
  [
    "/api/repos/private/issues",
    "POST",
    { title: "forbidden" },
    { origin },
    404,
  ],
  ["/api/repos/private/collaborators", "GET", undefined, {}, 404],
  ["/api/repos/private/discussion/proposal", "GET", undefined, {}, 404],
  ["/api/repos/private/agents", "GET", undefined, {}, 404],
  [
    "/api/repos/private/agents",
    "POST",
    { sha: "a".repeat(40), paths: ["README.md"] },
    { origin },
    404,
  ],
  [
    "/api/bundles?name=forbidden",
    "POST",
    undefined,
    { origin, "content-type": "application/x-git-bundle" },
    401,
  ],
  ["/api/bundles?name=forbidden", "POST", undefined, {}, 403],
  ["/api/discovery", "GET", undefined, {}, 401],
  ["/api/repos", "GET", undefined, {}, 401],
  ["/api/repos", "POST", { name: "forbidden" }, { origin }, 401],
  [
    "/api/repos",
    "POST",
    { name: "forbidden" },
    { authorization: "Bearer local-owner" },
    401,
  ],
  ["/api/repos", "POST", { name: "forbidden" }, {}, 403],
  [
    "/api/repos/private",
    "GET",
    undefined,
    { authorization: "Bearer local-owner" },
    404,
  ],
  [
    "/lfs/private/objects/" + "a".repeat(64),
    "GET",
    undefined,
    { authorization: "Bearer local-owner" },
    404,
  ],
  ["/__local_identity", "GET", undefined, {}, 401],
  ["/auth/login", "GET", undefined, {}, 302],
  ["/auth/callback?code=fake&state=fake", "GET", undefined, {}, 400],
] as [string, string, unknown, Record<string, string>, number][]) {
  const r = await fetch(origin + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(15000),
  });
  const text = await r.text();
  rows.push({
    path: path.startsWith("/auth/callback")
      ? "/auth/callback?[redacted]"
      : path,
    method,
    status: r.status,
    expected: status,
    body: text,
    cacheControl: r.headers.get("cache-control"),
    passed: r.status === status,
  });
}
const result = {
  origin,
  boundary:
    "deployed unauthenticated rejection and configured WorkOS authorization redirect only; actual user session not tested",
  checks: rows,
  passed: rows.every((r) => r.passed),
  at: new Date().toISOString(),
};
await writeFile(
  "docs/collab-agent/raw/deployed-core-smoke.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(
  `${rows.filter((r) => r.passed).length}/${rows.length} deployed denials pass`,
);
if (!result.passed) process.exitCode = 1;
