import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { join, resolve } from "path";
import { getConfigDir } from "./config.ts";

export interface StoredAnnotationThreadItem {
  id: string;
  type: "comment" | "reply";
  author?: string;
  note: string;
  createdAt: number;
}

export interface StoredAnnotation {
  id: string;
  serial?: number;
  start: number;
  length: number;
  quote: string;
  note: string;
  thread?: StoredAnnotationThreadItem[];
  createdAt: number;
  quotePrefix?: string;
  quoteSuffix?: string;
  status?: "anchored" | "unanchored" | "resolved";
  confidence?: number;
  // PDF-specific fields
  page?: number;
  fileType?: "md" | "pdf";
}

export interface AnnotationDocSummary {
  path: string;
  count: number;
  latestUpdatedAt: number;
  latestCreatedAt: number;
  anchoredCount: number;
  unanchoredCount: number;
  resolvedCount: number;
}

let db: Database | null = null;

/** Close and reset the DB singleton. Only for use in tests. */
export function resetDbForTesting(): void {
  if (db) { try { db.close(); } catch { /* ignore */ } }
  db = null;
}

function normalizeDocPath(path: string): string {
  const raw = (path || "").trim();
  if (!raw) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  return resolve(raw);
}

function normalizeThreadItems(items: any[]): StoredAnnotationThreadItem[] {
  const now = Date.now();
  const normalized = (Array.isArray(items) ? items : [])
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const typeRaw = String(item.type || (index === 0 ? "comment" : "reply"));
      const type = typeRaw === "reply" ? "reply" : "comment";
      const authorRaw = String(item.author || "").trim();
      const author = authorRaw || undefined;
      const note = String(item.note || "");
      const createdAtRaw = Number(item.createdAt);
      const createdAt = Number.isFinite(createdAtRaw) ? Math.floor(createdAtRaw) : now;
      if (!note.trim()) return null;
      const id = String(item.id || "").trim() || `${type}-${createdAt}-${Math.random().toString(16).slice(2, 8)}`;
      return { id, type, author, note, createdAt } as StoredAnnotationThreadItem;
    })
    .filter((item): item is StoredAnnotationThreadItem => !!item)
    .sort((a, b) => a.createdAt - b.createdAt);

  if (normalized.length > 0) {
    normalized[0].type = "comment";
    if (!normalized[0].author) normalized[0].author = "me";
    for (let i = 1; i < normalized.length; i += 1) {
      normalized[i].type = "reply";
      if (!normalized[i].author) normalized[i].author = "me";
    }
  }

  return normalized;
}

function buildThreadFromLegacyNote(note: string, createdAt: number, annotationId: string): StoredAnnotationThreadItem[] {
  const text = String(note || "");
  if (!text.trim()) return [];
  return [
    {
      id: `c-${annotationId || createdAt}`,
      type: "comment",
      author: "me",
      note: text,
      createdAt: Number.isFinite(createdAt) ? Math.floor(createdAt) : Date.now(),
    },
  ];
}

function parseThreadFromRow(rawThreadJson: unknown, note: string, createdAt: number, annotationId: string): StoredAnnotationThreadItem[] {
  if (typeof rawThreadJson === "string" && rawThreadJson.trim()) {
    try {
      const parsed = JSON.parse(rawThreadJson);
      const normalized = normalizeThreadItems(Array.isArray(parsed) ? parsed : []);
      if (normalized.length > 0) return normalized;
    } catch {
      // ignore invalid json
    }
  }
  return buildThreadFromLegacyNote(note, createdAt, annotationId);
}

