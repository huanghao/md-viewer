import type { PdfViewerInstance } from "./pdf-viewer.js";
import { nextAnnotationSerial, showQuickAdd, showPopover } from "./annotation.js";
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
  handleAnnotationClick(annotationId: string, clientX: number, clientY: number): void;
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
    const pendingRect = (window as any).__pdfPendingRectCoords as
      { pageNum: number; x1: number; y1: number; x2: number; y2: number } | null | undefined;
    (window as any).__pdfPendingRectCoords = null;
    const rectCoords = pendingRect && pendingRect.pageNum === pageNum
      ? { x1: pendingRect.x1, y1: pendingRect.y1, x2: pendingRect.x2, y2: pendingRect.y2 }
      : undefined;
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
      rectCoords,
    } as Annotation & { page: number; fileType: "pdf"; pdfItemStart: number; pdfItemEnd: number };

    // Show quickAdd button (same UX as MD: user clicks + to open composer)
    showQuickAdd(clientX + 6, clientY - 8, pending);
  }

  function renderHighlights(annotations: Annotation[]) {
    // Remove temp selection marks now that permanent highlights are about to be drawn
    opts.viewer.clearSelectionMark();
    opts.viewer.clearHighlights();
    const pdfAnns = annotations.filter(a => {
      const pa = a as Annotation & { page?: number; fileType?: string };
      return pa.fileType === "pdf" && typeof pa.page === "number" && a.status !== 'resolved';
    }) as (Annotation & { page: number; fileType: string })[];
    for (const a of pdfAnns) {
      const pa = a as Annotation & {
        page: number;
        start?: number;
        length?: number;
        rectCoords?: { x1: number; y1: number; x2: number; y2: number };
      };
      // Rect highlight only — span highlight not used in canvas-rect mode
      if (pa.rectCoords) {
        const { x1, y1, x2, y2 } = pa.rectCoords;
        opts.viewer.renderRectHighlight(pa.page, x1, y1, x2, y2, a.id);
      }
    }
  }

  function handleAnnotationClick(annotationId: string, clientX: number, clientY: number) {
    const ann = opts.getAnnotations().find(a => a.id === annotationId);
    if (!ann) return;
    // Place popover at right edge of viewport so it doesn't cover the PDF
    showPopover(ann, window.innerWidth, clientY - 8);
  }

  return { handleTextSelected, handleAnnotationClick, renderHighlights };
}
