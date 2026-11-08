import { createStore } from '../utils/create-store';

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

const store = createStore<AddConfirmState>(HIDDEN);

/** 统一输入框下方的添加确认条：file-switcher 调用 show/hide，React 组件订阅 */
export const addConfirmStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  show(next: Omit<AddConfirmState, 'visible'>): void {
    store.replace({ ...next, visible: true });
  },
  hide(): void {
    store.replace(HIDDEN);
  },
};
