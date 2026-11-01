import { storageSet, storageGetNumber } from './utils/storage';
import { toolbarStore } from './toolbar/store';
import { clampZoom, zoomStep, pdfZoomKey, parseZoomInput, MD_ZOOM_MIN, MD_ZOOM_MAX, PDF_ZOOM_MIN, PDF_ZOOM_MAX, PDF_ZOOM_DEFAULT } from './zoom';

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

/** Apply a zoom value typed into the input field. raw is the string from the input. */
export function setZoomFromInput(raw: string): void {
  const scale = parseZoomInput(raw);
  if (scale === null) return;
  const currentFile = _deps.getCurrentFile();
  if (isPdf(currentFile)) {
    const clamped = clampZoom(scale, PDF_ZOOM_MIN, PDF_ZOOM_MAX);
    setPdfZoomValue(currentFile!, clamped);
  } else {
    currentFontScale = clampZoom(scale, MD_ZOOM_MIN, MD_ZOOM_MAX);
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

export function updateZoomDisplay(force = false): void {
  // 强制刷新时先让正在编辑的缩放输入框失焦（失焦会提交草稿），再显示当前值
  const active = document.activeElement as HTMLElement | null;
  if (force && active?.id === 'fontScaleInput') active.blur();
  const currentFile = _deps.getCurrentFile();
  const scale = isPdf(currentFile) ? getPdfZoom(currentFile!) : currentFontScale;
  toolbarStore.setZoomText(`${Math.round(scale * 100)}%`);
}
