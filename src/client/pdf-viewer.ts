// PDF.js loaded via ES module in html.ts, exposed as window.pdfjsLib after 'pdfjslib-ready' event
// TODO: add zoom controls for PDF (the font-scale button in toolbar doesn't affect PDF rendering,
//       which uses a fixed scale=1.5 via pdf.js; needs a separate PDF-specific zoom UI)

function getPdfjsLib(): Promise<any> {
  if ((window as any).pdfjsLib) return Promise.resolve((window as any).pdfjsLib);
  return new Promise(resolve => {
    window.addEventListener('pdfjslib-ready', () => resolve((window as any).pdfjsLib), { once: true });
  });
}

export interface PdfPageTextItem {
  str: string;
  transform: number[]; // [scaleX, skewX, skewY, scaleY, x, y]
  width: number;
  height: number;
}

export interface PdfTextBlock {
  pageNum: number;
  items: PdfPageTextItem[];
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfViewerOptions {
  container: HTMLElement;
  filePath: string;
  scale?: number;
  /**
   * Called when user selects text.
   * startItemIdx and endItemIdx are indices into textContent.items — stable anchors.
   */
  onTextSelected?: (
    pageNum: number,
    selectedText: string,
    prefix: string,
    suffix: string,
    clientX: number,
    clientY: number,
    startItemIdx: number,
    endItemIdx: number
  ) => void;
  onParagraphClick?: (block: PdfTextBlock) => void;
  /** Called when user clicks a persistent annotation rect on the overlay canvas */
  onAnnotationClick?: (annotationId: string, clientX: number, clientY: number) => void;
  /** Called after a page finishes rendering (canvas + text layer ready) */
  onPageRendered?: (pageNum: number) => void;
}

export interface PdfViewerInstance {
  el: HTMLElement;
  destroy(): void;
  scrollToPage(pageNum: number): void;
  highlightQuote(pageNum: number, quote: string, annotationId?: string): void;
  highlightByItemRange(pageNum: number, startItemIdx: number, endItemIdx: number, annotationId?: string, preciseQuote?: string): void;
  clearHighlights(): void;
  clearSelectionMark(): void;
  getTextBlocks(pageNum: number): PdfTextBlock[];
  getRenderedCount(): number;
  getTotalPages(): number;
  /** Draw a temporary selection rect on the overlay canvas for the given page */
  drawTempRect(pageNum: number, x1: number, y1: number, x2: number, y2: number, style: 'blue' | 'yellow'): void;
  /** Clear the temporary selection rect (all pages if pageNum omitted) */
  clearTempRect(pageNum?: number): void;
  /** Draw a persistent annotation rect on the overlay canvas */
  renderRectHighlight(pageNum: number, x1: number, y1: number, x2: number, y2: number, annotationId: string): void;
  /** Called when user clicks a persistent annotation rect */
  onAnnotationClick?: (annotationId: string, clientX: number, clientY: number) => void;
}

const SCALE_DEFAULT = 1.5;
const LINE_HEIGHT_MULTIPLIER = 1.5;

type ItemClass = 'h1' | 'h2' | 'body' | 'caption';

function classifyPageItems(items: PdfPageTextItem[]): ItemClass[] {
  // Skip empty items for median calculation
  const nonEmpty = items.filter(it => it.str.trim() !== '');
  if (!nonEmpty.length) return items.map(() => 'body');

  const heights = nonEmpty.map(it => it.height || Math.abs(it.transform[3]) || 10);
  const sorted = [...heights].sort((a, b) => a - b);
  const medianSize = sorted[Math.floor(sorted.length / 2)];
  if (!medianSize) return items.map(() => 'body');

  // Group items into visual lines by PDF Y coordinate (transform[5])
  // Items with Y diff < 2pt are on the same line
  const lineGroups: { items: PdfPageTextItem[]; avgHeight: number; text: string }[] = [];
  const itemToLine: number[] = new Array(items.length).fill(-1);

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const y = it.transform[5];
    const h = it.height || Math.abs(it.transform[3]) || 10;
    let found = -1;
    for (let g = lineGroups.length - 1; g >= Math.max(0, lineGroups.length - 8); g--) {
      const rep = lineGroups[g].items[0];
      if (Math.abs(rep.transform[5] - y) < 2) { found = g; break; }
    }
    if (found === -1) {
      found = lineGroups.length;
      lineGroups.push({ items: [], avgHeight: 0, text: '' });
    }
    lineGroups[found].items.push(it);
    itemToLine[i] = found;
  }

