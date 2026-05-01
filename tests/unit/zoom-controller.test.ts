import { beforeEach, describe, expect, it, mock } from 'bun:test';
import {
  initZoom,
  zoomIn,
  zoomOut,
  setZoomFromInput,
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
const mockInput = { value: '', tagName: 'INPUT' };
const getElementMock = mock(() => null);
let activeElement: any = null;
(globalThis as any).document = {
  documentElement: { style: { setProperty: setPropertyMock } },
  getElementById: getElementMock,
};
Object.defineProperty((globalThis as any).document, 'activeElement', {
  get: () => activeElement,
  set: (val: any) => { activeElement = val; },
  configurable: true,
});

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
  mockInput.value = '';
  activeElement = null;
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

describe('zoomIn / zoomOut (MD mode)', () => {
  beforeEach(() => initZoom(makeDeps('/test.md')));

  it('zoomIn increases fontScale by 0.25', () => {
    setPropertyMock.mockReset();
    zoomIn();
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '1.25');
  });

  it('zoomOut decreases fontScale by 0.25', () => {
    setPropertyMock.mockReset();
    zoomOut();
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '0.75');
  });
});

describe('setZoomFromInput (MD mode)', () => {
  beforeEach(() => initZoom(makeDeps('/test.md')));

  it('sets zoom from percent string', () => {
    setPropertyMock.mockReset();
    setZoomFromInput('150%');
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '1.5');
  });

  it('sets zoom from plain number', () => {
    setPropertyMock.mockReset();
    setZoomFromInput('75');
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '0.75');
  });

  it('does nothing for invalid input', () => {
    setPropertyMock.mockReset();
    setZoomFromInput('abc');
    expect(setPropertyMock).not.toHaveBeenCalled();
  });

  it('clamps to MD_ZOOM_MAX', () => {
    setPropertyMock.mockReset();
    setZoomFromInput('500%');
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '2');
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
  it('shows MD percentage in input value', () => {
    getElementMock.mockReturnValue(mockInput);
    initZoom(makeDeps('/test.md'));
    mockInput.value = '';
    updateZoomDisplay();
    expect(mockInput.value).toBe('100%');
  });

  it('shows PDF percentage in input value', () => {
    getElementMock.mockReturnValue(mockInput);
    const deps = makeDeps('/test.pdf');
    initZoom(deps);
    storage.setItem('md-viewer:pdf-zoom:/test.pdf', '2');
    updateZoomDisplay();
    expect(mockInput.value).toBe('200%');
  });

  it('skips update when input is focused', () => {
    activeElement = mockInput;
    getElementMock.mockReturnValue(mockInput);
    initZoom(makeDeps('/test.md'));
    mockInput.value = 'typing...';
    updateZoomDisplay();
    expect(mockInput.value).toBe('typing...');
  });
});

describe('applyFontScale', () => {
  it('sets --font-scale CSS variable and persists to storage', () => {
    initZoom(makeDeps('/test.md'));
    setPropertyMock.mockReset();
    storage.clear();
    zoomIn();
    expect(setPropertyMock).toHaveBeenCalledWith('--font-scale', '1.25');
    expect(storage.getItem('fontScale')).toBe('1.25');
  });
});

describe('PDF zoom clamping', () => {
  it('zoomIn clamps at PDF_ZOOM_MAX', async () => {
    const setScale = mock(() => Promise.resolve());
    const deps = makeDeps('/test.pdf', { setScale });
    initZoom(deps);
    // set current zoom to max
    storage.setItem('md-viewer:pdf-zoom:/test.pdf', '3'); // PDF_ZOOM_MAX = 3.0
    zoomIn();
    await new Promise(r => setTimeout(r, 350));
    const [scale] = (setScale as any).mock.calls[0];
    expect(scale).toBeLessThanOrEqual(3.0);
  });

  it('zoomOut clamps at PDF_ZOOM_MIN', async () => {
    const setScale = mock(() => Promise.resolve());
    const deps = makeDeps('/test.pdf', { setScale });
    initZoom(deps);
    // set current zoom to min
    storage.setItem('md-viewer:pdf-zoom:/test.pdf', '0.5'); // PDF_ZOOM_MIN = 0.5
    zoomOut();
    await new Promise(r => setTimeout(r, 350));
    const [scale] = (setScale as any).mock.calls[0];
    expect(scale).toBeGreaterThanOrEqual(0.5);
  });
});
