/**
 * 圈点评论功能模块
 */

import { escapeHtml } from './utils/escape';
import {
  deleteAnnotationRemote,
  updateAnnotationStatusRemote,
  fetchQuickComments,
} from './api/annotations';
import { showError, showToast } from './ui/toast';
import { enqueueOp } from './utils/undo-queue';
import { setChatContext } from './ui/chat-panel.js';
import { isOpen, isResolved, isUnanchored, type AnnotationStatus } from '../annotation-status';
import { adjustAnnotationCount } from './state';
import { loadConfig } from './config';
import { formatRelativeTimeShort } from './utils/format';
import { storageSet } from './utils/storage';
import { createResizer } from './utils/resizer';
import { getTextNodes, globalOffsetForPosition, globalOffsetForPositionEnd, positionForGlobalOffset, clamp, placeFloating, getReaderText } from './annotation/position';
import { registerChatSplitCallbacks, initChatSplit } from './annotation/chat-split';
import { currentPdfViewer } from './pdf-state';
import { isResolvedAnn, getAnchorTrack, matchesFilter, getVisibleAnnotations as getVisibleAnnotationsUtil } from './annotation/query';
import { handleEmacsKeys } from './utils/emacs-keys';
import { recordSignal } from './utils/focus-signals';
import {
  type Annotation,
  type AnnotationThreadItem,
  type AnnotationFilter,
  state,
  _lastQuickAddX,
  _lastQuickAddY,
  _quickComments,
  setLastQuickAddPosition,
  setQuickComments,
  getLastQuickAddPosition,
  nextAnnotationSerial,
  normalizeThread,
  ensureAnnotationThread,
  ensureAnnotationSerials,
  mergeAnnotationStatus,
  getAnnotations,
  getAnnotationCurrentFilePath,
} from './annotation-state';
import {
  getElements,
  invalidateAnnotationElementsCache,
  registerCollapseCallback,
  setSidebarCollapsed,
  loadAnnotationPanelOpen,
  persistCurrentFilePanelOpen,
  setAnnotationSidebarWidth,
  initAnnotationSidebarWidth,
  syncAnnotationSidebarLayout,
  syncAnnotationScrollWithContent,
  openAnnotationSidebar,
  closeAnnotationSidebar,
  toggleAnnotationSidebar,
} from './annotation-layout';
import {
  applyAnnotations,
  registerRenderingCallbacks,
} from './annotation-rendering';
import {
  persistAnnotation,
  persistAnnotations,
  setAnnotations,
  registerPersistenceCallbacks,
} from './annotation/persistence';
import { iconSvg } from './annotation/icons';
import {
  registerThreadCallbacks,
  getCommentThread,
  getReplyCount,
  renderThreadListHTML,
  appendReply,
  editThreadItem,
  deleteThreadItem,
  autoResizeReplyInput,
  autoResizeComposerInput,
} from './annotation/thread-manager';

export type { Annotation, AnnotationThreadItem };
export {
  getLastQuickAddPosition,
  nextAnnotationSerial,
  ensureAnnotationSerials,
  mergeAnnotationStatus,
  getAnnotations,
  getAnnotationCurrentFilePath,
  invalidateAnnotationElementsCache,
  syncAnnotationSidebarLayout,
  openAnnotationSidebar,
  closeAnnotationSidebar,
  toggleAnnotationSidebar,
  applyAnnotations,
  setAnnotations,
  persistAnnotation,
  persistAnnotations,
};

export async function loadQuickComments(): Promise<void> {
  const items = await fetchQuickComments();
  setQuickComments(items.map((it) => it.text));
  renderQuickPromptBtns();
}

function renderQuickPromptBtns(): void {
  const container = document.getElementById('quickPromptBtns');
  const section = document.getElementById('quickPromptsSection');
  if (!container || !section) return;

  if (_quickComments.length === 0) {
    section.classList.add('hidden');
    return;
  }
  section.classList.remove('hidden');

  container.innerHTML = _quickComments.map((text, i) =>
    `<button class="quick-add-btn quick-prompt" data-qc-index="${i}" aria-label="${text.replace(/"/g, '&quot;')}">
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M8 2a6 6 0 110 12A6 6 0 018 2zm0 3v4m0 2.5v.5"/>
      </svg>
      ${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </button>`
  ).join('');

  container.querySelectorAll<HTMLButtonElement>('[data-qc-index]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.qcIndex ?? '0', 10);
      onQuickCommentClick(_quickComments[idx] ?? '');
    });
  });
}

function onQuickCommentClick(note: string): void {
  const pending = state.pendingAnnotation;
  const filePath = state.pendingAnnotationFilePath;
  if (!pending || !filePath || !note) {
    hideQuickAdd(true);
    return;
  }
  const el = getElements();
  if (el.composerNote) el.composerNote.value = note;
  hideQuickAdd(false);
  savePendingAnnotation(filePath);
}


// ==================== 工具函数 ====================

function getActiveAnnotationFilePath(): string | null {
  const currentFilePath = state.currentFilePath;
  const renderedFilePath = document.getElementById('content')?.getAttribute('data-current-file') || null;
  if (!currentFilePath) return null;
  if (!renderedFilePath) return currentFilePath;
  return renderedFilePath === currentFilePath ? currentFilePath : null;
}


function updateControlState(): void {
  const el = getElements();
  el.filterMenu?.querySelectorAll('.annotation-filter-item[data-filter]').forEach((node) => {
    const button = node as HTMLElement;
    button.classList.toggle('is-active', button.getAttribute('data-filter') === state.filter);
  });
  // 「含失锚」子选项：仅在 open filter 下显示
  const includeBtn = el.filterMenu?.querySelector('[data-action="toggle-include-unanchored"]') as HTMLElement | null;
  if (includeBtn) {
    includeBtn.classList.toggle('hidden', state.filter !== 'open');
    includeBtn.classList.toggle('is-active', state.includeUnanchored);
  }
  if (el.densityToggle) {
    el.densityToggle.classList.toggle('is-simple', state.density === 'simple');
    el.densityToggle.title = state.density === 'simple' ? '切换到默认列表' : '切换到极简列表';
  }
  if (el.filterToggle) {
    const map: Record<AnnotationFilter, string> = {
      all: '筛选：全部',
      open: '筛选：未解决',
      resolved: '筛选：已解决',
      unanchored: '筛选：失锚',
    };
    el.filterToggle.title = map[state.filter];
  }
}

function updateAnnotationCount(): void {
  const count = getVisibleAnnotationsUtil(state.annotations, state.filter, state.includeUnanchored).length;
  const tabCount = document.getElementById('annotationTabCount');
  if (tabCount) tabCount.textContent = count > 0 ? `(${count})` : '';
}

// ==================== Tab ====================

let _currentAnnotationTab: 'comments' | 'chat' | 'todo' = 'comments';

// 当前渲染的 filePath，供事件委托读取（renderAnnotationList 每次更新）
let _listFilePath: string | null = null;

