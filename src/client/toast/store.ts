import { createStore } from '../utils/create-store';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  /** 毫秒；0 表示常驻（只能点 × 关闭）；未传或负数时为 3000 */
  duration?: number;
  action?: ToastAction;
}

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
  action?: ToastAction;
  hiding: boolean;
}

export const DEFAULT_DURATION = 3000;
/** 与 CSS 中的退出动画时长一致 */
export const HIDE_MS = 300;

/** 规范化调用参数：字符串等同于 info 类型、默认时长 */
export function normalizeToastOptions(options: ToastOptions | string): Required<Pick<ToastOptions, 'message' | 'type' | 'duration'>> & { action?: ToastAction } {
  const config: ToastOptions = typeof options === 'string' ? { message: options } : options;
  const duration = config.duration === undefined || config.duration < 0 ? DEFAULT_DURATION : config.duration;
  return { message: config.message, type: config.type ?? 'info', duration, action: config.action };
}

const store = createStore<{ toasts: ToastItem[] }>({ toasts: [] });
let nextId = 1;

function patch(id: number, change: Partial<ToastItem>): void {
  store.merge({
    toasts: store.getState().toasts.map((t) => (t.id === id ? { ...t, ...change } : t)),
  });
}

export const toastStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  add(options: ToastOptions | string): number {
    const config = normalizeToastOptions(options);
    const id = nextId++;
    store.merge({ toasts: [...store.getState().toasts, { id, ...config, hiding: false }] });
    if (config.duration > 0) setTimeout(() => toastStore.hide(id), config.duration);
    return id;
  },
  hide(id: number): void {
    const toast = store.getState().toasts.find((t) => t.id === id);
    if (!toast || toast.hiding) return;
    patch(id, { hiding: true });
    setTimeout(() => {
      store.merge({ toasts: store.getState().toasts.filter((t) => t.id !== id) });
    }, HIDE_MS);
  },
};
