import { createStore } from '../utils/create-store';
import type { TocItem } from '../toc-extractor';
import type { TocActiveKey } from './logic';

export type TocStatus = 'idle' | 'loading' | 'empty' | 'ready' | 'error';

export interface TocState {
  status: TocStatus;
  items: TocItem[];
  /** 标题栏（“目录”与收起按钮）是否显示；出现过一次后保持，与原来的行为一致 */
  headerShown: boolean;
  active: TocActiveKey | null;
  error: string | null;
  onJump: ((item: TocItem) => void) | null;
}

const store = createStore<TocState>({
  status: 'idle',
  items: [],
  headerShown: false,
  active: null,
  error: null,
  onJump: null,
});

export const tocStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setLoading(): void {
    store.merge({ status: 'loading', items: [], error: null, active: null, onJump: null });
  },
  setEmpty(): void {
    store.merge({ status: 'empty', items: [], error: null, active: null, onJump: null });
  },
  setItems(items: TocItem[], onJump: (item: TocItem) => void): void {
    store.merge({ status: 'ready', items, headerShown: true, error: null, active: null, onJump });
  },
  setError(message: string): void {
    store.merge({ status: 'error', items: [], error: message, active: null, onJump: null });
  },
  /** 恢复初始状态（仅供测试复位单例使用） */
  reset(): void {
    store.replace({ status: 'idle', items: [], headerShown: false, active: null, error: null, onJump: null });
  },
  setActive(active: TocActiveKey | null): void {
    const current = store.getState().active;
    if (current?.page === active?.page && current?.title === active?.title) return;
    store.merge({ active });
  },
};
