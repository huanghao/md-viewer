import { createStore } from '../utils/create-store';

import type { AnnotationDensity, AnnotationThreadItem } from '../annotation-state';

/** 评论列表的一行（已完成筛选、排序、定位计算） */
export interface AnnotationRowModel {
  id: string;
  title: string;
  active: boolean;
  track: 'exact' | 'reanchored' | 'unanchored';
  resolved: boolean;
  /** 仅 default 密度：绝对定位的 top（像素，未做重叠消解） */
  anchorTop: number | null;
  simpleNote: string;
  replyCount: number;
  thread: AnnotationThreadItem[];
}

export type AnnotationListView =
  | { kind: 'empty'; text: string }
  | {
      kind: 'rows';
      filePath: string;
      density: AnnotationDensity;
      /** 仅 default 密度：画布高度 */
      canvasHeight: number;
      contentScrollHeight: number;
      rows: AnnotationRowModel[];
    };

export interface ThreadItemEditing {
  annotationId: string;
  itemId: string;
}

interface AnnotationListState {
  view: AnnotationListView;
  editing: ThreadItemEditing | null;
}

const store = createStore<AnnotationListState>({
  view: { kind: 'empty', text: '无评论（选中文本即可添加）' },
  editing: null,
});
/** 回复草稿按 annotation id 保存，列表重建后保留（与 DOM 生命周期解耦） */
const replyDrafts = new Map<string, string>();

export const annotationListStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setView(view: AnnotationListView): void {
    store.merge({ view });
  },
  setEditing(editing: ThreadItemEditing | null): void {
    store.merge({ editing });
  },
  getDraft(annotationId: string): string {
    return replyDrafts.get(annotationId) ?? '';
  },
  /** 只更新草稿，不触发列表重渲染（输入过程中避免整列表重建） */
  setDraft(annotationId: string, value: string): void {
    if (value) replyDrafts.set(annotationId, value);
    else replyDrafts.delete(annotationId);
  },
};

export function isEditingThreadItem(annotationId: string, itemId: string): boolean {
  const editing = store.getState().editing;
  return !!editing && editing.annotationId === annotationId && editing.itemId === itemId;
}
