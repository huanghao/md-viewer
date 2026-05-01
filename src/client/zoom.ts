// src/client/zoom.ts

export const MD_ZOOM_MIN = 0.5;
export const MD_ZOOM_MAX = 2.0;
export const PDF_ZOOM_MIN = 0.5;
export const PDF_ZOOM_MAX = 3.0;
export const ZOOM_STEP = 0.25;
export const PDF_ZOOM_DEFAULT = 1.5;

export function clampZoom(value: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max(value, min), max) * 100) / 100;
}

/** Steps current zoom by ±0.25. Uses wide internal bounds (0–99); callers must apply domain clamp. */
export function zoomStep(current: number, direction: 1 | -1): number {
  return clampZoom(current + direction * ZOOM_STEP, 0, 99);
}

export function pdfZoomKey(filePath: string): string {
  return `md-viewer:pdf-zoom:${filePath}`;
}

/**
 * Parse user-typed zoom input. Accepts: "150", "150%", "1.5".
 * Returns scale as a ratio (e.g. 1.5 for 150%), or null if invalid.
 */
export function parseZoomInput(raw: string): number | null {
  const s = raw.trim().replace(/%$/, '');
  if (!s) return null;
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  return n <= 5.0 ? n : n / 100;
}
