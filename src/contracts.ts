import type { ObjectStore } from "./storage.ts";
export type Role = "reader" | "contributor" | "writer" | "admin";
export interface Principal {
  id: string;
  tenant: string;
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
export interface Catalog {
  create(repo: Repo): Promise<void>;
  get(id: string): Promise<Repo | null>;
  list(p: Principal | null, discovery: boolean): Promise<Repo[]>;
  role(repo: string, user: string): Promise<Role | null>;
  grant(repo: string, user: string, role: Role | null): Promise<void>;
  state(id: string, state: Repo["state"]): Promise<void>;
  visibility(id: string, value: Repo["visibility"]): Promise<void>;
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
  import(name: string, url: string): Promise<void>;
  fork(source: string, target: string): Promise<void>;
  info(name: string): Promise<unknown>;
  log(name: string, ref: string): Promise<any[]>;
  tree(name: string, sha: string): Promise<unknown>;
  file(name: string, ref: string, path: string): Promise<Blob | null>;
  token(name: string, scope: "read" | "write"): Promise<unknown>;
}
export interface Services {
  catalog: Catalog;
  store: ObjectStore;
  git: GitPlane;
  authenticate(request: Request): Promise<Principal | null>;
  origin: string;
  allowPublic: boolean;
  localUpload?: boolean;
  presign?: (
    ticket: Ticket,
  ) => Promise<{ href: string; header: Record<string, string> }>;
}
