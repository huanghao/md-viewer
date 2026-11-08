import type { TocItem } from './toc-extractor.js';
import type { PdfViewerInstance } from './pdf-viewer.js';

import { state } from './state';
import { extractMdToc, extractPdfOutline, loadSidecar, saveSidecar, scanPdfHeadings, buildTree } from './toc-extractor.js';
import { tocStore } from './toc/store';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { TocPanel } from './toc/TocPanel';
import { storageGet, storageSet, storageGetNumber } from './utils/storage';
import { resolveReaderElement } from './annotation-layout';

// Injected callback from main.ts (to avoid circular import)
let _getPdfViewerForFile: (filePath: string) => PdfViewerInstance | null = () => null;

export function initTocManager(deps: {
  getPdfViewerForFile: (filePath: string) => PdfViewerInstance | null;
}): void {
  _getPdfViewerForFile = deps.getPdfViewerForFile;
}

const TOC_PANE_HEIGHT_KEY = 'md-viewer:toc-pane-height';
const TOC_OPEN_KEY = 'md-viewer:toc-open';
const TOC_PANE_DEFAULT_HEIGHT = 240;
const TOC_PANE_MIN_HEIGHT = 80;
const TOC_PANE_MAX_HEIGHT = 600;

function sidebarEl(): HTMLElement | null {
  return document.querySelector('.sidebar') as HTMLElement | null;
}

/** 挂载目录面板（标题栏与列表）到 #tocPanelHost；组合根调用一次 */
export function mountTocPanel(): void {
  const host = document.getElementById('tocPanelHost');
  if (!host) return;
  createRoot(host).render(createElement(TocPanel));
}

function showTocLoading(): void {
  tocStore.setLoading();
  sidebarEl()?.classList.remove('toc-has-content', 'toc-visible');
}

function showTocEmpty(): void {
  tocStore.setEmpty();
  sidebarEl()?.classList.add('toc-has-content');
}

function showTocItems(toc: TocItem[], onJump: (item: TocItem) => void): void {
  // 空目录与“无目录”等价：不显示标题栏，也不标记为有内容
  if (toc.length === 0) {
    showTocEmpty();
    return;
  }
  tocStore.setItems(toc, onJump);
  sidebarEl()?.classList.add('toc-has-content');
}

/** 供其它模块在切换文件、文件未加载时复位目录面板 */
export function resetTocPanel(state: 'loading' | 'empty'): void {
  if (state === 'loading') showTocLoading();
  else showTocEmpty();
}

// 当前挂在正文上的目录滚动监听（切换文件时需要先移除）
let tocScroll: { el: HTMLElement; handler: () => void } | null = null;

function replaceTocScroll(el: HTMLElement | null, handler: (() => void) | null): void {
  if (tocScroll) {
    tocScroll.el.removeEventListener('scroll', tocScroll.handler);
    tocScroll = null;
  }
  if (el && handler) {
    el.addEventListener('scroll', handler);
    tocScroll = { el, handler };
  }
}

export function loadTocOpen(): boolean {
  // Default: open (only closed if explicitly saved as '0')
  return storageGet<string>(TOC_OPEN_KEY, '1') !== '0';
}

export function saveTocOpen(open: boolean): void {
  storageSet(TOC_OPEN_KEY, open ? '1' : '0');
}

export function applyTocVisibility(_filePath: string): void {
  const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
  if (!sidebar) return;
  if (loadTocOpen()) {
    sidebar.classList.add('toc-visible');
  } else {
    sidebar.classList.remove('toc-visible');
  }
}

export function setupTocOpenBtn(): void {
  document.getElementById('tocOpenBtn')?.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar') as HTMLElement | null;
    if (!sidebar) return;
    sidebar.classList.add('toc-visible');
    saveTocOpen(true);
  });
  // Wire close callback for toc-panel.ts
  document.addEventListener('toc:close', () => {
    saveTocOpen(false);
  });
}

export function applyTocPaneHeight(height: number): void {
  document.documentElement.style.setProperty('--toc-pane-height', `${height}px`);
}

export function initTocPaneHeight(): void {
  const saved = storageGetNumber(TOC_PANE_HEIGHT_KEY, TOC_PANE_DEFAULT_HEIGHT);
  applyTocPaneHeight(saved > 0 ? saved : TOC_PANE_DEFAULT_HEIGHT);
}

export function setupTocResize(): void {
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
    storageSet(TOC_PANE_HEIGHT_KEY, newHeight);
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
  async function walk(ns: any[], its: TocItem[]) {
    for (let j = 0; j < ns.length; j++) {
      const pageIdx = await resolveOutlineDest(ns[j].dest, pdfDoc);
      if (pageIdx !== null) its[j].pageNum = pageIdx + 1;
      await walk(ns[j].items ?? [], its[j].children);
    }
  }
  await walk(nodes, items);
}

