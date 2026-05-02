// 导入类型
import type { FileData } from './types';
import {
  initMemoryMonitor,
  switchMonitorTab,
  toggleMonitorPanel,
  type PdfViewerEntry,
} from './memory-monitor';

import {
  initContentRenderer,
  renderContent,
  renderBreadcrumb,
  flashContentUpdated,
  showNearbyMenu,
  renderMath,
  isHtmlPath,
  isJsonPath,
  isPdfPath,
} from './content-renderer';

import {
  initFileSwitcher,
  switchFile,
  removeFileHandler,
  navigateFileInView,
  cycleTab,
  jumpToTab,
  searchFilesHandler,
  setupDragAndDrop,
  handleURLParams,
  looksLikePathInput,
  clearAddConfirm,
  isAddConfirmVisible,
  showAddConfirm,
  addFileByPath,
  handleSmartAddInput,
  openFileInBrowser,
  getWorkspaceNameFromPath,
} from './file-switcher';

// 导入状态管理
import { state, saveState, restoreState, addOrUpdateFile, markFileMissing, markWorkspaceFailed } from './state';
import { hydrateExpandedWorkspaces, scanWorkspace, revealFileInWorkspace } from './workspace';

// 导入 API
import { loadFile } from './api/files';

// 导入工具函数
import { resolveMarkdownLinkPath } from './utils/md-link';

// 导入 UI 组件
import { renderSidebar, initTabsActions, initFileListActions, initWorkspaceActions, initSearchBoxCallbacks, toggleTabManager, applyTabBatchAction } from './ui/sidebar';
import { initToolbarActions } from './main-actions';
import { setRagCallbacks } from './ui/rag-search-panel';
import { showSuccess, showError } from './ui/toast';
import { showPreferences, closePreferences } from './ui/preferences';
import { toggleShortcutsHelp, hideShortcutsHelp, isShortcutsHelpVisible } from './ui/shortcuts-help';
import { registerAction, initDispatcher } from './keybindings';
import { initQuickOpen, showQuickOpen, hideQuickOpen } from './ui/quick-open';
import { initChatPanel } from './ui/chat-panel.js';

import { getMdThemeCss, getHlThemeCss } from './themes/index';

import { fetchAnnotationSummaries } from './api/annotations';
import { setAnnotationSummaries } from './state';

// 导入批注功能
import {
  initAnnotationElements,
  invalidateAnnotationElementsCache,
  applyAnnotations,
  renderAnnotationList,
  handleSelectionForAnnotation,
  setAnnotations,
  getAnnotationCurrentFilePath,
  syncAnnotationSidebarLayout,
  dismissAnnotationPopupByEscape,
  setPendingAnnotation,
  getAnnotations,
  switchAnnotationTab,
  openComposerFromPending,
  openAnnotationSidebar,
} from './annotation';

import { initTodoPanel, initTodoExternalCallbacks } from './ui/todo-panel';

import { createPdfAnnotationBridge } from "./pdf-annotation.js";
import { currentPdfViewer, setCurrentPdfViewer, setPdfDefaultScale } from './pdf-state';
import {
  initTocManager,
  updateToc,
  setupTocOpenBtn,
  initTocPaneHeight,
  setupTocResize,
} from './toc-manager';
import { storageSet } from './utils/storage';
import { flushAll as flushUndoQueue } from './utils/undo-queue';
import { initSSEConnection, connectSSE } from './sse-connection';
import { setupFindBar } from './find-bar';
// // import { setupKeyboardShortcuts } from './keyboard-shortcuts'; // migrated to keybindings.ts // migrated to keybindings.ts
import { initZoom, zoomIn, zoomOut, setZoomFromInput, updateZoomDisplay } from './zoom-controller';
import { handleTranslateButtonClick } from './translation';
import {
  initDiffView,
  getDiffViewActive, setDiffViewActive,
  handleDiffButtonClick,
  navigateDiffBlock,
} from './diff-view';
import { initBrowsingSignals, resetDwellOnFileSwitch } from './utils/browsing-signals';

// Re-export sidebar layout utilities for init.ts and other consumers
export {
  SIDEBAR_WIDTH_STORAGE_KEY,
  SIDEBAR_DEFAULT_WIDTH,
  SIDEBAR_MIN_WIDTH,
  SIDEBAR_MAX_WIDTH,
  getMaxSidebarWidth,
  clampSidebarWidth,
  applySidebarWidth,
  initSidebarWidth,
  setSidebarCollapsed,
  initSidebarCollapsed,
  setupSidebarCollapse,
  setupSidebarResize,
} from './ui/sidebar-layout';