  // Compute per-line stats
  for (const g of lineGroups) {
    const hs = g.items.map(it => it.height || Math.abs(it.transform[3]) || 10);
    g.avgHeight = hs.reduce((a, b) => a + b, 0) / hs.length;
    g.text = g.items.map(it => it.str).join('').trim();
  }

  // Classify each line, then map back to items
  const lineClass: ItemClass[] = lineGroups.map(g => {
    const ratio = g.avgHeight / medianSize;
    const text = g.text;
    if (!text) return 'caption';
    if (ratio < 0.92) return 'caption';
    if (ratio > 1.05 && text.length < 100) {
      // Exclude: long sentences with mid-text period, URLs, math symbols
      const hasMidPeriod = /\w\.\s+\w/.test(text);
      const hasUrl = /https?:|www\./.test(text);
      const hasMath = /[∼∈≥≤∑∏∫αβγδεζηθλμπρστφψω]/.test(text);
      if (!hasMidPeriod && !hasUrl && !hasMath) {
        return ratio > 1.2 ? 'h1' : 'h2';
      }
    }
    return 'body';
  });

  return items.map((_, i) => lineClass[itemToLine[i]] ?? 'body');
}

function expandDblClick(
  items: PdfPageTextItem[],
  classifications: ItemClass[],
  anchorIdx: number
): [number, number] {
  const cls = classifications[anchorIdx];
  if (cls !== 'h1' && cls !== 'h2') {
    // body / caption: select single item
    return [anchorIdx, anchorIdx];
  }

  // heading: collect body items until next heading of same or higher level
  const anchorLevel = cls === 'h1' ? 1 : 2;
  let end = anchorIdx;
  let foundBody = false;
  for (let i = anchorIdx + 1; i < items.length; i++) {
    const c = classifications[i];
    if (c === 'h1' || (c === 'h2' && anchorLevel <= 2)) {
      // Stop at same or higher level heading
      if (c === 'h1' || anchorLevel === 2) break;
    }
    if (c === 'body') { end = i; foundBody = true; }
  }
  if (!foundBody) return [anchorIdx, anchorIdx];
  // Find first body item after anchor
  let start = anchorIdx + 1;
  while (start <= end && classifications[start] !== 'body') start++;
  if (start > end) return [anchorIdx, anchorIdx];
  return [start, end];
}
// Render pages within this many px of the viewport (above and below)
// 2500px ≈ 2 A4 pages at scale=1.5, reduces blank-page flicker on fast scroll
const RENDER_MARGIN = 2500;

