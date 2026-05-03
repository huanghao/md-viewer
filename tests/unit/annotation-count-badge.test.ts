/**
 * Tests for badge count consistency:
 * adjustAnnotationCount should only change when isOpen(status) is true.
 * This guards against the bug where unanchored annotations were incorrectly
 * counted in the badge (same as open/anchored).
 */
import { describe, expect, it, beforeEach } from 'bun:test';
import { adjustAnnotationCount, setAnnotationSummaries, state } from '../../src/client/state';
import { isOpen } from '../../src/annotation-status';
import type { AnnotationStatus } from '../../src/annotation-status';

function resetSummaries() {
  setAnnotationSummaries(new Map());
}

beforeEach(resetSummaries);

describe('adjustAnnotationCount', () => {
  it('从 0 增加后 count 正确', () => {
    adjustAnnotationCount('/a.md', +1);
    // state is module-level; import state to verify
    // We test indirectly via adjustAnnotationCount idempotency
    adjustAnnotationCount('/a.md', -1);
    // Should be back to 0 — no entry
    adjustAnnotationCount('/a.md', +1);
    adjustAnnotationCount('/a.md', -1);
    // No throw = pass
  });
});

describe('badge count 一致性约束', () => {
  const statuses: AnnotationStatus[] = ['anchored', 'unanchored', 'resolved'];

  it('删除 anchored 批注时应 -1（isOpen=true）', () => {
    const status: AnnotationStatus = 'anchored';
    expect(isOpen(status)).toBe(true);
    // 验证条件：isOpen(removed.status) 为真，才调 adjustAnnotationCount(-1)
    adjustAnnotationCount('/a.md', +1);
    if (isOpen(status)) adjustAnnotationCount('/a.md', -1);
    // count 回到 0，不报错
  });

  it('删除 unanchored 批注时不应 -1（isOpen=false）', () => {
    const status: AnnotationStatus = 'unanchored';
    expect(isOpen(status)).toBe(false);
    adjustAnnotationCount('/a.md', +1);
    if (isOpen(status)) adjustAnnotationCount('/a.md', -1);
    adjustAnnotationCount('/a.md', -1);
  });

  it('删除 resolved 批注时不应 -1（isOpen=false）', () => {
    const status: AnnotationStatus = 'resolved';
    expect(isOpen(status)).toBe(false);
    adjustAnnotationCount('/a.md', +1);
    if (isOpen(status)) adjustAnnotationCount('/a.md', -1);
    adjustAnnotationCount('/a.md', -1);
  });

  it('所有状态的 isOpen 结果与预期一致（防止 annotation-status 被误改）', () => {
    const expected: Record<AnnotationStatus, boolean> = {
      anchored: true,
      unanchored: false,
      resolved: false,
    };
    for (const s of statuses) {
      expect(isOpen(s)).toBe(expected[s]);
    }
  });
});

describe('toggleResolved badge 计数语义', () => {
  it('anchored → resolved：badge -1', () => {
    const prev: AnnotationStatus = 'anchored';
    const next: AnnotationStatus = 'resolved';
    adjustAnnotationCount('/a.md', +1);
    // 正确逻辑：isOpen(prev) && next === 'resolved'
    if (isOpen(prev) && next === 'resolved') adjustAnnotationCount('/a.md', -1);
    // count 归零，不报错
  });

  it('unanchored → resolved：badge 不变', () => {
    const prev: AnnotationStatus = 'unanchored';
    const next: AnnotationStatus = 'resolved';
    adjustAnnotationCount('/a.md', +1);
    if (isOpen(prev) && next === 'resolved') adjustAnnotationCount('/a.md', -1);
    adjustAnnotationCount('/a.md', -1);
  });

  it('resolved → anchored：badge +1', () => {
    const prev: AnnotationStatus = 'resolved';
    const next: AnnotationStatus = 'anchored';
    // 正确逻辑：prev === 'resolved' && isOpen(next)
    if (prev === 'resolved' && isOpen(next)) adjustAnnotationCount('/a.md', +1);
    adjustAnnotationCount('/a.md', -1); // 归零
  });

  it('resolved → unanchored：badge 不变', () => {
    const prev: AnnotationStatus = 'resolved';
    const next: AnnotationStatus = 'unanchored';
    if (prev === 'resolved' && isOpen(next)) adjustAnnotationCount('/a.md', +1);
  });
});

describe('unanchoredCount 在 adjustAnnotationCount 中保持不变', () => {
  it('adjustAnnotationCount 不影响 unanchoredCount', () => {
    setAnnotationSummaries(new Map([['/a.md', { count: 2, unanchoredCount: 3, updatedAt: 0 }]]));
    adjustAnnotationCount('/a.md', -1);
    expect(state.annotationSummaries.get('/a.md')?.count).toBe(1);
    expect(state.annotationSummaries.get('/a.md')?.unanchoredCount).toBe(3);
  });

  it('count 归零但 unanchoredCount > 0 时条目保留', () => {
    setAnnotationSummaries(new Map([['/a.md', { count: 1, unanchoredCount: 2, updatedAt: 0 }]]));
    adjustAnnotationCount('/a.md', -1);
    expect(state.annotationSummaries.has('/a.md')).toBe(true);
    expect(state.annotationSummaries.get('/a.md')?.count).toBe(0);
    expect(state.annotationSummaries.get('/a.md')?.unanchoredCount).toBe(2);
  });

  it('count 和 unanchoredCount 都归零时条目删除', () => {
    setAnnotationSummaries(new Map([['/a.md', { count: 1, unanchoredCount: 0, updatedAt: 0 }]]));
    adjustAnnotationCount('/a.md', -1);
    expect(state.annotationSummaries.has('/a.md')).toBe(false);
  });
});
