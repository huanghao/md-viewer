// 导入类型
import type { FileData } from './types';

// 导入状态管理
import { state, saveState, restoreState, addOrUpdateFile, removeFile as removeFileFromState, switchToFile, setSearchQuery, markFileMissing, getSessionFile, saveScrollPosition, markWorkspaceFailed } from './state';
import { clearListDiff, markWorkspaceModified, clearWorkspaceModified, markWorkspacePathMissing, clearWorkspacePathMissing } from './workspace-state';
import { addWorkspace, hydrateExpandedWorkspaces, scanWorkspace, revealFileInWorkspace } from './workspace';

// 导入 API
import { loadFile, searchFiles, getNearbyFiles, openFile, detectPathType } from './api/files';

// 导入工具函数
import { escapeHtml, escapeAttr } from './utils/escape';
import { diffLines } from './utils/diff';
import { formatRelativeTime } from './utils/format';
import { generateDistinctNames } from './utils/file-names';
import { getFileTypeIcon, getFileTypeLabel, isJsonFile, isJsonlFile } from './utils/file-type';

// 导入 UI 组件
import { renderSidebar } from './ui/sidebar';
import { showToast, showSuccess, showError, showWarning, showInfo } from './ui/toast';
import { showSettingsDialog, closeSettingsDialog } from './ui/settings';
import { renderJsonContent } from './ui/json-viewer';
import { mountScrollbar, unmountScrollbar, updateScrollbar, updateDiffMarkers, clearDiffMarkers } from './ui/doc-scrollbar';

import { getMdThemeCss, getHlThemeCss } from './themes/index';

import { fetchAnnotationSummaries } from './api/annotations';
import { setAnnotationSummaries } from './state';

// 导入批注功能
import {
  initAnnotationElements,
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
  openTranslationTab,
  renderTranslationList,
  openComposerFromPending,
} from './annotation';

import { createPdfViewer, type PdfViewerInstance } from "./pdf-viewer.js";
import { clampZoom, zoomStep, pdfZoomKey, MD_ZOOM_MIN, MD_ZOOM_MAX, PDF_ZOOM_MIN, PDF_ZOOM_MAX, PDF_ZOOM_DEFAULT } from './zoom.js';
import { createPdfAnnotationBridge } from "./pdf-annotation.js";
import { extractMdToc, extractPdfOutline, loadSidecar, saveSidecar, scanPdfHeadings } from './toc-extractor.js';
import { renderTocPanel, setActiveTocItem } from './ui/toc-panel.js';
import {
  LocalTranslationProvider,
  getTranslationStats,
  clearTranslationStats,
  loadTranslations,
  unloadTranslations,
  getTranslations,
  translateBlock,
  retryTranslation,
  removeTranslation,
  clearAllTranslations,
  highlightTranslationBlock,
} from "./pdf-translation.js";

declare global {
  function cleanupAllExpiredRecords(): number;
}

function applyTheme(): void {
  const mdCss = getMdThemeCss(state.config.markdownTheme || 'github');
  const hlCss = getHlThemeCss(state.config.codeTheme || 'github');

  const mdStyle = document.getElementById('theme-md-css');
  const hlStyle = document.getElementById('theme-hl-css');

  if (mdStyle) mdStyle.textContent = mdCss;
  if (hlStyle) hlStyle.textContent = hlCss;
}

const SIDEBAR_WIDTH_STORAGE_KEY = 'md-viewer:sidebar-width';
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 680;
const fileRefreshSeq = new Map<string, number>();
let diffViewActive = false;
let workspacePollRunning = false;
let mermaidInitialized = false;
let currentPdfViewer: PdfViewerInstance | null = null;
let currentPdfBridge: ReturnType<typeof createPdfAnnotationBridge> | null = null;
const translationProvider = new LocalTranslationProvider();

// PDF viewer registry: tracks all open PDF viewers and their idle timers
const PDF_IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
interface PdfViewerEntry {
  viewer: PdfViewerInstance;
  lastActiveAt: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
  savedScrollTop?: number;
}
const pdfViewerRegistry = new Map<string, PdfViewerEntry>();

function evictPdfViewer(filePath: string): void {
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) clearTimeout(entry.idleTimer);
  entry.viewer.destroy();
  if ((window as any).__currentPdfViewer === entry.viewer) {
    (window as any).__currentPdfViewer = null;
  }
  pdfViewerRegistry.delete(filePath);
}

function scheduleEviction(filePath: string): void {
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
  if (shouldFocus) updateToc(data.path);
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
  const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
  const width = Number.isFinite(saved) && saved > 0 ? saved : SIDEBAR_DEFAULT_WIDTH;
  applySidebarWidth(width);
}

const SIDEBAR_COLLAPSED_KEY = 'md-viewer:sidebar-collapsed';

function setSidebarCollapsed(collapsed: boolean): void {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}