export async function updateToc(filePath: string): Promise<void> {
  // 切换文件时总是先移除旧的正文滚动监听
  replaceTocScroll(null, null);

  const isPdf = filePath.endsWith('.pdf');
  const lower = filePath.toLowerCase();
  const isMd = lower.endsWith('.md') || lower.endsWith('.markdown');
  const isHtml = lower.endsWith('.html') || lower.endsWith('.htm');

  if (!isPdf && !isMd && !isHtml) {
    showTocEmpty();
    return;
  }

  if (isMd || isHtml) {
    let toc: TocItem[];
    if (isMd) {
      const file = state.sessionFiles.get(filePath);
      const content = file?.content ?? '';
      if (!content) {
        // 文件尚未加载：保持加载态，onFileLoaded 之后会再次调用 updateToc
        showTocLoading();
        return;
      }
      toc = extractMdToc(content);
    } else {
      // HTML 文件没有 markdown 源文本可正则抓取，直接扫描已渲染 DOM 的 heading
      // （shadow root 内的 #reader 是真实元素引用，querySelectorAll 天然只在
      // 该元素子树内查找，不受 shadow 边界影响）。
      const readerEl = resolveReaderElement();
      const headingEls = Array.from(readerEl?.querySelectorAll<HTMLElement>('h1, h2, h3') ?? []);
      const flat: TocItem[] = headingEls
        .map(h => ({ title: h.textContent?.trim() ?? '', level: Number(h.tagName[1]), children: [] as TocItem[] }))
        .filter(item => item.title);
      toc = buildTree(flat);
    }

    // toolbar (48px) + tabs (~36px) = offset so heading isn't hidden under fixed headers
    const HEADER_OFFSET = 90;
    const jumpToHeading = (item: TocItem) => {
      const readerEl = resolveReaderElement();
      const headings = Array.from(readerEl?.querySelectorAll<HTMLElement>('h1, h2, h3') ?? []);
      const target = headings.find(h => h.textContent?.trim() === item.title);
      if (target) {
        const contentEl = document.getElementById('content');
        if (contentEl) {
          contentEl.scrollTo({ top: target.offsetTop - HEADER_OFFSET, behavior: 'instant' });
        } else {
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }
    };

    if (toc.length === 0) {
      showTocEmpty();
    } else {
      showTocItems(toc, jumpToHeading);
    }
    applyTocVisibility(filePath);

    // 滚动时高亮当前所在标题
    const contentEl = document.getElementById('content');
    if (contentEl) {
      replaceTocScroll(contentEl, () => {
        const readerEl = resolveReaderElement();
        const headings = Array.from(readerEl?.querySelectorAll<HTMLElement>('h1, h2, h3') ?? []);
        if (!headings.length) return;
        const scrollTop = contentEl.scrollTop;
        let current = headings[0];
        for (const h of headings) {
          if (h.offsetTop <= scrollTop + HEADER_OFFSET) current = h;
        }
        const title = current?.textContent?.trim() ?? '';
        if (title) tocStore.setActive({ title });
      });
    }
    return;
  }

  const pdfJump = (item: TocItem) => {
    if (item.pageNum) _getPdfViewerForFile(filePath)?.scrollToPage(item.pageNum);
  };

  const showPdfToc = (toc: TocItem[]) => {
    showTocItems(toc, pdfJump);
    applyTocVisibility(filePath);
    attachPdfScrollHighlight();
  };

  // PDF：先尝试 sidecar 缓存
  const sidecar = await loadSidecar(filePath);
  if (sidecar) {
    showPdfToc(sidecar);
    return;
  }

  // PDF：等待 viewer 就绪后尝试大纲
  const viewer = _getPdfViewerForFile(filePath);
  if (!viewer) return;

  showTocLoading();

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
    // 继续走扫描
  }

  // PDF：通过 pdfjs 文档懒扫描（覆盖所有页，而不只是已渲染的页）
  try {
    await scanPdfHeadings(
      filePath,
      viewer.getPdfDoc(),
      toc => showPdfToc(toc)
    );
  } catch (err) {
    console.error('[TOC] scan failed:', err);
    tocStore.setError(String(err));
  }
}

export function attachPdfScrollHighlight(): void {
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
    tocStore.setActive({ page: currentPage });
  };

  replaceTocScroll(contentEl, onScroll);
  // 立即执行一次，设置初始状态
  onScroll();
}
