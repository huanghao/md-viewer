import { createStore } from '../utils/create-store';

/** Diff 横幅的状态：可见性、视图模式、导航计数与按钮可用性。横幅元素本身由 DiffBanner.tsx 渲染。 */
export type DiffBannerMode = 'paragraph' | 'line';

export interface DiffBannerState {
  visible: boolean;
  mode: DiffBannerMode;
  /** 覆盖默认标题（例如文件被再次更新时的提示）；切换模式时清除 */
  labelOverride: string | null;
  count: string;
  prevDisabled: boolean;
  nextDisabled: boolean;
}

const INITIAL: DiffBannerState = {
  visible: false,
  mode: 'paragraph',
  labelOverride: null,
  count: '- / -',
  prevDisabled: true,
  nextDisabled: false,
};

const store = createStore<DiffBannerState>(INITIAL);

export const diffBannerStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  /** 进入 diff 模式：显示横幅并重置导航 */
  show(mode: DiffBannerMode): void {
    store.merge({ ...INITIAL, visible: true, mode });
  },
  hide(): void {
    store.merge({ ...INITIAL });
  },
  setMode(mode: DiffBannerMode): void {
    store.merge({ mode, labelOverride: null });
  },
  setNav(nav: { count: string; prevDisabled: boolean; nextDisabled: boolean }): void {
    store.merge(nav);
  },
  setLabelOverride(text: string): void {
    store.merge({ labelOverride: text });
  },
};
