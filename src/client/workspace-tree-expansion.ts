import type { FileTreeNode } from './types';

export function mergeDirectoryExpandedState(previousTree: FileTreeNode, nextTree: FileTreeNode): void {
  const expandedStateByPath = new Map<string, boolean>();
  collectDirectoryExpandedState(previousTree, expandedStateByPath);
  if (expandedStateByPath.size === 0) return;
  applyDirectoryExpandedState(nextTree, expandedStateByPath);
}

function collectDirectoryExpandedState(node: FileTreeNode, out: Map<string, boolean>): void {
  if (node.type !== 'directory') return;
  if (typeof node.isExpanded === 'boolean') {
    out.set(node.path, node.isExpanded);
  }
  for (const child of node.children || []) {
    collectDirectoryExpandedState(child, out);
  }
}

function applyDirectoryExpandedState(node: FileTreeNode, stateByPath: Map<string, boolean>): void {
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

