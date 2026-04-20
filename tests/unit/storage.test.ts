import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { storageGet, storageSet, storageGetNumber, getAllStorageKeys, storageRemove } from '../../src/client/utils/storage';

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
