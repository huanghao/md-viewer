import { describe, expect, it } from 'bun:test';
import { isResolvedAnn, getAnchorTrack, matchesFilter, getVisibleAnnotations } from '../../src/client/annotation/query';
import type { Annotation } from '../../src/client/annotation';

function makeAnn(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'a1',
    serial: 1,
    start: 0,
    length: 5,
    quote: 'hello',
    note: '',
    createdAt: Date.now(),
    status: 'anchored',
    confidence: 1.0,
    ...overrides,
  };
}

describe('isResolvedAnn', () => {
  it('returns true for resolved annotation', () => {
    expect(isResolvedAnn(makeAnn({ status: 'resolved' }))).toBe(true);
  });
  it('returns false for anchored annotation', () => {
    expect(isResolvedAnn(makeAnn({ status: 'anchored' }))).toBe(false);
  });
  it('returns false for unanchored annotation', () => {
    expect(isResolvedAnn(makeAnn({ status: 'unanchored' }))).toBe(false);
  });
});

describe('getAnchorTrack', () => {
  it('returns orphan for unanchored status', () => {
    expect(getAnchorTrack(makeAnn({ status: 'unanchored' }))).toBe('orphan');
  });
  it('returns exact for high confidence', () => {
    expect(getAnchorTrack(makeAnn({ confidence: 0.95 }))).toBe('exact');
    expect(getAnchorTrack(makeAnn({ confidence: 1.0 }))).toBe('exact');
  });
  it('returns reanchored for lower confidence', () => {
    expect(getAnchorTrack(makeAnn({ confidence: 0.8 }))).toBe('reanchored');
  });
  it('returns reanchored when confidence is missing', () => {
    const ann = makeAnn();
    delete (ann as any).confidence;
    expect(getAnchorTrack(ann)).toBe('reanchored');
  });
});

describe('matchesFilter', () => {
  it('all filter matches everything', () => {
    expect(matchesFilter(makeAnn({ status: 'resolved' }), 'all')).toBe(true);
    expect(matchesFilter(makeAnn({ status: 'anchored' }), 'all')).toBe(true);
  });
  it('open filter matches only open annotations', () => {
    expect(matchesFilter(makeAnn({ status: 'anchored' }), 'open')).toBe(true);
    expect(matchesFilter(makeAnn({ status: 'resolved' }), 'open')).toBe(false);
  });
  it('resolved filter matches resolved non-orphan annotations', () => {
    expect(matchesFilter(makeAnn({ status: 'resolved' }), 'resolved')).toBe(true);
    expect(matchesFilter(makeAnn({ status: 'unanchored' }), 'resolved')).toBe(false);
  });
  it('orphan filter matches unanchored annotations', () => {
    expect(matchesFilter(makeAnn({ status: 'unanchored' }), 'orphan')).toBe(true);
    expect(matchesFilter(makeAnn({ status: 'anchored' }), 'orphan')).toBe(false);
  });
});

describe('getVisibleAnnotations', () => {
  it('filters and sorts by start position', () => {
    const anns = [
      makeAnn({ id: 'a', start: 10 }),
      makeAnn({ id: 'b', start: 5 }),
      makeAnn({ id: 'c', start: 15, status: 'resolved' }),
    ];
    const result = getVisibleAnnotations(anns, 'open');
    expect(result.map(a => a.id)).toEqual(['b', 'a']);
  });

  it('returns all when filter is all', () => {
    const anns = [
      makeAnn({ id: 'a', start: 2 }),
      makeAnn({ id: 'b', start: 1, status: 'resolved' }),
    ];
    expect(getVisibleAnnotations(anns, 'all').length).toBe(2);
  });
});
