import type { PdfViewerInstance } from "./pdf-viewer.js";
import { nextAnnotationSerial } from "./annotation.js";
import type { Annotation } from "./annotation.js";

export interface PdfAnnotationBridgeOptions {
  filePath: string;
  viewer: PdfViewerInstance;
  getAnnotations: () => Annotation[];
  onAnnotationCreated: (ann: Annotation) => void;
}

export interface PdfAnnotationBridge {
  handleTextSelected(
    pageNum: number,
    selectedText: string,
    prefix: string,
    suffix: string,
    clientX: number,
    clientY: number,
    startItemIdx: number,
    endItemIdx: number
  ): void;
  renderHighlights(annotations: Annotation[]): void;
}

export function createPdfAnnotationBridge(opts: PdfAnnotationBridgeOptions): PdfAnnotationBridge {
  function handleTextSelected(
    pageNum: number,
    selectedText: string,
    prefix: string,
    suffix: string,
    clientX: number,
    clientY: number,
    startItemIdx: number,
    endItemIdx: number
  ) {
    // Build a pending annotation and show the composer
    const annotations = opts.getAnnotations();
    const serial = nextAnnotationSerial(annotations);
    const pending: Annotation = {
      id: crypto.randomUUID(),
      serial,
      start: startItemIdx,   // PDF: start item index in textContent.items
      length: endItemIdx - startItemIdx + 1,  // PDF: item count
      quote: selectedText,
      quotePrefix: prefix,
      quoteSuffix: suffix,
      note: "",
      createdAt: Date.now(),
      status: "anchored",
      page: pageNum,
      fileType: "pdf",
      pdfItemStart: startItemIdx,
      pdfItemEnd: endItemIdx,
    } as Annotation & { page: number; fileType: "pdf"; pdfItemStart: number; pdfItemEnd: number };

    // Dispatch custom event that annotation.ts composer listens to
    document.dispatchEvent(new CustomEvent("pdf:show-composer", {
      detail: { annotation: pending, filePath: opts.filePath, clientX, clientY }
    }));
  }

  function renderHighlights(annotations: Annotation[]) {
    opts.viewer.clearHighlights();
    const pdfAnns = annotations.filter(a => {
      const pa = a as Annotation & { page?: number; fileType?: string };
      return pa.fileType === "pdf" && typeof pa.page === "number" && a.status !== 'resolved';
    }) as (Annotation & { page: number; fileType: string })[];
    for (const a of pdfAnns) {
      const pa = a as Annotation & { page: number; start?: number; length?: number };
      // Use item index anchor for precise O(1) highlighting
      if (typeof pa.start === "number" && typeof pa.length === "number") {
        const endIdx = pa.start + pa.length - 1;
        opts.viewer.highlightByItemRange(pa.page, pa.start, endIdx, a.id);
      } else {
        opts.viewer.highlightQuote(a.page, a.quote, a.id);
      }
    }
  }

  return { handleTextSelected, renderHighlights };
}
