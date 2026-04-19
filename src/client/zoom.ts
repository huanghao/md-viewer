// src/client/zoom.ts

export const MD_ZOOM_MIN = 0.5;
export const MD_ZOOM_MAX = 2.0;
export const PDF_ZOOM_MIN = 0.5;
export const PDF_ZOOM_MAX = 3.0;
export const ZOOM_STEP = 0.1;

export function clampZoom(value: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max(value, min), max) * 100) / 100;
}

export function zoomStep(current: number, direction: 1 | -1): number {
  return clampZoom(current + direction * ZOOM_STEP, 0, 99);
}

export function PDF_ZOOM_KEY(filePath: string): string {
  return `md-viewer:pdf-zoom:${filePath}`;
}