function mapRowToAnnotation(row: any): StoredAnnotation {
  const thread = parseThreadFromRow(row.thread_json, row.note, row.created_at, row.id);
  return {
    id: row.id,
    serial: Number.isFinite(Number(row.serial)) && Number(row.serial) > 0 ? Number(row.serial) : undefined,
    start: row.start,
    length: row.length,
    quote: row.quote,
    note: thread[0]?.note || row.note,
    thread,
    createdAt: row.created_at,
    quotePrefix: row.quote_prefix || undefined,
    quoteSuffix: row.quote_suffix || undefined,
    status: row.status || "anchored",
    confidence: typeof row.confidence === "number" ? row.confidence : undefined,
    page: row.page ?? undefined,
    fileType: (row.file_type as "md" | "pdf") ?? "md",
  };
}

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

  const columns = db.query(`PRAGMA table_info(annotations)`).all() as Array<{ name: string }>;
  const hasSerial = columns.some((col) => col.name === "serial");
  const hasThreadJson = columns.some((col) => col.name === "thread_json");
  if (!hasSerial) {
    db.exec(`ALTER TABLE annotations ADD COLUMN serial INTEGER`);
  }
  if (!hasThreadJson) {
    db.exec(`ALTER TABLE annotations ADD COLUMN thread_json TEXT`);
  }
  const hasPage = columns.some((col) => col.name === "page");
  const hasFileType = columns.some((col) => col.name === "file_type");
  if (!hasPage) {
    db.exec(`ALTER TABLE annotations ADD COLUMN page INTEGER`);
  }
  if (!hasFileType) {
    db.exec(`ALTER TABLE annotations ADD COLUMN file_type TEXT NOT NULL DEFAULT 'md'`);
  }

  return db;
}

function normalizeAnnotation(input: any): StoredAnnotation | null {
  if (!input || typeof input !== "object") return null;
  const id = String(input.id || "").trim();
  const serialRaw = Number(input.serial);
  const serial = Number.isFinite(serialRaw) && serialRaw > 0 ? Math.floor(serialRaw) : undefined;
  const start = Number(input.start);
  const length = Number(input.length);
  const quote = String(input.quote || "");
  const note = String(input.note || "");
  const createdAt = Number(input.createdAt || Date.now());
  const isPdfAnnotation = input.fileType === "pdf";
  if (!id || !Number.isFinite(start) || !Number.isFinite(length) || (!isPdfAnnotation && length <= 0) || !quote) {
    return null;
  }
  const statusRaw = String(input.status || "anchored");
  const status = statusRaw === "resolved" || statusRaw === "unanchored" ? statusRaw : "anchored";
  const confidence = Number.isFinite(Number(input.confidence)) ? Number(input.confidence) : undefined;
  const quotePrefix = typeof input.quotePrefix === "string" ? input.quotePrefix : undefined;
  const quoteSuffix = typeof input.quoteSuffix === "string" ? input.quoteSuffix : undefined;
  const normalizedCreatedAt = Number.isFinite(createdAt) ? Math.floor(createdAt) : Date.now();

  const threadFromInput = normalizeThreadItems(Array.isArray(input.thread) ? input.thread : []);
  const thread = threadFromInput.length > 0
    ? threadFromInput
    : buildThreadFromLegacyNote(note, normalizedCreatedAt, id);
  const topNote = thread[0]?.note || note;

  const page = Number.isFinite(Number(input.page)) && Number(input.page) >= 1
    ? Math.floor(Number(input.page))
    : undefined;
  const fileType: "md" | "pdf" = input.fileType === "pdf" ? "pdf" : "md";

  return {
    id,
    serial,
    start: Math.max(0, Math.floor(start)),
    length: Math.max(1, Math.floor(length)),
    quote,
    note: topNote,
    thread,
    createdAt: normalizedCreatedAt,
    quotePrefix,
    quoteSuffix,
    status,
    confidence,
    page,
    fileType,
  };
}

function getAnnotationRowById(id: string): any | null {
  return getDb()
    .query(
      `SELECT id, serial, doc_path, start, length, quote, note, thread_json, created_at, updated_at, quote_prefix, quote_suffix, status, confidence, page, file_type
       FROM annotations WHERE id = ?`
    )
    .get(id) as any | null;
}

