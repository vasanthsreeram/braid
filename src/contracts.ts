import type { ObjectStore } from "./storage.ts";
export type Role = "reader" | "contributor" | "writer" | "admin";
export interface Principal {
  id: string;
  tenant: string;
  email?: string;
  emailVerified?: boolean;
  session?: string;
  name?: string;
}
export interface Repo {
  id: string;
  tenant: string;
  owner: string;
  name: string;
  physical: string;
  visibility: "private" | "public";
  state: "creating" | "ready" | "failed";
  parent: string | null;
}
export interface Ticket {
  id: string;
  tenant: string;
  repo: string;
  oid: string;
  size: number;
  key: string;
  expires: number;
}
export interface Proposal {
  id: string;
  repo: string;
  task: string;
  base: string;
  candidate: string;
  author: string;
  status: "open" | "approved" | "rejected";
}
export interface Invite {
  id: string;
  repo: string;
  email: string;
  role: Role;
  issuer: string;
  expires: number;
  state: "pending" | "accepted" | "revoked";
  accepted_by: string | null;
}
export interface MergeIntent {
  repo: string;
  proposal: string;
  base: string;
  candidate: string;
  ref: string;
  fence: string;
  state: "publishing" | "merged" | "failed";
  error: string | null;
}
export interface Operation {
  repo: string;
  kind: "create" | "import" | "fork";
  source: string | null;
  refs: string;
}
export interface Catalog {
  children(parent: string): Promise<Repo[]>;
  create(repo: Repo): Promise<void>;
  operation(o: Operation): Promise<void>;
  getOperation(repo: string): Promise<Operation | null>;
  get(id: string): Promise<Repo | null>;
  list(
    p: Principal | null,
    discovery: boolean,
    query?: string,
  ): Promise<Repo[]>;
  role(repo: string, user: string): Promise<Role | null>;
  grant(repo: string, user: string, role: Role | null): Promise<void>;
  state(id: string, state: Repo["state"]): Promise<void>;
  visibility(id: string, value: Repo["visibility"]): Promise<void>;
  grants(repo: string): Promise<{ user: string; role: Role }[]>;
  invite(i: Invite): Promise<void>;
  invitations(repo: string): Promise<Invite[]>;
  getInvite(id: string): Promise<Invite | null>;
  acceptInvite(id: string, user: string): Promise<boolean>;
  revokeInvite(repo: string, id: string): Promise<void>;
  nativeToken(
    id: string,
    repo: string,
    user: string,
    expires: number,
  ): Promise<void>;
  tokens(repo: string, user?: string): Promise<{ id: string; repo: string }[]>;
  removeToken(id: string): Promise<void>;
  mergeIntent(repo: string): Promise<MergeIntent | null>;
  beginMerge(m: MergeIntent): Promise<boolean>;
  finishMerge(
    repo: string,
    fence: string,
    state: "merged" | "failed",
    error?: string,
  ): Promise<boolean>;
  ticket(t: Ticket): Promise<void>;
  getTicket(id: string): Promise<Ticket | null>;
  propose(p: Proposal): Promise<void>;
  proposals(repo: string): Promise<Proposal[]>;
  review(
    repo: string,
    id: string,
    status: "approved" | "rejected",
  ): Promise<boolean>;
}
export interface GitPlane {
  create(name: string): Promise<void>;
  refs(name: string): Promise<{ ref: string; sha: string }[]>;
  source(url: string): Promise<{ refs: { ref: string; sha: string }[] }>;
  seal(name: string): Promise<void>;
  import(name: string, url: string): Promise<void>;
  fork(source: string, target: string): Promise<void>;
  info(name: string): Promise<unknown>;
  log(name: string, ref: string): Promise<any[]>;
  tree(name: string, sha: string): Promise<unknown>;
  file(name: string, ref: string, path: string): Promise<Blob | null>;
  token(name: string, scope: "read" | "write"): Promise<any>;
  revoke(name: string, token: string): Promise<void>;
  commit(
    name: string,
    sha: string,
  ): Promise<{
    sha: string;
    tree: string;
    parents: string[];
    message?: string;
    author?: { name: string; email: string };
    committer?: { name: string; email: string };
    authoredAt?: number;
    committedAt?: number;
  } | null>;
  publish(
    source: string,
    target: string,
    ref: string,
    base: string,
    candidate: string,
  ): Promise<void>;
}
export interface Services {
  catalog: Catalog;
  collaboration?: import("./issues.ts").Collaboration;
  reviews?: {
    list?(repo: Repo): Promise<any>;
    request(repo: Repo, actor: Principal, body: any): Promise<any>;
    get(repo: Repo, job: string): Promise<any>;
    cancel(repo: Repo, job: string, actor?: Principal): Promise<any>;
  };
  store: ObjectStore;
  git: GitPlane;
  authenticate(request: Request): Promise<Principal | null>;
  origin: string;
  allowPublic: boolean;
  github?: {
    account(p: Principal): Promise<any>;
    repos(p: Principal, url: URL): Promise<any>;
    source(p: Principal, name: unknown): Promise<{ url: string; name: string }>;
    disconnect(p: Principal): Promise<any>;
  };
  member?: (organization: string, user: string) => Promise<boolean>;
  localUpload?: boolean;
  bundle?: (
    repo: Repo,
    bundle: Awaited<ReturnType<typeof import("./bundle.ts").openBundle>>,
  ) => Promise<any>;
  presign?: (
    ticket: Ticket,
  ) => Promise<{ href: string; header: Record<string, string> }>;
}
