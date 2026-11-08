// 极简外部 store：供 useSyncExternalStore 读取。
// 各业务 store 在此之上暴露自己的 setter，不直接暴露 setState，保持写入口可读。

export interface Store<T> {
  getState: () => T;
  subscribe: (listener: () => void) => () => void;
  /** 合并补丁并通知订阅者（即使值未变也通知，用于强制重绘） */
  merge: (patch: Partial<T>) => void;
  /** 整体替换；传入 isEqual 时，相等则不通知，避免无关刷新导致整块重绘 */
  replace: (next: T, isEqual?: (a: T, b: T) => boolean) => void;
}

export function createStore<T extends object>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<() => void>();
  const notify = (): void => {
    listeners.forEach((listener) => listener());
  };
  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    merge(patch) {
      state = { ...state, ...patch };
      notify();
    },
    replace(next, isEqual) {
      if (isEqual && isEqual(state, next)) return;
      state = next;
      notify();
    },
  };
}
