import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  initZoom,
  zoomIn,
  zoomOut,
  zoomReset,
  getPdfZoom,
  setPdfZoomValue,
  updateZoomDisplay,
} from '../../src/client/zoom-controller';
import { PDF_ZOOM_DEFAULT } from '../../src/client/zoom';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return Array.from(this.data.keys())[index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

const storage = new MemoryStorage();
(globalThis as any).localStorage = storage;

const setPropertyMock = mock();
const getElementMock = mock(() => null);
(globalThis as any).document = {
  documentElement: { style: { setProperty: setPropertyMock } },
  getElementById: getElementMock,
};

function makeDeps(currentFile?: string, viewer?: { setScale: ReturnType<typeof mock> }) {
  return {
    getCurrentFile: () => currentFile,
    getPdfViewer: mock((_: string) => viewer ?? null),
  };
}

beforeEach(() => {
  storage.clear();
  setPropertyMock.mockReset();
  getElementMock.mockReset();
  getElementMock.mockReturnValue(null);
});

describe('getPdfZoom', () => {
  it('returns PDF_ZOOM_DEFAULT when no stored value', () => {
    expect(getPdfZoom('/test.pdf')).toBe(PDF_ZOOM_DEFAULT);
  });

  it('returns stored value', () => {
    storage.setItem('md-viewer:pdf-zoom:/test.pdf', '2');
    expect(getPdfZoom('/test.pdf')).toBe(2);
  });
});

describe('initZoom', () => {
  it('reads fontScale from storage', () => {
    storage.setItem('fontScale', '1.5');
    initZoom(makeDeps());
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '1.5');
  });

  it('defaults to 1.0 when no stored value', () => {
    initZoom(makeDeps());
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '1');
  });
});

describe('zoomIn / zoomOut / zoomReset (MD mode)', () => {
  beforeEach(() => initZoom(makeDeps('/test.md')));

  it('zoomIn increases fontScale', () => {
    setPropertyMock.mockReset();
    zoomIn();
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '1.1');
  });

  it('zoomOut decreases fontScale', () => {
    setPropertyMock.mockReset();
    zoomOut();
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '0.9');
  });

  it('zoomReset sets fontScale to 1.0', () => {
    zoomIn();
    setPropertyMock.mockReset();
    zoomReset();
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '1');
  });
});

describe('zoomReset (PDF mode)', () => {
  it('sets PDF zoom to PDF_ZOOM_DEFAULT', () => {
    const deps = makeDeps('/test.pdf');
    initZoom(deps);
    zoomReset();
    expect(getPdfZoom('/test.pdf')).toBe(PDF_ZOOM_DEFAULT);
  });
});

describe('zoomIn / zoomOut (PDF mode)', () => {
  it('zoomIn calls getPdfViewer().setScale with clamped value', async () => {
    const setScale = mock(() => Promise.resolve());
    const deps = makeDeps('/test.pdf', { setScale });
    initZoom(deps);
    zoomIn();
    await new Promise(r => setTimeout(r, 350));
    expect(setScale).toHaveBeenCalled();
    const [scale] = (setScale as any).mock.calls[0];
    expect(scale).toBeGreaterThan(PDF_ZOOM_DEFAULT);
  });

  it('zoomOut calls getPdfViewer().setScale with clamped value', async () => {
    const setScale = mock(() => Promise.resolve());
    const deps = makeDeps('/test.pdf', { setScale });
    initZoom(deps);
    zoomOut();
    await new Promise(r => setTimeout(r, 350));
    expect(setScale).toHaveBeenCalled();
    const [scale] = (setScale as any).mock.calls[0];
    expect(scale).toBeLessThan(PDF_ZOOM_DEFAULT);
  });
});

describe('setPdfZoomValue', () => {
  it('writes to storage immediately', () => {
    const deps = makeDeps('/test.pdf');
    initZoom(deps);
    setPdfZoomValue('/test.pdf', 2.0);
    expect(getPdfZoom('/test.pdf')).toBe(2.0);
  });

  it('debounces viewer.setScale call', async () => {
    const setScale = mock(() => Promise.resolve());
    const deps = makeDeps('/test.pdf', { setScale });
    initZoom(deps);
    setPdfZoomValue('/test.pdf', 2.0);
    expect(setScale).not.toHaveBeenCalled();
    await new Promise(r => setTimeout(r, 350));
    expect(setScale).toHaveBeenCalledWith(2.0);
  });
});

describe('updateZoomDisplay', () => {
  it('shows MD percentage text on fontScaleText element', () => {
    const btn = { textContent: '' };
    getElementMock.mockReturnValue(btn);
    initZoom(makeDeps('/test.md'));
    setPropertyMock.mockReset();
    updateZoomDisplay();
    expect(btn.textContent).toBe('100%');
  });

  it('shows PDF percentage text for PDF file', () => {
    const btn = { textContent: '' };
    getElementMock.mockReturnValue(btn);
    const deps = makeDeps('/test.pdf');
    initZoom(deps);
    storage.setItem('md-viewer:pdf-zoom:/test.pdf', '2');
    updateZoomDisplay();
    expect(btn.textContent).toBe('200%');
  });
});
