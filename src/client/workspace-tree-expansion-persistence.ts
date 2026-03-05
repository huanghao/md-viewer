import type { FileTreeNode } from './types';

const WORKSPACE_TREE_EXPANDED_KEY = 'md-viewer:workspaceTreeExpandedState';

const workspaceExpandedState = new Map<string, Map<string, boolean>>();

function saveWorkspaceExpandedState(): void {
  try {
    const payload = Array.from(workspaceExpandedState.entries()).map(([workspaceId, pathMap]) => ([
      workspaceId,
      Array.from(pathMap.entries()),
    ]));
    localStorage.setItem(WORKSPACE_TREE_EXPANDED_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('保存工作区目录展开状态失败:', e);
  }
}

export function restoreWorkspaceExpandedStateFromStorage(): void {
  workspaceExpandedState.clear();
  try {
    const raw = localStorage.getItem(WORKSPACE_TREE_EXPANDED_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    for (const item of parsed) {
      if (!Array.isArray(item) || item.length !== 2) continue;
      const workspaceId = item[0];
      const entries = item[1];
      if (typeof workspaceId !== 'string' || !Array.isArray(entries)) continue;
      const pathMap = new Map<string, boolean>();
      for (const pair of entries) {
        if (!Array.isArray(pair) || pair.length !== 2) continue;
        const path = pair[0];
        const expanded = pair[1];
        if (typeof path !== 'string' || typeof expanded !== 'boolean') continue;
        pathMap.set(path, expanded);
      }
      if (pathMap.size > 0) {
        workspaceExpandedState.set(workspaceId, pathMap);
      }
    }
  } catch (e) {
    console.error('恢复工作区目录展开状态失败:', e);
  }
}

export function getWorkspaceExpandedState(workspaceId: string): Map<string, boolean> | undefined {
  return workspaceExpandedState.get(workspaceId);
}

export function setWorkspaceExpandedState(workspaceId: string, pathMap: Map<string, boolean>): void {
  if (pathMap.size === 0) {
    workspaceExpandedState.delete(workspaceId);
    saveWorkspaceExpandedState();
    return;
  }
  workspaceExpandedState.set(workspaceId, new Map(pathMap));
  saveWorkspaceExpandedState();
}

export function removeWorkspaceExpandedState(workspaceId: string): void {
  if (!workspaceExpandedState.has(workspaceId)) return;
  workspaceExpandedState.delete(workspaceId);
  saveWorkspaceExpandedState();
}

export function collectExpandedStateFromTree(tree: FileTreeNode): Map<string, boolean> {
  const out = new Map<string, boolean>();
  const walk = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      if (typeof node.isExpanded === 'boolean') {
        out.set(node.path, node.isExpanded);
      }
      for (const child of node.children || []) {
        walk(child);
      }
    }
  };
  walk(tree);
  return out;
}
