import type { FileRowStatus } from '../utils/file-row-status';

export interface FileListRow {
  path: string;
  /** 去掉扩展名后的显示名 */
  name: string;
  /** 鼠标悬停提示（有同名区分时显示完整路径） */
  title: string;
  nameHint?: string;
  /** 搜索高亮后的 HTML（fuzzyMatch 已转义） */
  nameHtml: string;
  isCurrent: boolean;
  isMissing: boolean;
  status: FileRowStatus;
  annotationCount: number;
  pinned: boolean;
  typeIcon: { cls: string; label: string };
}

export interface FileListSnapshot {
  rows: FileListRow[];
  /** 没有行时的提示文字；null 表示有行 */
  empty: string | null;
}

let snapshot: FileListSnapshot = { rows: [], empty: null };
const listeners = new Set<() => void>();

/** 文件列表（侧边栏“打开”视图）的快照：renderFiles 推送，React 组件订阅 */
export const fileListStore = {
  getState: (): FileListSnapshot => snapshot,
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  setSnapshot(next: FileListSnapshot): void {
    // 内容没变就不通知：避免无关的状态刷新导致整列表重绘
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
    snapshot = next;
    listeners.forEach((l) => l());
  },
};
