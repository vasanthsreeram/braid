import type {
  Catalog,
  Repo,
  Principal,
  Role,
  Ticket,
  Proposal,
} from "./contracts.ts";
// Structural D1 interface also implemented by Node SQLite in the local harness.
export interface Statement {
  bind(...params: unknown[]): Statement;
  first<T>(): Promise<T | null>;
  all<T>(): Promise<{ results: T[] }>;
  run(): Promise<any>;
}
export interface SQL {
  prepare(query: string): Statement;
}
export class SQLCatalog implements Catalog {
  constructor(private db: SQL) {}
  async create(r: Repo) {
    await this.db
      .prepare("INSERT INTO repos VALUES (?,?,?,?,?,?,?,?)")
      .bind(
        r.id,
        r.tenant,
        r.owner,
        r.name,
        r.physical,
        r.visibility,
        r.state,
        r.parent,
      )
      .run();
  }
  async get(id: string) {
    return this.db
      .prepare("SELECT * FROM repos WHERE id=?")
      .bind(id)
      .first<Repo>();
  }
  async list(p: Principal | null, discovery: boolean) {
    const q = discovery
      ? "SELECT * FROM repos WHERE visibility='public' AND state='ready' ORDER BY name LIMIT 100"
      : "SELECT DISTINCT r.* FROM repos r LEFT JOIN grants g ON g.repo=r.id AND g.user=? WHERE r.tenant=? AND (r.owner=? OR g.user=?) ORDER BY r.name LIMIT 100";
    const s = this.db.prepare(q);
    return (
      await (discovery ? s : s.bind(p!.id, p!.tenant, p!.id, p!.id)).all<Repo>()
    ).results;
  }
  async role(repo: string, user: string) {
    const r = await this.db
      .prepare("SELECT role FROM grants WHERE repo=? AND user=?")
      .bind(repo, user)
      .first<{ role: Role }>();
    return r?.role ?? null;
  }
  async grant(repo: string, user: string, role: Role | null) {
    if (!role)
      await this.db
        .prepare("DELETE FROM grants WHERE repo=? AND user=?")
        .bind(repo, user)
        .run();
    else
      await this.db
        .prepare(
          "INSERT INTO grants VALUES (?,?,?) ON CONFLICT(repo,user) DO UPDATE SET role=excluded.role",
        )
        .bind(repo, user, role)
        .run();
  }
  async state(id: string, value: Repo["state"]) {
    await this.db
      .prepare("UPDATE repos SET state=? WHERE id=?")
      .bind(value, id)
      .run();
  }
  async visibility(id: string, value: Repo["visibility"]) {
    await this.db
      .prepare("UPDATE repos SET visibility=? WHERE id=?")
      .bind(value, id)
      .run();
  }
  async ticket(t: Ticket) {
    await this.db
      .prepare("INSERT INTO tickets VALUES (?,?,?,?,?,?,?)")
      .bind(t.id, t.tenant, t.repo, t.oid, t.size, t.key, t.expires)
      .run();
  }
  async getTicket(id: string) {
    return this.db
      .prepare("SELECT * FROM tickets WHERE id=?")
      .bind(id)
      .first<Ticket>();
  }
  async propose(p: Proposal) {
    await this.db
      .prepare("INSERT INTO proposals VALUES (?,?,?,?,?,?,?)")
      .bind(p.id, p.repo, p.task, p.base, p.candidate, p.author, p.status)
      .run();
  }
  async proposals(repo: string) {
    return (
      await this.db
        .prepare("SELECT * FROM proposals WHERE repo=? LIMIT 100")
        .bind(repo)
        .all<Proposal>()
    ).results;
  }
  async review(repo: string, id: string, status: "approved" | "rejected") {
    const r = await this.db
      .prepare(
        "UPDATE proposals SET status=? WHERE id=? AND repo=? AND status='open'",
      )
      .bind(status, id, repo)
      .run();
    return !!(r.meta?.changes ?? r.changes);
  }
}
