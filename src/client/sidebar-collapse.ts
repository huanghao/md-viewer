import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { SidebarCollapseButton, SidebarFloatingOpenButton, type SidebarCollapseCallbacks } from './sidebar-collapse/SidebarCollapseControls';

/** 挂载收起/展开按钮到静态占位节点；状态与 body class 由 ui/sidebar-layout 管理 */
export function mountSidebarCollapseControls(callbacks: SidebarCollapseCallbacks): void {
  const collapseHost = document.getElementById('sidebarCollapseHost');
  if (collapseHost) {
    createRoot(collapseHost).render(createElement(SidebarCollapseButton, { onCollapse: callbacks.onCollapse }));
  }
  const floatingHost = document.getElementById('sidebarFloatingOpenHost');
  if (floatingHost) {
    createRoot(floatingHost).render(createElement(SidebarFloatingOpenButton, { onExpand: callbacks.onExpand }));
  }
}
