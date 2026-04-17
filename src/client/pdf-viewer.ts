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
  /** Called after a page finishes rendering (canvas + text layer ready) */
  onPageRendered?: (pageNum: number) => void;
}

export interface PdfViewerInstance {
  /** The root DOM element owned by this viewer — attach/detach from #content to show/hide */
  el: HTMLElement;
  destroy(): void;
  scrollToPage(pageNum: number): void;
  /**
   * Highlight quote text. If annotationId is provided, creates clickable annotation-mark.
   */
  highlightQuote(pageNum: number, quote: string, annotationId?: string): void;
  /**
   * Highlight by item index range — O(1) precise anchor.
   * pageItemStart/End are indices into textContent.items for that page.
   */
  highlightByItemRange(pageNum: number, startItemIdx: number, endItemIdx: number, annotationId?: string): void;
  clearHighlights(): void;
  clearSelectionMark(): void;
  getTextBlocks(pageNum: number): PdfTextBlock[];
  getRenderedCount(): number;
  getTotalPages(): number;
}

const SCALE_DEFAULT = 1.5;
const LINE_HEIGHT_MULTIPLIER = 1.5;
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
      pointer-events: auto; user-select: text;
    `;
    wrapper.appendChild(textLayerDiv);

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

      function getOrCreateTranslateBtn(): HTMLButtonElement {
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
      }

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

      textLayerDiv.addEventListener("mouseleave", () => {
        if (translateBtn) translateBtn.style.display = "none";
      });
    }
    if (opts.onTextSelected) {
      let mouseDownPageX = 0, mouseDownPageY = 0;
      textLayerDiv.addEventListener("mousedown", (e) => {
        const me = e as MouseEvent;
        const wrapperRect = wrapper.getBoundingClientRect();
        mouseDownPageX = (me.clientX - wrapperRect.left) / scale;
        mouseDownPageY = (me.clientY - wrapperRect.top) / scale;
        console.log('[pdf] mousedown on textLayer page', pageNum);
      });
      textLayerDiv.addEventListener("mouseup", (e) => {
        const sel = window.getSelection();
        console.log('[pdf] mouseup on textLayer page', pageNum, 'collapsed:', sel?.isCollapsed);
        if (!sel || sel.isCollapsed) return;
        const me = e as MouseEvent;
        const wrapperRect = wrapper.getBoundingClientRect();
        const mouseUpPageX = (me.clientX - wrapperRect.left) / scale;
        const mouseUpPageY = (me.clientY - wrapperRect.top) / scale;
        const pageH = viewport.height / scale;
        // Build rect from mousedown→mouseup in page coords
        const selLeft = Math.min(mouseDownPageX, mouseUpPageX);
        const selRight = Math.max(mouseDownPageX, mouseUpPageX);
        const selTop = Math.min(mouseDownPageY, mouseUpPageY);
        const selBottom = Math.max(mouseDownPageY, mouseUpPageY);
        const allItems = textContent.items as PdfPageTextItem[];
        const selectedIndices: number[] = [];

        // Simplest robust approach: use the single item at selection center.
        // This gives stable anchor (single item index) and avoids partial-word issues.

        function itemVisualBounds(item: PdfPageTextItem) {
          const fontH = item.height || Math.abs(item.transform[3]) || 12;
          // PDF Y: 0 at bottom, grows upward. Screen Y: 0 at top, grows downward.
          // transform[5] is baseline in PDF coords. Convert to screen Y:
          const baselineScreenY = pageH - item.transform[5];
          // Text extends from (baseline - ascent) to (baseline + descent)
          // Approximate ascent ≈ fontH, descent ≈ fontH * 0.3
          return {
            ix: item.transform[4],
            iy: baselineScreenY - fontH,          // top of text
            iRight: item.transform[4] + Math.abs(item.width),
            iBottom: baselineScreenY + fontH * 0.3, // bottom of text (descenders)
            cx: item.transform[4] + Math.abs(item.width) / 2,
            cy: baselineScreenY - fontH * 0.5,      // visual center
          };
        }

        // Find item closest to selection center that horizontally overlaps
        const selCenterX = (selLeft + selRight) / 2;
        const selCenterY = (selTop + selBottom) / 2;

        let closestIdx = -1;
        let closestDist = Infinity;

        for (let i = 0; i < allItems.length; i++) {
          const bounds = itemVisualBounds(allItems[i]);
          // Must horizontally overlap the selection
          const hOverlap = bounds.ix < selRight && bounds.iRight > selLeft;
          // Selection center Y must be within item's vertical bounds
          const vOverlap = selCenterY >= bounds.iy && selCenterY <= bounds.iBottom;

          if (hOverlap && vOverlap) {
            const dx = bounds.cx - selCenterX;
            const dy = bounds.cy - selCenterY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
              closestDist = dist;
              closestIdx = i;
            }
          }
        }

        // Fallback: if no item matches vOverlap, just find closest by Y distance
        if (closestIdx === -1) {
          for (let i = 0; i < allItems.length; i++) {
            const bounds = itemVisualBounds(allItems[i]);
            const hOverlap = bounds.ix < selRight && bounds.iRight > selLeft;
            if (hOverlap) {
              const dy = Math.abs(bounds.cy - selCenterY);
              if (dy < closestDist) {
                closestDist = dy;
                closestIdx = i;
              }
            }
          }
        }

        if (closestIdx === -1) return;

        // Use single item as anchor and quote
        const startItemIdx = closestIdx;
        const endItemIdx = closestIdx;
        const selectedText = allItems[closestIdx].str;

        console.log('[pdf] selectedText:', selectedText);
        console.log('[pdf] item anchor:', { pageNum, startItemIdx, endItemIdx });

        // Context: items before and after
        const CONTEXT_ITEMS = 10;
        const prefix = allItems
          .slice(Math.max(0, startItemIdx - CONTEXT_ITEMS), startItemIdx)
          .map(it => it.str)
          .join(" ")
          .trim();
        const suffix = allItems
          .slice(endItemIdx + 1, Math.min(allItems.length, endItemIdx + 1 + CONTEXT_ITEMS))
          .map(it => it.str)
          .join(" ")
          .trim();

        opts.onTextSelected!(pageNum, selectedText, prefix, suffix, me.clientX, me.clientY, startItemIdx, endItemIdx);
      });
    }

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
  function highlightByItemRange(pageNum: number, startItemIdx: number, endItemIdx: number, annotationId?: string) {
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

    // Get the quote text for this item range
    const rangeQuote = items.slice(safeStart, safeEnd + 1).map(it => it.str).join(" ").trim();
    if (!rangeQuote) return;

    console.log('[pdf] highlightByItemRange:', { pageNum, safeStart, safeEnd, rangeQuote: rangeQuote.substring(0, 50) });

    // Find span that contains this quote (exact or partial match)
    let matched = false;
    for (const span of spans) {
      const spanText = (span.textContent || "").trim();
      // Try exact match first
      if (spanText === rangeQuote) {
        span.classList.add("pdf-highlight");
        if (annotationId) {
          span.classList.add("annotation-mark");
          span.dataset.annotationId = annotationId;
        }
        matched = true;
        console.log('[pdf] exact match');
        break;
      }
      // Then try if span contains the quote
      if (spanText.includes(rangeQuote)) {
        span.classList.add("pdf-highlight");
        if (annotationId) {
          span.classList.add("annotation-mark");
          span.dataset.annotationId = annotationId;
        }
        matched = true;
        console.log('[pdf] partial match');
        break;
      }
    }

    if (!matched) {
      console.log('[pdf] no match found for quote:', rangeQuote.substring(0, 50));
    }
  }

  function clearHighlights() {
    el.querySelectorAll(".pdf-highlight, .annotation-mark").forEach((node) => {
      node.classList.remove("pdf-highlight");
      node.classList.remove("annotation-mark");
      delete (node as HTMLElement).dataset.annotationId;
    });
  }

  function clearSelectionMark() {
    // <mark> elements inserted by markSelectionSpans — unwrap them
    el.querySelectorAll("mark.pdf-selection-mark").forEach((mark) => {
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
  }

  function getRenderedCount(): number { return rendered.size; }
  function getTotalPages(): number { return numPages; }

  return { el, destroy, scrollToPage, highlightQuote, highlightByItemRange, clearHighlights, clearSelectionMark, getTextBlocks, getRenderedCount, getTotalPages };
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
