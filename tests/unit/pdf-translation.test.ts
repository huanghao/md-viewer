import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { TranslationProvider } from '../../src/client/pdf-translation';

// localStorage polyfill for Bun test environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
  clear: () => { for (const k of Object.keys(store)) delete store[k]; },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
(globalThis as any).localStorage = localStorageMock;

// Import after polyfill so module-level code sees localStorage
const {
  loadTranslations,
  getTranslations,
  translateBlock,
  retryTranslation,
  removeTranslation,
} = await import('../../src/client/pdf-translation');

const FILE = '/tmp/test.pdf';

function makeBlock(y: number, pageNum = 1, text = 'hello world') {
  return { pageNum, text, y, x: 0, width: 100, height: 12, items: [] } as any;
}

function makeProvider(result: string | Error, delayMs = 0): TranslationProvider {
  return {
    translate: mock(async () => {
      if (delayMs) await new Promise(r => setTimeout(r, delayMs));
      if (result instanceof Error) throw result;
      return result as string;
    }),
  };
}

beforeEach(() => {
  localStorageMock.clear();
  loadTranslations(FILE); // reset in-memory list
});

describe('translateBlock — cache hit', () => {
  it('does not call provider when cached translation exists', async () => {
    const block = makeBlock(10);
    const startItemIdx = Math.round(block.y * 10);
    const cached = {
      originalText: block.text,
      translatedText: '你好世界',
      pageNum: block.pageNum,
      startItemIdx,
      endItemIdx: startItemIdx,
      timestamp: Date.now(),
    };
    localStorage.setItem(`md-viewer:translation:${FILE}:${block.pageNum}:${startItemIdx}`, JSON.stringify(cached));
    loadTranslations(FILE);

    const provider = makeProvider('should not be called');
    const updates: number[] = [];
    await translateBlock(block, FILE, provider, () => updates.push(1));

    expect((provider.translate as ReturnType<typeof mock>).mock.calls.length).toBe(0);
    expect(updates.length).toBe(1);
    const entries = getTranslations();
    expect(entries.find(e => e.startItemIdx === startItemIdx)?.translatedText).toBe('你好世界');
  });
});

describe('translateBlock — successful translation', () => {
  it('calls provider, stores result in localStorage and memory', async () => {
    const block = makeBlock(20);
    const startItemIdx = Math.round(block.y * 10);
    const provider = makeProvider('翻译结果');
    const updates: number[] = [];

    await translateBlock(block, FILE, provider, () => updates.push(updates.length));

    // provider called once
    expect((provider.translate as ReturnType<typeof mock>).mock.calls.length).toBe(1);
    // at least 2 onUpdate calls: loading + done
    expect(updates.length).toBeGreaterThanOrEqual(2);

    const key = `md-viewer:translation:${FILE}:${block.pageNum}:${startItemIdx}`;
    const stored = JSON.parse(localStorage.getItem(key)!);
    expect(stored.translatedText).toBe('翻译结果');
    expect(stored.originalText).toBe(block.text);

    const entry = getTranslations().find(e => e.startItemIdx === startItemIdx);
    expect(entry?.translatedText).toBe('翻译结果');
  });

  it('different pages do not share cache', async () => {
    const b1 = makeBlock(5, 1, 'page one text');
    const b2 = makeBlock(5, 2, 'page two text');
    await translateBlock(b1, FILE, makeProvider('第一页'), () => {});
    await translateBlock(b2, FILE, makeProvider('第二页'), () => {});

    const entries = getTranslations();
    expect(entries.find(e => e.pageNum === 1)?.translatedText).toBe('第一页');
    expect(entries.find(e => e.pageNum === 2)?.translatedText).toBe('第二页');
  });
});

describe('translateBlock — error handling', () => {
  it('stores error entry, does not write localStorage', async () => {
    const block = makeBlock(30);
    const startItemIdx = Math.round(block.y * 10);
    const provider = makeProvider(new Error('network failure'));

    await translateBlock(block, FILE, provider, () => {});

    const key = `md-viewer:translation:${FILE}:${block.pageNum}:${startItemIdx}`;
    expect(localStorage.getItem(key)).toBeNull();

    const entry = getTranslations().find(e => e.startItemIdx === startItemIdx);
    expect(entry).toBeDefined();
    expect(entry?.translatedText).toBeNull();
    expect(entry?.error).toContain('network failure');
  });

  it('times out and stores timeout error', async () => {
    const block = makeBlock(40);
    const startItemIdx = Math.round(block.y * 10);
    // delay longer than 5s timeout — use a provider that never resolves
    const provider: TranslationProvider = {
      translate: () => new Promise(() => {}), // never resolves
    };

    // Override timeout to 50ms for test speed
    const origRace = Promise.race.bind(Promise);
    (Promise as any).race = (promises: Promise<any>[]) => {
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('翻译超时，请重试')), 50)
      );
      return origRace([...promises.filter((p) => p !== promises[1]), timeout]);
    };

    await translateBlock(block, FILE, provider, () => {});
    (Promise as any).race = origRace;

    const entry = getTranslations().find(e => e.startItemIdx === startItemIdx);
    expect(entry?.error).toBeDefined();
  }, 3000);
});

