import {
  FileError,
  ok,
  err,
  type FileSystem,
} from "@earendil-works/pi-durable/env";
// This filesystem exists only for Pi's journal, never for repository content. Each
// operation is a synchronous SQLite statement; the JSONL marker publishes a commit
// after sidecars are durable. One DO owns this adapter and its single harness.
export function journalFiles(
  sql: { exec(query: string, ...bindings: any[]): any },
  directory: string,
): FileSystem {
  sql.exec(
    "CREATE TABLE IF NOT EXISTS pi_files (path TEXT PRIMARY KEY, content BLOB NOT NULL)",
  );
  const path = (p: string) => {
    if (!p.startsWith(directory + "/") || p.includes(".."))
      throw Error("Journal scope");
    return p;
  };
  const bytes = (v: string | Uint8Array) =>
    typeof v === "string" ? new TextEncoder().encode(v) : v;
  const read = (p: string) =>
    sql.exec("SELECT content FROM pi_files WHERE path=?", path(p)).toArray()[0]
      ?.content as ArrayBuffer | undefined;
  const write = (p: string, b: Uint8Array) => {
    if (b.length > 2 * 1024 * 1024) throw Error("Journal file limit");
    sql.exec(
      "INSERT INTO pi_files VALUES (?,?) ON CONFLICT(path) DO UPDATE SET content=excluded.content",
      path(p),
      b,
    );
  };
  const attempt = async (fn: () => any) => {
    try {
      return ok(fn());
    } catch {
      return err(new FileError("unknown", "Journal operation failed"));
    }
  };
  const fs: any = {
    id: directory,
    cwd: directory,
    absolutePath: async (p: string) => ok(p),
    joinPath: async (parts: string[]) => ok(parts.join("/")),
    createDir: async () => ok(undefined),
    flushFile: async () => ok(undefined),
    cleanup: async () => {},
    readBinaryFile: async (p: string) => {
      const b = read(p);
      return b
        ? ok(new Uint8Array(b))
        : err(new FileError("not_found", "Journal absent"));
    },
    writeFile: (p: string, v: string | Uint8Array) =>
      attempt(() => write(p, bytes(v))),
    appendFile: (p: string, v: string | Uint8Array) =>
      attempt(() => {
        const a = new Uint8Array(read(p) ?? new ArrayBuffer(0)),
          b = bytes(v),
          c = new Uint8Array(a.length + b.length);
        c.set(a);
        c.set(b, a.length);
        write(p, c);
      }),
    truncateFile: (p: string, size: number) =>
      attempt(() => {
        const old = new Uint8Array(read(p) ?? new ArrayBuffer(0)),
          b = new Uint8Array(size);
        b.set(old.subarray(0, size));
        write(p, b);
      }),
    renameFile: (a: string, b: string) =>
      attempt(() => {
        const data = read(a);
        if (!data) throw Error("Absent");
        sql.exec(
          "INSERT INTO pi_files VALUES (?,?) ON CONFLICT(path) DO UPDATE SET content=excluded.content",
          path(b),
          data,
        );
        sql.exec("DELETE FROM pi_files WHERE path=?", path(a));
      }),
    remove: (p: string) =>
      attempt(() => {
        sql.exec("DELETE FROM pi_files WHERE path=?", path(p));
      }),
    listDir: (p: string) =>
      attempt(() => {
        if (p !== directory) path(p);
        const prefix = p + "/";
        return sql
          .exec(
            "SELECT path,length(content) AS size FROM pi_files WHERE substr(path,1,?)=?",
            prefix.length,
            prefix,
          )
          .toArray()
          .map((r: any) => ({
            name: r.path.slice(prefix.length),
            path: r.path,
            kind: "file",
            size: r.size,
            mtimeMs: 0,
          }));
      }),
  };
  // Unused FileSystem methods fail closed. No shell or execution environment is supplied.
  for (const key of [
    "readTextFile",
    "openTextLineReader",
    "readTextLines",
    "fileInfo",
    "canonicalPath",
    "exists",
    "createTempDir",
    "createTempFile",
  ])
    fs[key] = async () => err(new FileError("not_supported", "Journal only"));
  return fs;
}
