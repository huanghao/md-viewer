import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { WorkspaceTree, type WorkspaceTreeDeps } from './workspace-tree/WorkspaceTree';

/** 工作区树对外入口：renderSidebar 通过 workspaceTreeStore.notify() 触发重绘，这里只负责挂载 */
export { workspaceTreeStore } from './workspace-tree/store';

export function mountWorkspaceTree(deps: WorkspaceTreeDeps): void {
  const el = document.getElementById('workspaceList');
  if (!el) return;
  createRoot(el).render(createElement(WorkspaceTree, { deps }));
}
