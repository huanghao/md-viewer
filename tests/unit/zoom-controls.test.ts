// tests/unit/zoom-controls.test.ts
import { describe, expect, it } from 'bun:test';
import { clampZoom, zoomStep, pdfZoomKey, MD_ZOOM_MIN, MD_ZOOM_MAX, PDF_ZOOM_MIN, PDF_ZOOM_MAX, PDF_ZOOM_DEFAULT, ZOOM_STEP } from '../../src/client/zoom';

describe('clampZoom', () => {
  it('clamps below min', () => expect(clampZoom(0.3, 0.5, 3.0)).toBe(0.5));
  it('clamps above max', () => expect(clampZoom(3.5, 0.5, 3.0)).toBe(3.0));
  it('passes through valid value', () => expect(clampZoom(1.5, 0.5, 3.0)).toBe(1.5));
  it('rounds to 2 decimal places', () => expect(clampZoom(1.100000001, 0.5, 3.0)).toBe(1.1));
  it('returns min when value equals min', () => expect(clampZoom(0.5, 0.5, 3.0)).toBe(0.5));
  it('returns max when value equals max', () => expect(clampZoom(3.0, 0.5, 3.0)).toBe(3.0));
});

describe('zoomStep', () => {
  it('steps up by 0.1', () => expect(zoomStep(1.0, +1)).toBe(1.1));
  it('steps down by 0.1', () => expect(zoomStep(1.0, -1)).toBe(0.9));
  it('rounds correctly at float boundary', () => expect(zoomStep(0.9, +1)).toBe(1.0));
});

describe('double-clamp pattern (caller applies domain bounds)', () => {
  it('MD zoom at max clamps correctly', () => {
    const result = clampZoom(zoomStep(MD_ZOOM_MAX, +1), MD_ZOOM_MIN, MD_ZOOM_MAX);
    expect(result).toBe(MD_ZOOM_MAX);
  });
  it('MD zoom at min clamps correctly', () => {
    const result = clampZoom(zoomStep(MD_ZOOM_MIN, -1), MD_ZOOM_MIN, MD_ZOOM_MAX);
    expect(result).toBe(MD_ZOOM_MIN);
  });
  it('PDF zoom at max clamps correctly', () => {
    const result = clampZoom(zoomStep(PDF_ZOOM_MAX, +1), PDF_ZOOM_MIN, PDF_ZOOM_MAX);
    expect(result).toBe(PDF_ZOOM_MAX);
  });
  it('PDF zoom at min clamps correctly', () => {
    const result = clampZoom(zoomStep(PDF_ZOOM_MIN, -1), PDF_ZOOM_MIN, PDF_ZOOM_MAX);
    expect(result).toBe(PDF_ZOOM_MIN);
  });
});

describe('constants', () => {
  it('PDF_ZOOM_DEFAULT is 1.5', () => expect(PDF_ZOOM_DEFAULT).toBe(1.5));
  it('ZOOM_STEP is 0.1', () => expect(ZOOM_STEP).toBe(0.1));
  it('MD range is 0.5–2.0', () => { expect(MD_ZOOM_MIN).toBe(0.5); expect(MD_ZOOM_MAX).toBe(2.0); });
  it('PDF range is 0.5–3.0', () => { expect(PDF_ZOOM_MIN).toBe(0.5); expect(PDF_ZOOM_MAX).toBe(3.0); });
});

describe('pdfZoomKey', () => {
  it('generates correct localStorage key', () => {
    expect(pdfZoomKey('/docs/report.pdf')).toBe('md-viewer:pdf-zoom:/docs/report.pdf');
  });
});
