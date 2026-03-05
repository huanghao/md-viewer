/**
 * 同步记录存储管理（SQLite）
 * 管理最近使用的位置、文件同步状态、同步历史与偏好设置
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync, readFileSync, renameSync } from "fs";
import { join, resolve } from "path";
import { getConfigDir } from "./config.ts";

// 同步记录保留时间（6 个月）
const SYNC_RECORD_MAX_AGE = 6 * 30 * 24 * 60 * 60 * 1000;
const RECENT_PARENT_LIMIT = 10;
const LEGACY_SYNC_RECORDS_JSON = "sync-records.json";
const LEGACY_SYNC_RECORDS_MIGRATED_SUFFIX = "sync-records.migrated.json";

export interface RecentParent {
  id: string;
  title: string;
  url: string;
  lastUsed: number;
  useCount: number;
}

export interface SyncedFileInfo {
  kmDocId: string;
  kmUrl: string;
  kmTitle: string;
  baseTitle: string;
  version: number;
  parentId: string;
  lastSyncTime: number;
  command?: string;
}

export interface SyncHistoryEntry {
  version: number;
  kmDocId?: string;
  kmUrl?: string;
  kmTitle: string;
  parentId: string;
  status: "success" | "failed" | "abandoned";
  syncedAt: number;
  command?: string;
  error?: string;
}

export interface SyncRecords {
  recentParents: RecentParent[];
  syncedFiles: Record<string, SyncedFileInfo>;
  syncedHistory?: Record<string, SyncHistoryEntry[]>;
  defaultParentId?: string;
  preferences?: Record<string, any>;
}

let db: Database | null = null;

function getDb(): Database {
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

    CREATE TABLE IF NOT EXISTS sync_recent_parents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      last_used INTEGER NOT NULL,
      use_count INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sync_files (
      file_path TEXT PRIMARY KEY,
      km_doc_id TEXT NOT NULL,
      km_url TEXT NOT NULL,
      km_title TEXT NOT NULL,
      base_title TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      parent_id TEXT NOT NULL,
      last_sync_time INTEGER NOT NULL,
      command TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sync_files_last_sync_time ON sync_files(last_sync_time DESC);

    CREATE TABLE IF NOT EXISTS sync_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL,
      version INTEGER NOT NULL,
      km_doc_id TEXT,
      km_url TEXT,
      km_title TEXT NOT NULL,
      parent_id TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'abandoned')),
      synced_at INTEGER NOT NULL,
      command TEXT,
      error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sync_history_file_path_synced_at ON sync_history(file_path, synced_at DESC);

    CREATE TABLE IF NOT EXISTS sync_preferences (
      pref_key TEXT PRIMARY KEY,
      pref_value_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_meta (
      meta_key TEXT PRIMARY KEY,
      meta_value TEXT
    );
  `);

  migrateLegacyJsonIfNeeded(db, dir);
  cleanupExpiredSyncRecords(db);
  return db;
}

function normalizePath(path: string): string {
  const raw = (path || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return resolve(raw);
}

function parseJsonValue(raw: string): any {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

function loadSyncRecordsFromLegacyJson(dir: string): SyncRecords | null {
  const legacyPath = join(dir, LEGACY_SYNC_RECORDS_JSON);
  if (!existsSync(legacyPath)) return null;
  try {
    const raw = JSON.parse(readFileSync(legacyPath, "utf-8"));
    return {
      recentParents: Array.isArray(raw?.recentParents) ? raw.recentParents : [],
      syncedFiles: raw?.syncedFiles && typeof raw.syncedFiles === "object" ? raw.syncedFiles : {},
      syncedHistory: raw?.syncedHistory && typeof raw.syncedHistory === "object" ? raw.syncedHistory : {},
      defaultParentId: typeof raw?.defaultParentId === "string" ? raw.defaultParentId : undefined,
      preferences: raw?.preferences && typeof raw.preferences === "object" ? raw.preferences : {},
    };
  } catch (error) {
    console.error("读取旧版 sync-records.json 失败:", error);
    return null;
  }
}

function migrateLegacyJsonIfNeeded(database: Database, dir: string): void {
  const migrated = database
    .query("SELECT meta_value FROM sync_meta WHERE meta_key = 'legacy_json_migrated'")
    .get() as { meta_value: string | null } | null;
  if (migrated?.meta_value === "1") return;

  const legacy = loadSyncRecordsFromLegacyJson(dir);
  if (!legacy) {
    database
      .query("INSERT OR REPLACE INTO sync_meta(meta_key, meta_value) VALUES ('legacy_json_migrated', '1')")
      .run();
    return;
  }

  const now = Date.now();
  const insertRecent = database.prepare(`
    INSERT OR REPLACE INTO sync_recent_parents(id, title, url, last_used, use_count)
    VALUES (?, ?, ?, ?, ?)
  `);
  const insertSyncFile = database.prepare(`
    INSERT OR REPLACE INTO sync_files(file_path, km_doc_id, km_url, km_title, base_title, version, parent_id, last_sync_time, command)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertHistory = database.prepare(`
    INSERT INTO sync_history(file_path, version, km_doc_id, km_url, km_title, parent_id, status, synced_at, command, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertPref = database.prepare(`
    INSERT OR REPLACE INTO sync_preferences(pref_key, pref_value_json)
    VALUES (?, ?)
  `);
  const setMeta = database.prepare(`
    INSERT OR REPLACE INTO sync_meta(meta_key, meta_value)
    VALUES (?, ?)
  `);

  const tx = database.transaction(() => {
    for (const parent of legacy.recentParents || []) {
      const id = String(parent?.id || "").trim();
      if (!id) continue;
      insertRecent.run(
        id,
        String(parent?.title || `Parent ${id}`),
        String(parent?.url || ""),
        Number(parent?.lastUsed || now),
        Math.max(1, Number(parent?.useCount || 1))
      );
    }

    for (const [rawPath, info] of Object.entries(legacy.syncedFiles || {})) {
      const filePath = normalizePath(rawPath);
      const row = info as Partial<SyncedFileInfo>;
      if (!filePath || !row?.kmDocId || !row?.kmTitle || !row?.parentId) continue;
      const version = Number.isFinite(Number(row.version)) ? Math.max(1, Number(row.version)) : 1;
      insertSyncFile.run(
        filePath,
        String(row.kmDocId),
        String(row.kmUrl || ""),
        String(row.kmTitle),
        String(row.baseTitle || row.kmTitle),
        version,
        String(row.parentId),
        Number(row.lastSyncTime || now),
        typeof row.command === "string" ? row.command : null
      );
    }

    for (const [rawPath, entries] of Object.entries(legacy.syncedHistory || {})) {
      const filePath = normalizePath(rawPath);
      if (!filePath || !Array.isArray(entries)) continue;
      for (const item of entries) {
        const row = item as Partial<SyncHistoryEntry>;
        const status = row.status === "failed" || row.status === "abandoned" ? row.status : "success";
        if (!row?.kmTitle || !row?.parentId) continue;
        insertHistory.run(
          filePath,
          Number.isFinite(Number(row.version)) ? Math.max(1, Number(row.version)) : 1,
          row.kmDocId || null,
          row.kmUrl || null,
          String(row.kmTitle),
          String(row.parentId),
          status,
          Number(row.syncedAt || now),
          typeof row.command === "string" ? row.command : null,
          typeof row.error === "string" ? row.error : null
        );
      }
    }

    for (const [key, value] of Object.entries(legacy.preferences || {})) {
      insertPref.run(String(key), JSON.stringify(value));
    }
    if (legacy.defaultParentId) {
      setMeta.run("default_parent_id", String(legacy.defaultParentId));
    }
    setMeta.run("legacy_json_migrated", "1");
  });

  tx();

  const legacyPath = join(dir, LEGACY_SYNC_RECORDS_JSON);
  const migratedPath = join(dir, LEGACY_SYNC_RECORDS_MIGRATED_SUFFIX);
  try {
    if (existsSync(legacyPath) && !existsSync(migratedPath)) {
      renameSync(legacyPath, migratedPath);
    }
  } catch (error) {
    console.warn("旧版 sync-records.json 迁移后重命名失败:", error);
  }
}

function cleanupExpiredSyncRecords(database: Database): number {
  const expiryBefore = Date.now() - SYNC_RECORD_MAX_AGE;
  const expiredRows = database
    .query("SELECT file_path FROM sync_files WHERE last_sync_time < ?")
    .all(expiryBefore) as Array<{ file_path: string }>;

  if (expiredRows.length === 0) return 0;
  const removeFile = database.prepare("DELETE FROM sync_files WHERE file_path = ?");
  const removeHistory = database.prepare("DELETE FROM sync_history WHERE file_path = ?");
  const tx = database.transaction((paths: string[]) => {
    for (const path of paths) {
      removeFile.run(path);
      removeHistory.run(path);
    }
  });
  tx(expiredRows.map((row) => row.file_path));
  return expiredRows.length;
}

export function loadSyncRecords(): SyncRecords {
  const database = getDb();
  const recentParents = getRecentParents();
  const files = database
    .query(
      "SELECT file_path, km_doc_id, km_url, km_title, base_title, version, parent_id, last_sync_time, command FROM sync_files"
    )
    .all() as any[];
  const syncedFiles: Record<string, SyncedFileInfo> = {};
  for (const row of files) {
    syncedFiles[row.file_path] = {
      kmDocId: row.km_doc_id,
      kmUrl: row.km_url,
      kmTitle: row.km_title,
      baseTitle: row.base_title,
      version: Number(row.version || 1),
      parentId: row.parent_id,
      lastSyncTime: Number(row.last_sync_time || 0),
      command: row.command || undefined,
    };
  }

  return {
    recentParents,
    syncedFiles,
    syncedHistory: {},
    defaultParentId: getDefaultParentId(),
    preferences: getSyncPreferences(),
  };
}

export function saveSyncRecords(_records: SyncRecords): void {
  // SQLite 持久化路径下不再支持整包覆写，保留空实现用于兼容旧调用。
}

export function addRecentParent(parentId: string, title: string, url: string): void {
  const id = String(parentId || "").trim();
  if (!id) return;
  const now = Date.now();
  const database = getDb();

  database.exec("BEGIN IMMEDIATE");
  try {
    const current = database
      .query("SELECT use_count FROM sync_recent_parents WHERE id = ?")
      .get(id) as { use_count: number } | null;
    if (current) {
      database
        .query("UPDATE sync_recent_parents SET title = ?, url = ?, last_used = ?, use_count = ? WHERE id = ?")
        .run(title || `Parent ${id}`, url || "", now, Number(current.use_count || 0) + 1, id);
    } else {
      database
        .query("INSERT INTO sync_recent_parents(id, title, url, last_used, use_count) VALUES (?, ?, ?, ?, ?)")
        .run(id, title || `Parent ${id}`, url || "", now, 1);
    }

    database
      .query("INSERT OR REPLACE INTO sync_meta(meta_key, meta_value) VALUES ('default_parent_id', ?)")
      .run(id);

    const overflow = database
      .query(
        "SELECT id FROM sync_recent_parents ORDER BY last_used DESC, id ASC LIMIT -1 OFFSET ?"
      )
      .all(RECENT_PARENT_LIMIT) as Array<{ id: string }>;
    if (overflow.length > 0) {
      const removeStmt = database.prepare("DELETE FROM sync_recent_parents WHERE id = ?");
      for (const row of overflow) {
        removeStmt.run(row.id);
      }
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function getRecentParents(): RecentParent[] {
  const rows = getDb()
    .query(
      "SELECT id, title, url, last_used, use_count FROM sync_recent_parents ORDER BY last_used DESC, id ASC LIMIT ?"
    )
    .all(RECENT_PARENT_LIMIT) as any[];
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    url: row.url,
    lastUsed: Number(row.last_used || 0),
    useCount: Number(row.use_count || 1),
  }));
}

export function updateRecentParentMeta(parentId: string, title?: string, url?: string): void {
  const id = String(parentId || "").trim();
  if (!id) return;
  const updates: string[] = [];
  const values: any[] = [];
  if (title && title.trim()) {
    updates.push("title = ?");
    values.push(title.trim());
  }
  if (url && url.trim()) {
    updates.push("url = ?");
    values.push(url.trim());
  }
  if (updates.length === 0) return;
  values.push(id);
  getDb()
    .query(`UPDATE sync_recent_parents SET ${updates.join(", ")} WHERE id = ?`)
    .run(...values);
}

export function saveSyncedFile(filePath: string, info: SyncedFileInfo): void {
  const normalizedPath = normalizePath(filePath);
  if (!normalizedPath) return;
  getDb()
    .query(`
      INSERT OR REPLACE INTO sync_files
        (file_path, km_doc_id, km_url, km_title, base_title, version, parent_id, last_sync_time, command)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      normalizedPath,
      info.kmDocId,
      info.kmUrl,
      info.kmTitle,
      info.baseTitle || info.kmTitle,
      Math.max(1, Number(info.version || 1)),
      info.parentId,
      Number(info.lastSyncTime || Date.now()),
      info.command || null
    );
}

export function getSyncedFile(filePath: string): SyncedFileInfo | null {
  const normalizedPath = normalizePath(filePath);
  if (!normalizedPath) return null;
  const row = getDb()
    .query(`
      SELECT km_doc_id, km_url, km_title, base_title, version, parent_id, last_sync_time, command
      FROM sync_files
      WHERE file_path = ?
    `)
    .get(normalizedPath) as any;
  if (!row) return null;
  return {
    kmDocId: row.km_doc_id,
    kmUrl: row.km_url,
    kmTitle: row.km_title,
    baseTitle: row.base_title,
    version: Number(row.version || 1),
    parentId: row.parent_id,
    lastSyncTime: Number(row.last_sync_time || 0),
    command: row.command || undefined,
  };
}

export function removeSyncedFile(filePath: string): void {
  const normalizedPath = normalizePath(filePath);
  if (!normalizedPath) return;
  const database = getDb();
  database.exec("BEGIN IMMEDIATE");
  try {
    database.query("DELETE FROM sync_files WHERE file_path = ?").run(normalizedPath);
    database.query("DELETE FROM sync_history WHERE file_path = ?").run(normalizedPath);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function appendSyncHistory(filePath: string, entry: SyncHistoryEntry, maxEntries = 20): void {
  const normalizedPath = normalizePath(filePath);
  if (!normalizedPath) return;
  const limit = Math.max(1, Math.floor(maxEntries));
  const database = getDb();
  database.exec("BEGIN IMMEDIATE");
  try {
    database
      .query(`
        INSERT INTO sync_history
          (file_path, version, km_doc_id, km_url, km_title, parent_id, status, synced_at, command, error)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        normalizedPath,
        Math.max(1, Number(entry.version || 1)),
        entry.kmDocId || null,
        entry.kmUrl || null,
        entry.kmTitle,
        entry.parentId,
        entry.status,
        Number(entry.syncedAt || Date.now()),
        entry.command || null,
        entry.error || null
      );

    const overflow = database
      .query(
        `SELECT id FROM sync_history
         WHERE file_path = ?
         ORDER BY synced_at DESC, id DESC
         LIMIT -1 OFFSET ?`
      )
      .all(normalizedPath, limit) as Array<{ id: number }>;
    if (overflow.length > 0) {
      const removeStmt = database.prepare("DELETE FROM sync_history WHERE id = ?");
      for (const row of overflow) {
        removeStmt.run(row.id);
      }
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

export function getSyncHistory(filePath: string): SyncHistoryEntry[] {
  const normalizedPath = normalizePath(filePath);
  if (!normalizedPath) return [];
  const rows = getDb()
    .query(`
      SELECT version, km_doc_id, km_url, km_title, parent_id, status, synced_at, command, error
      FROM sync_history
      WHERE file_path = ?
      ORDER BY synced_at DESC, id DESC
    `)
    .all(normalizedPath) as any[];
  return rows.map((row) => ({
    version: Number(row.version || 1),
    kmDocId: row.km_doc_id || undefined,
    kmUrl: row.km_url || undefined,
    kmTitle: row.km_title,
    parentId: row.parent_id,
    status: row.status,
    syncedAt: Number(row.synced_at || 0),
    command: row.command || undefined,
    error: row.error || undefined,
  }));
}

export function getDefaultParentId(): string | undefined {
  const row = getDb()
    .query("SELECT meta_value FROM sync_meta WHERE meta_key = 'default_parent_id'")
    .get() as { meta_value: string | null } | null;
  const value = String(row?.meta_value || "").trim();
  return value || undefined;
}

export function cleanupAllExpiredRecords(): number {
  return cleanupExpiredSyncRecords(getDb());
}

export function getSyncPreferences(): Record<string, any> {
  const rows = getDb()
    .query("SELECT pref_key, pref_value_json FROM sync_preferences")
    .all() as Array<{ pref_key: string; pref_value_json: string }>;
  const preferences: Record<string, any> = {};
  for (const row of rows) {
    preferences[row.pref_key] = parseJsonValue(row.pref_value_json);
  }
  return preferences;
}

export function setSyncPreference(key: string, value: any): void {
  const prefKey = String(key || "").trim();
  if (!prefKey) return;
  getDb()
    .query("INSERT OR REPLACE INTO sync_preferences(pref_key, pref_value_json) VALUES (?, ?)")
    .run(prefKey, JSON.stringify(value));
}

export function getSyncRecordsStats(): {
  totalFiles: number;
  expiredFiles: number;
  recentParents: number;
  oldestSync: number | null;
  newestSync: number | null;
} {
  const database = getDb();
  const totalRow = database
    .query("SELECT COUNT(1) as count FROM sync_files")
    .get() as { count: number } | null;
  const parentRow = database
    .query("SELECT COUNT(1) as count FROM sync_recent_parents")
    .get() as { count: number } | null;
  const rangeRow = database
    .query("SELECT MIN(last_sync_time) as oldest, MAX(last_sync_time) as newest FROM sync_files")
    .get() as { oldest: number | null; newest: number | null } | null;
  const expiredRow = database
    .query("SELECT COUNT(1) as count FROM sync_files WHERE last_sync_time < ?")
    .get(Date.now() - SYNC_RECORD_MAX_AGE) as { count: number } | null;

  return {
    totalFiles: Number(totalRow?.count || 0),
    expiredFiles: Number(expiredRow?.count || 0),
    recentParents: Number(parentRow?.count || 0),
    oldestSync: rangeRow?.oldest ? Number(rangeRow.oldest) : null,
    newestSync: rangeRow?.newest ? Number(rangeRow.newest) : null,
  };
}