// Re-export clipboard utilities for init.ts and other consumers
export {
  resolveCopyFeedbackTarget,
  applyCopyFeedback,
  copyTextWithFeedback,
  copySingleText,
  copyFilePath,
  copyRelativePath,
  copyAbsolutePath,
  copyFileName,
} from './utils/clipboard';

declare global {
  function cleanupAllExpiredRecords(): number;
}

// Module-level variables for internal function references
export let _resetDwell: (() => void) | null = null;
export let _setPendingAnnotation: ((ann: any, filePath: string, x: number, y: number) => void) | null = null;
export function set_setPendingAnnotation(fn: ((ann: any, filePath: string, x: number, y: number) => void) | null) { _setPendingAnnotation = fn; }

export function applyTheme(): void {
  const mdCss = getMdThemeCss(state.config.markdownTheme || 'github');
  const hlCss = getHlThemeCss(state.config.codeTheme || 'github');

  const mdStyle = document.getElementById('theme-md-css');
  const hlStyle = document.getElementById('theme-hl-css');

  if (mdStyle) mdStyle.textContent = mdCss;
  if (hlStyle) hlStyle.textContent = hlCss;
}

export const PDF_MODE_KEY = 'md-viewer:pdf-mode';
const fileRefreshSeq = new Map<string, number>();
export let workspacePollRunning = false;
export const currentPdfBridgeRef = { value: null as ReturnType<typeof createPdfAnnotationBridge> | null };

// PDF viewer registry: tracks all open PDF viewers and their idle timers
export const PDF_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const pdfViewerRegistry = new Map<string, PdfViewerEntry>();

export function applyPdfModeButtons(mode: 'select' | 'annotate'): void {
  const isAnnotate = mode === 'annotate';
  const selectBtn = document.getElementById('pdfModeSelectBtn');
  const annotateBtn = document.getElementById('pdfModeAnnotateBtn');
  if (selectBtn) selectBtn.classList.toggle('is-active', !isAnnotate);
  if (annotateBtn) annotateBtn.classList.toggle('is-active', isAnnotate);
}

export function setPdfMode(mode: 'select' | 'annotate'): void {
  const nextMode = mode === 'annotate' ? 'annotate' : 'select';
  storageSet(PDF_MODE_KEY, nextMode);
  currentPdfViewer?.setAnnotateMode(nextMode === 'annotate');
  applyPdfModeButtons(nextMode);
}

export function evictPdfViewer(filePath: string): void {
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) clearTimeout(entry.idleTimer);
  entry.viewer.destroy();
  if (currentPdfViewer === entry.viewer) {
    setCurrentPdfViewer(null);
  }
  pdfViewerRegistry.delete(filePath);
}

export function scheduleEviction(filePath: string): void {
  if (!state.config.pdfIdleEviction) return;
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) clearTimeout(entry.idleTimer);
  entry.idleTimer = setTimeout(() => evictPdfViewer(filePath), PDF_IDLE_TIMEOUT_MS);
}

export function cancelEviction(filePath: string): void {
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) {
    clearTimeout(entry.idleTimer);
    entry.idleTimer = null;
  }
  entry.lastActiveAt = Date.now();
}

export function syncAnnotationsForCurrentFile(force = false): void {
  const nextPath = state.currentFile && !isHtmlPath(state.currentFile) ? state.currentFile : null; // HTML 文件不支持批注
  const currentAnnotationFilePath = getAnnotationCurrentFilePath();
  if (force || nextPath !== currentAnnotationFilePath) {
    setAnnotations(nextPath);
  }
  // 重新应用批注到当前正文，避免文件切换后残留上一个文件的高亮/状态。
  applyAnnotations();
  renderAnnotationList(nextPath);
}

// ==================== 消息处理 ====================
export async function onFileLoaded(data: FileData, focus: boolean = false) {
  const previousFile = state.currentFile;
  const shouldFocus = focus;
  addOrUpdateFile(data, shouldFocus);
  if (shouldFocus && (state.config.sidebarTab === 'focus' || state.config.sidebarTab === 'full')) {
    await revealFileInWorkspace(data.path);
  }
  if (shouldFocus && previousFile !== data.path) {
  }
  renderSidebar();
  renderContent();
  syncAnnotationsForCurrentFile(shouldFocus && previousFile !== data.path);
  if (shouldFocus) {
    updateToc(data.path);
    updateZoomDisplay(true);
  }
}

export function scrollContentToTop(): void {
  const container = document.getElementById('content');
  if (!container) return;
  container.scrollTo({ top: 0, behavior: 'auto' });
}

// 刷新当前文件（页面加载时自动调用）
export async function refreshCurrentFile() {
  if (!state.currentFile) return;
  await syncFileFromDisk(state.currentFile, { silent: true, highlight: false });
}

