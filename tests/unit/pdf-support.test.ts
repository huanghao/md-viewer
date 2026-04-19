import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { isPdf, isSupportedTextFile } from '../../src/utils';
import {
  listAnnotations,
  resetDbForTesting,
  upsertAnnotation,
} from '../../src/annotation-storage';

// ── utils ──────────────────────────────────────────────────────────────────

describe('isPdf', () => {
  it('returns true for .pdf', () => expect(isPdf('paper.pdf')).toBe(true));
  it('returns true for uppercase .PDF', () => expect(isPdf('PAPER.PDF')).toBe(true));
  it('returns true for mixed case', () => expect(isPdf('Paper.Pdf')).toBe(true));
  it('returns false for .md', () => expect(isPdf('readme.md')).toBe(false));
  it('returns false for .pdfx', () => expect(isPdf('file.pdfx')).toBe(false));
  it('returns false for empty string', () => expect(isPdf('')).toBe(false));
});

describe('isSupportedTextFile includes PDF', () => {
  it('returns true for .pdf', () => expect(isSupportedTextFile('paper.pdf')).toBe(true));
  it('returns true for .md', () => expect(isSupportedTextFile('readme.md')).toBe(true));
  it('returns true for .html', () => expect(isSupportedTextFile('index.html')).toBe(true));
  it('returns true for .json', () => expect(isSupportedTextFile('data.json')).toBe(true));
  it('returns false for .png', () => expect(isSupportedTextFile('image.png')).toBe(false));
  it('returns false for .zip', () => expect(isSupportedTextFile('archive.zip')).toBe(false));
});

// ── annotation-storage PDF fields ─────────────────────────────────────────

let tempDir: string;
let oldConfigHome: string | undefined;

beforeAll(() => {
  oldConfigHome = process.env.XDG_CONFIG_HOME;
  tempDir = mkdtempSync(join(tmpdir(), 'mdv-pdf-test-'));
  process.env.XDG_CONFIG_HOME = tempDir;
  resetDbForTesting();
});

afterAll(() => {
  resetDbForTesting();
  process.env.XDG_CONFIG_HOME = oldConfigHome;
  rmSync(tempDir, { recursive: true, force: true });
});

function makePdfAnnotation(overrides: Record<string, unknown> = {}) {
  return {
    id: crypto.randomUUID(),
    start: 0,
    length: 0,
    quote: 'transformer attention mechanism',
    note: 'interesting point',
    createdAt: Date.now(),
    fileType: 'pdf',
    page: 3,
    ...overrides,
  };
}

