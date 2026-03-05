import { describe, expect, it } from 'bun:test';
import { mergeAnnotationStatus } from '../../src/client/annotation';

describe('mergeAnnotationStatus', () => {
  it('keeps resolved status when anchor re-check returns anchored', () => {
    expect(mergeAnnotationStatus('resolved', 'anchored')).toBe('resolved');
  });

  it('keeps resolved status when anchor re-check returns unanchored', () => {
    expect(mergeAnnotationStatus('resolved', 'unanchored')).toBe('resolved');
  });

  it('uses recalculated anchor status for non-resolved comments', () => {
    expect(mergeAnnotationStatus('anchored', 'unanchored')).toBe('unanchored');
    expect(mergeAnnotationStatus('unanchored', 'anchored')).toBe('anchored');
  });
});
