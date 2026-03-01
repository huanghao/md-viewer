import type { Workspace, FileTreeNode } from './types';
import { state } from './state';
import { saveConfig } from './config';

// 生成唯一 ID
function generateId(): string {
  return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function normalizeWorkspacePath(path: string): string {
  return path.trim().replace(/\/+$/, '');
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
    // 调用后端 API 扫描目录
    const response = await fetch('/api/scan-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: workspace.path })
    });

    if (!response.ok) {
      console.error('扫描工作区失败:', await response.text());
      return null;
    }

    const tree: FileTreeNode = await response.json();

    // 缓存文件树
    state.fileTree.set(workspaceId, tree);

    return tree;
  } catch (e) {
    console.error('扫描工作区失败:', e);
    return null;
  }
}

// 切换目录展开/折叠状态
export function toggleNodeExpanded(workspaceId: string, nodePath: string): void {
  const tree = state.fileTree.get(workspaceId);
  if (!tree) return;

  const node = findNodeByPath(tree, nodePath);
  if (node && node.type === 'directory') {
    node.isExpanded = !node.isExpanded;
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
