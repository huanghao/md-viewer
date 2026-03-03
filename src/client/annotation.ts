/**
 * 圈点批注功能模块
 */

import { escapeHtml } from './utils/escape';

// ==================== 类型定义 ====================
export interface Annotation {
  id: string;
  start: number;
  length: number;
  quote: string;
  note: string;
  createdAt: number;
}

interface AnnotationState {
  annotations: Annotation[];
  pendingAnnotation: Annotation | null;
  pinnedAnnotationId: string | null;
}

// ==================== 状态管理 ====================
const state: AnnotationState = {
  annotations: [],
  pendingAnnotation: null,
  pinnedAnnotationId: null,
};

function getStorageKey(filePath: string): string {
  return `md-viewer:annotations:${filePath}`;
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
}

export function setAnnotations(filePath: string | null): void {
  if (filePath) {
    state.annotations = loadAnnotations(filePath);
  } else {
    state.annotations = [];
  }
  state.pinnedAnnotationId = null;
  state.pendingAnnotation = null;
  hideComposer();
  hidePopover(true);
}

export function getAnnotations(): Annotation[] {
  return state.annotations;
}

// ==================== DOM 元素引用 ====================
function getElements() {
  return {
    reader: document.getElementById('reader'),
    content: document.getElementById('content'),
    composer: document.getElementById('annotationComposer'),
    composerQuote: document.getElementById('composerQuote'),
    composerNote: document.getElementById('composerNote') as HTMLTextAreaElement | null,
    popover: document.getElementById('annotationPopover'),
    popoverQuote: document.getElementById('popoverQuote'),
    popoverNote: document.getElementById('popoverNote'),
    annotationList: document.getElementById('annotationList'),
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

// ==================== UI 操作 ====================
function showComposer(x: number, y: number, quote: string, pendingData: Omit<Annotation, 'note' | 'createdAt'>): void {
  const el = getElements();
  if (!el.composer || !el.composerQuote || !el.composerNote) return;

  state.pendingAnnotation = { ...pendingData, note: '', createdAt: Date.now() };
  el.composerQuote.textContent = `「${quote}」`;
  el.composerNote.value = '';
  placeFloating(el.composer, x, y);
  el.composer.classList.remove('hidden');
  el.composerNote.focus();
}

function hideComposer(): void {
  const el = getElements();
  if (!el.composer) return;
  state.pendingAnnotation = null;
  el.composer.classList.add('hidden');
}

function showPopover(ann: Annotation, x: number, y: number): void {
  const el = getElements();
  if (!el.popover || !el.popoverQuote || !el.popoverNote) return;

  el.popoverQuote.textContent = `「${ann.quote}」`;
  el.popoverNote.textContent = ann.note || '（无文字说明）';
  placeFloating(el.popover, x, y);
  el.popover.classList.remove('hidden');
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

// ==================== 批注操作 ====================
export function savePendingAnnotation(filePath: string): void {
  const el = getElements();
  if (!state.pendingAnnotation || !el.composerNote) return;

  const note = el.composerNote.value.trim();
  const ann: Annotation = {
    ...state.pendingAnnotation,
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
  applyAnnotations();
  renderAnnotationList(filePath);
}

function jumpToAnnotation(id: string): void {
  const el = getElements();
  if (!el.content) return;
  const mark = document.querySelector(`[data-annotation-id="${id}"]`) as HTMLElement | null;
  if (mark) {
    el.content.scrollTo({ top: Math.max(0, mark.offsetTop - 24), behavior: 'smooth' });
  }
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

  el.reader.querySelectorAll('.annotation-mark').forEach((el) => {
    const id = el.getAttribute('data-annotation-id');
    const ann = state.annotations.find((a) => a.id === id);
    if (!ann) return;

    el.addEventListener('click', (event) => {
      event.stopPropagation();
      if (state.pinnedAnnotationId === id) {
        state.pinnedAnnotationId = null;
        hidePopover(true);
        return;
      }
      state.pinnedAnnotationId = id;
      const rect = el.getBoundingClientRect();
      showPopover(ann, rect.right + 8, rect.top + 8);
    });
  });
}

export function applyAnnotations(): void {
  const sorted = [...state.annotations].sort((a, b) => b.start - a.start);
  for (const ann of sorted) {
    applySingleAnnotation(ann);
  }
  attachAnnotationEvents();
}

export function renderAnnotationList(filePath: string | null): void {
  const el = getElements();
  if (!el.annotationList) return;

  if (!filePath || state.annotations.length === 0) {
    el.annotationList.innerHTML = '<div class="annotation-empty">无批注（选中文本即可添加）</div>';
    return;
  }

  const sorted = [...state.annotations].sort((a, b) => a.start - b.start);
  el.annotationList.innerHTML = sorted
    .map(
      (ann) => `
    <div class="annotation-item" data-annotation-id="${ann.id}">
      <div class="annotation-quote">「${escapeHtml(ann.quote.substring(0, 100))}${ann.quote.length > 100 ? '...' : ''}」</div>
      <div class="annotation-note">${ann.note || '（无文字说明）'}</div>
      <div class="annotation-actions">
        <button class="annotation-btn" data-action="jump" data-id="${ann.id}">定位</button>
        <button class="annotation-btn annotation-btn-danger" data-action="delete" data-id="${ann.id}">删除</button>
      </div>
    </div>
  `
    )
    .join('');

  el.annotationList.querySelectorAll('.annotation-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget as HTMLElement;
      const action = target.getAttribute('data-action');
      const id = target.getAttribute('data-id');
      if (!id || !filePath) return;

      if (action === 'jump') {
        jumpToAnnotation(id);
      } else if (action === 'delete') {
        removeAnnotation(id, filePath);
      }
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

  const rect = range.getBoundingClientRect();
  showComposer(rect.left, rect.bottom + 8, quote, {
    id: `ann-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    start,
    length: end - start,
    quote,
  });

  selection.removeAllRanges();
}

// ==================== 初始化 ====================
export function initAnnotationElements(): void {
  // 绑定全局事件
  document.getElementById('composerSaveBtn')?.addEventListener('click', () => {
    const contentEl = document.getElementById('content');
    const filePath = contentEl?.getAttribute('data-current-file');
    if (filePath) savePendingAnnotation(filePath);
  });

  document.getElementById('composerCancelBtn')?.addEventListener('click', hideComposer);

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

  document.addEventListener('mousedown', (event) => {
    const target = event.target as Node;
    const els = getElements();

    if (els.composer && !els.composer.contains(target)) {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) hideComposer();
    }

    if (
      els.popover &&
      !els.popover.contains(target) &&
      !(target as HTMLElement).closest('.annotation-mark')
    ) {
      state.pinnedAnnotationId = null;
      hidePopover(true);
    }
  });
}
