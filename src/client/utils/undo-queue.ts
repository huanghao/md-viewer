/**
 * 乐观 undo 队列：延迟执行破坏性操作，允许在倒计时内撤销。
 * 页面关闭时强制 flush 所有待发操作。
 */

const UNDO_DELAY_MS = 4000;

interface PendingOp {
  id: string;
  timer: ReturnType<typeof setTimeout>;
  execute: () => void;
}

const pending = new Map<string, PendingOp>();

let opCounter = 0;
function nextOpId(): string {
  return `undo-${++opCounter}`;
}

/**
 * 将一个操作加入延迟队列。
 * @param execute 实际执行函数（发服务端请求等）
 * @param onCancel 撤销时执行的函数（恢复客户端状态）
 * @param label toast 显示的操作描述，如"已删除评论 #3"
 * @param showUndoToast 显示带撤销按钮的 toast 的函数
 * @returns cancel 函数，调用后取消操作并执行 onCancel
 */
export function enqueueOp(
  execute: () => void,
  onCancel: () => void,
  label: string,
  showUndoToast: (label: string, cancel: () => void) => void,
): () => void {
  const opId = nextOpId();

  const cancel = () => {
    const op = pending.get(opId);
    if (!op) return;
    clearTimeout(op.timer);
    pending.delete(opId);
    onCancel();
  };

  const timer = setTimeout(() => {
    pending.delete(opId);
    execute();
  }, UNDO_DELAY_MS);

  pending.set(opId, { id: opId, timer, execute });
  showUndoToast(label, cancel);
  return cancel;
}

/** 立即执行所有待发操作（页面关闭时调用）。 */
export function flushAll(): void {
  for (const op of pending.values()) {
    clearTimeout(op.timer);
    op.execute();
  }
  pending.clear();
}

/** 清除指定文件相关的所有待发操作（切换文件时调用）。 */
export function cancelAllForFile(filePath: string, cancelFns: Map<string, () => void>): void {
  for (const [opId, cancel] of cancelFns) {
    cancel();
    cancelFns.delete(opId);
  }
}
