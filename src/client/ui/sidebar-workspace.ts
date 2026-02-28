import type { Workspace, FileTreeNode, FileInfo } from '../types';
import { state } from '../state';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { getFileListStatus } from '../utils/file-status';
import {
  getCurrentWorkspace,
  toggleWorkspaceExpanded,
  toggleNodeExpanded,
  scanWorkspace,
  switchWorkspace
} from '../workspace';

// 渲染工作区模式侧边栏
export function renderWorkspaceSidebar(): string {
  return `
    ${renderWorkspaceSection()}
    ${renderOpenFilesSection()}
  `;
}

// 渲染工作区区域
function renderWorkspaceSection(): string {
  const workspaces = state.config.workspaces;

  return `
    <div class="workspace-section">
      <div class="section-header">
        <span>工作区</span>
        <div class="section-header-actions">
          <button class="icon-button" onclick="showAddWorkspaceDialog()" title="添加工作区">➕</button>
        </div>
      </div>

      ${workspaces.length === 0 ? renderEmptyWorkspace() : ''}
      ${workspaces.map(ws => renderWorkspaceItem(ws)).join('')}
    </div>
  `;
}

// 渲染空工作区提示
function renderEmptyWorkspace(): string {
  return `
    <div class="empty-workspace">
      <p>暂无工作区</p>
      <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
        点击上方 ➕ 添加工作区
      </p>
    </div>
  `;
}

// 渲染单个工作区
function renderWorkspaceItem(workspace: Workspace): string {
  const isCurrent = state.currentWorkspace === workspace.id;
  const tree = state.fileTree.get(workspace.id);
  const toggle = workspace.isExpanded ? '▼' : '▶';

  return `
    <div class="workspace-item">
      <div class="workspace-header ${isCurrent ? 'active' : ''}"
           onclick="handleWorkspaceClick('${escapeAttr(workspace.id)}')">
        <span class="workspace-toggle">${toggle}</span>
        <span class="workspace-icon">📁</span>
        <span class="workspace-name">${escapeHtml(workspace.name)}</span>
      </div>
      ${workspace.isExpanded ? renderFileTree(workspace.id, tree) : ''}
    </div>
  `;
}

// 渲染文件树
function renderFileTree(workspaceId: string, tree: FileTreeNode | undefined): string {
  if (!tree) {
    return `
      <div class="file-tree loading">
        <div class="tree-loading">加载中...</div>
      </div>
    `;
  }

  if (!tree.children || tree.children.length === 0) {
    return `
      <div class="file-tree empty">
        <div class="tree-empty">此目录下没有 Markdown 文件</div>
      </div>
    `;
  }

  return `
    <div class="file-tree">
      ${tree.children.map(node => renderTreeNode(workspaceId, node, 1)).join('')}
    </div>
  `;
}

