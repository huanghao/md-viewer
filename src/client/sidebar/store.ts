import { createStore } from '../utils/create-store';

export type SidebarTab = 'focus' | 'full' | 'list';

export interface SidebarHeaderState {
  tab: SidebarTab;
  query: string;
}

const store = createStore<SidebarHeaderState>({ tab: 'focus', query: '' });

/** 侧边栏头部（搜索框、视图切换）的状态；由 renderSidebar 与搜索输入推送，React 组件订阅 */
export const sidebarHeaderStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setSnapshot(next: SidebarHeaderState): void {
    store.replace(next, (a, b) => a.tab === b.tab && a.query === b.query);
  },
};
