/**
 * 圈点评论功能模块
 */

import { collectTextNodes, buildTextNodeIndex, positionForOffset as positionForOffsetFast, type TextNodeIndex } from './utils/text-node-index';
import { escapeHtml } from './utils/escape';
import {
  fetchAnnotations,
  upsertAnnotationRemote,
  replyAnnotationRemote,
  deleteAnnotationRemote,
  updateAnnotationStatusRemote,
} from './api/annotations';
import { showError } from './ui/toast';
import { resolveAnnotationAnchor } from './utils/annotation-anchor';

// ==================== 类型定义 ====================
export interface Annotation {
  id: string;
  serial?: number;
  start: number;
  length: number;
  quote: string;
  note: string;
  createdAt: number;
  quotePrefix?: string;
  quoteSuffix?: string;
  status?: 'anchored' | 'unanchored' | 'resolved';
  confidence?: number;
  thread?: AnnotationThreadItem[];
}

export interface AnnotationThreadItem {
  id: string;
  type: 'comment' | 'reply';
  note: string;
  createdAt: number;
}

type AnnotationFilter = 'all' | 'open' | 'resolved' | 'orphan';
type AnnotationDensity = 'default' | 'simple';
const ANNOTATION_WIDTH_KEY = 'md-viewer:annotation-sidebar-width';
const ANNOTATION_WIDTH_DEFAULT = 320;
const ANNOTATION_WIDTH_MIN = 260;
const ANNOTATION_WIDTH_MAX = 540;

interface AnnotationState {
  annotations: Annotation[];
  pendingAnnotation: Annotation | null;
  pendingAnnotationFilePath: string | null;
  pinnedAnnotationId: string | null;
  activeAnnotationId: string | null;
  currentFilePath: string | null;
  filter: AnnotationFilter;
  density: AnnotationDensity;
}

function getInitialDensity(): AnnotationDensity {
  try {
    if (typeof localStorage === 'undefined') return 'default';
    return localStorage.getItem('md-viewer:annotation-density') === 'simple' ? 'simple' : 'default';
  } catch {
    return 'default';
  }
}

// ==================== 状态管理 ====================
const state: AnnotationState = {
  annotations: [],
  pendingAnnotation: null,
  pendingAnnotationFilePath: null,
  pinnedAnnotationId: null,
  activeAnnotationId: null,
  currentFilePath: null,
  filter: 'open',
  density: getInitialDensity(),
};
const ANNOTATION_PANEL_OPEN_BY_FILE_KEY = 'md-viewer:annotation-panel-open-by-file';

export function nextAnnotationSerial(annotations: Annotation[]): number {
  const maxSerial = annotations.reduce((max, ann) => {
    if (typeof ann.serial !== 'number' || !Number.isFinite(ann.serial)) return max;
    return Math.max(max, ann.serial);
  }, 0);
  return maxSerial + 1;
}

function normalizeThread(annotation: Annotation): AnnotationThreadItem[] {
  const fallbackCreatedAt = Number.isFinite(annotation.createdAt) ? annotation.createdAt : Date.now();
  const incoming = Array.isArray(annotation.thread) ? annotation.thread : [];
  const normalized = incoming
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const note = String((item as any).note || '').trim();
      if (!note) return null;
      const typeRaw = String((item as any).type || (index === 0 ? 'comment' : 'reply'));
      const type: AnnotationThreadItem['type'] = typeRaw === 'reply' ? 'reply' : 'comment';
      const createdAtRaw = Number((item as any).createdAt);
      const createdAt = Number.isFinite(createdAtRaw) ? Math.floor(createdAtRaw) : fallbackCreatedAt + index;
      const id = String((item as any).id || '').trim() || `${type}-${createdAt}-${Math.random().toString(16).slice(2, 8)}`;
      return { id, type, note, createdAt } as AnnotationThreadItem;
    })
    .filter((item): item is AnnotationThreadItem => !!item)
    .sort((a, b) => a.createdAt - b.createdAt);
  if (normalized.length === 0) {
    const note = String(annotation.note || '').trim();
    if (!note) return [];
    return [{
      id: `c-${annotation.id || fallbackCreatedAt}`,
      type: 'comment',
      note,
      createdAt: fallbackCreatedAt,
    }];
  }
  normalized[0].type = 'comment';
  for (let i = 1; i < normalized.length; i += 1) normalized[i].type = 'reply';
  return normalized;
}

function ensureAnnotationThread(annotation: Annotation): boolean {
  const nextThread = normalizeThread(annotation);
  const prev = JSON.stringify(annotation.thread || []);
  const next = JSON.stringify(nextThread);
  annotation.thread = nextThread;
  annotation.note = nextThread[0]?.note || annotation.note || '';
  return prev !== next;
}

function ensureAnnotationThreads(annotations: Annotation[]): boolean {
  let changed = false;
  for (const ann of annotations) {
    if (ensureAnnotationThread(ann)) changed = true;
  }
  return changed;
}

export function ensureAnnotationSerials(annotations: Annotation[]): boolean {
  let changed = false;
  const withIndex = annotations.map((ann, index) => ({ ann, index }));
  withIndex.sort((a, b) => {
    const leftTime = Number.isFinite(a.ann.createdAt) ? a.ann.createdAt : 0;
    const rightTime = Number.isFinite(b.ann.createdAt) ? b.ann.createdAt : 0;
    if (leftTime !== rightTime) return leftTime - rightTime;
    return a.index - b.index;
  });
  let cursor = 1;
  for (const { ann } of withIndex) {
    if (typeof ann.serial === 'number' && Number.isFinite(ann.serial) && ann.serial > 0) {
      cursor = Math.max(cursor, ann.serial + 1);
      continue;
    }
    ann.serial = cursor;
    cursor += 1;
    changed = true;
  }
  return changed;
}

