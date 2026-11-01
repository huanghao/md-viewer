import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PreferencesDialog } from '../preferences/PreferencesDialog';
import { openPreferences } from '../preferences/controller';

export { closePreferences, isPreferencesOpen } from '../preferences/controller';

let root: Root | null = null;

/** 首次打开时挂载对话框；之后只切换开合状态 */
export function showPreferences(): void {
  if (!root) {
    const el = document.createElement('div');
    el.id = 'preferencesRoot';
    document.body.appendChild(el);
    root = createRoot(el);
    root.render(createElement(PreferencesDialog));
  }
  openPreferences();
}
