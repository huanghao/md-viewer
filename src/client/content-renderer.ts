// Content rendering module — extracted from main.ts (Task B1)
// Contains: isMarkdownContent, resolveMarkdownAssetSrc, rewriteMarkdownAssetUrls,
//           renderMath, renderMermaidDiagrams, mountPdfPageIndicator, unmountPdfPageIndicator,
//           renderContent, renderBreadcrumb, showNearbyMenu, flashContentUpdated
//           and helper functions: isHtmlPath, isJsonPath, isPdfPath, isUrlPath, applyPdfModeButtons

import type { PdfViewerEntry } from './pdf-registry';
import type { PdfViewerInstance } from './pdf-viewer.js';

import { state, saveScrollPosition } from './state';
import { updateStatusbarFile } from './statusbar';
import { getNearbyFiles } from './api/files';
import { escapeHtml, escapeAttr } from './utils/escape';
import { normalizeJoinedPath } from './utils/md-link';
import { renderJsonContent } from './ui/json-viewer';
import { mountScrollbar, unmountScrollbar, updateScrollbar } from './ui/doc-scrollbar';
import { getMdThemeCss, getHlThemeCss } from './themes/index';
import {
  invalidateAnnotationElementsCache,
  applyAnnotations,
  getAnnotations,
} from './annotation';
import { updateToc } from './toc-manager';
import { createPdfViewer } from './pdf-viewer.js';
import { createPdfAnnotationBridge } from './pdf-annotation.js';
import { currentPdfViewer, setCurrentPdfViewer } from './pdf-state';
import { storageGet, storageGetNumber, storageSet } from './utils/storage';
import { getPdfZoom } from './zoom-controller';
import { injectParaIds, initTranslation } from './translation';
import { getDiffViewActive } from './diff-view';
import { protectMath } from './utils/math-protect';
import { showInfo, showError } from './ui/toast';

// ── Module-level variables ────────────────────────────────────────────────────
let mermaidInitialized = false;
let pdfPageIndicatorScrollHandler: (() => void) | null = null;

const PDF_MODE_KEY = 'md-viewer:pdf-mode';

// ── Injected deps (set via initContentRenderer) ───────────────────────────────
let _pdfViewerRegistry: Map<string, PdfViewerEntry> | null = null;
let _currentPdfBridge: { value: ReturnType<typeof createPdfAnnotationBridge> | null } | null = null;
let _evictPdfViewer: ((filePath: string) => void) | null = null;
let _scheduleEviction: ((filePath: string) => void) | null = null;
let _cancelEviction: ((filePath: string) => void) | null = null;
let _updateToolbarButtons: (() => Promise<void>) | null = null;
let _syncAnnotationsForCurrentFile: ((force?: boolean) => void) | null = null;
let _addFileByPath: ((path: string, focus?: boolean) => Promise<void>) | null = null;

export interface ContentRendererDeps {
  pdfViewerRegistry: Map<string, PdfViewerEntry>;
  currentPdfBridgeRef: { value: ReturnType<typeof createPdfAnnotationBridge> | null };
  evictPdfViewer: (filePath: string) => void;
  scheduleEviction: (filePath: string) => void;
  cancelEviction: (filePath: string) => void;
  updateToolbarButtons: () => Promise<void>;
  syncAnnotationsForCurrentFile: (force?: boolean) => void;
  addFileByPath: (path: string, focus?: boolean) => Promise<void>;
}

export function initContentRenderer(deps: ContentRendererDeps): void {
  _pdfViewerRegistry = deps.pdfViewerRegistry;
  _currentPdfBridge = deps.currentPdfBridgeRef;
  _evictPdfViewer = deps.evictPdfViewer;
  _scheduleEviction = deps.scheduleEviction;
  _cancelEviction = deps.cancelEviction;
  _updateToolbarButtons = deps.updateToolbarButtons;
  _syncAnnotationsForCurrentFile = deps.syncAnnotationsForCurrentFile;
  _addFileByPath = deps.addFileByPath;
}

