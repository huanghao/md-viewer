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

let state: FindBarState = INITIAL;
const listeners = new Set<() => void>();

function emit(next: Partial<FindBarState>): void {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const findBarStore = {
  getState: (): FindBarState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  show(): void {
    emit({ visible: true, focusToken: state.focusToken + 1 });
  },
  hide(): void {
    emit({ visible: false });
  },
  setQuery(query: string): void {
    if (state.query !== query) emit({ query });
  },
  setMatches(total: number, current: number): void {
    emit({ total, current });
  },
};
