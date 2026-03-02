import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { tmpdir } from 'os';
import { searchFilesInRoots } from '../../src/utils';

const tempRoots: string[] = [];

function createTempRoot(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempRoots.push(dir);
  return dir;
}

function writeFile(root: string, relativePath: string): void {
  const full = join(root, relativePath);
  const parent = dirname(full);
  mkdirSync(parent, { recursive: true });
  writeFileSync(full, '# test\n', 'utf-8');
}

afterEach(() => {
  while (tempRoots.length > 0) {
    const root = tempRoots.pop()!;
    rmSync(root, { recursive: true, force: true });
  }
});

describe('searchFilesInRoots', () => {
  it('searches across multiple roots', () => {
    const rootA = createTempRoot('mdv-search-a-');
    const rootB = createTempRoot('mdv-search-b-');

    writeFile(rootA, 'docs/guide-target.md');
    writeFile(rootB, 'notes/target-manual.md');
    writeFile(rootB, 'notes/other.md');

    const results = searchFilesInRoots('target', [rootA, rootB], 20);

    expect(results.length).toBe(2);
    expect(results.some((p) => p.endsWith('guide-target.md'))).toBe(true);
    expect(results.some((p) => p.endsWith('target-manual.md'))).toBe(true);
  });

  it('prioritizes basename exact/prefix matches over weak path matches', () => {
    const root = createTempRoot('mdv-search-rank-');

    writeFile(root, 'deep/path/contains-keyword.md');
    writeFile(root, 'keyword-start.md');
    writeFile(root, 'keyword.md');

    const results = searchFilesInRoots('keyword', [root], 10);

    expect(results[0].endsWith('keyword.md')).toBe(true);
    expect(results[1].endsWith('keyword-start.md')).toBe(true);
    expect(results[2].endsWith('contains-keyword.md')).toBe(true);
  });

  it('returns empty when query is blank or unmatched', () => {
    const root = createTempRoot('mdv-search-empty-');
    writeFile(root, 'a.md');

    expect(searchFilesInRoots('', [root], 10)).toEqual([]);
    expect(searchFilesInRoots('not-found', [root], 10)).toEqual([]);
  });
});
