import { describe, expect, it } from 'bun:test';
import type { FileTreeNode } from '../../src/client/types';
import { buildIgnoredSet } from '../../src/client/utils/ignore-filter';

function makeFile(path: string): FileTreeNode {
  return { name: path.split('/').pop()!, path, type: 'file', lastModified: 1000 };
}

function makeDir(path: string, children: FileTreeNode[], ignorePatterns?: string[]): FileTreeNode {
  return { name: path.split('/').pop()!, path, type: 'directory', children, ignorePatterns };
}

const WS = '/ws';

describe('buildIgnoredSet', () => {
  it('returns empty set when no .mdvignore anywhere', () => {
    const tree = makeDir(WS, [makeFile('/ws/a.md'), makeFile('/ws/b.md')]);
    expect(buildIgnoredSet(tree, WS).size).toBe(0);
  });

  it('ignores files matching root-level patterns', () => {
    const tree = makeDir(WS, [makeFile('/ws/TODO.md'), makeFile('/ws/README.md')], ['TODO.md']);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/TODO.md')).toBe(true);
    expect(ignored.has('/ws/README.md')).toBe(false);
  });

  it('ignores files in subdirectory matching root pattern', () => {
    const sub = makeDir('/ws/bots', [makeFile('/ws/bots/exp.md')]);
    const tree = makeDir(WS, [sub], ['bots/']);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/bots/exp.md')).toBe(true);
  });

  it('subdirectory .mdvignore patterns are relative to that directory', () => {
    // /ws/sub/.mdvignore contains "draft.md" — should only match /ws/sub/draft.md
    const sub = makeDir('/ws/sub', [
      makeFile('/ws/sub/draft.md'),
      makeFile('/ws/sub/final.md'),
    ], ['draft.md']);
    const tree = makeDir(WS, [sub, makeFile('/ws/draft.md')]);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/sub/draft.md')).toBe(true);
    expect(ignored.has('/ws/sub/final.md')).toBe(false);
    // root-level draft.md is NOT ignored (no root .mdvignore)
    expect(ignored.has('/ws/draft.md')).toBe(false);
  });

  it('patterns accumulate: root patterns also apply inside subdirectories', () => {
    // Root .mdvignore: *.log — should ignore /ws/sub/app.log too
    const sub = makeDir('/ws/sub', [makeFile('/ws/sub/app.log'), makeFile('/ws/sub/app.md')]);
    const tree = makeDir(WS, [sub], ['*.log']);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/sub/app.log')).toBe(true);
    expect(ignored.has('/ws/sub/app.md')).toBe(false);
  });

  it('subdirectory pattern does NOT leak to sibling directories', () => {
    const a = makeDir('/ws/a', [makeFile('/ws/a/secret.md')], ['secret.md']);
    const b = makeDir('/ws/b', [makeFile('/ws/b/secret.md')]);
    const tree = makeDir(WS, [a, b]);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/a/secret.md')).toBe(true);
    expect(ignored.has('/ws/b/secret.md')).toBe(false);
  });

  it('deeply nested .mdvignore only affects its subtree', () => {
    const deep = makeDir('/ws/a/b', [makeFile('/ws/a/b/skip.md'), makeFile('/ws/a/b/keep.md')], ['skip.md']);
    const a = makeDir('/ws/a', [deep, makeFile('/ws/a/skip.md')]);
    const tree = makeDir(WS, [a]);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/a/b/skip.md')).toBe(true);
    expect(ignored.has('/ws/a/b/keep.md')).toBe(false);
    // /ws/a/skip.md is NOT ignored — the pattern lives in /ws/a/b/
    expect(ignored.has('/ws/a/skip.md')).toBe(false);
  });

  it('multiple patterns in one .mdvignore all apply', () => {
    const tree = makeDir(WS, [
      makeFile('/ws/TODO.md'),
      makeFile('/ws/DRAFT.md'),
      makeFile('/ws/README.md'),
    ], ['TODO.md', 'DRAFT.md']);
    const ignored = buildIgnoredSet(tree, WS);
    expect(ignored.has('/ws/TODO.md')).toBe(true);
    expect(ignored.has('/ws/DRAFT.md')).toBe(true);
    expect(ignored.has('/ws/README.md')).toBe(false);
  });
});
