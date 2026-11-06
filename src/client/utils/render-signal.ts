/**
 * 最小的重绘信号：notify() 让订阅它的 React 组件重新渲染。
 * 组件在渲染时直接读取模块 state，信号只负责告诉 React“该重绘了”。
 */
export function createRenderSignal() {
  let version = 0;
  const listeners = new Set<() => void>();
  return {
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
}
