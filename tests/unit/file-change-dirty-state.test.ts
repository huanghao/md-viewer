/**
 * Tests for file-change dirty state management:
 *
 * Bug 1: addOrUpdateFile overwrites lastModified with fileData.lastModified,
 *        which can erase a newer value already set by an SSE "file-changed" event.
 *
 * Bug 2: saveState does not persist lastModified, so after page reload the
 *        dirty flag (lastModified > displayedModified) is lost.
 */
import { beforeEach, describe, expect, it } from 'bun:test';
import { addOrUpdateFile, saveState, restoreState, state } from '../../src/client/state';
import type { FileData } from '../../src/client/types';

// ── localStorage stub ──────────────────────────────────────────────────────

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.has(key) ? this.data.get(key)! : null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}

const storage = new MemoryStorage();
(globalThis as any).localStorage = storage;

// ── helpers ────────────────────────────────────────────────────────────────

function makeFileData(overrides: Partial<FileData> = {}): FileData {
  return {
    path: '/tmp/foo.md',
    filename: 'foo.md',
    content: '# Hello',
    lastModified: 1000,
    isRemote: false,
    ...overrides,
  };
}

function resetState() {
  state.sessionFiles.clear();
  state.currentFile = null;
  storage.clear();
}

// ── Bug 1: addOrUpdateFile must not downgrade lastModified ─────────────────

describe('addOrUpdateFile — lastModified preservation', () => {
  beforeEach(resetState);

  it('keeps the higher lastModified when SSE already set a newer value', () => {
    // Simulate: file opened with mtime 1000
    addOrUpdateFile(makeFileData({ lastModified: 1000 }));

    // Simulate: SSE "file-changed" arrives with mtime 2000
    const file = state.sessionFiles.get('/tmp/foo.md')!;
    file.lastModified = 2000;

    // Simulate: CLI re-opens the same file but server reads mtime 1000 (stale read)
    addOrUpdateFile(makeFileData({ lastModified: 1000 }));

    // lastModified must NOT be downgraded — dirty state must be preserved
    expect(state.sessionFiles.get('/tmp/foo.md')!.lastModified).toBe(2000);
  });

  it('does update lastModified when the new value is genuinely newer', () => {
    addOrUpdateFile(makeFileData({ lastModified: 1000 }));

    addOrUpdateFile(makeFileData({ lastModified: 3000 }));

    expect(state.sessionFiles.get('/tmp/foo.md')!.lastModified).toBe(3000);
  });

  it('preserves dirty flag (lastModified > displayedModified) after re-open with stale data', () => {
    addOrUpdateFile(makeFileData({ lastModified: 1000 }));

    // SSE sets newer mtime → file becomes dirty
    const file = state.sessionFiles.get('/tmp/foo.md')!;
    file.lastModified = 2000;

    // Re-open with stale mtime
    addOrUpdateFile(makeFileData({ lastModified: 1000 }));

    const updated = state.sessionFiles.get('/tmp/foo.md')!;
    expect(updated.lastModified).toBeGreaterThan(updated.displayedModified);
  });
});

// ── Bug 2: saveState / restoreState must persist lastModified ─────────────

describe('saveState / restoreState — lastModified persistence', () => {
  beforeEach(resetState);

  it('restores lastModified so dirty flag survives a page reload', async () => {
    addOrUpdateFile(makeFileData({ lastModified: 1000 }), false);

    // SSE marks file dirty
    const file = state.sessionFiles.get('/tmp/foo.md')!;
    file.lastModified = 2000;
    saveState();

    // Simulate page reload: clear in-memory state, then restore
    state.sessionFiles.clear();
    state.currentFile = null;

    // loadFile stub returns the same content with mtime 1000 (server hasn't changed)
    const loadFileMock = async (_path: string, _silent: boolean) => makeFileData({ lastModified: 1000 });

    await restoreState(loadFileMock);

    const restored = state.sessionFiles.get('/tmp/foo.md')!;
    // After restore, lastModified should still reflect the SSE-updated value (2000)
    // so the dirty indicator (refresh/diff buttons) is shown again
    expect(restored.lastModified).toBe(2000);
    expect(restored.lastModified).toBeGreaterThan(restored.displayedModified);
  });

  it('does not show dirty flag when file was clean before reload', async () => {
    addOrUpdateFile(makeFileData({ lastModified: 1000 }), false);
    // No SSE update — file is clean
    saveState();

    state.sessionFiles.clear();
    state.currentFile = null;

    const loadFileMock = async (_path: string, _silent: boolean) => makeFileData({ lastModified: 1000 });

    await restoreState(loadFileMock);

    const restored = state.sessionFiles.get('/tmp/foo.md')!;
    expect(restored.lastModified).toBe(restored.displayedModified);
  });
});
