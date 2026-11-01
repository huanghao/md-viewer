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

let state: ToolbarState = {
  breadcrumbPath: null,
  pdfVisible: false,
  pdfMode: 'select',
  diffVisible: false,
  diffActive: false,
  refreshVisible: false,
  zoomText: '100%',
};
const listeners = new Set<() => void>();

function set(patch: Partial<ToolbarState>): void {
  // 值没变就不通知，避免每次文件刷新都重绘整个工具栏
  if (Object.entries(patch).every(([k, v]) => state[k as keyof ToolbarState] === v)) return;
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const toolbarStore = {
  getState: (): ToolbarState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  setBreadcrumb(path: string | null): void {
    set({ breadcrumbPath: path });
  },
  setPdf(visible: boolean, mode: PdfMode): void {
    set({ pdfVisible: visible, pdfMode: mode });
  },
  setDiff(patch: { visible?: boolean; active?: boolean }): void {
    set({ diffVisible: patch.visible ?? state.diffVisible, diffActive: patch.active ?? state.diffActive });
  },
  setRefreshVisible(visible: boolean): void {
    set({ refreshVisible: visible });
  },
  setZoomText(text: string): void {
    set({ zoomText: text });
  },
};
