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

let state: ComposerStoreState = {
  quickAdd: { mode: 'comment', trayAvailable: false, prompts: [] },
  drafts: { comment: '', tray: '' },
  focusToken: { comment: 0, tray: 0 },
};
const listeners = new Set<() => void>();

function emit(next: Partial<ComposerStoreState>): void {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const composerStore = {
  getState: (): ComposerStoreState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setQuickAdd(patch: Partial<QuickAddModel>): void {
    emit({ quickAdd: { ...state.quickAdd, ...patch } });
  },
  getDraft(kind: ComposerKind): string {
    return state.drafts[kind];
  },
  setDraft(kind: ComposerKind, value: string): void {
    if (state.drafts[kind] === value) return;
    emit({ drafts: { ...state.drafts, [kind]: value } });
  },
  requestFocus(kind: ComposerKind): void {
    emit({ focusToken: { ...state.focusToken, [kind]: state.focusToken[kind] + 1 } });
  },
};
