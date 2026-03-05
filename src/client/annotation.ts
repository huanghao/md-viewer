/**
 * 圈点评论功能模块
 */

import { escapeHtml } from './utils/escape';
import { fetchAnnotations, saveAnnotationsRemote, migrateAnnotationsRemote } from './api/annotations';
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
  pinnedAnnotationId: string | null;
  activeAnnotationId: string | null;
  currentFilePath: string | null;
  filter: AnnotationFilter;
  density: AnnotationDensity;
}

// ==================== 状态管理 ====================
const state: AnnotationState = {
  annotations: [],
  pendingAnnotation: null,
  pinnedAnnotationId: null,
  activeAnnotationId: null,
  currentFilePath: null,
  filter: 'all',
  density: localStorage.getItem('md-viewer:annotation-density') === 'simple' ? 'simple' : 'default',
};
const ANNOTATION_PANEL_OPEN_BY_FILE_KEY = 'md-viewer:annotation-panel-open-by-file';

function getStorageKey(filePath: string): string {
  return `md-viewer:annotations:${filePath}`;
}

export function nextAnnotationSerial(annotations: Annotation[]): number {
  const maxSerial = annotations.reduce((max, ann) => {
    if (typeof ann.serial !== 'number' || !Number.isFinite(ann.serial)) return max;
    return Math.max(max, ann.serial);
  }, 0);
  return maxSerial + 1;
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

export function loadAnnotations(filePath: string): Annotation[] {
  try {
    const raw = localStorage.getItem(getStorageKey(filePath));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
}

export function saveAnnotations(filePath: string, annotations: Annotation[]): void {
  localStorage.setItem(getStorageKey(filePath), JSON.stringify(annotations));
  void saveAnnotationsRemote(filePath, annotations).catch(() => {
    // 服务端不可用时，保持 localStorage 兜底
  });
}

export function setAnnotations(filePath: string | null): void {
  state.currentFilePath = filePath;
  if (filePath) {
    state.annotations = loadAnnotations(filePath);
    if (ensureAnnotationSerials(state.annotations)) {
      saveAnnotations(filePath, state.annotations);
    }
    void hydrateAnnotationsFromRemote(filePath);
  } else {
    state.annotations = [];
  }
  state.pinnedAnnotationId = null;
  state.activeAnnotationId = null;
  state.pendingAnnotation = null;
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
    const serialChanged = ensureAnnotationSerials(state.annotations);
    localStorage.setItem(getStorageKey(filePath), JSON.stringify(state.annotations));
    if (serialChanged) {
      saveAnnotations(filePath, state.annotations);
    }
    renderAnnotationList(filePath);
    applyAnnotations();
  } catch {
    // ignore
  }
}

export function getAnnotations(): Annotation[] {
  return state.annotations;
}

export function getAllAnnotationsFromLocalStorage(): Record<string, Annotation[]> {
  const result: Record<string, Annotation[]> = {};
  const prefix = 'md-viewer:annotations:';
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith(prefix)) continue;
    const filePath = key.slice(prefix.length);
    const annotations = loadAnnotations(filePath);
    if (annotations.length > 0) {
      result[filePath] = annotations;
    }
  }
  return result;
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

function positionForGlobalOffset(root: HTMLElement, offset: number): { node: Text; offset: number } | null {
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
  if (filter === 'all') return !isOrphan;
  if (filter === 'open') return !isResolved(ann) && !isOrphan;
  if (filter === 'resolved') return isResolved(ann) && !isOrphan;
  if (filter === 'orphan') return isOrphan;
  return true;
}

function iconSvg(type: 'up' | 'down' | 'check' | 'trash' | 'comment' | 'list' | 'filter' | 'close'): string {
  if (type === 'up') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 4l4 4H4z"/></svg>';
  if (type === 'down') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 12l-4-4h8z"/></svg>';
  if (type === 'check') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/></svg>';
  if (type === 'trash') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 2h4l1 1h3v1H2V3h3l1-1zm-1 4h1v7H5V6zm3 0h1v7H8V6zm3 0h1v7h-1V6z"/></svg>';
  if (type === 'comment') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2h12v9H8l-3 3v-3H2z"/></svg>';
  if (type === 'list') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3h10v1H3zm0 4h10v1H3zm0 4h10v1H3z"/></svg>';
  if (type === 'filter') return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/></svg>';
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
  el.annotationCount.textContent = String(state.annotations.length);
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
  state.pendingAnnotation = { ...pendingData, note: '', createdAt: Date.now() };
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
  }
}

