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
  handleTextSelected(pageNum: number, selectedText: string, prefix: string, suffix: string): void;
  renderHighlights(annotations: Annotation[]): void;
}

export function createPdfAnnotationBridge(opts: PdfAnnotationBridgeOptions): PdfAnnotationBridge {
  function handleTextSelected(pageNum: number, selectedText: string, prefix: string, suffix: string) {
    // Build a pending annotation and show the composer
    const annotations = opts.getAnnotations();
    const serial = nextAnnotationSerial(annotations);
    const pending: Annotation = {
      id: crypto.randomUUID(),
      serial,
      start: 0,   // unused for PDF
      length: 0,  // unused for PDF
      quote: selectedText,
      quotePrefix: prefix,
      quoteSuffix: suffix,
      note: "",
      createdAt: Date.now(),
      status: "anchored",
      page: pageNum,
      fileType: "pdf",
    } as Annotation & { page: number; fileType: "pdf" };

    // Dispatch custom event that annotation.ts composer listens to
    document.dispatchEvent(new CustomEvent("pdf:show-composer", {
      detail: { annotation: pending, filePath: opts.filePath }
    }));
  }

  function renderHighlights(annotations: Annotation[]) {
    opts.viewer.clearHighlights();
    for (const ann of annotations) {
      const a = ann as Annotation & { page?: number; fileType?: string };
      if (a.fileType === "pdf" && typeof a.page === "number" && a.quote) {
        opts.viewer.highlightQuote(a.page, a.quote);
      }
    }
  }

  return { handleTextSelected, renderHighlights };
}
