import { state } from './state';
import { registerAction } from './keybindings';
import { dismissAnnotationPopupByEscape } from './annotation';
import { hideQuickOpen, isQuickOpenVisible } from './ui/quick-open';
import { hideShortcutsHelp, isShortcutsHelpVisible } from './ui/shortcuts-help';
import { closePreferences, isPreferencesOpen } from './ui/preferences';

export interface KeyboardActionDeps {
  removeFileHandler: (path: string) => void;
  navigateFileInView: (direction: 1 | -1) => void;
  showQuickOpen: () => void;
}

/** 焦点在输入框内时，不触发单键快捷键（如 j/k） */
function isInputFocused(): boolean {
  const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
  return tag === 'input' || tag === 'textarea';
}

/** 注册应用级快捷键动作；必须在 initDispatcher() 之前调用 */
export function registerAppKeyboardActions(deps: KeyboardActionDeps): void {
  registerAction({
    id: 'escape',
    label: 'Escape',
    category: 'view',
    defaultKey: 'Escape',
    handler: () => {
      if (dismissAnnotationPopupByEscape()) return;
      if (isQuickOpenVisible()) { hideQuickOpen(); return; }
      if (isShortcutsHelpVisible()) { hideShortcutsHelp(); return; }
      if (isPreferencesOpen()) { closePreferences(); return; }
    },
  });

  registerAction({
    id: 'close-file',
    label: '关闭当前文件',
    category: 'file',
    defaultKey: 'Ctrl+w',
    handler: () => {
      const current = state.currentFile;
      if (current) deps.removeFileHandler(current);
    },
    shouldActivate: () => !isInputFocused(),
  });

  // j/k: 在当前侧边栏视角里上下移动文件（非输入框）
  registerAction({
    id: 'nav-file-down',
    label: '移到下一个文件',
    category: 'navigation',
    defaultKey: 'j',
    handler: () => deps.navigateFileInView(1),
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'nav-file-up',
    label: '移到上一个文件',
    category: 'navigation',
    defaultKey: 'k',
    handler: () => deps.navigateFileInView(-1),
    shouldActivate: () => !isInputFocused(),
  });

  registerAction({
    id: 'quick-open',
    label: '快速打开文件',
    category: 'navigation',
    defaultKey: 'Ctrl+f',
    handler: () => deps.showQuickOpen(),
    shouldActivate: () => !isInputFocused(),
  });
}
