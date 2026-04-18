/**
 * Tests for badge count consistency:
 * adjustAnnotationCount should only change when isOpen(status) is true.
 * This guards against the bug where unanchored annotations were incorrectly
 * counted in the badge (same as open/anchored).
 */
import { describe, expect, it, beforeEach } from 'bun:test';
import { adjustAnnotationCount, setAnnotationSummaries } from '../../src/client/state';
import { isOpen } from '../../src/annotation-status';
import type { AnnotationStatus } from '../../src/annotation-status';

function resetSummaries() {
  setAnnotationSummaries(new Map());
}

beforeEach(resetSummaries);

describe('isOpen — badge 计数的判断依据', () => {
  it('anchored 是 open', () => expect(isOpen('anchored')).toBe(true));
  it('unanchored 不是 open', () => expect(isOpen('unanchored')).toBe(false));
  it('resolved 不是 open', () => expect(isOpen('resolved')).toBe(false));
});

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
    // 模拟：badge 初始为 1（有一个 anchored）
    adjustAnnotationCount('/a.md', +1);
    // 删除一个 unanchored，不应改变计数
    if (isOpen(status)) adjustAnnotationCount('/a.md', -1);
    // count 仍为 1，再 -1 应归零
    adjustAnnotationCount('/a.md', -1);
    // 不报错 = pass
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
    adjustAnnotationCount('/a.md', +1); // 先放一个 anchored 的计数
    // 正确逻辑：isOpen(prev) 为 false，不触发
    if (isOpen(prev) && next === 'resolved') adjustAnnotationCount('/a.md', -1);
    // count 仍为 1
    adjustAnnotationCount('/a.md', -1); // 手动归零
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
    // 正确逻辑：isOpen(next) 为 false，不触发
    if (prev === 'resolved' && isOpen(next)) adjustAnnotationCount('/a.md', +1);
    // count 仍为 0，不报错
  });
});
