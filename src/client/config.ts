import type { AppConfig } from './types';
import { storageGet, storageSet } from './utils/storage';

const CONFIG_KEY = 'md-viewer:config';

export const defaultConfig: AppConfig = {
  sidebarTab: 'focus',
  focusWindowKey: '8h',
  focusStrategy: 'mtime',
  markdownTheme: 'github',
  codeTheme: 'github',
  mathInline: true,
  workspacePollInterval: 5000,
  pdfIdleEviction: false,
  optimisticUndo: true,
  workspaces: [],
};

export function loadConfig(): AppConfig {
  return { ...defaultConfig, ...storageGet<Partial<AppConfig>>(CONFIG_KEY, {}) };
}

export function saveConfig(config: AppConfig): void {
  storageSet(CONFIG_KEY, config);
}

export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  const config = loadConfig();
  const newConfig = { ...config, ...updates };
  saveConfig(newConfig);
  return newConfig;
}