describe('upsertAnnotation — PDF annotations', () => {
  it('saves page and fileType for a PDF annotation', () => {
    const ann = makePdfAnnotation();
    const result = upsertAnnotation('/papers/test.pdf', ann);
    expect(result.ok).toBe(true);
    expect(result.annotation?.page).toBe(3);
    expect(result.annotation?.fileType).toBe('pdf');
  });

  it('round-trips page and fileType through listAnnotations', () => {
    const ann = makePdfAnnotation({ page: 7 });
    upsertAnnotation('/papers/roundtrip.pdf', ann);
    const list = listAnnotations('/papers/roundtrip.pdf');
    const saved = list.find(a => a.id === ann.id);
    expect(saved?.page).toBe(7);
    expect(saved?.fileType).toBe('pdf');
  });

  it('defaults fileType to md for markdown annotations', () => {
    const ann = {
      id: crypto.randomUUID(),
      start: 10,
      length: 20,
      quote: 'some text',
      note: 'a note',
      createdAt: Date.now(),
    };
    const result = upsertAnnotation('/docs/readme.md', ann);
    expect(result.ok).toBe(true);
    expect(result.annotation?.fileType).toBe('md');
    expect(result.annotation?.page).toBeUndefined();
  });

  it('accepts start=0 length=0 for PDF annotations', () => {
    const ann = makePdfAnnotation({ start: 0, length: 0 });
    const result = upsertAnnotation('/papers/zero.pdf', ann);
    expect(result.ok).toBe(true);
  });

  it('rejects length=0 for non-PDF annotations', () => {
    const ann = {
      id: crypto.randomUUID(),
      start: 0,
      length: 0,
      quote: 'text',
      note: 'note',
      createdAt: Date.now(),
      fileType: 'md',
    };
    const result = upsertAnnotation('/docs/readme.md', ann);
    expect(result.ok).toBe(false);
  });

  it('ignores invalid page values (negative)', () => {
    const ann = makePdfAnnotation({ page: -1 });
    const result = upsertAnnotation('/papers/badpage.pdf', ann);
    expect(result.ok).toBe(true);
    expect(result.annotation?.page).toBeUndefined();
  });

  it('ignores invalid page values (zero)', () => {
    const ann = makePdfAnnotation({ page: 0 });
    const result = upsertAnnotation('/papers/zeropage.pdf', ann);
    expect(result.ok).toBe(true);
    expect(result.annotation?.page).toBeUndefined();
  });

  it('preserves page on update', () => {
    const ann = makePdfAnnotation({ page: 5 });
    upsertAnnotation('/papers/update.pdf', ann);
    // update the note
    const updated = { ...ann, note: 'updated note' };
    const result = upsertAnnotation('/papers/update.pdf', updated);
    expect(result.annotation?.page).toBe(5);
  });

  it('stores multiple PDF annotations on the same file', () => {
    const path = '/papers/multi.pdf';
    upsertAnnotation(path, makePdfAnnotation({ page: 1, quote: 'intro text' }));
    upsertAnnotation(path, makePdfAnnotation({ page: 2, quote: 'method text' }));
    upsertAnnotation(path, makePdfAnnotation({ page: 3, quote: 'result text' }));
    const list = listAnnotations(path);
    expect(list.length).toBe(3);
    expect(list.every(a => a.fileType === 'pdf')).toBe(true);
    const pages = list.map(a => a.page).sort();
    expect(pages).toEqual([1, 2, 3]);
  });
});

// ── rectCoords field ───────────────────────────────────────────────────────

describe('upsertAnnotation — rectCoords field', () => {
  it('stores and retrieves valid rectCoords', () => {
    const coords = { x1: 10.5, y1: 20.0, x2: 200.5, y2: 40.0 };
    const ann = makePdfAnnotation({ rectCoords: coords });
    upsertAnnotation('/papers/rect.pdf', ann);
    const list = listAnnotations('/papers/rect.pdf');
    const stored = list.find(a => a.id === ann.id);
    expect(stored?.rectCoords).toEqual(coords);
  });

  it('round-trips fractional coordinates', () => {
    const coords = { x1: 72.123, y1: 100.456, x2: 300.789, y2: 120.001 };
    const ann = makePdfAnnotation({ rectCoords: coords });
    upsertAnnotation('/papers/rect2.pdf', ann);
    const list = listAnnotations('/papers/rect2.pdf');
    const stored = list.find(a => a.id === ann.id);
    expect(stored?.rectCoords?.x1).toBeCloseTo(72.123, 2);
    expect(stored?.rectCoords?.y2).toBeCloseTo(120.001, 2);
  });

  it('stores annotation without rectCoords (undefined)', () => {
    const ann = makePdfAnnotation();  // no rectCoords
    upsertAnnotation('/papers/norect.pdf', ann);
    const list = listAnnotations('/papers/norect.pdf');
    const stored = list.find(a => a.id === ann.id);
    expect(stored?.rectCoords).toBeUndefined();
  });

  it('ignores rectCoords with non-finite values', () => {
    const ann = makePdfAnnotation({ rectCoords: { x1: NaN, y1: 0, x2: 100, y2: 50 } });
    upsertAnnotation('/papers/badrect.pdf', ann);
    const list = listAnnotations('/papers/badrect.pdf');
    const stored = list.find(a => a.id === ann.id);
    expect(stored?.rectCoords).toBeUndefined();
  });

  it('preserves rectCoords on note update', () => {
    const coords = { x1: 50, y1: 60, x2: 150, y2: 80 };
    const ann = makePdfAnnotation({ rectCoords: coords });
    upsertAnnotation('/papers/rectupdate.pdf', ann);
    upsertAnnotation('/papers/rectupdate.pdf', { ...ann, note: 'updated' });
    const list = listAnnotations('/papers/rectupdate.pdf');
    const stored = list.find(a => a.id === ann.id);
    expect(stored?.rectCoords).toEqual(coords);
  });
});
