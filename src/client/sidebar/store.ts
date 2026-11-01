export type SidebarTab = 'focus' | 'full' | 'list';

export interface SidebarHeaderState {
  tab: SidebarTab;
  query: string;
}

let snapshot: SidebarHeaderState = { tab: 'focus', query: '' };
const listeners = new Set<() => void>();

/** 侧边栏头部（搜索框、视图切换）的状态；由 renderSidebar 与搜索输入推送，React 组件订阅 */
export const sidebarHeaderStore = {
  getState: (): SidebarHeaderState => snapshot,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setSnapshot(next: SidebarHeaderState): void {
    if (next.tab === snapshot.tab && next.query === snapshot.query) return;
    snapshot = next;
    listeners.forEach((l) => l());
  },
};
