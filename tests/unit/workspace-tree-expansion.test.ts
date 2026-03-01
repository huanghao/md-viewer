import { describe, expect, it } from 'bun:test';
import type { FileTreeNode } from '../../src/client/types';
import { mergeDirectoryExpandedState } from '../../src/client/workspace-tree-expansion';

function dir(path: string, isExpanded?: boolean, children: FileTreeNode[] = []): FileTreeNode {
  return { name: path.split('/').pop() || path, path, type: 'directory', isExpanded, children };
}

function file(path: string): FileTreeNode {
  return { name: path.split('/').pop() || path, path, type: 'file' };
}

describe('workspace tree expansion merge', () => {
  it('preserves user-collapsed directory state after rescan', () => {
    const previous = dir('/repo', true, [
      dir('/repo/docs', false, [
        file('/repo/docs/a.md'),
      ]),
      dir('/repo/src', true, [
        file('/repo/src/b.md'),
      ]),
    ]);

    const next = dir('/repo', true, [
      // backend/default rescan often returns directory nodes as expanded/undefined
      dir('/repo/docs', true, [
        file('/repo/docs/a.md'),
        file('/repo/docs/new.md'),
      ]),
      dir('/repo/src', true, [
        file('/repo/src/b.md'),
      ]),
    ]);

    mergeDirectoryExpandedState(previous, next);

    const docs = (next.children || []).find((n) => n.path === '/repo/docs');
    const src = (next.children || []).find((n) => n.path === '/repo/src');

    expect(docs?.type).toBe('directory');
    expect((docs as FileTreeNode).isExpanded).toBe(false);
    expect(src?.type).toBe('directory');
    expect((src as FileTreeNode).isExpanded).toBe(true);
  });
});
