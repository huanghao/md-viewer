// Content rendering module — extracted from main.ts (Task B1)
// Contains: isMarkdownContent, resolveMarkdownAssetSrc, rewriteMarkdownAssetUrls,
//           renderMath, renderMermaidDiagrams, mountPdfPageIndicator, unmountPdfPageIndicator,
//           renderContent, renderBreadcrumb, showNearbyMenu, flashContentUpdated
//           and helper functions: isHtmlPath, isJsonPath, isPdfPath, isUrlPath, applyPdfModeButtons

import { highlightCodeBlocks } from './utils/code-highlight';
import { sanitizeHtml } from './utils/html-sanitize';

import { toolbarStore } from './toolbar/store';
import { pdfPageIndicatorStore } from './pdf-page-indicator/store';
import type { PdfViewerEntry } from './pdf-registry';
import type { PdfViewerInstance } from './pdf-viewer.js';

import { state, saveScrollPosition } from './state';
import { updateStatusbarFile } from './statusbar';
import { getNearbyFiles } from './api/files';
import { escapeHtml, escapeAttr } from './utils/escape';
import { normalizeJoinedPath } from './utils/md-link';
import { renderJsonContent } from './ui/json-viewer';
import { mountScrollbar, unmountScrollbar, updateScrollbar } from './ui/doc-scrollbar';
import {
  invalidateAnnotationElementsCache,
  applyAnnotations,
  getAnnotations,
} from './annotation';
import { updateToc } from './toc-manager';
import { HTML_READER_HOST_ID } from './annotation-layout';
import { createPdfViewer } from './pdf-viewer.js';
import { createPdfAnnotationBridge } from './pdf-annotation.js';
import { setCurrentPdfViewer } from './pdf-state';
import { storageGet, storageGetNumber, storageSet } from './utils/storage';
import { getPdfZoom } from './zoom-controller';
import { pdfScrollKey } from './zoom';
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
let _scheduleEviction: ((filePath: string) => void) | null = null;
let _cancelEviction: ((filePath: string) => void) | null = null;
let _updateToolbarButtons: (() => Promise<void>) | null = null;
let _addFileByPath: ((path: string, focus?: boolean) => Promise<void>) | null = null;

export interface ContentRendererDeps {
  pdfViewerRegistry: Map<string, PdfViewerEntry>;
  currentPdfBridgeRef: { value: ReturnType<typeof createPdfAnnotationBridge> | null };
  scheduleEviction: (filePath: string) => void;
  cancelEviction: (filePath: string) => void;
  updateToolbarButtons: () => Promise<void>;
  addFileByPath: (path: string, focus?: boolean) => Promise<void>;
}

