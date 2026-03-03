import { describe, expect, it } from 'bun:test';
import { getTabBatchTargets } from '../../src/client/utils/tab-batch';

const files = [
  { path: '/a.md' },
  { path: '/b.md' },
  { path: '/c.md' },
];

describe('getTabBatchTargets', () => {
  it('close-all includes current tab', () => {
    const targets = getTabBatchTargets('close-all', files, '/b.md', () => false);
    expect(targets).toEqual(['/a.md', '/b.md', '/c.md']);
  });

  it('close-others excludes current tab', () => {
    const targets = getTabBatchTargets('close-others', files, '/b.md', () => false);
    expect(targets).toEqual(['/a.md', '/c.md']);
  });

  it('close-right returns tabs after current', () => {
    const targets = getTabBatchTargets('close-right', files, '/b.md', () => false);
    expect(targets).toEqual(['/c.md']);
  });

  it('close-unmodified respects predicate and excludes current', () => {
    const targets = getTabBatchTargets('close-unmodified', files, '/b.md', (path) => path !== '/c.md');
    expect(targets).toEqual(['/a.md']);
  });
});