function initSidebarCollapsed(): void {
  const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
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

  let dragging = false;

  const onMove = (event: MouseEvent) => {
    if (!dragging) return;
    const width = clampSidebarWidth(event.clientX);
    applySidebarWidth(width);
  };

  const onUp = (event: MouseEvent) => {
    if (!dragging) return;
    dragging = false;
    const width = clampSidebarWidth(event.clientX);
    applySidebarWidth(width);
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
    document.body.classList.remove('sidebar-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  resizer.addEventListener('mousedown', (event) => {
    if (window.innerWidth <= 900) return;
    dragging = true;
    document.body.classList.add('sidebar-resizing');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    event.preventDefault();
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

const TOC_PANE_HEIGHT_KEY = 'md-viewer:toc-pane-height';
const TOC_OPEN_BY_FILE_KEY = 'md-viewer:toc-open-by-file';

function loadTocOpenByFile(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(TOC_OPEN_BY_FILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveTocOpenForFile(filePath: string, open: boolean): void {
  const map = loadTocOpenByFile();
  map[filePath] = open;
  localStorage.setItem(TOC_OPEN_BY_FILE_KEY, JSON.stringify(map));
}

function applyTocVisibility(filePath: string): void {
  const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
  if (!sidebar) return;
  const map = loadTocOpenByFile();
  // Default: open (only close if explicitly saved as false)
  if (map[filePath] === false) {
    sidebar.classList.remove('toc-visible');
  } else {
    sidebar.classList.add('toc-visible');
  }
}

function setupTocOpenBtn(): void {
  document.getElementById('tocOpenBtn')?.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
    if (!sidebar) return;
    sidebar.classList.add('toc-visible');
    if (state.currentFile) saveTocOpenForFile(state.currentFile, true);
  });
  // Wire close callback for toc-panel.ts
  (window as any).__onTocClose = () => {
    if (state.currentFile) saveTocOpenForFile(state.currentFile, false);
  };
}
const TOC_PANE_DEFAULT_HEIGHT = 240;
const TOC_PANE_MIN_HEIGHT = 80;
const TOC_PANE_MAX_HEIGHT = 600;

function applyTocPaneHeight(height: number): void {
  document.documentElement.style.setProperty('--toc-pane-height', `${height}px`);
}

function initTocPaneHeight(): void {
  const saved = localStorage.getItem(TOC_PANE_HEIGHT_KEY);
  const parsed = saved ? parseInt(saved, 10) : NaN;
  applyTocPaneHeight(Number.isFinite(parsed) && parsed > 0 ? parsed : TOC_PANE_DEFAULT_HEIGHT);
}

function setupTocResize(): void {
  const resizer = document.getElementById('tocResizer');
  const pane = document.getElementById('tocPane');
  if (!resizer || !pane) return;

  let startY = 0;
  let startHeight = 0;

  const onMouseMove = (e: MouseEvent) => {
    const delta = startY - e.clientY;
    const newHeight = Math.min(TOC_PANE_MAX_HEIGHT, Math.max(TOC_PANE_MIN_HEIGHT, startHeight + delta));
    applyTocPaneHeight(newHeight);
  };

  const onMouseUp = (e: MouseEvent) => {
    resizer.classList.remove('dragging');
    document.body.classList.remove('toc-resizing');
    const delta = startY - e.clientY;
    const newHeight = Math.min(TOC_PANE_MAX_HEIGHT, Math.max(TOC_PANE_MIN_HEIGHT, startHeight + delta));
    localStorage.setItem(TOC_PANE_HEIGHT_KEY, String(newHeight));
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  resizer.addEventListener('mousedown', (e: MouseEvent) => {
    startY = e.clientY;
    startHeight = pane.getBoundingClientRect().height;
    resizer.classList.add('dragging');
    document.body.classList.add('toc-resizing');
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    e.preventDefault();
  });
}

function getActivePdfViewer(): PdfViewerInstance | null {
  if (!state.currentFile) return null;
  return pdfViewerRegistry.get(state.currentFile)?.viewer ?? null;
}

// Resolve a single outline dest (array or named string) to a page index (0-based)
async function resolveOutlineDest(dest: any, pdfDoc: any): Promise<number | null> {
  try {
    let resolved = dest;
    if (typeof dest === 'string') {
      resolved = await pdfDoc.getDestination(dest);
    }
    if (!Array.isArray(resolved) || !resolved[0]) return null;
    const ref = resolved[0];
    if (typeof ref === 'object' && 'num' in ref) {
      return await pdfDoc.getPageIndex(ref);
    }
  } catch { /* ignore */ }
  return null;
}

async function resolveOutlinePageNums(nodes: any[], pdfDoc: any, items: TocItem[]): Promise<void> {
  let i = 0;
  async function walk(ns: any[], its: TocItem[]) {
    for (let j = 0; j < ns.length; j++) {
      const pageIdx = await resolveOutlineDest(ns[j].dest, pdfDoc);
      if (pageIdx !== null) its[j].pageNum = pageIdx + 1;
      await walk(ns[j].items ?? [], its[j].children);
    }
  }
  await walk(nodes, items);
}

async function updateToc(filePath: string): Promise<void> {
  const panel = document.getElementById('tocPanel');
  if (!panel) return;

  // Always clean up the MD scroll handler when switching files
  const contentEl = document.getElementById('content');
  const prevHandler = contentEl && (contentEl as any).__tocScrollHandler;
  if (prevHandler && contentEl) {
    contentEl.removeEventListener('scroll', prevHandler);
    (contentEl as any).__tocScrollHandler = null;
  }

  const isPdf = filePath.endsWith('.pdf');
  const lower = filePath.toLowerCase();
  const isMd = lower.endsWith('.md') || lower.endsWith('.markdown');

  if (!isPdf && !isMd) {
    renderTocPanel(panel, [], () => {});
    return;
  }

  if (isMd) {
    const file = state.sessionFiles.get(filePath);
    const content = file?.content ?? '';
    if (!content) {
      // File not yet loaded — stay in loading state, updateToc will be called again via onFileLoaded
      renderTocPanel(panel, [], () => {}, true);
      return;
    }
    const toc = extractMdToc(content);

    // toolbar (48px) + tabs (~36px) = offset so heading isn't hidden under fixed headers
    const HEADER_OFFSET = 90;
    const jumpToMdHeading = (title: string) => {
      const headings = Array.from(document.querySelectorAll<HTMLElement>('#reader h1, #reader h2, #reader h3'));
      const target = headings.find(h => h.textContent?.trim() === title);
      if (target) {
        const contentEl = document.getElementById('content');
        if (contentEl) {
          contentEl.scrollTo({ top: target.offsetTop - HEADER_OFFSET, behavior: 'instant' });
        } else {
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }
    };

    renderTocPanel(panel, toc, item => jumpToMdHeading(item.title));
    applyTocVisibility(filePath);

    // Highlight active TOC item on scroll
    const contentEl = document.getElementById('content');
    if (contentEl && panel) {
      const onScroll = () => {
        const headings = Array.from(document.querySelectorAll<HTMLElement>('#reader h1, #reader h2, #reader h3'));
        if (!headings.length) return;
        const scrollTop = contentEl.scrollTop;
        let current = headings[0];
        for (const h of headings) {
          if (h.offsetTop <= scrollTop + HEADER_OFFSET) current = h;
        }
        const title = current?.textContent?.trim() ?? '';
        if (title) setActiveTocItem(panel, undefined, title);
      };
      // Remove previous listener if any
      const prev = (contentEl as any).__tocScrollHandler;
      if (prev) contentEl.removeEventListener('scroll', prev);
      (contentEl as any).__tocScrollHandler = onScroll;
      contentEl.addEventListener('scroll', onScroll);
    }
    return;
  }

  const pdfJump = (item: TocItem) => {
    if (item.pageNum) pdfViewerRegistry.get(filePath)?.viewer?.scrollToPage(item.pageNum);
  };

  const showPdfToc = (toc: TocItem[]) => {
    renderTocPanel(panel, toc, pdfJump);
    applyTocVisibility(filePath);
    attachPdfScrollHighlight(panel);
  };

  // PDF: try sidecar first
  const sidecar = await loadSidecar(filePath);
  if (sidecar) {
    showPdfToc(sidecar);
    return;
  }

  // PDF: wait for viewer to be ready, then try outline
  const viewer = getActivePdfViewer();
  if (!viewer) return;

  renderTocPanel(panel, [], () => {}, true); // loading state

  try {
    const pdfDoc = viewer.getPdfDoc();
    const outline = await pdfDoc.getOutline();
    if (outline && outline.length > 0) {
      const toc = extractPdfOutline(outline);
      await resolveOutlinePageNums(outline, pdfDoc, toc);
      saveSidecar(filePath, toc).catch(() => {});
      showPdfToc(toc);
      return;
    }
  } catch (err) {
    console.error('[TOC] outline read failed:', err);
    // fall through to scan
  }

  // PDF: lazy scan via pdfjs doc (works on all pages, not just rendered ones)
  try {
    await scanPdfHeadings(
      filePath,
      viewer.getPdfDoc(),
      toc => showPdfToc(toc)
    );
  } catch (err) {
    console.error('[TOC] scan failed:', err);
    panel.innerHTML = `<div class="toc-error">目录加载失败<br><span class="toc-error-detail">${String(err)}</span></div>`;
  }
}

function attachPdfScrollHighlight(panel: HTMLElement): void {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  const onScroll = () => {
    const wrappers = contentEl.querySelectorAll<HTMLElement>('.pdf-page-wrapper');
    if (!wrappers.length) return;
    const mid = contentEl.scrollTop + contentEl.clientHeight / 2;
    let currentPage = 1;
    for (const w of wrappers) {
      if (w.offsetTop <= mid) currentPage = parseInt(w.dataset.page || '1', 10);
    }
    setActiveTocItem(panel, currentPage);
  };

  const prev = (contentEl as any).__tocScrollHandler;
  if (prev) contentEl.removeEventListener('scroll', prev);
  (contentEl as any).__tocScrollHandler = onScroll;
  contentEl.addEventListener('scroll', onScroll);
  // Run once immediately to set initial state
  onScroll();
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
    if (diffViewActive) {
      diffViewActive = false;
      const diffBtn = document.getElementById('diffButton');
      if (diffBtn) diffBtn.classList.remove('active');
      const banner = document.getElementById('diffBanner');
      if (banner) banner.remove();
    }
    renderContent();
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

function normalizeJoinedPath(baseDir: string, relativePath: string): string {
  const merged = `${baseDir}/${relativePath}`;
  const isAbsolute = merged.startsWith('/');
  const parts = merged.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
      continue;
    }
    stack.push(part);
  }
  return `${isAbsolute ? '/' : ''}${stack.join('/')}`;
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
  if (!diffViewActive) container.classList.remove('diff-active');

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
      localStorage.setItem(`md-viewer:pdf-scroll:${path}`, String(container.scrollTop));
      entry.viewer.el.remove();
    }
    if (path !== state.currentFile) scheduleEviction(path);
  }
  currentPdfViewer = null;
  (window as any).__currentPdfViewer = null;
  currentPdfBridge = null;
  container.removeAttribute('data-pdf');

  // If switching away from PDF, clear translation list
  if (!state.currentFile || !isPdfPath(state.currentFile)) {
    unloadTranslations();
    renderTranslationList(null, getTranslations, () => {}, () => {});
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

    const refreshTranslationList = () => {
      renderTranslationList(
        filePath,
        getTranslations,
        (pageNum, startItemIdx) => {
          removeTranslation(filePath, pageNum, startItemIdx);
          refreshTranslationList();
        },
        (pageNum, startItemIdx, endItemIdx) => {
          const blockY = startItemIdx / 10;
          currentPdfViewer?.scrollToBlockY(pageNum, blockY);
          if (currentPdfViewer) highlightTranslationBlock(currentPdfViewer, pageNum, startItemIdx, endItemIdx);
        },
        (pageNum, startItemIdx) => {
          const entry = getTranslations().find(
            (t) => t.pageNum === pageNum && t.startItemIdx === startItemIdx
          );
          if (!entry) return;
          retryTranslation(entry, filePath, translationProvider, refreshTranslationList);
        }
      );
      const keys = new Set(getTranslations()
        .filter(t => t.translatedText)
        .map(t => `${t.pageNum}:${t.startItemIdx}`));
      currentPdfViewer?.markTranslatedIcons(keys);
    };

    // Load persisted translations and render immediately
    loadTranslations(filePath);
    refreshTranslationList();

    const clearBtn = document.getElementById('translationClearBtn');
    if (clearBtn) {
      const newBtn = clearBtn.cloneNode(true) as HTMLElement;
      clearBtn.parentNode?.replaceChild(newBtn, clearBtn);
      newBtn.addEventListener('click', () => {
        clearAllTranslations(filePath);
        refreshTranslationList();
      });
    }

    // Reuse existing viewer if available — re-attach its el to container
    const existingEntry = pdfViewerRegistry.get(filePath);
    if (existingEntry) {
      currentPdfViewer = existingEntry.viewer;
      currentPdfBridge = createPdfAnnotationBridge({
        filePath,
        viewer: existingEntry.viewer,
        getAnnotations: () => getAnnotations(),
        onAnnotationCreated: () => {
          currentPdfBridge?.renderHighlights(getAnnotations());
        },
      });
      (window as any).__currentPdfViewer = existingEntry.viewer;
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
      refreshTranslationList();
      updateToc(filePath);
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
      onParagraphClick: (block) => {
        translateBlock(block, filePath, translationProvider, refreshTranslationList);
        openTranslationTab();
      },
      onPageRendered: (_pageNum) => {
        // Page just became visible — replay annotation highlights for it
        currentPdfBridge?.renderHighlights(getAnnotations());
        // Update scrollbar after first page renders (scrollHeight is now > clientHeight)
        updateScrollbar();
      },
    }).then((pdfViewerInstance) => {
      currentPdfViewer = pdfViewerInstance;
      container.setAttribute('data-current-file', filePath);
      const savedScroll = Number(localStorage.getItem(`md-viewer:pdf-scroll:${filePath}`));
      pdfViewerRegistry.set(filePath, {
        viewer: pdfViewerInstance,
        lastActiveAt: Date.now(),
        idleTimer: null,
        savedScrollTop: Number.isFinite(savedScroll) && savedScroll > 0 ? savedScroll : undefined,
      });
      if (savedScroll > 0) container.scrollTop = savedScroll;
      (window as any).__currentPdfViewer = pdfViewerInstance;
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
      // hover 「译」按钮 → 高亮右侧翻译列表对应条目
      pdfViewerInstance.el.addEventListener('pdf-translate-hover', (e) => {
        const { pageNum, startItemIdx, active } = (e as CustomEvent).detail;
        const key = `${pageNum}:${startItemIdx}`;
        document.querySelector<HTMLElement>(`.translation-item[data-key="${key}"]`)
          ?.classList.toggle('is-highlighted', active);
      });
      updateToc(filePath);
    });
    return; // don't fall through to markdown renderer
  }

  // 使用 marked 渲染 Markdown
  const html = (window as any).marked.parse(file.content);
  const deletedNotice = file.isMissing
    ? `
      <div class="content-file-status deleted">
        该文件已从磁盘删除，当前内容为本地缓存快照。
      </div>
    `
    : '';
  container.innerHTML = `${deletedNotice}<div class="markdown-body" id="reader">${html}</div>`;
  container.setAttribute('data-current-file', file.path);
  container.scrollTop = file.savedScrollTop ?? 0;
  rewriteMarkdownAssetUrls(container, file.path);
  void renderMermaidDiagrams(container);
  renderMath(container);

  // 应用批注高亮
  applyAnnotations();

  // 更新面包屑
  renderBreadcrumb();

  // 挂载自定义滚动条
  unmountScrollbar();
  mountScrollbar();
  unmountPdfPageIndicator(container);

  // 更新工具栏按钮
  updateToolbarButtons();
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
    <button class="copy-filename-button" onclick="copyFilePath('${escapeAttr(file.path)}', event)" title="复制相对路径 / ⌥+点击复制绝对路径">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">复制相对路径</span>
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
        <div class="nearby-menu-item" onclick="window.addFileByPath('${escapeAttr(f.path)}', true)">
          📄 ${escapeHtml(f.name)}
        </div>
      `).join('')}
    `;

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
  if (diffViewActive) {
    diffViewActive = false;
    const diffBtn = document.getElementById('diffButton');
    if (diffBtn) diffBtn.classList.remove('active');
    const banner = document.getElementById('diffBanner');
    if (banner) banner.remove();
  }
  const previousFile = state.currentFile;
  switchToFile(path);
  updateZoomDisplay();
  renderSidebar();

  // Immediately show loading state to avoid stale TOC during transition
  const tocPanel = document.getElementById('tocPanel');
  if (tocPanel) renderTocPanel(tocPanel, [], () => {}, true);

  renderContent();
  if (!isPdfPath(path)) updateToc(path);
  syncAnnotationsForCurrentFile(true);
  await updateToolbarButtons();
}

// 移除文件（关闭标签页和从列表删除是同一个操作）
function removeFileHandler(path: string) {
  // Immediately evict PDF viewer if this file is being closed
  if (isPdfPath(path)) evictPdfViewer(path);
  removeFileFromState(path);
  renderSidebar();
  renderContent();
  syncAnnotationsForCurrentFile(true);
  // Clear TOC when file is closed
  const panel = document.getElementById('tocPanel');
  if (panel) renderTocPanel(panel, [], () => {});
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

// ==================== 键盘快捷键 ====================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dismissAnnotationPopupByEscape()) {
        e.preventDefault();
        return;
      }
      const settingsOverlay = document.getElementById('settingsDialogOverlay');
      if (settingsOverlay?.classList.contains('show')) {
        e.preventDefault();
        closeSettingsDialog();
        return;
      }
      const addWorkspaceOverlay = document.getElementById('addWorkspaceDialogOverlay');
      if (addWorkspaceOverlay?.classList.contains('show')) {
        e.preventDefault();
        addWorkspaceOverlay.classList.remove('show');
        return;
      }
    }

    // Cmd-K (Mac) 或 Ctrl-K (Windows/Linux) 聚焦搜索框
    // 如果焦点在 textarea/input 里（如评论框），不拦截，让 Emacs 快捷键生效
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input') return;
      e.preventDefault();
      const input = document.getElementById('searchInput') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }

    // Cmd-W (Mac) 或 Ctrl-W (Windows/Linux) 关闭当前标签页
    if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
      e.preventDefault(); // 阻止关闭浏览器标签

      // 如果有当前文件，关闭它
      if (state.currentFile) {
        removeFileHandler(state.currentFile);
      }
    }

    // n / p：diff 视图中跳转差异块
    if (diffViewActive && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        if (e.key === 'n') {
          e.preventDefault();
          navigateDiffBlock(1);
          return;
        }
        if (e.key === 'p') {
          e.preventDefault();
          navigateDiffBlock(-1);
          return;
        }
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

// ==================== Diff 视图 ====================

async function loadPendingContent(path: string): Promise<string | null> {
  const file = state.sessionFiles.get(path);
  if (!file) return null;
  if (file.pendingContent !== undefined) return file.pendingContent;
  const data = await loadFile(path, true);
  if (!data) return null;
  file.pendingContent = data.content;
  return data.content;
}

function renderInlineDiffHTML(lines: import('./utils/diff').DiffLine[]): { html: string; totalBlocks: number } {
  type Segment =
    | { kind: 'equal'; lines: typeof lines }
    | { kind: 'delete'; lines: typeof lines }
    | { kind: 'insert'; lines: typeof lines }
    | { kind: 'modify'; delLines: typeof lines; insLines: typeof lines };

  const segments: Segment[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.type === 'equal') {
      const batch: typeof lines = [];
      while (i < lines.length && lines[i].type === 'equal') batch.push(lines[i++]);
      segments.push({ kind: 'equal', lines: batch });
    } else if (l.type === 'delete') {
      const delBatch: typeof lines = [];
      while (i < lines.length && lines[i].type === 'delete') delBatch.push(lines[i++]);
      if (i < lines.length && lines[i].type === 'insert') {
        const insBatch: typeof lines = [];
        while (i < lines.length && lines[i].type === 'insert') insBatch.push(lines[i++]);
        segments.push({ kind: 'modify', delLines: delBatch, insLines: insBatch });
      } else {
        segments.push({ kind: 'delete', lines: delBatch });
      }
    } else {
      const batch: typeof lines = [];
      while (i < lines.length && lines[i].type === 'insert') batch.push(lines[i++]);
      segments.push({ kind: 'insert', lines: batch });
    }
  }

  const md = (s: string) => (window as any).marked.parse(s);

  // 将严格相邻（无 equal 间隔）的变更段合并为 group
  type Group = { segments: Segment[]; hasChange: boolean };
  const groups: Group[] = [];
  let currentGroup: Group = { segments: [], hasChange: false };

  for (const seg of segments) {
    if (seg.kind !== 'equal') {
      currentGroup.segments.push(seg);
      currentGroup.hasChange = true;
    } else {
      if (currentGroup.hasChange) groups.push(currentGroup);
      groups.push({ segments: [seg], hasChange: false });
      currentGroup = { segments: [], hasChange: false };
    }
  }
  if (currentGroup.hasChange) groups.push(currentGroup);

  let blockIndex = 0;
  let html = '<div class="markdown-body diff-inline-body">';

  for (const group of groups) {
    if (!group.hasChange) {
      // 纯 equal 上下文，直接渲染
      for (const seg of group.segments) {
        if (seg.kind === 'equal') {
          html += md(seg.lines.map(l => l.content).join('\n'));
        }
      }
      continue;
    }

    // 变更 group：外层包 diff-group
    html += `<div class="diff-group" data-block-index="${blockIndex}">`;
    for (const seg of group.segments) {
      if (seg.kind === 'equal') {
        html += `<div class="diff-group-context">${md(seg.lines.map(l => l.content).join('\n'))}</div>`;
      } else if (seg.kind === 'delete') {
        const inner = md(seg.lines.map(l => l.content).join('\n'));
        html += `<div class="diff-block diff-block-delete">${inner}</div>`;
      } else if (seg.kind === 'insert') {
        const inner = md(seg.lines.map(l => l.content).join('\n'));
        html += `<div class="diff-block diff-block-insert">${inner}</div>`;
      } else {
        const delInner = md(seg.delLines.map(l => l.content).join('\n'));
        const insInner = md(seg.insLines.map(l => l.content).join('\n'));
        html += `<div class="diff-block diff-block-modify-del">${delInner}</div>`;
        html += `<div class="diff-block diff-block-modify-ins">${insInner}</div>`;
      }
    }
    html += '</div>';
    blockIndex++;
  }

  html += '</div>';
  return { html, totalBlocks: blockIndex };
}

