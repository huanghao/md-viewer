// PDF.js types via window global (loaded from CDN)
declare const pdfjsLib: any;

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
}

const SCALE_DEFAULT = 1.5;
const LINE_HEIGHT_MULTIPLIER = 1.5; // paragraph grouping threshold

export async function createPdfViewer(opts: PdfViewerOptions): Promise<PdfViewerInstance> {
  const { container, filePath, scale = SCALE_DEFAULT } = opts;
  container.innerHTML = "";
  container.className = "pdf-viewer-container";

  // Load PDF bytes via our server endpoint
  const url = `/api/pdf-asset?path=${encodeURIComponent(filePath)}`;
  const pdfDoc = await pdfjsLib.getDocument(url).promise;

  const pageContainers: HTMLElement[] = [];
  const textBlocksByPage: Map<number, PdfTextBlock[]> = new Map();

  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    // Wrapper div for this page
    const pageWrapper = document.createElement("div");
    pageWrapper.className = "pdf-page-wrapper";
    pageWrapper.dataset.page = String(pageNum);
    pageWrapper.style.position = "relative";
    pageWrapper.style.width = `${viewport.width}px`;
    pageWrapper.style.height = `${viewport.height}px`;
    pageWrapper.style.marginBottom = "16px";

    // Canvas layer
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    pageWrapper.appendChild(canvas);

    // Text layer
    const textLayerDiv = document.createElement("div");
    textLayerDiv.className = "pdf-text-layer";
    textLayerDiv.style.cssText = `
      position: absolute; top: 0; left: 0;
      width: ${viewport.width}px; height: ${viewport.height}px;
      overflow: hidden; opacity: 0.2; line-height: 1;
      pointer-events: auto; user-select: text;
    `;
    pageWrapper.appendChild(textLayerDiv);

    const textContent = await page.getTextContent();
    await pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport,
      textDivs: [],
    }).promise;

    // Build text blocks for this page
    const blocks = buildTextBlocks(pageNum, textContent.items as PdfPageTextItem[], viewport, scale);
    textBlocksByPage.set(pageNum, blocks);

    // Paragraph click handler
    if (opts.onParagraphClick) {
      textLayerDiv.addEventListener("click", (e) => {
        if (window.getSelection()?.toString()) return; // ignore if selecting
        const clickY = (e as MouseEvent).offsetY / scale;
        const block = findBlockAtY(blocks, clickY);
        if (block) opts.onParagraphClick!(block);
      });
    }

    // Text selection handler
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

    container.appendChild(pageWrapper);
    pageContainers.push(pageWrapper);
  }

  function scrollToPage(pageNum: number) {
    const wrapper = pageContainers[pageNum - 1];
    if (wrapper) wrapper.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function highlightQuote(pageNum: number, quote: string) {
    clearHighlights();
    const wrapper = pageContainers[pageNum - 1];
    if (!wrapper) return;
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
    container.innerHTML = "";
  }

  return { destroy, scrollToPage, highlightQuote, clearHighlights, getTextBlocks };
}

function buildTextBlocks(pageNum: number, items: PdfPageTextItem[], viewport: any, scale: number): PdfTextBlock[] {
  if (!items.length) return [];
  // Sort by y descending (PDF coords are bottom-up), then x
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
