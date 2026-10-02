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
