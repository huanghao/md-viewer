import type { FileTreeNode } from './types';

export function mergeDirectoryExpandedState(previousTree: FileTreeNode, nextTree: FileTreeNode): void {
  const expandedStateByPath = collectDirectoryExpandedState(previousTree);
  if (expandedStateByPath.size === 0) return;
  applyDirectoryExpandedState(nextTree, expandedStateByPath);
}

export function collectDirectoryExpandedState(node: FileTreeNode, out = new Map<string, boolean>()): Map<string, boolean> {
  if (node.type !== 'directory') return out;
  if (typeof node.isExpanded === 'boolean') {
    out.set(node.path, node.isExpanded);
  }
  for (const child of node.children || []) {
    collectDirectoryExpandedState(child, out);
  }
  return out;
}

export function applyDirectoryExpandedState(node: FileTreeNode, stateByPath: Map<string, boolean>): void {
  if (node.type === 'directory') {
    const saved = stateByPath.get(node.path);
    if (typeof saved === 'boolean') {
      node.isExpanded = saved;
    }
  }
  for (const child of node.children || []) {
    applyDirectoryExpandedState(child, stateByPath);
  }
}
