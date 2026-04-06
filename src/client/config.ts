import type { AppConfig } from './types';

const CONFIG_KEY = 'md-viewer:config';

// 默认配置
export const defaultConfig: AppConfig = {
  sidebarMode: 'simple',  // 默认使用简单模式
  sidebarView: 'focus',
  focusWindowHours: 4,
  workspaces: []
};

// 加载配置
export function loadConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    if (!saved) return { ...defaultConfig };

    const config = JSON.parse(saved);
    return {
      ...defaultConfig,
      ...config
    };
  } catch (e) {
    console.error('加载配置失败:', e);
    return { ...defaultConfig };
  }
}

// 保存配置
export function saveConfig(config: AppConfig): void {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('保存配置失败:', e);
  }
}

// 更新配置
export function updateConfig(updates: Partial<AppConfig>): AppConfig {
  const config = loadConfig();
  const newConfig = { ...config, ...updates };
  saveConfig(newConfig);
  return newConfig;
}
