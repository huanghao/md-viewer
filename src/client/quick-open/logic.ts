import type { QuickOpenResult } from './store';

export interface FileHit {
  path: string;
  display: string;
}

/** 文件名（去掉目录） */
export function baseNameOf(path: string): string {
  return path.split('/').pop() ?? path;
}

/** 所在目录，带结尾斜杠；无目录时为空串 */
export function parentDirOf(path: string): string {
  return path.slice(0, path.lastIndexOf('/') + 1);
}

/**
 * 组装结果列表：空查询时列出全部已打开文件；有查询时按搜索命中划分为
 * “已打开”（排在前面）与“文件”两组，保持命中原有顺序。
 */
export function buildQuickOpenResults(openPaths: string[], hits: FileHit[], query: string): QuickOpenResult[] {
  if (!query.trim()) {
    return openPaths.map((path) => ({ path, display: baseNameOf(path), isOpen: true }));
  }
  const openSet = new Set(openPaths);
  const open: QuickOpenResult[] = [];
  const others: QuickOpenResult[] = [];
  for (const hit of hits) {
    const item = { path: hit.path, display: hit.display, isOpen: openSet.has(hit.path) };
    (item.isOpen ? open : others).push(item);
  }
  return [...open, ...others];
}

/** 结果分段：在第一个“已打开”项前加“已打开”标题，在第一个普通文件前加“文件”标题 */
export function sectionStartsOf(results: QuickOpenResult[]): Array<'已打开' | '文件' | null> {
  let openDone = false;
  let fileDone = false;
  return results.map((r) => {
    if (r.isOpen && !openDone) {
      openDone = true;
      return '已打开';
    }
    if (!r.isOpen && !fileDone) {
      fileDone = true;
      return '文件';
    }
    return null;
  });
}
