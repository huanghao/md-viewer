// Pure helpers for refreshing diff view when the file changes during diff mode.

export interface DiffRefreshDeps {
  diffViewActive: boolean;
  pendingContent: string | undefined;
}

export function shouldRefreshDiff(deps: DiffRefreshDeps): boolean {
  return deps.diffViewActive && deps.pendingContent !== undefined;
}

export function refreshDiffBannerLabel(doc: Document): void {
  const label = doc.querySelector('.diff-banner-label');
  if (label) label.textContent = 'Diff 模式 · 文件已再次更新，已刷新至最新版本';
}
