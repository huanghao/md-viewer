import { existsSync } from 'fs';
import { getDb, resetDbForTesting as resetAnnotationDb } from './annotation-storage.ts';

export interface StoredTodo {
  id: string;
  filePath: string;
  quote: string;
  quotePrefix?: string;
  quoteSuffix?: string;
  note: string;
  done: boolean;
  createdAt: number;
  doneAt?: number;
}

export { resetAnnotationDb as resetDbForTesting };

function rowToTodo(row: any): StoredTodo {
  return {
    id: row.id,
    filePath: row.file_path,
    quote: row.quote,
    quotePrefix: row.quote_prefix ?? undefined,
    quoteSuffix: row.quote_suffix ?? undefined,
    note: row.note ?? '',
    done: row.done === 1,
    createdAt: row.created_at,
    doneAt: row.done_at ?? undefined,
  };
}

export function createTodo(input: {
  filePath: string;
  quote: string;
  quotePrefix?: string;
  quoteSuffix?: string;
  note?: string;
}): StoredTodo {
  if (!input.filePath?.trim() || !input.quote?.trim()) {
    throw new Error('filePath and quote are required');
  }
  const id = `todo-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const now = Date.now();
  getDb().prepare(`
    INSERT INTO todos (id, file_path, quote, quote_prefix, quote_suffix, note, done, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `).run(id, input.filePath, input.quote,
         input.quotePrefix ?? null, input.quoteSuffix ?? null,
         input.note ?? '', now);
  return rowToTodo(getDb().query('SELECT * FROM todos WHERE id = ?').get(id));
}

export function listTodos(filter: { done?: boolean } = {}): StoredTodo[] {
  if (filter.done === undefined) {
    const rows = getDb().query('SELECT * FROM todos ORDER BY created_at DESC').all();
    return (rows as any[]).map(rowToTodo);
  }
  const rows = getDb().query('SELECT * FROM todos WHERE done = ? ORDER BY created_at DESC').all(filter.done ? 1 : 0);
  return (rows as any[]).map(rowToTodo);
}

export function updateTodo(id: string, patch: { done?: boolean; note?: string }): StoredTodo | null {
  const row = getDb().query('SELECT * FROM todos WHERE id = ?').get(id) as any;
  if (!row) return null;
  const now = Date.now();
  const done = patch.done !== undefined ? patch.done : row.done === 1;
  const doneAt = done ? (row.done_at ?? now) : null;
  const note = patch.note !== undefined ? patch.note : row.note;
  getDb().prepare('UPDATE todos SET done = ?, done_at = ?, note = ? WHERE id = ?')
    .run(done ? 1 : 0, doneAt, note, id);
  return rowToTodo(getDb().query('SELECT * FROM todos WHERE id = ?').get(id));
}

export function deleteTodo(id: string): void {
  getDb().prepare('DELETE FROM todos WHERE id = ?').run(id);
}

export function tidyTodos(opts: { olderThanDays?: number; missingFiles?: boolean } = {}): { deleted: number } {
  let deleted = 0;
  if (opts.olderThanDays !== undefined) {
    const cutoff = Date.now() - opts.olderThanDays * 24 * 60 * 60 * 1000;
    const r = getDb().query('SELECT COUNT(1) as c FROM todos WHERE done = 1 AND done_at <= ?').get(cutoff) as any;
    deleted += Number(r?.c ?? 0);
    getDb().prepare('DELETE FROM todos WHERE done = 1 AND done_at <= ?').run(cutoff);
  }
  if (opts.missingFiles) {
    const rows = getDb().query('SELECT DISTINCT file_path FROM todos').all() as any[];
    for (const row of rows) {
      const p = row.file_path;
      if (/^https?:\/\//i.test(p) || existsSync(p)) continue;
      const r = getDb().query('SELECT COUNT(1) as c FROM todos WHERE file_path = ?').get(p) as any;
      deleted += Number(r?.c ?? 0);
      getDb().prepare('DELETE FROM todos WHERE file_path = ?').run(p);
    }
  }
  return { deleted };
}
