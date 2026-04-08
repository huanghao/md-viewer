import { describe, expect, it } from 'bun:test';
import { getTabBatchTargets } from '../../src/client/utils/tab-batch';

const files = [
  { path: '/ws/a.md' },
  { path: '/ws/b.md' },
  { path: '/ws/c.md' },
  { path: '/ws/d.md' },
];

describe('getTabBatchTargets — close-all', () => {
  it('returns ALL files including the current one', () => {
    const targets = getTabBatchTargets('close-all', files, '/ws/b.md', () => false);
    expect(targets).toEqual(['/ws/a.md', '/ws/b.md', '/ws/c.md', '/ws/d.md']);
  });

  it('returns all files when currentPath is null', () => {
    const targets = getTabBatchTargets('close-all', files, null, () => false);
    expect(targets).toEqual(['/ws/a.md', '/ws/b.md', '/ws/c.md', '/ws/d.md']);
  });

  it('returns empty array when no files', () => {
    expect(getTabBatchTargets('close-all', [], '/ws/a.md', () => false)).toEqual([]);
  });
});

describe('getTabBatchTargets — close-others', () => {
  it('returns all files except current', () => {
    const targets = getTabBatchTargets('close-others', files, '/ws/b.md', () => false);
    expect(targets).toEqual(['/ws/a.md', '/ws/c.md', '/ws/d.md']);
  });

  it('returns empty when current is null', () => {
    const targets = getTabBatchTargets('close-others', files, null, () => false);
    expect(targets).toEqual([]);
  });
});

describe('getTabBatchTargets — close-right', () => {
  it('returns files to the right of current', () => {
    const targets = getTabBatchTargets('close-right', files, '/ws/b.md', () => false);
    expect(targets).toEqual(['/ws/c.md', '/ws/d.md']);
  });

  it('returns empty when current is last', () => {
    const targets = getTabBatchTargets('close-right', files, '/ws/d.md', () => false);
    expect(targets).toEqual([]);
  });

  it('returns empty when current is not found', () => {
    const targets = getTabBatchTargets('close-right', files, '/ws/notfound.md', () => false);
    expect(targets).toEqual([]);
  });

  it('returns empty when current is null', () => {
    const targets = getTabBatchTargets('close-right', files, null, () => false);
    expect(targets).toEqual([]);
  });
});

describe('getTabBatchTargets — close-unmodified', () => {
  it('closes only non-current unmodified files', () => {
    // a=unmodified, b=current, c=modified, d=unmodified
    const isClosable = (path: string) => path === '/ws/a.md' || path === '/ws/d.md';
    const targets = getTabBatchTargets('close-unmodified', files, '/ws/b.md', isClosable);
    expect(targets).toEqual(['/ws/a.md', '/ws/d.md']);
  });

  it('never closes the current file even if unmodified', () => {
    const isClosable = () => true; // all unmodified
    const targets = getTabBatchTargets('close-unmodified', files, '/ws/b.md', isClosable);
    expect(targets).not.toContain('/ws/b.md');
  });

  it('returns empty when all non-current files are modified', () => {
    const isClosable = () => false;
    const targets = getTabBatchTargets('close-unmodified', files, '/ws/b.md', isClosable);
    expect(targets).toEqual([]);
  });
});
