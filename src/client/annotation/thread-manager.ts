import { escapeHtml } from '../utils/escape';
import { replyAnnotationRemote } from '../api/annotations';
import { showError } from '../ui/toast';
import { handleEmacsKeys } from '../utils/emacs-keys';
import {
  type Annotation,
  type AnnotationThreadItem,
  state,
  ensureAnnotationThread,
  replaceAnnotationInState,
} from '../annotation-state';
import { iconSvg } from './icons';

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

export function renderThreadListHTML(annotation: Annotation, simple = false): string {
  const thread = getCommentThread(annotation);
  const comment = thread[0];
  const replies = thread.slice(1);
  if (simple) {
    return `
      <div class="annotation-note simple">${escapeHtml(comment?.note || annotation.note || '（无评论内容）')}</div>
      ${replies.length > 0 ? `<div class="annotation-reply-count">回复 ${replies.length}</div>` : ''}
    `;
  }
  const body = thread
    .map((item) => `
      <div class="annotation-thread-line ${item.type === 'reply' ? 'is-reply' : ''}" data-thread-item-id="${item.id}" data-annotation-id="${annotation.id}">
        <span class="annotation-thread-text">${escapeHtml(item.note)}</span>
        <button class="annotation-thread-edit-btn" data-edit-thread-item="${item.id}" data-annotation-id="${annotation.id}" title="编辑">${iconSvg('edit')}</button>
        ${item.type === 'reply' ? `<button class="annotation-thread-edit-btn" data-delete-thread-item="${item.id}" data-annotation-id="${annotation.id}" title="删除回复">${iconSvg('trash')}</button>` : ''}
      </div>`)
    .join('');
  return body || '<div class="annotation-thread-line">（无评论内容）</div>';
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

export function editThreadItem(annotationId: string, itemId: string, filePath: string): void {
  const lineEl = document.querySelector(
    `.annotation-thread-line[data-thread-item-id="${itemId}"][data-annotation-id="${annotationId}"]`
  ) as HTMLElement | null;
  if (!lineEl) return;

  const ann = state.annotations.find((a) => a.id === annotationId);
  if (!ann) return;
  const thread = getCommentThread(ann);
  const item = thread.find((t) => t.id === itemId);
  if (!item) return;

  // 替换成编辑态
  const originalHTML = lineEl.innerHTML;
  lineEl.classList.add('is-editing');
  lineEl.innerHTML = `<textarea class="annotation-thread-edit-input" placeholder="Cmd+Enter 保存，Esc 取消">${escapeHtml(item.note)}</textarea>`;
  const textarea = lineEl.querySelector('textarea') as HTMLTextAreaElement;
  textarea.style.height = `${Math.max(textarea.scrollHeight, 34)}px`;
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  let committed = false; // 防止 blur 在 save/cancel 后再次触发

  const restoreLineEl = () => {
    lineEl.classList.remove('is-editing');
    lineEl.innerHTML = originalHTML;
    lineEl.querySelector('[data-edit-thread-item]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      editThreadItem(annotationId, itemId, filePath);
    });
    lineEl.querySelector('[data-delete-thread-item]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteThreadItem(annotationId, itemId, filePath);
    });
  };

  const cancel = () => {
    if (committed) return;
    committed = true;
    restoreLineEl();
  };

  const save = () => {
    if (committed) return;
    committed = true;
    const newText = textarea.value.trim();
    if (!newText || newText === item.note) {
      // 内容未变，恢复原样
      restoreLineEl();
      return;
    }
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
  };

  textarea.addEventListener('keydown', (e) => {
    if (handleEmacsKeys(e, textarea)) { e.preventDefault(); e.stopPropagation(); return; }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); save(); }
  });
  textarea.addEventListener('input', () => {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(200, Math.max(textarea.scrollHeight, 34))}px`;
  });
  textarea.addEventListener('blur', (e) => {
    // 焦点移到同一 annotation item 内（如 reply input）时不 cancel
    const related = (e as FocusEvent).relatedTarget as HTMLElement | null;
    const annotationItem = lineEl.closest('.annotation-item');
    if (related && annotationItem && annotationItem.contains(related)) return;
    setTimeout(() => { if (!committed) cancel(); }, 150);
  });
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
