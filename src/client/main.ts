// 导入类型
import type { FileData } from './types';
import {
  initMemoryMonitor,
  switchMonitorTab,
  toggleMonitorPanel,
  type PdfViewerEntry,
} from './memory-monitor';

// 导入状态管理
import { state, saveState, restoreState, addOrUpdateFile, removeFile as removeFileFromState, switchToFile, setSearchQuery, markFileMissing, getSessionFile, saveScrollPosition, markWorkspaceFailed } from './state';
import { clearListDiff, markWorkspaceModified, clearWorkspaceModified, markWorkspacePathMissing, clearWorkspacePathMissing } from './workspace-state';
import { addWorkspace, hydrateExpandedWorkspaces, scanWorkspace, revealFileInWorkspace } from './workspace';

// 导入 API
import { loadFile, searchFiles, getNearbyFiles, openFile, detectPathType } from './api/files';

// 导入工具函数
import { escapeHtml, escapeAttr } from './utils/escape';
import { normalizeJoinedPath, resolveMarkdownLinkPath } from './utils/md-link';
import { formatRelativeTime } from './utils/format';
import { generateDistinctNames } from './utils/file-names';
import { getFileTypeIcon, getFileTypeLabel, isJsonFile, isJsonlFile } from './utils/file-type';

// 导入 UI 组件
import { renderSidebar, initTabsActions, initFileListActions, initWorkspaceActions, initSearchBoxCallbacks, toggleTabManager, applyTabBatchAction } from './ui/sidebar';
import { initToolbarActions } from './main-actions';
import { setRagCallbacks } from './ui/rag-search-panel';
import { showToast, showSuccess, showError, showWarning, showInfo } from './ui/toast';
import { showPreferences, closePreferences } from './ui/preferences';
import { toggleShortcutsHelp, hideShortcutsHelp, isShortcutsHelpVisible } from './ui/shortcuts-help';
import { registerAction, initDispatcher } from './keybindings';
import { initQuickOpen, showQuickOpen, hideQuickOpen } from './ui/quick-open';
import { renderJsonContent } from './ui/json-viewer';
import { mountScrollbar, unmountScrollbar, updateScrollbar } from './ui/doc-scrollbar';
import { initChatPanel, onChatFileSwitch } from './ui/chat-panel.js';

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

import { createPdfViewer, type PdfViewerInstance } from "./pdf-viewer.js";
import { createPdfAnnotationBridge } from "./pdf-annotation.js";
import { currentPdfViewer, setCurrentPdfViewer, setPdfDefaultScale } from './pdf-state';
import { renderTocPanel } from './ui/toc-panel.js';
import {
  initTocManager,
  updateToc,
  applyTocVisibility,
  setupTocOpenBtn,
  initTocPaneHeight,
  setupTocResize,
  attachPdfScrollHighlight,
} from './toc-manager';
import { storageGet, storageSet, storageGetNumber } from './utils/storage';
import { recordSignal } from './utils/focus-signals';
import { flushAll as flushUndoQueue } from './utils/undo-queue';
import { createResizer } from './utils/resizer';
import { setupFindBar } from './find-bar';
// // import { setupKeyboardShortcuts } from './keyboard-shortcuts'; // migrated to keybindings.ts // migrated to keybindings.ts
import { initZoom, zoomIn, zoomOut, setZoomFromInput, updateZoomDisplay, setPdfZoomValue, getPdfZoom } from './zoom-controller';
import { injectParaIds, initTranslation, handleTranslateButtonClick } from './translation';
import {
  initDiffView,
  getDiffViewActive, setDiffViewActive,
  refreshDiffIfActive,
  handleDiffButtonClick,
  navigateDiffBlock,
} from './diff-view';

declare global {
  function cleanupAllExpiredRecords(): number;
}

// Module-level variables for internal function references
let _resetDwell: (() => void) | null = null;
let _setPendingAnnotation: ((ann: any, filePath: string, x: number, y: number) => void) | null = null;

export function applyTheme(): void {
  const mdCss = getMdThemeCss(state.config.markdownTheme || 'github');
  const hlCss = getHlThemeCss(state.config.codeTheme || 'github');

  const mdStyle = document.getElementById('theme-md-css');
  const hlStyle = document.getElementById('theme-hl-css');

  if (mdStyle) mdStyle.textContent = mdCss;
  if (hlStyle) hlStyle.textContent = hlCss;
}

const SIDEBAR_WIDTH_STORAGE_KEY = 'md-viewer:sidebar-width';
const PDF_MODE_KEY = 'md-viewer:pdf-mode';
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 680;
const fileRefreshSeq = new Map<string, number>();
let workspacePollRunning = false;
let mermaidInitialized = false;
let currentPdfBridge: ReturnType<typeof createPdfAnnotationBridge> | null = null;

// PDF viewer registry: tracks all open PDF viewers and their idle timers
const PDF_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const pdfViewerRegistry = new Map<string, PdfViewerEntry>();

function applyPdfModeButtons(mode: 'select' | 'annotate'): void {
  const isAnnotate = mode === 'annotate';
  const selectBtn = document.getElementById('pdfModeSelectBtn');
  const annotateBtn = document.getElementById('pdfModeAnnotateBtn');
  if (selectBtn) selectBtn.classList.toggle('is-active', !isAnnotate);
  if (annotateBtn) annotateBtn.classList.toggle('is-active', isAnnotate);
}

function setPdfMode(mode: 'select' | 'annotate'): void {
  const nextMode = mode === 'annotate' ? 'annotate' : 'select';
  storageSet(PDF_MODE_KEY, nextMode);
  currentPdfViewer?.setAnnotateMode(nextMode === 'annotate');
  applyPdfModeButtons(nextMode);
}

function evictPdfViewer(filePath: string): void {
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) clearTimeout(entry.idleTimer);
  entry.viewer.destroy();
  if (currentPdfViewer === entry.viewer) {
    setCurrentPdfViewer(null);
  }
  pdfViewerRegistry.delete(filePath);
}

function scheduleEviction(filePath: string): void {
  if (!state.config.pdfIdleEviction) return;
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) clearTimeout(entry.idleTimer);
  entry.idleTimer = setTimeout(() => evictPdfViewer(filePath), PDF_IDLE_TIMEOUT_MS);
}

function cancelEviction(filePath: string): void {
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) {
    clearTimeout(entry.idleTimer);
    entry.idleTimer = null;
  }
  entry.lastActiveAt = Date.now();
}
function syncAnnotationsForCurrentFile(force = false): void {
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
async function onFileLoaded(data: FileData, focus: boolean = false) {
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

function getMaxSidebarWidth(): number {
  // 给主内容至少保留可读宽度
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, window.innerWidth - 360));
}

