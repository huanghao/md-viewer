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

let state: DiffBannerState = INITIAL;
const listeners = new Set<() => void>();

function emit(next: Partial<DiffBannerState>): void {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const diffBannerStore = {
  getState: (): DiffBannerState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  /** 进入 diff 模式：显示横幅并重置导航 */
  show(mode: DiffBannerMode): void {
    emit({ ...INITIAL, visible: true, mode });
  },
  hide(): void {
    emit({ ...INITIAL });
  },
  setMode(mode: DiffBannerMode): void {
    emit({ mode, labelOverride: null });
  },
  setNav(nav: { count: string; prevDisabled: boolean; nextDisabled: boolean }): void {
    emit(nav);
  },
  setLabelOverride(text: string): void {
    emit({ labelOverride: text });
  },
};