function openComposerFromPending(x?: number, y?: number): void {
  const el = getElements();
  if (!state.pendingAnnotation || !el.composer || !el.composerNote) return;
  applyTempSelectionMark();
  el.composerNote.value = '';
  const left = typeof x === 'number' ? x : (el.quickAdd ? Number.parseFloat(el.quickAdd.style.left || '0') : 0);
  const top = typeof y === 'number' ? y : (el.quickAdd ? Number.parseFloat(el.quickAdd.style.top || '0') : 0);
  placeFloating(el.composer, left, top + 34);
  el.composer.classList.remove('hidden');
  hideQuickAdd(false);
  el.composerNote.focus();
}

function hideComposer(): void {
  const el = getElements();
  if (!el.composer) return;
  clearTempSelectionMark();
  state.pendingAnnotation = null;
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

function showPopover(ann: Annotation, x: number, y: number): void {
  const el = getElements();
  if (!el.popover || !el.popoverTitle || !el.popoverNote) return;
  const snippet = ann.quote.substring(0, 22);
  el.popoverTitle.textContent = `#${ann.serial || 0} | ${snippet}${ann.quote.length > 22 ? '...' : ''}`;
  el.popoverNote.textContent = ann.note || '（无文字说明）';
  if (el.popoverResolveBtn) {
    el.popoverResolveBtn.title = isResolved(ann) ? '重新打开' : '标记已解决';
    el.popoverResolveBtn.setAttribute('aria-label', isResolved(ann) ? '重新打开' : '标记已解决');
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

  const note = el.composerNote.value.trim();
  const ann: Annotation = {
    ...state.pendingAnnotation,
    serial: nextAnnotationSerial(state.annotations),
    note,
  };

  state.annotations.push(ann);
  saveAnnotations(filePath, state.annotations);
  hideComposer();
  applyAnnotations();
  renderAnnotationList(filePath);
}

export function removeAnnotation(id: string, filePath: string): void {
  state.annotations = state.annotations.filter((a) => a.id !== id);
  saveAnnotations(filePath, state.annotations);
  if (state.pinnedAnnotationId === id) {
    state.pinnedAnnotationId = null;
    hidePopover(true);
  }
  if (state.activeAnnotationId === id) {
    state.activeAnnotationId = null;
  }
  applyAnnotations();
  renderAnnotationList(filePath);
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
  if (ann.status === 'resolved') {
    ann.status = (ann.confidence || 0) <= 0 ? 'unanchored' : 'anchored';
  } else {
    ann.status = 'resolved';
  }
  saveAnnotations(filePath, state.annotations);
  hidePopover(true);
  applyAnnotations();
  renderAnnotationList(filePath);
}

// ==================== 渲染 ====================
function applySingleAnnotation(ann: Annotation): void {
  const el = getElements();
  if (!el.reader) return;
  if (typeof ann.start !== 'number' || typeof ann.length !== 'number' || ann.length <= 0) return;

  const startPos = positionForGlobalOffset(el.reader, ann.start);
  const endPos = positionForGlobalOffset(el.reader, ann.start + ann.length);
  if (!startPos || !endPos) return;
  if (startPos.node === endPos.node && startPos.offset === endPos.offset) return;

  // 同一文本节点
  if (startPos.node === endPos.node) {
    const range = document.createRange();
    range.setStart(startPos.node, startPos.offset);
    range.setEnd(endPos.node, endPos.offset);

    const wrapper = document.createElement('span');
    wrapper.className = 'annotation-mark';
    wrapper.dataset.annotationId = ann.id;

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
      wrapper.className = 'annotation-mark';
      wrapper.dataset.annotationId = ann.id;

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
      const filePath = document.getElementById('content')?.getAttribute('data-current-file');
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

  if (el.reader) {
    const text = getReaderText(el.reader);
    let changed = false;
    for (const ann of state.annotations) {
      const resolved = resolveAnnotationAnchor(text, ann);
      const nextStatus = resolved.status;
      if (ann.start !== resolved.start) {
        ann.start = resolved.start;
        changed = true;
      }
      if (ann.length !== resolved.length) {
        ann.length = resolved.length;
        changed = true;
      }
      const mergedStatus = mergeAnnotationStatus(ann.status, nextStatus);
      if ((ann.status || 'anchored') !== mergedStatus) {
        ann.status = mergedStatus;
        changed = true;
      }
      if (ann.confidence !== resolved.confidence) {
        ann.confidence = resolved.confidence;
        changed = true;
      }
    }

    if (changed) {
      const currentFile = el.content?.getAttribute('data-current-file');
      if (currentFile) {
        saveAnnotations(currentFile, state.annotations);
      }
    }
  }

  const sorted = [...state.annotations]
    .filter((a) => !isResolved(a))
    .filter((a) => (a.status || 'anchored') !== 'unanchored')
    .sort((a, b) => b.start - a.start);
  for (const ann of sorted) {
    applySingleAnnotation(ann);
  }
  attachAnnotationEvents();
}

export function renderAnnotationList(filePath: string | null): void {
  const el = getElements();
  if (!el.annotationList) return;
  updateAnnotationCount();
  updateControlState();

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
    <div class="annotation-item ${state.activeAnnotationId === ann.id ? 'is-active' : ''} status-${getAnchorTrack(ann)}${positioned ? ' positioned' : ''}" data-annotation-id="${ann.id}"${positioned ? ` style="top:${Math.max(0, Math.round(top))}px"` : ''}>
      <div class="annotation-row-top">
        <div class="annotation-row-title">#${ann.serial || index + 1} | ${escapeHtml(ann.quote.substring(0, 28))}${ann.quote.length > 28 ? '...' : ''}</div>
        <div class="annotation-row-actions">
          <button class="annotation-icon-action" data-action="prev" data-id="${ann.id}" title="上一条">${iconSvg('up')}</button>
          <button class="annotation-icon-action" data-action="next" data-id="${ann.id}" title="下一条">${iconSvg('down')}</button>
          <button class="annotation-icon-action resolve" data-action="resolve" data-id="${ann.id}" title="${isResolved(ann) ? '重新打开' : '标记已解决'}">${iconSvg('check')}</button>
          <button class="annotation-icon-action danger" data-action="delete" data-id="${ann.id}" title="删除">${iconSvg('trash')}</button>
        </div>
      </div>
      <div class="annotation-note ${state.density === 'simple' ? 'simple' : ''}">${ann.note || '（无文字说明）'}</div>
      ${getAnchorTrack(ann) === 'orphan' ? '<div class="annotation-note" style="color:#cf222e;">定位失败：原文已变化，请手动确认。</div>' : ''}
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
  if (!filePath || !el.reader) return;

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
  void migrateLegacyAnnotationsOnce();
  initAnnotationSidebarWidth();
  setSidebarCollapsed(true);

  // 绑定全局事件
  document.getElementById('composerSaveBtn')?.addEventListener('click', () => {
    const contentEl = document.getElementById('content');
    const filePath = contentEl?.getAttribute('data-current-file');
    if (filePath) savePendingAnnotation(filePath);
  });

  document.getElementById('composerCancelBtn')?.addEventListener('click', hideComposer);
  getElements().composerNote?.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    if (!(event.metaKey || event.ctrlKey)) return;
    event.preventDefault();
    const contentEl = document.getElementById('content');
    const filePath = contentEl?.getAttribute('data-current-file');
    if (filePath) savePendingAnnotation(filePath);
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
    const contentEl = document.getElementById('content');
    const filePath = contentEl?.getAttribute('data-current-file');
    const id = state.pinnedAnnotationId;
    if (id && filePath) removeAnnotation(id, filePath);
  });

  document.getElementById('popoverResolveBtn')?.addEventListener('click', () => {
    const contentEl = document.getElementById('content');
    const filePath = contentEl?.getAttribute('data-current-file');
    const id = state.pinnedAnnotationId;
    if (id && filePath) toggleResolved(id, filePath);
  });
  document.getElementById('popoverPrevBtn')?.addEventListener('click', () => {
    const contentEl = document.getElementById('content');
    const filePath = contentEl?.getAttribute('data-current-file');
    const id = state.pinnedAnnotationId;
    if (id && filePath) jumpToRelative(id, -1, filePath);
  });
  document.getElementById('popoverNextBtn')?.addEventListener('click', () => {
    const contentEl = document.getElementById('content');
    const filePath = contentEl?.getAttribute('data-current-file');
    const id = state.pinnedAnnotationId;
    if (id && filePath) jumpToRelative(id, 1, filePath);
  });

  getElements().filterMenu?.querySelectorAll('.annotation-filter-item[data-filter]').forEach((node) => {
    node.addEventListener('click', () => {
      const next = (node as HTMLElement).getAttribute('data-filter') as AnnotationFilter | null;
      if (!next) return;
      state.filter = next;
      getElements().filterMenu?.classList.add('hidden');
      const currentFile = document.getElementById('content')?.getAttribute('data-current-file');
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
    const currentFile = document.getElementById('content')?.getAttribute('data-current-file');
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
    hideQuickAdd(true);
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

    if (
      els.composer &&
      !els.composer.contains(target) &&
      !(els.quickAdd && els.quickAdd.contains(target))
    ) {
      hideComposer();
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

async function migrateLegacyAnnotationsOnce(): Promise<void> {
  const migrationKey = 'md-viewer:annotation-migrated-v1';
  if (localStorage.getItem(migrationKey) === 'true') return;

  const byPath = getAllAnnotationsFromLocalStorage();
  if (Object.keys(byPath).length === 0) {
    localStorage.setItem(migrationKey, 'true');
    return;
  }

  try {
    await migrateAnnotationsRemote(byPath);
    localStorage.setItem(migrationKey, 'true');
  } catch {
    // 保持可重试，不设置迁移完成标记
  }
}