function clampSidebarWidth(width: number): number {
  return Math.min(getMaxSidebarWidth(), Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

function applySidebarWidth(width: number): void {
  const clamped = clampSidebarWidth(width);
  document.documentElement.style.setProperty('--sidebar-width', `${clamped}px`);
}

function initSidebarWidth(): void {
  const saved = storageGetNumber(SIDEBAR_WIDTH_STORAGE_KEY, SIDEBAR_DEFAULT_WIDTH);
  applySidebarWidth(saved > 0 ? saved : SIDEBAR_DEFAULT_WIDTH);
}

const SIDEBAR_COLLAPSED_KEY = 'md-viewer:sidebar-collapsed';

function setSidebarCollapsed(collapsed: boolean): void {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  storageSet(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}

function initSidebarCollapsed(): void {
  const saved = storageGet<string>(SIDEBAR_COLLAPSED_KEY, '');
  if (saved === '1') setSidebarCollapsed(true);
}

function setupSidebarCollapse(): void {
  document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => {
    setSidebarCollapsed(true);
  });
  document.getElementById('sidebarFloatingOpenBtn')?.addEventListener('click', () => {
    setSidebarCollapsed(false);
  });
}

function setupSidebarResize(): void {
  const resizer = document.getElementById('sidebarResizer');
  if (!resizer) return;

  createResizer({
    element: resizer,
    bodyClass: 'sidebar-resizing',
    guard: () => window.innerWidth > 900,
    onMove: (_delta, clientX) => {
      applySidebarWidth(clampSidebarWidth(clientX));
    },
    onEnd: (_delta, clientX) => {
      const width = clampSidebarWidth(clientX);
      applySidebarWidth(width);
      storageSet(SIDEBAR_WIDTH_STORAGE_KEY, width);
    },
  });

  window.addEventListener('resize', () => {
    const current = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'),
      10
    );
    if (Number.isFinite(current)) {
      applySidebarWidth(current);
    }
  });
}

// 刷新当前文件（页面加载时自动调用）
async function refreshCurrentFile() {
  if (!state.currentFile) return;
  await syncFileFromDisk(state.currentFile, { silent: true, highlight: false });
}

// 手动刷新文件（用户点击刷新按钮）
async function refreshFile(path: string) {
  const updated = await syncFileFromDisk(path, { silent: false, highlight: true });
  if (updated && state.currentFile === path) {
    showSuccess('文件已刷新', 2000);
  }
}

function flashContentUpdated(): void {
  const container = document.getElementById('content');
  if (!container) return;
  container.style.animation = 'flash 700ms ease-out';
  setTimeout(() => {
    container.style.animation = '';
  }, 700);
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

function isMarkdownContent(file: { name: string; path: string }): boolean {
  const lower = `${file.name} ${file.path}`.toLowerCase();
  return lower.includes('.md') || lower.includes('.markdown');
}

function resolveMarkdownAssetSrc(src: string, currentFilePath: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;

  // 保留可直接访问或内嵌的来源
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/api/')
  ) {
    return null;
  }

  // 当前仅为本地文件提供相对资源解析
  if (isUrlPath(currentFilePath)) {
    return null;
  }

  const qIndex = trimmed.indexOf('?');
  const hIndex = trimmed.indexOf('#');
  const cutIndex = [qIndex, hIndex].filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1;
  const pathPart = cutIndex >= 0 ? trimmed.slice(0, cutIndex) : trimmed;
  const suffix = cutIndex >= 0 ? trimmed.slice(cutIndex) : '';

  const baseDir = currentFilePath.slice(0, currentFilePath.lastIndexOf('/'));
  const absPath = pathPart.startsWith('/')
    ? pathPart
    : normalizeJoinedPath(baseDir, pathPart);

  return `/api/file-asset?path=${encodeURIComponent(absPath)}${suffix}`;
}

function rewriteMarkdownAssetUrls(container: HTMLElement, currentFilePath: string): void {
  const root = container.querySelector('.markdown-body');
  if (!root) return;

  root.querySelectorAll('img[src], video[src], source[src]').forEach((el) => {
    const source = el.getAttribute('src');
    if (!source) return;
    const resolved = resolveMarkdownAssetSrc(source, currentFilePath);
    if (!resolved) return;
    el.setAttribute('src', resolved);
  });
}

import { protectMath } from './utils/math-protect';

function renderMath(container: HTMLElement): void {
  const renderMathInElement = (window as any).renderMathInElement;
  if (!renderMathInElement) return;

  const mathInline = state.config.mathInline !== false;
  const delimiters = [
    { left: '$$', right: '$$', display: true },
    { left: '\\[', right: '\\]', display: true },
    { left: '\\(', right: '\\)', display: false },
    ...(mathInline ? [{ left: '$', right: '$', display: false }] : []),
  ];

  renderMathInElement(container, {
    delimiters,
    throwOnError: false,
    ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code'],
  });
}

async function renderMermaidDiagrams(container: HTMLElement): Promise<void> {
  const mermaid = (window as any).mermaid;
  if (!mermaid) return;

  const codeBlocks = Array.from(
    container.querySelectorAll(
      '.markdown-body pre > code.language-mermaid, .markdown-body pre > code.lang-mermaid, .markdown-body pre > code.language-flowchart, .markdown-body pre > code.lang-flowchart'
    )
  ) as HTMLElement[];
  if (codeBlocks.length === 0) return;

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose'
    });
    mermaidInitialized = true;
  }

  const setCopiedState = (button: HTMLButtonElement): void => {
    const original = button.textContent || '复制';
    button.textContent = '✓';
    button.classList.add('copied');
    window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove('copied');
    }, 900);
  };

  const createMermaidSourcePanel = (
    source: string,
    showByDefault: boolean
  ): { panel: HTMLDivElement; toggleButton: HTMLButtonElement } => {
    const panel = document.createElement('div');
    panel.className = 'mermaid-source-panel';
    panel.style.display = showByDefault ? 'block' : 'none';

    const head = document.createElement('div');
    head.className = 'mermaid-source-head';
    const title = document.createElement('span');
    title.textContent = 'Mermaid 源码';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'mermaid-source-copy';
    copyBtn.textContent = '复制';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(source);
        setCopiedState(copyBtn);
      } catch {
        // ignore clipboard errors
      }
    });
    head.appendChild(title);
    head.appendChild(copyBtn);

    const sourcePre = document.createElement('pre');
    const sourceCode = document.createElement('code');
    sourceCode.className = 'language-mermaid';
    sourceCode.textContent = source;
    sourcePre.appendChild(sourceCode);
    panel.appendChild(head);
    panel.appendChild(sourcePre);

    const toggleButton = document.createElement('button');
    toggleButton.className = 'mermaid-source-toggle';
    toggleButton.textContent = showByDefault ? '隐藏源码' : '源码';
    toggleButton.addEventListener('click', () => {
      const shown = panel.style.display !== 'none';
      panel.style.display = shown ? 'none' : 'block';
      toggleButton.textContent = shown ? '源码' : '隐藏源码';
    });

    return { panel, toggleButton };
  };

  for (let i = 0; i < codeBlocks.length; i += 1) {
    const codeEl = codeBlocks[i];
    const preEl = codeEl.closest('pre');
    if (!preEl) continue;
    const sourceRaw = (codeEl.textContent || '').trim();
    if (!sourceRaw) continue;
    const isFlowchartFence =
      codeEl.classList.contains('language-flowchart') || codeEl.classList.contains('lang-flowchart');
    const firstLine = sourceRaw.split('\n').find((line) => line.trim().length > 0)?.trim().toLowerCase() || '';
    const source = isFlowchartFence && !firstLine.startsWith('flowchart') && !firstLine.startsWith('graph')
      ? `flowchart TD\n${sourceRaw}`
      : sourceRaw;
    if (!source) continue;

    try {
      const renderId = `mdv-mermaid-${Date.now()}-${i}`;
      const { svg, bindFunctions } = await mermaid.render(renderId, source);
      const block = document.createElement('div');
      block.className = 'mermaid-block';
      const actions = document.createElement('div');
      actions.className = 'mermaid-actions';
      const { panel, toggleButton } = createMermaidSourcePanel(source, false);
      actions.appendChild(toggleButton);

      const host = document.createElement('div');
      host.className = 'mermaid';
      host.setAttribute('data-mdv-mermaid', '1');
      host.innerHTML = svg;
      block.appendChild(actions);
      block.appendChild(host);
      block.appendChild(panel);
      preEl.replaceWith(block);

      if (typeof bindFunctions === 'function') {
        bindFunctions(host);
      }
    } catch (error) {
      // 语法错误时回退显示源码，并给出明确提示
      const block = document.createElement('div');
      block.className = 'mermaid-fallback-block';
      const actions = document.createElement('div');
      actions.className = 'mermaid-actions';
      const { panel, toggleButton } = createMermaidSourcePanel(source, true);
      actions.appendChild(toggleButton);

      const notice = document.createElement('div');
      notice.className = 'mermaid-fallback-notice';
      notice.textContent = 'Mermaid 语法错误，已回退为原文显示';
      block.appendChild(actions);
      block.appendChild(notice);
      block.appendChild(panel);
      preEl.replaceWith(block);
      console.error('Mermaid 渲染失败，已回退原文:', error);
    }
  }
}

// ── PDF page indicator ────────────────────────────────────────────────────
let pdfPageIndicatorScrollHandler: (() => void) | null = null;

function mountPdfPageIndicator(viewer: PdfViewerInstance, container: HTMLElement): void {
  const indicator = document.getElementById('pdfPageIndicator');
  if (!indicator) return;
  const label = indicator.querySelector<HTMLElement>('.pdf-page-indicator-label')!;
  const input = indicator.querySelector<HTMLInputElement>('.pdf-page-indicator-input')!;
  const total = viewer.getTotalPages();

  function currentVisiblePage(): number {
    const wrappers = container.querySelectorAll<HTMLElement>('.pdf-page-wrapper');
    const mid = container.scrollTop + container.clientHeight / 2;
    let best = 1;
    for (const w of wrappers) {
      if (w.offsetTop <= mid) best = parseInt(w.dataset.page || '1', 10);
    }
    return best;
  }

  function showLabel(): void {
    label.textContent = `${currentVisiblePage()} / ${total}`;
    label.style.display = '';
    input.style.display = 'none';
  }

  function showInput(): void {
    input.max = String(total);
    input.value = String(currentVisiblePage());
    label.style.display = 'none';
    input.style.display = '';
    input.focus();
    input.select();
  }

  showLabel();
  indicator.style.display = 'block';

  pdfPageIndicatorScrollHandler = () => { if (input.style.display === 'none') showLabel(); };
  container.addEventListener('scroll', pdfPageIndicatorScrollHandler, { passive: true });

  indicator.addEventListener('click', (e) => {
    if (e.target === input) return;
    if (input.style.display === 'none') showInput();
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const page = Math.min(total, Math.max(1, parseInt(input.value, 10) || 1));
      viewer.scrollToPage(page);
      showLabel();
    } else if (e.key === 'Escape') {
      showLabel();
    }
  });

  input.addEventListener('blur', () => showLabel());
}

