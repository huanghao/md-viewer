// PDF.js loaded via ES module in html.ts, exposed as window.pdfjsLib after 'pdfjslib-ready' event

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
  onTextSelected?: (pageNum: number, selectedText: string, prefix: string, suffix: string) => void;
  onParagraphClick?: (block: PdfTextBlock) => void;
}

export interface PdfViewerInstance {
  destroy(): void;
  scrollToPage(pageNum: number): void;
  highlightQuote(pageNum: number, quote: string): void;
  clearHighlights(): void;
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
  container.innerHTML = "";
  container.classList.add("pdf-viewer-container");

  const pdfjs = await getPdfjsLib();
  const url = `/api/pdf-asset?path=${encodeURIComponent(filePath)}`;
  const pdfDoc = await pdfjs.getDocument(url).promise;

  const numPages = pdfDoc.numPages;
  const dpr = window.devicePixelRatio || 1;

  // Per-page state
  const pageWrappers: HTMLElement[] = [];
  const textBlocksByPage: Map<number, PdfTextBlock[]> = new Map();
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
    container.appendChild(wrapper);
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
    textLayerDiv.className = "pdf-text-layer";
    textLayerDiv.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: ${viewport.width}px; height: ${viewport.height}px;
      overflow: hidden; opacity: 0.2; line-height: 1;
      pointer-events: auto; user-select: text;
    `;
    wrapper.appendChild(textLayerDiv);

    const textContent = await page.getTextContent();
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
      textLayerDiv.addEventListener("click", (e) => {
        if (window.getSelection()?.toString()) return;
        const clickY = (e as MouseEvent).offsetY / scale;
        const block = findBlockAtY(blocks, clickY);
        if (block) opts.onParagraphClick!(block);
      });
    }
    if (opts.onTextSelected) {
      textLayerDiv.addEventListener("mouseup", () => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed) return;
        const selectedText = sel.toString().trim();
        if (!selectedText) return;
        const { prefix, suffix } = getSelectionContext(textContent.items as PdfPageTextItem[], selectedText);
        opts.onTextSelected!(pageNum, selectedText, prefix, suffix);
      });
    }

    wrapper.classList.remove("pdf-page-placeholder");
    rendered.add(pageNum);
    rendering.delete(pageNum);
  }

  // Step 4: IntersectionObserver — render pages as they approach the viewport
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const pageNum = parseInt((entry.target as HTMLElement).dataset.page || "0", 10);
          if (pageNum) renderPage(pageNum);
        }
      }
    },
    { root: null, rootMargin: `${RENDER_MARGIN}px 0px`, threshold: 0 }
  );

  for (const wrapper of pageWrappers) {
    observer.observe(wrapper);
  }

  // Public API
  function scrollToPage(pageNum: number) {
    const wrapper = pageWrappers[pageNum - 1];
    if (wrapper) wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function highlightQuote(pageNum: number, quote: string) {
    clearHighlights();
    const wrapper = pageWrappers[pageNum - 1];
    if (!wrapper) return;
    // If not yet rendered, render first then highlight
    if (!rendered.has(pageNum)) {
      renderPage(pageNum).then(() => highlightQuote(pageNum, quote));
      return;
    }
    const textLayer = wrapper.querySelector(".pdf-text-layer") as HTMLElement;
    if (!textLayer) return;
    const spans = Array.from(textLayer.querySelectorAll("span"));
    const normalizedQuote = quote.toLowerCase().replace(/\s+/g, " ").trim();
    for (const span of spans) {
      const text = (span.textContent || "").toLowerCase().replace(/\s+/g, " ").trim();
      if (text && normalizedQuote.includes(text)) {
        span.classList.add("pdf-highlight");
      }
    }
  }

  function clearHighlights() {
    container.querySelectorAll(".pdf-highlight").forEach((el) => {
      el.classList.remove("pdf-highlight");
    });
  }

  function getTextBlocks(pageNum: number): PdfTextBlock[] {
    return textBlocksByPage.get(pageNum) ?? [];
  }

  function destroy() {
    observer.disconnect();
    container.innerHTML = "";
    container.classList.remove("pdf-viewer-container");
    rendered.clear();
    rendering.clear();
    textBlocksByPage.clear();
  }

  function getRenderedCount(): number { return rendered.size; }
  function getTotalPages(): number { return numPages; }

  return { destroy, scrollToPage, highlightQuote, clearHighlights, getTextBlocks, getRenderedCount, getTotalPages };
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
