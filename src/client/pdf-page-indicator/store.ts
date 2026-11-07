/** PDF 页码指示器的状态：可见性、当前页、总页数，以及是否处于输入态。 */
export interface PdfPageIndicatorState {
  visible: boolean;
  page: number;
  total: number;
  editing: boolean;
  onGoto: ((page: number) => void) | null;
}

const INITIAL: PdfPageIndicatorState = { visible: false, page: 1, total: 1, editing: false, onGoto: null };

let state: PdfPageIndicatorState = INITIAL;
const listeners = new Set<() => void>();

function emit(next: Partial<PdfPageIndicatorState>): void {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

export const pdfPageIndicatorStore = {
  getState: (): PdfPageIndicatorState => state,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  show(opts: { page: number; total: number; onGoto: (page: number) => void }): void {
    emit({ visible: true, page: opts.page, total: opts.total, onGoto: opts.onGoto, editing: false });
  },
  hide(): void {
    emit({ ...INITIAL });
  },
  /** 滚动同步当前页；输入态下不打断用户输入 */
  setPage(page: number): void {
    if (state.editing || state.page === page) return;
    emit({ page });
  },
  startEdit(): void {
    emit({ editing: true });
  },
  stopEdit(): void {
    emit({ editing: false });
  },
};

/** 把输入框的文本解析为合法页码（无效输入回到第 1 页，超出范围截断到边界） */
export function clampPageInput(raw: string, total: number): number {
  const parsed = parseInt(raw, 10);
  const page = Number.isFinite(parsed) ? parsed : 1;
  return Math.min(total, Math.max(1, page));
}