function unmountPdfPageIndicator(container: HTMLElement): void {
  const indicator = document.getElementById('pdfPageIndicator');
  if (indicator) indicator.style.display = 'none';
  if (pdfPageIndicatorScrollHandler) {
    container.removeEventListener('scroll', pdfPageIndicatorScrollHandler);
    pdfPageIndicatorScrollHandler = null;
  }
}

function renderContent() {
  const container = document.getElementById('content');
  if (!container) return;
  if (!getDiffViewActive()) container.classList.remove('diff-active');

  // Save scroll position of the outgoing MD file before switching content.
  const outgoingFile = container.getAttribute('data-current-file');
  if (outgoingFile && !isPdfPath(outgoingFile) && outgoingFile !== state.currentFile) {
    saveScrollPosition(outgoingFile, container.scrollTop);
  }

  // Detach all PDF viewer elements from container so innerHTML resets don't destroy them.
  // Save scroll position before detaching so we can restore it when switching back.
  // Schedule eviction for PDFs that are no longer current.
  for (const [path, entry] of pdfViewerRegistry.entries()) {
    if (entry.viewer.el.parentNode) {
      entry.savedScrollTop = container.scrollTop;
      storageSet(`md-viewer:pdf-scroll:${path}`, container.scrollTop);
      entry.viewer.el.remove();
    }
    if (path !== state.currentFile) scheduleEviction(path);
  }
  setCurrentPdfViewer(null);
  currentPdfBridge = null;
  container.removeAttribute('data-pdf');
  if (!state.currentFile || !isPdfPath(state.currentFile)) {
    const pdfModeSelectBtnHide = document.getElementById('pdfModeSelectBtn');
    const pdfModeAnnotateBtnHide = document.getElementById('pdfModeAnnotateBtn');
    if (pdfModeSelectBtnHide) pdfModeSelectBtnHide.style.display = 'none';
    if (pdfModeAnnotateBtnHide) pdfModeAnnotateBtnHide.style.display = 'none';
  }

  if (!state.currentFile) {
    container.removeAttribute('data-current-file');
    container.innerHTML = `
      <div class="empty-state">
        <h2>欢迎使用 MD Viewer</h2>
        <p>在左侧添加 Markdown/HTML 文件开始阅读</p>
      </div>
    `;
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  if (isHtmlPath(file.path)) {
    container.setAttribute('data-current-file', file.path);
    container.innerHTML = `<iframe class="html-preview-frame" srcdoc="${file.content.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"></iframe>`;
    renderBreadcrumb();
    updateToolbarButtons();
    return;
  }

  if (isJsonPath(file.path)) {
    container.setAttribute('data-current-file', file.path);
    container.innerHTML = '';
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const query = searchInput?.value?.trim() ?? '';
    renderJsonContent(container, file.content, file.path, query);
    renderBreadcrumb();
    updateToolbarButtons();
    return;
  }

  if (isPdfPath(file.path)) {
    const filePath = file.path;
    const scale = getPdfZoom(filePath);

    // Cancel any pending eviction for this file (user came back)
    cancelEviction(filePath);

    // Mark container as PDF mode — CSS handles padding adjustments
    container.setAttribute('data-pdf', '1');

    // Reuse existing viewer if available — re-attach its el to container
    const existingEntry = pdfViewerRegistry.get(filePath);
    if (existingEntry) {
      currentPdfBridge = createPdfAnnotationBridge({
        filePath,
        viewer: existingEntry.viewer,
        getAnnotations: () => getAnnotations(),
        onAnnotationCreated: () => {
          currentPdfBridge?.renderHighlights(getAnnotations());
        },
      });
      setCurrentPdfViewer(existingEntry.viewer);
      existingEntry.viewer.onAnnotationClick = (annotationId: string, clientX: number, clientY: number) => {
        currentPdfBridge?.handleAnnotationClick(annotationId, clientX, clientY);
      };
      container.innerHTML = '';
      container.appendChild(existingEntry.viewer.el);
      if (existingEntry.savedScrollTop !== undefined) {
        container.scrollTop = existingEntry.savedScrollTop;
      }
      container.setAttribute('data-current-file', filePath);
      renderBreadcrumb();
      updateToolbarButtons();
      unmountScrollbar();
      mountScrollbar();
      mountPdfPageIndicator(existingEntry.viewer, container);
      updateToc(filePath);
      // Restore and apply saved PDF mode
      const savedPdfMode = storageGet<string>(PDF_MODE_KEY, 'select') as 'select' | 'annotate';
      existingEntry.viewer.setAnnotateMode(savedPdfMode === 'annotate');
      const pdfModeSelectBtn = document.getElementById('pdfModeSelectBtn');
      const pdfModeAnnotateBtn = document.getElementById('pdfModeAnnotateBtn');
      if (pdfModeSelectBtn) pdfModeSelectBtn.style.display = '';
      if (pdfModeAnnotateBtn) pdfModeAnnotateBtn.style.display = '';
      applyPdfModeButtons(savedPdfMode);
      return;
    }

    // New viewer — clear container first, then createPdfViewer appends its el
    container.innerHTML = '';

    createPdfViewer({
      container,
      filePath,
      scale,
      onTextSelected: (pageNum, selectedText, prefix, suffix, clientX, clientY, startItemIdx, endItemIdx) => {
        currentPdfBridge?.handleTextSelected(pageNum, selectedText, prefix, suffix, clientX, clientY, startItemIdx, endItemIdx);
      },
      onPageRendered: (_pageNum) => {
        // Page just became visible — replay annotation highlights for it
        currentPdfBridge?.renderHighlights(getAnnotations());
        // Update scrollbar after first page renders (scrollHeight is now > clientHeight)
        updateScrollbar();
      },
    }).then((pdfViewerInstance) => {
      container.setAttribute('data-current-file', filePath);
      const savedScroll = storageGetNumber(`md-viewer:pdf-scroll:${filePath}`, 0);
      pdfViewerRegistry.set(filePath, {
        viewer: pdfViewerInstance,
        lastActiveAt: Date.now(),
        idleTimer: null,
        savedScrollTop: Number.isFinite(savedScroll) && savedScroll > 0 ? savedScroll : undefined,
      });
      if (savedScroll > 0) container.scrollTop = savedScroll;
      setCurrentPdfViewer(pdfViewerInstance);
      pdfViewerInstance.onAnnotationClick = (annotationId: string, clientX: number, clientY: number) => {
        currentPdfBridge?.handleAnnotationClick(annotationId, clientX, clientY);
      };
      currentPdfBridge = createPdfAnnotationBridge({
        filePath,
        viewer: pdfViewerInstance,
        getAnnotations: () => getAnnotations(),
        onAnnotationCreated: (_ann) => {
          currentPdfBridge?.renderHighlights(getAnnotations());
        },
      });
      unmountScrollbar();
      mountScrollbar();
      mountPdfPageIndicator(pdfViewerInstance, container);
      updateToc(filePath);
      // Restore and apply saved PDF mode
      const savedPdfMode = storageGet<string>(PDF_MODE_KEY, 'select') as 'select' | 'annotate';
      pdfViewerInstance.setAnnotateMode(savedPdfMode === 'annotate');
      const pdfModeSelectBtn = document.getElementById('pdfModeSelectBtn');
      const pdfModeAnnotateBtn = document.getElementById('pdfModeAnnotateBtn');
      if (pdfModeSelectBtn) pdfModeSelectBtn.style.display = '';
      if (pdfModeAnnotateBtn) pdfModeAnnotateBtn.style.display = '';
      applyPdfModeButtons(savedPdfMode);
    });
    return; // don't fall through to markdown renderer
  }

  // 使用 marked 渲染 Markdown
  const mathGuard = protectMath(file.content);
  const html = mathGuard.restore((window as any).marked.parse(mathGuard.protected));
  const deletedNotice = file.isMissing
    ? `
      <div class="content-file-status deleted">
        该文件已从磁盘删除，当前内容为本地缓存快照。
      </div>
    `
    : '';
  container.innerHTML = `${deletedNotice}<div class="markdown-body" id="reader">${html}</div>`;
  invalidateAnnotationElementsCache();
  container.setAttribute('data-current-file', file.path);
  container.scrollTop = file.savedScrollTop ?? 0;
  rewriteMarkdownAssetUrls(container, file.path);
  void renderMermaidDiagrams(container);
  renderMath(container);

  // 应用批注高亮
  applyAnnotations();
  injectParaIds();

  // 更新面包屑
  renderBreadcrumb();

  // 挂载自定义滚动条
  unmountScrollbar();
  mountScrollbar();
  unmountPdfPageIndicator(container);

  // 更新工具栏按钮
  updateToolbarButtons();
  if (file.path) initTranslation(file.path);
}

// ==================== 面包屑导航 ====================
function renderBreadcrumb() {
  const container = document.getElementById('breadcrumb');
  if (!container || !state.currentFile) {
    if (container) container.innerHTML = '';
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  const parts = file.path.split('/').filter(Boolean);
  const fileName = parts[parts.length - 1] || '';

  const breadcrumbItems = parts.map((part, index) => {
    const isLast = index === parts.length - 1;
    const path = '/' + parts.slice(0, index + 1).join('/');

    if (isLast) {
      return `<span class="breadcrumb-item active">${escapeHtml(part)}</span>`;
    }

    return `
      <span class="breadcrumb-item" title="${escapeAttr(path)}">
        ${escapeHtml(part)}
      </span>
      <span class="breadcrumb-separator">/</span>
    `;
  }).join('');

  // 显示面包屑路径和复制按钮
  container.innerHTML = `
    ${breadcrumbItems}
    <button class="copy-filename-button" data-action="copy-relative-path" data-path="${escapeAttr(file.path)}" title="复制相对路径">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">复制相对路径</span>
    </button>
    <button class="copy-filename-button copy-abspath-button" data-action="copy-absolute-path" data-path="${escapeAttr(file.path)}" title="复制绝对路径">
      <span class="copy-abspath-icon">/</span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">复制绝对路径</span>
    </button>
  `;
}

// 显示附近文件菜单
async function showNearbyMenu(e: Event) {
  e.stopPropagation();
  if (!state.currentFile) return;

  const button = e.target as HTMLElement;
  const existingMenu = document.querySelector('.nearby-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  try {
    const data = await getNearbyFiles(state.currentFile);
    if (!data.files || data.files.length === 0) {
      showInfo('附近没有其他 Markdown 文件', 3000);
      return;
    }

    const menuElement = document.createElement('div');
    menuElement.className = 'nearby-menu';
    menuElement.innerHTML = `
      <div class="nearby-menu-header">附近的文件</div>
      ${data.files.map(f => `
        <div class="nearby-menu-item" data-action="nearby-open" data-path="${escapeAttr(f.path)}">
          📄 ${escapeHtml(f.name)}
        </div>
      `).join('')}
    `;
    menuElement.addEventListener('click', (ev) => {
      const item = (ev.target as HTMLElement).closest('[data-action="nearby-open"]') as HTMLElement | null;
      if (item?.dataset.path) void addFileByPath(item.dataset.path, true);
    });

    const rect = button.getBoundingClientRect();
    menuElement.style.position = 'fixed';
    menuElement.style.left = rect.left + 'px';
    menuElement.style.top = (rect.bottom + 5) + 'px';

    document.body.appendChild(menuElement);

    const closeMenu = () => {
      menuElement.remove();
      document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  } catch (err: any) {
    showError('获取附近文件失败: ' + err.message);
  }
}

// ==================== 用户操作 ====================

type PendingAddAction =
  | { kind: 'add-other-file'; path: string; ext: string | null }
  | { kind: 'add-workspace'; path: string };

let pendingAddAction: PendingAddAction | null = null;

function getWorkspaceNameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'workspace';
}

function isHtmlPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm');
}

function isJsonPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.json') || lower.endsWith('.jsonl');
}