export function switchAnnotationTab(tab: 'comments' | 'chat' | 'todo'): void {
  _currentAnnotationTab = tab;
  const commentsList = document.getElementById('annotationList');
  const commentsActions = document.getElementById('annotationCommentsActions');
  const tabs = document.querySelectorAll('.annotation-tab');

  tabs.forEach((btn) => {
    btn.classList.toggle('is-active', (btn as HTMLElement).dataset.tab === tab);
  });

  const chatList = document.getElementById('chatList');
  if (commentsList) commentsList.style.display = tab === 'comments' ? '' : 'none';
  if (chatList) chatList.style.display = tab === 'chat' ? '' : 'none';
  const todoPanel = document.getElementById('todoPanel');
  if (todoPanel) todoPanel.style.display = tab === 'todo' ? '' : 'none';
  if (commentsActions) commentsActions.classList.toggle('hidden', tab !== 'comments');
  const todoActions = document.getElementById('annotationTodoActions');
  if (todoActions) todoActions.classList.toggle('hidden', tab !== 'todo');
  // Close both filter menus when switching tabs
  document.getElementById('annotationFilterMenu')?.classList.add('hidden');
  document.getElementById('todoFilterMenu')?.classList.add('hidden');

  if (tab === 'todo') {
    // Dynamic import to avoid circular deps
    import('./ui/todo-panel').then(m => m.loadAndRenderTodos());
  }
}

export function openChatTab(): void {
  setSidebarCollapsed(false);
  persistCurrentFilePanelOpen(true);
  syncAnnotationSidebarLayout();
  switchAnnotationTab('chat');
}

export function dismissAnnotationPopupByEscape(): boolean {
  const el = getElements();
  if (el.filterMenu && !el.filterMenu.classList.contains('hidden')) {
    el.filterMenu.classList.add('hidden');
    return true;
  }
  if (el.quickAddWrap && !el.quickAddWrap.classList.contains('hidden')) {
    hideQuickAdd(true);
    return true;
  }
  if (el.composer && !el.composer.classList.contains('hidden')) {
    hideComposer();
    return true;
  }
  if (el.popover && !el.popover.classList.contains('hidden')) {
    state.pinnedAnnotationId = null;
    hidePopover(true);
    return true;
  }
  return false;
}

// ==================== UI 操作 ====================
export function showQuickAdd(x: number, y: number, pendingData: Omit<Annotation, 'note' | 'createdAt'>): void {
  renderQuickPromptBtns();
  const el = getElements();
  if (!el.quickAddWrap) return;
  // 新划词时关闭旧的 composer（明确的焦点转移）
  if (el.composer && !el.composer.classList.contains('hidden')) {
    hideComposer();
  }
  state.pendingAnnotation = { ...pendingData, note: '', createdAt: Date.now() };
  state.pendingAnnotationFilePath = el.content?.getAttribute('data-current-file') || state.currentFilePath;
  el.quickAddWrap.classList.remove('hidden');
  placeFloating(el.quickAddWrap, x, y, {
    fallbackWidth: 168,
    fallbackHeight: 96,
    flipY: true,
  });
  setLastQuickAddPosition(
    Number.parseFloat(el.quickAddWrap.style.left || '0'),
    Number.parseFloat(el.quickAddWrap.style.top || '0'),
  );
}

function hideQuickAdd(clearPending = false): void {
  const el = getElements();
  if (!el.quickAddWrap) return;
  el.quickAddWrap.classList.add('hidden');
  if (clearPending) {
    clearTempSelectionMark();
    state.pendingAnnotation = null;
    const pdfViewer = currentPdfViewer ?? undefined;
    pdfViewer?.clearTempRect();
    state.pendingAnnotationFilePath = null;
  }
}

export function openComposerFromPending(x?: number, y?: number): void {
  const el = getElements();
  if (!state.pendingAnnotation || !el.composer || !el.composerNote) return;
  applyTempSelectionMark();
  const pdfViewer = currentPdfViewer ?? undefined;
  const pendingAnn = state.pendingAnnotation as Annotation & {
    page?: number;
    rectCoords?: { x1: number; y1: number; x2: number; y2: number };
  };
  if (pdfViewer && pendingAnn?.page !== undefined && pendingAnn?.rectCoords) {
    const { x1, y1, x2, y2 } = pendingAnn.rectCoords;
    pdfViewer.drawTempRect(pendingAnn.page, x1, y1, x2, y2, 'yellow');
  }
  el.composerNote.value = '';
  autoResizeComposerInput(el.composerNote);
  const left = typeof x === 'number' ? x : (el.quickAddWrap ? Number.parseFloat(el.quickAddWrap.style.left || '0') : 0);
  const top = typeof y === 'number' ? y : (el.quickAddWrap ? Number.parseFloat(el.quickAddWrap.style.top || '0') : 0);
  placeFloating(el.composer, left, top + 34);
  el.composer.classList.remove('hidden');
  hideQuickAdd(false);
  el.composerNote.focus();
}

// 折叠 composer：隐藏浮窗但保留 pendingAnnotation、划线和输入内容
function collapseComposer(): void {
  const el = getElements();
  if (!el.composer) return;
  el.composer.classList.add('hidden');
}

// 展开 composer：重新显示浮窗（划线和内容仍在）
function expandComposer(): void {
  const el = getElements();
  if (!el.composer || !state.pendingAnnotation) return;
  // 重新定位到划线位置
  const reader = document.getElementById('reader');
  const mark = reader?.querySelector('.annotation-mark-temp');
  if (mark) {
    const rect = mark.getBoundingClientRect();
    placeFloating(el.composer, rect.right + 6, rect.top - 8);
  }
  el.composer.classList.remove('hidden');
  el.composerNote?.focus();
}

// 清除 composer：真正取消，清除 pendingAnnotation 和划线
function hideComposer(): void {
  const el = getElements();
  if (!el.composer) return;
  clearTempSelectionMark();
  state.pendingAnnotation = null;
  state.pendingAnnotationFilePath = null;
  if (el.composerNote) el.composerNote.value = '';
  el.composer.classList.add('hidden');
}

function clearTempSelectionMark(keepPdfTempMark = false): void {
  // Clear PDF selection marks (blue pre-composer and yellow temp during composing)
  const pdfSelector = keepPdfTempMark ? 'mark.pdf-selection-mark' : 'mark.pdf-selection-mark, mark.pdf-selection-mark-temp';
  document.querySelectorAll(pdfSelector).forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });

  const reader = document.getElementById('reader');
  if (!reader) return;
  const marks = Array.from(reader.querySelectorAll('.annotation-mark-temp'));
  for (const mark of marks) {
    const parent = mark.parentNode;
    while (mark.firstChild) {
      parent?.insertBefore(mark.firstChild, mark);
    }
    parent?.removeChild(mark);
  }
}

