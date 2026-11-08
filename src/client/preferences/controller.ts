import { state } from '../state';
import { saveConfig } from '../config';
import { renderSidebar, requestSidebarRender } from '../ui/sidebar';
import { showError, showSuccess } from '../ui/toast';

export type PrefTab = '外观' | '快捷键' | '评论' | 'Agent';

interface PrefsState {
  open: boolean;
  tab: PrefTab;
}

let current: PrefsState = { open: false, tab: '外观' };
const listeners = new Set<() => void>();

// 打开时记下的主题与公式设置；取消时用来还原（预览是实时生效的）
let saved = { markdownTheme: 'github', codeTheme: 'github', mathInline: true };

// 当前标签页注册的保存逻辑；没有注册时只保存配置本身（快捷键标签页的情况）
let saver: (() => Promise<void>) | null = null;

function emit(next: Partial<PrefsState>): void {
  current = { ...current, ...next };
  listeners.forEach((l) => l());
}

export const prefsStore = {
  getState: (): PrefsState => current,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function isPreferencesOpen(): boolean {
  return current.open;
}

export function setPrefTab(tab: PrefTab): void {
  emit({ tab });
}

export function openPreferences(): void {
  saved = {
    markdownTheme: state.config.markdownTheme || 'github',
    codeTheme: state.config.codeTheme || 'github',
    mathInline: state.config.mathInline !== false,
  };
  emit({ open: true });
}

export function closePreferences(): void {
  saver = null;
  emit({ open: false });
}

/** 标签页挂载时注册自己的保存逻辑，卸载时传 null 撤销 */
export function registerPreferencesSaver(fn: (() => Promise<void>) | null): void {
  saver = fn;
}

export async function savePreferences(): Promise<void> {
  try {
    await (saver ?? saveConfigAndNotify)();
    closePreferences();
  } catch (err: any) {
    showError('保存失败: ' + err.message);
  }
}

export function cancelPreferences(): void {
  state.config.markdownTheme = saved.markdownTheme;
  state.config.codeTheme = saved.codeTheme;
  state.config.mathInline = saved.mathInline;
  applyThemeLive();
  closePreferences();
}

let themeApplier: (() => void) | null = null;

/** 组合根注入主题应用函数（applyTheme 位于 app-actions，本模块不直接依赖它） */
export function setThemeApplier(fn: () => void): void {
  themeApplier = fn;
}

/** 主题选择即时预览 */
export function applyThemeLive(): void {
  themeApplier?.();
}

export async function saveConfigAndNotify(): Promise<void> {
  await saveConfig(state.config);
  requestSidebarRender();
  showSuccess('设置已保存');
}
