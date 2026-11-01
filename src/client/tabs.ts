import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { TabStrip, type TabStripDeps } from './tabs/TabStrip';
import { tabsStore } from './tabs/store';

export { tabsStore } from './tabs/store';

/** 标签栏对外入口：renderTabs 通过 tabsStore.setSnapshot 推送数据，这里负责挂载与容器显隐 */
export function mountTabStrip(deps: TabStripDeps): void {
  const el = document.getElementById('tabs');
  if (!el) return;
  const syncVisibility = () => {
    el.style.display = tabsStore.getState().files.length > 0 ? 'flex' : 'none';
  };
  syncVisibility();
  tabsStore.subscribe(syncVisibility);
  createRoot(el).render(createElement(TabStrip, { deps }));
}
