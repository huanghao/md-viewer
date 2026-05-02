import type { TocItem } from './toc-extractor.js';
import type { PdfViewerInstance } from './pdf-viewer.js';

import { state } from './state';
import { extractMdToc, extractPdfOutline, loadSidecar, saveSidecar, scanPdfHeadings } from './toc-extractor.js';
import { renderTocPanel, setActiveTocItem } from './ui/toc-panel.js';
import { storageGet, storageSet, storageGetNumber } from './utils/storage';

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
    if (item.pageNum) _getPdfViewerForFile(filePath)?.scrollToPage(item.pageNum);
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
  const viewer = _getPdfViewerForFile(filePath);
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

export function attachPdfScrollHighlight(panel: HTMLElement): void {
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