function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith(".pdf");
}

function isUrlPath(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

async function openFileInBrowser(path: string): Promise<void> {
  clearListDiff(path);
  renderSidebar();

  if (isUrlPath(path)) {
    window.open(path, '_blank', 'noopener,noreferrer');
    return;
  }
  try {
    const response = await fetch('/api/open-local-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const data = await response.json();
    if (data?.error) {
      showError(`打开 HTML 失败: ${data.error}`);
    }
  } catch (error: any) {
    showError(`打开 HTML 失败: ${error?.message || '未知错误'}`);
  }
}

function looksLikePathInput(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('/') || v.startsWith('~/') || v.startsWith('./') || v.startsWith('../')) return true;
  if (v.includes('/') || v.includes('\\')) return true;
  if (/\.[a-zA-Z0-9]{1,10}$/.test(v)) return true;
  return false;
}

function clearAddConfirm(): void {
  pendingAddAction = null;
  const bar = document.getElementById('quickActionConfirm') as HTMLElement | null;
  const text = document.getElementById('quickActionConfirmText') as HTMLElement | null;
  const actions = document.getElementById('quickActionConfirmActions') as HTMLElement | null;
  if (bar) {
    bar.style.display = 'none';
    bar.className = 'add-file-confirm';
  }
  if (text) text.textContent = '';
  if (actions) actions.innerHTML = '';
  document.body.classList.remove('quick-action-confirm-visible');
}

function isAddConfirmVisible(): boolean {
  const bar = document.getElementById('quickActionConfirm') as HTMLElement | null;
  return !!bar && bar.style.display !== 'none';
}

function showAddConfirm(
  message: string,
  mode: 'warning' | 'directory' | 'error',
  opts: { primaryLabel?: string; onPrimary?: () => Promise<void> | void; allowCancel?: boolean } = {}
): void {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
  searchInput?.dispatchEvent(new Event('path-autocomplete-hide'));

  const bar = document.getElementById('quickActionConfirm') as HTMLElement | null;
  const text = document.getElementById('quickActionConfirmText') as HTMLElement | null;
  const actions = document.getElementById('quickActionConfirmActions') as HTMLElement | null;
  if (!bar || !text || !actions) return;

  text.textContent = message;
  actions.innerHTML = '';
  bar.className = `add-file-confirm state-${mode}`;
  bar.style.display = 'flex';
  document.body.classList.add('quick-action-confirm-visible');

  if (opts.primaryLabel && opts.onPrimary) {
    const primary = document.createElement('button');
    primary.className = 'add-file-confirm-button primary';
    primary.textContent = opts.primaryLabel;
    primary.onclick = async () => {
      await opts.onPrimary!();
      clearAddConfirm();
    };
    actions.appendChild(primary);
  }

  if (opts.allowCancel !== false) {
    const cancel = document.createElement('button');
    cancel.className = 'add-file-confirm-button';
    cancel.textContent = '取消';
    cancel.onclick = () => clearAddConfirm();
    actions.appendChild(cancel);
  }
}

async function executePendingAddAction(): Promise<void> {
  if (!pendingAddAction) return;

  if (pendingAddAction.kind === 'add-other-file') {
    await addFileByPath(pendingAddAction.path, true);
    return;
  }

  const workspace = addWorkspace(getWorkspaceNameFromPath(pendingAddAction.path), pendingAddAction.path);
  renderSidebar();
  showSuccess(`已添加工作区: ${workspace.name}`, 2000);
  setSearchQuery('');
  renderSidebar();
}

// 添加文件
async function addFileByPath(path: string, focus: boolean = true) {
  if (!path.trim()) return;

  const data = await loadFile(path);
  if (data) {
    await onFileLoaded(data, focus);
    await openFile(path, focus);

    // 清空统一输入框
    setSearchQuery('');
    renderSidebar();
  }
}

async function handleSmartAddInput(path: string): Promise<void> {
  const trimmed = path.trim();
  if (!trimmed) return;

  const result = await detectPathType(trimmed);
  const detectedPath = result.path || trimmed;

  if (result.kind === 'md_file' || result.kind === 'html_file' || String(result.kind) === 'pdf_file') {
    clearAddConfirm();
    await addFileByPath(detectedPath, true);
    return;
  }

  if (result.kind === 'other_file') {
    pendingAddAction = {
      kind: 'add-other-file',
      path: detectedPath,
      ext: result.ext || null
    };
    showAddConfirm(
      `检测到非 Markdown 文件${result.ext ? `: ${result.ext}` : ''}`,
      'warning',
      {
        primaryLabel: '继续添加文件',
        onPrimary: executePendingAddAction
      }
    );
    return;
  }

  if (result.kind === 'directory') {
    pendingAddAction = {
      kind: 'add-workspace',
      path: detectedPath
    };
    showAddConfirm('检测到目录，是否作为工作区添加？', 'directory', {
      primaryLabel: '添加工作区',
      onPrimary: executePendingAddAction
    });
    return;
  }

  if (result.kind === 'not_found') {
    pendingAddAction = null;
    showAddConfirm('路径不存在，请检查后重试', 'error', { allowCancel: true });
    return;
  }

  pendingAddAction = null;
  showAddConfirm(result.error || '无法识别输入路径', 'error', { allowCancel: true });
}

// 切换文件
async function switchFile(path: string) {
  // 切换文件时关闭 diff 视图
  if (getDiffViewActive()) {
    setDiffViewActive(false);
    const diffBtn = document.getElementById('diffButton');
    if (diffBtn) diffBtn.classList.remove('active');
    const banner = document.getElementById('diffBanner');
    if (banner) banner.remove();
  }
  const previousFile = state.currentFile;
  _resetDwell?.();
  switchToFile(path);
  updateZoomDisplay(true);
  renderSidebar();

  // Immediately show loading state to avoid stale TOC during transition
  const tocPanel = document.getElementById('tocPanel');
  if (tocPanel) renderTocPanel(tocPanel, [], () => {}, true);

  // 懒加载：占位 entry 的 content 为空时，先拉内容再渲染
  const entry = state.sessionFiles.get(path);
  if (entry && !entry.content && !entry.isMissing && !isPdfPath(path)) {
    const fileData = await loadFile(path, true);
    if (fileData) {
      entry.content = fileData.content;
      entry.lastModified = Math.max(entry.lastModified, fileData.lastModified);
      entry.displayedModified = fileData.lastModified;
      entry.isMissing = false;
    } else {
      entry.isMissing = true;
    }
    saveState();
  }

  renderContent();
  if (!isPdfPath(path)) updateToc(path);
  syncAnnotationsForCurrentFile(true);
  onChatFileSwitch(path);
  await updateToolbarButtons();
}

// 移除文件（关闭标签页和从列表删除是同一个操作）
function removeFileHandler(path: string) {
  if (isPdfPath(path)) evictPdfViewer(path);
  removeFileFromState(path);
  if (state.currentFile) {
    // Reuse switchFile so lazy-loading triggers for session files with empty content.
    void switchFile(state.currentFile);
  } else {
    renderSidebar();
    renderContent();
    syncAnnotationsForCurrentFile(true);
    const panel = document.getElementById('tocPanel');
    if (panel) renderTocPanel(panel, [], () => {});
  }
}

function navigateFileInView(direction: 1 | -1): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('#fileList [data-path]'));
  if (items.length === 0) return;
  const paths = items.map(el => el.dataset.path!);
  const currentIdx = state.currentFile ? paths.indexOf(state.currentFile) : -1;
  const nextIdx = currentIdx === -1
    ? (direction === 1 ? 0 : paths.length - 1)
    : Math.max(0, Math.min(paths.length - 1, currentIdx + direction));
  if (paths[nextIdx] && paths[nextIdx] !== state.currentFile) {
    void switchFile(paths[nextIdx]);
  }
}

