import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { SearchBox, ViewTabs, type SidebarHeaderDeps } from './sidebar/SidebarHeader';

/** 侧边栏头部对外入口：搜索框挂到 #searchBox，视图切换挂到 #modeSwitchRow；状态由 sidebar/store 推送 */
export function mountSidebarHeader(deps: SidebarHeaderDeps): void {
  const searchEl = document.getElementById('searchBox');
  if (searchEl) createRoot(searchEl).render(createElement(SearchBox, { deps }));
  const tabsEl = document.getElementById('modeSwitchRow');
  if (tabsEl) createRoot(tabsEl).render(createElement(ViewTabs, { deps }));
}
