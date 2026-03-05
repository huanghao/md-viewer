import type { Workspace, FileTreeNode } from './types';
import { state } from './state';
import { updateWorkspaceListDiff, removeWorkspaceTracking } from './workspace-state';
import { saveConfig } from './config';
import { mergeDirectoryExpandedState, applyDirectoryExpandedState } from './workspace-tree-expansion';
import {
  collectExpandedStateFromTree,
  getWorkspaceExpandedState,
  removeWorkspaceExpandedState,
  setWorkspaceExpandedState,
} from './workspace-tree-expansion-persistence';

// 生成唯一 ID
function generateId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function normalizeWorkspacePath(path: string): string {
  return path.trim().replace(/\/+$/, '');
}

function findBestWorkspaceForFile(filePath: string): Workspace | null {
  const normalizedFilePath = normalizeWorkspacePath(filePath);
  let best: Workspace | null = null;
  for (const ws of state.config.workspaces) {
    const root = normalizeWorkspacePath(ws.path);
    if (!(normalizedFilePath === root || normalizedFilePath.startsWith(`${root}/`))) continue;
    if (!best || root.length > normalizeWorkspacePath(best.path).length) {
      best = ws;
    }
  }
  return best;
}

function expandDirectoryChain(workspaceId: string, workspacePath: string, filePath: string): void {
  const tree = state.fileTree.get(workspaceId);
  if (!tree) return;
  const root = normalizeWorkspacePath(workspacePath);
  const target = normalizeWorkspacePath(filePath);
  if (!(target === root || target.startsWith(`${root}/`))) return;

  const relative = target === root ? '' : target.slice(root.length + 1);
  const parts = relative.split('/').filter(Boolean);
  if (parts.length <= 1) return;

  let changed = false;
  let current = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    current = `${current}/${parts[i]}`;
    const node = findNodeByPath(tree, current);
    if (node && node.type === 'directory' && node.isExpanded === false) {
      node.isExpanded = true;
      changed = true;
    }
  }

  if (changed) {
    setWorkspaceExpandedState(workspaceId, collectExpandedStateFromTree(tree));
  }
}

// 添加工作区
export function addWorkspace(name: string, path: string): Workspace {
  const normalizedPath = normalizeWorkspacePath(path);
  const existing = state.config.workspaces.find(ws => ws.path === normalizedPath);
  if (existing) {
    state.currentWorkspace = existing.id;
    return existing;
  }

  const workspace: Workspace = {
    id: generateId(),
    name,
    path: normalizedPath,
    isExpanded: false
  };

  state.config.workspaces.push(workspace);
  saveConfig(state.config);

  // 添加后切换到新工作区
  state.currentWorkspace = workspace.id;

  return workspace;
}

// 移除工作区
export function removeWorkspace(id: string): void {
  const index = state.config.workspaces.findIndex(ws => ws.id === id);
  if (index === -1) return;

  state.config.workspaces.splice(index, 1);
  saveConfig(state.config);

  // 清除文件树缓存
  state.fileTree.delete(id);
  removeWorkspaceTracking(id);
  removeWorkspaceExpandedState(id);

  // 如果删除的是当前工作区，切换到第一个
  if (state.currentWorkspace === id) {
    state.currentWorkspace = state.config.workspaces.length > 0
      ? state.config.workspaces[0].id
      : null;
  }
}

// 切换工作区
export function switchWorkspace(id: string): void {
  const workspace = state.config.workspaces.find(ws => ws.id === id);
  if (!workspace) return;

  state.currentWorkspace = id;
}

// 调整工作区顺序（按钮上移/下移）
export function moveWorkspaceByOffset(workspaceId: string, offset: -1 | 1): void {
  const list = state.config.workspaces;
  const from = list.findIndex((ws) => ws.id === workspaceId);
  if (from === -1) return;

  const to = from + offset;
  if (to < 0 || to >= list.length) return;

  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  saveConfig(state.config);
}

// 切换工作区展开/折叠状态
export function toggleWorkspaceExpanded(id: string): void {
  const workspace = state.config.workspaces.find(ws => ws.id === id);
  if (!workspace) return;

  workspace.isExpanded = !workspace.isExpanded;
  saveConfig(state.config);
}

// 获取当前工作区
export function getCurrentWorkspace(): Workspace | null {
  if (!state.currentWorkspace) return null;
  return state.config.workspaces.find(ws => ws.id === state.currentWorkspace) || null;
}