function cycleTab(direction: 1 | -1): void {
  const files = state.tabOrder.filter(p => state.sessionFiles.has(p));
  if (files.length <= 1) return;
  const currentIndex = state.currentFile ? files.indexOf(state.currentFile) : -1;
  const nextIndex = (currentIndex + direction + files.length) % files.length;
  void switchFile(files[nextIndex]);
}

function jumpToTab(n: number): void {
  const files = state.tabOrder.filter(p => state.sessionFiles.has(p));
  if (files.length === 0) return;
  const index = n === 9 ? files.length - 1 : n - 1;
  if (index >= 0 && index < files.length) void switchFile(files[index]);
}

// 搜索文件
async function searchFilesHandler(rawQuery?: string) {
  const input = document.getElementById('searchInput') as HTMLInputElement | null;
  const query = (typeof rawQuery === 'string' ? rawQuery : input?.value || '').trim();
  if (!query) return;

  try {
    const workspaceRoots = state.config.workspaces.map((ws) => ws.path).filter(Boolean);
    const data = await searchFiles(query, {
      roots: workspaceRoots,
      limit: 50,
    });
    if (data.files && data.files.length > 0) {
      // 显示搜索结果（简单实现：添加第一个）
      await addFileByPath(data.files[0].path);
    } else {
      showInfo('没有找到匹配的文件', 3000);
    }
  } catch (err: any) {
    showError('搜索失败: ' + err.message);
  }
}

// ==================== 拖拽支持 ====================
function setupDragAndDrop() {
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.body.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
        await addFileByPath((file as any).path);
      }
    }
  });
}

// ==================== URL 参数处理 ====================
function handleURLParams() {
  const params = new URLSearchParams(window.location.search);
  const filePath = params.get('file');
  const focus = params.get('focus') !== 'false';

  if (filePath) {
    addFileByPath(filePath, focus);
    // 清理 URL 参数
    window.history.replaceState({}, '', window.location.pathname);
  }
}

