import type { AppConfig } from './types';
import { storageGet, storageSet } from './utils/storage';
import { sanitizeFocusActiveTypes } from './utils/focus-type-filter';

const CONFIG_KEY = 'md-viewer:config';

export const defaultConfig: AppConfig = {
  sidebarTab: 'focus',
  focusWindowKey: '8h',
  focusActiveTypes: ['md', 'pdf'],
  focusStrategies: ['mtime'], // 多选：'mtime'（写）、'open'（读），默认只选写
  markdownTheme: 'github',
  codeTheme: 'github',
  mathInline: true,
  workspacePollInterval: 5000,
  pdfIdleEviction: false,
  optimisticUndo: true,
  workspaces: [],
};

export function loadConfig(): AppConfig {
  const config = { ...defaultConfig, ...storageGet<Partial<AppConfig>>(CONFIG_KEY, {}) };
  return {
    ...config,
    focusActiveTypes: sanitizeFocusActiveTypes(config.focusActiveTypes),
  };
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
