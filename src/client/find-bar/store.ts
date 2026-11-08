import { createStore } from '../utils/create-store';

/** 查找栏状态：可见性、查询词、匹配总数与当前序号（0 基，-1 表示无）。 */
export interface FindBarState {
  visible: boolean;
  query: string;
  current: number;
  total: number;
  /** 每次 show 递增，用于让已显示的输入框重新获得焦点 */
  focusToken: number;
}

const INITIAL: FindBarState = { visible: false, query: '', current: -1, total: 0, focusToken: 0 };

const store = createStore<FindBarState>(INITIAL);

export const findBarStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  show(): void {
    store.merge({ visible: true, focusToken: store.getState().focusToken + 1 });
  },
  hide(): void {
    store.merge({ visible: false });
  },
  setQuery(query: string): void {
    if (store.getState().query !== query) store.merge({ query });
  },
  setMatches(total: number, current: number): void {
    store.merge({ total, current });
  },
};