function applyTempSelectionMark(): void {
  const el = getElements();
  if (!el.reader || !state.pendingAnnotation) return;
  clearTempSelectionMark();
  const ann = state.pendingAnnotation;
  const startPos = positionForGlobalOffset(el.reader, ann.start);
  const endPos = positionForGlobalOffset(el.reader, ann.start + ann.length);
  if (!startPos || !endPos) return;
  if (startPos.node === endPos.node && startPos.offset === endPos.offset) return;

  if (startPos.node === endPos.node) {
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);
    const wrapper = document.createElement('span');
    wrapper.className = 'annotation-mark-temp';
    try {
      range.surroundContents(wrapper);
    } catch {}
    return;
  }

  try {
    const textNodes: Array<{ node: Text; start: number; end: number }> = [];
    const walker = document.createTreeWalker(el.reader, NodeFilter.SHOW_TEXT, null);
    let node: Node | null;
    while ((node = walker.nextNode())) {
      const nodeRange = document.createRange();
      nodeRange.selectNode(node);
      const range = document.createRange();
      range.setStart(startPos.node, startPos.offset);
      range.setEnd(endPos.node, endPos.offset);
      const compareStart = range.compareBoundaryPoints(Range.END_TO_START, nodeRange);
      const compareEnd = range.compareBoundaryPoints(Range.START_TO_END, nodeRange);
      if (compareStart > 0 || compareEnd < 0) continue;
      const nodeStart = node === startPos.node ? startPos.offset : 0;
      const nodeEnd = node === endPos.node ? endPos.offset : (node.nodeValue?.length || 0);
      if (nodeStart < nodeEnd && !(node as Text).parentElement?.closest('.katex')) {
        textNodes.push({ node: node as Text, start: nodeStart, end: nodeEnd });
      }
    }
    for (let i = textNodes.length - 1; i >= 0; i--) {
      const { node, start, end } = textNodes[i];
      const nodeRange = document.createRange();
      nodeRange.setStart(node, start);
      nodeRange.setEnd(node, end);
      const wrapper = document.createElement('span');
      wrapper.className = 'annotation-mark-temp';
      nodeRange.surroundContents(wrapper);
    }
  } catch {}
}

export function showPopoverBottomRight(ann: Annotation): void {
  const el = getElements();
  if (!el.popover) return;
  showPopover(ann, 0, 0);
  el.popover.style.removeProperty('left');
  el.popover.style.removeProperty('top');
  el.popover.style.right = '12px';
  el.popover.style.bottom = '12px';
}

function displayQuoteOf(ann: Annotation): string {
  return ann.displayQuote ?? ann.quote;
}

export function showPopover(ann: Annotation, x: number, y: number): void {
  const el = getElements();
  if (!el.popover || !el.popoverTitle || !el.popoverNote) return;
  const dq = displayQuoteOf(ann);
  const snippet = dq.substring(0, 22);
  el.popoverTitle.textContent = `#${ann.serial || 0} | ${snippet}${dq.length > 22 ? '...' : ''}`;
  const threadHTML = renderThreadListHTML(ann, false);
  // 保存 popover reply input 草稿，重建 HTML 后恢复
  const existingReplyInput = el.popoverNote.querySelector<HTMLTextAreaElement>(`[data-popover-reply-input="${ann.id}"]`);
  const replyDraft = existingReplyInput?.value ?? '';
  el.popoverNote.innerHTML = `
    <div class="annotation-thread">${threadHTML}</div>
    <div class="annotation-reply-entry" data-popover-reply-entry="${ann.id}" role="button" tabindex="0">
      <textarea rows="1" data-popover-reply-input="${ann.id}" placeholder="输入回复内容（Cmd+Enter 提交）"></textarea>
    </div>
  `;
  if (replyDraft) {
    const newReplyInput = el.popoverNote.querySelector<HTMLTextAreaElement>(`[data-popover-reply-input="${ann.id}"]`);
    if (newReplyInput) {
      newReplyInput.value = replyDraft;
      autoResizeReplyInput(newReplyInput);
    }
  }
  if (el.popoverResolveBtn) {
    const resolved = isResolvedAnn(ann);
    el.popoverResolveBtn.title = resolved ? '重新打开' : '标记已解决';
    el.popoverResolveBtn.setAttribute('aria-label', resolved ? '重新打开' : '标记已解决');
    el.popoverResolveBtn.innerHTML = resolved ? iconSvg('reopen') : iconSvg('check');
    el.popoverResolveBtn.classList.toggle('is-resolved', resolved);
  }
  const copyBtn = document.getElementById('popoverCopyBtn') as HTMLButtonElement | null;
  if (copyBtn) {
    const fresh = copyBtn.cloneNode(true) as HTMLButtonElement;
    copyBtn.replaceWith(fresh);
    fresh.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = document.getElementById('annotationCopyMenu');
      if (!menu) return;
      // Position menu near button
      const btnRect = fresh.getBoundingClientRect();
      menu.style.left = `${Math.max(8, btnRect.left - 140)}px`;
      menu.style.top = `${btnRect.bottom + 4}px`;
      menu.classList.toggle('hidden');
      // Store current annotation for menu handlers
      (menu as any)._ann = ann;
    });
  }
  const askAiBtn = document.getElementById('popoverAskAiBtn') as HTMLButtonElement | null;
  if (askAiBtn) {
    const fresh = askAiBtn.cloneNode(true) as HTMLButtonElement;
    askAiBtn.replaceWith(fresh);
    fresh.addEventListener('click', () => {
      setChatContext({
        filePath: state.currentFilePath ?? undefined,
        quote: displayQuoteOf(ann),
        quotePrefix: ann.quotePrefix,
        quoteSuffix: ann.quoteSuffix,
      });
      openChatTab();
      hidePopover(true);
    });
  }
  placeFloating(el.popover, x, y);
  el.popover.classList.remove('hidden');
}

function syncPinnedPopoverPosition(): void {
  const id = state.pinnedAnnotationId;
  if (!id) return;
  const mark = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
  if (!mark) return;
  const ann = state.annotations.find((item) => item.id === id);
  if (!ann) return;
  const rect = mark.getBoundingClientRect();
  showPopover(ann, rect.right + 8, rect.top + 8);
}

function hidePopover(force = false): void {
  const el = getElements();
  if (!el.popover) return;
  if (!force && state.pinnedAnnotationId) return;
  el.popover.classList.add('hidden');
  if (force) {
    state.pinnedAnnotationId = null;
  }
}

// ==================== 评论操作 ====================
export function savePendingAnnotation(filePath: string): void {
  const el = getElements();
  if (!state.pendingAnnotation || !el.composerNote) return;
  const pendingFilePath = state.pendingAnnotationFilePath;
  if (!pendingFilePath || pendingFilePath !== filePath) return;

  const note = el.composerNote.value.trim();
  if (!note) return;
  const now = Date.now();
  const ann: Annotation = {
    ...state.pendingAnnotation,
    serial: nextAnnotationSerial(state.annotations),
    note,
    thread: [{
      id: `c-${now}-${Math.random().toString(16).slice(2, 8)}`,
      type: 'comment',
      note,
      createdAt: now,
    }],
  };

  state.annotations.push(ann);
  persistAnnotation(filePath, ann, '创建评论失败');
  const pdfViewer = currentPdfViewer ?? undefined;
  pdfViewer?.clearTempRect();
  adjustAnnotationCount(filePath, +1);
  import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
  // For PDF: keep pdf-selection-mark-temp alive until renderHighlights replaces it with permanent highlight
  const isPdf = document.getElementById('content')?.hasAttribute('data-pdf');
  if (isPdf) {
    clearTempSelectionMark(true); // keep PDF temp mark
    state.pendingAnnotation = null;
    state.pendingAnnotationFilePath = null;
    const composerEl = getElements();
    if (composerEl.composerNote) composerEl.composerNote.value = '';
    composerEl.composer?.classList.add('hidden');
  } else {
    hideComposer();
  }
  afterAnnotationWrite(filePath, isPdf);
  document.dispatchEvent(new CustomEvent('annotation:created', { detail: { annotation: ann, filePath } }));
}

