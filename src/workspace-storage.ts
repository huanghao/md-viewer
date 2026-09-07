import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getDataDir } from "./config.ts";

let db: Database | null = null;

export function resetWorkspaceStorageForTesting(): void {
  if (db) {
    try { db.close(); } catch { /* ignore */ }
  }
  db = null;
}

function getDb(): Database {
  if (db) return db;
  const dir = getDataDir();
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
  const columns = db.query(`PRAGMA table_info(workspace_paths)`).all() as Array<{ name: string }>;
  if (!columns.some((col) => col.name === "agent_command")) {
    db.exec(`ALTER TABLE workspace_paths ADD COLUMN agent_command TEXT`);
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

/** 找到包含 docPath 的已注册 workspace（取最长前缀匹配）。 */
export function findWorkspaceForPath(docPath: string): string | null {
  const candidates = getWorkspacePaths().filter((p) => docPath === p || docPath.startsWith(p.endsWith("/") ? p : p + "/"));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.length - a.length)[0]!;
}

export function getWorkspaceAgentCommand(workspacePath: string): string[] | null {
  const row = getDb().query("SELECT agent_command FROM workspace_paths WHERE path = ?").get(workspacePath) as { agent_command: string | null } | null;
  if (!row?.agent_command) return null;
  try {
    const parsed = JSON.parse(row.agent_command);
    return Array.isArray(parsed) && parsed.every((x) => typeof x === "string") ? parsed : null;
  } catch {
    return null;
  }
}

export function setWorkspaceAgentCommand(workspacePath: string, command: string[] | null): void {
  getDb().query("UPDATE workspace_paths SET agent_command = ? WHERE path = ?").run(
    command && command.length > 0 ? JSON.stringify(command) : null,
    workspacePath
  );
}
