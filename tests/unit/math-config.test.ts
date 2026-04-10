/**
 * Tests for math/KaTeX config:
 * - defaultConfig has mathInline: true
 * - AppConfig type includes mathInline
 * - loadConfig returns mathInline default when not saved
 * - loadConfig restores saved mathInline: false
 */
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

describe('defaultConfig — math settings', () => {
  it('mathInline defaults to true', () => {
    expect(defaultConfig.mathInline).toBe(true);
  });
});

describe('loadConfig — math settings', () => {
  it('returns mathInline: true when nothing is saved', () => {
    const config = loadConfig();
    expect(config.mathInline).toBe(true);
  });

  it('restores mathInline: false when saved as false', () => {
    saveConfig({ ...defaultConfig, mathInline: false });
    const config = loadConfig();
    expect(config.mathInline).toBe(false);
  });

  it('restores mathInline: true when saved as true', () => {
    saveConfig({ ...defaultConfig, mathInline: true });
    const config = loadConfig();
    expect(config.mathInline).toBe(true);
  });

  it('falls back to default mathInline: true for old configs without the field', () => {
    // Simulate a config saved before mathInline was added (field absent)
    const oldConfig = { sidebarTab: 'focus', focusWindowKey: '8h', markdownTheme: 'github', codeTheme: 'github', workspaces: [] };
    storage.setItem('md-viewer:config', JSON.stringify(oldConfig));
    const config = loadConfig();
    expect(config.mathInline).toBe(true);
  });
});