function getAnnotationRowByRef(path: string, annotationRef: { id?: string; serial?: number }): any | null {
  if (annotationRef.id) {
    return getDb()
      .query(
        `SELECT id, serial, doc_path, start, length, quote, note, thread_json, created_at, updated_at, quote_prefix, quote_suffix, status, confidence, page, file_type
         FROM annotations WHERE doc_path = ? AND id = ?`
      )
      .get(path, annotationRef.id) as any | null;
  }
  if (
    typeof annotationRef.serial === "number" &&
    Number.isFinite(annotationRef.serial) &&
    annotationRef.serial > 0
  ) {
    return getDb()
      .query(
        `SELECT id, serial, doc_path, start, length, quote, note, thread_json, created_at, updated_at, quote_prefix, quote_suffix, status, confidence, page, file_type
         FROM annotations WHERE doc_path = ? AND serial = ?`
      )
      .get(path, Math.floor(annotationRef.serial)) as any | null;
  }
  return null;
}

function getNextSerialForDoc(path: string): number {
  const row = getDb()
    .query(`SELECT COALESCE(MAX(serial), 0) as max_serial FROM annotations WHERE doc_path = ?`)
    .get(path) as { max_serial: number } | null;
  return Number(row?.max_serial || 0) + 1;
}

function writeAnnotationRow(path: string, ann: StoredAnnotation, updatedAt = Date.now()): StoredAnnotation {
  const database = getDb();
  const existingById = getAnnotationRowById(ann.id);
  const normalizedThread = normalizeThreadItems(Array.isArray(ann.thread) ? ann.thread : []);
  const existingSerial = existingById && String(existingById.doc_path) === path
    ? Number(existingById.serial || 0)
    : 0;
  const serial = ann.serial && ann.serial > 0
    ? Math.floor(ann.serial)
    : existingSerial > 0
      ? existingSerial
      : getNextSerialForDoc(path);
  const createdAt = existingById
    ? Number(existingById.created_at || ann.createdAt || Date.now())
    : Number(ann.createdAt || Date.now());

  database.prepare(`
    INSERT OR REPLACE INTO annotations
      (id, serial, doc_path, start, length, quote, note, thread_json, created_at, updated_at, quote_prefix, quote_suffix, status, confidence, page, file_type)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    ann.id,
    serial,
    path,
    ann.start,
    ann.length,
    ann.quote,
    normalizedThread[0]?.note || ann.note,
    JSON.stringify(normalizedThread),
    createdAt,
    updatedAt,
    ann.quotePrefix || null,
    ann.quoteSuffix || null,
    ann.status || "anchored",
    ann.confidence ?? null,
    ann.page ?? null,
    ann.fileType ?? "md"
  );

  const row = getAnnotationRowById(ann.id);
  return row ? mapRowToAnnotation(row) : { ...ann, serial, createdAt };
}

export function listAnnotations(docPath: string): StoredAnnotation[] {
  const path = normalizeDocPath(docPath);
  if (!path) return [];
  const rows = getDb()
    .query(
      `SELECT id, start, length, quote, note, thread_json, created_at, quote_prefix, quote_suffix, status, confidence, serial, page, file_type
       FROM annotations WHERE doc_path = ? ORDER BY created_at ASC`
    )
    .all(path) as any[];

  return rows.map((row) => mapRowToAnnotation(row));
}

export function replaceAnnotations(docPath: string, annotations: any[]): { saved: number } {
  const path = normalizeDocPath(docPath);
  if (!path) return { saved: 0 };
  const normalized = (Array.isArray(annotations) ? annotations : [])
    .map(normalizeAnnotation)
    .filter((v): v is StoredAnnotation => !!v);

  const database = getDb();
  const existingRows = database
    .query(`SELECT id, serial FROM annotations WHERE doc_path = ?`)
    .all(path) as Array<{ id: string; serial: number | null }>;
  const existingSerialByID = new Map<string, number>();
  let maxSerial = 0;
  for (const row of existingRows) {
    const s = Number(row.serial || 0);
    if (s > 0) {
      existingSerialByID.set(String(row.id), s);
      if (s > maxSerial) maxSerial = s;
    }
  }
  for (const ann of normalized) {
    if (!ann.serial || ann.serial <= 0) {
      const old = existingSerialByID.get(ann.id);
      if (old && old > 0) ann.serial = old;
    }
  }
  const used = new Set<number>();
  for (const ann of normalized) {
    const s = Number(ann.serial || 0);
    if (s > 0 && !used.has(s)) {
      used.add(s);
      if (s > maxSerial) maxSerial = s;
      continue;
    }
    maxSerial += 1;
    ann.serial = maxSerial;
    used.add(maxSerial);
  }

  const now = Date.now();
  const removeStmt = database.prepare("DELETE FROM annotations WHERE doc_path = ?");

  const tx = database.transaction((items: StoredAnnotation[]) => {
    removeStmt.run(path);
    for (const ann of items) {
      writeAnnotationRow(path, ann, now);
    }
  });
  tx(normalized);
  return { saved: normalized.length };
}

export function upsertAnnotation(
  docPath: string,
  annotation: any
): { ok: boolean; annotation?: StoredAnnotation; error?: string } {
  const path = normalizeDocPath(docPath);
  if (!path) return { ok: false, error: "缺少文档路径" };
  const normalized = normalizeAnnotation(annotation);
  if (!normalized) return { ok: false, error: "评论数据无效" };
  const saved = writeAnnotationRow(path, normalized);
  return { ok: true, annotation: saved };
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
  const safeLimit = Math.max(1, Math.min(10000, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  const rows = getDb()
    .query(
      `SELECT
         doc_path,
         COUNT(1) as count,
         MAX(updated_at) as latest_updated_at,
         MAX(created_at) as latest_created_at,
         SUM(CASE WHEN status = 'anchored' THEN 1 ELSE 0 END) as anchored_count,
         SUM(CASE WHEN status = 'unanchored' THEN 1 ELSE 0 END) as unanchored_count,
         SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
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
    resolvedCount: Number(row.resolved_count || 0),
  }));
}

