import { createStore } from '../utils/create-store';

export type PdfMode = 'select' | 'annotate';

export interface ToolbarState {
  /** 面包屑显示的文件路径；null 表示不显示 */
  breadcrumbPath: string | null;
  pdfVisible: boolean;
  pdfMode: PdfMode;
  diffVisible: boolean;
  diffActive: boolean;
  refreshVisible: boolean;
  /** 缩放输入框显示的文字，如 "100%" */
  zoomText: string;
}

const store = createStore<ToolbarState>({
  breadcrumbPath: null,
  pdfVisible: false,
  pdfMode: 'select',
  diffVisible: false,
  diffActive: false,
  refreshVisible: false,
  zoomText: '100%',
});

function set(patch: Partial<ToolbarState>): void {
  // 值没变就不通知，避免每次文件刷新都重绘整个工具栏
  const current = store.getState();
  if (Object.entries(patch).every(([k, v]) => current[k as keyof ToolbarState] === v)) return;
  store.merge(patch);
}

export const toolbarStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  setBreadcrumb(path: string | null): void {
    set({ breadcrumbPath: path });
  },
  setPdf(visible: boolean, mode: PdfMode): void {
    set({ pdfVisible: visible, pdfMode: mode });
  },
  setDiff(patch: { visible?: boolean; active?: boolean }): void {
    set({ diffVisible: patch.visible ?? store.getState().diffVisible, diffActive: patch.active ?? store.getState().diffActive });
  },
  setRefreshVisible(visible: boolean): void {
    set({ refreshVisible: visible });
  },
  setZoomText(text: string): void {
    set({ zoomText: text });
  },
};