export function removeAnnotation(id: string, filePath: string): void {
  const previous = state.annotations.slice();
  const removed = previous.find((a) => a.id === id);
  const isPdf = document.getElementById('content')?.hasAttribute('data-pdf');

  // 乐观更新客户端状态
  state.annotations = state.annotations.filter((a) => a.id !== id);
  if (state.pinnedAnnotationId === id) { state.pinnedAnnotationId = null; hidePopover(true); }
  if (state.activeAnnotationId === id) { state.activeAnnotationId = null; }
  afterAnnotationWrite(filePath, isPdf);
  document.dispatchEvent(new CustomEvent('annotation:deleted', { detail: { id, filePath } }));
  if (removed && isOpen(removed.status as AnnotationStatus)) {
    adjustAnnotationCount(filePath, -1);
    import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
  }

  const doDelete = () => {
    void deleteAnnotationRemote(filePath, { id }).catch((error) => {
      // 服务端失败：回滚
      state.annotations = previous;
      if (removed && isOpen(removed.status as AnnotationStatus)) {
        adjustAnnotationCount(filePath, +1);
        import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
      }
      showError(`删除评论失败: ${error?.message || '未知错误'}`, 2600);
      afterAnnotationWrite(filePath, isPdf);
    });
  };

  const doUndo = () => {
    state.annotations = previous;
    if (removed && isOpen(removed.status as AnnotationStatus)) {
      adjustAnnotationCount(filePath, +1);
      import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
    }
    afterAnnotationWrite(filePath, isPdf);
  };

  if (loadConfig().optimisticUndo !== false) {
    const label = `已删除评论${removed?.serial ? ` #${removed.serial}` : ''}`;
    enqueueOp(doDelete, doUndo, label, (msg, cancel) => {
      showToast({ message: msg, type: 'info', duration: 4000, action: { label: '撤销', onClick: cancel } });
    });
  } else {
    doDelete();
  }
}

function jumpToAnnotation(id: string, behavior: ScrollBehavior = 'smooth'): void {
  const el = getElements();
  if (!el.content) return;
  const mark = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
  if (!mark) return;

  // Check if this is a PDF annotation (inside pdf-viewer-container)
  const isPdf = mark.closest('.pdf-viewer-container') !== null;

  const contentRect = el.content.getBoundingClientRect();
  const markRect = mark.getBoundingClientRect();
  const currentTop = el.content.scrollTop;
  const targetTop = currentTop + (markRect.top - contentRect.top);
  const topPadding = isPdf ? 100 : 56;
  const finalTop = Math.max(0, targetTop - topPadding);
  el.content.scrollTo({ top: finalTop, behavior });
}

function setActiveAnnotation(id: string | null, filePath: string | null): void {
  state.activeAnnotationId = id;
  applyAnnotations();
  if (id) {
    state.pinnedAnnotationId = id;
    // Show popover after scroll completes. For PDF rect anchors we need accurate
    // getBoundingClientRect, so we use 'instant' scroll then rAF.
    const ann = state.annotations.find((item) => item.id === id);
    const mark = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
    const isPdfRect = mark?.classList.contains('pdf-rect-anchor') && mark.dataset.rectX2;
    if (isPdfRect) {
      jumpToAnnotation(id, 'instant');
      requestAnimationFrame(() => {
        const m = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
        if (!ann || !m) return;
        const x2 = parseFloat(m.dataset.rectX2!);
        const y2 = parseFloat(m.dataset.rectY2 || '0');
        const s = parseFloat(m.dataset.rectScale || '1.5');
        const x1 = parseFloat(m.style.left) / s;
        const y1 = parseFloat(m.style.top) / s;
        const anchorRect = m.getBoundingClientRect();
        const screenX = anchorRect.left + (x2 - x1) * s;
        const screenY = anchorRect.top + (y2 - y1) * s;
        showPopover(ann, screenX + 8, screenY + 8);
      });
    } else {
      jumpToAnnotation(id, 'smooth');
      requestAnimationFrame(() => {
        if (!ann || !mark) return;
        const rect = mark.getBoundingClientRect();
        showPopover(ann, rect.right + 8, rect.top + 8);
      });
    }
  }
  renderAnnotationList(filePath);
}

function jumpToRelative(id: string, delta: number, filePath: string): void {
  const sorted = getVisibleAnnotationsUtil(state.annotations, state.filter, state.includeUnanchored);
  const index = sorted.findIndex((item) => item.id === id);
  if (index < 0) return;
  const target = sorted[index + delta];
  if (!target) return;
  setActiveAnnotation(target.id, filePath);
}

function getAnnotationAnchorTopById(id: string): number | null {
  const content = document.getElementById('content');
  const mark = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
  if (!content || !mark) return null;
  const contentRect = content.getBoundingClientRect();
  const markRect = mark.getBoundingClientRect();
  return content.scrollTop + (markRect.top - contentRect.top);
}

function toggleResolved(id: string, filePath: string): void {
  const ann = state.annotations.find((item) => item.id === id);
  if (!ann) return;
  const previousStatus = ann.status;
  const nextStatus = ann.status === 'resolved'
    ? ((ann.confidence || 0) <= 0 ? 'unanchored' : 'anchored')
    : 'resolved';
  const isPdf = document.getElementById('content')?.hasAttribute('data-pdf');

  // 乐观更新客户端状态
  ann.status = nextStatus;
  hidePopover(true);
  afterAnnotationWritePdf(filePath, isPdf);
  if (isOpen(previousStatus as AnnotationStatus) && nextStatus === 'resolved') {
    adjustAnnotationCount(filePath, -1);
  } else if (previousStatus === 'resolved' && isOpen(nextStatus as AnnotationStatus)) {
    adjustAnnotationCount(filePath, +1);
  }
  import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());

  const doUpdate = () => {
    void updateAnnotationStatusRemote(filePath, { id }, nextStatus).catch((error) => {
      ann.status = previousStatus;
      if (isOpen(previousStatus as AnnotationStatus) && nextStatus === 'resolved') {
        adjustAnnotationCount(filePath, +1);
      } else if (previousStatus === 'resolved' && isOpen(nextStatus as AnnotationStatus)) {
        adjustAnnotationCount(filePath, -1);
      }
      showError(`更新评论状态失败: ${error?.message || '未知错误'}`, 2600);
      afterAnnotationWritePdf(filePath, isPdf);
      import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
    });
  };

  const doUndo = () => {
    ann.status = previousStatus;
    if (isOpen(previousStatus as AnnotationStatus) && nextStatus === 'resolved') {
      adjustAnnotationCount(filePath, +1);
    } else if (previousStatus === 'resolved' && isOpen(nextStatus as AnnotationStatus)) {
      adjustAnnotationCount(filePath, -1);
    }
    afterAnnotationWritePdf(filePath, isPdf);
    import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
  };

  if (loadConfig().optimisticUndo !== false && nextStatus === 'resolved') {
    const serial = ann.serial ? ` #${ann.serial}` : '';
    enqueueOp(doUpdate, doUndo, `已解决评论${serial}`, (msg, cancel) => {
      showToast({ message: msg, type: 'info', duration: 4000, action: { label: '撤销', onClick: cancel } });
    });
  } else {
    doUpdate();
  }
}