export function initContentRenderer(deps: ContentRendererDeps): void {
  _pdfViewerRegistry = deps.pdfViewerRegistry;
  _currentPdfBridge = deps.currentPdfBridgeRef;
  _scheduleEviction = deps.scheduleEviction;
  _cancelEviction = deps.cancelEviction;
  _updateToolbarButtons = deps.updateToolbarButtons;
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
  toolbarStore.setPdf(true, mode);
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

export function rewriteMarkdownAssetUrls(
  container: HTMLElement,
  currentFilePath: string,
  root?: Element | null
): void {
  const target = root ?? container.querySelector('.markdown-body');
  if (!target) return;

  target.querySelectorAll('img[src], video[src], source[src]').forEach((el) => {
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
const MERMAID_ZOOM_MIN = 0.25;
const MERMAID_ZOOM_MAX = 4;
const MERMAID_ZOOM_STEP = 1.25;

function getMermaidSvgSize(svgEl: SVGSVGElement): { width: number; height: number } {
  const vb = svgEl.viewBox?.baseVal;
  if (vb && vb.width > 0 && vb.height > 0) return { width: vb.width, height: vb.height };
  const rect = svgEl.getBoundingClientRect();
  return { width: rect.width || 800, height: rect.height || 600 };
}

function createMermaidActionButton(label: string, title: string, onClick: () => void): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'mermaid-zoom-btn';
  btn.textContent = label;
  btn.title = title;
  btn.addEventListener('click', onClick);
  return btn;
}

// 内联缩放：svg 保持自然尺寸，外层 wrapper 用 transform scale + 手动撑开布局尺寸，
// 让宿主容器的原生滚动条充当平移手段。返回 fit() 供插入 DOM 后调用。
function attachMermaidZoom(actions: HTMLElement, host: HTMLElement, svgEl: SVGSVGElement): { fit: () => void } {
  const { width, height } = getMermaidSvgSize(svgEl);
  svgEl.style.maxWidth = 'none';
  svgEl.style.width = `${width}px`;
  svgEl.style.height = `${height}px`;
  svgEl.style.margin = '0';
  svgEl.style.transformOrigin = '0 0';

  const zoomWrap = document.createElement('div');
  zoomWrap.className = 'mermaid-zoom';
  host.insertBefore(zoomWrap, svgEl);
  zoomWrap.appendChild(svgEl);

  let scale = 1;
  const fitScale = (): number => Math.min(1, (host.clientWidth - 16) / width);
  const apply = (next: number): void => {
    scale = Math.min(MERMAID_ZOOM_MAX, Math.max(MERMAID_ZOOM_MIN, next));
    zoomWrap.style.width = `${Math.round(width * scale)}px`;
    zoomWrap.style.height = `${Math.round(height * scale)}px`;
    svgEl.style.transform = `scale(${scale})`;
  };

  actions.appendChild(createMermaidActionButton('－', '缩小', () => apply(scale / MERMAID_ZOOM_STEP)));
  actions.appendChild(createMermaidActionButton('＋', '放大', () => apply(scale * MERMAID_ZOOM_STEP)));
  actions.appendChild(createMermaidActionButton('适应宽度', '缩放以适应内容宽度', () => apply(fitScale())));
  actions.appendChild(createMermaidActionButton('全屏', '全屏查看（滚轮缩放、拖拽平移）', () => openMermaidLightbox(svgEl)));

  apply(fitScale());
  return { fit: () => apply(fitScale()) };
}

// 全屏查看：克隆 svg 到遮罩层，滚轮以光标为中心缩放，拖拽平移，Esc/按钮关闭
function openMermaidLightbox(sourceSvg: SVGSVGElement): void {
  const { width, height } = getMermaidSvgSize(sourceSvg);

  const overlay = document.createElement('div');
  overlay.className = 'mermaid-lightbox';
  const toolbar = document.createElement('div');
  toolbar.className = 'mermaid-lightbox-toolbar';
  const stage = document.createElement('div');
  stage.className = 'mermaid-lightbox-stage';

  const svgEl = sourceSvg.cloneNode(true) as SVGSVGElement;
  svgEl.style.transform = '';
  stage.appendChild(svgEl);

  let scale = 1;
  let tx = 0;
  let ty = 0;
  const clamp = (s: number): number => Math.min(8, Math.max(0.05, s));
  const applyTransform = (): void => {
    svgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
    label.textContent = `${Math.round(scale * 100)}%`;
  };
  const stageCenter = (): { x: number; y: number } => {
    const rect = stage.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  };
  const zoomAt = (clientX: number, clientY: number, factor: number): void => {
    const rect = stage.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    const next = clamp(scale * factor);
    const k = next / scale;
    tx = px - (px - tx) * k;
    ty = py - (py - ty) * k;
    scale = next;
    applyTransform();
  };
  const fitToStage = (): void => {
    const sw = stage.clientWidth;
    const sh = stage.clientHeight;
    if (sw === 0 || sh === 0) return;
    scale = clamp(Math.min(sw / width, sh / height) * 0.95);
    tx = (sw - width * scale) / 2;
    ty = (sh - height * scale) / 2;
    applyTransform();
  };

  const label = document.createElement('span');
  label.className = 'mermaid-lightbox-zoom-label';
  const close = (): void => {
    document.removeEventListener('keydown', onKeyDown);
    overlay.remove();
  };
  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close();
  };

  toolbar.appendChild(createMermaidActionButton('－', '缩小', () => {
    const c = stageCenter();
    zoomAt(c.x, c.y, 1 / MERMAID_ZOOM_STEP);
  }));
  toolbar.appendChild(label);
  toolbar.appendChild(createMermaidActionButton('＋', '放大', () => {
    const c = stageCenter();
    zoomAt(c.x, c.y, MERMAID_ZOOM_STEP);
  }));
  toolbar.appendChild(createMermaidActionButton('重置', '适应窗口', fitToStage));
  toolbar.appendChild(createMermaidActionButton('关闭', '关闭（Esc）', close));

  stage.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.2 : 1 / 1.2);
  }, { passive: false });

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  stage.addEventListener('pointerdown', (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    stage.classList.add('panning');
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', (e: PointerEvent) => {
    if (!dragging) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    applyTransform();
  });
  const endPan = (): void => {
    dragging = false;
    stage.classList.remove('panning');
  };
  stage.addEventListener('pointerup', endPan);
  stage.addEventListener('pointercancel', endPan);

  overlay.appendChild(toolbar);
  overlay.appendChild(stage);
  document.body.appendChild(overlay);
  document.addEventListener('keydown', onKeyDown);
  fitToStage();
}

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

      const host = document.createElement('div');
      host.className = 'mermaid';
      host.setAttribute('data-mdv-mermaid', '1');
      host.innerHTML = svg;

      let zoom: { fit: () => void } | null = null;
      const svgEl = host.querySelector('svg');
      if (svgEl) {
        zoom = attachMermaidZoom(actions, host, svgEl as SVGSVGElement);
      }
      const { panel, toggleButton } = createMermaidSourcePanel(source, false);
      actions.appendChild(toggleButton);

      block.appendChild(actions);
      block.appendChild(host);
      block.appendChild(panel);
      preEl.replaceWith(block);
      // 插入 DOM 后容器宽度才可用，重新按宽度适配一次
      zoom?.fit();

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
// 页码指示器的显示内容由 pdfPageIndicatorStore 驱动，React 外壳负责渲染；
// 这里只负责在滚动时同步当前页，并把跳转动作交给 viewer。
function currentVisiblePdfPage(container: HTMLElement): number {
  const wrappers = container.querySelectorAll<HTMLElement>('.pdf-page-wrapper');
  const mid = container.scrollTop + container.clientHeight / 2;
  let best = 1;
  for (const w of wrappers) {
    if (w.offsetTop <= mid) best = parseInt(w.dataset.page || '1', 10);
  }
  return best;
}