// ==================== 工具栏按钮 ====================
async function updateToolbarButtons() {
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
async function handleRefreshButtonClick() {
  if (!state.currentFile) return;
  await refreshFile(state.currentFile);
}


function resolveCopyFeedbackTarget(e?: Event): HTMLElement | null {
  if (!e?.target) return null;
  return (e.target as HTMLElement).closest('.copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn') as HTMLElement | null;
}

function applyCopyFeedback(target: HTMLElement | null, successMsg?: string): void {
  if (!target) return;

  if (target.classList.contains('copy-filename-button')) {
    target.classList.add('success');
    const tooltip = target.querySelector('.copy-tooltip');
    const originalText = tooltip?.textContent;
    if (tooltip) tooltip.textContent = successMsg || '已复制';
    setTimeout(() => {
      target.classList.remove('success');
      if (tooltip && originalText) tooltip.textContent = originalText;
    }, 1000);
    return;
  }

  const originalText = target.textContent;
  target.textContent = '✓ 已复制';
  setTimeout(() => {
    if (originalText != null) target.textContent = originalText;
  }, 1000);
}

function copyTextWithFeedback(text: string, e?: Event, successMsg?: string): void {
  navigator.clipboard.writeText(text).then(() => {
    applyCopyFeedback(resolveCopyFeedbackTarget(e), successMsg);
  }).catch(() => {
    showError('复制失败');
  });
}

// 复制单个文本
function copySingleText(text: string, e?: Event) {
  copyTextWithFeedback(text, e);
}

// 复制文件路径：默认复制相对工作区根目录的相对路径，Alt+Click 复制绝对路径
function copyFilePath(filePath: string, event?: Event) {
  // 找当前文件所属工作区，计算相对路径
  const workspaces = state.config.workspaces;
  let relPath = filePath;
  for (const ws of workspaces) {
    const root = ws.path.replace(/\/+$/, '');
    if (filePath === root || filePath.startsWith(root + '/')) {
      relPath = filePath.slice(root.length + 1);
      break;
    }
  }
  copyTextWithFeedback(relPath, event, '已复制相对路径');
}

function copyRelativePath(filePath: string, event?: Event) {
  copyFilePath(filePath, event);
}

function copyAbsolutePath(filePath: string, event?: Event) {
  copyTextWithFeedback(filePath, event, '已复制绝对路径');
}

// 兼容旧调用
function copyFileName(fileName: string, event?: Event) {
  copyFilePath(fileName, event);
}



// ==================== 键盘缩放快捷键（迁移到 registerAction 统一管理）====================

// ==================== SSE 连接状态 ====================
let sseConnectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' = 'connecting';
let sseRetryCount = 0;
let sseCurrentDelay = 3000;
const SSE_MAX_RETRIES = 10;
const SSE_INITIAL_DELAY = 3000;
const SSE_MAX_DELAY = 30000;
let sseReconnectTimer: ReturnType<typeof setTimeout> | null = null;

function updateConnectionStatus(status: typeof sseConnectionState, retryInfo?: string) {
  sseConnectionState = status;
  const indicator = document.getElementById('connectionIndicator');
  const text = document.getElementById('connectionText');
  const statusEl = document.getElementById('connectionStatus');
  if (!indicator || !text || !statusEl) return;

  indicator.className = 'connection-indicator';
  statusEl.style.cursor = status === 'failed' ? 'pointer' : 'default';
  statusEl.onclick = status === 'failed' ? () => resetAndReconnectSSE() : null;

  if (status === 'connected') {
    indicator.classList.add('connected');
    text.textContent = '';
    statusEl.title = '已连接';
  } else if (status === 'connecting') {
    indicator.classList.add('connecting');
    text.textContent = retryInfo || '重连中...';
    statusEl.title = `正在重新连接... (${retryInfo})`;
  } else if (status === 'failed') {
    indicator.classList.add('disconnected');
    text.textContent = '点击重连';
    statusEl.title = '重连失败，点击手动重连';
  } else {
    indicator.classList.add('disconnected');
    text.textContent = '未连接';
    statusEl.title = '连接已断开';
  }
}

function resetAndReconnectSSE() {
  sseRetryCount = 0;
  sseCurrentDelay = SSE_INITIAL_DELAY;
  if (sseReconnectTimer) {
    clearTimeout(sseReconnectTimer);
    sseReconnectTimer = null;
  }
  connectSSE(true);
}

function scheduleReconnect() {
  if (sseRetryCount >= SSE_MAX_RETRIES) {
    updateConnectionStatus('failed');
    console.error(`SSE 重连失败，已达最大重试次数 (${SSE_MAX_RETRIES})`);
    return;
  }

  sseRetryCount++;
  const retryText = `${sseRetryCount}/${SSE_MAX_RETRIES}`;
  updateConnectionStatus('connecting', retryText);

  console.log(`SSE ${sseRetryCount}/${SSE_MAX_RETRIES} 秒后重连...`);

  sseReconnectTimer = setTimeout(() => {
    sseReconnectTimer = null;
    connectSSE(true);
  }, sseCurrentDelay);

  // 指数退避，但不超过最大值
  sseCurrentDelay = Math.min(sseCurrentDelay * 2, SSE_MAX_DELAY);
}

// 重连时同步所有打开文件的最新状态
async function syncOpenFilesAfterReconnect() {
  const openFiles = Array.from(state.sessionFiles.values());
  if (openFiles.length === 0) return;

  let hasUpdate = false;
  for (const file of openFiles) {
    if (file.isMissing || file.isRemote) continue;

    try {
      const data = await loadFile(file.path, true);
      if (!data) continue;

      // 如果文件有更新
      if (data.lastModified > file.lastModified) {
        file.lastModified = data.lastModified;
        file.pendingContent = data.content;
        hasUpdate = true;
        // 若当前文件正在 diff 模式，刷新 diff 界面
        if (state.currentFile === file.path) refreshDiffIfActive();
      }
    } catch {
      // 忽略单个文件的错误
    }
  }

  if (hasUpdate) {
    saveState();
    renderSidebar();
    await updateToolbarButtons();

    // 如果当前文件有更新且未在 diff 模式，给用户提示
    const currentFile = state.currentFile ? state.sessionFiles.get(state.currentFile) : null;
    if (currentFile && currentFile.pendingContent !== undefined && !getDiffViewActive()) {
      showInfo('文件有更新，点击 Diff 查看差异', 3000);
    }
  }
}

// ==================== SSE 连接 ====================
function connectSSE(isReconnect = false) {
  updateConnectionStatus('connecting');
  const eventSource = new EventSource('/api/events');

  eventSource.addEventListener('connected', async () => {
    // 连接成功，重置重连计数器
    if (sseRetryCount > 0) {
      sseRetryCount = 0;
      sseCurrentDelay = SSE_INITIAL_DELAY;
      console.log('SSE 连接恢复');
    }
    updateConnectionStatus('connected');

    // 重连时重新触发工作区扫描，让服务端重新注册 watchWorkspace
    if (isReconnect) {
      void hydrateExpandedWorkspaces();
      // 同步所有打开文件的状态，捕获断连期间的更新
      await syncOpenFilesAfterReconnect();
    }
  });

  // 文件内容变化
  eventSource.addEventListener('file-changed', async (e: any) => {
    const data = JSON.parse(e.data);
    const file = getSessionFile(data.path);

    if (file) {
      // 已打开的文件：更新 lastModified，M 标记由 getFileListStatus 计算
      file.lastModified = data.lastModified;
      // 原子保存后文件重新出现，清除 isMissing 标记
      if (file.isMissing) {
        file.isMissing = false;
        clearWorkspacePathMissing(data.path);
      }
      // 若当前文件正在 diff 模式，fetch 新内容并刷新 diff 界面
      if (getDiffViewActive() && state.currentFile === data.path) {
        const fetched = await loadFile(data.path, true);
        if (fetched) {
          file.pendingContent = fetched.content;
          refreshDiffIfActive();
        }
      }
      saveState();
    } else {
      // 未打开的工作区文件：标记 M，与已打开文件保持一致
      markWorkspaceModified(data.path);
    }

    renderSidebar();
    await updateToolbarButtons();
  });

  // 文件删除
  eventSource.addEventListener('file-deleted', async (e: any) => {
    const data = JSON.parse(e.data);
    const file = getSessionFile(data.path);

    if (file) {
      file.isMissing = true;
      saveState();
    } else {
      // 未打开文件的删除态只标记在工作区树中，不污染已打开文件列表。
      markWorkspacePathMissing(data.path);
    }

    // 重新渲染侧边栏（支持简单模式和工作区模式）
    renderSidebar();

    // 如果当前正在查看这个文件，仅提示”已删除”并保留当前正文（不做自动刷新替换）
    if (state.currentFile === data.path) {
      renderContent();
      updateToolbarButtons();
      showError('文件已不存在');
    }
  });

  // 文件打开（CLI 触发）
  eventSource.addEventListener('file-opened', async (e: any) => {
    const data = JSON.parse(e.data);
    await onFileLoaded(data, data.focus !== false);
  });

  // 服务端请求状态（用于 mdv tabs）
  eventSource.addEventListener('state-request', async (e: any) => {
    const data = JSON.parse(e.data);
    const requestId = data.requestId;

    if (!requestId) return;

    // 立即响应服务端请求
    const openFiles = Array.from(state.sessionFiles.values()).map((file) => ({
      path: file.path,
      name: file.name,
    }));

    try {
      await fetch('/api/session-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          currentFile: state.currentFile,
          openFiles,
        }),
      });
    } catch (error) {
      console.error('响应状态请求失败:', error);
    }
  });

  eventSource.onerror = () => {
    console.error('SSE 连接断开');
    eventSource.close();
    scheduleReconnect();
  };
}


// ── Browsing signals: dwell + scroll ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  const DWELL_THRESHOLD_MS = 30_000; // 30s 算作一次 dwell
  const SCROLL_DEBOUNCE_MS = 10_000; // 每 10s 最多发一次 scroll 信号
  const SCROLL_MIN_PX = 200;         // 至少滚动 200px 才算

  let dwellStart: number | null = null;
  let dwellFile: string | null = null;
  let dwellTimer: ReturnType<typeof setTimeout> | null = null;
  let scrollDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  let lastScrollTop = 0;
  let scrollAccum = 0;

  function startDwell(): void {
    if (document.hidden) return;
    const file = state.currentFile;
    if (!file) return;
    dwellFile = file;
    dwellStart = Date.now();
    if (dwellTimer) clearTimeout(dwellTimer);
    dwellTimer = setTimeout(() => {
      if (dwellFile && !document.hidden) {
        recordSignal(dwellFile, 'dwell');
      }
      dwellTimer = null;
    }, DWELL_THRESHOLD_MS);
  }

  function pauseDwell(): void {
    if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
    dwellStart = null;
  }

  function resetDwell(): void {
    pauseDwell();
    startDwell();
  }

  // resetDwell is called from switchFile (defined below in this file)
  _resetDwell = () => {
    pauseDwell();
    scrollAccum = 0;
    lastScrollTop = 0;
    startDwell();
  };

  // Pause/resume on visibility change (window minimized, tab switched, etc.)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseDwell();
    } else {
      startDwell();
    }
  });

  // Pause on window blur (switched to another app)
  window.addEventListener('blur', pauseDwell);
  window.addEventListener('focus', () => { if (!document.hidden) startDwell(); });

  // Scroll signal on content area
  document.getElementById('content')?.addEventListener('scroll', (e) => {
    const el = e.target as HTMLElement;
    const delta = Math.abs(el.scrollTop - lastScrollTop);
    lastScrollTop = el.scrollTop;
    scrollAccum += delta;

    if (scrollAccum >= SCROLL_MIN_PX) {
      scrollAccum = 0;
      const file = state.currentFile;
      if (!file) return;
      if (scrollDebounceTimer) return; // already queued
      scrollDebounceTimer = setTimeout(() => {
        scrollDebounceTimer = null;
        if (state.currentFile === file) recordSignal(file, 'scroll');
      }, SCROLL_DEBOUNCE_MS);
    }
  }, { passive: true });

  // Start dwell for the initial file
  startDwell();
}

