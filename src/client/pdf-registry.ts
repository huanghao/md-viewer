import type { PdfViewerInstance } from './pdf-viewer.js';
import type { PdfAnnotationBridge } from './pdf-annotation';
import { state } from './state';
import { currentPdfViewer, setCurrentPdfViewer } from './pdf-state';
import { storageSet } from './utils/storage';

export interface PdfViewerEntry {
  viewer: PdfViewerInstance;
  lastActiveAt: number;
  idleTimer: ReturnType<typeof setTimeout> | null;
  savedScrollTop?: number;
}

export const pdfViewerRegistry = new Map<string, PdfViewerEntry>();

export const currentPdfBridgeRef: { value: PdfAnnotationBridge | null } = { value: null };

export const PDF_MODE_KEY = 'md-viewer:pdf-mode';
export const PDF_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

export function applyPdfModeButtons(mode: 'select' | 'annotate'): void {
  const isAnnotate = mode === 'annotate';
  const selectBtn = document.getElementById('pdfModeSelectBtn');
  const annotateBtn = document.getElementById('pdfModeAnnotateBtn');
  if (selectBtn) selectBtn.classList.toggle('is-active', !isAnnotate);
  if (annotateBtn) annotateBtn.classList.toggle('is-active', isAnnotate);
}

export function setPdfMode(mode: 'select' | 'annotate'): void {
  const nextMode = mode === 'annotate' ? 'annotate' : 'select';
  storageSet(PDF_MODE_KEY, nextMode);
  currentPdfViewer?.setAnnotateMode(nextMode === 'annotate');
  applyPdfModeButtons(nextMode);
}

export function evictPdfViewer(filePath: string): void {
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) clearTimeout(entry.idleTimer);
  entry.viewer.destroy();
  if (currentPdfViewer === entry.viewer) {
    setCurrentPdfViewer(null);
  }
  pdfViewerRegistry.delete(filePath);
}

export function scheduleEviction(filePath: string): void {
  if (!state.config.pdfIdleEviction) return;
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) clearTimeout(entry.idleTimer);
  entry.idleTimer = setTimeout(() => evictPdfViewer(filePath), PDF_IDLE_TIMEOUT_MS);
}

export function cancelEviction(filePath: string): void {
  const entry = pdfViewerRegistry.get(filePath);
  if (!entry) return;
  if (entry.idleTimer) {
    clearTimeout(entry.idleTimer);
    entry.idleTimer = null;
  }
  entry.lastActiveAt = Date.now();
}