function renderDiffView(oldContent: string, newContent: string): void {
  currentDiffBlockIndex = -1;
  const container = document.getElementById('content');
  if (!container) return;

  const lines = diffLines(oldContent, newContent);
  const hasChanges = lines.some(l => l.type !== 'equal');

  if (!hasChanges) {
    container.innerHTML = `
      <div class="diff-no-changes">文件内容与磁盘一致，无差异</div>
    `;
    return;
  }

  const { html: bodyHTML, totalBlocks } = renderInlineDiffHTML(lines);

  // 更新 banner（banner 元素在 #content 之外，由 handleDiffButtonClick 注入）
  const banner = document.getElementById('diffBanner');
  if (banner) {
    const countEl = banner.querySelector<HTMLElement>('#diffNavCount');
    if (countEl) countEl.textContent = `1 / ${totalBlocks}`;
    const prevBtn = banner.querySelector<HTMLButtonElement>('#diffNavPrev');
    const nextBtn = banner.querySelector<HTMLButtonElement>('#diffNavNext');
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = totalBlocks <= 1;
  }

  container.innerHTML = bodyHTML;

  // 更新滚动条 diff 标记
  unmountScrollbar();
  mountScrollbar();
  const diffGroups: Array<{ el: HTMLElement; kind: 'insert' | 'delete' | 'modify' }> = [];
  container.querySelectorAll<HTMLElement>('.diff-group[data-block-index]').forEach(groupEl => {
    const hasInsert = groupEl.querySelector('.diff-block-insert, .diff-block-modify-ins');
    const hasDelete = groupEl.querySelector('.diff-block-delete, .diff-block-modify-del');
    const kind = (hasInsert && hasDelete) ? 'modify' : hasInsert ? 'insert' : 'delete';
    diffGroups.push({ el: groupEl, kind });
  });
  updateDiffMarkers(diffGroups);

  // 自动跳到第一个 block
  navigateDiffBlock(1);
}

