import { describe, it, expect } from "vitest";
import { DatabaseSync } from "node:sqlite";
import { registerStorageConformance } from "@earendil-works/pi-durable/testing";
import { JsonlStorage } from "@earendil-works/pi-durable/storage/jsonl";
import { BACKGROUND_CONTEXT } from "@earendil-works/chord/context";
import { journalFiles } from "../src/pi-storage.ts";
registerStorageConformance(
  { describe, it, expect },
  "Gitflare DO SQLite journal facade",
  async (use) => {
    const db = new DatabaseSync(":memory:");
    const sql = {
      exec(q: string, ...p: any[]) {
        const stmt = db.prepare(q);
        if (q.trim().startsWith("SELECT"))
          return { toArray: () => stmt.all(...p) };
        stmt.run(...p);
        return { toArray: () => [] };
      },
    };
    const storage = await JsonlStorage.open(
      "/test",
      journalFiles(sql, "/test"),
      BACKGROUND_CONTEXT,
      { fsync: true },
    );
    try {
      await use(storage);
    } finally {
      await storage.close(BACKGROUND_CONTEXT);
      db.close();
    }
  },
);

it("journal directory listing rejects other journal scopes and treats SQL wildcards literally", async () => {
  const db = new DatabaseSync(":memory:");
  const sql = {
    exec(q: string, ...p: any[]) {
      const stmt = db.prepare(q);
      if (q.startsWith("SELECT")) return { toArray: () => stmt.all(...p) };
      stmt.run(...p);
      return { toArray: () => [] };
    },
  };
  try {
    const own = journalFiles(sql, "/job_%"),
      other = journalFiles(sql, "/job_ab");
    expect(
      (await own.writeFile("/job_%/own", "private", BACKGROUND_CONTEXT)).ok,
    ).toBe(true);
    expect(
      (
        await other.writeFile(
          "/job_ab/other",
          "other-private",
          BACKGROUND_CONTEXT,
        )
      ).ok,
    ).toBe(true);
    const list = await own.listDir("/job_%", BACKGROUND_CONTEXT);
    expect(list.ok).toBe(true);
    if (list.ok) expect(list.value.map((e) => e.name)).toEqual(["own"]);
    expect((await own.listDir("/job_ab", BACKGROUND_CONTEXT)).ok).toBe(false);
    expect((await own.listDir("/job_%/../job_ab", BACKGROUND_CONTEXT)).ok).toBe(
      false,
    );
  } finally {
    db.close();
  }
});
