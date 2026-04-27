import { describe, expect, it } from 'bun:test';
import { mergeAnnotationStatus } from '../../src/client/annotation';
import { isOpen, isResolved, isOrphan, calculateOpenCount } from '../../src/annotation-status';

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

describe('isOpen', () => {
  it('anchored 状态为 open', () => {
    expect(isOpen('anchored')).toBe(true);
  });

  it('unanchored 状态不是 open', () => {
    expect(isOpen('unanchored')).toBe(false);
  });

  it('resolved 状态不是 open', () => {
    expect(isOpen('resolved')).toBe(false);
  });
});

describe('calculateOpenCount', () => {
  it('只计算 anchoredCount', () => {
    expect(calculateOpenCount(5, 3, 2)).toBe(5);
  });

  it('unanchoredCount 不计入 open', () => {
    expect(calculateOpenCount(0, 10, 0)).toBe(0);
  });

  it('混合状态只计 anchored', () => {
    expect(calculateOpenCount(3, 5, 7)).toBe(3);
  });
});
