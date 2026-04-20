import { storageSet, storageGetNumber } from './utils/storage';
import { clampZoom, zoomStep, pdfZoomKey, MD_ZOOM_MIN, MD_ZOOM_MAX, PDF_ZOOM_MIN, PDF_ZOOM_MAX, PDF_ZOOM_DEFAULT } from './zoom';

export interface ZoomDeps {
  getCurrentFile: () => string | undefined;
  getPdfViewer: (filePath: string) => { setScale(s: number): Promise<void> } | null;
}

let _deps: ZoomDeps = {
  getCurrentFile: () => undefined,
  getPdfViewer: () => null,
};

let currentFontScale = 1.0;
let pdfZoomDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function isPdf(filePath: string | undefined): boolean {
  return !!filePath && filePath.toLowerCase().endsWith('.pdf');
}

export function initZoom(deps: ZoomDeps): void {
  _deps = deps;
  currentFontScale = storageGetNumber('fontScale', 1);
  applyFontScale();
}

export function applyFontScale(): void {
  document.documentElement.style.setProperty('--font-scale', currentFontScale.toString());
  storageSet('fontScale', currentFontScale);
  updateZoomDisplay();
}

export function zoomIn(): void {
  const currentFile = _deps.getCurrentFile();
  if (isPdf(currentFile)) {
    adjustPdfZoom(+1);
  } else {
    currentFontScale = clampZoom(zoomStep(currentFontScale, +1), MD_ZOOM_MIN, MD_ZOOM_MAX);
    applyFontScale();
  }
}

export function zoomOut(): void {
  const currentFile = _deps.getCurrentFile();
  if (isPdf(currentFile)) {
    adjustPdfZoom(-1);
  } else {
    currentFontScale = clampZoom(zoomStep(currentFontScale, -1), MD_ZOOM_MIN, MD_ZOOM_MAX);
    applyFontScale();
  }
}

export function zoomReset(): void {
  const currentFile = _deps.getCurrentFile();
  if (isPdf(currentFile)) {
    setPdfZoomValue(currentFile!, PDF_ZOOM_DEFAULT);
  } else {
    currentFontScale = 1.0;
    applyFontScale();
  }
}

function adjustPdfZoom(direction: 1 | -1): void {
  const currentFile = _deps.getCurrentFile();
  if (!currentFile) return;
  const current = getPdfZoom(currentFile);
  const next = clampZoom(zoomStep(current, direction), PDF_ZOOM_MIN, PDF_ZOOM_MAX);
  setPdfZoomValue(currentFile, next);
}

export function setPdfZoomValue(filePath: string, scale: number): void {
  storageSet(pdfZoomKey(filePath), scale);
  updateZoomDisplay();
  if (pdfZoomDebounceTimer) clearTimeout(pdfZoomDebounceTimer);
  pdfZoomDebounceTimer = setTimeout(async () => {
    const viewer = _deps.getPdfViewer(filePath);
    if (viewer) await viewer.setScale(scale);
  }, 300);
}

export function getPdfZoom(filePath: string): number {
  return storageGetNumber(pdfZoomKey(filePath), PDF_ZOOM_DEFAULT);
}

export function updateZoomDisplay(): void {
  const btn = document.getElementById('fontScaleText');
  if (!btn) return;
  const currentFile = _deps.getCurrentFile();
  if (isPdf(currentFile)) {
    const scale = getPdfZoom(currentFile!);
    btn.textContent = `${Math.round(scale * 100)}%`;
  } else {
    btn.textContent = `${Math.round(currentFontScale * 100)}%`;
  }
}
