/**
 * Annotation sidebar layout and DOM element cache.
 * No imports from annotation.ts (avoids circular deps).
 */

import {
  state,
  ANNOTATION_WIDTH_KEY,
  ANNOTATION_WIDTH_DEFAULT,
  ANNOTATION_WIDTH_MIN,
  ANNOTATION_WIDTH_MAX,
} from './annotation-state';
import { storageGet, storageSet, storageGetNumber } from './utils/storage';

// ==================== DOM 元素引用 ====================
function queryAnnotationElements() {
  return {
    sidebar: document.getElementById('annotationSidebar'),
    sidebarResizer: document.getElementById('annotationSidebarResizer'),
    reader: document.getElementById('reader'),
    content: document.getElementById('content'),
    composer: document.getElementById('annotationComposer'),
    composerHeader: document.getElementById('annotationComposerHeader'),
    composerNote: document.getElementById('composerNote') as HTMLTextAreaElement | null,
    quickAddWrap: document.getElementById('annotationQuickAddWrap') as HTMLElement | null,
    quickAddComment: document.getElementById('quickAddComment') as HTMLButtonElement | null,
    quickAddTodo: document.getElementById('quickAddTodo') as HTMLButtonElement | null,
    popover: document.getElementById('annotationPopover'),
    popoverTitle: document.getElementById('popoverTitle'),
    popoverNote: document.getElementById('popoverNote'),
    popoverResolveBtn: document.getElementById('popoverResolveBtn') as HTMLButtonElement | null,
    popoverPrevBtn: document.getElementById('popoverPrevBtn') as HTMLButtonElement | null,
    popoverNextBtn: document.getElementById('popoverNextBtn') as HTMLButtonElement | null,
    annotationList: document.getElementById('annotationList'),
    filterMenu: document.getElementById('annotationFilterMenu'),
    filterToggle: document.getElementById('annotationFilterToggle'),
    densityToggle: document.getElementById('annotationDensityToggle'),
    closeToggle: document.getElementById('annotationSidebarClose'),
    floatingOpenBtn: document.getElementById('annotationFloatingOpenBtn'),
  };
}

type AnnotationElements = ReturnType<typeof queryAnnotationElements>;
let _cachedElements: AnnotationElements | null = null;

export function getElements(): AnnotationElements {
  return _cachedElements ??= queryAnnotationElements();
}

export function invalidateAnnotationElementsCache(): void {
  _cachedElements = null;
}

// ==================== Collapse side-effects callback ====================
// Registered by annotation.ts to call hideQuickAdd(true) + hidePopover(true)
// when the sidebar collapses, without creating a circular dependency.
let _onCollapse: (() => void) | null = null;

export function registerCollapseCallback(cb: () => void): void {
  _onCollapse = cb;
}

// ==================== 持久化 ====================

const ANNOTATION_PANEL_OPEN_KEY = 'md-viewer:annotation-panel-open';

export function loadAnnotationPanelOpen(): boolean {
  // Default: closed (only open if explicitly saved as '1')
  return storageGet<string>(ANNOTATION_PANEL_OPEN_KEY, '0') === '1';
}

export function persistCurrentFilePanelOpen(opened: boolean): void {
  storageSet(ANNOTATION_PANEL_OPEN_KEY, opened ? '1' : '0');
}

export function clampSidebarWidth(width: number): number {
  return Math.max(ANNOTATION_WIDTH_MIN, Math.min(ANNOTATION_WIDTH_MAX, Math.round(width)));
}

export function setAnnotationSidebarWidth(width: number): void {
  const clamped = clampSidebarWidth(width);
  document.documentElement.style.setProperty('--annotation-sidebar-width', `${clamped}px`);
  storageSet(ANNOTATION_WIDTH_KEY, clamped);
}

export function initAnnotationSidebarWidth(): void {
  const width = storageGetNumber(ANNOTATION_WIDTH_KEY, ANNOTATION_WIDTH_DEFAULT);
  setAnnotationSidebarWidth(width > 0 ? width : ANNOTATION_WIDTH_DEFAULT);
}

// ==================== 折叠/展开 ====================

export function setSidebarCollapsed(collapsed: boolean): void {
  const el = getElements();
  if (!el.sidebar) return;
  el.sidebar.classList.toggle('collapsed', collapsed);
  document.body.classList.toggle('annotation-sidebar-collapsed', collapsed);
  if (collapsed) {
    el.filterMenu?.classList.add('hidden');
    _onCollapse?.();
  }
}

// ==================== 布局同步 ====================

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

// ==================== 开/关 API ====================

export function openAnnotationSidebar(): void {
  setSidebarCollapsed(false);
  persistCurrentFilePanelOpen(true);
  syncAnnotationSidebarLayout();
  syncAnnotationScrollWithContent();
  import('./ui/todo-panel').then(m => m.updateTodoTabCount());
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

// ==================== 滚动同步 ====================

export function syncAnnotationScrollWithContent(): void {
  if (state.density !== 'default') return;
  const content = document.getElementById('content');
  const list = document.getElementById('annotationList');
  if (!content || !list) return;
  list.scrollTop = content.scrollTop;
}