describe('retryTranslation', () => {
  it('clears error, sets loading, then succeeds', async () => {
    const block = makeBlock(50);
    const startItemIdx = Math.round(block.y * 10);

    // First: fail
    await translateBlock(block, FILE, makeProvider(new Error('fail')), () => {});
    const errorEntry = getTranslations().find(e => e.startItemIdx === startItemIdx);
    expect(errorEntry?.error).toBeDefined();

    // Retry: succeed
    const states: Array<{ translatedText: string | null; error?: string }> = [];
    await retryTranslation(errorEntry!, FILE, makeProvider('重试成功'), () => {
      const e = getTranslations().find(t => t.startItemIdx === startItemIdx);
      if (e) states.push({ translatedText: e.translatedText, error: e.error });
    });

    // First onUpdate after retry should be loading (null, no error)
    expect(states[0].translatedText).toBeNull();
    expect(states[0].error).toBeUndefined();
    // Final state should be success
    const final = getTranslations().find(e => e.startItemIdx === startItemIdx);
    expect(final?.translatedText).toBe('重试成功');
    expect(final?.error).toBeUndefined();
  });
});

describe('loadTranslations', () => {
  it('loads only entries for the given file', () => {
    const otherFile = '/tmp/other.pdf';
    const idx = 100;
    localStorage.setItem(`md-viewer:translation:${FILE}:1:${idx}`, JSON.stringify({
      originalText: 'a', translatedText: 'A', pageNum: 1, startItemIdx: idx, endItemIdx: idx, timestamp: 1,
    }));
    localStorage.setItem(`md-viewer:translation:${otherFile}:1:${idx}`, JSON.stringify({
      originalText: 'b', translatedText: 'B', pageNum: 1, startItemIdx: idx, endItemIdx: idx, timestamp: 1,
    }));
    localStorage.setItem('unrelated-key', 'noise');

    loadTranslations(FILE);
    const entries = getTranslations();
    expect(entries.length).toBe(1);
    expect(entries[0].translatedText).toBe('A');
  });

  it('silently skips corrupt JSON entries', () => {
    localStorage.setItem(`md-viewer:translation:${FILE}:1:999`, 'not-json{{{');
    loadTranslations(FILE);
    expect(getTranslations().length).toBe(0);
  });

  it('skips entries missing required fields', () => {
    localStorage.setItem(`md-viewer:translation:${FILE}:1:888`, JSON.stringify({ pageNum: 1 }));
    loadTranslations(FILE);
    expect(getTranslations().length).toBe(0);
  });

  it('sorts entries by pageNum then startItemIdx', () => {
    const make = (page: number, idx: number) => ({
      originalText: 'x', translatedText: 'y', pageNum: page, startItemIdx: idx, endItemIdx: idx, timestamp: 1,
    });
    localStorage.setItem(`md-viewer:translation:${FILE}:2:10`, JSON.stringify(make(2, 10)));
    localStorage.setItem(`md-viewer:translation:${FILE}:1:20`, JSON.stringify(make(1, 20)));
    localStorage.setItem(`md-viewer:translation:${FILE}:1:5`, JSON.stringify(make(1, 5)));

    loadTranslations(FILE);
    const entries = getTranslations();
    expect(entries.map(e => `${e.pageNum}:${e.startItemIdx}`)).toEqual(['1:5', '1:20', '2:10']);
  });
});

describe('removeTranslation', () => {
  it('removes from both localStorage and memory', async () => {
    const block = makeBlock(60);
    const startItemIdx = Math.round(block.y * 10);
    await translateBlock(block, FILE, makeProvider('删除测试'), () => {});

    expect(getTranslations().find(e => e.startItemIdx === startItemIdx)).toBeDefined();

    removeTranslation(FILE, block.pageNum, startItemIdx);

    expect(getTranslations().find(e => e.startItemIdx === startItemIdx)).toBeUndefined();
    const key = `md-viewer:translation:${FILE}:${block.pageNum}:${startItemIdx}`;
    expect(localStorage.getItem(key)).toBeNull();
  });
});