async function handleDiffButtonClick(): Promise<void> {
  if (!state.currentFile) return;
  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  if (diffViewActive) {
    closeDiffView();
    return;
  }

  const newContent = await loadPendingContent(state.currentFile);
  if (newContent === null) return;

  diffViewActive = true;
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.add('active');
  document.getElementById('content')?.classList.add('diff-active');

  // 插入 banner 到 #content 父元素
  const contentEl = document.getElementById('content');
  const parent = contentEl?.parentElement;
  if (parent && !document.getElementById('diffBanner')) {
    const banner = document.createElement('div');
    banner.id = 'diffBanner';
    banner.className = 'diff-banner';
    banner.innerHTML = `
      <span class="diff-banner-label">Diff 模式 · 显示新版本变更</span>
      <button class="diff-nav-btn" id="diffNavPrev" onclick="window.navigateDiffBlock(-1)" disabled>↑ 上一处</button>
      <span class="diff-nav-count" id="diffNavCount">- / -</span>
      <button class="diff-nav-btn" id="diffNavNext" onclick="window.navigateDiffBlock(1)">↓ 下一处</button>
      <button class="diff-accept-btn" onclick="window.acceptDiffUpdate()">✓ 采用新版本</button>
      <button class="diff-close-btn" onclick="window.closeDiffView()">✕ 关闭</button>
    `;
    parent.insertBefore(banner, contentEl);
  }

  renderDiffView(file.content, newContent);
}

