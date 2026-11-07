// Pure helpers for refreshing diff view when the file changes during diff mode.

export interface DiffRefreshDeps {
  diffViewActive: boolean;
  pendingContent: string | undefined;
}

export function shouldRefreshDiff(deps: DiffRefreshDeps): boolean {
  return deps.diffViewActive && deps.pendingContent !== undefined;
}
