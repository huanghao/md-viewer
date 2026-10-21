import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getDataDir } from "./config.ts";

let db: Database | null = null;

/** Close and reset the DB singleton. Only for use in tests. */
export function resetDbForTesting(): void {
  if (db) {
    try {
      db.close();
    } catch {
      // ignore
    }
  }
  db = null;
}

export function getDb(): Database {
  if (db) return db;

  const dir = getDataDir();
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  const dbPath = join(dir, "annotations.db");
  db = new Database(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      serial INTEGER,
      doc_path TEXT NOT NULL,
      start INTEGER NOT NULL,
      length INTEGER NOT NULL,
      quote TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      thread_json TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      quote_prefix TEXT,
      quote_suffix TEXT,
      status TEXT NOT NULL DEFAULT 'anchored',
      confidence REAL
    );
    CREATE INDEX IF NOT EXISTS idx_annotations_doc_path ON annotations(doc_path);
    CREATE INDEX IF NOT EXISTS idx_annotations_doc_status ON annotations(doc_path, status);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS focus_signals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      type TEXT NOT NULL,
      file TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_focus_signals_ts ON focus_signals(ts);
    CREATE INDEX IF NOT EXISTS idx_focus_signals_file ON focus_signals(file);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS quick_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_sessions (
      doc_path   TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      running    INTEGER NOT NULL DEFAULT 0,
      run_id     TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agent_workspace_sessions (
      workspace_path TEXT PRIMARY KEY,
      session_id     TEXT NOT NULL,
      updated_at     INTEGER NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_runs (
      id                     TEXT PRIMARY KEY,
      doc_path               TEXT NOT NULL,
      session_id             TEXT NOT NULL,
      workspace_path         TEXT,
      command                TEXT,
      status                 TEXT NOT NULL,
      started_at             INTEGER NOT NULL,
      finished_at            INTEGER,
      input_tokens           INTEGER,
      output_tokens          INTEGER,
      cache_creation_tokens  INTEGER,
      cache_read_tokens      INTEGER,
      cost_usd               REAL,
      model                  TEXT,
      error                  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_agent_runs_workspace ON agent_runs(workspace_path, started_at);
    CREATE INDEX IF NOT EXISTS idx_agent_runs_doc_path ON agent_runs(doc_path, started_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS scan_metrics (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      source       TEXT NOT NULL,
      force        INTEGER NOT NULL DEFAULT 0,
      started_at   INTEGER NOT NULL,
      duration_ms  INTEGER NOT NULL,
      success      INTEGER NOT NULL,
      file_count   INTEGER,
      error        TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_scan_metrics_started_at ON scan_metrics(started_at);
    CREATE INDEX IF NOT EXISTS idx_scan_metrics_workspace ON scan_metrics(workspace_id, started_at);
  `);
  {
    const cols = db.query(`PRAGMA table_info(agent_runs)`).all() as Array<{ name: string }>;
    if (!cols.some((col) => col.name === "transcript_json")) {
      db.exec(`ALTER TABLE agent_runs ADD COLUMN transcript_json TEXT`);
    }
  }

  seedQuickComments(db);
  migrateAnnotationColumns(db);

  return db;
}

function seedQuickComments(database: Database): void {
  const qcCount = (database.query("SELECT COUNT(*) as n FROM quick_comments").get() as { n: number }).n;
  if (qcCount !== 0) return;

  const defaults = [
    "这是什么，解释一下",
    "有点抽象，举个例子",
    "单独写一篇文档介绍这个",
    "给一些数字，让我有个体感",
    "你确定吗？别猜，去代码里确认",
  ];
  const insertDefault = database.prepare("INSERT INTO quick_comments (text, sort_order) VALUES (?, ?)");
  defaults.forEach((text, i) => insertDefault.run(text, i));
}

function migrateAnnotationColumns(database: Database): void {
  const columns = database.query(`PRAGMA table_info(annotations)`).all() as Array<{ name: string }>;
  const hasSerial = columns.some((col) => col.name === "serial");
  const hasThreadJson = columns.some((col) => col.name === "thread_json");
  if (!hasSerial) {
    database.exec(`ALTER TABLE annotations ADD COLUMN serial INTEGER`);
  }
  if (!hasThreadJson) {
    database.exec(`ALTER TABLE annotations ADD COLUMN thread_json TEXT`);
  }
  const hasPage = columns.some((col) => col.name === "page");
  const hasFileType = columns.some((col) => col.name === "file_type");
  if (!hasPage) {
    database.exec(`ALTER TABLE annotations ADD COLUMN page INTEGER`);
  }
  if (!hasFileType) {
    database.exec(`ALTER TABLE annotations ADD COLUMN file_type TEXT NOT NULL DEFAULT 'md'`);
    // TODO: file_type 列已冗余，文件类型可直接从 doc_path 后缀推断。
    //       SQLite 不支持 DROP COLUMN（旧版本），需重建表时一并删除。
  }
  const hasRectCoords = columns.some((col) => col.name === "rect_coords_json");
  if (!hasRectCoords) {
    database.exec(`ALTER TABLE annotations ADD COLUMN rect_coords_json TEXT`);
  }
}
