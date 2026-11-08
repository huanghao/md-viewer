import { createStore } from '../utils/create-store';

/**
 * 划词后的三个浮层（快捷入口、评论输入、Agent 托盘输入）的内容状态。
 * 浮层的显隐与定位仍由 annotation.ts 用 placeFloating 完成；这里只管内容。
 */
export type ComposerKind = 'comment' | 'tray';
export type QuickAddMode = 'comment' | 'tray';

export interface QuickAddModel {
  /** comment：显示“写评论”（与快捷评论）；tray：只显示托盘入口 */
  mode: QuickAddMode;
  /** comment 模式下是否显示“加入 Agent 托盘”（仅 Agent 标签页） */
  trayAvailable: boolean;
  prompts: string[];
}

interface ComposerStoreState {
  quickAdd: QuickAddModel;
  drafts: Record<ComposerKind, string>;
  /** 每次请求聚焦时递增，组件据此 focus 自己的 textarea */
  focusToken: Record<ComposerKind, number>;
}

const store = createStore<ComposerStoreState>({
  quickAdd: { mode: 'comment', trayAvailable: false, prompts: [] },
  drafts: { comment: '', tray: '' },
  focusToken: { comment: 0, tray: 0 },
});

export const composerStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setQuickAdd(patch: Partial<QuickAddModel>): void {
    store.merge({ quickAdd: { ...store.getState().quickAdd, ...patch } });
  },
  getDraft(kind: ComposerKind): string {
    return store.getState().drafts[kind];
  },
  setDraft(kind: ComposerKind, value: string): void {
    if (store.getState().drafts[kind] === value) return;
    store.merge({ drafts: { ...store.getState().drafts, [kind]: value } });
  },
  requestFocus(kind: ComposerKind): void {
    store.merge({ focusToken: { ...store.getState().focusToken, [kind]: store.getState().focusToken[kind] + 1 } });
  },
};
