import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { getConfigDir } from "./config.ts";

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

  const dir = getConfigDir();
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
