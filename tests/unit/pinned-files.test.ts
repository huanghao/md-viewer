import { beforeEach, describe, expect, it } from 'bun:test';
import { isPinned, pinFile, unpinFile, getPinnedFiles } from '../../src/client/utils/pinned-files';

// ---- localStorage mock ----
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

beforeEach(() => {
  storage.clear();
});

// ==================== pinned-files ====================

describe('pinned-files', () => {
  it('isPinned returns false when nothing is pinned', () => {
    expect(isPinned('/workspace/README.md')).toBe(false);
  });

  it('pinFile makes isPinned return true', () => {
    pinFile('/workspace/README.md');
    expect(isPinned('/workspace/README.md')).toBe(true);
  });

  it('pinFile does not affect other paths', () => {
    pinFile('/workspace/README.md');
    expect(isPinned('/workspace/OTHER.md')).toBe(false);
  });

  it('unpinFile removes the pin', () => {
    pinFile('/workspace/README.md');
    unpinFile('/workspace/README.md');
    expect(isPinned('/workspace/README.md')).toBe(false);
  });

  it('unpinFile is a no-op for unpinned file', () => {
    expect(() => unpinFile('/workspace/README.md')).not.toThrow();
    expect(isPinned('/workspace/README.md')).toBe(false);
  });

  it('getPinnedFiles returns all pinned paths', () => {
    pinFile('/ws/a.md');
    pinFile('/ws/b.md');
    const pinned = getPinnedFiles();
    expect(pinned.has('/ws/a.md')).toBe(true);
    expect(pinned.has('/ws/b.md')).toBe(true);
    expect(pinned.size).toBe(2);
  });

  it('getPinnedFiles returns empty set when nothing pinned', () => {
    expect(getPinnedFiles().size).toBe(0);
  });

  it('persists across multiple calls (reads from localStorage each time)', () => {
    pinFile('/ws/a.md');
    // Simulate a second call — reads fresh from storage
    expect(isPinned('/ws/a.md')).toBe(true);
    expect(getPinnedFiles().has('/ws/a.md')).toBe(true);
  });

  it('handles corrupted localStorage gracefully', () => {
    storage.setItem('md-viewer:pinned-files', 'not-valid-json');
    expect(() => getPinnedFiles()).not.toThrow();
    expect(getPinnedFiles().size).toBe(0);
  });

  it('handles non-array JSON gracefully', () => {
    storage.setItem('md-viewer:pinned-files', '{"key":"value"}');
    expect(getPinnedFiles().size).toBe(0);
  });

  it('can pin and unpin multiple files independently', () => {
    pinFile('/ws/a.md');
    pinFile('/ws/b.md');
    pinFile('/ws/c.md');
    unpinFile('/ws/b.md');
    const pinned = getPinnedFiles();
    expect(pinned.has('/ws/a.md')).toBe(true);
    expect(pinned.has('/ws/b.md')).toBe(false);
    expect(pinned.has('/ws/c.md')).toBe(true);
  });
});
