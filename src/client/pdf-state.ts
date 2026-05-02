import type { PdfViewerInstance } from './pdf-viewer';

export let currentPdfViewer: PdfViewerInstance | null = null;
export function setCurrentPdfViewer(v: PdfViewerInstance | null): void {
  currentPdfViewer = v;
}

export let pdfDefaultScale: number | null = null;
export function setPdfDefaultScale(s: number): void {
  pdfDefaultScale = s;
}

export type PdfPendingRectCoords = {
  pageNum: number;
  x1: number; y1: number;
  x2: number; y2: number;
};
export let pdfPendingRectCoords: PdfPendingRectCoords | null = null;
export function setPdfPendingRectCoords(v: PdfPendingRectCoords | null): void {
  pdfPendingRectCoords = v;
}
