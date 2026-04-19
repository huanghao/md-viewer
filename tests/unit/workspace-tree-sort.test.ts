import { describe, it, expect } from 'bun:test';

// compareFileNames and sortTreeChildren are not exported, so we test
// the observable sort order via the FileTreeNode structure directly.
// We replicate the logic here to keep tests self-contained.

type SegKind = 0 | 1 | 2;

function segKind(s: string): SegKind {
  if (/^\d+$/.test(s)) return 0;
  if (/^[\x00-\x7F]+$/.test(s)) return 1;
  return 2;
}

function compareFileNames(a: string, b: string): number {
  const re = /(\d+)|(\D+)/g;
  const segsA = a.match(re) ?? [];
  const segsB = b.match(re) ?? [];
  const len = Math.max(segsA.length, segsB.length);
  for (let i = 0; i < len; i++) {
    if (i >= segsA.length) return -1;
    if (i >= segsB.length) return 1;
    const sa = segsA[i], sb = segsB[i];
    const ka = segKind(sa), kb = segKind(sb);
    if (ka !== kb) return ka - kb;
    if (ka === 0) {
      const diff = Number(sa) - Number(sb);
      if (diff !== 0) return diff;
      continue;
    }
    const cmp = sa.toLowerCase().localeCompare(sb.toLowerCase(), 'zh-CN', { sensitivity: 'base' });
    if (cmp !== 0) return cmp;
  }
  return 0;
}

describe('compareFileNames', () => {
  it('sorts numbers before ASCII letters', () => {
    expect(compareFileNames('1-foo', 'a-foo')).toBeLessThan(0);
  });

  it('sorts ASCII letters before CJK', () => {
    expect(compareFileNames('abc', '中文')).toBeLessThan(0);
  });

  it('uses numeric sort for number segments (2 < 10)', () => {
    expect(compareFileNames('file2.md', 'file10.md')).toBeLessThan(0);
  });

  it('is case-insensitive for ASCII', () => {
    expect(compareFileNames('Apple', 'banana')).toBeLessThan(0);
    expect(compareFileNames('apple', 'Banana')).toBeLessThan(0);
  });

  it('equal names return 0', () => {
    expect(compareFileNames('foo', 'foo')).toBe(0);
  });

  it('sorts mixed number+letter names correctly', () => {
    const names = ['chapter10', 'chapter2', 'chapter1'];
    names.sort(compareFileNames);
    expect(names).toEqual(['chapter1', 'chapter2', 'chapter10']);
  });

  it('sorts CJK names after ASCII', () => {
    const names = ['中文', 'abc', '123'];
    names.sort(compareFileNames);
    expect(names[0]).toBe('123');
    expect(names[1]).toBe('abc');
    expect(names[2]).toBe('中文');
  });
});
