import { Database } from "bun:sqlite";
import { getConfigDir } from "./config.ts";
import { join } from "path";
import { mkdirSync, existsSync } from "fs";

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;
  const dir = getConfigDir();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  db = new Database(join(dir, "annotations.db"));
  db.exec("PRAGMA journal_mode=WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS rag_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rag_chunks (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      path        TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      heading     TEXT,
      text        TEXT NOT NULL,
      char_start  INTEGER NOT NULL DEFAULT 0,
      indexed_at  INTEGER NOT NULL,
      file_mtime  INTEGER NOT NULL,
      UNIQUE(path, chunk_index)
    );
    CREATE INDEX IF NOT EXISTS idx_rag_chunks_path ON rag_chunks(path);

    CREATE TABLE IF NOT EXISTS rag_vectors (
      chunk_id INTEGER PRIMARY KEY REFERENCES rag_chunks(id) ON DELETE CASCADE,
      vector   BLOB NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rag_workspaces (
      path       TEXT PRIMARY KEY,
      added_at   INTEGER NOT NULL
    );
  `);
  return db;
}

export function resetDbForTesting(): void {
  if (db) { try { db.close(); } catch {} }
  db = null;
}

export function getMeta(key: string): string | null {
  const row = getDb().query("SELECT value FROM rag_meta WHERE key = ?").get(key) as { value: string } | null;
  return row?.value ?? null;
}

export function setMeta(key: string, value: string): void {
  getDb().query("INSERT OR REPLACE INTO rag_meta (key, value) VALUES (?, ?)").run(key, value);
}

export interface RagChunk {
  path: string;
  chunkIndex: number;
  heading: string | null;
  text: string;
  charStart: number;
  fileMtime: number;
}

export function upsertFileChunks(chunks: RagChunk[], vectors: Float32Array[]): void {
  const db = getDb();
  const now = Date.now();
  db.transaction(() => {
    if (chunks.length > 0) {
      db.query("DELETE FROM rag_chunks WHERE path = ?").run(chunks[0].path);
    }
    const insertChunk = db.prepare(
      "INSERT INTO rag_chunks (path, chunk_index, heading, text, char_start, indexed_at, file_mtime) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    const insertVec = db.prepare(
      "INSERT INTO rag_vectors (chunk_id, vector) VALUES (?, ?)"
    );
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const result = insertChunk.run(c.path, c.chunkIndex, c.heading, c.text, c.charStart, now, c.fileMtime);
      const chunkId = result.lastInsertRowid;
      insertVec.run(chunkId, Buffer.from(vectors[i].buffer));
    }
  })();
}

export function getFileMtime(path: string): number | null {
  const row = getDb()
    .query("SELECT file_mtime FROM rag_chunks WHERE path = ? LIMIT 1")
    .get(path) as { file_mtime: number } | null;
  return row?.file_mtime ?? null;
}

export function deleteFileChunks(path: string): void {
  getDb().query("DELETE FROM rag_chunks WHERE path = ?").run(path);
}

export interface StoredChunk {
  id: number;
  path: string;
  heading: string | null;
  text: string;
  charStart: number;
  vector: Float32Array;
}

export function upsertWorkspacePath(path: string): void {
  getDb().query("INSERT OR REPLACE INTO rag_workspaces (path, added_at) VALUES (?, ?)").run(path, Date.now());
}

export function deleteWorkspacePath(path: string): void {
  getDb().query("DELETE FROM rag_workspaces WHERE path = ?").run(path);
}

export function getWorkspacePaths(): string[] {
  return (getDb().query("SELECT path FROM rag_workspaces ORDER BY added_at").all() as { path: string }[]).map(r => r.path);
}

export function getAllVectors(): StoredChunk[] {
  const rows = getDb().query(
    "SELECT c.id, c.path, c.heading, c.text, c.char_start as charStart, v.vector FROM rag_chunks c JOIN rag_vectors v ON v.chunk_id = c.id"
  ).all() as any[];
  return rows.map(r => ({
    id: r.id,
    path: r.path,
    heading: r.heading,
    text: r.text,
    charStart: r.charStart,
    vector: new Float32Array((r.vector as Buffer).buffer, (r.vector as Buffer).byteOffset, (r.vector as Buffer).byteLength / 4),
  }));
}
