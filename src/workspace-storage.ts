import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getConfigDir } from "./config.ts";

let db: Database | null = null;

export function resetWorkspaceStorageForTesting(): void {
  if (db) {
    try { db.close(); } catch { /* ignore */ }
  }
  db = null;
}

function getDb(): Database {
  if (db) return db;
  const dir = getConfigDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  db = new Database(join(dir, "annotations.db"));
  db.exec("PRAGMA journal_mode=WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS workspace_paths (
      path     TEXT PRIMARY KEY,
      added_at INTEGER NOT NULL
    );
  `);
  const hasLegacyTable = db.query(
    "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'rag_workspaces'"
  ).get();
  if (hasLegacyTable) {
    db.exec(`
      INSERT OR IGNORE INTO workspace_paths (path, added_at)
      SELECT path, added_at FROM rag_workspaces;
    `);
  }
  return db;
}

export function upsertWorkspacePath(path: string): void {
  getDb().query("INSERT OR REPLACE INTO workspace_paths (path, added_at) VALUES (?, ?)").run(path, Date.now());
}

export function deleteWorkspacePath(path: string): void {
  getDb().query("DELETE FROM workspace_paths WHERE path = ?").run(path);
}

export function getWorkspacePaths(): string[] {
  return (getDb().query("SELECT path FROM workspace_paths ORDER BY added_at").all() as { path: string }[]).map(r => r.path);
}
