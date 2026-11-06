import { afterEach, describe, expect, it, mock } from 'bun:test';
import type { FileTreeNode } from '../../src/client/types';
import { state } from '../../src/client/state';
import {
  globToRegex,
  isIgnored,
  getActiveFiles,
  buildFocusView,
  prepareFocusView,
} from '../../src/client/ui/workspace-focus';
import { formatRelativeTimeShort as formatRelativeTime } from '../../src/client/utils/format';

class MemoryStorage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number) {
    return Array.from(this.data.keys())[index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

if (!(globalThis as any).localStorage) {
  (globalThis as any).localStorage = new MemoryStorage();
}

afterEach(() => {
  localStorage.clear();
  state.config.workspaces = [];
  state.config.focusWindowKey = '8h';
  state.config.focusActiveTypes = ['md', 'pdf'];
  state.config.focusStrategies = ['mtime'];
  state.searchQuery = '';
  state.fileTree.clear();
  state.workspaceLoadingIds.clear();
  state.workspaceFailedIds.clear();
});

// ==================== globToRegex ====================

describe('globToRegex', () => {
  it('matches exact filename', () => {
    expect(globToRegex('README.md').test('README.md')).toBe(true);
    expect(globToRegex('README.md').test('CHANGELOG.md')).toBe(false);
  });

  it('* matches within a single path segment', () => {
    const re = globToRegex('*.md');
    expect(re.test('README.md')).toBe(true);
    expect(re.test('docs/README.md')).toBe(true); // (^|/) prefix allows this
    expect(re.test('a/b.md')).toBe(true);
    expect(re.test('a/b.ts')).toBe(false);
  });

  it('* does not cross directory boundaries', () => {
    const re = globToRegex('*.md');
    // nested path — * should not match the slash
    expect(re.test('docs/sub/README.md')).toBe(true); // matches README.md part
  });

  it('** matches across path segments', () => {
    const re = globToRegex('docs/**/*.md');
    expect(re.test('docs/README.md')).toBe(true);
    expect(re.test('docs/sub/README.md')).toBe(true);
    expect(re.test('docs/a/b/c.md')).toBe(true);
    expect(re.test('other/README.md')).toBe(false);
  });

  it('? matches single character except slash', () => {
    const re = globToRegex('file?.md');
    expect(re.test('fileA.md')).toBe(true);
    expect(re.test('file1.md')).toBe(true);
    expect(re.test('file.md')).toBe(false);   // ? requires exactly one char
    expect(re.test('fileAB.md')).toBe(false);  // ? is only one char
  });

  it('directory prefix pattern (ends with /) matches any file under it', () => {
    const re = globToRegex('bots-ws/');
    expect(re.test('bots-ws/foo.md')).toBe(true);
    expect(re.test('bots-ws/sub/bar.md')).toBe(true);
    expect(re.test('other/bots-ws/foo.md')).toBe(true); // (^|/) prefix
    expect(re.test('not-bots-ws/foo.md')).toBe(false);
  });

  it('escapes special regex characters in literal patterns', () => {
    const re = globToRegex('file.name.md'); // dot is literal
    expect(re.test('fileXnameYmd')).toBe(false);
    expect(re.test('file.name.md')).toBe(true);
  });
});

// ==================== isIgnored ====================

describe('isIgnored', () => {
  const ws = '/workspace/project';

  it('returns false when no patterns', () => {
    expect(isIgnored(`${ws}/README.md`, ws, [])).toBe(false);
  });

  it('ignores file matching exact name pattern', () => {
    expect(isIgnored(`${ws}/TODO.md`, ws, ['TODO.md'])).toBe(true);
    expect(isIgnored(`${ws}/README.md`, ws, ['TODO.md'])).toBe(false);
  });

  it('ignores files under a directory pattern', () => {
    expect(isIgnored(`${ws}/bots-ws/exp.md`, ws, ['bots-ws/'])).toBe(true);
    expect(isIgnored(`${ws}/bots-ws/sub/exp.md`, ws, ['bots-ws/'])).toBe(true);
    expect(isIgnored(`${ws}/docs/exp.md`, ws, ['bots-ws/'])).toBe(false);
  });

  it('ignores files matching glob pattern', () => {
    expect(isIgnored(`${ws}/tests/e2e/foo.spec.ts`, ws, ['tests/**'])).toBe(true);
    expect(isIgnored(`${ws}/src/main.ts`, ws, ['tests/**'])).toBe(false);
  });

  it('uses relative path from workspace root', () => {
    // file path starts with workspacePath + '/'
    expect(isIgnored(`${ws}/dist/bundle.js`, ws, ['dist/'])).toBe(true);
  });

  it('handles multiple patterns — any match means ignored', () => {
    const patterns = ['*.log', 'dist/', 'node_modules/'];
    expect(isIgnored(`${ws}/app.log`, ws, patterns)).toBe(true);
    expect(isIgnored(`${ws}/dist/main.js`, ws, patterns)).toBe(true);
    expect(isIgnored(`${ws}/src/app.ts`, ws, patterns)).toBe(false);
  });
});

// ==================== getActiveFiles ====================

function makeFile(path: string, lastModified: number): FileTreeNode {
  return { name: path.split('/').pop()!, path, type: 'file', lastModified };
}

function makeTree(files: FileTreeNode[], ignorePatterns?: string[]): FileTreeNode {
  return {
    name: 'root',
    path: '/ws',
    type: 'directory',
    children: files,
    ignorePatterns,
  };
}

describe('getActiveFiles', () => {
  const now = Date.now();
  const ws = '/ws';
  const windowMs = 4 * 3600 * 1000; // 4h

  it('returns empty array when tree is undefined', () => {
    expect(getActiveFiles(ws, undefined, windowMs, new Set())).toEqual([]);
  });

  it('returns files modified within the time window', () => {
    const recent = makeFile('/ws/recent.md', now - 1000);
    const old = makeFile('/ws/old.md', now - windowMs - 1);
    const tree = makeTree([recent, old]);
    const result = getActiveFiles(ws, tree, windowMs, new Set());
    expect(result.map(f => f.path)).toEqual(['/ws/recent.md']);
  });

  it('includes pinned files regardless of mtime', () => {
    const old = makeFile('/ws/old.md', now - windowMs - 1);
    const tree = makeTree([old]);
    const pinned = new Set(['/ws/old.md']);
    const result = getActiveFiles(ws, tree, windowMs, pinned);
    expect(result.map(f => f.path)).toEqual(['/ws/old.md']);
  });

  it('sorts pinned files first, then by mtime descending', () => {
    const pinned_file = makeFile('/ws/pinned.md', now - 10000);
    const newer = makeFile('/ws/newer.md', now - 1000);
    const older = makeFile('/ws/older.md', now - 2000);
    const tree = makeTree([older, newer, pinned_file]);
    const pinned = new Set(['/ws/pinned.md']);
    const result = getActiveFiles(ws, tree, windowMs, pinned);
    expect(result.map(f => f.path)).toEqual(['/ws/pinned.md', '/ws/newer.md', '/ws/older.md']);
  });

  it('collects files from nested directories', () => {
    const nested: FileTreeNode = {
      name: 'sub',
      path: '/ws/sub',
      type: 'directory',
      children: [makeFile('/ws/sub/deep.md', now - 500)],
    };
    const tree: FileTreeNode = {
      name: 'root',
      path: '/ws',
      type: 'directory',
      children: [nested],
    };
    const result = getActiveFiles(ws, tree, windowMs, new Set());
    expect(result.map(f => f.path)).toEqual(['/ws/sub/deep.md']);
  });

  it('returns empty when all files are old and none pinned', () => {
    const old1 = makeFile('/ws/a.md', now - windowMs - 1000);
    const old2 = makeFile('/ws/b.md', now - windowMs - 2000);
    const tree = makeTree([old1, old2]);
    expect(getActiveFiles(ws, tree, windowMs, new Set())).toEqual([]);
  });

});

describe('buildFocusView', () => {
  it('shows a scanning state while workspace trees are being loaded', () => {
    globalThis.fetch = mock(async () => Response.json({
      name: 'repo',
      path: '/repo',
      type: 'directory',
      children: [],
    })) as any;
    state.config.workspaces = [
      { id: 'ws-loading', name: 'repo', path: '/repo', isExpanded: false },
    ];

    prepareFocusView();
    const view = buildFocusView();

    expect(view.kind).toBe('scanning');
    expect(state.workspaceLoadingIds.has('ws-loading')).toBe(true);
  });

  it('groups recently modified files by workspace', () => {
    globalThis.fetch = mock(async () => new Response('{}', { status: 500 })) as any;
    state.config.workspaces = [
      { id: 'ws-recent', name: 'notes', path: '/notes', isExpanded: true },
    ];
    state.fileTree.set('ws-recent', {
      name: 'notes',
      path: '/notes',
      type: 'directory',
      children: [
        { name: 'a.md', path: '/notes/a.md', type: 'file', lastModified: Date.now() },
        { name: 'old.md', path: '/notes/old.md', type: 'file', lastModified: Date.now() - 30 * 86400000 },
      ],
    });

    const view = buildFocusView();

    expect(view.kind).toBe('ready');
    if (view.kind !== 'ready') return;
    expect(view.groups.map((g) => g.workspace.id)).toEqual(['ws-recent']);
    expect(view.groups[0].rows.map((r) => r.file.path)).toEqual(['/notes/a.md']);
    expect(view.groups[0].collapsed).toBe(false);
  });
});

// ==================== formatRelativeTime ====================

describe('formatRelativeTime', () => {
  const now = Date.now();

  it('returns minutes for < 1 hour', () => {
    expect(formatRelativeTime(now - 5 * 60000)).toBe('5m');
    expect(formatRelativeTime(now - 59 * 60000)).toBe('59m');
    expect(formatRelativeTime(now - 0)).toBe('0m');
  });

  it('returns hours for 1h–23h', () => {
    expect(formatRelativeTime(now - 1 * 3600000)).toBe('1h');
    expect(formatRelativeTime(now - 23 * 3600000)).toBe('23h');
  });

  it('returns days for >= 24h', () => {
    expect(formatRelativeTime(now - 24 * 3600000)).toBe('1d');
    expect(formatRelativeTime(now - 48 * 3600000)).toBe('2d');
    expect(formatRelativeTime(now - 7 * 86400000)).toBe('7d');
  });
});
