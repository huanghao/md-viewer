export type AddConfirmMode = 'warning' | 'directory' | 'error';

export interface AddConfirmState {
  visible: boolean;
  message: string;
  mode: AddConfirmMode;
  primaryLabel?: string;
  /** 主按钮动作（由调用方负责收尾，例如清空待处理动作） */
  onPrimary?: () => Promise<void> | void;
  /** 取消按钮动作 */
  onCancel?: () => void;
  allowCancel: boolean;
}

const HIDDEN: AddConfirmState = { visible: false, message: '', mode: 'warning', allowCancel: true };

let snapshot: AddConfirmState = HIDDEN;
const listeners = new Set<() => void>();

function set(next: AddConfirmState): void {
  snapshot = next;
  listeners.forEach((l) => l());
}

/** 统一输入框下方的添加确认条：file-switcher 调用 show/hide，React 组件订阅 */
export const addConfirmStore = {
  getState: (): AddConfirmState => snapshot,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  show(next: Omit<AddConfirmState, 'visible'>): void {
    set({ ...next, visible: true });
  },
  hide(): void {
    set(HIDDEN);
  },
};
