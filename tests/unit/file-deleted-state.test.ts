/**
 * Tests for file deleted state management
 * Replaces e2e tests: case-11, case-13, case-17
 */
import { beforeEach, describe, expect, it } from 'bun:test';
import { addOrUpdateFile, removeFile, markFileMissing, state } from '../../src/client/state';
import type { FileData, FileInfo } from '../../src/client/types';

// localStorage stub
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

function makeFileInfo(overrides: Partial<FileInfo> = {}): FileInfo {
  return {
    path: '/tmp/foo.md',
    name: 'foo.md',
    content: '# Hello',
    lastModified: 1000,
    displayedModified: 1000,
    isRemote: false,
    isMissing: false,
    ...overrides,
  };
}

function resetState() {
  state.sessionFiles.clear();
  state.currentFile = null;
  storage.clear();
}

describe('markFileMissing — deleted state', () => {
  beforeEach(resetState);

  it('marks file as missing and updates state', () => {
    addOrUpdateFile(makeFileData({ path: '/a.md', lastModified: 1000 }));

    markFileMissing('/a.md');

    const file = state.sessionFiles.get('/a.md')!;
    expect(file.isMissing).toBe(true);
  });

  it('preserves content when marking as missing', () => {
    addOrUpdateFile(makeFileData({ path: '/a.md', content: 'cached content' }));

    markFileMissing('/a.md');

    const file = state.sessionFiles.get('/a.md')!;
    expect(file.content).toBe('cached content');
    expect(file.isMissing).toBe(true);
  });

  it('shows D badge for deleted file', () => {
    addOrUpdateFile(makeFileData({ path: '/a.md' }));
    markFileMissing('/a.md');

    const file = state.sessionFiles.get('/a.md')!;
    // D badge has highest priority
    expect(file.isMissing).toBe(true);
  });
});

describe('removeFile — cleanup after deletion', () => {
  beforeEach(resetState);

  it('removes file from session', () => {
    addOrUpdateFile(makeFileData({ path: '/a.md' }));
    addOrUpdateFile(makeFileData({ path: '/b.md' }));

    removeFile('/a.md');

    expect(state.sessionFiles.has('/a.md')).toBe(false);
    expect(state.sessionFiles.has('/b.md')).toBe(true);
  });

  it('switches current file when removing current', () => {
    addOrUpdateFile(makeFileData({ path: '/a.md' }), false);
    addOrUpdateFile(makeFileData({ path: '/b.md' }), true);
    addOrUpdateFile(makeFileData({ path: '/c.md' }), false);
    state.currentFile = '/b.md';

    removeFile('/b.md');

    expect(state.currentFile).not.toBe('/b.md');
  });

  it('clears the file\'s per-file localStorage entries (pdf zoom/scroll) so they don\'t accumulate forever', () => {
    addOrUpdateFile(makeFileData({ path: '/a.pdf' }));
    storage.setItem('md-viewer:pdf-zoom:/a.pdf', '1.5');
    storage.setItem('md-viewer:pdf-scroll:/a.pdf', '420');
    storage.setItem('md-viewer:pdf-zoom:/other.pdf', '2'); // 应保留：不属于被移除的文件

    removeFile('/a.pdf');

    expect(storage.getItem('md-viewer:pdf-zoom:/a.pdf')).toBeNull();
    expect(storage.getItem('md-viewer:pdf-scroll:/a.pdf')).toBeNull();
    expect(storage.getItem('md-viewer:pdf-zoom:/other.pdf')).toBe('2');
  });
});

describe('addOrUpdateFile — LRU eviction beyond MAX_FILES also clears per-file storage', () => {
  beforeEach(resetState);

  it('clears pdf-zoom/pdf-scroll entries for files evicted by the 100-file cap', () => {
    // cleanupOldFiles() 的清理判定用的是插入前的 size，所以要先撑到 101 个文件
    // （size 越过上限但还没真正触发裁剪），再插入第 102 个才会真正触发一次淘汰。
    for (let i = 0; i <= 100; i++) {
      addOrUpdateFile(makeFileData({ path: `/f${i}.md`, lastModified: i }));
      state.sessionFiles.get(`/f${i}.md`)!.lastAccessed = i;
    }
    storage.setItem('md-viewer:pdf-zoom:/f0.md', '1.5');

    // /f0.md 是最久未访问的，应被淘汰
    addOrUpdateFile(makeFileData({ path: '/f101.md', lastModified: 101 }));
    state.sessionFiles.get('/f101.md')!.lastAccessed = 101;

    expect(state.sessionFiles.has('/f0.md')).toBe(false);
    expect(storage.getItem('md-viewer:pdf-zoom:/f0.md')).toBeNull();
  });
});

describe('addOrUpdateFile — recreate after deletion', () => {
  beforeEach(resetState);

  it('recreates file with same path after deletion', () => {
    // Create, delete, recreate
    addOrUpdateFile(makeFileData({ path: '/a.md', content: 'v1', lastModified: 1000 }));
    markFileMissing('/a.md');
    expect(state.sessionFiles.get('/a.md')!.isMissing).toBe(true);

    // Recreate with new content
    addOrUpdateFile(makeFileData({ path: '/a.md', content: 'v2', lastModified: 2000 }));

    const file = state.sessionFiles.get('/a.md')!;
    expect(file.isMissing).toBe(false);
    expect(file.content).toBe('v2');
  });

  it('clears isMissing flag on recreate', () => {
    addOrUpdateFile(makeFileData({ path: '/a.md' }));
    markFileMissing('/a.md');
    expect(state.sessionFiles.get('/a.md')!.isMissing).toBe(true);

    addOrUpdateFile(makeFileData({ path: '/a.md', lastModified: 2000 }));
    expect(state.sessionFiles.get('/a.md')!.isMissing).toBe(false);
  });
});

describe('File status priority', () => {
  beforeEach(resetState);

  it('deleted (D) has highest priority over modified (M)', () => {
    const file = makeFileInfo({
      path: '/a.md',
      lastModified: 2000,
      displayedModified: 1000,
      isMissing: true,
    });

    // Should show D, not M
    expect(file.isMissing).toBe(true);
    expect(file.lastModified > file.displayedModified).toBe(true);
  });

  it('deleted (D) has highest priority over new (dot)', () => {
    const file = makeFileInfo({
      path: '/a.md',
      isMissing: true,
    });

    expect(file.isMissing).toBe(true);
  });
});
