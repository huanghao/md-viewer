import type { PdfViewerInstance } from './pdf-viewer.js';
import type { PdfAnnotationBridge } from './pdf-annotation';

export interface PdfViewerEntry {
  viewer: PdfViewerInstance;
  lastActiveAt: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
  savedScrollTop?: number;
}

export const pdfViewerRegistry = new Map<string, PdfViewerEntry>();

export const currentPdfBridgeRef: { value: PdfAnnotationBridge | null } = { value: null };
