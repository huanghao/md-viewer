import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { getConfigDir } from "./config.ts";

export interface StoredAnnotation {
  id: string;
  start: number;
  length: number;
  quote: string;
  note: string;
  createdAt: number;
  quotePrefix?: string;
  quoteSuffix?: string;
  status?: "anchored" | "unanchored" | "resolved";
  confidence?: number;
}

export interface AnnotationDocSummary {
  path: string;
  count: number;
  latestUpdatedAt: number;
  latestCreatedAt: number;
  anchoredCount: number;
  unanchoredCount: number;
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
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      doc_path TEXT NOT NULL,
      start INTEGER NOT NULL,
      length INTEGER NOT NULL,
      quote TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      quote_prefix TEXT,
      quote_suffix TEXT,
      status TEXT NOT NULL DEFAULT 'anchored',
      confidence REAL
    );
    CREATE INDEX IF NOT EXISTS idx_annotations_doc_path ON annotations(doc_path);
  `);

  return db;
}

function normalizeDocPath(path: string): string {
  const raw = (path || "").trim();
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return resolve(raw);
}

function normalizeAnnotation(input: any): StoredAnnotation | null {
  if (!input || typeof input !== "object") return null;
  const id = String(input.id || "").trim();
  const start = Number(input.start);
  const length = Number(input.length);
  const quote = String(input.quote || "");
  const note = String(input.note || "");
  const createdAt = Number(input.createdAt || Date.now());
  if (!id || !Number.isFinite(start) || !Number.isFinite(length) || length <= 0 || !quote) {
    return null;
  }
  const statusRaw = String(input.status || "anchored");
  const status = statusRaw === "resolved" || statusRaw === "unanchored" ? statusRaw : "anchored";
  const confidence = Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : undefined;
  const quotePrefix = typeof input.quotePrefix === "string" ? input.quotePrefix : undefined;
  const quoteSuffix = typeof input.quoteSuffix === "string" ? input.quoteSuffix : undefined;

  return {
    id,
    start: Math.max(0, Math.floor(start)),
    length: Math.max(1, Math.floor(length)),
    quote,
    note,
    createdAt: Number.isFinite(createdAt) ? Math.floor(createdAt) : Date.now(),
    quotePrefix,
    quoteSuffix,
    status,
    confidence,
  };
}

export function listAnnotations(docPath: string): StoredAnnotation[] {
  const path = normalizeDocPath(docPath);
  if (!path) return [];
  const rows = getDb()
    .query(
      `SELECT id, start, length, quote, note, created_at, quote_prefix, quote_suffix, status, confidence
       FROM annotations WHERE doc_path = ? ORDER BY created_at ASC`
    )
    .all(path) as any[];

  return rows.map((row) => ({
    id: row.id,
    start: row.start,
    length: row.length,
    quote: row.quote,
    note: row.note,
    createdAt: row.created_at,
    quotePrefix: row.quote_prefix || undefined,
    quoteSuffix: row.quote_suffix || undefined,
    status: row.status || "anchored",
    confidence: typeof row.confidence === "number" ? row.confidence : undefined,
  }));
}

export function replaceAnnotations(docPath: string, annotations: any[]): { saved: number } {
  const path = normalizeDocPath(docPath);
  if (!path) return { saved: 0 };
  const normalized = (Array.isArray(annotations) ? annotations : [])
    .map(normalizeAnnotation)
    .filter((v): v is StoredAnnotation => !!v);

  const database = getDb();
  const now = Date.now();
  const removeStmt = database.prepare("DELETE FROM annotations WHERE doc_path = ?");
  const insertStmt = database.prepare(`
    INSERT OR REPLACE INTO annotations
      (id, doc_path, start, length, quote, note, created_at, updated_at, quote_prefix, quote_suffix, status, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = database.transaction((items: StoredAnnotation[]) => {
    removeStmt.run(path);
    for (const ann of items) {
      insertStmt.run(
        ann.id,
        path,
        ann.start,
        ann.length,
        ann.quote,
        ann.note,
        ann.createdAt,
        now,
        ann.quotePrefix || null,
        ann.quoteSuffix || null,
        ann.status || "anchored",
        ann.confidence ?? null
      );
    }
  });
  tx(normalized);
  return { saved: normalized.length };
}

export function importLegacyAnnotations(
  byPath: Record<string, any[]>
): { importedFiles: number; importedAnnotations: number; skippedFiles: number } {
  const data = byPath && typeof byPath === "object" ? byPath : {};
  const database = getDb();
  const existingStmt = database.prepare("SELECT COUNT(1) as count FROM annotations WHERE doc_path = ?");
  let importedFiles = 0;
  let importedAnnotations = 0;
  let skippedFiles = 0;

  for (const [rawPath, anns] of Object.entries(data)) {
    const path = normalizeDocPath(rawPath);
    if (!path) continue;
    const existing = existingStmt.get(path) as { count: number } | null;
    if (existing && existing.count > 0) {
      skippedFiles += 1;
      continue;
    }
    const result = replaceAnnotations(path, anns || []);
    if (result.saved > 0) {
      importedFiles += 1;
      importedAnnotations += result.saved;
    }
  }

  return { importedFiles, importedAnnotations, skippedFiles };
}

export function listAnnotatedDocuments(limit = 20, offset = 0): AnnotationDocSummary[] {
  const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  const rows = getDb()
    .query(
      `SELECT
         doc_path,
         COUNT(1) as count,
         MAX(updated_at) as latest_updated_at,
         MAX(created_at) as latest_created_at,
         SUM(CASE WHEN status = 'unanchored' THEN 1 ELSE 0 END) as unanchored_count,
         SUM(CASE WHEN status != 'unanchored' THEN 1 ELSE 0 END) as anchored_count
       FROM annotations
       GROUP BY doc_path
       ORDER BY latest_updated_at DESC, latest_created_at DESC, doc_path ASC
       LIMIT ? OFFSET ?`
    )
    .all(safeLimit, safeOffset) as any[];

  return rows.map((row) => ({
    path: row.doc_path,
    count: Number(row.count || 0),
    latestUpdatedAt: Number(row.latest_updated_at || 0),
    latestCreatedAt: Number(row.latest_created_at || 0),
    anchoredCount: Number(row.anchored_count || 0),
    unanchoredCount: Number(row.unanchored_count || 0),
  }));
}

export function getAnnotationsByDocument(
  docPath: string,
  limit = 100,
  offset = 0
): { path: string; total: number; annotations: StoredAnnotation[] } {
  const path = normalizeDocPath(docPath);
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  if (!path) return { path, total: 0, annotations: [] };

  const totalRow = getDb()
    .query(`SELECT COUNT(1) as count FROM annotations WHERE doc_path = ?`)
    .get(path) as { count: number } | null;
  const total = Number(totalRow?.count || 0);

  const rows = getDb()
    .query(
      `SELECT id, start, length, quote, note, created_at, quote_prefix, quote_suffix, status, confidence
       FROM annotations
       WHERE doc_path = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(path, safeLimit, safeOffset) as any[];

  const annotations = rows.map((row) => ({
    id: row.id,
    start: row.start,
    length: row.length,
    quote: row.quote,
    note: row.note,
    createdAt: row.created_at,
    quotePrefix: row.quote_prefix || undefined,
    quoteSuffix: row.quote_suffix || undefined,
    status: row.status || "anchored",
    confidence: typeof row.confidence === "number" ? row.confidence : undefined,
  })) as StoredAnnotation[];

  return { path, total, annotations };
}
