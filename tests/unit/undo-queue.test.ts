import { describe, expect, it } from 'bun:test';
import { cancelAllForFile, enqueueOp, flushAll } from '../../src/client/utils/undo-queue';

describe('undo queue', () => {
  it('flushAll executes pending operations immediately and only once', () => {
    let executed = 0;
    let shownLabel = '';

    enqueueOp(
      () => { executed += 1; },
      () => { throw new Error('should not cancel'); },
      'delete comment',
      (label) => { shownLabel = label; },
    );

    expect(shownLabel).toBe('delete comment');
    expect(executed).toBe(0);

    flushAll();
    flushAll();

    expect(executed).toBe(1);
  });

  it('cancel prevents execution and runs the rollback once', () => {
    let executed = 0;
    let canceled = 0;
    const cancel = enqueueOp(
      () => { executed += 1; },
      () => { canceled += 1; },
      'delete comment',
      () => {},
    );

    cancel();
    cancel();
    flushAll();

    expect(canceled).toBe(1);
    expect(executed).toBe(0);
  });

  it('cancelAllForFile invokes and removes every tracked cancel function', () => {
    const calls: string[] = [];
    const cancelFns = new Map<string, () => void>([
      ['a', () => calls.push('a')],
      ['b', () => calls.push('b')],
    ]);

    cancelAllForFile('/tmp/a.md', cancelFns);

    expect(calls).toEqual(['a', 'b']);
    expect(cancelFns.size).toBe(0);
  });
});