// 直接滚动当前挂在容器里的页面节点，而不是经过 viewer 的 pageWrappers：
// 快速切换/重复渲染时，闭包里的 viewer 可能已经脱离 DOM，offsetTop 会是 0。
function scrollPdfPageIntoView(container: HTMLElement, page: number): void {
  const wrapper = container.querySelector<HTMLElement>(`.pdf-page-wrapper[data-page="${page}"]`);
  if (!wrapper) return;
  container.scrollTo({ top: Math.max(0, wrapper.offsetTop - 100), behavior: 'smooth' });
}

export function mountPdfPageIndicator(viewer: PdfViewerInstance, container: HTMLElement): void {
  pdfPageIndicatorStore.show({
    page: currentVisiblePdfPage(container),
    total: viewer.getTotalPages(),
    onGoto: (page) => scrollPdfPageIntoView(container, page),
  });

  pdfPageIndicatorScrollHandler = () => {
    pdfPageIndicatorStore.setPage(currentVisiblePdfPage(container));
  };
  container.addEventListener('scroll', pdfPageIndicatorScrollHandler, { passive: true });
}

export function unmountPdfPageIndicator(container: HTMLElement): void {
  pdfPageIndicatorStore.hide();
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
  if (!state.currentFile) {
    toolbarStore.setBreadcrumb(null);
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  // 面包屑与复制按钮由工具栏（React）渲染
  toolbarStore.setBreadcrumb(file.path);

  const charCount = file.content.trim().length;
  updateStatusbarFile(charCount, file.createdAt, file.gitCreatedAt);
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

// `:root` 只匹配文档级别的根元素，在 shadow root 内部永远匹配不到任何东西——
// 但很多单文件 HTML 常用 `:root { --bg: ...; }` 声明整套配色变量（含
// `:root[data-theme="dark"]`/`:root:not(...)` 这类深色模式开关写法）。
// 挂进 shadow 后这些变量全部不生效，颜色会整体消失。把 `:root` 系列选择器
// 转成 shadow DOM 里等价的 `:host(...)`，让这些变量重新在 shadow host 上生效
// （自定义属性会从 host 正常继承进 shadow 内部）。
function rewriteRootSelectorForShadow(css: string): string {
  return css.replace(
    /:root((?:\[[^\]]*\]|:[\w-]+(?:\([^)]*\))?|\.[\w-]+)*)/g,
    (_match, rest: string) => (rest ? `:host(${rest})` : ':host')
  );
}

