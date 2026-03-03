export type TabBatchAction = 'close-others' | 'close-right' | 'close-unmodified' | 'close-all';

export interface TabBatchFileLike {
  path: string;
}

export function getTabBatchTargets(
  action: TabBatchAction,
  files: TabBatchFileLike[],
  currentPath: string | null,
  isClosableUnmodified: (path: string) => boolean
): string[] {
  if (files.length === 0) return [];

  if (action === 'close-all') {
    return files.map((f) => f.path);
  }

  if (!currentPath) return [];

  if (action === 'close-others') {
    return files.filter((f) => f.path !== currentPath).map((f) => f.path);
  }

  if (action === 'close-right') {
    const currentIndex = files.findIndex((f) => f.path === currentPath);
    if (currentIndex < 0) return [];
    return files.slice(currentIndex + 1).map((f) => f.path);
  }

  return files
    .filter((f) => f.path !== currentPath && isClosableUnmodified(f.path))
    .map((f) => f.path);
}