export function getAnnotationsByDocument(
  docPath: string,
  limit = 100,
  offset = 0,
  statusFilter: "open" | "all" = "open"
): { path: string; total: number; annotations: StoredAnnotation[] } {
  const path = normalizeDocPath(docPath);
  const safeLimit = Math.max(1, Math.min(1000, Math.floor(limit)));
  const safeOffset = Math.max(0, Math.floor(offset));
  if (!path) return { path, total: 0, annotations: [] };

  const whereStatus = statusFilter === "open"
    ? "AND status = 'anchored'"
    : "";

  const totalRow = getDb()
    .query(`SELECT COUNT(1) as count FROM annotations WHERE doc_path = ? ${whereStatus}`)
    .get(path) as { count: number } | null;
  const total = Number(totalRow?.count || 0);

  const rows = getDb()
    .query(
      `SELECT id, start, length, quote, note, thread_json, created_at, quote_prefix, quote_suffix, status, confidence
       , serial
       FROM annotations
       WHERE doc_path = ? ${whereStatus}
       ORDER BY created_at ASC
       LIMIT ? OFFSET ?`
    )
    .all(path, safeLimit, safeOffset) as any[];

  const annotations = rows.map((row) => mapRowToAnnotation(row)) as StoredAnnotation[];

  return { path, total, annotations };
}

export function appendAnnotationReply(
  docPath: string,
  annotationRef: { id?: string; serial?: number },
  replyText: string,
  author: string
): { ok: boolean; updated?: StoredAnnotation; error?: string } {
  const path = normalizeDocPath(docPath);
  if (!path) return { ok: false, error: "缺少文档路径" };
  const text = String(replyText || "").trim();
  if (!text) return { ok: false, error: "回复内容不能为空" };
  const authorText = String(author || "").trim();
  if (!authorText) return { ok: false, error: "回复作者不能为空" };

  const targetRow = getAnnotationRowByRef(path, annotationRef);
  if (!targetRow) return { ok: false, error: "未找到评论" };
  const target = mapRowToAnnotation(targetRow);

  const now = Date.now();
  const nextThread = normalizeThreadItems([
    ...(target.thread || buildThreadFromLegacyNote(target.note, target.createdAt, target.id)),
    {
      id: `r-${now}-${Math.random().toString(16).slice(2, 8)}`,
      type: "reply",
      author: authorText,
      note: text,
      createdAt: now,
    },
  ]);
  target.thread = nextThread;
  target.note = nextThread[0]?.note || target.note;

  const updated = writeAnnotationRow(path, target);
  return { ok: true, updated };
}

