import { describe, it, expect } from 'bun:test';

describe('applyClientConfig', () => {
  it('sets globalThis.__pdfDefaultScale from config', () => {
    (globalThis as any).__pdfDefaultScale = undefined;

    function applyClientConfig(config: { pdf?: { defaultScale?: number } }) {
      if (config.pdf?.defaultScale) {
        (globalThis as any).__pdfDefaultScale = config.pdf.defaultScale;
      }
    }

    applyClientConfig({ pdf: { defaultScale: 2.0 } });
    expect((globalThis as any).__pdfDefaultScale).toBe(2.0);
  });

  it('falls back to 1.5 if __pdfDefaultScale not set', () => {
    (globalThis as any).__pdfDefaultScale = undefined;

    function getPdfScale(): number {
      return (globalThis as any).__pdfDefaultScale ?? 1.5;
    }

    expect(getPdfScale()).toBe(1.5);
  });
});
