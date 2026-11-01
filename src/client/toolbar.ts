import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Toolbar, type ToolbarDeps } from './toolbar/Toolbar';

/** 工具栏对外入口：各模块通过 toolbar/store 的 setter 更新状态，这里只负责挂载渲染 */
export { toolbarStore } from './toolbar/store';

export function mountToolbar(deps: ToolbarDeps): void {
  const el = document.getElementById('toolbar');
  if (!el) return;
  createRoot(el).render(createElement(Toolbar, { deps }));
}