function replaceAnnotationInState(next: Annotation): void {
  const index = state.annotations.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    state.annotations[index] = next;
    return;
  }
  state.annotations.push(next);
}

function persistAnnotation(filePath: string, annotation: Annotation, errorPrefix = '评论保存失败'): void {
  void upsertAnnotationRemote(filePath, annotation)
    .then((saved) => {
      if (state.currentFilePath !== filePath) return;
      replaceAnnotationInState(saved);
      renderAnnotationList(filePath);
      applyAnnotations();
    })
    .catch((error) => {
      showError(`${errorPrefix}: ${error?.message || '未知错误'}`, 2600);
    });
}

function persistAnnotations(filePath: string, annotations: Annotation[], errorPrefix = '评论保存失败'): void {
  for (const annotation of annotations) {
    persistAnnotation(filePath, annotation, errorPrefix);
  }
}

export function setAnnotations(filePath: string | null): void {
  state.currentFilePath = filePath;
  if (filePath) {
    state.annotations = [];
    void hydrateAnnotationsFromRemote(filePath);
  } else {
    state.annotations = [];
  }
  state.pinnedAnnotationId = null;
  state.activeAnnotationId = null;
  state.pendingAnnotation = null;
  state.pendingAnnotationFilePath = null;
  hideComposer();
  hideQuickAdd(true);
  hidePopover(true);
  if (filePath) {
    const openByFile = loadAnnotationPanelOpenByFile();
    const opened = openByFile[filePath] === true;
    setSidebarCollapsed(!opened);
  } else {
    setSidebarCollapsed(true);
  }
}

async function hydrateAnnotationsFromRemote(filePath: string): Promise<void> {
  try {
    const remote = await fetchAnnotations(filePath);
    if (!Array.isArray(remote)) return;
    if (state.currentFilePath !== filePath) return;
    state.annotations = remote;
    const threadChanged = ensureAnnotationThreads(state.annotations);
    const serialChanged = ensureAnnotationSerials(state.annotations);
    if (threadChanged || serialChanged) {
      persistAnnotations(filePath, state.annotations);
    }
    renderAnnotationList(filePath);
    applyAnnotations();
  } catch (error: any) {
    if (state.currentFilePath !== filePath) return;
    showError(`评论加载失败: ${error?.message || '未知错误'}`, 2600);
  }
}

export function getAnnotations(): Annotation[] {
  return state.annotations;
}

// ==================== DOM 元素引用 ====================
function getElements() {
  return {
    sidebar: document.getElementById('annotationSidebar'),
    sidebarResizer: document.getElementById('annotationSidebarResizer'),
    reader: document.getElementById('reader'),
    content: document.getElementById('content'),
    composer: document.getElementById('annotationComposer'),
    composerHeader: document.getElementById('annotationComposerHeader'),
    composerNote: document.getElementById('composerNote') as HTMLTextAreaElement | null,
    quickAdd: document.getElementById('annotationQuickAdd') as HTMLButtonElement | null,
    popover: document.getElementById('annotationPopover'),
    popoverTitle: document.getElementById('popoverTitle'),
    popoverNote: document.getElementById('popoverNote'),
    popoverResolveBtn: document.getElementById('popoverResolveBtn') as HTMLButtonElement | null,
    popoverPrevBtn: document.getElementById('popoverPrevBtn') as HTMLButtonElement | null,
    popoverNextBtn: document.getElementById('popoverNextBtn') as HTMLButtonElement | null,
    annotationList: document.getElementById('annotationList'),
    annotationCount: document.getElementById('annotationCount'),
    filterMenu: document.getElementById('annotationFilterMenu'),
    filterToggle: document.getElementById('annotationFilterToggle'),
    densityToggle: document.getElementById('annotationDensityToggle'),
    closeToggle: document.getElementById('annotationSidebarClose'),
    floatingOpenBtn: document.getElementById('annotationFloatingOpenBtn'),
  };
}

// ==================== 工具函数 ====================
function getTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.length > 0) {
      nodes.push(node as Text);
    }
  }
  return nodes;
}

function globalOffsetForPosition(root: HTMLElement, targetNode: Node, targetOffset: number): number {
  const nodes = getTextNodes(root);
  let count = 0;
  for (const node of nodes) {
    if (node === targetNode) {
      return count + targetOffset;
    }
    count += node.nodeValue?.length || 0;
  }
  return -1;
}

