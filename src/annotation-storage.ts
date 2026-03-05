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
  if (!id || !Number.isFinite(start) || !Number.isFinite(length) || length <= 0 || !quote) {
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
  };
}

export function listAnnotations(docPath: string): StoredAnnotation[] {
  const path = normalizeDocPath(docPath);
  if (!path) return [];
  const rows = getDb()
    .query(
      `SELECT id, start, length, quote, note, thread_json, created_at, quote_prefix, quote_suffix, status, confidence
       , serial
       FROM annotations WHERE doc_path = ? ORDER BY created_at ASC`
    )
    .all(path) as any[];

  return rows.map((row) => {
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
    };
  });
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
  const insertStmt = database.prepare(`
    INSERT OR REPLACE INTO annotations
      (id, serial, doc_path, start, length, quote, note, thread_json, created_at, updated_at, quote_prefix, quote_suffix, status, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tx = database.transaction((items: StoredAnnotation[]) => {
    removeStmt.run(path);
    for (const ann of items) {
      const thread = normalizeThreadItems(Array.isArray(ann.thread) ? ann.thread : []);
      insertStmt.run(
        ann.id,
        ann.serial ?? null,
        path,
        ann.start,
        ann.length,
        ann.quote,
        thread[0]?.note || ann.note,
        JSON.stringify(thread),
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
      `SELECT id, start, length, quote, note, thread_json, created_at, quote_prefix, quote_suffix, status, confidence
       , serial
       FROM annotations
       WHERE doc_path = ?
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(path, safeLimit, safeOffset) as any[];

  const annotations = rows.map((row) => {
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
    };
  }) as StoredAnnotation[];

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

  const all = listAnnotations(path);
  const target = all.find((ann) => {
    if (annotationRef.id && ann.id === annotationRef.id) return true;
    if (
      typeof annotationRef.serial === "number" &&
      Number.isFinite(annotationRef.serial) &&
      annotationRef.serial > 0 &&
      ann.serial === Math.floor(annotationRef.serial)
    ) {
      return true;
    }
    return false;
  });
  if (!target) return { ok: false, error: "未找到评论" };

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

  replaceAnnotations(path, all);
  return { ok: true, updated: target };
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
