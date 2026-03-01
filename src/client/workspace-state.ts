const WORKSPACE_KNOWN_KEY = 'md-viewer:workspaceKnownFiles';

const listDiffPaths = new Set<string>();
const workspaceKnownFiles = new Map<string, Set<string>>();
const workspaceMissingPaths = new Set<string>();

function saveWorkspaceAuxiliaryState(): void {
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

export function restoreWorkspaceAuxiliaryState(): void {
  // 蓝点为会话内提示，刷新后清空
  listDiffPaths.clear();
  workspaceKnownFiles.clear();

  try {
    const savedKnown = localStorage.getItem(WORKSPACE_KNOWN_KEY);
    if (savedKnown) {
      const records = JSON.parse(savedKnown);
      if (Array.isArray(records)) {
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
      }
    }
  } catch (e) {
    console.error('恢复列表差异状态失败:', e);
  }
}

export function hasListDiff(path: string): boolean {
  return listDiffPaths.has(path);
}

export function markListDiff(path: string): void {
  listDiffPaths.add(path);
}

export function clearListDiff(path: string): void {
  if (!listDiffPaths.has(path)) return;
  listDiffPaths.delete(path);
}

export function markWorkspacePathMissing(path: string): void {
  workspaceMissingPaths.add(path);
}

export function clearWorkspacePathMissing(path: string): void {
  workspaceMissingPaths.delete(path);
}

export function isWorkspacePathMissing(path: string): boolean {
  return workspaceMissingPaths.has(path);
}

export function getWorkspaceMissingPaths(workspacePath?: string): string[] {
  const all = Array.from(workspaceMissingPaths.values());
  if (!workspacePath) return all;
  const prefix = `${workspacePath.replace(/\/+$/, '')}/`;
  return all.filter((p) => p.startsWith(prefix));
}

export function updateWorkspaceListDiff(workspaceId: string, scannedPaths: string[]): void {
  const scannedSet = new Set(scannedPaths);
  const knownSet = workspaceKnownFiles.get(workspaceId);

  // 首次扫描仅建立基线，不触发全量蓝点
  if (!knownSet) {
    workspaceKnownFiles.set(workspaceId, scannedSet);
    saveWorkspaceAuxiliaryState();
    return;
  }

  // 新扫描到的路径标记蓝点
  for (const path of scannedSet) {
    if (!knownSet.has(path)) {
      listDiffPaths.add(path);
    }
    // 文件重新出现则清除删除态（例如恢复/重新创建）
    clearWorkspacePathMissing(path);
  }

  // 从工作区中消失的路径：移除蓝点并进入删除态
  for (const oldPath of knownSet) {
    if (!scannedSet.has(oldPath)) {
      listDiffPaths.delete(oldPath);
      markWorkspacePathMissing(oldPath);
    }
  }

  workspaceKnownFiles.set(workspaceId, scannedSet);
  saveWorkspaceAuxiliaryState();
}

export function removeWorkspaceTracking(workspaceId: string): void {
  const knownSet = workspaceKnownFiles.get(workspaceId);
  if (knownSet) {
    for (const path of knownSet) {
      listDiffPaths.delete(path);
    }
  }
  workspaceKnownFiles.delete(workspaceId);
  saveWorkspaceAuxiliaryState();
}