// 写操作完成后的统一收尾：同步正文高亮 + 侧边栏列表
function afterAnnotationWrite(filePath: string, isPdf: boolean | undefined): void {
  if (!isPdf) applyAnnotations();
  renderAnnotationList(filePath);
}

// 同上，但 PDF 模式下用 CustomEvent 触发高亮重绘（PDF viewer 监听此事件）
function afterAnnotationWritePdf(filePath: string, isPdf: boolean | undefined): void {
  if (!isPdf) applyAnnotations();
  else document.dispatchEvent(new CustomEvent('annotation:highlights-changed'));
  renderAnnotationList(filePath);
}

function resolvePositionedAnnotationOverlaps(listEl: HTMLElement, contentScrollHeight: number): void {
  const canvas = listEl.querySelector('.annotation-canvas') as HTMLElement | null;
  if (!canvas) return;
  const items = Array.from(canvas.querySelectorAll('.annotation-item.positioned')) as HTMLElement[];
  if (items.length === 0) return;

  // 先批量读取所有 offsetHeight（避免 read-write 交替导致 layout thrashing）
  const heights = items.map((item) => item.offsetHeight);

  const gap = 6;
  let previousBottom = 0;
  const tops: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const rawAnchorTop = Number(items[i].getAttribute('data-anchor-top') || '0');
    const anchorTop = Number.isFinite(rawAnchorTop) ? Math.max(0, rawAnchorTop) : 0;
    const resolvedTop = Math.max(anchorTop, previousBottom > 0 ? previousBottom + gap : anchorTop);
    tops.push(resolvedTop);
    previousBottom = resolvedTop + heights[i];
  }

  // 批量写入 style.top
  for (let i = 0; i < items.length; i++) {
    items[i].style.top = `${Math.round(tops[i])}px`;
  }

  const minHeight = Math.max(0, contentScrollHeight);
  const neededHeight = Math.ceil(previousBottom + 24);
  canvas.style.height = `${Math.max(minHeight, neededHeight)}px`;
}

export function renderAnnotationList(filePath: string | null): void {
  _listFilePath = filePath;
  const el = getElements();
  if (!el.annotationList) return;
  updateAnnotationCount();
  updateControlState();

  // 保存 reply input 草稿，重建 DOM 后恢复
  const replyDrafts = new Map<string, string>();
  el.annotationList.querySelectorAll<HTMLTextAreaElement>('[data-reply-input]').forEach((input) => {
    const id = input.getAttribute('data-reply-input');
    if (id && input.value.trim()) replyDrafts.set(id, input.value);
  });

  if (!filePath || state.annotations.length === 0) {
    el.annotationList.innerHTML = '<div class="annotation-empty">无评论（选中文本即可添加）</div>';
    return;
  }

  const sorted = getVisibleAnnotationsUtil(state.annotations, state.filter, state.includeUnanchored);
  if (sorted.length === 0) {
    el.annotationList.innerHTML = '<div class="annotation-empty">当前筛选下无评论</div>';
    return;
  }

  const renderItem = (ann: Annotation, index: number, positioned = false, top = 0) => `
    <div class="annotation-item ${state.activeAnnotationId === ann.id ? 'is-active' : ''} status-${getAnchorTrack(ann)}${isResolvedAnn(ann) ? ' is-resolved' : ''}${positioned ? ' positioned' : ''}" data-annotation-id="${ann.id}"${positioned ? ` data-anchor-top="${Math.max(0, Math.round(top))}" style="top:${Math.max(0, Math.round(top))}px"` : ''}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#${ann.serial || index + 1} | ${escapeHtml(displayQuoteOf(ann).substring(0, 28))}${displayQuoteOf(ann).length > 28 ? '...' : ''}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="${ann.id}" title="上一条">${iconSvg('up')}</button>
          <button class="annotation-icon-action" data-action="next" data-id="${ann.id}" title="下一条">${iconSvg('down')}</button>
          <button class="annotation-icon-action resolve${isResolvedAnn(ann) ? ' is-resolved' : ''}" data-action="resolve" data-id="${ann.id}" title="${isResolvedAnn(ann) ? '重新打开' : '标记已解决'}">${isResolvedAnn(ann) ? iconSvg('reopen') : iconSvg('check')}</button>
          <button class="annotation-icon-action danger" data-action="delete" data-id="${ann.id}" title="删除">${iconSvg('trash')}</button>
        </div>
      </div>
      <div class="annotation-thread">${renderThreadListHTML(ann, state.density === 'simple')}</div>
      ${state.density === 'simple' ? '' : `
        <div class="annotation-reply-entry" data-reply-entry="${ann.id}" role="button" tabindex="0">
          <textarea rows="1" data-reply-input="${ann.id}" placeholder="输入回复内容（Cmd+Enter 提交）"></textarea>
        </div>
      `}
    </div>
  `;

  if (state.density === 'default') {
    const tops = sorted.map((ann) => getAnnotationAnchorTopById(ann.id));
    let maxTop = 0;
    const positionedHtml = sorted.map((ann, index) => {
      const top = tops[index] ?? (index * 88);
      maxTop = Math.max(maxTop, top);
      return renderItem(ann, index, true, top);
    }).join('');
    const content = document.getElementById('content');
    const canvasHeight = Math.max(content?.scrollHeight || 0, maxTop + 180);
    el.annotationList.classList.add('default-mode');
    el.annotationList.innerHTML = `<div class="annotation-canvas" style="height:${canvasHeight}px">${positionedHtml}</div>`;
    resolvePositionedAnnotationOverlaps(el.annotationList, content?.scrollHeight || 0);
    syncAnnotationScrollWithContent();
  } else {
    el.annotationList.classList.remove('default-mode');
    el.annotationList.innerHTML = sorted.map((ann, index) => renderItem(ann, index)).join('');
  }

  // 恢复 reply input 草稿
  if (replyDrafts.size > 0) {
    el.annotationList.querySelectorAll<HTMLTextAreaElement>('[data-reply-input]').forEach((input) => {
      const id = input.getAttribute('data-reply-input');
      if (id && replyDrafts.has(id)) input.value = replyDrafts.get(id)!;
    });
  }

  // 延迟到下一帧批量处理，避免 render 时多次强制 layout
  requestAnimationFrame(() => {
    el.annotationList?.querySelectorAll('[data-reply-input]').forEach((inputEl) => {
      autoResizeReplyInput(inputEl as HTMLTextAreaElement);
    });
  });
}

