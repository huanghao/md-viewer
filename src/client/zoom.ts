// src/client/zoom.ts

export const MD_ZOOM_MIN = 0.5;
export const MD_ZOOM_MAX = 2.0;
export const PDF_ZOOM_MIN = 0.5;
export const PDF_ZOOM_MAX = 3.0;
export const ZOOM_STEP = 0.1;
export const PDF_ZOOM_DEFAULT = 1.5;

export function clampZoom(value: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max(value, min), max) * 100) / 100;
}

/** Steps current zoom by ±0.1. Uses wide internal bounds (0–99); callers must apply domain clamp (MD_ZOOM_MIN/MAX or PDF_ZOOM_MIN/MAX). */
export function zoomStep(current: number, direction: 1 | -1): number {
  return clampZoom(current + direction * ZOOM_STEP, 0, 99);
}

export function pdfZoomKey(filePath: string): string {
  return `md-viewer:pdf-zoom:${filePath}`;
}
