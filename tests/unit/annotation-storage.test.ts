import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  appendAnnotationReply,
  replaceAnnotations,
  listAnnotatedDocuments,
  getAnnotationsByDocument,
  upsertAnnotation,
  updateAnnotationStatus,
  deleteAnnotation,
} from '../../src/annotation-storage';

let tempConfigHome = '';
let oldConfigHome: string | undefined;

beforeAll(() => {
  oldConfigHome = process.env.XDG_CONFIG_HOME;
  tempConfigHome = mkdtempSync(join(tmpdir(), 'mdv-ann-db-'));
  process.env.XDG_CONFIG_HOME = tempConfigHome;

  replaceAnnotations('/tmp/a.md', [
    { id: 'a1', start: 0, length: 4, quote: 'aaaa', note: 'note-a1', createdAt: 1000, status: 'anchored' },
    { id: 'a2', start: 10, length: 4, quote: 'bbbb', note: 'note-a2', createdAt: 2000, status: 'unanchored' },
  ]);

  replaceAnnotations('/tmp/b.md', [
    { id: 'b1', start: 0, length: 4, quote: 'cccc', note: 'note-b1', createdAt: 3000, status: 'anchored' },
  ]);
});

afterAll(() => {
  if (oldConfigHome === undefined) {
    delete process.env.XDG_CONFIG_HOME;
  } else {
    process.env.XDG_CONFIG_HOME = oldConfigHome;
  }
  if (tempConfigHome) {
    rmSync(tempConfigHome, { recursive: true, force: true });
  }
});

describe('annotation-storage', () => {
  it('lists commented documents in latest-updated desc order', () => {
    const docs = listAnnotatedDocuments(10, 0);
    expect(docs.length).toBe(2);
    expect(docs[0].path).toBe('/tmp/b.md');
    expect(docs[1].path).toBe('/tmp/a.md');
    expect(docs[1].unanchoredCount).toBe(1);
  });

  it('supports pagination for docs list', () => {
    const docs = listAnnotatedDocuments(1, 1);
    expect(docs.length).toBe(1);
    expect(docs[0].path).toBe('/tmp/a.md');
  });

  it('returns one-document comments in agent-friendly structured format', () => {
    const result = getAnnotationsByDocument('/tmp/a.md', 10, 0);
    expect(result.path).toBe('/tmp/a.md');
    expect(result.total).toBe(2);
    expect(result.annotations.length).toBe(2);
    expect(result.annotations[0].id).toBe('a2');
    expect(result.annotations[0].status).toBe('unanchored');
    expect(typeof result.annotations[0].quote).toBe('string');
    expect(typeof result.annotations[0].note).toBe('string');
    expect(Array.isArray(result.annotations[0].thread)).toBe(true);
  });

  it('migrates legacy note into thread and supports appending reply', () => {
    const before = getAnnotationsByDocument('/tmp/b.md', 10, 0);
    expect(before.annotations.length).toBe(1);
    expect(before.annotations[0].thread?.[0]?.type).toBe('comment');
    expect(before.annotations[0].thread?.[0]?.note).toBe('note-b1');

    const updated = appendAnnotationReply('/tmp/b.md', { serial: before.annotations[0].serial }, 'reply-b1', 'codex');
    expect(updated.ok).toBe(true);

    const after = getAnnotationsByDocument('/tmp/b.md', 10, 0);
    expect(after.annotations.length).toBe(1);
    expect(after.annotations[0].thread?.length).toBe(2);
    expect(after.annotations[0].thread?.[1]?.type).toBe('reply');
    expect(after.annotations[0].thread?.[1]?.author).toBe('codex');
    expect(after.annotations[0].thread?.[1]?.note).toBe('reply-b1');
  });

  it('supports incremental upsert for one annotation', () => {
    const result = upsertAnnotation('/tmp/a.md', {
      id: 'a3',
      start: 20,
      length: 4,
      quote: 'dddd',
      note: 'note-a3',
      createdAt: 4000,
      status: 'anchored',
    });
    expect(result.ok).toBe(true);
    expect(result.annotation?.serial).toBe(3);

    const after = getAnnotationsByDocument('/tmp/a.md', 10, 0);
    expect(after.total).toBe(3);
    expect(after.annotations.some((item) => item.id === 'a3')).toBe(true);
  });

  it('supports incremental status update and delete', () => {
    const statusUpdated = updateAnnotationStatus('/tmp/a.md', { id: 'a1' }, 'resolved');
    expect(statusUpdated.ok).toBe(true);
    expect(statusUpdated.updated?.status).toBe('resolved');

    const deleted = deleteAnnotation('/tmp/a.md', { id: 'a2' });
    expect(deleted.ok).toBe(true);

    const after = getAnnotationsByDocument('/tmp/a.md', 10, 0);
    expect(after.total).toBe(2);
    expect(after.annotations.some((item) => item.id === 'a2')).toBe(false);
    expect(after.annotations.find((item) => item.id === 'a1')?.status).toBe('resolved');
  });
});