export function deleteAnnotation(
  docPath: string,
  annotationRef: { id?: string; serial?: number }
): { ok: boolean; deleted?: boolean; error?: string } {
  const path = normalizeDocPath(docPath);
  if (!path) return { ok: false, error: "缺少文档路径" };
  const targetRow = getAnnotationRowByRef(path, annotationRef);
  if (!targetRow) return { ok: false, error: "未找到评论" };
  getDb().query(`DELETE FROM annotations WHERE id = ?`).run(String(targetRow.id));
  return { ok: true, deleted: true };
}

export function updateAnnotationStatus(
  docPath: string,
  annotationRef: { id?: string; serial?: number },
  status: "anchored" | "unanchored" | "resolved"
): { ok: boolean; updated?: StoredAnnotation; error?: string } {
  const path = normalizeDocPath(docPath);
  if (!path) return { ok: false, error: "缺少文档路径" };
  const nextStatus = status === "resolved" || status === "unanchored" ? status : "anchored";
  const targetRow = getAnnotationRowByRef(path, annotationRef);
  if (!targetRow) return { ok: false, error: "未找到评论" };
  getDb()
    .query(`UPDATE annotations SET status = ?, updated_at = ? WHERE id = ?`)
    .run(nextStatus, Date.now(), String(targetRow.id));
  const updatedRow = getAnnotationRowById(String(targetRow.id));
  return { ok: true, updated: updatedRow ? mapRowToAnnotation(updatedRow) : undefined };
}

export function clearAllAnnotations(): { deleted: number; documents: number } {
  const database = getDb();
  const row = database
    .query(`SELECT COUNT(1) as count, COUNT(DISTINCT doc_path) as docs FROM annotations`)
    .get() as { count: number; docs: number } | null;
  const deleted = Number(row?.count || 0);
  const documents = Number(row?.docs || 0);
  database.query(`DELETE FROM annotations`).run();
  return { deleted, documents };
}

export function tidyMissingFiles(): { deleted: number; documents: number } {
  const database = getDb();
  const paths = database
    .query(`SELECT DISTINCT doc_path FROM annotations`)
    .all() as { doc_path: string }[];
  const missing = paths
    .map((r) => r.doc_path)
    .filter((p) => !/^https?:\/\//i.test(p) && !existsSync(p));
  if (missing.length === 0) return { deleted: 0, documents: 0 };
  const stmt = database.prepare(`DELETE FROM annotations WHERE doc_path = ?`);
  let deleted = 0;
  for (const p of missing) {
    const countRow = database
      .query(`SELECT COUNT(1) as count FROM annotations WHERE doc_path = ?`)
      .get(p) as { count: number } | null;
    deleted += Number(countRow?.count || 0);
    stmt.run(p);
  }
  return { deleted, documents: missing.length };
}

export function tidyAnnotations(olderThanDays = 7): { deleted: number; documents: number } {
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const database = getDb();
  const rows = database
    .query(
      `SELECT COUNT(1) as count, COUNT(DISTINCT doc_path) as docs
       FROM annotations
       WHERE status IN ('resolved', 'unanchored') AND updated_at < ?`
    )
    .get(cutoff) as { count: number; docs: number } | null;
  const deleted = Number(rows?.count || 0);
  const documents = Number(rows?.docs || 0);
  database
    .query(`DELETE FROM annotations WHERE status IN ('resolved', 'unanchored') AND updated_at < ?`)
    .run(cutoff);
  return { deleted, documents };
}
