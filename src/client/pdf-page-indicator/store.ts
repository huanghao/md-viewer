import { createStore } from '../utils/create-store';

/** PDF 页码指示器的状态：可见性、当前页、总页数，以及是否处于输入态。 */
export interface PdfPageIndicatorState {
  visible: boolean;
  page: number;
  total: number;
  editing: boolean;
  onGoto: ((page: number) => void) | null;
}

const INITIAL: PdfPageIndicatorState = { visible: false, page: 1, total: 1, editing: false, onGoto: null };

const store = createStore<PdfPageIndicatorState>(INITIAL);

export const pdfPageIndicatorStore = {
  getState: store.getState,
  subscribe: store.subscribe,
  show(opts: { page: number; total: number; onGoto: (page: number) => void }): void {
    store.merge({ visible: true, page: opts.page, total: opts.total, onGoto: opts.onGoto, editing: false });
  },
  hide(): void {
    store.merge({ ...INITIAL });
  },
  /** 滚动同步当前页；输入态下不打断用户输入 */
  setPage(page: number): void {
    if (store.getState().editing || store.getState().page === page) return;
    store.merge({ page });
  },
  startEdit(): void {
    store.merge({ editing: true });
  },
  stopEdit(): void {
    store.merge({ editing: false });
  },
};

/** 把输入框的文本解析为合法页码（无效输入回到第 1 页，超出范围截断到边界） */
export function clampPageInput(raw: string, total: number): number {
  const parsed = parseInt(raw, 10);
  const page = Number.isFinite(parsed) ? parsed : 1;
  return Math.min(total, Math.max(1, page));
}
