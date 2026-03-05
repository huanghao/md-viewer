import {
  getKnownWorkspacePaths,
  removeKnownWorkspacePaths,
  restoreWorkspaceKnownFilesFromStorage,
  setKnownWorkspacePaths,
} from './workspace-state-persistence';
import { clearWorkspacePathMissing, markWorkspacePathMissing } from './workspace-state-missing';
import { restoreWorkspaceExpandedStateFromStorage } from './workspace-tree-expansion-persistence';

const listDiffPaths = new Set<string>();

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

export function restoreWorkspaceAuxiliaryState(): void {
  // 蓝点为会话内提示，刷新后清空
  listDiffPaths.clear();
  restoreWorkspaceKnownFilesFromStorage();
  restoreWorkspaceExpandedStateFromStorage();
}

export function updateWorkspaceListDiff(workspaceId: string, scannedPaths: string[]): void {
  const scannedSet = new Set(scannedPaths);
  const knownSet = getKnownWorkspacePaths(workspaceId);

  // 首次扫描仅建立基线，不触发全量蓝点
  if (!knownSet) {
    setKnownWorkspacePaths(workspaceId, scannedSet);
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

  setKnownWorkspacePaths(workspaceId, scannedSet);
}

export function removeWorkspaceTracking(workspaceId: string): void {
  const knownSet = removeKnownWorkspacePaths(workspaceId);
  if (!knownSet) return;

  for (const path of knownSet) {
    listDiffPaths.delete(path);
  }
}

export function getKnownWorkspacePathsSnapshot(workspaceId: string): string[] {
  return Array.from(getKnownWorkspacePaths(workspaceId) || []);
}
