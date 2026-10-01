import type {
  Catalog,
  Repo,
  Principal,
  Role,
  Ticket,
  Proposal,
  Invite,
  MergeIntent,
  Operation,
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
  async children(parent: string) {
    return (
      await this.db
        .prepare("SELECT * FROM repos WHERE parent=?")
        .bind(parent)
        .all<Repo>()
    ).results;
  }
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
  async operation(o: Operation) {
    await this.db
      .prepare("INSERT INTO operations VALUES (?,?,?,?)")
      .bind(o.repo, o.kind, o.source, o.refs)
      .run();
  }
  async getOperation(repo: string) {
    return this.db
      .prepare("SELECT * FROM operations WHERE repo=?")
      .bind(repo)
      .first<Operation>();
  }
  async get(id: string) {
    return this.db
      .prepare("SELECT * FROM repos WHERE id=?")
      .bind(id)
      .first<Repo>();
  }
  async list(p: Principal | null, discovery: boolean, query = "") {
    const search =
      "%" +
      query.replaceAll("!", "!!").replaceAll("%", "!%").replaceAll("_", "!_") +
      "%";
    const q = discovery
      ? "SELECT * FROM repos WHERE visibility='public' AND state='ready' AND name LIKE ? ESCAPE '!' ORDER BY name,id LIMIT 100"
      : "SELECT DISTINCT r.* FROM repos r LEFT JOIN repos c ON c.id=r.parent LEFT JOIN grants g ON g.repo=r.id AND g.user=? LEFT JOIN grants pg ON pg.repo=c.id AND pg.user=? WHERE (r.tenant=? OR r.tenant=r.owner OR c.tenant=c.owner) AND (r.owner=? OR g.user=? OR c.owner=? OR pg.role='admin') AND (r.parent IS NULL OR g.user IS NOT NULL OR c.owner=? OR pg.role IN ('contributor','writer','admin')) AND r.name LIKE ? ESCAPE '!' ORDER BY r.name,r.id LIMIT 100";
    const stmt = this.db.prepare(q);
    return (
      await (
        discovery
          ? stmt.bind(search)
          : stmt.bind(
              p!.id,
              p!.id,
              p!.tenant,
              p!.id,
              p!.id,
              p!.id,
              p!.id,
              search,
            )
      ).all<Repo>()
    ).results;
  }
  async grants(repo: string) {
    return (
      await this.db
        .prepare("SELECT user,role FROM grants WHERE repo=? ORDER BY user")
        .bind(repo)
        .all<{ user: string; role: Role }>()
    ).results;
  }
  async invite(i: Invite) {
    await this.db
      .prepare("INSERT INTO invites VALUES (?,?,?,?,?,?,?,?)")
      .bind(
        i.id,
        i.repo,
        i.email,
        i.role,
        i.issuer,
        i.expires,
        i.state,
        i.accepted_by,
      )
      .run();
  }
  async invitations(repo: string) {
    return (
      await this.db
        .prepare(
          "SELECT * FROM invites WHERE repo=? ORDER BY expires DESC LIMIT 100",
        )
        .bind(repo)
        .all<Invite>()
    ).results;
  }
  async getInvite(id: string) {
    return this.db
      .prepare("SELECT * FROM invites WHERE id=?")
      .bind(id)
      .first<Invite>();
  }
  async acceptInvite(id: string, user: string) {
    const r = await this.db
      .prepare(
        "UPDATE invites SET state='accepted',accepted_by=? WHERE id=? AND state='pending' AND expires>?",
      )
      .bind(user, id, Date.now())
      .run();
    return !!(r.meta?.changes ?? r.changes);
  }
  async revokeInvite(repo: string, id: string) {
    await this.db
      .prepare(
        "UPDATE invites SET state='revoked' WHERE repo=? AND id=? AND state='pending'",
      )
      .bind(repo, id)
      .run();
  }
  async nativeToken(id: string, repo: string, user: string, expires: number) {
    await this.db
      .prepare("INSERT INTO native_tokens VALUES (?,?,?,?)")
      .bind(id, repo, user, expires)
      .run();
  }
  async tokens(repo: string, user?: string) {
    const stmt = this.db.prepare(
      "SELECT id,repo FROM native_tokens WHERE repo=?" +
        (user ? " AND user=?" : ""),
    );
    return (
      await (user ? stmt.bind(repo, user) : stmt.bind(repo)).all<{
        id: string;
        repo: string;
      }>()
    ).results;
  }
  async removeToken(id: string) {
    await this.db
      .prepare("DELETE FROM native_tokens WHERE id=?")
      .bind(id)
      .run();
  }
  async mergeIntent(repo: string) {
    return this.db
      .prepare("SELECT * FROM merges WHERE repo=?")
      .bind(repo)
      .first<MergeIntent>();
  }
  async beginMerge(m: MergeIntent) {
    const r = await this.db
      .prepare(
        "INSERT INTO merges VALUES (?,?,?,?,?,?,?,?) ON CONFLICT(repo) DO UPDATE SET proposal=excluded.proposal,base=excluded.base,candidate=excluded.candidate,ref=excluded.ref,fence=excluded.fence,state=excluded.state,error=NULL WHERE merges.state!='publishing'",
      )
      .bind(
        m.repo,
        m.proposal,
        m.base,
        m.candidate,
        m.ref,
        m.fence,
        m.state,
        m.error,
      )
      .run();
    return !!(r.meta?.changes ?? r.changes);
  }
  async finishMerge(
    repo: string,
    fence: string,
    state: "merged" | "failed",
    error: string | null = null,
  ) {
    const r = await this.db
      .prepare(
        "UPDATE merges SET state=?,error=? WHERE repo=? AND fence=? AND state='publishing'",
      )
      .bind(state, error, repo, fence)
      .run();
    return !!(r.meta?.changes ?? r.changes);
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