// 渲染文件树节点
function renderTreeNode(workspaceId: string, node: FileTreeNode, depth: number): string {
  const indent = '  '.repeat(depth);
  const isCurrentFile = state.currentFile === node.path;

  if (node.type === 'file') {
    return `
      <div class="tree-node">
        <div class="tree-item ${isCurrentFile ? 'current' : ''}"
             onclick="handleFileClick('${escapeAttr(node.path)}')">
          ${indent}<span class="tree-toggle"></span>
          <span class="tree-icon">📄</span>
          <span class="tree-name">${escapeHtml(node.name)}</span>
        </div>
      </div>
    `;
  }

  // 目录
  const isExpanded = node.isExpanded !== false;  // 默认展开
  const toggle = isExpanded ? '▼' : '▶';
  const hasChildren = node.children && node.children.length > 0;

  return `
    <div class="tree-node">
      <div class="tree-item"
           onclick="handleNodeClick('${escapeAttr(workspaceId)}', '${escapeAttr(node.path)}')">
        ${indent}<span class="tree-toggle">${hasChildren ? toggle : ''}</span>
        <span class="tree-icon">📁</span>
        <span class="tree-name">${escapeHtml(node.name)}</span>
        ${node.fileCount ? `<span class="tree-count">${node.fileCount}</span>` : ''}
      </div>
      ${isExpanded && hasChildren ? `
        <div class="file-tree">
          ${node.children!.map(child => renderTreeNode(workspaceId, child, depth + 1)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

// 渲染已打开文件区域
function renderOpenFilesSection(): string {
  const openFiles = Array.from(state.files.values());

  if (openFiles.length === 0) {
    return `
      <div class="open-files-section">
        <div class="section-header">
          <span>已打开</span>
        </div>
        <div class="empty-open-files">
          <p>暂无打开的文件</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="open-files-section">
      <div class="section-header">
        <span>已打开</span>
      </div>
      ${openFiles.map(file => renderOpenFileItem(file)).join('')}
    </div>
  `;
}

// 渲染已打开文件项
function renderOpenFileItem(file: FileInfo): string {
  const isCurrent = state.currentFile === file.path;

  // 获取文件状态（优先级：D > M > 🔵）
  const status = getFileListStatus(file);
  let statusBadge = '&nbsp;'; // 默认使用不间断空格占位

  if (status.badge === 'dot') {
    // 蓝色圆点
    statusBadge = '<span class="new-dot"></span>';
  } else if (status.badge) {
    // M 或 D 字母标识
    statusBadge = `<span class="status-badge status-${status.type}" style="color: ${status.color}">${status.badge}</span>`;
  }

  return `
    <div class="open-file-item ${isCurrent ? 'current' : ''}"
         onclick="handleFileClick('${escapeAttr(file.path)}')">
      <span class="file-item-status">${statusBadge}</span>
      <span class="open-file-icon">📄</span>
      <span class="open-file-name">${escapeHtml(file.name)}</span>
      <span class="open-file-close" onclick="event.stopPropagation(); handleCloseFile('${escapeAttr(file.path)}')">×</span>
    </div>
  `;
}

// 绑定工作区模式事件
export function bindWorkspaceEvents(): void {
  // 工作区点击
  (window as any).handleWorkspaceClick = async (workspaceId: string) => {
    const workspace = state.config.workspaces.find(ws => ws.id === workspaceId);
    if (!workspace) return;

    // 切换展开/折叠
    toggleWorkspaceExpanded(workspaceId);

    // 如果展开且没有加载文件树，则加载
    if (workspace.isExpanded && !state.fileTree.has(workspaceId)) {
      await scanWorkspace(workspaceId);
    }

    // 切换当前工作区
    switchWorkspace(workspaceId);

    // 重新渲染
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };

  // 目录节点点击
  (window as any).handleNodeClick = async (workspaceId: string, nodePath: string) => {
    toggleNodeExpanded(workspaceId, nodePath);

    // 重新渲染
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };

  // 文件点击
  (window as any).handleFileClick = async (filePath: string) => {
    // 导入 switchToFile 和渲染函数
    const { switchToFile } = await import('../state');
    const { loadFile } = await import('../api/files');

    // 如果文件未打开，先加载
    if (!state.files.has(filePath)) {
      const fileData = await loadFile(filePath);
      if (!fileData) return;

      const { addOrUpdateFile } = await import('../state');
      addOrUpdateFile(fileData, true);
    } else {
      switchToFile(filePath);
    }

    // 重新渲染
    const main = await import('../main');
    (main as any).renderAll();
  };

  // 关闭文件
  (window as any).handleCloseFile = async (filePath: string) => {
    const { removeFile } = await import('../state');
    removeFile(filePath);

    // 重新渲染
    const main = await import('../main');
    (main as any).renderAll();
  };

  // 添加工作区对话框
  (window as any).showAddWorkspaceDialog = async () => {
    const path = prompt('请输入工作区路径:');
    if (!path) return;

    const name = path.split('/').pop() || 'workspace';

    const { addWorkspace } = await import('../workspace');
    addWorkspace(name, path);

    // 重新渲染
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };
}