// 手动刷新文件（用户点击刷新按钮）
export async function refreshFile(path: string) {
  const updated = await syncFileFromDisk(path, { silent: false, highlight: true });
  if (updated && state.currentFile === path) {
    showSuccess('文件已刷新', 2000);
  }
}

async function syncFileFromDisk(
  path: string,
  options: { silent?: boolean; highlight?: boolean } = {}
): Promise<boolean> {
  const file = state.sessionFiles.get(path);
  if (!file || file.isMissing) return false;

  const nextSeq = (fileRefreshSeq.get(path) || 0) + 1;
  fileRefreshSeq.set(path, nextSeq);

  const data = await loadFile(path, options.silent !== false);
  if (!data) return false;

  if (fileRefreshSeq.get(path) !== nextSeq) return false;

  const targetFile = state.sessionFiles.get(path) || state.sessionFiles.get(data.path);
  if (!targetFile) return false;

  targetFile.content = data.content;
  targetFile.pendingContent = undefined;  // 清理缓存的 pending 内容
  // Only advance lastModified if the fetched value is newer (don't overwrite a more recent SSE update)
  if (data.lastModified >= (targetFile.lastModified || 0)) {
    targetFile.lastModified = data.lastModified;
  }
  targetFile.displayedModified = data.lastModified;
  targetFile.isMissing = false;
  saveState();

  if (state.currentFile === path || state.currentFile === data.path) {
    if (getDiffViewActive()) {
      setDiffViewActive(false);
      const diffBtn = document.getElementById('diffButton');
      if (diffBtn) diffBtn.classList.remove('active');
      const banner = document.getElementById('diffBanner');
      if (banner) banner.remove();
    }
    renderContent();
    if (state.currentFile) updateToc(state.currentFile);
    // Defer annotation sync to the next frame: renderAnnotationList calls
    // getBoundingClientRect() on every annotation mark, which forces a
    // synchronous layout. Deferring lets the browser finish laying out the
    // freshly-rebuilt content DOM first, avoiding N × forced-reflow lag.
    requestAnimationFrame(() => {
      syncAnnotationsForCurrentFile(false);
      if (options.highlight) {
        flashContentUpdated();
      }
    });
  }

  renderSidebar();
  await updateToolbarButtons();
  return true;
}

// ==================== UI 渲染 ====================

// 渲染所有 UI（供工作区模式调用）
export function renderAll() {
  renderSidebar();
  renderContent();
  syncAnnotationsForCurrentFile(false);
}

// ==================== 用户操作 ====================


// ==================== 工具栏按钮 ====================
export async function updateToolbarButtons() {
  const diffButton = document.getElementById('diffButton');
  const refreshButton = document.getElementById('refreshButton');

  if (!state.currentFile) {
    if (diffButton) diffButton.style.display = 'none';
    if (refreshButton) refreshButton.style.display = 'none';
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  if (file.isMissing) {
    if (diffButton) diffButton.style.display = 'none';
    if (refreshButton) refreshButton.style.display = 'none';
    return;
  }

  const isDirty = file.lastModified > file.displayedModified;
  if (diffButton) diffButton.style.display = isDirty && !file.isRemote ? 'flex' : 'none';
  if (refreshButton) refreshButton.style.display = isDirty ? 'flex' : 'none';

}

// 点击刷新按钮
export async function handleRefreshButtonClick() {
  if (!state.currentFile) return;
  await refreshFile(state.currentFile);
}

// ==================== 键盘缩放快捷键（迁移到 registerAction 统一管理）====================

// ── Browsing signals: initialized in init.ts via initBrowsingSignals() ────────
// _resetDwell is set here so file-switcher can call it on file switch
if (typeof window !== 'undefined') {
  _resetDwell = () => resetDwellOnFileSwitch();
}

export function startWorkspacePolling() {
  window.setInterval(async () => {
    if (workspacePollRunning) return;
    if (state.config.sidebarTab === 'list') return;
    if (state.config.sidebarTab === 'search') return;

    // In focus tab, poll all workspaces (not just expanded ones)
    const toScan = state.config.sidebarTab === 'focus'
      ? state.config.workspaces
      : state.config.workspaces.filter((ws) => ws.isExpanded);
    if (toScan.length === 0) return;

    workspacePollRunning = true;
    try {
      for (const ws of toScan) {
        await scanWorkspace(ws.id);
      }
      renderSidebar();
    } finally {
      workspacePollRunning = false;
    }
  }, state.config.workspacePollInterval ?? 5000);
}

// ==================== 初始化 ====================
import './init';
