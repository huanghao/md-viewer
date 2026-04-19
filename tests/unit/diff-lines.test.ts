import { describe, it, expect } from 'bun:test';
import { diffLines } from '../../src/client/utils/diff';

describe('diffLines', () => {
  it('returns empty array for two empty strings', () => {
    expect(diffLines('', '')).toEqual([]);
  });

  it('returns only equal lines when content is identical', () => {
    const result = diffLines('a\nb\nc', 'a\nb\nc');
    expect(result.every(l => l.type === 'equal')).toBe(true);
  });

  it('detects changes when a line is inserted', () => {
    // old: a, c  new: a, b, c — result has at least one non-equal line
    const result = diffLines('a\nc', 'a\nb\nc');
    expect(result.some(l => l.type !== 'equal')).toBe(true);
  });

  it('detects a single deleted line', () => {
    const result = diffLines('a\nb\nc', 'a\nc');
    const deleted = result.filter(l => l.type === 'delete');
    expect(deleted.map(l => l.content)).toEqual(['b']);
  });

  it('detects a modified line as delete + insert', () => {
    const result = diffLines('hello', 'world');
    const types = result.map(l => l.type);
    expect(types).toContain('delete');
    expect(types).toContain('insert');
  });

  it('handles insert-only diff (old is empty)', () => {
    // empty string splits into [''], so there is one delete of the empty line
    const result = diffLines('', 'a\nb');
    const inserted = result.filter(l => l.type === 'insert');
    expect(inserted.map(l => l.content)).toEqual(['a', 'b']);
  });

  it('handles delete-only diff (new is empty)', () => {
    const result = diffLines('a\nb', '');
    const deleted = result.filter(l => l.type === 'delete');
    expect(deleted.map(l => l.content)).toEqual(['a', 'b']);
  });

  it('assigns oldLineNo to deleted lines and newLineNo to inserted lines', () => {
    const result = diffLines('a\nb', 'x\ny');
    const deleted = result.filter(l => l.type === 'delete');
    const inserted = result.filter(l => l.type === 'insert');
    expect(deleted.every(l => l.oldLineNo !== undefined)).toBe(true);
    expect(deleted.every(l => l.newLineNo === undefined)).toBe(true);
    expect(inserted.every(l => l.newLineNo !== undefined)).toBe(true);
    expect(inserted.every(l => l.oldLineNo === undefined)).toBe(true);
  });
});
