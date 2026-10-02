import type { SQL } from "./catalog.ts";
import type { Principal } from "./contracts.ts";
import { check } from "./storage.ts";
export interface Issue {
  repo: string;
  number: number;
  title: string;
  body: string;
  author: string;
  state: "open" | "closed";
  assignee: string | null;
  labels: string[];
  version: number;
  actor: string;
  created: number;
  updated: number;
  finding: string | null;
}
export const issueNumber = (s: string) => {
  check(/^[1-9][0-9]{0,8}$/.test(s), 404, "Issue unavailable");
  return Number(s);
};
export function issueInput(b: any) {
  check(
    typeof b.title === "string" &&
      b.title.trim().length > 0 &&
      b.title.length <= 200,
    422,
    "Title must contain 1–200 characters",
  );
  check(
    typeof b.body === "string" && b.body.length <= 16000,
    422,
    "Body limited to 16000 characters",
  );
  check(b.state === "open" || b.state === "closed", 422, "Invalid issue state");
  check(
    b.assignee === null ||
      (typeof b.assignee === "string" && b.assignee.length <= 128),
    422,
    "Invalid assignee",
  );
  check(
    Array.isArray(b.labels) &&
      b.labels.length <= 10 &&
      b.labels.every(
        (l: any) => typeof l === "string" && /^[\p{L}\p{N} _-]{1,32}$/u.test(l),
      ),
    422,
    "Use up to 10 labels of 1–32 characters",
  );
  return {
    title: b.title.trim(),
    body: b.body,
    state: b.state,
    assignee: b.assignee,
    labels: [...new Set(b.labels)],
  };
}
export function version(v: any) {
  check(Number.isSafeInteger(v) && v >= 1, 422, "Expected current version");
  return v;
}
export function commentBody(b: any) {
  check(
    typeof b === "string" && b.trim().length > 0 && b.length <= 8000,
    422,
    "Comment must contain 1–8000 characters",
  );
  return b.trim();
}
export class Collaboration {
  constructor(public db: SQL) {}
  async profile(p: Principal) {
    await this.db
      .prepare(
        "INSERT INTO profiles VALUES (?,?,?,?,?) ON CONFLICT(user) DO UPDATE SET email=excluded.email,verified=excluded.verified,name=excluded.name,updated=excluded.updated",
      )
      .bind(
        p.id,
        p.email ?? null,
        p.emailVerified ? 1 : 0,
        p.name ?? p.id,
        Date.now(),
      )
      .run();
  }
  async person(user: string) {
    return this.db
      .prepare("SELECT user,name,email,verified FROM profiles WHERE user=?")
      .bind(user)
      .first<any>();
  }
  unpack(v: any): Issue | null {
    return v ? { ...v, labels: JSON.parse(v.labels) } : null;
  }
  async get(repo: string, number: number) {
    return this.unpack(
      await this.db
        .prepare("SELECT * FROM issues WHERE repo=? AND number=?")
        .bind(repo, number)
        .first(),
    );
  }
  async list(repo: string, q: string, state: string) {
    const search =
      "%" +
      q.replaceAll("!", "!!").replaceAll("%", "!%").replaceAll("_", "!_") +
      "%";
    return (
      await this.db
        .prepare(
          "SELECT * FROM issues WHERE repo=? AND (?='' OR state=?) AND (title LIKE ? ESCAPE '!' OR body LIKE ? ESCAPE '!') ORDER BY updated DESC,number DESC LIMIT 100",
        )
        .bind(repo, state, state, search, search)
        .all()
    ).results.map((v) => this.unpack(v));
  }
  async create(
    repo: string,
    p: Principal,
    b: any,
    finding: string | null = null,
  ) {
    const now = Date.now();
    const r = await this.db
      .prepare(
        "INSERT INTO issues SELECT ?,COALESCE(MAX(number),0)+1,?,?,?,'open',?,?,1,?,?,?,? FROM issues WHERE repo=? RETURNING *",
      )
      .bind(
        repo,
        b.title,
        b.body,
        p.id,
        b.assignee,
        JSON.stringify(b.labels),
        p.id,
        now,
        now,
        finding,
        repo,
      )
      .first<any>();
    return this.unpack(r)!;
  }
  async update(repo: string, number: number, p: Principal, b: any) {
    const r = await this.db
      .prepare(
        "UPDATE issues SET title=?,body=?,state=?,assignee=?,labels=?,version=version+1,actor=?,updated=? WHERE repo=? AND number=? AND version=? RETURNING *",
      )
      .bind(
        b.title,
        b.body,
        b.state,
        b.assignee,
        JSON.stringify(b.labels),
        p.id,
        Date.now(),
        repo,
        number,
        b.version,
      )
      .first<any>();
    check(r, 409, "Issue changed. Reload before saving.");
    return this.unpack(r)!;
  }
  async comment(repo: string, number: number, p: Principal, b: any) {
    const id = crypto.randomUUID();
    const r = await this.db
      .prepare(
        "INSERT INTO issue_comments SELECT ?,repo,number,?,?,? FROM issues WHERE repo=? AND number=? AND version=?",
      )
      .bind(
        id,
        p.id,
        commentBody(b.body),
        Date.now(),
        repo,
        number,
        version(b.version),
      )
      .run();
    check(
      r.meta?.changes ?? r.changes,
      409,
      "Issue changed. Reload before commenting.",
    );
    return this.get(repo, number);
  }
  async detail(repo: string, number: number) {
    const issue = await this.get(repo, number);
    check(issue, 404, "Issue unavailable");
    const comments = (
      await this.db
        .prepare(
          "SELECT * FROM issue_comments WHERE repo=? AND number=? ORDER BY created,id LIMIT 200",
        )
        .bind(repo, number)
        .all()
    ).results;
    const audit = (
      await this.db
        .prepare(
          "SELECT * FROM issue_audit WHERE repo=? AND number=? ORDER BY id DESC LIMIT 200",
        )
        .bind(repo, number)
        .all()
    ).results;
    return { issue, comments, audit };
  }
  async review(repo: string, proposal: string, p?: Principal, body?: string) {
    check(
      await this.db
        .prepare("SELECT id FROM proposals WHERE repo=? AND id=?")
        .bind(repo, proposal)
        .first(),
      404,
      "Proposal unavailable",
    );
    if (p)
      await this.db
        .prepare("INSERT INTO review_comments VALUES (?,?,?,?,?,?)")
        .bind(
          crypto.randomUUID(),
          repo,
          proposal,
          p.id,
          commentBody(body),
          Date.now(),
        )
        .run();
    return (
      await this.db
        .prepare(
          "SELECT * FROM review_comments WHERE repo=? AND proposal=? ORDER BY created,id LIMIT 200",
        )
        .bind(repo, proposal)
        .all()
    ).results;
  }
  async policy(repo: string) {
    return (
      (
        await this.db
          .prepare("SELECT publish FROM review_policy WHERE repo=?")
          .bind(repo)
          .first<any>()
      )?.publish === 1
    );
  }
  async setPolicy(repo: string, actor: string, publish: boolean) {
    await this.db
      .prepare(
        "INSERT INTO review_policy VALUES (?,?,?,?) ON CONFLICT(repo) DO UPDATE SET publish=excluded.publish,actor=excluded.actor,updated=excluded.updated",
      )
      .bind(repo, publish ? 1 : 0, actor, Date.now())
      .run();
    await this.audit(repo, actor, "publication_policy", { publish });
  }
  async audit(repo: string, actor: string, event: string, data: any) {
    await this.db
      .prepare("INSERT INTO agent_audit VALUES (?,?,?,?,?,?)")
      .bind(
        crypto.randomUUID(),
        repo,
        actor,
        event,
        JSON.stringify(data),
        Date.now(),
      )
      .run();
  }
  async finding(repo: string, key: string) {
    return this.unpack(
      await this.db
        .prepare("SELECT * FROM issues WHERE repo=? AND finding=?")
        .bind(repo, key)
        .first(),
    );
  }
}
