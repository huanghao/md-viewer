import { describe, expect, it } from 'bun:test';
import { fuzzyMatch, fuzzyScore } from '../../src/client/utils/fuzzy-search';

describe('fuzzyMatch', () => {
  it('returns null when query does not match', () => {
    expect(fuzzyMatch('foo-bar.ts', 'qux')).toBeNull();
  });

  it('matches single token substring', () => {
    const result = fuzzyMatch('workspace-state.ts', 'workspace');
    expect(result).not.toBeNull();
    expect(result!.score).toBeGreaterThan(0);
    expect(result!.highlight).toContain('<mark');
    expect(result!.highlight).toContain('workspace');
  });

  it('matches multi-token query — the core requirement', () => {
    const result = fuzzyMatch('workspace-tree-expansion-persistence.ts', 'workspace persistence');
    expect(result).not.toBeNull();
    expect(result!.highlight).toContain('<mark');
  });

  it('returns null when one token of multi-token query does not match', () => {
    expect(fuzzyMatch('workspace-state.ts', 'workspace qux')).toBeNull();
  });

  it('empty query returns non-null with plain escaped text', () => {
    const result = fuzzyMatch('foo.ts', '');
    expect(result).not.toBeNull();
    expect(result!.highlight).toBe('foo.ts');
    expect(result!.score).toBe(0);
  });

  it('escapes HTML in text', () => {
    const result = fuzzyMatch('<script>alert(1)</script>', '');
    expect(result!.highlight).not.toContain('<script>');
    expect(result!.highlight).toContain('&lt;script&gt;');
  });
});

describe('fuzzyScore', () => {
  it('returns 0 for no match', () => {
    expect(fuzzyScore('foo.ts', 'qux')).toBe(0);
  });

  it('returns positive score for match', () => {
    expect(fuzzyScore('workspace-state.ts', 'workspace')).toBeGreaterThan(0);
  });

  it('returns 0 when one token of multi-token query does not match', () => {
    expect(fuzzyScore('workspace-state.ts', 'workspace qux')).toBe(0);
  });
});
