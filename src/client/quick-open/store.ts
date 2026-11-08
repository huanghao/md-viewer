import { createStore } from '../utils/create-store';

/** 快速打开的一条结果；isOpen 表示该文件已在标签页中打开 */
export interface QuickOpenResult {
  path: string;
  display: string;
  isOpen: boolean;
}

export interface QuickOpenState {
  visible: boolean;
  query: string;
  results: QuickOpenResult[];
  /** 当前高亮项下标；无结果时为 -1 */
  activeIndex: number;
}

const INITIAL: QuickOpenState = { visible: false, query: '', results: [], activeIndex: -1 };

const store = createStore<QuickOpenState>(INITIAL);

export const quickOpenStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  open(): void {
    store.merge({ visible: true, query: '', results: [], activeIndex: -1 });
  },
  close(): void {
    store.merge({ visible: false });
  },
  setQuery(query: string): void {
    store.merge({ query });
  },
  setResults(results: QuickOpenResult[]): void {
    store.merge({ results, activeIndex: results.length > 0 ? 0 : -1 });
  },
  setActive(index: number): void {
    const { results, activeIndex } = store.getState();
    if (results.length === 0 || index === activeIndex) return;
    store.merge({ activeIndex: Math.max(0, Math.min(index, results.length - 1)) });
  },
};
