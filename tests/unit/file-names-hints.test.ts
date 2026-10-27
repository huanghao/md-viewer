import { describe, it, expect } from 'bun:test';
import { duplicateNameHints, generateDistinctNames } from '../../src/client/utils/file-names';

describe('duplicateNameHints', () => {
  it('unique names get no hint', () => {
    expect(duplicateNameHints(['/a/x.md', '/b/y.md']).size).toBe(0);
  });

  it('same name → nearest parent dir', () => {
    const h = duplicateNameHints(['/w/doris/README.md', '/w/trino/README.md', '/w/other.md']);
    expect(h.get('/w/doris/README.md')).toBe('doris');
    expect(h.get('/w/trino/README.md')).toBe('trino');
    expect(h.has('/w/other.md')).toBe(false);
  });

  it('extends suffix when parent names collide', () => {
    const h = duplicateNameHints(['/w/a/docs/README.md', '/w/b/docs/README.md']);
    expect(h.get('/w/a/docs/README.md')).toBe('a/docs');
    expect(h.get('/w/b/docs/README.md')).toBe('b/docs');
  });
});

describe('generateDistinctNames', () => {
  const f = (path: string) => ({ path, name: path.split('/').pop()! }) as any;

  it('shares hint logic with duplicateNameHints', () => {
    const files = new Map([
      ['/w/doris/README.md', f('/w/doris/README.md')],
      ['/w/trino/README.md', f('/w/trino/README.md')],
      ['/w/a.md', f('/w/a.md')],
    ]);
    const r = generateDistinctNames(files);
    expect(r.map(x => x.nameHint)).toEqual(['doris', 'trino', undefined]);
    expect(r.map(x => x.displayName)).toEqual(['doris/README.md', 'trino/README.md', 'a.md']);
  });
});
