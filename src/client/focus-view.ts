import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { FocusView, type FocusViewDeps } from './focus-view/FocusView';

/** focus 视图对外入口：renderSidebar 通过 focusViewStore.notify() 触发重绘，这里只负责挂载 */
export { focusViewStore } from './focus-view/store';

export function mountFocusView(deps: FocusViewDeps): void {
  const el = document.getElementById('focusList');
  if (!el) return;
  createRoot(el).render(createElement(FocusView, { deps }));
}