export async function createPdfViewer(opts: PdfViewerOptions): Promise<PdfViewerInstance> {
  const { container, filePath, scale = SCALE_DEFAULT } = opts;

  // Each viewer owns its own root div. main.ts appends/removes it from #content.
  // This allows multiple viewers to coexist without destroying each other's DOM.
  const el = document.createElement("div");
  el.className = "pdf-viewer-container";
  container.appendChild(el);

  const pdfjs = await getPdfjsLib();
  const url = `/api/pdf-asset?path=${encodeURIComponent(filePath)}`;
  const pdfDoc = await pdfjs.getDocument(url).promise;

  const numPages = pdfDoc.numPages;
  const dpr = window.devicePixelRatio || 1;

  // Per-page state
  const pageWrappers: HTMLElement[] = [];
  const overlayCanvases: Map<number, HTMLCanvasElement> = new Map();
  const persistentRects: Map<number, Array<{ annotationId: string; x1: number; y1: number; x2: number; y2: number }>> = new Map();
  const tempRects: Map<number, { x1: number; y1: number; x2: number; y2: number; style: 'blue' | 'yellow' } | null> = new Map();
  const textBlocksByPage: Map<number, PdfTextBlock[]> = new Map();
  const textContentCache: Map<number, any> = new Map(); // Cache textContent for item-based highlighting
  const rendered = new Set<number>(); // pages already rendered
  const rendering = new Set<number>(); // pages currently being rendered

  // Step 1: get viewport dimensions for all pages to build placeholders.
  // We fetch page 1 to get the typical size, then assume uniform pages.
  // For accuracy we fetch each page's viewport lazily during render.
  // For placeholder sizing, use page 1's dimensions for all pages initially.
  const firstPage = await pdfDoc.getPage(1);
  const firstViewport = firstPage.getViewport({ scale });
  const placeholderW = firstViewport.width;
  const placeholderH = firstViewport.height;

  // Step 2: create placeholder divs for all pages
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const wrapper = document.createElement("div");
    wrapper.className = "pdf-page-wrapper pdf-page-placeholder";
    wrapper.dataset.page = String(pageNum);
    wrapper.style.position = "relative";
    wrapper.style.width = `${placeholderW}px`;
    wrapper.style.height = `${placeholderH}px`;
    wrapper.style.marginBottom = "16px";
    wrapper.style.background = "white";
    el.appendChild(wrapper);
    pageWrappers.push(wrapper);
  }

  function redrawOverlay(pageNum: number) {
    const canvas = overlayCanvases.get(pageNum);
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

    const perPage = persistentRects.get(pageNum) || [];
    for (const r of perPage) {
      const s = scale;
      ctx.fillStyle = 'rgba(255,200,0,0.35)';
      ctx.strokeStyle = 'rgba(255,160,0,0.85)';
      ctx.lineWidth = 1.5;
      ctx.fillRect(r.x1 * s, r.y1 * s, (r.x2 - r.x1) * s, (r.y2 - r.y1) * s);
      ctx.strokeRect(r.x1 * s, r.y1 * s, (r.x2 - r.x1) * s, (r.y2 - r.y1) * s);
    }

    const tmp = tempRects.get(pageNum);
    if (tmp) {
      const s = scale;
      const w = (tmp.x2 - tmp.x1) * s;
      const h = (tmp.y2 - tmp.y1) * s;
      if (tmp.style === 'blue') {
        ctx.fillStyle = 'rgba(66,133,244,0.18)';
        ctx.strokeStyle = 'rgba(66,133,244,0.9)';
      } else {
        ctx.fillStyle = 'rgba(255,200,0,0.30)';
        ctx.strokeStyle = 'rgba(255,160,0,0.75)';
      }
      ctx.lineWidth = 1.5;
      ctx.fillRect(tmp.x1 * s, tmp.y1 * s, w, h);
      ctx.strokeRect(tmp.x1 * s, tmp.y1 * s, w, h);
    }
  }

  // Step 3: render a page (canvas + text layer)
  async function renderPage(pageNum: number): Promise<void> {
    if (rendered.has(pageNum) || rendering.has(pageNum)) return;
    rendering.add(pageNum);

    const wrapper = pageWrappers[pageNum - 1];
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Update wrapper size in case it differs from page 1
    wrapper.style.width = `${viewport.width}px`;
    wrapper.style.height = `${viewport.height}px`;

    // Canvas
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(dpr, dpr);
    const t0 = performance.now();
    await page.render({ canvasContext: ctx, viewport }).promise;
    wrapper.appendChild(canvas);

    // Text layer
    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "pdf-text-layer textLayer";
    textLayerDiv.style.cssText = `
      width: ${viewport.width}px; height: ${viewport.height}px;
      pointer-events: none; user-select: none;
    `;
    wrapper.appendChild(textLayerDiv);

    const overlayCanvas = document.createElement('canvas');
    overlayCanvas.className = 'pdf-select-overlay';
    overlayCanvas.width = Math.floor(viewport.width * dpr);
    overlayCanvas.height = Math.floor(viewport.height * dpr);
    overlayCanvas.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: ${viewport.width}px; height: ${viewport.height}px;
      pointer-events: auto; cursor: crosshair;
    `;
    const overlayCtx = overlayCanvas.getContext('2d')!;
    overlayCtx.scale(dpr, dpr);
    wrapper.appendChild(overlayCanvas);
    overlayCanvases.set(pageNum, overlayCanvas);
    persistentRects.set(pageNum, []);
    tempRects.set(pageNum, null);
    let justDragged = false;

    const textContent = await page.getTextContent();
    textContentCache.set(pageNum, textContent);
    const textLayerObj = new pdfjs.TextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport,
    });
    await textLayerObj.render();
    if ((window as any).__pdfDebug) {
      console.log(`[pdf] page ${pageNum}: ${(performance.now() - t0).toFixed(0)}ms`);
    }

    // Build text blocks
    const blocks = buildTextBlocks(pageNum, textContent.items as PdfPageTextItem[], viewport, scale);
    textBlocksByPage.set(pageNum, blocks);

    // Event handlers
    if (opts.onParagraphClick) {
      // 悬停「译」按钮：每个 pageWrapper 最多一个，复用移动
      let translateBtn: HTMLButtonElement | null = null;
      let translateBtnBlock: PdfTextBlock | null = null;

      const getOrCreateTranslateBtn = (): HTMLButtonElement => {
        if (!translateBtn) {
          translateBtn = document.createElement("button");
          translateBtn.className = "pdf-translate-btn";
          translateBtn.textContent = "译";
          translateBtn.addEventListener("click", (ev) => {
            ev.stopPropagation();
            if (translateBtnBlock) opts.onParagraphClick!(translateBtnBlock);
          });
          wrapper.appendChild(translateBtn);
        }
        return translateBtn;
      };

      textLayerDiv.addEventListener("mousemove", (e) => {
        const me = e as MouseEvent;
        // offsetY 是相对 textLayerDiv 的，但 block.y 是相对 pageWrapper 的。
        // 用 clientY 减去 wrapper 的 top 得到相对 wrapper 的 Y，再除以 scale。
        const wrapperRect = wrapper.getBoundingClientRect();
        const hoverY = (me.clientY - wrapperRect.top) / scale;
        const block = findBlockAtY(blocks, hoverY);
        if (!block) {
          if (translateBtn) translateBtn.style.display = "none";
          return;
        }
        if (block === translateBtnBlock && translateBtn && translateBtn.style.display !== "none") return;
        translateBtnBlock = block;
        const btn = getOrCreateTranslateBtn();
        btn.style.display = "block";
        btn.style.top = `${block.y * scale}px`;
      });

      textLayerDiv.addEventListener("mouseleave", (e) => {
        // 鼠标移到「译」按钮上时不隐藏
        if (translateBtn && e.relatedTarget === translateBtn) return;
        if (translateBtn) translateBtn.style.display = "none";
      });

      // 鼠标离开按钮时也隐藏（除非移回了 textLayerDiv）
      wrapper.addEventListener("mouseleave", (e) => {
        if (!translateBtn) return;
        const related = e.relatedTarget as Node | null;
        if (related && (textLayerDiv.contains(related) || related === textLayerDiv)) return;
        translateBtn.style.display = "none";
      });
    }
    if (opts.onTextSelected) {
      const pageH = viewport.height / scale;
      let dragging = false;
      let downPdfX = 0, downPdfY = 0;
      let downScreenX = 0, downScreenY = 0;

      overlayCanvas.addEventListener('mousedown', (e) => {
        if (tempRects.get(pageNum)) {
          tempRects.set(pageNum, null);
          redrawOverlay(pageNum);
        }
        dragging = true;
        const rect = wrapper.getBoundingClientRect();
        downScreenX = e.clientX;
        downScreenY = e.clientY;
        downPdfX = (e.clientX - rect.left) / scale;
        downPdfY = (e.clientY - rect.top) / scale;
        e.preventDefault();
      });

      overlayCanvas.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const rect = wrapper.getBoundingClientRect();
        const curX = (e.clientX - rect.left) / scale;
        const curY = (e.clientY - rect.top) / scale;
        tempRects.set(pageNum, {
          x1: Math.min(downPdfX, curX), y1: Math.min(downPdfY, curY),
          x2: Math.max(downPdfX, curX), y2: Math.max(downPdfY, curY),
          style: 'blue'
        });
        redrawOverlay(pageNum);
      });

      overlayCanvas.addEventListener('mouseup', (e) => {
        if (!dragging) return;
        dragging = false;
        const dx = Math.abs(e.clientX - downScreenX);
        const dy = Math.abs(e.clientY - downScreenY);
        if (dx < 5 && dy < 5) {
          tempRects.set(pageNum, null);
          redrawOverlay(pageNum);
          return;
        }
        justDragged = true;
        const rect = wrapper.getBoundingClientRect();
        const upPdfX = (e.clientX - rect.left) / scale;
        const upPdfY = (e.clientY - rect.top) / scale;

        tempRects.set(pageNum, {
          x1: Math.min(downPdfX, upPdfX), y1: Math.min(downPdfY, upPdfY),
          x2: Math.max(downPdfX, upPdfX), y2: Math.max(downPdfY, upPdfY),
          style: 'blue'
        });
        redrawOverlay(pageNum);

        const allItems = (textContentCache.get(pageNum)?.items || []) as PdfPageTextItem[];
        const result = coordPath(allItems, pageH, downPdfX, downPdfY, upPdfX, upPdfY);
        if (!result.text || result.hits.length === 0) return;

        const startItemIdx = result.hits[0];
        const endItemIdx = result.hits[result.hits.length - 1];

        (window as any).__pdfPendingRectCoords = {
          pageNum,
          x1: Math.min(downPdfX, upPdfX),
          y1: Math.min(downPdfY, upPdfY),
          x2: Math.max(downPdfX, upPdfX),
          y2: Math.max(downPdfY, upPdfY),
        };

        const CONTEXT_ITEMS = 3;
        const prefix = allItems.slice(Math.max(0, startItemIdx - CONTEXT_ITEMS), startItemIdx).map(it => it.str).join(' ').trim();
        const suffix = allItems.slice(endItemIdx + 1, Math.min(allItems.length, endItemIdx + 1 + CONTEXT_ITEMS)).map(it => it.str).join(' ').trim();

        opts.onTextSelected!(pageNum, result.text, prefix, suffix, e.clientX, e.clientY, startItemIdx, endItemIdx);
      });
    }

    overlayCanvas.addEventListener('click', (e) => {
      if (justDragged) { justDragged = false; return; }
      if (opts.onAnnotationClick) {
        const rect = wrapper.getBoundingClientRect();
        const clickX = (e.clientX - rect.left) / scale;
        const clickY = (e.clientY - rect.top) / scale;
        const perPage = persistentRects.get(pageNum) || [];
        for (const r of perPage) {
          if (clickX >= r.x1 && clickX <= r.x2 && clickY >= r.y1 && clickY <= r.y2) {
            opts.onAnnotationClick(r.annotationId, e.clientX, e.clientY);
            break;
          }
        }
      }
    });

    wrapper.classList.remove("pdf-page-placeholder");
    rendered.add(pageNum);
    rendering.delete(pageNum);

    // Notify caller so annotation highlights can be replayed for this page
    opts.onPageRendered?.(pageNum);
  }

  // Step 4: IntersectionObserver — render pages as they approach the viewport
  // root must be the scrolling container (container itself = #content).
  // root:null uses the browser viewport — since #content is inside the viewport,
  // all child placeholders are considered "intersecting" and render all at once.
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const pageNum = parseInt((entry.target as HTMLElement).dataset.page || "0", 10);
          if (pageNum) renderPage(pageNum);
        }
      }
    },
    // root = container (#content), which is the actual scroll container.
    // el is just a flex wrapper inside #content, not a scroll container itself.
    { root: container, rootMargin: `${RENDER_MARGIN}px 0px`, threshold: 0 }
  );

  for (const wrapper of pageWrappers) {
    observer.observe(wrapper);
  }

  // Public API
  function scrollToPage(pageNum: number) {
    const wrapper = pageWrappers[pageNum - 1];
    if (wrapper) wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function highlightQuote(pageNum: number, quote: string, annotationId?: string) {
    // Note: clearHighlights() is called once by renderHighlights(), not here
    const wrapper = pageWrappers[pageNum - 1];
    if (!wrapper) return;
    // Only highlight already-rendered pages — don't trigger new renders
    if (!rendered.has(pageNum)) return;
    const textLayer = wrapper.querySelector(".pdf-text-layer") as HTMLElement;
    if (!textLayer) return;

    // Find spans that match the quote and add annotation class/data
    const spans = Array.from(textLayer.querySelectorAll("span")).filter(
      s => s.querySelector("span") === null
    );

    const normalizedQuote = quote.toLowerCase().replace(/\s+/g, " ").trim();

    // Build a map of which spans are part of this quote
    // Only match spans whose text appears contiguously in the quote
    let matchedAny = false;
    for (const span of spans) {
      const text = (span.textContent || "").toLowerCase().replace(/\s+/g, " ").trim();
      if (!text || text.length < 3) continue; // Skip very short spans

      // Strict match: span text must be a substantial substring of quote
      // and we haven't already matched a similar span
      if (normalizedQuote.includes(text) && text.length > 5) {
        span.classList.add("pdf-highlight");
        if (annotationId) {
          span.classList.add("annotation-mark");
          span.dataset.annotationId = annotationId;
        }
        matchedAny = true;
      }
    }

    // If no good match found, fall back to exact quote matching
    if (!matchedAny) {
      for (const span of spans) {
        const text = (span.textContent || "").trim();
        if (text === quote || text.includes(quote)) {
          span.classList.add("pdf-highlight");
          if (annotationId) {
            span.classList.add("annotation-mark");
            span.dataset.annotationId = annotationId;
          }
          break; // Only match the first exact match
        }
      }
    }
  }

  /**
   * Highlight by item index range — O(1) precise anchor, no text search.
   * Uses item index in textContent.items as stable coordinate.
   */
  function highlightByItemRange(pageNum: number, startItemIdx: number, endItemIdx: number, annotationId?: string, preciseQuote?: string) {
    const wrapper = pageWrappers[pageNum - 1];
    if (!wrapper) return;
    if (!rendered.has(pageNum)) return;

    const page = textContentCache.get(pageNum);
    if (!page) return;

    const items = page.items as PdfPageTextItem[];
    if (!items || items.length === 0) return;

    const safeStart = Math.max(0, startItemIdx);
    const safeEnd = Math.min(items.length - 1, endItemIdx);
    if (safeStart > safeEnd) return;

    const textLayer = wrapper.querySelector(".pdf-text-layer") as HTMLElement;
    if (!textLayer) return;

    const spans = Array.from(textLayer.querySelectorAll("span")).filter(
      s => s.querySelector("span") === null
    );

    const rangeQuote = items.slice(safeStart, safeEnd + 1).map(it => it.str).join(" ").trim();
    // Use precise quote (user's actual selection) if available, otherwise full item text
    const targetQuote = (preciseQuote && preciseQuote.trim()) ? preciseQuote.trim() : rangeQuote;
    if (!targetQuote) return;

    console.log('[pdf] highlightByItemRange:', { pageNum, safeStart, safeEnd, targetQuote: targetQuote.substring(0, 50) });

    for (const span of spans) {
      const spanText = span.textContent || "";
      const spanTextTrimmed = spanText.trim();
      const isExact = spanTextTrimmed === targetQuote;
      const containsQuote = !isExact && spanText.includes(targetQuote);
      if (!isExact && !containsQuote) continue;

      if (isExact) {
        // Whole span is the quote — add class directly
        span.classList.add("pdf-highlight");
        if (annotationId) { span.classList.add("annotation-mark"); span.dataset.annotationId = annotationId; }
      } else {
        // Sub-word: find the first text node inside the span (may be nested if temp mark was present)
        let textNode: Text | null = null;
        for (const child of Array.from(span.childNodes)) {
          if (child.nodeType === Node.TEXT_NODE) { textNode = child as Text; break; }
          if (child.nodeType === Node.ELEMENT_NODE) {
            const inner = (child as Element).childNodes[0];
            if (inner && inner.nodeType === Node.TEXT_NODE) { textNode = inner as Text; break; }
          }
        }
        let subWordDone = false;
        if (textNode) {
          const idx = (textNode.textContent || "").indexOf(targetQuote);
          if (idx >= 0) {
            try {
              const r = document.createRange();
              r.setStart(textNode, idx);
              r.setEnd(textNode, idx + targetQuote.length);
              const mark = document.createElement("mark");
              mark.className = "pdf-highlight";
              mark.style.cssText = "background:rgba(255,220,0,0.4);border-radius:2px;padding:0;margin:0;display:inline;vertical-align:baseline;line-height:inherit;color:inherit;";
              if (annotationId) { mark.classList.add("annotation-mark"); mark.dataset.annotationId = annotationId; }
              r.surroundContents(mark);
              subWordDone = true;
            } catch {}
          }
        }
        if (!subWordDone) {
          // fallback: highlight whole span
          span.classList.add("pdf-highlight");
          if (annotationId) { span.classList.add("annotation-mark"); span.dataset.annotationId = annotationId; }
        }
      }
      break;
    }
  }

  function renderRectHighlight(pageNum: number, x1: number, y1: number, x2: number, y2: number, annotationId: string) {
    if (!rendered.has(pageNum)) return;
    const wrapper = pageWrappers[pageNum - 1];
    if (!wrapper) return;

    const perPage = (persistentRects.get(pageNum) || []).filter(r => r.annotationId !== annotationId);
    perPage.push({ annotationId, x1, y1, x2, y2 });
    persistentRects.set(pageNum, perPage);
    redrawOverlay(pageNum);

    const anchor = document.createElement('div');
    anchor.className = 'pdf-rect-anchor';
    anchor.dataset.annotationId = annotationId;
    anchor.style.cssText = `position:absolute;top:${y1 * scale}px;left:${x1 * scale}px;width:0;height:0;pointer-events:none;`;
    wrapper.appendChild(anchor);
  }

  function drawTempRect(pageNum: number, x1: number, y1: number, x2: number, y2: number, style: 'blue' | 'yellow') {
    tempRects.set(pageNum, { x1, y1, x2, y2, style });
    redrawOverlay(pageNum);
  }

  function clearTempRect(pageNum?: number) {
    if (pageNum !== undefined) {
      tempRects.set(pageNum, null);
      redrawOverlay(pageNum);
    } else {
      tempRects.forEach((_, pn) => {
        tempRects.set(pn, null);
        redrawOverlay(pn);
      });
    }
  }

  function clearHighlights() {
    persistentRects.forEach((_, pageNum) => {
      persistentRects.set(pageNum, []);
      redrawOverlay(pageNum);
    });
    el.querySelectorAll('.pdf-rect-anchor').forEach(node => node.remove());

    el.querySelectorAll("mark.pdf-highlight").forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
    // Remove classes from span-level highlights
    el.querySelectorAll(".pdf-highlight, .annotation-mark").forEach((node) => {
      node.classList.remove("pdf-highlight");
      node.classList.remove("annotation-mark");
      delete (node as HTMLElement).dataset.annotationId;
    });
  }

  function clearSelectionMark() {
    el.querySelectorAll("mark.pdf-selection-mark, mark.pdf-selection-mark-temp").forEach((mark) => {
      const parent = mark.parentNode;
      if (!parent) return;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    });
  }

  function getTextBlocks(pageNum: number): PdfTextBlock[] {
    return textBlocksByPage.get(pageNum) ?? [];
  }

  function destroy() {
    observer.disconnect();
    el.remove();
    rendered.clear();
    rendering.clear();
    textBlocksByPage.clear();
    textContentCache.clear();
    overlayCanvases.clear();
    persistentRects.clear();
    tempRects.clear();
  }

  function getRenderedCount(): number { return rendered.size; }
  function getTotalPages(): number { return numPages; }

  return {
    el, destroy, scrollToPage,
    highlightQuote, highlightByItemRange, clearHighlights, clearSelectionMark,
    renderRectHighlight,
    getTextBlocks, getRenderedCount, getTotalPages,
    drawTempRect, clearTempRect,
    get onAnnotationClick() { return opts.onAnnotationClick; },
    set onAnnotationClick(fn: ((annotationId: string, clientX: number, clientY: number) => void) | undefined) { opts.onAnnotationClick = fn; },
  };
}

function buildTextBlocks(pageNum: number, items: PdfPageTextItem[], viewport: any, scale: number): PdfTextBlock[] {
  if (!items.length) return [];
  const sorted = [...items].filter(i => i.str.trim()).sort((a, b) => {
    const ay = viewport.height / scale - a.transform[5];
    const by = viewport.height / scale - b.transform[5];
    return ay - by || a.transform[4] - b.transform[4];
  });

  const blocks: PdfTextBlock[] = [];
  let current: PdfPageTextItem[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    const prevY = viewport.height / scale - prev.transform[5];
    const currY = viewport.height / scale - curr.transform[5];
    const lineHeight = (prev.height || 12);
    if (Math.abs(currY - prevY) < lineHeight * LINE_HEIGHT_MULTIPLIER) {
      current.push(curr);
    } else {
      blocks.push(itemsToBlock(pageNum, current, viewport, scale));
      current = [curr];
    }
  }
  blocks.push(itemsToBlock(pageNum, current, viewport, scale));
  return blocks;
}

function itemsToBlock(pageNum: number, items: PdfPageTextItem[], viewport: any, scale: number): PdfTextBlock {
  const x = Math.min(...items.map(i => i.transform[4]));
  const y = viewport.height / scale - Math.max(...items.map(i => i.transform[5]));
  const width = Math.max(...items.map(i => i.transform[4] + i.width)) - x;
  const height = Math.max(...items.map(i => i.height || 12));
  return { pageNum, items, text: items.map(i => i.str).join(" "), x, y, width, height };
}

function findBlockAtY(blocks: PdfTextBlock[], clickY: number): PdfTextBlock | null {
  return blocks.find(b => clickY >= b.y - 2 && clickY <= b.y + b.height + 4) ?? null;
}

interface CoordHitDetail {
  idx: number;
  str: string;
  startChar: number;
  endChar: number;
  slice: string;
  itemX: string;
  itemWidth: string;
}

interface CoordPathResult {
  text: string | null;
  hits: number[];
  detail: CoordHitDetail[];
}

function coordPath(
  items: PdfPageTextItem[],
  pageH: number,
  downX: number,
  downY: number,
  upX: number,
  upY: number
): CoordPathResult {
  const deltaY = Math.abs(downY - upY);
  const isMultiLine = deltaY > 5;

  let startX: number, startY: number, endX: number, endY: number;
  if (isMultiLine) {
    const reversed = downY > upY;
    startX = reversed ? upX : downX; startY = reversed ? upY : downY;
    endX = reversed ? downX : upX;   endY = reversed ? downY : upY;
  } else {
    const reversed = downX > upX;
    startX = reversed ? upX : downX; startY = reversed ? upY : downY;
    endX = reversed ? downX : upX;   endY = reversed ? downY : upY;
  }

  const selLeft = Math.min(startX, endX);
  const selRight = Math.max(startX, endX);
  const selTop = Math.min(startY, endY);
  const selBottom = Math.max(startY, endY);
  const normDownX = startX;
  const normUpX = endX;

  const hits: Array<{ idx: number; it: PdfPageTextItem; ix: number; iy: number; ix2: number; iy2: number; fontH: number }> = [];
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (!it.str.trim()) continue;
    const fontH = it.height || Math.abs(it.transform[3]) || 12;
    const baselineY = pageH - it.transform[5];
    const ix = it.transform[4];
    const iy = baselineY - fontH;
    const ix2 = ix + Math.abs(it.width);
    const iy2 = baselineY + fontH * 0.3;
    // Horizontal: any overlap; Vertical: item center must be within selection
    // (prevents adjacent lines that barely touch the rect from being captured)
    const cy = (iy + iy2) / 2;
    const hOverlap = ix < selRight && ix2 > selLeft;
    const vHit = cy >= selTop && cy <= selBottom;
    if (hOverlap && vHit) {
      hits.push({ idx: i, it, ix, iy, ix2, iy2, fontH });
    }
  }

  if (hits.length === 0) return { text: null, hits: [], detail: [] };

  hits.sort((a, b) => (a.iy - b.iy) || (a.ix - b.ix));

  const parts: string[] = [];
  const detail: CoordHitDetail[] = [];

  for (let i = 0; i < hits.length; i++) {
    const { it, ix, ix2 } = hits[i];
    const str = it.str;
    const strLen = str.length;
    let startChar = 0;
    let endChar = strLen;
    if (i === 0) {
      const xInItem = Math.max(0, Math.min(normDownX - ix, ix2 - ix));
      startChar = Math.round((xInItem / (ix2 - ix)) * strLen);
    }
    if (i === hits.length - 1) {
      const xInItem = Math.max(0, Math.min(normUpX - ix, ix2 - ix));
      endChar = Math.round((xInItem / (ix2 - ix)) * strLen);
    }
    const slice = str.slice(startChar, endChar).trim();
    if (slice) parts.push(slice);
    detail.push({
      idx: hits[i].idx, str: str.slice(0, 40),
      startChar, endChar, slice,
      itemX: ix.toFixed(1), itemWidth: (ix2 - ix).toFixed(1)
    });
  }

  return { text: parts.join(' ').trim() || null, hits: hits.map(h => h.idx), detail };
}

function getSelectionContext(items: PdfPageTextItem[], selectedText: string): { prefix: string; suffix: string } {
  const fullText = items.map(i => i.str).join(" ");
  const idx = fullText.toLowerCase().indexOf(selectedText.toLowerCase());
  if (idx === -1) return { prefix: "", suffix: "" };
  return {
    prefix: fullText.slice(Math.max(0, idx - 50), idx).trim(),
    suffix: fullText.slice(idx + selectedText.length, idx + selectedText.length + 50).trim(),
  };
}

/** Find longest common substring between two strings (case insensitive) */
function findLongestCommonSubstring(a: string, b: string): string {
  a = a.toLowerCase().replace(/\s+/g, " ");
  b = b.toLowerCase().replace(/\s+/g, " ");
  let longest = "";
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 2; j <= a.length && j - i > longest.length; j++) {
      const substr = a.slice(i, j);
      if (b.includes(substr)) {
        longest = substr;
      }
    }
  }
  return longest;
}

/**
 * Wrap the selected text inside the range with <mark class="pdf-selection-mark"> elements.
 * This gives precise highlighting even when a single span covers an entire line.
 * Call clearSelectionMark() to remove these wrappers.
 */
function markSelectionSpans(sel: Selection, textLayerDiv: HTMLElement): void {
  if (sel.rangeCount === 0) return;
  const range = sel.getRangeAt(0);
  if (range.collapsed) return;

  // Only act if the selection is inside our textLayerDiv
  if (!textLayerDiv.contains(range.commonAncestorContainer)) return;

  try {
    // surroundContents only works when the range doesn't cross element boundaries.
    // For multi-span selections we need to handle each text node separately.
    const mark = document.createElement("mark");
    mark.className = "pdf-selection-mark";

    if (range.startContainer === range.endContainer) {
      // Selection within a single text node — simple case
      range.surroundContents(mark);
    } else {
      // Multi-node selection: wrap each text node fragment individually
      const walker = document.createTreeWalker(textLayerDiv, NodeFilter.SHOW_TEXT, null);
      const toWrap: { node: Text; start: number; end: number }[] = [];
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const t = node as Text;
        const nodeRange = document.createRange();
        nodeRange.selectNode(t);
        if (
          nodeRange.compareBoundaryPoints(Range.START_TO_END, range) > 0 &&
          nodeRange.compareBoundaryPoints(Range.END_TO_START, range) < 0
        ) {
          const start = t === range.startContainer ? range.startOffset : 0;
          const end = t === range.endContainer ? range.endOffset : t.length;
          toWrap.push({ node: t, start, end });
        }
      }
      for (const { node: t, start, end } of toWrap) {
        const partial = document.createRange();
        partial.setStart(t, start);
        partial.setEnd(t, end);
        const m = document.createElement("mark");
        m.className = "pdf-selection-mark";
        try { partial.surroundContents(m); } catch {}
      }
    }
  } catch {}
}
