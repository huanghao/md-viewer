const WORKSPACE_KNOWN_KEY = 'md-viewer:workspaceKnownFiles';

const workspaceKnownFiles = new Map<string, Set<string>>();

function saveWorkspaceKnownFiles(): void {
  try {
    localStorage.setItem(
      WORKSPACE_KNOWN_KEY,
      JSON.stringify(
        Array.from(workspaceKnownFiles.entries()).map(([workspaceId, paths]) => [workspaceId, Array.from(paths)])
      )
    );
  } catch (e) {
    console.error('保存列表差异状态失败:', e);
  }
}

export function restoreWorkspaceKnownFilesFromStorage(): void {
  workspaceKnownFiles.clear();

  try {
    const savedKnown = localStorage.getItem(WORKSPACE_KNOWN_KEY);
    if (!savedKnown) return;

    const records = JSON.parse(savedKnown);
    if (!Array.isArray(records)) return;

    for (const item of records) {
      if (!Array.isArray(item) || item.length !== 2) continue;
      const workspaceId = item[0];
      const paths = item[1];
      if (typeof workspaceId !== 'string' || !Array.isArray(paths)) continue;
      workspaceKnownFiles.set(
        workspaceId,
        new Set(paths.filter((path): path is string => typeof path === 'string' && path.length > 0))
      );
    }
  } catch (e) {
    console.error('恢复列表差异状态失败:', e);
  }
}

export function getKnownWorkspacePaths(workspaceId: string): Set<string> | undefined {
  return workspaceKnownFiles.get(workspaceId);
}

export function setKnownWorkspacePaths(workspaceId: string, paths: Set<string>): void {
  workspaceKnownFiles.set(workspaceId, paths);
  saveWorkspaceKnownFiles();
}

export function removeKnownWorkspacePaths(workspaceId: string): Set<string> | undefined {
  const knownSet = workspaceKnownFiles.get(workspaceId);
  workspaceKnownFiles.delete(workspaceId);
  saveWorkspaceKnownFiles();
  return knownSet;
}

