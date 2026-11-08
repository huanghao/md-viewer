import { createStore } from '../utils/create-store';

/**
 * 评论浮窗正文（线程 + 回复输入）的状态。
 * 浮窗标题、按钮与定位仍由 annotation.ts 的 showPopover 负责，这里只管正文。
 */
export interface PopoverNoteState {
  annotationId: string | null;
  filePath: string | null;
  /** 正在编辑的线程条目 id（仅限当前显示的评论） */
  editingItemId: string | null;
}

const store = createStore<PopoverNoteState>({ annotationId: null, filePath: null, editingItemId: null });
/** 回复草稿按 annotation id 保存，浮窗切换与重绘后保留 */
const drafts = new Map<string, string>();

export const popoverNoteStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  /** 显示某条评论；切换到另一条时退出编辑态，同一条保持编辑（滚动重定位不打断编辑） */
  show(annotationId: string, filePath: string | null): void {
    const sameAnnotation = annotationId === store.getState().annotationId;
    store.merge({
      annotationId,
      filePath,
      editingItemId: sameAnnotation ? store.getState().editingItemId : null,
    });
  },
  /** 数据变化后重绘正文（例如列表重新渲染） */
  refresh(): void {
    store.merge({});
  },
  startEdit(itemId: string): void {
    store.merge({ editingItemId: itemId });
  },
  stopEdit(itemId: string): void {
    if (store.getState().editingItemId === itemId) store.merge({ editingItemId: null });
  },
  getDraft(annotationId: string): string {
    return drafts.get(annotationId) ?? '';
  },
  setDraft(annotationId: string, value: string): void {
    if (value) drafts.set(annotationId, value);
    else drafts.delete(annotationId);
  },
};