// ==================== 事件处理 ====================
export function handleSelectionForAnnotation(filePath: string | null): void {
  const el = getElements();
  const renderedFilePath = el.content?.getAttribute('data-current-file');
  if (!filePath || !renderedFilePath || filePath !== renderedFilePath || !el.reader) return;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

  const range = selection.getRangeAt(0);
  if (!el.reader.contains(range.commonAncestorContainer)) return;

  const selectionText = selection.toString().trim();
  if (!selectionText) return;

  let start = globalOffsetForPosition(el.reader, range.startContainer, range.startOffset);
  let end = globalOffsetForPositionEnd(el.reader, range.endContainer, range.endOffset);
  // Degraded: position failed (formula/table), but keep selection text for Todo
  const positionValid = start >= 0 && end > start;
  if (!positionValid) {
    start = -1;
    end = 0;
  }
  const fullText = getReaderText(el.reader);
  // Use fullText slice as quote so it matches the anchor text (katex skipped).
  // quote = fullText slice for stable anchor matching (katex skipped).
  // displayQuote = original selection text so the formula renders in the UI.
  const quote = positionValid ? fullText.slice(start, end) : selectionText;
  const displayQuote = positionValid && selectionText !== quote ? selectionText : undefined;
  const prefixWindow = 200;
  const suffixWindow = 200;
  const quotePrefix = positionValid ? fullText.slice(Math.max(0, start - prefixWindow), start) : '';
  const quoteSuffix = positionValid ? fullText.slice(end, Math.min(fullText.length, end + suffixWindow)) : '';

  setChatContext({
    filePath: state.currentFilePath ?? undefined,
    quote,
    quotePrefix,
    quoteSuffix,
  });

  // For multi-line selections getBoundingClientRect().right is the rightmost edge
  // of the entire selection box (often the content area edge), not the end of the
  // selected text. Use the last client rect so the toolbar appears near where the
  // selection actually ends.
  const rects = range.getClientRects();
  const lastRect = rects.length > 0 ? rects[rects.length - 1] : range.getBoundingClientRect();
  showQuickAdd(lastRect.right + 6, lastRect.top - 8, {
    id: `ann-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    start,
    length: positionValid ? end - start : 0,
    quote,
    displayQuote,
    quotePrefix,
    quoteSuffix: positionValid ? fullText.slice(end, Math.min(fullText.length, end + suffixWindow)) : '',
    status: 'anchored',
    confidence: positionValid ? 1 : 0,
  });
}

// ==================== 初始化 ====================
export function initAnnotationElements(): void {
  registerPersistenceCallbacks({
    applyAnnotations,
    renderAnnotationList,
    hideComposer,
    hideQuickAdd,
    hidePopover,
  });
  registerRenderingCallbacks({
    persistAnnotations,
    showPopover,
    hidePopover,
    renderAnnotationList,
  });
  registerThreadCallbacks({
    renderAnnotationList,
    showPopover,
    persistAnnotation,
    applyAnnotations,
  });
  invalidateAnnotationElementsCache();
  registerCollapseCallback(() => {
    hideQuickAdd(true);
    hidePopover(true);
  });
  initAnnotationSidebarWidth();
  setSidebarCollapsed(true);

  // 事件委托：annotation list 容器上统一处理所有交互
  // _listFilePath 由 renderAnnotationList 每次更新，委托无需关心 filePath 参数
  document.getElementById('annotationList')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const fp = _listFilePath;
    if (!fp) return;

    // 操作按钮（prev/next/resolve/delete）
    const actionBtn = target.closest('.annotation-icon-action') as HTMLElement | null;
    if (actionBtn) {
      e.stopPropagation();
      const action = actionBtn.getAttribute('data-action');
      const id = actionBtn.getAttribute('data-id');
      if (!id) return;
      if (action === 'prev') jumpToRelative(id, -1, fp);
      else if (action === 'next') jumpToRelative(id, 1, fp);
      else if (action === 'resolve') toggleResolved(id, fp);
      else if (action === 'delete') removeAnnotation(id, fp);
      return;
    }

    // 编辑 thread item
    const editBtn = target.closest('[data-edit-thread-item]') as HTMLElement | null;
    if (editBtn) {
      e.stopPropagation();
      const itemId = editBtn.getAttribute('data-edit-thread-item');
      const annotationId = editBtn.getAttribute('data-annotation-id');
      if (itemId && annotationId) editThreadItem(annotationId, itemId, fp);
      return;
    }

    // 删除 thread item
    const deleteBtn = target.closest('[data-delete-thread-item]') as HTMLElement | null;
    if (deleteBtn) {
      e.stopPropagation();
      const itemId = deleteBtn.getAttribute('data-delete-thread-item');
      const annotationId = deleteBtn.getAttribute('data-annotation-id');
      if (itemId && annotationId) deleteThreadItem(annotationId, itemId, fp);
      return;
    }

    // reply entry 区域点击 → 聚焦 textarea
    const replyEntry = target.closest('[data-reply-entry]') as HTMLElement | null;
    if (replyEntry && !(target instanceof HTMLTextAreaElement)) {
      e.stopPropagation();
      const id = replyEntry.getAttribute('data-reply-entry');
      if (!id) return;
      const input = document.querySelector(`[data-reply-input="${id}"]`) as HTMLTextAreaElement | null;
      if (input) { autoResizeReplyInput(input); input.focus(); }
      return;
    }

    // annotation item 点击 → 激活
    const annotationItem = target.closest('.annotation-item') as HTMLElement | null;
    if (annotationItem && !target.closest('.annotation-reply-entry') && !target.closest('.annotation-row-actions')) {
      const id = annotationItem.getAttribute('data-annotation-id');
      if (id) setActiveAnnotation(id, fp);
    }
  });

  document.getElementById('annotationList')?.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement;
    const fp = _listFilePath;
    if (!fp) return;

    // reply entry keydown → Enter/Space 聚焦
    const replyEntry = target.closest('[data-reply-entry]') as HTMLElement | null;
    if (replyEntry && !(target instanceof HTMLTextAreaElement)) {
      const ke = e as KeyboardEvent;
      if (ke.key !== 'Enter' && ke.key !== ' ') return;
      ke.preventDefault();
      ke.stopPropagation();
      const id = replyEntry.getAttribute('data-reply-entry');
      if (!id) return;
      const input = document.querySelector(`[data-reply-input="${id}"]`) as HTMLTextAreaElement | null;
      if (input) { autoResizeReplyInput(input); input.focus(); }
      return;
    }

    // reply input keydown → Cmd+Enter 提交，Emacs keys
    if (target instanceof HTMLTextAreaElement && target.hasAttribute('data-reply-input')) {
      const ke = e as KeyboardEvent;
      if (handleEmacsKeys(ke, target)) { ke.preventDefault(); return; }
      if (ke.key !== 'Enter' || !(ke.metaKey || ke.ctrlKey)) return;
      ke.preventDefault();
      const id = target.getAttribute('data-reply-input');
      if (!id) return;
      appendReply(id, fp, target.value);
      target.value = '';
      renderAnnotationList(fp);
    }
  });

  document.getElementById('annotationList')?.addEventListener('input', (e) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLTextAreaElement && target.hasAttribute('data-reply-input')) {
      autoResizeReplyInput(target);
    }
  });

  document.addEventListener('annotation:created', (e: Event) => {
    const { filePath } = (e as CustomEvent).detail;
    if (filePath) recordSignal(filePath, 'annotate');
  });

  // 绑定全局事件
  document.getElementById('composerSaveBtn')?.addEventListener('click', () => {
    const filePath = getActiveAnnotationFilePath();
    if (filePath) savePendingAnnotation(filePath);
  });

  document.getElementById('composerCancelBtn')?.addEventListener('click', hideComposer);
  getElements().composerNote?.addEventListener('keydown', (event) => {
    if (handleEmacsKeys(event, event.currentTarget as HTMLTextAreaElement)) {
      event.preventDefault();
      return;
    }
    if (event.key !== 'Enter') return;
    if (!(event.metaKey || event.ctrlKey)) return; // Cmd/Ctrl+Enter 提交
    event.preventDefault();
    const filePath = getActiveAnnotationFilePath();
    if (filePath) savePendingAnnotation(filePath);
  });
  getElements().composerNote?.addEventListener('input', (event) => {
    const input = event.currentTarget as HTMLTextAreaElement;
    autoResizeComposerInput(input);
  });
  getElements().quickAddComment?.addEventListener('click', (event) => {
    event.stopPropagation();
    const pending = state.pendingAnnotation;
    if (!pending || pending.start < 0) {
      hideQuickAdd(true);
      return;
    }
    hideQuickAdd(false);
    openComposerFromPending();
  });

  getElements().quickAddTodo?.addEventListener('click', (event) => {
    event.stopPropagation();
    const pending = state.pendingAnnotation;
    const filePath = state.pendingAnnotationFilePath;
    hideQuickAdd(true);
    if (!pending || !filePath) return;
    document.dispatchEvent(new CustomEvent('todo:open-composer', {
      detail: {
        quote: displayQuoteOf(pending),
        filePath,
        quotePrefix: pending.quotePrefix,
        quoteSuffix: pending.quoteSuffix,
        x: _lastQuickAddX,
        y: _lastQuickAddY,
      },
    }));
  });

  document.getElementById('popoverCloseBtn')?.addEventListener('click', () => {
    state.pinnedAnnotationId = null;
    hidePopover(true);
  });

  // Annotation copy menu
  const annotationCopyMenu = document.getElementById('annotationCopyMenu');
  function hideAnnotationCopyMenu() {
    annotationCopyMenu?.classList.add('hidden');
  }
  document.addEventListener('click', (e) => {
    if (annotationCopyMenu && !annotationCopyMenu.classList.contains('hidden')) {
      const btn = document.getElementById('popoverCopyBtn');
      if (!annotationCopyMenu.contains(e.target as Node) && e.target !== btn) {
        hideAnnotationCopyMenu();
      }
    }
  });
  function getMenuAnn(): Annotation | null {
    return (annotationCopyMenu as any)?._ann ?? null;
  }
  function formatAnnotationFull(ann: Annotation): string {
    const quoted = (displayQuoteOf(ann) || '').split('\n').map(l => `> ${l}`).join('\n');
    const thread = Array.isArray(ann.thread) ? ann.thread : [];
    const root = thread.find(t => t.type === 'comment') || thread[0];
    const rootLine = root ? `me: ${root.note}` : (ann.note ? `me: ${ann.note}` : '');
    const replies = thread.filter(t => t.type === 'reply').map(r => `- me: ${r.note}`);
    return [quoted, rootLine, ...replies].filter(Boolean).join('\n');
  }
  document.getElementById('annotationCopyAll')?.addEventListener('click', () => {
    const ann = getMenuAnn();
    if (!ann) return;
    navigator.clipboard.writeText(formatAnnotationFull(ann)).catch(() => {});
    hideAnnotationCopyMenu();
  });
  document.getElementById('annotationCopyQuote')?.addEventListener('click', () => {
    const ann = getMenuAnn();
    if (!ann) return;
    navigator.clipboard.writeText(displayQuoteOf(ann) || '').catch(() => {});
    hideAnnotationCopyMenu();
  });
  document.getElementById('annotationCopyNote')?.addEventListener('click', () => {
    const ann = getMenuAnn();
    if (!ann) return;
    const thread = Array.isArray(ann.thread) ? ann.thread : [];
    const root = thread.find(t => t.type === 'comment') || thread[0];
    const note = root?.note || ann.note || '';
    navigator.clipboard.writeText(note).catch(() => {});
    hideAnnotationCopyMenu();
  });

  document.getElementById('popoverDeleteBtn')?.addEventListener('click', () => {
    const filePath = getActiveAnnotationFilePath();
    const id = state.pinnedAnnotationId;
    if (id && filePath) removeAnnotation(id, filePath);
  });

  document.getElementById('popoverResolveBtn')?.addEventListener('click', () => {
    const filePath = getActiveAnnotationFilePath();
    const id = state.pinnedAnnotationId;
    if (id && filePath) toggleResolved(id, filePath);
  });
  document.getElementById('popoverPrevBtn')?.addEventListener('click', () => {
    const filePath = getActiveAnnotationFilePath();
    const id = state.pinnedAnnotationId;
    if (id && filePath) jumpToRelative(id, -1, filePath);
  });
  document.getElementById('popoverNextBtn')?.addEventListener('click', () => {
    const filePath = getActiveAnnotationFilePath();
    const id = state.pinnedAnnotationId;
    if (id && filePath) jumpToRelative(id, 1, filePath);
  });
  document.getElementById('annotationPopover')?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const filePath = getActiveAnnotationFilePath();
    if (!filePath) return;
    const editBtn = target.closest('[data-edit-thread-item]') as HTMLElement | null;
    if (editBtn) {
      event.stopPropagation();
      const itemId = editBtn.getAttribute('data-edit-thread-item');
      const annotationId = editBtn.getAttribute('data-annotation-id');
      if (itemId && annotationId) editThreadItem(annotationId, itemId, filePath);
      return;
    }
    const deleteBtn = target.closest('[data-delete-thread-item]') as HTMLElement | null;
    if (deleteBtn) {
      event.stopPropagation();
      const itemId = deleteBtn.getAttribute('data-delete-thread-item');
      const annotationId = deleteBtn.getAttribute('data-annotation-id');
      if (itemId && annotationId) deleteThreadItem(annotationId, itemId, filePath);
      return;
    }
    const entry = target.closest('[data-popover-reply-entry]') as HTMLElement | null;
    if (entry) {
      event.stopPropagation();
      const id = entry.getAttribute('data-popover-reply-entry');
      if (!id) return;
      const input = document.querySelector(`[data-popover-reply-input="${id}"]`) as HTMLTextAreaElement | null;
      if (!input) return;
      autoResizeReplyInput(input);
      input.focus();
      return;
    }
    const input = target.closest('[data-popover-reply-input]') as HTMLTextAreaElement | null;
    if (input) event.stopPropagation();
  });
  document.getElementById('annotationPopover')?.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;
    if (target instanceof HTMLTextAreaElement) return;
    const entry = target.closest('[data-popover-reply-entry]') as HTMLElement | null;
    if (!entry) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopPropagation();
    const id = entry.getAttribute('data-popover-reply-entry');
    if (!id) return;
    const input = document.querySelector(`[data-popover-reply-input="${id}"]`) as HTMLTextAreaElement | null;
    if (!input) return;
    autoResizeReplyInput(input);
    input.focus();
  });
  document.getElementById('annotationPopover')?.addEventListener('keydown', (event) => {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLTextAreaElement)) return;
    if (handleEmacsKeys(event, target)) {
      event.preventDefault();
      return;
    }
    if (event.key !== 'Enter') return;
    if (!(event.metaKey || event.ctrlKey)) return; // Cmd/Ctrl+Enter 提交
    const id = target.getAttribute('data-popover-reply-input');
    const filePath = getActiveAnnotationFilePath();
    if (!id || !filePath) return;
    event.preventDefault();
    appendReply(id, filePath, target.value);
    target.value = '';
    const ann = state.annotations.find((item) => item.id === id);
    const mark = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
    const rect = mark?.getBoundingClientRect();
    if (ann) showPopover(ann, rect ? rect.right + 8 : 120, rect ? rect.top + 8 : 120);
    renderAnnotationList(filePath);
  });
  document.getElementById('annotationPopover')?.addEventListener('input', (event) => {
    const target = event.target as HTMLElement;
    if (!(target instanceof HTMLTextAreaElement)) return;
    if (!target.hasAttribute('data-popover-reply-input')) return;
    autoResizeReplyInput(target);
  });

  getElements().filterMenu?.querySelectorAll('.annotation-filter-item[data-filter]').forEach((node) => {
    node.addEventListener('click', () => {
      const next = (node as HTMLElement).getAttribute('data-filter') as AnnotationFilter | null;
      if (!next) return;
      state.filter = next;
      getElements().filterMenu?.classList.add('hidden');
      const currentFile = getActiveAnnotationFilePath();
      applyAnnotations();
      renderAnnotationList(currentFile || null);
    });
  });

  getElements().filterMenu?.querySelector('[data-action="toggle-include-unanchored"]')?.addEventListener('click', (event) => {
    event.stopPropagation(); // 点击不关闭菜单
    state.includeUnanchored = !state.includeUnanchored;
    storageSet('md-viewer:annotation-include-unanchored', state.includeUnanchored);
    updateControlState();
    const currentFile = getActiveAnnotationFilePath();
    applyAnnotations();
    renderAnnotationList(currentFile || null);
  });

  getElements().filterToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    const menu = getElements().filterMenu;
    if (!menu) return;
    menu.classList.toggle('hidden');
  });

  document.getElementById('todoFilterToggle')?.addEventListener('click', (event) => {
    event.stopPropagation();
    const menu = document.getElementById('todoFilterMenu');
    if (!menu) return;
    menu.classList.toggle('hidden');
  });

  document.getElementById('todoFilterMenu')?.querySelectorAll('.annotation-filter-item[data-todo-filter]').forEach((node) => {
    const button = node as HTMLButtonElement;
    button.addEventListener('click', () => {
      const filter = button.getAttribute('data-todo-filter') as 'open' | 'all';
      document.getElementById('todoFilterMenu')?.querySelectorAll('.annotation-filter-item').forEach(b =>
        b.classList.toggle('is-active', b === button)
      );
      document.getElementById('todoFilterMenu')?.classList.add('hidden');
      import('./ui/todo-panel').then(m => m.setTodoFilter(filter));
    });
  });

  getElements().densityToggle?.addEventListener('click', () => {
    state.density = state.density === 'default' ? 'simple' : 'default';
    storageSet('md-viewer:annotation-density', state.density);
    const currentFile = getActiveAnnotationFilePath();
    renderAnnotationList(currentFile || null);
  });

  getElements().closeToggle?.addEventListener('click', () => {
    closeAnnotationSidebar();
  });
  getElements().floatingOpenBtn?.addEventListener('click', () => {
    openAnnotationSidebar();
  });

  document.getElementById('todoFloatingBtn')?.addEventListener('click', () => {
    openAnnotationSidebar();
    switchAnnotationTab('todo');
  });

  const resizerEl = getElements().sidebarResizer;
  if (resizerEl) {
    createResizer({
      element: resizerEl,
      bodyClass: 'annotation-sidebar-resizing',
      guard: () => !getElements().sidebar?.classList.contains('collapsed'),
      onMove: (_delta, clientX) => {
        setAnnotationSidebarWidth(window.innerWidth - clientX);
        syncAnnotationSidebarLayout();
      },
      onEnd: (_delta, clientX) => {
        setAnnotationSidebarWidth(window.innerWidth - clientX);
        syncAnnotationSidebarLayout();
      },
    });
  }

  document.getElementById('content')?.addEventListener('scroll', () => {
    hideQuickAdd(false); // 滚动只隐藏按钮，不清除 pending 划线
    syncAnnotationScrollWithContent();
    syncPinnedPopoverPosition();
  });
  window.addEventListener('resize', () => {
    syncAnnotationSidebarLayout();
    syncPinnedPopoverPosition();
  });

  // ── 拆分 / 合并 Chat 面板 ──────────────────────────────────────────────────
  registerChatSplitCallbacks({ switchAnnotationTab });
  initChatSplit();

  // PDF annotation popover 事件
  document.addEventListener('pdf:show-popover', (e: Event) => {
    const { annotation, x, y } = (e as CustomEvent).detail;
    if (annotation) {
      showPopover(annotation, x, y);
    }
  });

  document.addEventListener('mousedown', (event) => {
    const target = event.target as Node;
    const els = getElements();

    // 点击 temp mark → 展开 composer
    if ((target as HTMLElement).closest('.annotation-mark-temp')) {
      expandComposer();
      return;
    }

    // 点击 composer 外部 → 折叠（保留内容和划线）
    if (
      els.composer &&
      !els.composer.classList.contains('hidden') &&
      !els.composer.contains(target) &&
      !(els.quickAddWrap?.contains(target))
    ) {
      collapseComposer();
    }

    if (
      els.popover &&
      !els.popover.contains(target) &&
      !(target as HTMLElement).closest('.annotation-mark')
    ) {
      state.pinnedAnnotationId = null;
      hidePopover(true);
    }

    if (
      els.filterMenu &&
      !els.filterMenu.classList.contains('hidden') &&
      !els.filterMenu.contains(target) &&
      !((target as HTMLElement).closest('#annotationFilterToggle'))
    ) {
      els.filterMenu.classList.add('hidden');
    }

    const todoFilterMenu = document.getElementById('todoFilterMenu');
    if (
      todoFilterMenu &&
      !todoFilterMenu.classList.contains('hidden') &&
      !todoFilterMenu.contains(target) &&
      !((target as HTMLElement).closest('#todoFilterToggle'))
    ) {
      todoFilterMenu.classList.add('hidden');
    }

    if (
      els.quickAddWrap &&
      !els.quickAddWrap.classList.contains('hidden') &&
      !els.quickAddWrap.contains(target) &&
      !(target as HTMLElement).closest('#annotationComposer')
    ) {
      hideQuickAdd(true);
    }
  });

  // 通用拖拽逻辑，供 composer 和 popover 复用
  function makeDraggable(header: HTMLElement, panel: HTMLElement): void {
    header.addEventListener('mousedown', (event) => {
      if ((event.target as HTMLElement).closest('button, .annotation-row-actions')) return;
      const rect = panel.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const baseLeft = rect.left;
      const baseTop = rect.top;
      event.preventDefault(); // 阻止 mousedown 导致 textarea 失焦

      panel.classList.add('is-dragging');
      header.style.cursor = 'grabbing';

      const onMove = (moveEvent: MouseEvent) => {
        const nextLeft = baseLeft + (moveEvent.clientX - startX);
        const nextTop = baseTop + (moveEvent.clientY - startY);
        placeFloating(panel, nextLeft, nextTop);
      };
      const onUp = () => {
        panel.classList.remove('is-dragging');
        header.style.cursor = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  const el = getElements();
  if (el.composerHeader && el.composer) makeDraggable(el.composerHeader, el.composer);
  if (el.popoverHeader && el.popover) makeDraggable(el.popoverHeader, el.popover);

  loadQuickComments();
}

export function setPendingAnnotation(annotation: Annotation, filePath: string, clientX?: number, clientY?: number): void {
  state.pendingAnnotation = annotation;
  state.pendingAnnotationFilePath = filePath;
  openComposerFromPending(clientX, clientY);
}