function startWorkspacePolling() {
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
(async () => {
  console.time('[init] total');
  // 拉取服务端客户端配置
  try {
    console.time('[init] /api/config');
    const res = await fetch('/api/config');
    if (res.ok) {
      const cfg = await res.json();
      if (cfg?.pdf?.defaultScale) {
        setPdfDefaultScale(cfg.pdf.defaultScale);
      }
    }
  } catch {}
  console.timeEnd('[init] /api/config');

  initSidebarWidth();
  initSidebarCollapsed();
  setupSidebarCollapse();

  // 初始化字体缩放
  initZoom({
    getCurrentFile: () => state.currentFile ?? undefined,
    getPdfViewer: (filePath) => pdfViewerRegistry.get(filePath)?.viewer ?? null,
  });

  // Wire zoom input field
  const zoomInput = document.getElementById('fontScaleInput') as HTMLInputElement | null;
  if (zoomInput) {
    let savedValue = '';

    zoomInput.addEventListener('focus', () => {
      savedValue = zoomInput.value;
      zoomInput.select();
    });

    zoomInput.addEventListener('blur', () => {
      setZoomFromInput(zoomInput.value);
      updateZoomDisplay();
    });

    zoomInput.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        zoomInput.blur();
      } else if (e.key === 'Escape') {
        zoomInput.value = savedValue;
        zoomInput.blur();
      }
    });
  }

  // 初始化批注功能
  initAnnotationElements();
  initTodoPanel();
  initTodoExternalCallbacks({
    switchFile: (path) => void switchFile(path),
    switchAnnotationTab: (tab) => switchAnnotationTab(tab as 'comments' | 'chat' | 'todo'),
    openAnnotationSidebar,
  });

  // 预设 RAG 面板 callbacks（renderRagSearchPanel 渲染时会绑定事件委托）
  setRagCallbacks({
    onOpen: () => {},
    switchFile: (path, afterRender) => {
      if (state.sessionFiles.has(path)) {
        void switchFile(path).then(() => afterRender());
      } else {
        void (async () => {
          const data = await loadFile(path);
          if (data) await onFileLoaded(data, true);
          afterRender();
        })();
      }
    },
  });
  initChatPanel();
  initMemoryMonitor(pdfViewerRegistry, switchFile, loadFile, onFileLoaded);
  _setPendingAnnotation = setPendingAnnotation;
  syncAnnotationSidebarLayout();
  window.addEventListener('resize', () => {
    syncAnnotationSidebarLayout();
  });

  window.addEventListener('beforeunload', () => {
    flushUndoQueue();
  });

  console.time('[init] restoreState');
  await restoreState(loadFile);
  console.timeEnd('[init] restoreState');

  applyTheme();

  console.time('[init] hydrateExpandedWorkspaces');
  const failedWorkspaceIds = await hydrateExpandedWorkspaces();
  console.timeEnd('[init] hydrateExpandedWorkspaces');

  if (failedWorkspaceIds.length > 0) {
    failedWorkspaceIds.forEach(markWorkspaceFailed);
  }
  startWorkspacePolling();

  initTocManager({
    getPdfViewerForFile: (filePath) => pdfViewerRegistry.get(filePath)?.viewer ?? null,
  });

  initDiffView({
    renderContent,
    updateToolbarButtons,
    updateToc,
    syncAnnotationsForCurrentFile,
    flashContentUpdated,
    renderMath,
  });

  // 工具栏 + annotation tabs：document 级事件委托，一次性注册
  initToolbarActions(document, {
    handleDiffButtonClick: () => void handleDiffButtonClick(),
    handleRefreshButtonClick,
    showSettingsDialog: showPreferences,
    toggleMonitorPanel,
    switchMonitorTab: (tab) => switchMonitorTab(tab as 'memory' | 'sessions'),
    switchAnnotationTab: (tab) => switchAnnotationTab(tab as 'comments' | 'chat' | 'todo'),
    zoomIn,
    zoomOut,
    setPdfMode: (mode) => setPdfMode(mode as 'select' | 'annotate'),
    handleTranslateButtonClick: () => handleTranslateButtonClick(state.currentFile ?? null),
    addFile: () => {
      const input = document.getElementById('searchInput') as HTMLInputElement;
      if (input) handleSmartAddInput(input.value).catch((err: any) => showError(`添加失败: ${err?.message || '未知错误'}`));
    },
    handleUnifiedInputSubmit: (value?: string) => {
      const input = document.getElementById('searchInput') as HTMLInputElement | null;
      const raw = (typeof value === 'string' ? value : input?.value || '').trim();
      if (!raw) return;
      if (!looksLikePathInput(raw)) {
        searchFilesHandler(raw).catch((err: any) => showError(`搜索失败: ${err?.message || '未知错误'}`));
        return;
      }
      handleSmartAddInput(raw).catch((err: any) => showError(`添加失败: ${err?.message || '未知错误'}`));
    },
    dismissQuickActionConfirm: () => { if (isAddConfirmVisible()) clearAddConfirm(); },
    refreshFile,
  });

  // search box callbacks（sidebar.ts 使用）
  initSearchBoxCallbacks({
    handleUnifiedInputSubmit: (value?: string) => {
      const input = document.getElementById('searchInput') as HTMLInputElement | null;
      const raw = (typeof value === 'string' ? value : input?.value || '').trim();
      if (!raw) return;
      if (!looksLikePathInput(raw)) {
        searchFilesHandler(raw).catch((err: any) => showError(`搜索失败: ${err?.message || '未知错误'}`));
        return;
      }
      handleSmartAddInput(raw).catch((err: any) => showError(`添加失败: ${err?.message || '未知错误'}`));
    },
    dismissQuickActionConfirm: () => { if (isAddConfirmVisible()) clearAddConfirm(); },
    renderContent,
  });

  // 注册 fileList 回调（委托到 .sidebar，一次性注册，永久有效）
  initFileListActions({
    switchFile: (path) => void switchFile(path),
    removeFile: removeFileHandler,
  });

  // 注册 workspace 回调（focus/full tab 文件点击）
  initWorkspaceActions({
    switchFile: (path) => void switchFile(path),
    loadAndSwitchFile: async (path) => {
      const data = await loadFile(path);
      if (data) await onFileLoaded(data, true);
      else {
        const { markFileMissing } = await import('./state');
        markFileMissing(path, true);
        renderAll();
        showError('文件已删除，已标记为 D（无本地缓存）');
      }
    },
  });

  // 注册 tabs 回调（一次性注册，renderTabs 重建 innerHTML 后委托仍有效）
  const tabsContainer = document.getElementById('tabs');
  if (tabsContainer) {
    initTabsActions(tabsContainer, {
      switchFile: (path) => void switchFile(path),
      removeFile: removeFileHandler,
      applyTabBatchAction: (action) => applyTabBatchAction(action as any),
      toggleTabManager,
    });
  }

  // 根据配置渲染侧边栏
  renderSidebar();

  // 拉取批注摘要（失败静默忽略，不阻塞主流程）
  fetchAnnotationSummaries().then((summaries) => {
    setAnnotationSummaries(summaries);
    renderSidebar();
  }).catch(() => {/* 静默忽略 */});

  renderContent();
  console.timeEnd('[init] total');
  syncAnnotationsForCurrentFile(true);
  if (state.currentFile) updateToc(state.currentFile);

  // 面包屑复制按钮：一次性绑定，renderBreadcrumb 重建 innerHTML 后委托仍有效
  document.getElementById('breadcrumb')?.addEventListener('click', (ev) => {
    const btn = (ev.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!btn?.dataset.path) return;
    if (btn.dataset.action === 'copy-relative-path') copyRelativePath(btn.dataset.path, ev);
    else if (btn.dataset.action === 'copy-absolute-path') copyAbsolutePath(btn.dataset.path, ev);
  });

  setupDragAndDrop();
  setupSidebarResize();
  initTocPaneHeight();
  setupTocResize();
  setupTocOpenBtn();
  document.addEventListener('click', (e) => {
    if (!isAddConfirmVisible()) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.sidebar-header')) return;
    if (target.closest('#quickActionConfirm')) return;
    clearAddConfirm();
  });
  handleURLParams();
  const isInputFocused = () => {
    const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea';
  };

  registerAction({
    id: 'escape',
    label: 'Escape',
    category: 'view',
    defaultKey: 'Escape',
    handler: () => {
      if (dismissAnnotationPopupByEscape()) return;
      const qoOverlay = document.querySelector('.quick-open-overlay') as HTMLElement | null;
      if (qoOverlay && qoOverlay.style.display !== 'none') { hideQuickOpen(); return; }
      if (isShortcutsHelpVisible()) { hideShortcutsHelp(); return; }
      const settingsEl = document.getElementById('preferencesOverlay');
      if (settingsEl?.classList.contains('show')) { closePreferences(); return; }
      const addWsEl = document.getElementById('addWorkspaceDialogOverlay');
      if (addWsEl?.classList.contains('show')) { addWsEl.classList.remove('show'); }
    },
  });

  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const modKey = isMac ? 'Cmd' : 'Ctrl';

  registerAction({
    id: 'focus-search',
    label: '聚焦搜索框',
    category: 'view',
    defaultKey: `${modKey}+k`,
    handler: () => {
      const input = document.getElementById('searchInput') as HTMLInputElement | null;
      if (input) { input.focus(); input.select(); }
    },
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'rag-search',
    label: '内容搜索',
    category: 'view',
    defaultKey: `${modKey}+Shift+k`,
    handler: () => {
      document.dispatchEvent(new CustomEvent('sidebar:set-tab', { detail: { tab: 'search' } }));
    },
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'close-file',
    label: '关闭当前文件',
    category: 'file',
    defaultKey: 'Ctrl+w',
    handler: () => {
      const current = state.currentFile;
      if (current) removeFileHandler(current);
    },
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'diff-next',
    label: '下一个变更块',
    category: 'diff',
    defaultKey: 'j',
    context: 'Diff 模式',
    handler: () => navigateDiffBlock(1),
    shouldActivate: () => getDiffViewActive() && !isInputFocused(),
  });

  registerAction({
    id: 'diff-prev',
    label: '上一个变更块',
    category: 'diff',
    defaultKey: 'k',
    context: 'Diff 模式',
    handler: () => navigateDiffBlock(-1),
    shouldActivate: () => getDiffViewActive() && !isInputFocused(),
  });

  // j/k: 在当前侧边栏视角里上下移动文件（非 diff 模式，非输入框）
  registerAction({
    id: 'nav-file-down',
    label: '移到下一个文件',
    category: 'navigation',
    defaultKey: 'j',
    context: '非 Diff 模式',
    handler: () => navigateFileInView(1),
    shouldActivate: () => !getDiffViewActive() && !isInputFocused(),
  });

  registerAction({
    id: 'nav-file-up',
    label: '移到上一个文件',
    category: 'navigation',
    defaultKey: 'k',
    context: '非 Diff 模式',
    handler: () => navigateFileInView(-1),
    shouldActivate: () => !getDiffViewActive() && !isInputFocused(),
  });

  // h/l: tab 左右切换（非输入框）
  registerAction({
    id: 'cycle-tab-next',
    label: '切换到右边的 tab',
    category: 'navigation',
    defaultKey: 'l',
    handler: () => cycleTab(1),
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'cycle-tab-prev',
    label: '切换到左边的 tab',
    category: 'navigation',
    defaultKey: 'h',
    handler: () => cycleTab(-1),
    shouldActivate: () => !isInputFocused(),
  });

  // Ctrl+Tab: captured at window level before browser default (works in Firefox; Chrome ignores it)
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !e.ctrlKey) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    cycleTab(e.shiftKey ? -1 : 1);
  }, { capture: true });

  for (let n = 1; n <= 9; n++) {
    const tabN = n;
    registerAction({
      id: `jump-to-tab-${tabN}`,
      label: `跳到第 ${tabN} 个文件`,
      category: 'navigation',
      defaultKey: `${modKey}+${tabN}`,
      handler: () => jumpToTab(tabN),
    });
  }

  registerAction({
    id: 'quick-open',
    label: '快速打开文件',
    category: 'navigation',
    defaultKey: 'Ctrl+f',
    handler: () => showQuickOpen(),
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'zoom-in',
    label: '放大',
    category: 'view',
    defaultKey: `${modKey}+=`,
    handler: () => zoomIn(),
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'zoom-out',
    label: '缩小',
    category: 'view',
    defaultKey: `${modKey}+-`,
    handler: () => zoomOut(),
    shouldActivate: () => !isInputFocused(),
  });

  initQuickOpen({
    getOpenFilePaths: () => Array.from(state.sessionFiles.keys()),
    openFile: (path) => addFileByPath(path, true),
    switchToOpen: (path) => void switchFile(path),
  });

  initDispatcher();

  // 添加批注文本选中监听
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const filePath = document.getElementById('content')?.getAttribute('data-current-file') || null;
      handleSelectionForAnnotation(filePath);
    }, 0);
  });

  // 拦截 pdf:// 协议链接点击
  document.addEventListener("click", (e) => {
    const target = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute("href") || "";
    if (!href.startsWith("pdf://")) return;
    e.preventDefault();

    // Parse pdf://path/to/file.pdf#page=3&quote=some+text
    const withoutProto = href.slice("pdf://".length);
    const hashIdx = withoutProto.indexOf("#");
    const filePart = hashIdx >= 0 ? withoutProto.slice(0, hashIdx) : withoutProto;
    const paramStr = hashIdx >= 0 ? withoutProto.slice(hashIdx + 1) : "";
    const params = new URLSearchParams(paramStr);
    const pageNum = parseInt(params.get("page") || "1", 10);
    const quote = params.get("quote") || "";

    addFileByPath(filePart).then(() => {
      setTimeout(() => {
        if (currentPdfViewer) {
          currentPdfViewer.scrollToPage(pageNum);
          if (quote) currentPdfViewer.highlightQuote(pageNum, decodeURIComponent(quote));
        }
      }, 500);
    });
  });

  // 拦截 markdown 内部 .md 链接点击，在 mdv 内打开
  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('a[href]') as HTMLAnchorElement | null;
    if (!target) return;
    const href = target.getAttribute('href') || '';
    const currentFile = state.currentFile;
    const absPath = resolveMarkdownLinkPath(href, currentFile);
    if (!absPath) return;
    e.preventDefault();
    addFileByPath(absPath, true);
  });

  // App-level PDF annotation event listeners (registered once, delegate to current bridge)
  document.addEventListener("annotations:loaded", () => {
    currentPdfBridge?.renderHighlights(getAnnotations());
  });
  document.addEventListener("annotation:created", () => {
    currentPdfBridge?.renderHighlights(getAnnotations());
  });
  document.addEventListener("annotation:deleted", () => {
    currentPdfBridge?.renderHighlights(getAnnotations());
  });
  document.addEventListener("annotation:highlights-changed", () => {
    currentPdfBridge?.renderHighlights(getAnnotations());
  });

  // 监听 pdf:show-composer 事件
  document.addEventListener("pdf:show-composer", (e: Event) => {
    const { annotation, filePath, clientX, clientY } = (e as CustomEvent).detail;
    if (_setPendingAnnotation) {
      _setPendingAnnotation(annotation, filePath, clientX, clientY);
    }
  });

  // 页面刷新时，自动刷新当前正在展示的文件

  // PDF temp selection mark 点击处理：失焦后重新点击黄色下划线恢复 composer
  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tempMark = target.closest('mark.pdf-selection-mark-temp');
    if (!tempMark) return;
    if (!tempMark.closest('.pdf-viewer-container')) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = (tempMark as HTMLElement).getBoundingClientRect();
    openComposerFromPending(rect.right + 6, rect.top - 8);
  });

  // PDF annotation mark 点击处理
  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const mark = target.closest('.annotation-mark');
    if (!mark) return;
    if (!mark.closest('.pdf-viewer-container')) return;

    const annotationId = mark.getAttribute('data-annotation-id');
    if (!annotationId) return;

    e.stopPropagation();
    e.preventDefault();

    const annotations = getAnnotations();
    const ann = annotations.find((a: any) => a.id === annotationId);
    if (!ann) return;

    const rect = (mark as HTMLElement).getBoundingClientRect();
    document.dispatchEvent(new CustomEvent('pdf:show-popover', {
      detail: { annotation: ann, x: rect.right + 8, y: rect.top }
    }));
  });
  await refreshCurrentFile();
  connectSSE();
  setupFindBar();

})();

