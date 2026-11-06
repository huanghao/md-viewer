let version = 0;
const listeners = new Set<() => void>();

/**
 * 工作区树的重绘信号。树的数据直接读取 state（与原字符串渲染一致），
 * renderSidebar 调用 notify() 触发一次重绘，避免把整棵树复制成快照。
 */
export const workspaceTreeStore = {
  getState: (): number => version,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  notify(): void {
    version += 1;
    listeners.forEach((l) => l());
  },
};