function positionForGlobalOffset(
  root: HTMLElement,
  offset: number,
  index?: TextNodeIndex
): { node: Text; offset: number } | null {
  if (index) {
    return positionForOffsetFast(index, offset);
  }
  // 原始线性逻辑（fallback，保持向后兼容）
  const nodes = getTextNodes(root);
  let count = 0;
  for (const node of nodes) {
    const len = node.nodeValue?.length || 0;
    const next = count + len;
    if (offset <= next) {
      return { node, offset: Math.max(0, offset - count) };
    }
    count = next;
  }
  if (nodes.length === 0) return null;
  const last = nodes[nodes.length - 1];
  return { node: last, offset: last.nodeValue?.length || 0 };
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function placeFloating(el: HTMLElement, x: number, y: number): void {
  const width = 360;
  const height = 220;
  const left = clamp(x, 8, window.innerWidth - width - 8);
  const top = clamp(y, 8, window.innerHeight - height - 8);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

function getReaderText(root: HTMLElement): string {
  return getTextNodes(root).map((node) => node.nodeValue || '').join('');
}

function isResolved(ann: Annotation): boolean {
  return ann.status === 'resolved';
}

function getAnchorTrack(ann: Annotation): 'exact' | 'reanchored' | 'orphan' {
  if (ann.status === 'unanchored') return 'orphan';
  if ((ann.confidence || 0) >= 0.95) return 'exact';
  return 'reanchored';
}

function matchesFilter(ann: Annotation, filter: AnnotationFilter): boolean {
  const isOrphan = ann.status === 'unanchored' || getAnchorTrack(ann) === 'orphan';
  if (filter === 'all') return true;
  if (filter === 'open') return !isResolved(ann) && !isOrphan;
  if (filter === 'resolved') return isResolved(ann) && !isOrphan;
  if (filter === 'orphan') return isOrphan;
  return true;
}

export function getAnnotationCurrentFilePath(): string | null {
  return state.currentFilePath;
}

function getActiveAnnotationFilePath(): string | null {
  const currentFilePath = state.currentFilePath;
  const renderedFilePath = document.getElementById('content')?.getAttribute('data-current-file') || null;
  if (!currentFilePath) return null;
  if (!renderedFilePath) return currentFilePath;
  return renderedFilePath === currentFilePath ? currentFilePath : null;
}

/**
 * Emacs/Readline 风格快捷键处理（适用于所有评论 textarea）
 * 返回 true 表示已处理，调用方应 preventDefault()
 */
function handleEmacsKeys(e: KeyboardEvent, textarea: HTMLTextAreaElement): boolean {
  if (!e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
  const key = e.key.toLowerCase();
  const { value, selectionStart: start, selectionEnd: end } = textarea;
  if (start === null || end === null) return false;

  const setPos = (pos: number) => {
    textarea.selectionStart = pos;
    textarea.selectionEnd = pos;
  };

  const lineStart = (pos: number) => {
    const idx = value.lastIndexOf('\n', pos - 1);
    return idx === -1 ? 0 : idx + 1;
  };
  const lineEnd = (pos: number) => {
    const idx = value.indexOf('\n', pos);
    return idx === -1 ? value.length : idx;
  };

  switch (key) {
    case 'a': setPos(lineStart(start)); return true;
    case 'e': setPos(lineEnd(start)); return true;
    case 'b': setPos(Math.max(0, start - 1)); return true;
    case 'f': setPos(Math.min(value.length, start + 1)); return true;
    case 'n': {
      const le = lineEnd(start);
      setPos(le === value.length ? le : Math.min(value.length, le + 1 + (start - lineStart(start))));
      return true;
    }
    case 'p': {
      const ls = lineStart(start);
      if (ls === 0) { setPos(0); return true; }
      const prevLineStart = lineStart(ls - 1);
      const prevLineLen = (ls - 1) - prevLineStart;
      setPos(prevLineStart + Math.min(start - ls, prevLineLen));
      return true;
    }
    case 'd': {
      if (start < value.length) {
        textarea.value = value.slice(0, start) + value.slice(start + 1);
        setPos(start);
        textarea.dispatchEvent(new Event('input'));
      }
      return true;
    }
    case 'k': {
      const le = lineEnd(start);
      // 如果光标已在行尾，删除换行符本身
      const deleteEnd = start === le && le < value.length ? le + 1 : le;
      textarea.value = value.slice(0, start) + value.slice(deleteEnd);
      setPos(start);
      textarea.dispatchEvent(new Event('input'));
      return true;
    }
    case 'u': {
      const ls = lineStart(start);
      textarea.value = value.slice(0, ls) + value.slice(start);
      setPos(ls);
      textarea.dispatchEvent(new Event('input'));
      return true;
    }
    case 'w': {
      // 删除前一个单词（空白分隔）
      let i = start;
      while (i > 0 && /\s/.test(value[i - 1])) i--;
      while (i > 0 && !/\s/.test(value[i - 1])) i--;
      textarea.value = value.slice(0, i) + value.slice(start);
      setPos(i);
      textarea.dispatchEvent(new Event('input'));
      return true;
    }
    case 'h': {
      if (start > 0) {
        textarea.value = value.slice(0, start - 1) + value.slice(start);
        setPos(start - 1);
        textarea.dispatchEvent(new Event('input'));
      }
      return true;
    }
    default: return false;
  }
}

function iconSvg(type: 'up' | 'down' | 'check' | 'trash' | 'comment' | 'list' | 'filter' | 'close' | 'edit' | 'reopen'): string {
  if (type === 'up') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>';
  if (type === 'down') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>';
  if (type === 'check') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>';
  if (type === 'trash') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>';
  if (type === 'comment') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>';
  if (type === 'list') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>';
  if (type === 'filter') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>';
  if (type === 'edit') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 2.5a1.5 1.5 0 012.1 2.1L5 13.2l-3 .8.8-3 8.7-8.5z"/></svg>';
  if (type === 'reopen') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zM6 5.5l4 2.5-4 2.5V5.5z"/></svg>';
  return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/></svg>';
}

function getVisibleAnnotations(): Annotation[] {
  return [...state.annotations]
    .filter((ann) => matchesFilter(ann, state.filter))
    .sort((a, b) => a.start - b.start);
}

function updateControlState(): void {
  const el = getElements();
  el.filterMenu?.querySelectorAll('.annotation-filter-item[data-filter]').forEach((node) => {
    const button = node as HTMLElement;
    button.classList.toggle('is-active', button.getAttribute('data-filter') === state.filter);
  });
  if (el.densityToggle) {
    el.densityToggle.classList.toggle('is-simple', state.density === 'simple');
    el.densityToggle.title = state.density === 'simple' ? '切换到默认列表' : '切换到极简列表';
  }
  if (el.filterToggle) {
    const map: Record<AnnotationFilter, string> = {
      all: '筛选：全部',
      open: '筛选：未解决',
      resolved: '筛选：已解决',
      orphan: '筛选：定位失败',
    };
    el.filterToggle.title = map[state.filter];
  }
}

function updateAnnotationCount(): void {
  const el = getElements();
  if (!el.annotationCount) return;
  el.annotationCount.textContent = String(getVisibleAnnotations().length);
}

function setSidebarCollapsed(collapsed: boolean): void {
  const el = getElements();
  if (!el.sidebar) return;
  el.sidebar.classList.toggle('collapsed', collapsed);
  document.body.classList.toggle('annotation-sidebar-collapsed', collapsed);
  if (collapsed) {
    el.filterMenu?.classList.add('hidden');
    hideQuickAdd(true);
    hidePopover(true);
  }
}

function loadAnnotationPanelOpenByFile(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(ANNOTATION_PANEL_OPEN_BY_FILE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAnnotationPanelOpenByFile(next: Record<string, boolean>): void {
  localStorage.setItem(ANNOTATION_PANEL_OPEN_BY_FILE_KEY, JSON.stringify(next));
}

function persistCurrentFilePanelOpen(opened: boolean): void {
  if (!state.currentFilePath) return;
  const map = loadAnnotationPanelOpenByFile();
  map[state.currentFilePath] = opened;
  saveAnnotationPanelOpenByFile(map);
}

function clampSidebarWidth(width: number): number {
  return Math.max(ANNOTATION_WIDTH_MIN, Math.min(ANNOTATION_WIDTH_MAX, Math.round(width)));
}

function setAnnotationSidebarWidth(width: number): void {
  const clamped = clampSidebarWidth(width);
  document.documentElement.style.setProperty('--annotation-sidebar-width', `${clamped}px`);
  localStorage.setItem(ANNOTATION_WIDTH_KEY, String(clamped));
}

function initAnnotationSidebarWidth(): void {
  const saved = Number(localStorage.getItem(ANNOTATION_WIDTH_KEY));
  const width = Number.isFinite(saved) && saved > 0 ? saved : ANNOTATION_WIDTH_DEFAULT;
  setAnnotationSidebarWidth(width);
}

export function syncAnnotationSidebarLayout(): void {
  const el = getElements();
  if (!el.sidebar) return;
  const tabs = document.getElementById('tabs');
  const topOffset = Math.max(0, Math.round((tabs?.getBoundingClientRect().bottom || 84)));
  const height = Math.max(0, window.innerHeight - topOffset);
  el.sidebar.style.top = `${topOffset}px`;
  el.sidebar.style.height = `${height}px`;
  if (el.sidebarResizer) {
    el.sidebarResizer.style.top = `${topOffset}px`;
    el.sidebarResizer.style.height = `${height}px`;
  }
  if (el.floatingOpenBtn) {
    el.floatingOpenBtn.style.top = `${topOffset + 6}px`;
  }
}

export function openAnnotationSidebar(): void {
  setSidebarCollapsed(false);
  persistCurrentFilePanelOpen(true);
  syncAnnotationSidebarLayout();
  syncAnnotationScrollWithContent();
}

export function closeAnnotationSidebar(): void {
  setSidebarCollapsed(true);
  persistCurrentFilePanelOpen(false);
}

export function toggleAnnotationSidebar(): void {
  const sidebar = getElements().sidebar;
  if (!sidebar) return;
  setSidebarCollapsed(!sidebar.classList.contains('collapsed'));
}

export function dismissAnnotationPopupByEscape(): boolean {
  const el = getElements();
  if (el.filterMenu && !el.filterMenu.classList.contains('hidden')) {
    el.filterMenu.classList.add('hidden');
    return true;
  }
  if (el.quickAdd && !el.quickAdd.classList.contains('hidden')) {
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

export function mergeAnnotationStatus(
  currentStatus: Annotation['status'] | undefined,
  resolvedStatus: 'anchored' | 'unanchored',
): Annotation['status'] {
  if (currentStatus === 'resolved') return 'resolved';
  return resolvedStatus;
}

// ==================== UI 操作 ====================
function showQuickAdd(x: number, y: number, pendingData: Omit<Annotation, 'note' | 'createdAt'>): void {
  const el = getElements();
  if (!el.quickAdd) return;
  // 新划词时关闭旧的 composer（明确的焦点转移）
  if (el.composer && !el.composer.classList.contains('hidden')) {
    hideComposer();
  }
  state.pendingAnnotation = { ...pendingData, note: '', createdAt: Date.now() };
  state.pendingAnnotationFilePath = el.content?.getAttribute('data-current-file') || state.currentFilePath;
  const width = 30;
  const height = 30;
  const left = clamp(x, 8, window.innerWidth - width - 8);
  const top = clamp(y, 8, window.innerHeight - height - 8);
  el.quickAdd.style.left = `${left}px`;
  el.quickAdd.style.top = `${top}px`;
  el.quickAdd.classList.remove('hidden');
}

function hideQuickAdd(clearPending = false): void {
  const el = getElements();
  if (!el.quickAdd) return;
  el.quickAdd.classList.add('hidden');
  if (clearPending) {
    clearTempSelectionMark();
    state.pendingAnnotation = null;
    state.pendingAnnotationFilePath = null;
  }
}

function openComposerFromPending(x?: number, y?: number): void {
  const el = getElements();
  if (!state.pendingAnnotation || !el.composer || !el.composerNote) return;
  applyTempSelectionMark();
  el.composerNote.value = '';
  autoResizeComposerInput(el.composerNote);
  const left = typeof x === 'number' ? x : (el.quickAdd ? Number.parseFloat(el.quickAdd.style.left || '0') : 0);
  const top = typeof y === 'number' ? y : (el.quickAdd ? Number.parseFloat(el.quickAdd.style.top || '0') : 0);
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

function clearTempSelectionMark(): void {
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
    const walker = document.createTreeWalker(el.reader, NodeFilter.SHOW_TEXT, null, false);
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
      if (nodeStart < nodeEnd) textNodes.push({ node: node as Text, start: nodeStart, end: nodeEnd });
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

function getCommentThread(annotation: Annotation): AnnotationThreadItem[] {
  ensureAnnotationThread(annotation);
  return annotation.thread || [];
}

function getReplyCount(annotation: Annotation): number {
  return getCommentThread(annotation).filter((item) => item.type === 'reply').length;
}

function renderThreadListHTML(annotation: Annotation, simple = false): string {
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
      </div>`)
    .join('');
  return body || '<div class="annotation-thread-line">（无评论内容）</div>';
}

function appendReply(annotationId: string, filePath: string, text: string): void {
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
      renderAnnotationList(filePath);
      applyAnnotations();
    })
    .catch((error) => {
      showError(`回复评论失败: ${error?.message || '未知错误'}`, 2600);
    });
}

function editThreadItem(annotationId: string, itemId: string, filePath: string): void {
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
  lineEl.innerHTML = `<textarea class="annotation-thread-edit-input">${escapeHtml(item.note)}</textarea>`;
  const textarea = lineEl.querySelector('textarea') as HTMLTextAreaElement;
  textarea.style.height = `${Math.max(textarea.scrollHeight, 34)}px`;
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);

  let committed = false; // 防止 blur 在 save/cancel 后再次触发

  const cancel = () => {
    if (committed) return;
    committed = true;
    lineEl.classList.remove('is-editing');
    lineEl.innerHTML = originalHTML;
    lineEl.querySelector('[data-edit-thread-item]')?.addEventListener('click', (e) => {
      e.stopPropagation();
      editThreadItem(annotationId, itemId, filePath);
    });
  };

  const save = () => {
    if (committed) return;
    committed = true;
    const newText = textarea.value.trim();
    if (!newText || newText === item.note) {
      // 内容未变，恢复原样
      lineEl.classList.remove('is-editing');
      lineEl.innerHTML = originalHTML;
      lineEl.querySelector('[data-edit-thread-item]')?.addEventListener('click', (e) => {
        e.stopPropagation();
        editThreadItem(annotationId, itemId, filePath);
      });
      return;
    }
    item.note = newText;
    if (thread[0]?.id === itemId) ann.note = newText;
    ann.thread = thread;
    persistAnnotation(filePath, ann, '编辑评论失败');
    // 立即更新 DOM：列表和 popover
    renderAnnotationList(filePath);
    // 如果 popover 正在显示这条评论，同步更新 popover 内容
    if (state.pinnedAnnotationId === annotationId) {
      const mark = document.querySelector(`[data-annotation-id="${annotationId}"]`) as HTMLElement | null;
      const rect = mark?.getBoundingClientRect();
      showPopover(ann, rect ? rect.right + 8 : 120, rect ? rect.top + 8 : 120);
    }
  };

  textarea.addEventListener('keydown', (e) => {
    if (handleEmacsKeys(e, textarea)) { e.preventDefault(); return; }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); save(); }
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

function autoResizeReplyInput(input: HTMLTextAreaElement): void {
  input.style.height = 'auto';
  const maxHeight = 160;
  const next = Math.min(maxHeight, Math.max(input.scrollHeight, 34));
  input.style.height = `${next}px`;
  input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function autoResizeComposerInput(input: HTMLTextAreaElement): void {
  input.style.height = 'auto';
  const maxHeight = 200;
  const next = Math.min(maxHeight, Math.max(input.scrollHeight, 34));
  input.style.height = `${next}px`;
  input.style.overflowY = input.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

function showPopover(ann: Annotation, x: number, y: number): void {
  const el = getElements();
  if (!el.popover || !el.popoverTitle || !el.popoverNote) return;
  const snippet = ann.quote.substring(0, 22);
  el.popoverTitle.textContent = `#${ann.serial || 0} | ${snippet}${ann.quote.length > 22 ? '...' : ''}`;
  const threadHTML = renderThreadListHTML(ann, false);
  el.popoverNote.innerHTML = `
    <div class="annotation-thread">${threadHTML}</div>
    <div class="annotation-reply-entry" data-popover-reply-entry="${ann.id}" role="button" tabindex="0">
      <textarea rows="1" data-popover-reply-input="${ann.id}" placeholder="输入回复内容（Cmd+Enter 提交）"></textarea>
    </div>
  `;
  if (el.popoverResolveBtn) {
    const resolved = isResolved(ann);
    el.popoverResolveBtn.title = resolved ? '重新打开' : '标记已解决';
    el.popoverResolveBtn.setAttribute('aria-label', resolved ? '重新打开' : '标记已解决');
    el.popoverResolveBtn.innerHTML = resolved ? iconSvg('reopen') : iconSvg('check');
    el.popoverResolveBtn.classList.toggle('is-resolved', resolved);
  }
  el.popover.style.left = `${Math.round(x)}px`;
  el.popover.style.top = `${Math.round(y)}px`;
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
  hideComposer();
  applyAnnotations();
  renderAnnotationList(filePath);
}

export function removeAnnotation(id: string, filePath: string): void {
  const previous = state.annotations.slice();
  state.annotations = state.annotations.filter((a) => a.id !== id);
  if (state.pinnedAnnotationId === id) {
    state.pinnedAnnotationId = null;
    hidePopover(true);
  }
  if (state.activeAnnotationId === id) {
    state.activeAnnotationId = null;
  }
  applyAnnotations();
  renderAnnotationList(filePath);
  void deleteAnnotationRemote(filePath, { id }).catch((error) => {
    state.annotations = previous;
    showError(`删除评论失败: ${error?.message || '未知错误'}`, 2600);
    applyAnnotations();
    renderAnnotationList(filePath);
  });
}

function jumpToAnnotation(id: string): void {
  const el = getElements();
  if (!el.content) return;
  const mark = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
  if (mark) {
    const contentRect = el.content.getBoundingClientRect();
    const markRect = mark.getBoundingClientRect();
    const currentTop = el.content.scrollTop;
    const targetTop = currentTop + (markRect.top - contentRect.top);
    const topPadding = 56;
    const finalTop = Math.max(0, targetTop - topPadding);
    el.content.scrollTo({ top: finalTop, behavior: 'smooth' });
  }
}

function setActiveAnnotation(id: string | null, filePath: string | null): void {
  state.activeAnnotationId = id;
  applyAnnotations();
  if (id) {
    jumpToAnnotation(id);
    state.pinnedAnnotationId = id;
    requestAnimationFrame(() => {
      const ann = state.annotations.find((item) => item.id === id);
      const mark = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
      if (!ann || !mark) return;
      const rect = mark.getBoundingClientRect();
      showPopover(ann, rect.right + 8, rect.top + 8);
    });
  }
  renderAnnotationList(filePath);
}

function jumpToRelative(id: string, delta: number, filePath: string): void {
  const sorted = getVisibleAnnotations();
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

function syncAnnotationScrollWithContent(): void {
  if (state.density !== 'default') return;
  const content = document.getElementById('content');
  const list = document.getElementById('annotationList');
  if (!content || !list) return;
  list.scrollTop = content.scrollTop;
}

function toggleResolved(id: string, filePath: string): void {
  const ann = state.annotations.find((item) => item.id === id);
  if (!ann) return;
  const previousStatus = ann.status;
  if (ann.status === 'resolved') {
    ann.status = (ann.confidence || 0) <= 0 ? 'unanchored' : 'anchored';
  } else {
    ann.status = 'resolved';
  }
  const nextStatus = ann.status || 'anchored';
  hidePopover(true);
  applyAnnotations();
  renderAnnotationList(filePath);
  void updateAnnotationStatusRemote(filePath, { id }, nextStatus).catch((error) => {
    ann.status = previousStatus;
    showError(`更新评论状态失败: ${error?.message || '未知错误'}`, 2600);
    applyAnnotations();
    renderAnnotationList(filePath);
  });
}

// ==================== 渲染 ====================
function decorateMark(wrapper: HTMLElement, ann: Annotation): void {
  wrapper.classList.add('annotation-mark');
  wrapper.dataset.annotationId = ann.id;
  wrapper.classList.add(`status-${getAnchorTrack(ann)}`);
  if (isResolved(ann)) {
    wrapper.classList.add('is-resolved');
  }
}

function applySingleAnnotation(ann: Annotation, index?: TextNodeIndex): void {
  const el = getElements();
  if (!el.reader) return;
  if (typeof ann.start !== 'number' || typeof ann.length !== 'number' || ann.length <= 0) return;

  const startPos = positionForGlobalOffset(el.reader, ann.start, index);
  const endPos = positionForGlobalOffset(el.reader, ann.start + ann.length, index);
  if (!startPos || !endPos) return;
  if (startPos.node === endPos.node && startPos.offset === endPos.offset) return;

  // 同一文本节点
  if (startPos.node === endPos.node) {
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);

    const wrapper = document.createElement('span');
    decorateMark(wrapper, ann);

    try {
      range.surroundContents(wrapper);
    } catch (_err) {
      // Skip
    }
    return;
  }

  // 跨文本节点
  try {
    const textNodes: Array<{ node: Text; start: number; end: number }> = [];
    const walker = document.createTreeWalker(el.reader, NodeFilter.SHOW_TEXT, null, false);

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

      if (nodeStart < nodeEnd) {
        textNodes.push({ node: node as Text, start: nodeStart, end: nodeEnd });
      }
    }

    for (let i = textNodes.length - 1; i >= 0; i--) {
      const { node, start, end } = textNodes[i];
      const nodeRange = document.createRange();
      nodeRange.setStart(node, start);
      nodeRange.setEnd(node, end);

      const wrapper = document.createElement('span');
      decorateMark(wrapper, ann);

      nodeRange.surroundContents(wrapper);
    }
  } catch (_err) {
    // Skip
  }
}

function attachAnnotationEvents(): void {
  const el = getElements();
  if (!el.reader) return;

  el.reader.querySelectorAll('.annotation-mark').forEach((markEl) => {
    const id = markEl.getAttribute('data-annotation-id');
    const ann = state.annotations.find((a) => a.id === id);
    if (!ann) return;

    markEl.classList.toggle('is-active', !!id && id === state.activeAnnotationId);

    markEl.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.pinnedAnnotationId === id) {
        state.pinnedAnnotationId = null;
        hidePopover(true);
        return;
      }
      state.activeAnnotationId = id;
      state.pinnedAnnotationId = id;
      const rect = markEl.getBoundingClientRect();
      showPopover(ann, rect.right + 8, rect.top + 8);
      const filePath = getActiveAnnotationFilePath();
      renderAnnotationList(filePath || null);
    });
  });
}

function clearRenderedMarks(): void {
  const el = getElements();
  if (!el.reader) return;
  const marks = Array.from(el.reader.querySelectorAll('.annotation-mark'));
  for (const mark of marks) {
    const parent = mark.parentNode;
    while (mark.firstChild) {
      parent?.insertBefore(mark.firstChild, mark);
    }
    parent?.removeChild(mark);
  }
}

export function applyAnnotations(): void {
  const el = getElements();
  clearRenderedMarks();

  // 一次 TreeWalker 建立索引，供所有批注定位复用
  const index: TextNodeIndex | undefined = el.reader
    ? buildTextNodeIndex(collectTextNodes(el.reader))
    : undefined;

  if (el.reader) {
    // 从索引直接拼接文本，避免第二次 TreeWalker
    const text = index
      ? index.nodes.map((n) => n.nodeValue || '').join('')
      : getReaderText(el.reader);

    let changed = false;
    const changedAnnotations: Annotation[] = [];
    for (const ann of state.annotations) {
      const resolved = resolveAnnotationAnchor(text, ann);
      let annChanged = false;
      const nextStatus = resolved.status;
      if (ann.start !== resolved.start) {
        ann.start = resolved.start;
        changed = true;
        annChanged = true;
      }
      if (ann.length !== resolved.length) {
        ann.length = resolved.length;
        changed = true;
        annChanged = true;
      }
      const mergedStatus = mergeAnnotationStatus(ann.status, nextStatus);
      if ((ann.status || 'anchored') !== mergedStatus) {
        ann.status = mergedStatus;
        changed = true;
        annChanged = true;
      }
      if (ann.confidence !== resolved.confidence) {
        ann.confidence = resolved.confidence;
        changed = true;
        annChanged = true;
      }
      if (annChanged) {
        changedAnnotations.push({ ...ann, thread: ann.thread ? [...ann.thread] : ann.thread });
      }
    }

    if (changed) {
      const currentFile = getActiveAnnotationFilePath();
      if (currentFile) {
        persistAnnotations(currentFile, changedAnnotations, '同步评论锚点失败');
      }
    }
  }

  const sorted = [...getVisibleAnnotations()]
    .sort((a, b) => b.start - a.start);
  for (const ann of sorted) {
    applySingleAnnotation(ann, index);
  }
  attachAnnotationEvents();
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

  const sorted = getVisibleAnnotations();
  if (sorted.length === 0) {
    el.annotationList.innerHTML = '<div class="annotation-empty">当前筛选下无评论</div>';
    return;
  }

  const renderItem = (ann: Annotation, index: number, positioned = false, top = 0) => `
    <div class="annotation-item ${state.activeAnnotationId === ann.id ? 'is-active' : ''} status-${getAnchorTrack(ann)}${isResolved(ann) ? ' is-resolved' : ''}${positioned ? ' positioned' : ''}" data-annotation-id="${ann.id}"${positioned ? ` data-anchor-top="${Math.max(0, Math.round(top))}" style="top:${Math.max(0, Math.round(top))}px"` : ''}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#${ann.serial || index + 1} | ${escapeHtml(ann.quote.substring(0, 28))}${ann.quote.length > 28 ? '...' : ''}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="${ann.id}" title="上一条">${iconSvg('up')}</button>
          <button class="annotation-icon-action" data-action="next" data-id="${ann.id}" title="下一条">${iconSvg('down')}</button>
          <button class="annotation-icon-action resolve${isResolved(ann) ? ' is-resolved' : ''}" data-action="resolve" data-id="${ann.id}" title="${isResolved(ann) ? '重新打开' : '标记已解决'}">${isResolved(ann) ? iconSvg('reopen') : iconSvg('check')}</button>
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

  el.annotationList.querySelectorAll('.annotation-icon-action').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const target = e.currentTarget as HTMLElement;
      const action = target.getAttribute('data-action');
      const id = target.getAttribute('data-id');
      if (!id || !filePath) return;

      if (action === 'prev') {
        jumpToRelative(id, -1, filePath);
      } else if (action === 'next') {
        jumpToRelative(id, 1, filePath);
      } else if (action === 'resolve') {
        toggleResolved(id, filePath);
      } else if (action === 'delete') {
        removeAnnotation(id, filePath);
      }
    });
  });

  el.annotationList.querySelectorAll('[data-edit-thread-item]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const itemId = (btn as HTMLElement).getAttribute('data-edit-thread-item');
      const annotationId = (btn as HTMLElement).getAttribute('data-annotation-id');
      if (!itemId || !annotationId || !filePath) return;
      editThreadItem(annotationId, itemId, filePath);
    });
  });

  el.annotationList.querySelectorAll('[data-reply-entry]').forEach((entry) => {
    entry.addEventListener('click', (event) => {
      event.stopPropagation();
      const id = (entry as HTMLElement).getAttribute('data-reply-entry');
      if (!id) return;
      const input = el.annotationList?.querySelector(`[data-reply-input="${id}"]`) as HTMLTextAreaElement | null;
      if (!input) return;
      autoResizeReplyInput(input);
      input.focus();
    });
    entry.addEventListener('keydown', (event) => {
      const target = event.target as HTMLElement;
      if (target instanceof HTMLTextAreaElement) return;
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      const id = (entry as HTMLElement).getAttribute('data-reply-entry');
      if (!id) return;
      const input = el.annotationList?.querySelector(`[data-reply-input="${id}"]`) as HTMLTextAreaElement | null;
      if (!input) return;
      autoResizeReplyInput(input);
      input.focus();
    });
  });

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

  el.annotationList.querySelectorAll('[data-reply-input]').forEach((inputEl) => {
    const input = inputEl as HTMLTextAreaElement;
    input.addEventListener('input', () => autoResizeReplyInput(input));
    input.addEventListener('click', (event) => event.stopPropagation());
    inputEl.addEventListener('keydown', (event) => {
      if (handleEmacsKeys(event, event.currentTarget as HTMLTextAreaElement)) {
        event.preventDefault();
        return;
      }
      if (event.key !== 'Enter') return;
      if (!(event.metaKey || event.ctrlKey)) return; // Cmd/Ctrl+Enter 提交
      event.preventDefault();
      const input = event.currentTarget as HTMLTextAreaElement;
      const id = input.getAttribute('data-reply-input');
      if (!id || !filePath) return;
      appendReply(id, filePath, input.value);
      input.value = '';
      renderAnnotationList(filePath);
    });
  });

  el.annotationList.querySelectorAll('.annotation-item').forEach((itemEl) => {
    itemEl.addEventListener('click', () => {
      const id = (itemEl as HTMLElement).getAttribute('data-annotation-id');
      if (!id || !filePath) return;
      setActiveAnnotation(id, filePath);
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

  const quote = selection.toString().trim();
  if (!quote) return;

  const start = globalOffsetForPosition(el.reader, range.startContainer, range.startOffset);
  const end = globalOffsetForPosition(el.reader, range.endContainer, range.endOffset);
  if (start < 0 || end <= start) return;
  const fullText = getReaderText(el.reader);
  const prefixWindow = 32;
  const suffixWindow = 32;
  const quotePrefix = fullText.slice(Math.max(0, start - prefixWindow), start);
  const quoteSuffix = fullText.slice(end, Math.min(fullText.length, end + suffixWindow));

  const rect = range.getBoundingClientRect();
  showQuickAdd(rect.right + 6, rect.top - 8, {
    id: `ann-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    start,
    length: end - start,
    quote,
    quotePrefix,
    quoteSuffix,
    status: 'anchored',
    confidence: 1,
  });
}

// ==================== 初始化 ====================
export function initAnnotationElements(): void {
  initAnnotationSidebarWidth();
  setSidebarCollapsed(true);

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
  getElements().quickAdd?.addEventListener('click', (event) => {
    event.stopPropagation();
    openComposerFromPending();
  });

  document.getElementById('popoverCloseBtn')?.addEventListener('click', () => {
    state.pinnedAnnotationId = null;
    hidePopover(true);
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

  getElements().filterToggle?.addEventListener('click', (event) => {
    event.stopPropagation();
    const menu = getElements().filterMenu;
    if (!menu) return;
    menu.classList.toggle('hidden');
  });

  getElements().densityToggle?.addEventListener('click', () => {
    state.density = state.density === 'default' ? 'simple' : 'default';
    localStorage.setItem('md-viewer:annotation-density', state.density);
    const currentFile = getActiveAnnotationFilePath();
    renderAnnotationList(currentFile || null);
  });

  getElements().closeToggle?.addEventListener('click', () => {
    closeAnnotationSidebar();
  });
  getElements().floatingOpenBtn?.addEventListener('click', () => {
    openAnnotationSidebar();
  });

  getElements().sidebarResizer?.addEventListener('mousedown', (event) => {
    if (getElements().sidebar?.classList.contains('collapsed')) return;
    event.preventDefault();
    const root = document.documentElement;
    const currentWidth = Number(getComputedStyle(root).getPropertyValue('--annotation-sidebar-width').replace('px', '')) || ANNOTATION_WIDTH_DEFAULT;
    const startX = event.clientX;
    document.body.classList.add('annotation-sidebar-resizing');
    const onMove = (moveEvent: MouseEvent) => {
      const delta = startX - moveEvent.clientX;
      setAnnotationSidebarWidth(currentWidth + delta);
      syncAnnotationSidebarLayout();
    };
    const onUp = () => {
      document.body.classList.remove('annotation-sidebar-resizing');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });

  document.getElementById('content')?.addEventListener('scroll', () => {
    hideQuickAdd(false); // 滚动只隐藏按钮，不清除 pending 划线
    syncAnnotationScrollWithContent();
    syncPinnedPopoverPosition();
  });
  window.addEventListener('resize', () => {
    syncAnnotationSidebarLayout();
    syncPinnedPopoverPosition();
  });

  (window as any).openAnnotationSidebar = openAnnotationSidebar;
  (window as any).closeAnnotationSidebar = closeAnnotationSidebar;
  (window as any).toggleAnnotationSidebar = toggleAnnotationSidebar;

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
      !(els.quickAdd && els.quickAdd.contains(target))
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

    if (
      els.quickAdd &&
      !els.quickAdd.classList.contains('hidden') &&
      !els.quickAdd.contains(target) &&
      !(target as HTMLElement).closest('#annotationComposer')
    ) {
      hideQuickAdd(true);
    }
  });

  getElements().composerHeader?.addEventListener('mousedown', (event) => {
    if ((event.target as HTMLElement).closest('.annotation-row-actions')) return;
    const composer = getElements().composer;
    if (!composer) return;
    const rect = composer.getBoundingClientRect();
    const startX = event.clientX;
    const startY = event.clientY;
    const baseLeft = rect.left;
    const baseTop = rect.top;
    event.preventDefault();
    const onMove = (moveEvent: MouseEvent) => {
      const nextLeft = baseLeft + (moveEvent.clientX - startX);
      const nextTop = baseTop + (moveEvent.clientY - startY);
      placeFloating(composer, nextLeft, nextTop);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}
