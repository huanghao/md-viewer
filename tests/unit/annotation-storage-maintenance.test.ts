import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { Database } from 'bun:sqlite';
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import {
  getAnnotationsByDocument,
  getDb,
  importLegacyAnnotations,
  listAnnotatedDocuments,
  replaceAnnotations,
  resetDbForTesting,
  tidyAnnotations,
  tidyMissingFiles,
} from '../../src/annotation-storage';

let tempRoot = '';
let tempConfigHome = '';
let oldConfigHome: string | undefined;

beforeEach(() => {
  tempRoot = mkdtempSync(join(tmpdir(), 'mdv-ann-maint-'));
  tempConfigHome = mkdtempSync(join(tmpdir(), 'mdv-ann-maint-config-'));
  oldConfigHome = process.env.XDG_CONFIG_HOME;
  process.env.XDG_CONFIG_HOME = tempConfigHome;
  resetDbForTesting();
});

afterEach(() => {
  resetDbForTesting();
  if (oldConfigHome === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = oldConfigHome;
  }
  rmSync(tempRoot, { recursive: true, force: true });
  rmSync(tempConfigHome, { recursive: true, force: true });
});

function annotation(id: string, status: 'anchored' | 'unanchored' | 'resolved' = 'anchored') {
  return {
    id,
    start: 0,
    length: 4,
    quote: id,
    note: `note-${id}`,
    createdAt: 1000,
    status,
  };
}

describe('annotation-storage maintenance', () => {
  it('importLegacyAnnotations imports new documents and skips documents that already have annotations', () => {
    const existingPath = join(tempRoot, 'existing.md');
    const importedPath = join(tempRoot, 'imported.md');
    replaceAnnotations(existingPath, [annotation('existing')]);

    const result = importLegacyAnnotations({
      [existingPath]: [annotation('replacement')],
      [importedPath]: [annotation('imported-1'), annotation('imported-2')],
      '': [annotation('empty-path')],
      [join(tempRoot, 'invalid.md')]: [{ id: '', quote: '', start: 0, length: 0 }],
    });

    expect(result).toEqual({ importedFiles: 1, importedAnnotations: 2, skippedFiles: 1 });
    expect(getAnnotationsByDocument(existingPath, 10, 0, 'all').annotations.map((ann) => ann.id)).toEqual(['existing']);
    expect(getAnnotationsByDocument(importedPath, 10, 0, 'all').annotations.map((ann) => ann.id)).toEqual(['imported-1', 'imported-2']);
  });

  it('tidyMissingFiles deletes local missing-file annotations but keeps existing local and remote documents', () => {
    const existingPath = join(tempRoot, 'exists.md');
    const missingPath = join(tempRoot, 'missing.md');
    const remotePath = 'https://example.com/doc.md';
    writeFileSync(existingPath, '# exists');
    replaceAnnotations(existingPath, [annotation('existing')]);
    replaceAnnotations(missingPath, [annotation('missing-1'), annotation('missing-2')]);
    replaceAnnotations(remotePath, [annotation('remote')]);

    const result = tidyMissingFiles();

    expect(result).toEqual({ deleted: 2, documents: 1 });
    expect(getAnnotationsByDocument(existingPath, 10, 0, 'all').total).toBe(1);
    expect(getAnnotationsByDocument(missingPath, 10, 0, 'all').total).toBe(0);
    expect(getAnnotationsByDocument(remotePath, 10, 0, 'all').total).toBe(1);
  });

  it('tidyAnnotations deletes only old resolved and unanchored annotations', () => {
    const docPath = join(tempRoot, 'doc.md');
    replaceAnnotations(docPath, [
      annotation('anchored-old', 'anchored'),
      annotation('unanchored-old', 'unanchored'),
      annotation('resolved-old', 'resolved'),
      annotation('resolved-new', 'resolved'),
    ]);
    const database = getDb();
    const oldUpdatedAt = Date.now() - 10 * 24 * 60 * 60 * 1000;
    database
      .query(`UPDATE annotations SET updated_at = ? WHERE id IN ('anchored-old', 'unanchored-old', 'resolved-old')`)
      .run(oldUpdatedAt);

    const result = tidyAnnotations(7);
    const remaining = getAnnotationsByDocument(docPath, 10, 0, 'all').annotations.map((ann) => ann.id).sort();

    expect(result).toEqual({ deleted: 2, documents: 1 });
    expect(remaining).toEqual(['anchored-old', 'resolved-new']);
  });

  it('getDb migrates older annotation tables by adding missing columns', () => {
    const configDir = join(tempConfigHome, 'md-viewer');
    mkdirSync(configDir, { recursive: true });
    const dbPath = join(configDir, 'annotations.db');
    const oldDb = new Database(dbPath);
    oldDb.exec(`
      CREATE TABLE annotations (
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
    `);
    oldDb.close();

    const database = getDb();
    const columns = database.query(`PRAGMA table_info(annotations)`).all() as Array<{ name: string }>;
    const names = columns.map((column) => column.name);

    expect(existsSync(dbPath)).toBe(true);
    expect(names).toContain('serial');
    expect(names).toContain('thread_json');
    expect(names).toContain('page');
    expect(names).toContain('file_type');
    expect(names).toContain('rect_coords_json');

    replaceAnnotations(resolve(join(tempRoot, 'after-migration.md')), [annotation('after')]);
    expect(listAnnotatedDocuments(10, 0).map((doc) => doc.path)).toEqual([resolve(join(tempRoot, 'after-migration.md'))]);
  });
});
