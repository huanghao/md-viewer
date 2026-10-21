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

// HTML 文件走 Shadow DOM 挂载时，#reader 在 shadow root 内部，
// document.getElementById 找不到，需要先定位宿主元素再穿透进去。
export const HTML_READER_HOST_ID = 'html-reader-host';

export function resolveReaderElement(): HTMLElement | null {
  const direct = document.getElementById('reader');
  if (direct) return direct;
  const host = document.getElementById(HTML_READER_HOST_ID);
  return (host?.shadowRoot?.getElementById('reader') as HTMLElement | null) ?? null;
}

function queryAnnotationElements() {
  return {
    sidebar: document.getElementById('annotationSidebar'),
    sidebarResizer: document.getElementById('annotationSidebarResizer'),
    reader: resolveReaderElement(),
    content: document.getElementById('content'),
    composer: document.getElementById('annotationComposer'),
    composerHeader: document.getElementById('annotationComposerHeader'),
    composerNote: document.getElementById('composerNote') as HTMLTextAreaElement | null,
    quickAddWrap: document.getElementById('annotationQuickAddWrap') as HTMLElement | null,
    quickAddComment: document.getElementById('quickAddComment') as HTMLButtonElement | null,
    quickAddTray: document.getElementById('quickAddTray') as HTMLButtonElement | null,
    agentTrayComposer: document.getElementById('agentTrayComposer') as HTMLElement | null,
    agentTrayComposerHeader: document.getElementById('agentTrayComposerHeader') as HTMLElement | null,
    agentTrayComposerNote: document.getElementById('agentTrayComposerNote') as HTMLTextAreaElement | null,
    agentTrayComposerSaveBtn: document.getElementById('agentTrayComposerSaveBtn') as HTMLButtonElement | null,
    agentTrayComposerCancelBtn: document.getElementById('agentTrayComposerCancelBtn') as HTMLButtonElement | null,
    popover: document.getElementById('annotationPopover'),
    popoverHeader: document.getElementById('annotationPopoverHeader'),
    popoverTitle: document.getElementById('popoverTitle'),
    popoverNote: document.getElementById('popoverNote'),
    popoverResolveBtn: document.getElementById('popoverResolveBtn') as HTMLButtonElement | null,
    popoverPrevBtn: document.getElementById('popoverPrevBtn') as HTMLButtonElement | null,
    popoverNextBtn: document.getElementById('popoverNextBtn') as HTMLButtonElement | null,
    annotationList: document.getElementById('annotationList'),
    filterMenu: document.getElementById('annotationFilterMenu'),
    filterToggle: document.getElementById('annotationFilterToggle'),
    densityToggle: document.getElementById('annotationDensityToggle'),
    resolveAllBtn: document.getElementById('annotationResolveAllBtn'),
    agentTab: document.getElementById('annotationAgentTab'),
    agentModelMenuButton: document.getElementById('agentModelMenuButton') as HTMLButtonElement | null,
    agentModelMenu: document.getElementById('agentModelMenu') as HTMLElement | null,
    agentEngineSelect: document.getElementById('agentEngineSelect') as HTMLSelectElement | null,
    agentModelInput: document.getElementById('agentModelInput') as HTMLSelectElement | null,
    agentThinkingSection: document.getElementById('agentThinkingSection') as HTMLElement | null,
    agentChatStats: document.getElementById('agentChatStats'),
    agentThinkingLevel: document.getElementById('agentThinkingLevel') as HTMLSelectElement | null,
    agentSessionMenuButton: document.getElementById('agentSessionMenuButton') as HTMLButtonElement | null,
    agentSessionMenu: document.getElementById('agentSessionMenu') as HTMLElement | null,
    agentSessionList: document.getElementById('agentSessionList') as HTMLElement | null,
    agentNewSessionBtn: document.getElementById('agentNewSessionBtn') as HTMLButtonElement | null,
    agentChatMessages: document.getElementById('agentChatMessages'),
    agentChatInput: document.getElementById('agentChatInput') as HTMLTextAreaElement | null,
    agentChatSendBtn: document.getElementById('agentChatSendBtn') as HTMLButtonElement | null,
    agentChatChips: document.getElementById('agentChatChips') as HTMLElement | null,
    agentMdvBtn: document.getElementById('agentMdvBtn') as HTMLButtonElement | null,
    agentChatStatus: document.getElementById('agentChatStatus'),
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
  const statusbarHeight = (document.getElementById('statusbar')?.offsetHeight ?? 22);
  const height = Math.max(0, window.innerHeight - topOffset - statusbarHeight);
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