// 从文件路径推断工作区
export async function inferWorkspaceFromPath(filePath: string): Promise<Workspace | null> {
  try {
    // 调用后端 API 获取文件所在的 git 仓库根目录
    const response = await fetch('/api/infer-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath })
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.workspacePath) return null;

    // 检查是否已存在
    const existing = state.config.workspaces.find(ws => ws.path === data.workspacePath);
    if (existing) return existing;

    // 创建新工作区
    const name = data.workspaceName || data.workspacePath.split('/').pop() || 'workspace';
    return addWorkspace(name, data.workspacePath);
  } catch (e) {
    console.error('推断工作区失败:', e);
    return null;
  }
}

// 扫描工作区，构建文件树
export async function scanWorkspace(workspaceId: string): Promise<FileTreeNode | null> {
  const workspace = state.config.workspaces.find(ws => ws.id === workspaceId);
  if (!workspace) return null;

  try {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 15000);

    // 调用后端 API 扫描目录
    const response = await fetch('/api/scan-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: workspace.path }),
      signal: controller.signal,
    });
    window.clearTimeout(timeoutId);

    if (!response.ok) {
      console.error('扫描工作区失败:', await response.text());
      return null;
    }

    const tree: FileTreeNode = await response.json();

    // Keep user's directory expand/collapse preference across polling rescans.
    const previousTree = state.fileTree.get(workspaceId);
    if (previousTree) {
      mergeDirectoryExpandedState(previousTree, tree);
    }
    const persistedExpandedState = getWorkspaceExpandedState(workspaceId);
    if (persistedExpandedState && persistedExpandedState.size > 0) {
      applyDirectoryExpandedState(tree, persistedExpandedState);
    }

    // 缓存文件树
    state.fileTree.set(workspaceId, tree);
    setWorkspaceExpandedState(workspaceId, collectExpandedStateFromTree(tree));
    updateWorkspaceListDiff(workspaceId, collectFilePaths(tree));

    return tree;
  } catch (e) {
    console.error('扫描工作区失败:', e);
    return null;
  }
}

function collectFilePaths(node: FileTreeNode | undefined): string[] {
  if (!node) return [];
  if (node.type === 'file') return [node.path];

  const paths: string[] = [];
  for (const child of node.children || []) {
    paths.push(...collectFilePaths(child));
  }
  return paths;
}

// 刷新后恢复已展开工作区的目录树，避免出现“已展开但未加载”的占位状态。
export async function hydrateExpandedWorkspaces(): Promise<void> {
  const expanded = state.config.workspaces.filter((ws) => ws.isExpanded);

  for (const ws of expanded) {
    // 忽略失败，失败态由点击时的重试逻辑处理。
    await scanWorkspace(ws.id);
  }

  // 刷新后如果没有当前工作区，默认选中第一个工作区。
  if (!state.currentWorkspace && state.config.workspaces.length > 0) {
    state.currentWorkspace = state.config.workspaces[0].id;
  }
}

// 在工作区模式下根据文件路径自动展开目录树并定位工作区
export async function revealFileInWorkspace(filePath: string): Promise<void> {
  const workspace = findBestWorkspaceForFile(filePath);
  if (!workspace) return;

  // 切换到对应工作区
  state.currentWorkspace = workspace.id;

  // 确保工作区本身是展开状态
  if (!workspace.isExpanded) {
    workspace.isExpanded = true;
    saveConfig(state.config);
  }

  // 懒加载树后再展开祖先目录
  if (!state.fileTree.has(workspace.id)) {
    await scanWorkspace(workspace.id);
  }
  expandDirectoryChain(workspace.id, workspace.path, filePath);
}

// 切换目录展开/折叠状态
export function toggleNodeExpanded(workspaceId: string, nodePath: string): void {
  const tree = state.fileTree.get(workspaceId);
  if (!tree) return;

  const node = findNodeByPath(tree, nodePath);
  if (node && node.type === 'directory') {
    const currentlyExpanded = node.isExpanded !== false;
    node.isExpanded = !currentlyExpanded;
    setWorkspaceExpandedState(workspaceId, collectExpandedStateFromTree(tree));
  }
}

// 在文件树中查找节点
function findNodeByPath(node: FileTreeNode, path: string): FileTreeNode | null {
  if (node.path === path) return node;

  if (node.children) {
    for (const child of node.children) {
      const found = findNodeByPath(child, path);
      if (found) return found;
    }
  }

  return null;
}
