import { createStore } from '../utils/create-store';

export interface TabItem {
  path: string;
  name: string;
  nameHint?: string;
  isMissing: boolean;
}

export interface TabBatchCounts {
  others: number;
  right: number;
  unmodified: number;
  all: number;
}

export interface TabsSnapshot {
  /** 按 tabOrder 排序后的标签；空数组表示隐藏整条标签栏 */
  files: TabItem[];
  currentPath: string | null;
  batch: TabBatchCounts;
}

const store = createStore<TabsSnapshot>({
  files: [],
  currentPath: null,
  batch: { others: 0, right: 0, unmodified: 0, all: 0 },
});

export const tabsStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setSnapshot(next: TabsSnapshot): void {
    // 内容没变就不通知：文件状态频繁刷新时避免重绘标签栏（原来用 renderKey 做同样的事）
    store.replace(next, (a, b) => JSON.stringify(a) === JSON.stringify(b));
  },
};