function closeDiffView(): void {
  diffViewActive = false;
  currentDiffBlockIndex = -1;
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.remove('active');
  document.getElementById('content')?.classList.remove('diff-active');

  // 移除 banner
  const banner = document.getElementById('diffBanner');
  if (banner) banner.remove();

  clearDiffMarkers();
  renderContent();
}

let currentDiffBlockIndex = -1; // -1 表示未激活任何 block

function navigateDiffBlock(direction: 1 | -1): void {
  const contentEl = document.getElementById('content');
  if (!contentEl) return;

  // 找所有 diff-group 元素，按 DOM 顺序收集
  const blockEls: HTMLElement[] = [];
  contentEl.querySelectorAll<HTMLElement>('.diff-group[data-block-index]').forEach(el => {
    blockEls.push(el);
  });
  const totalBlocks = blockEls.length;
  if (totalBlocks === 0) return;

  const nextIndex = currentDiffBlockIndex === -1
    ? (direction === 1 ? 0 : totalBlocks - 1)
    : Math.max(0, Math.min(totalBlocks - 1, currentDiffBlockIndex + direction));

  if (nextIndex === currentDiffBlockIndex && currentDiffBlockIndex !== -1) return;

  // 移除旧 focus
  contentEl.querySelectorAll<HTMLElement>('.diff-focused').forEach(el => {
    el.classList.remove('diff-focused');
  });

  // 加新 focus（同一 blockIndex 的所有元素，即 modify 的 del+ins 两个都高亮）
  contentEl.querySelectorAll<HTMLElement>(`.diff-group[data-block-index="${nextIndex}"]`).forEach(el => {
    el.classList.add('diff-focused');
  });

  // 滚动到第一个匹配元素
  blockEls[nextIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

  currentDiffBlockIndex = nextIndex;

  // 更新 banner 计数和按钮状态
  const countEl = document.getElementById('diffNavCount');
  if (countEl) countEl.textContent = `${nextIndex + 1} / ${totalBlocks}`;
  const prevBtn = document.getElementById('diffNavPrev') as HTMLButtonElement | null;
  const nextBtn = document.getElementById('diffNavNext') as HTMLButtonElement | null;
  if (prevBtn) prevBtn.disabled = nextIndex === 0;
  if (nextBtn) nextBtn.disabled = nextIndex === totalBlocks - 1;
}

async function acceptDiffUpdate(): Promise<void> {
  if (!state.currentFile) return;
  const file = state.sessionFiles.get(state.currentFile);
  if (!file || file.pendingContent === undefined) return;

  file.content = file.pendingContent;
  file.pendingContent = undefined;
  file.displayedModified = file.lastModified;
  saveState();

  diffViewActive = false;
  const diffBtn = document.getElementById('diffButton');
  if (diffBtn) diffBtn.classList.remove('active');
  const banner = document.getElementById('diffBanner');
  if (banner) banner.remove();
  document.getElementById('content')?.classList.remove('diff-active');
  currentDiffBlockIndex = -1;
  clearDiffMarkers();
  renderContent();
  updateToc(state.currentFile);
  syncAnnotationsForCurrentFile(false);
  flashContentUpdated();
  renderSidebar();
  await updateToolbarButtons();
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
  const isAlt = event instanceof MouseEvent && event.altKey;
  if (isAlt) {
    copyTextWithFeedback(filePath, event, '已复制绝对路径');
    return;
  }
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

// 兼容旧调用
function copyFileName(fileName: string, event?: Event) {
  copyFilePath(fileName, event);
}


// ==================== 缩放功能 ====================
let currentFontScale = 1.0;

function initFontScale() {
  const saved = localStorage.getItem('fontScale');
  if (saved) currentFontScale = parseFloat(saved);
  applyFontScale();
}

function applyFontScale() {
  document.documentElement.style.setProperty('--font-scale', currentFontScale.toString());
  localStorage.setItem('fontScale', currentFontScale.toString());
  updateZoomDisplay();
}

function zoomIn() {
  if (isPdfPath(state.currentFile ?? '')) {
    adjustPdfZoom(+1);
  } else {
    currentFontScale = clampZoom(zoomStep(currentFontScale, +1), MD_ZOOM_MIN, MD_ZOOM_MAX);
    applyFontScale();
  }
}

function zoomOut() {
  if (isPdfPath(state.currentFile ?? '')) {
    adjustPdfZoom(-1);
  } else {
    currentFontScale = clampZoom(zoomStep(currentFontScale, -1), MD_ZOOM_MIN, MD_ZOOM_MAX);
    applyFontScale();
  }
}

function zoomReset() {
  if (isPdfPath(state.currentFile ?? '')) {
    setPdfZoomValue(state.currentFile!, PDF_ZOOM_DEFAULT);
  } else {
    currentFontScale = 1.0;
    applyFontScale();
  }
}

// PDF zoom — per-file, debounced re-render
let pdfZoomDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function adjustPdfZoom(direction: 1 | -1) {
  if (!state.currentFile) return;
  const current = getPdfZoom(state.currentFile);
  const next = clampZoom(zoomStep(current, direction), PDF_ZOOM_MIN, PDF_ZOOM_MAX);
  setPdfZoomValue(state.currentFile, next);
}

function setPdfZoomValue(filePath: string, scale: number) {
  localStorage.setItem(pdfZoomKey(filePath), String(scale));
  updateZoomDisplay();
  if (pdfZoomDebounceTimer) clearTimeout(pdfZoomDebounceTimer);
  pdfZoomDebounceTimer = setTimeout(async () => {
    const viewer = pdfViewerRegistry.get(filePath)?.viewer;
    if (viewer) await viewer.setScale(scale);
  }, 300);
}

function getPdfZoom(filePath: string): number {
  return parseFloat(localStorage.getItem(pdfZoomKey(filePath)) ?? String(PDF_ZOOM_DEFAULT));
}

function updateZoomDisplay() {
  const btn = document.getElementById('fontScaleText');
  if (!btn) return;
  if (isPdfPath(state.currentFile ?? '')) {
    const scale = getPdfZoom(state.currentFile!);
    btn.textContent = `${Math.round(scale * 100)}%`;
  } else {
    btn.textContent = `${Math.round(currentFontScale * 100)}%`;
  }
}

// ==================== 系统监控浮窗 ====================
const MEM_PER_PAGE_MB = 27; // A4 @ scale=1.5, dpr=2
let monitorPollTimer: ReturnType<typeof setInterval> | null = null;
let monitorActiveTab: 'memory' | 'translation' = 'memory';

function getPdfMemStats(): Array<{ path: string; rendered: number; total: number; memMB: number; idleMins: number | null }> {
  return Array.from(pdfViewerRegistry.entries()).map(([path, entry]) => {
    const rendered = entry.viewer.getRenderedCount();
    const total = entry.viewer.getTotalPages();
    const memMB = rendered * MEM_PER_PAGE_MB;
    const idleSecs = entry.idleTimer ? (PDF_IDLE_TIMEOUT_MS - (Date.now() - entry.lastActiveAt)) / 1000 : null;
    const idleMins = idleSecs !== null ? Math.max(0, Math.round(idleSecs / 60)) : null;
    return { path: path.split('/').pop() || path, rendered, total, memMB, idleMins };
  });
}

function renderMemoryTab(): void {
  const el = document.getElementById('monitorTabMemory');
  if (!el) return;
  const stats = getPdfMemStats();
  if (stats.length === 0) {
    el.innerHTML = '<div class="pdf-mem-row pdf-mem-empty">暂无 PDF 数据</div>';
    return;
  }
  const totalMB = stats.reduce((s, r) => s + r.memMB, 0);
  el.innerHTML = stats.map(r => `
    <div class="pdf-mem-row">
      <span class="pdf-mem-name" title="${r.path}">${r.path}</span>
      <span class="pdf-mem-pages">${r.rendered}/${r.total} 页</span>
      <span class="pdf-mem-mb">~${r.memMB}MB</span>
      ${r.idleMins !== null ? `<span class="pdf-mem-idle">${r.idleMins}min 后回收</span>` : ''}
    </div>
  `).join('') + `<div class="pdf-mem-total">合计 ~${totalMB}MB</div>`;
}

function renderTranslationTab(): void {
  const el = document.getElementById('monitorTabTranslation');
  if (!el) return;
  const s = getTranslationStats();
  const avgMs = s.totalCalls > 0 ? Math.round(s.totalDurationMs / s.totalCalls) : 0;

  const statRows = [
    ['服务商', 'MyMemory'],
    ['总调用', String(s.totalCalls)],
    ['成功', String(s.successCalls), s.successCalls > 0 ? 'is-ok' : ''],
    ['失败', String(s.failCalls), s.failCalls > 0 ? 'is-error' : ''],
    ['平均延迟', s.totalCalls > 0 ? `${avgMs}ms` : '—'],
    ['最慢一次', s.maxDurationMs > 0 ? `${s.maxDurationMs}ms` : '—'],
    ['发送字符', s.totalCharsSent > 0 ? s.totalCharsSent.toLocaleString() : '0'],
    ['接收字符', s.totalCharsReceived > 0 ? s.totalCharsReceived.toLocaleString() : '0'],
  ] as [string, string, string?][];

  const callRows = [...s.recentCalls].reverse().map(r => {
    const t = new Date(r.time);
    const hms = `${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}:${String(t.getSeconds()).padStart(2,'0')}`;
    const text = r.ok ? `${r.charsSent}→${r.charsReceived} 字符` : (r.error || '失败');
    return `<div class="monitor-call-row${r.ok ? '' : ' is-error'}">
      <span class="monitor-call-time">${hms}</span>
      <span class="monitor-call-dur">${r.durationMs}ms</span>
      <span class="monitor-call-status">${r.ok ? '✓' : '✗'}</span>
      <span class="monitor-call-text" title="${text}">${text}</span>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="monitor-stat-section">统计</div>
    ${statRows.map(([k, v, cls]) => `
      <div class="monitor-stat-row">
        <span class="monitor-stat-key">${k}</span>
        <span class="monitor-stat-val${cls ? ' ' + cls : ''}">${v}</span>
      </div>`).join('')}
    <div class="monitor-calls-header">
      <span class="monitor-calls-title">最近调用</span>
      <button class="monitor-clear-btn" onclick="clearMonitorTranslationStats()">清除统计</button>
    </div>
    ${callRows || '<div class="pdf-mem-row pdf-mem-empty">暂无调用记录</div>'}
  `;
}

function updateMonitorPanel(): void {
  if (monitorActiveTab === 'memory') renderMemoryTab();
  else renderTranslationTab();
}

function switchMonitorTab(tab: 'memory' | 'translation'): void {
  monitorActiveTab = tab;
  document.querySelectorAll('.monitor-tab').forEach(btn => {
    btn.classList.toggle('is-active', (btn as HTMLElement).textContent?.trim() === (tab === 'memory' ? '内存' : '翻译'));
  });
  const memEl = document.getElementById('monitorTabMemory');
  const trEl = document.getElementById('monitorTabTranslation');
  if (memEl) memEl.style.display = tab === 'memory' ? '' : 'none';
  if (trEl) trEl.style.display = tab === 'translation' ? '' : 'none';
  updateMonitorPanel();
}

function toggleMonitorPanel(): void {
  const panel = document.getElementById('monitorPanel');
  if (!panel) return;
  const isVisible = panel.style.display !== 'none';
  if (isVisible) {
    panel.style.display = 'none';
    if (monitorPollTimer) { clearInterval(monitorPollTimer); monitorPollTimer = null; }
  } else {
    panel.style.display = 'block';
    updateMonitorPanel();
    monitorPollTimer = setInterval(updateMonitorPanel, 2000);
  }
}

function clearMonitorTranslationStats(): void {
  clearTranslationStats();
  renderTranslationTab();
}

// ==================== 键盘缩放快捷键 ====================
const IS_MAC = navigator.platform.toUpperCase().includes('MAC');
document.addEventListener('keydown', (e: KeyboardEvent) => {
  const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;
  const mod = IS_MAC ? e.metaKey : e.ctrlKey;
  if (!mod) return;
  if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
  else if (e.key === '-') { e.preventDefault(); zoomOut(); }
  else if (e.key === '0') { e.preventDefault(); zoomReset(); }
});

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

function updateTranslationStatus(up: boolean | null) {
  const dot = document.getElementById('translationStatusDot');
  if (!dot) return;
  if (up === true) {
    dot.className = 'translation-status-dot up';
    dot.title = '翻译服务已连接';
  } else if (up === false) {
    dot.className = 'translation-status-dot down';
    dot.title = '翻译服务未连接';
  } else {
    dot.className = 'translation-status-dot';
    dot.title = '翻译服务启动中…';
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
      }
    } catch {
      // 忽略单个文件的错误
    }
  }

  if (hasUpdate) {
    saveState();
    renderSidebar();
    await updateToolbarButtons();

    // 如果当前文件有更新，给用户提示
    const currentFile = state.currentFile ? state.sessionFiles.get(state.currentFile) : null;
    if (currentFile && currentFile.pendingContent !== undefined) {
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

  // 翻译服务状态
  eventSource.addEventListener('translate-status', (e: any) => {
    const data = JSON.parse(e.data);
    updateTranslationStatus(data.up);
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

// ==================== 暴露全局函数 ====================
declare global {
  interface Window {
    addFile: () => void;
    handleUnifiedInputSubmit?: (value?: string) => void;
    dismissQuickActionConfirm?: () => void;
    switchFile: (path: string) => void;
    removeFile: (path: string) => void;
    showNearbyMenu: (e: Event) => void;
    addFileByPath: (path: string, focus: boolean) => void;
    refreshFile: (path: string) => void;
    handleRefreshButtonClick: () => void;
    handleDiffButtonClick: () => void;
    closeDiffView: () => void;
    acceptDiffUpdate: () => void;
    copySingleText: (text: string, e?: Event) => void;
    copyFileName: (fileName: string, event?: Event) => void;
    copyFilePath: (filePath: string, event?: Event) => void;
    showToast?: (message: string, type: string) => void;
    showSettingsDialog: () => void;
    toggleMonitorPanel: () => void;
    switchMonitorTab: (tab: 'memory' | 'translation') => void;
    clearMonitorTranslationStats: () => void;
    switchAnnotationTab: (tab: 'comments' | 'translation') => void;
    zoomReset: () => void;
    openExternalFile?: (path: string) => void | Promise<void>;
    renderContent?: () => void;
    applyTheme?: () => void;
  }
}

window.addFile = () => {
  const input = document.getElementById('searchInput') as HTMLInputElement;
  if (input) {
    handleSmartAddInput(input.value).catch((err: any) => {
      showError(`添加失败: ${err?.message || '未知错误'}`);
    });
  }
};
window.handleUnifiedInputSubmit = (value?: string) => {
  const input = document.getElementById('searchInput') as HTMLInputElement | null;
  const raw = (typeof value === 'string' ? value : input?.value || '').trim();
  if (!raw) return;
  if (!looksLikePathInput(raw)) {
    searchFilesHandler(raw).catch((err: any) => {
      showError(`搜索失败: ${err?.message || '未知错误'}`);
    });
    return;
  }
  handleSmartAddInput(raw).catch((err: any) => {
    showError(`添加失败: ${err?.message || '未知错误'}`);
  });
};
window.dismissQuickActionConfirm = () => {
  if (isAddConfirmVisible()) {
    clearAddConfirm();
  }
};
window.switchFile = switchFile;
window.removeFile = removeFileHandler;
window.showNearbyMenu = showNearbyMenu;
window.addFileByPath = addFileByPath;
window.refreshFile = refreshFile;
window.handleRefreshButtonClick = handleRefreshButtonClick;
window.handleDiffButtonClick = handleDiffButtonClick;
window.closeDiffView = closeDiffView;
(window as any).navigateDiffBlock = navigateDiffBlock;
window.acceptDiffUpdate = acceptDiffUpdate;
window.copySingleText = copySingleText;
window.copyFileName = copyFileName;
window.copyFilePath = copyFilePath;
window.showToast = showToast;
window.showSettingsDialog = showSettingsDialog;
window.toggleMonitorPanel = toggleMonitorPanel;
window.switchMonitorTab = switchMonitorTab;
window.clearMonitorTranslationStats = clearMonitorTranslationStats;
window.switchAnnotationTab = switchAnnotationTab;
window.zoomReset = zoomReset;
window.openExternalFile = openFileInBrowser;
window.renderContent = renderContent;
(window as any).applyTheme = applyTheme;

function startWorkspacePolling() {
  window.setInterval(async () => {
    if (workspacePollRunning) return;
    if (state.config.sidebarTab === 'list') return;

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
  // 拉取服务端客户端配置
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const cfg = await res.json();
      if (cfg?.pdf?.defaultScale) {
        (window as any).__pdfDefaultScale = cfg.pdf.defaultScale;
      }
    }
  } catch {}

  initSidebarWidth();
  initSidebarCollapsed();
  setupSidebarCollapse();

  // 初始化字体缩放
  initFontScale();

  // 初始化批注功能
  initAnnotationElements();
  (window as any).__setPendingAnnotation = setPendingAnnotation;
  syncAnnotationSidebarLayout();
  window.addEventListener('resize', () => {
    syncAnnotationSidebarLayout();
  });

  await restoreState(loadFile);
  applyTheme();  // apply saved theme preference
  const failedWorkspaceIds = await hydrateExpandedWorkspaces();
  if (failedWorkspaceIds.length > 0) {
    failedWorkspaceIds.forEach(markWorkspaceFailed);
  }
  startWorkspacePolling();

  // 根据配置渲染侧边栏
  renderSidebar();

  // 拉取批注摘要（失败静默忽略，不阻塞主流程）
  fetchAnnotationSummaries().then((summaries) => {
    setAnnotationSummaries(summaries);
    renderSidebar();
  }).catch(() => {/* 静默忽略 */});

  renderContent();
  syncAnnotationsForCurrentFile(true);
  if (state.currentFile) updateToc(state.currentFile);

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
  setupKeyboardShortcuts();

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
    if ((window as any).__setPendingAnnotation) {
      (window as any).__setPendingAnnotation(annotation, filePath, clientX, clientY);
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

// ==================== 页面内查找 ====================
function setupFindBar() {
  // 创建 find bar DOM
  const bar = document.createElement('div');
  bar.id = 'findBar';
  bar.innerHTML = `
    <input id="findBarInput" type="text" placeholder="查找..." autocomplete="off" spellcheck="false" />
    <span id="findBarCount"></span>
    <button id="findBarPrev" title="上一个 (⇧⌘G)">&#8593;</button>
    <button id="findBarNext" title="下一个 (⌘G)">&#8595;</button>
    <button id="findBarClose" title="关闭 (Esc)">&#10005;</button>
  `;
  document.body.appendChild(bar);

  const input = document.getElementById('findBarInput') as HTMLInputElement;
  const countEl = document.getElementById('findBarCount') as HTMLElement;
  const prevBtn = document.getElementById('findBarPrev') as HTMLButtonElement;
  const nextBtn = document.getElementById('findBarNext') as HTMLButtonElement;
  const closeBtn = document.getElementById('findBarClose') as HTMLButtonElement;

  let matches: Range[] = [];
  let currentIndex = -1;
  let highlightContainer: HTMLElement | null = null;

  function clearHighlights() {
    if (highlightContainer) {
      // unwrap all highlight spans
      highlightContainer.querySelectorAll('mark.find-highlight').forEach((mark) => {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ''), mark);
          parent.normalize();
        }
      });
    }
    matches = [];
    currentIndex = -1;
    countEl.textContent = '';
  }

  function escapeRegex(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatches(query: string) {
    clearHighlights();
    if (!query) return;

    const content = document.getElementById('content');
    if (!content) return;
    highlightContainer = content;

    const regex = new RegExp(escapeRegex(query), 'gi');
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'mark') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const textNodes: Text[] = [];
    let node: Node | null;
    while ((node = walker.nextNode())) textNodes.push(node as Text);

    for (const textNode of textNodes) {
      const text = textNode.textContent || '';
      let match: RegExpExecArray | null;
      const parts: (string | HTMLElement)[] = [];
      let lastIndex = 0;
      regex.lastIndex = 0;
      while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
        const mark = document.createElement('mark');
        mark.className = 'find-highlight';
        mark.textContent = match[0];
        parts.push(mark);
        matches.push(document.createRange()); // placeholder
        lastIndex = match.index + match[0].length;
      }
      if (parts.length === 0) continue;
      if (lastIndex < text.length) parts.push(text.slice(lastIndex));

      const frag = document.createDocumentFragment();
      parts.forEach((p) => {
        if (typeof p === 'string') frag.appendChild(document.createTextNode(p));
        else frag.appendChild(p);
      });
      textNode.parentNode!.replaceChild(frag, textNode);
    }

    // re-collect actual mark elements
    matches = [];
    content.querySelectorAll('mark.find-highlight').forEach((m) => {
      const r = document.createRange();
      r.selectNode(m);
      matches.push(r);
    });

    if (matches.length > 0) {
      currentIndex = 0;
      scrollToMatch(0);
    }
    updateCount();
  }

  function scrollToMatch(index: number) {
    const content = document.getElementById('content');
    if (!content) return;
    const marks = content.querySelectorAll('mark.find-highlight');
    marks.forEach((m, i) => {
      m.classList.toggle('find-highlight-current', i === index);
    });
    const current = marks[index] as HTMLElement | undefined;
    if (current) current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function updateCount() {
    if (matches.length === 0) {
      countEl.textContent = input.value ? '无结果' : '';
      countEl.className = input.value ? 'no-result' : '';
    } else {
      countEl.textContent = `${currentIndex + 1} / ${matches.length}`;
      countEl.className = '';
    }
  }

  function next() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex + 1) % matches.length;
    scrollToMatch(currentIndex);
    updateCount();
  }

  function prev() {
    if (matches.length === 0) return;
    currentIndex = (currentIndex - 1 + matches.length) % matches.length;
    scrollToMatch(currentIndex);
    updateCount();
  }

  function show() {
    bar.classList.add('visible');
    input.focus();
    input.select();
    if (input.value) highlightMatches(input.value);
  }

  function hide() {
    bar.classList.remove('visible');
    clearHighlights();
  }

  // 暴露给 Swift 调用
  (window as any).__showFindBar = show;

  input.addEventListener('input', () => highlightMatches(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.shiftKey ? prev() : next();
      e.preventDefault();
    } else if (e.key === 'Escape') {
      hide();
      e.preventDefault();
    }
  });
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  closeBtn.addEventListener('click', hide);
}
