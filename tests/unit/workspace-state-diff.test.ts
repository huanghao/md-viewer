import { beforeEach, describe, expect, it } from 'bun:test';
import {
  clearListDiff,
  clearWorkspacePathMissing,
  getWorkspaceMissingPaths,
  hasListDiff,
  isWorkspacePathMissing,
  markListDiff,
  markWorkspacePathMissing,
  removeWorkspaceTracking,
  restoreWorkspaceAuxiliaryState,
  updateWorkspaceListDiff,
} from '../../src/client/workspace-state';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? this.data.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

if (!(globalThis as any).localStorage) {
  (globalThis as any).localStorage = new MemoryStorage();
}

function resetAuxState(): void {
  localStorage.clear();
  restoreWorkspaceAuxiliaryState();
  for (const path of getWorkspaceMissingPaths()) {
    clearWorkspacePathMissing(path);
  }
}

describe('workspace-state-diff', () => {
  beforeEach(() => {
    resetAuxState();
  });

  it('does not mark blue dots on first workspace scan', () => {
    updateWorkspaceListDiff('ws-first', ['/tmp/a.md', '/tmp/b.md']);

    expect(hasListDiff('/tmp/a.md')).toBe(false);
    expect(hasListDiff('/tmp/b.md')).toBe(false);
  });

  it('marks new files as blue dot and clears missing when file reappears', () => {
    updateWorkspaceListDiff('ws-reappear', ['/tmp/a.md']);
    markWorkspacePathMissing('/tmp/c.md');

    updateWorkspaceListDiff('ws-reappear', ['/tmp/a.md', '/tmp/c.md']);

    expect(hasListDiff('/tmp/c.md')).toBe(true);
    expect(isWorkspacePathMissing('/tmp/c.md')).toBe(false);
  });

  it('marks disappeared files as missing and removes stale blue dot', () => {
    updateWorkspaceListDiff('ws-missing', ['/tmp/a.md', '/tmp/b.md']);
    markListDiff('/tmp/b.md');
    expect(hasListDiff('/tmp/b.md')).toBe(true);

    updateWorkspaceListDiff('ws-missing', ['/tmp/a.md']);

    expect(hasListDiff('/tmp/b.md')).toBe(false);
    expect(isWorkspacePathMissing('/tmp/b.md')).toBe(true);
  });

  it('removeWorkspaceTracking clears list diff only for tracked workspace paths', () => {
    updateWorkspaceListDiff('ws-remove', ['/tmp/a.md', '/tmp/b.md']);
    markListDiff('/tmp/a.md');
    markListDiff('/tmp/not-owned.md');

    removeWorkspaceTracking('ws-remove');

    expect(hasListDiff('/tmp/a.md')).toBe(false);
    expect(hasListDiff('/tmp/not-owned.md')).toBe(true);

    clearListDiff('/tmp/not-owned.md');
  });
});
