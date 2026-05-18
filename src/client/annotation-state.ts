/**
 * Annotation state, types, and pure data logic.
 * No imports from annotation.ts (avoids circular deps).
 */

import { storageGet } from './utils/storage';

// ==================== 类型定义 ====================
export interface Annotation {
  id: string;
  serial?: number;
  start: number;
  length: number;
  quote: string;
  /** Original selection text for display; may include KaTeX chars absent in quote. */
  displayQuote?: string;
  note: string;
  createdAt: number;
  quotePrefix?: string;
  quoteSuffix?: string;
  status?: 'anchored' | 'unanchored' | 'resolved';
  confidence?: number;
  thread?: AnnotationThreadItem[];
  /** PDF only: bounding box in PDF coordinate system (pt, unscaled) */
  rectCoords?: { x1: number; y1: number; x2: number; y2: number };
}

export interface AnnotationThreadItem {
  id: string;
  type: 'comment' | 'reply';
  note: string;
  createdAt: number;
}

export type AnnotationFilter = 'all' | 'open' | 'resolved' | 'unanchored';
export type AnnotationDensity = 'default' | 'simple';
export const ANNOTATION_WIDTH_KEY = 'md-viewer:annotation-sidebar-width';
export const ANNOTATION_WIDTH_DEFAULT = 320;
export const ANNOTATION_WIDTH_MIN = 260;
export const ANNOTATION_WIDTH_MAX = 540;

export interface AnnotationState {
  annotations: Annotation[];
  pendingAnnotation: Annotation | null;
  pendingAnnotationFilePath: string | null;
  pinnedAnnotationId: string | null;
  activeAnnotationId: string | null;
  currentFilePath: string | null;
  filter: AnnotationFilter;
  includeUnanchored: boolean; // 「打开」filter 下是否同时显示失锚评论
  density: AnnotationDensity;
}

export function getInitialDensity(): AnnotationDensity {
  if (typeof localStorage === 'undefined') return 'default';
  return storageGet<string>('md-viewer:annotation-density', 'default') === 'simple' ? 'simple' : 'default';
}

// ==================== 状态管理 ====================
export const state: AnnotationState = {
  annotations: [],
  pendingAnnotation: null,
  pendingAnnotationFilePath: null,
  pinnedAnnotationId: null,
  activeAnnotationId: null,
  currentFilePath: null,
  filter: 'open',
  includeUnanchored: typeof localStorage !== 'undefined'
    ? storageGet<boolean>('md-viewer:annotation-include-unanchored', true)
    : true,
  density: getInitialDensity(),
};

export let _lastQuickAddX = 0;
export let _lastQuickAddY = 0;
export let _quickComments: string[] = [];

export function setLastQuickAddPosition(x: number, y: number): void {
  _lastQuickAddX = x;
  _lastQuickAddY = y;
}

export function setQuickComments(items: string[]): void {
  _quickComments = items;
}

export function getLastQuickAddPosition(): { x: number; y: number } {
  return { x: _lastQuickAddX, y: _lastQuickAddY };
}

export function nextAnnotationSerial(annotations: Annotation[]): number {
  const maxSerial = annotations.reduce((max, ann) => {
    if (typeof ann.serial !== 'number' || !Number.isFinite(ann.serial)) return max;
    return Math.max(max, ann.serial);
  }, 0);
  return maxSerial + 1;
}

export function normalizeThread(annotation: Annotation): AnnotationThreadItem[] {
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

export function ensureAnnotationThread(annotation: Annotation): boolean {
  const nextThread = normalizeThread(annotation);
  const prev = JSON.stringify(annotation.thread || []);
  const next = JSON.stringify(nextThread);
  annotation.thread = nextThread;
  annotation.note = nextThread[0]?.note || annotation.note || '';
  return prev !== next;
}

export function ensureAnnotationThreads(annotations: Annotation[]): boolean {
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

export function replaceAnnotationInState(next: Annotation): void {
  const index = state.annotations.findIndex((item) => item.id === next.id);
  if (index >= 0) {
    state.annotations[index] = next;
    return;
  }
  state.annotations.push(next);
}

export function mergeAnnotationStatus(
  currentStatus: Annotation['status'] | undefined,
  resolvedStatus: 'anchored' | 'unanchored',
): Annotation['status'] {
  if (currentStatus === 'resolved') return 'resolved';
  return resolvedStatus;
}

export function getAnnotations(): Annotation[] {
  return state.annotations;
}

export function getAnnotationCurrentFilePath(): string | null {
  return state.currentFilePath;
}
