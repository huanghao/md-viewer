import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { storageGet, storageSet, storageGetNumber, getAllStorageKeys, storageRemove, pruneDeadFeatureStorageKeys, pruneStalePerFileStorage } from '../../src/client/utils/storage';

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

beforeEach(() => storage.clear());

describe('storageGet', () => {
  it('returns fallback when key is missing', () => {
    expect(storageGet('missing', 42)).toBe(42);
  });

  it('returns parsed value when key exists', () => {
    storage.setItem('key', '{"a":1}');
    expect(storageGet('key', {})).toEqual({ a: 1 });
  });

  it('returns fallback on corrupted JSON', () => {
    storage.setItem('key', 'not-json');
    expect(storageGet('key', 'default')).toBe('default');
  });

  it('returns fallback when value is null', () => {
    expect(storageGet<string[]>('key', [])).toEqual([]);
  });
});

describe('storageSet', () => {
  it('serializes value as JSON', () => {
    storageSet('key', { x: 1 });
    expect(storage.getItem('key')).toBe('{"x":1}');
  });

  it('does not throw on QuotaExceededError', () => {
    const orig = storage.setItem.bind(storage);
    storage.setItem = () => { throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' }); };
    expect(() => storageSet('key', 'value')).not.toThrow();
    storage.setItem = orig;
  });

  it('calls onQuota callback on QuotaExceededError then retries', () => {
    let calls = 0;
    const orig = storage.setItem.bind(storage);
    storage.setItem = (k: string, v: string) => {
      if (calls++ === 0) throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
      orig(k, v);
    };
    const onQuota = mock();
    storageSet('key', 'value', onQuota);
    storage.setItem = orig;
    expect(onQuota).toHaveBeenCalled();
    expect(storage.getItem('key')).toBe('"value"');
  });

  it('does not call onQuota for non-quota errors', () => {
    const orig = storage.setItem.bind(storage);
    storage.setItem = () => { throw new Error('other error'); };
    const onQuota = mock();
    expect(() => storageSet('key', 'value', onQuota)).not.toThrow();
    storage.setItem = orig;
    expect(onQuota).not.toHaveBeenCalled();
  });
});

describe('storageGetNumber', () => {
  it('returns fallback when key is missing', () => {
    expect(storageGetNumber('missing', 100)).toBe(100);
  });

  it('returns parsed number when key exists', () => {
    storage.setItem('key', '320');
    expect(storageGetNumber('key', 0)).toBe(320);
  });

  it('returns fallback for non-numeric value', () => {
    storage.setItem('key', 'abc');
    expect(storageGetNumber('key', 99)).toBe(99);
  });

  it('returns fallback for NaN', () => {
    storage.setItem('key', 'NaN');
    expect(storageGetNumber('key', 5)).toBe(5);
  });
});

describe('getAllStorageKeys', () => {
  it('returns empty array when storage is empty', () => {
    expect(getAllStorageKeys()).toEqual([]);
  });

  it('returns all keys', () => {
    storage.setItem('a', '1');
    storage.setItem('b', '2');
    const keys = getAllStorageKeys();
    expect(keys).toContain('a');
    expect(keys).toContain('b');
    expect(keys.length).toBe(2);
  });
});

describe('storageRemove', () => {
  it('removes an existing key', () => {
    storage.setItem('key', 'value');
    storageRemove('key');
    expect(storage.getItem('key')).toBeNull();
  });

  it('does not throw when key does not exist', () => {
    expect(() => storageRemove('nonexistent')).not.toThrow();
  });
});

describe('pruneDeadFeatureStorageKeys', () => {
  it('removes leftover keys from the deleted todo/chat/rag/translate/monitor features', () => {
    storage.setItem('md-viewer:todo-filter', 'open');
    storage.setItem('md-viewer:chat-session-id', 'abc');
    storage.setItem('md-viewer:chat-sidebar-width', '300');
    // 真实观测到的历史格式：按文件路径单独存一条 chat session（旧版 Chat 面板）
    storage.setItem('md-viewer:chat-session:/Users/huanghao/workspace/foo.md', '{}');
    storage.setItem('md-viewer:agent-url', 'http://localhost:3003');
    storage.setItem('md-viewer:rag-search-history', '[]');
    storage.setItem('md-viewer:translate-url', 'http://localhost:3002');
    // 历史遗留格式（旧版翻译功能用过的 key 结构，前缀不是 "translate:" 而是 "translation:"）
    storage.setItem('md-viewer:translation:/a.pdf:1:4238', '{}');
    storage.setItem('md-viewer:memory-monitor-tab', 'memory');

    pruneDeadFeatureStorageKeys();

    expect(getAllStorageKeys()).toEqual([]);
  });

  it('removes legacy renamed keys left over from past refactors (not feature deletions)', () => {
    storage.setItem('md-viewer:annotation-panel-open-by-file', '{"/a.md":true}');
    storage.setItem('md-viewer:toc-open-by-file', '{"/a.md":false}');
    storage.setItem('md-viewer:focus-expanded', '{}');
    storage.setItem('md-viewer:listDiffPaths', '[]');
    storage.setItem('md-viewer:syncState', '{}');

    pruneDeadFeatureStorageKeys();

    expect(getAllStorageKeys()).toEqual([]);
  });

  it('keeps keys belonging to features that are still alive', () => {
    storage.setItem('md-viewer:config', '{}');
    storage.setItem('md-viewer:pdf-zoom:/a.pdf', '1.5');
    storage.setItem('md-viewer:annotation-density', 'simple');
    storage.setItem('md-viewer:annotation-panel-open', '1'); // 全局版，容易和 -by-file 那条混淆，不该被清
    storage.setItem('md-viewer:toc-open', '1');

    pruneDeadFeatureStorageKeys();

    expect(getAllStorageKeys().sort()).toEqual([
      'md-viewer:annotation-density',
      'md-viewer:annotation-panel-open',
      'md-viewer:config',
      'md-viewer:pdf-zoom:/a.pdf',
      'md-viewer:toc-open',
    ]);
  });
});

describe('pruneStalePerFileStorage', () => {
  it('removes pdf-zoom/pdf-scroll keys for files no longer in the session (历史遗留)', () => {
    storage.setItem('md-viewer:pdf-zoom:/open.pdf', '1.5');
    storage.setItem('md-viewer:pdf-scroll:/open.pdf', '100');
    storage.setItem('md-viewer:pdf-zoom:/closed-long-ago.pdf', '2');
    storage.setItem('md-viewer:pdf-scroll:/closed-long-ago.pdf', '50');
    storage.setItem('md-viewer:config', '{}'); // 非 per-file key，不受影响

    pruneStalePerFileStorage(['/open.pdf']);

    expect(storage.getItem('md-viewer:pdf-zoom:/open.pdf')).toBe('1.5');
    expect(storage.getItem('md-viewer:pdf-scroll:/open.pdf')).toBe('100');
    expect(storage.getItem('md-viewer:pdf-zoom:/closed-long-ago.pdf')).toBeNull();
    expect(storage.getItem('md-viewer:pdf-scroll:/closed-long-ago.pdf')).toBeNull();
    expect(storage.getItem('md-viewer:config')).toBe('{}');
  });
});
