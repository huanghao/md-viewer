/**
 * Annotation DOM rendering pipeline.
 * Extracted from annotation.ts — pure code move, zero logic changes.
 *
 * Depends on:
 *   - annotation-state (state, types, mergeAnnotationStatus)
 *   - annotation-layout (getElements)
 *   - annotation/query (isResolvedAnn, getAnchorTrack, getVisibleAnnotations)
 *   - utils/text-node-index (collectTextNodes, buildTextNodeIndex, TextNodeIndex)
 *   - annotation/position (positionForGlobalOffset, getReaderText)
 *   - utils/annotation-anchor (resolveAnnotationAnchor)
 *   - annotation-status (isOpen, AnnotationStatus)
 *   - state (adjustAnnotationCount)
 *
 * Does NOT import from annotation.ts (would be circular).
 * Functions that live in annotation.ts and are needed here are injected via
 * registerRenderingCallbacks().
 */

import { collectTextNodes, buildTextNodeIndex, type TextNodeIndex } from './utils/text-node-index';
import { positionForGlobalOffset, getReaderText } from './annotation/position';
import { isResolvedAnn, getAnchorTrack, getVisibleAnnotations as getVisibleAnnotationsUtil } from './annotation/query';
import { resolveAnnotationAnchor } from './utils/annotation-anchor';
import { isOpen, type AnnotationStatus } from '../annotation-status';
import { adjustAnnotationCount } from './state';
import { getElements } from './annotation-layout';
import {
  type Annotation,
  state,
  mergeAnnotationStatus,
} from './annotation-state';

// ==================== 依赖注入 ====================
// Functions that live in annotation.ts are injected here to avoid circular deps.

interface RenderingCallbacks {
  persistAnnotations: (filePath: string, annotations: Annotation[], errorPrefix?: string) => void;
  showPopover: (ann: Annotation, x: number, y: number) => void;
  hidePopover: (force?: boolean) => void;
  renderAnnotationList: (filePath: string | null) => void;
}

let _callbacks: RenderingCallbacks | null = null;

export function registerRenderingCallbacks(callbacks: RenderingCallbacks): void {
  _callbacks = callbacks;
}

// ==================== 内部辅助 ====================

function getActiveAnnotationFilePath(): string | null {
  const currentFilePath = state.currentFilePath;
  const renderedFilePath = document.getElementById('content')?.getAttribute('data-current-file') || null;
  if (!currentFilePath) return null;
  if (!renderedFilePath) return currentFilePath;
  return renderedFilePath === currentFilePath ? currentFilePath : null;
}

// ==================== 渲染 ====================

function decorateMark(wrapper: HTMLElement, ann: Annotation): void {
  wrapper.classList.add('annotation-mark');
  wrapper.dataset.annotationId = ann.id;
  wrapper.classList.add(`status-${getAnchorTrack(ann)}`);
  if (isResolvedAnn(ann)) {
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
        _callbacks?.hidePopover(true);
        return;
      }
      state.activeAnnotationId = id;
      state.pinnedAnnotationId = id;
      const rect = markEl.getBoundingClientRect();
      _callbacks?.showPopover(ann, rect.right + 8, rect.top + 8);
      const filePath = getActiveAnnotationFilePath();
      _callbacks?.renderAnnotationList(filePath || null);
    });
  });
}

export function clearRenderedMarks(): void {
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
    ? buildTextNodeIndex(collectTextNodes(el.reader, '.katex'))
    : undefined;

  if (el.reader) {
    // 从索引直接拼接文本，避免第二次 TreeWalker
    const text = index
      ? index.nodes.map((n) => n.nodeValue || '').join('')
      : getReaderText(el.reader);

    let changed = false;
    const changedAnnotations: Annotation[] = [];
    const currentFile = getActiveAnnotationFilePath();
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
      const prevStatus = ann.status || 'anchored';
      const mergedStatus = mergeAnnotationStatus(ann.status, nextStatus);
      if (prevStatus !== mergedStatus) {
        ann.status = mergedStatus;
        changed = true;
        annChanged = true;
        // 同步 badge 计数：anchored ↔ unanchored 转变
        if (currentFile) {
          if (isOpen(prevStatus as AnnotationStatus) && !isOpen(mergedStatus as AnnotationStatus)) {
            adjustAnnotationCount(currentFile, -1);
          } else if (!isOpen(prevStatus as AnnotationStatus) && isOpen(mergedStatus as AnnotationStatus)) {
            adjustAnnotationCount(currentFile, +1);
          }
        }
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
      if (currentFile) {
        _callbacks?.persistAnnotations(currentFile, changedAnnotations, '同步评论锚点失败');
      }
    }
  }

  const sorted = [...getVisibleAnnotationsUtil(state.annotations, state.filter, state.includeUnanchored)]
    .sort((a, b) => b.start - a.start);
  for (const ann of sorted) {
    applySingleAnnotation(ann, index);
  }
  attachAnnotationEvents();
}
