import { describe, it, expect, beforeEach } from 'bun:test';
import {
  markExploded,
  isKnownExploded,
  getExplodedDirs,
  onExploded,
  resetExplodedForTesting,
} from '../../src/scan-guard';

beforeEach(() => {
  resetExplodedForTesting();
});

describe('scan-guard', () => {
  it('isKnownExploded is false before anything is marked', () => {
    expect(isKnownExploded('/a/b')).toBe(false);
  });

  it('marks a path and reports it as known-exploded', () => {
    markExploded('/a/b/dump', 5000);
    expect(isKnownExploded('/a/b/dump')).toBe(true);
  });

  it('treats descendants of an exploded path as known-exploded too', () => {
    markExploded('/a/b/dump', 5000);
    expect(isKnownExploded('/a/b/dump/sub/file.md')).toBe(true);
  });

  it('does not flag unrelated sibling paths', () => {
    markExploded('/a/b/dump', 5000);
    expect(isKnownExploded('/a/b/other')).toBe(false);
    expect(isKnownExploded('/a/b/dump-other')).toBe(false); // prefix, not a path segment
  });

  it('getExplodedDirs returns all registered entries', () => {
    markExploded('/x', 10);
    markExploded('/y', 20);
    const dirs = getExplodedDirs();
    expect(dirs).toHaveLength(2);
    expect(dirs.map(d => d.path).sort()).toEqual(['/x', '/y']);
  });

  it('marking the same path twice only notifies listeners once', () => {
    let calls = 0;
    onExploded(() => { calls++; });
    markExploded('/dup', 100);
    markExploded('/dup', 100);
    expect(calls).toBe(1);
  });

  it('notifies listeners with the path and entry count', () => {
    let received: { path: string; entryCount: number } | null = null;
    onExploded((dir) => { received = dir; });
    markExploded('/notify-me', 9999);
    expect(received).toEqual({ path: '/notify-me', entryCount: 9999 });
  });
});
