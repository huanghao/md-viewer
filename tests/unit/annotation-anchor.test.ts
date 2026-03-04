import { describe, expect, it } from 'bun:test';
import { resolveAnnotationAnchor } from '../../src/client/utils/annotation-anchor';

describe('resolveAnnotationAnchor', () => {
  it('keeps stable position when quote still matches', () => {
    const text = 'hello world and md viewer';
    const ann = { id: 'a1', start: 6, length: 5, quote: 'world', note: '', createdAt: 1 };
    const result = resolveAnnotationAnchor(text, ann);
    expect(result.status).toBe('anchored');
    expect(result.start).toBe(6);
    expect(result.length).toBe(5);
    expect(result.confidence).toBe(1);
  });

  it('reanchors by quote when position changed', () => {
    const text = 'prefix inserted hello world and md viewer';
    const ann = { id: 'a1', start: 6, length: 5, quote: 'world', note: '', createdAt: 1 };
    const result = resolveAnnotationAnchor(text, ann);
    expect(result.status).toBe('anchored');
    expect(result.start).toBe(text.indexOf('world'));
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  it('marks unanchored when quote disappeared', () => {
    const text = 'hello there';
    const ann = { id: 'a1', start: 6, length: 5, quote: 'world', note: '', createdAt: 1 };
    const result = resolveAnnotationAnchor(text, ann);
    expect(result.status).toBe('unanchored');
    expect(result.confidence).toBe(0);
  });
});

