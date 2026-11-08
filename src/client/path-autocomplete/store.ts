import { createStore } from '../utils/create-store';
import type { PathSuggestion } from '../types';

/**
 * 路径补全面板的状态。面板是共享的单例：同一时刻只服务一个输入框（owner），
 * 其它输入框的隐藏请求不会关掉别人正在显示的建议。
 */
export interface PathSuggestState {
  visible: boolean;
  items: PathSuggestion[];
  activeIndex: number;
  left: number;
  top: number;
  width: number;
  owner: symbol | null;
  /** 用户点选某一项时调用（由当前 owner 提供） */
  onPick: ((index: number) => void) | null;
}

const store = createStore<PathSuggestState>({
  visible: false,
  items: [],
  activeIndex: -1,
  left: 0,
  top: 0,
  width: 0,
  owner: null,
  onPick: null,
});

export const pathSuggestStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  show(owner: symbol, patch: Partial<PathSuggestState>): void {
    store.merge({ visible: true, owner, ...patch });
  },
  update(patch: Partial<PathSuggestState>): void {
    store.merge(patch);
  },
  /** 仅当 owner 为当前拥有者时隐藏，避免误关其它输入框的面板 */
  hide(owner: symbol): void {
    if (store.getState().owner !== owner) return;
    store.merge({ visible: false, items: [], activeIndex: -1, owner: null, onPick: null });
  },
};