// ── HTML file rendering (Shadow DOM) ──────────────────────────────────────────
// HTML 文件不再进 iframe 隔离渲染，而是挂进一个 Shadow DOM 里：既保留样式/DOM
// 查询的双向隔离，又让 #reader 是主文档里能拿到引用的真实节点，从而复用批注/
// TOC/查找基础设施。script 标签走 innerHTML 不会执行，需要手动重建。
function mountHtmlIntoShadowRoot(container: HTMLElement, file: { path: string; content: string }): void {
  const doc = new DOMParser().parseFromString(file.content, 'text/html');
  // 整个 <html>（含 <head> 里的 <style>）原样搬进 shadow root，而不是只取
  // body.innerHTML —— 否则源文件里常见的 `body { ... }` 选择器会因为 shadow
  // 内没有真实 <body> 标签而完全失效（agent 生成的 HTML 几乎都靠这个做整页样式）。
  const htmlRoot = document.adoptNode(doc.documentElement);
  for (const styleEl of Array.from(htmlRoot.querySelectorAll('style'))) {
    styleEl.textContent = rewriteRootSelectorForShadow(styleEl.textContent ?? '');
  }

  container.innerHTML = `<div id="${HTML_READER_HOST_ID}"></div>`;
  const host = container.querySelector<HTMLElement>(`#${HTML_READER_HOST_ID}`)!;
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.appendChild(htmlRoot);

  const bodyEl = htmlRoot.querySelector('body');
  if (bodyEl) bodyEl.id = 'reader';

  const markStylesLink = document.createElement('link');
  markStylesLink.rel = 'stylesheet';
  markStylesLink.href = '/annotation-marks.css';
  shadow.appendChild(markStylesLink);

  // 重新创建 <script>（inline 和 src 都要）：DOMParser/adoptNode 插入的 script
  // 不会自动执行，必须替换成浏览器会真正解析执行的新节点。
  for (const oldScript of Array.from(shadow.querySelectorAll('script'))) {
    const newScript = document.createElement('script');
    for (const attr of Array.from(oldScript.attributes)) {
      newScript.setAttribute(attr.name, attr.value);
    }
    newScript.textContent = oldScript.textContent;
    oldScript.replaceWith(newScript);
  }

  const readerEl = shadow.getElementById('reader');
  if (readerEl) rewriteMarkdownAssetUrls(container, file.path, readerEl);
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
      storageSet(pdfScrollKey(path), container.scrollTop);
      entry.viewer.el.remove();
    }
    if (path !== state.currentFile) _scheduleEviction!(path);
  }
  setCurrentPdfViewer(null);
  _currentPdfBridge!.value = null;
  container.removeAttribute('data-pdf');
  if (!state.currentFile || !isPdfPath(state.currentFile)) {
    toolbarStore.setPdf(false, toolbarStore.getState().pdfMode);
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
    mountHtmlIntoShadowRoot(container, file);
    invalidateAnnotationElementsCache();
    container.setAttribute('data-current-file', file.path);
    container.scrollTop = file.savedScrollTop ?? 0;
    applyAnnotations();
    renderBreadcrumb();
    unmountScrollbar();
    mountScrollbar();
    unmountPdfPageIndicator(container);
    updateToc(file.path);
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
      // 加载期间如果又发生了一次渲染（重复渲染或切换到其它文件），容器已被清空或换成别的内容，
      // 这个 viewer 的 el 已脱离容器。若仍注册它，会让指示器和跳转作用在看不见的页面上，直接销毁。
      if (!container.contains(pdfViewerInstance.el)) {
        pdfViewerInstance.destroy();
        return;
      }
      container.setAttribute('data-current-file', filePath);
      const savedScroll = storageGetNumber(pdfScrollKey(filePath), 0);
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
      applyPdfModeButtons(savedPdfMode);
    });
    return; // don't fall through to markdown renderer
  }

  // 使用 marked 渲染 Markdown
  const mathGuard = protectMath(file.content);
  // marked 输出可能含原始 HTML（文档内容不可信），先消毒再还原数学占位符
  const html = mathGuard.restore(sanitizeHtml((window as any).marked.parse(mathGuard.protected)));
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
  highlightCodeBlocks(container);
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
  _updateToolbarButtons!();
}
