// tests/unit/zoom-controls.test.ts
import { describe, expect, it } from 'bun:test';
import { clampZoom, zoomStep, PDF_ZOOM_KEY } from '../../src/client/zoom';

describe('clampZoom', () => {
  it('clamps below min', () => expect(clampZoom(0.3, 0.5, 3.0)).toBe(0.5));
  it('clamps above max', () => expect(clampZoom(3.5, 0.5, 3.0)).toBe(3.0));
  it('passes through valid value', () => expect(clampZoom(1.5, 0.5, 3.0)).toBe(1.5));
  it('rounds to 2 decimal places', () => expect(clampZoom(1.100000001, 0.5, 3.0)).toBe(1.1));
});

describe('zoomStep', () => {
  it('steps up by 0.1', () => expect(zoomStep(1.0, +1)).toBe(1.1));
  it('steps down by 0.1', () => expect(zoomStep(1.0, -1)).toBe(0.9));
  it('rounds correctly at float boundary', () => expect(zoomStep(0.9, +1)).toBe(1.0));
});

describe('PDF_ZOOM_KEY', () => {
  it('generates correct localStorage key', () => {
    expect(PDF_ZOOM_KEY('/docs/report.pdf')).toBe('md-viewer:pdf-zoom:/docs/report.pdf');
  });
});
