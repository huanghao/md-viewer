import { beforeEach, describe, expect, it } from 'bun:test';
import { defaultConfig, loadConfig, saveConfig } from '../../src/client/config';

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

beforeEach(() => storage.clear());

describe('workspacePollInterval config', () => {
  it('defaultConfig has workspacePollInterval of 5000', () => {
    expect(defaultConfig.workspacePollInterval).toBe(5000);
  });

  it('loadConfig returns 5000 when nothing is saved', () => {
    expect(loadConfig().workspacePollInterval).toBe(5000);
  });

  it('loadConfig restores a saved custom interval', () => {
    saveConfig({ ...defaultConfig, workspacePollInterval: 10000 });
    expect(loadConfig().workspacePollInterval).toBe(10000);
  });

  it('falls back to 5000 for old configs without the field', () => {
    const old = { sidebarTab: 'focus', focusWindowKey: '8h', markdownTheme: 'github', codeTheme: 'github', mathInline: true, workspaces: [] };
    storage.setItem('md-viewer:config', JSON.stringify(old));
    expect(loadConfig().workspacePollInterval).toBe(5000);
  });
});