// ── Path type helpers ─────────────────────────────────────────────────────────
export function isHtmlPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm');
}

export function isJsonPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.json') || lower.endsWith('.jsonl');
}

export function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith('.pdf');
}

export function isUrlPath(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

function applyPdfModeButtons(mode: 'select' | 'annotate'): void {
  const isAnnotate = mode === 'annotate';
  const selectBtn = document.getElementById('pdfModeSelectBtn');
  const annotateBtn = document.getElementById('pdfModeAnnotateBtn');
  if (selectBtn) selectBtn.classList.toggle('is-active', !isAnnotate);
  if (annotateBtn) annotateBtn.classList.toggle('is-active', isAnnotate);
}

// ── Content type detection ────────────────────────────────────────────────────
export function isMarkdownContent(file: { name: string; path: string }): boolean {
  const lower = `${file.name} ${file.path}`.toLowerCase();
  return lower.includes('.md') || lower.includes('.markdown');
}

// ── Asset URL resolution ──────────────────────────────────────────────────────
export function resolveMarkdownAssetSrc(src: string, currentFilePath: string): string | null {
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

export function rewriteMarkdownAssetUrls(container: HTMLElement, currentFilePath: string): void {
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

// ── Math rendering ────────────────────────────────────────────────────────────
export function renderMath(container: HTMLElement): void {
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

// ── Mermaid rendering ─────────────────────────────────────────────────────────
export async function renderMermaidDiagrams(container: HTMLElement): Promise<void> {
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

// ── PDF page indicator ────────────────────────────────────────────────────────
export function mountPdfPageIndicator(viewer: PdfViewerInstance, container: HTMLElement): void {
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

export function unmountPdfPageIndicator(container: HTMLElement): void {
  const indicator = document.getElementById('pdfPageIndicator');
  if (indicator) indicator.style.display = 'none';
  if (pdfPageIndicatorScrollHandler) {
    container.removeEventListener('scroll', pdfPageIndicatorScrollHandler);
    pdfPageIndicatorScrollHandler = null;
  }
}

// ── Flash content updated ─────────────────────────────────────────────────────
export function flashContentUpdated(): void {
  const container = document.getElementById('content');
  if (!container) return;
  container.style.animation = 'flash 700ms ease-out';
  setTimeout(() => {
    container.style.animation = '';
  }, 700);
}

// ── Breadcrumb rendering ──────────────────────────────────────────────────────
export function renderBreadcrumb() {
  const container = document.getElementById('breadcrumb');
  if (!container || !state.currentFile) {
    if (container) container.innerHTML = '';
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  const parts = file.path.split('/').filter(Boolean);
  const visibleParts = parts.slice(-2);
  const hasPrefix = parts.length > 2;

  const breadcrumbItems = [
    hasPrefix ? `<span class="breadcrumb-item breadcrumb-ellipsis" title="${escapeAttr(file.path)}">…</span><span class="breadcrumb-separator">/</span>` : '',
    ...visibleParts.map((part, i) => {
      const isLast = i === visibleParts.length - 1;
      return isLast
        ? `<span class="breadcrumb-item active" title="${escapeAttr(file.path)}">${escapeHtml(part)}</span>`
        : `<span class="breadcrumb-item" title="${escapeAttr(file.path)}">${escapeHtml(part)}</span><span class="breadcrumb-separator">/</span>`;
    }),
  ].join('');

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
    <button class="copy-filename-button open-in-editor-button" data-action="open-in-editor" data-path="${escapeAttr(file.path)}" title="在 VS Code 中打开">
      <span class="open-editor-icon">↗</span>
    </button>
  `;

  const charCount = file.content.trim().length;
  updateStatusbarFile(charCount, file.createdAt);
}

// ── Nearby menu ───────────────────────────────────────────────────────────────
export async function showNearbyMenu(e: Event) {
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
      showInfo('附近没有其他 Markdown 文件');
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
      if (item?.dataset.path) void _addFileByPath!(item.dataset.path, true);
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

// ── Main content rendering ────────────────────────────────────────────────────
export function renderContent() {
  const container = document.getElementById('content');
  if (!container) return;
  if (!getDiffViewActive()) container.classList.remove('diff-active');

  // Save scroll position of the outgoing MD file before switching content.
  const outgoingFile = container.getAttribute('data-current-file');
  if (outgoingFile && !isPdfPath(outgoingFile) && outgoingFile !== state.currentFile) {
    saveScrollPosition(outgoingFile, container.scrollTop);
  }

  const pdfViewerRegistry = _pdfViewerRegistry!;

  // Detach all PDF viewer elements from container so innerHTML resets don't destroy them.
  // Save scroll position before detaching so we can restore it when switching back.
  // Schedule eviction for PDFs that are no longer current.
  for (const [path, entry] of pdfViewerRegistry.entries()) {
    if (entry.viewer.el.parentNode) {
      entry.savedScrollTop = container.scrollTop;
      storageSet(`md-viewer:pdf-scroll:${path}`, container.scrollTop);
      entry.viewer.el.remove();
    }
    if (path !== state.currentFile) _scheduleEviction!(path);
  }
  setCurrentPdfViewer(null);
  _currentPdfBridge!.value = null;
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
    _updateToolbarButtons!();
    return;
  }

  if (isJsonPath(file.path)) {
    container.setAttribute('data-current-file', file.path);
    container.innerHTML = '';
    const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
    const query = searchInput?.value?.trim() ?? '';
    renderJsonContent(container, file.content, file.path, query);
    renderBreadcrumb();
    _updateToolbarButtons!();
    return;
  }

  if (isPdfPath(file.path)) {
    const filePath = file.path;
    const scale = getPdfZoom(filePath);

    // Cancel any pending eviction for this file (user came back)
    _cancelEviction!(filePath);

    // Mark container as PDF mode — CSS handles padding adjustments
    container.setAttribute('data-pdf', '1');

    // Reuse existing viewer if available — re-attach its el to container
    const existingEntry = pdfViewerRegistry.get(filePath);
    if (existingEntry) {
      _currentPdfBridge!.value = createPdfAnnotationBridge({
        filePath,
        viewer: existingEntry.viewer,
        getAnnotations: () => getAnnotations(),
        onAnnotationCreated: () => {
          _currentPdfBridge!.value?.renderHighlights(getAnnotations());
        },
      });
      setCurrentPdfViewer(existingEntry.viewer);
      existingEntry.viewer.onAnnotationClick = (annotationId: string, clientX: number, clientY: number) => {
        _currentPdfBridge!.value?.handleAnnotationClick(annotationId, clientX, clientY);
      };
      container.innerHTML = '';
      container.appendChild(existingEntry.viewer.el);
      if (existingEntry.savedScrollTop !== undefined) {
        container.scrollTop = existingEntry.savedScrollTop;
      }
      container.setAttribute('data-current-file', filePath);
      renderBreadcrumb();
      _updateToolbarButtons!();
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
        _currentPdfBridge!.value?.handleTextSelected(pageNum, selectedText, prefix, suffix, clientX, clientY, startItemIdx, endItemIdx);
      },
      onPageRendered: (_pageNum) => {
        // Page just became visible — replay annotation highlights for it
        _currentPdfBridge!.value?.renderHighlights(getAnnotations());
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
        _currentPdfBridge!.value?.handleAnnotationClick(annotationId, clientX, clientY);
      };
      _currentPdfBridge!.value = createPdfAnnotationBridge({
        filePath,
        viewer: pdfViewerInstance,
        getAnnotations: () => getAnnotations(),
        onAnnotationCreated: (_ann) => {
          _currentPdfBridge!.value?.renderHighlights(getAnnotations());
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
  _updateToolbarButtons!();
  if (file.path) initTranslation(file.path);
}
