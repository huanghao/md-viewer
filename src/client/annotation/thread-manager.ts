import { replyAnnotationRemote } from '../api/annotations';
import { showError } from '../ui/toast';
import {
  type Annotation,
  type AnnotationThreadItem,
  state,
  ensureAnnotationThread,
  replaceAnnotationInState,
} from '../annotation-state';
import { annotationListStore, isEditingThreadItem } from '../annotation-list/store';

// Callback injection to avoid circular imports with annotation.ts
let _renderAnnotationList: (filePath: string | null) => void = () => {};
let _showPopover: (ann: Annotation, x: number, y: number) => void = () => {};
let _persistAnnotation: (filePath: string, ann: Annotation, errorPrefix: string) => void = () => {};
let _applyAnnotations: () => void = () => {};

export function registerThreadCallbacks(cbs: {
  renderAnnotationList: (filePath: string | null) => void;
  showPopover: (ann: Annotation, x: number, y: number) => void;
  persistAnnotation: (filePath: string, ann: Annotation, errorPrefix: string) => void;
  applyAnnotations: () => void;
}): void {
  _renderAnnotationList = cbs.renderAnnotationList;
  _showPopover = cbs.showPopover;
  _persistAnnotation = cbs.persistAnnotation;
  _applyAnnotations = cbs.applyAnnotations;
}

export function getCommentThread(annotation: Annotation): AnnotationThreadItem[] {
  ensureAnnotationThread(annotation);
  return annotation.thread || [];
}

export function getReplyCount(annotation: Annotation): number {
  return getCommentThread(annotation).filter((item) => item.type === 'reply').length;
}

export function appendReply(annotationId: string, filePath: string, text: string): void {
  const ann = state.annotations.find((item) => item.id === annotationId);
  if (!ann) return;
  const note = text.trim();
  if (!note) return;
  const thread = getCommentThread(ann);
  const now = Date.now();
  thread.push({
    id: `r-${now}-${Math.random().toString(16).slice(2, 8)}`,
    type: 'reply',
    note,
    createdAt: now,
  });
  ann.thread = thread;
  ann.note = thread[0]?.note || ann.note;
  void replyAnnotationRemote(filePath, { id: annotationId }, note, 'me')
    .then((saved) => {
      if (state.currentFilePath !== filePath) return;
      replaceAnnotationInState(saved);
      _renderAnnotationList(filePath);
      _applyAnnotations();
    })
    .catch((error) => {
      showError(`回复评论失败: ${error?.message || '未知错误'}`);
    });
}

/** 进入评论条目的编辑态（由 AnnotationList 组件渲染 textarea） */
export function startThreadItemEdit(annotationId: string, itemId: string): void {
  annotationListStore.setEditing({ annotationId, itemId });
}

/** 退出编辑态；仅当当前正在编辑的正是这一条时才生效，避免误关另一条的编辑 */
export function stopThreadItemEdit(annotationId: string, itemId: string): void {
  if (isEditingThreadItem(annotationId, itemId)) annotationListStore.setEditing(null);
}

/** 保存评论条目编辑；内容为空或未变化时等同于取消 */
/** 写入评论条目的编辑结果（调用方负责先退出编辑态）；内容为空或未变化时不做任何改动 */
export function commitThreadItemEdit(annotationId: string, itemId: string, filePath: string, rawText: string): void {
  const ann = state.annotations.find((a) => a.id === annotationId);
  if (!ann) return;
  const thread = getCommentThread(ann);
  const item = thread.find((t) => t.id === itemId);
  if (!item) return;
  const newText = rawText.trim();
  if (!newText || newText === item.note) return;

  item.note = newText;
  if (thread[0]?.id === itemId) ann.note = newText;
  ann.thread = thread;
  _persistAnnotation(filePath, ann, '编辑评论失败');
  // 立即更新 DOM：列表和 popover
  _renderAnnotationList(filePath);
  // 如果 popover 正在显示这条评论，同步更新 popover 内容
  if (state.pinnedAnnotationId === annotationId) {
    const mark = document.querySelector(`[data-annotation-id="${annotationId}"]`) as HTMLElement | null;
    const rect = mark?.getBoundingClientRect();
    _showPopover(ann, rect ? rect.right + 8 : 120, rect ? rect.top + 8 : 120);
  }
}

/** 让列表立即按最新数据重绘（例如回复提交后） */
export function refreshAnnotationList(filePath: string): void {
  _renderAnnotationList(filePath);
}

export function deleteThreadItem(annotationId: string, itemId: string, filePath: string): void {
  const ann = state.annotations.find((a) => a.id === annotationId);
  if (!ann) return;
  const thread = getCommentThread(ann);
  const idx = thread.findIndex((t) => t.id === itemId);
  if (idx <= 0) return; // 不删第一条（comment 本体）
  thread.splice(idx, 1);
  ann.thread = thread;
  _persistAnnotation(filePath, ann, '删除回复失败');
  _renderAnnotationList(filePath);
  if (state.pinnedAnnotationId === annotationId) {
    const mark = document.querySelector(`[data-annotation-id="${annotationId}"]`) as HTMLElement | null;
    const rect = mark?.getBoundingClientRect();
    _showPopover(ann, rect ? rect.right + 8 : 120, rect ? rect.top + 8 : 120);
  }
}

export function autoResizeReplyInput(input: HTMLTextAreaElement): void {
  input.style.height = 'auto';
  const maxHeight = 160;
  const next = Math.min(maxHeight, Math.max(input.scrollHeight, 34));
  input.style.height = `${next}px`;
  input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

export function autoResizeComposerInput(input: HTMLTextAreaElement): void {
  input.style.height = 'auto';
  const maxHeight = 200;
  const next = Math.min(maxHeight, Math.max(input.scrollHeight, 34));
  input.style.height = `${next}px`;
  input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
}
