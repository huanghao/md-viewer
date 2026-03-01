import type { Workspace, FileTreeNode, FileInfo } from '../types';
import { state } from '../state';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { getFileListStatus } from '../utils/file-status';
import { generateDistinctNames } from '../utils/file-names';
import { showError, showSuccess, showWarning } from './toast';
import { attachPathAutocomplete } from './path-autocomplete';
import {
  removeWorkspace,
  toggleWorkspaceExpanded,
  toggleNodeExpanded,
  scanWorkspace,
  switchWorkspace
} from '../workspace';

const ADD_WORKSPACE_DIALOG_ID = 'addWorkspaceDialogOverlay';
const ADD_WORKSPACE_INPUT_ID = 'addWorkspacePathInput';
const ADD_WORKSPACE_PREVIEW_ID = 'addWorkspacePathPreview';
let pendingRemoveWorkspaceId: string | null = null;
let removeOutsideClickBound = false;

function getWorkspaceNameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'workspace';
}

function updateWorkspacePathPreview(): void {
  const input = document.getElementById(ADD_WORKSPACE_INPUT_ID) as HTMLTextAreaElement | null;
  const preview = document.getElementById(ADD_WORKSPACE_PREVIEW_ID) as HTMLElement | null;
  if (!preview) return;

  const value = input?.value.trim() || '';
  preview.textContent = value || '路径预览：在上方输入后这里会显示完整路径';
}

function createAddWorkspaceDialog(): HTMLElement {
  const existing = document.getElementById(ADD_WORKSPACE_DIALOG_ID);
  if (existing) return existing;

  const overlay = document.createElement('div');
  overlay.id = ADD_WORKSPACE_DIALOG_ID;
  overlay.className = 'sync-dialog-overlay add-workspace-overlay';
  overlay.innerHTML = `
    <div class="sync-dialog add-workspace-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">添加工作区</div>
        <button class="sync-dialog-close" onclick="closeAddWorkspaceDialog()">×</button>
      </div>
      <div class="sync-dialog-body">
        <div class="sync-dialog-field">
          <label class="sync-dialog-label">📁 工作区路径</label>
          <textarea
            id="${ADD_WORKSPACE_INPUT_ID}"
            class="sync-dialog-input workspace-path-input"
            rows="3"
            placeholder="/Users/huanghao/workspace/md-viewer"
          ></textarea>
          <div class="workspace-path-hint">支持粘贴长路径。按 Ctrl/Cmd + Enter 快速确认。</div>
          <div id="${ADD_WORKSPACE_PREVIEW_ID}" class="workspace-path-preview">路径预览：在上方输入后这里会显示完整路径</div>
        </div>
      </div>
      <div class="sync-dialog-footer add-workspace-footer">
        <button class="sync-dialog-btn" onclick="closeAddWorkspaceDialog()">取消</button>
        <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="confirmAddWorkspaceDialog()">添加</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeAddWorkspaceDialog();
    }
  });

  const input = overlay.querySelector(`#${ADD_WORKSPACE_INPUT_ID}`) as HTMLTextAreaElement | null;
  if (input) {
    attachPathAutocomplete(input, { kind: 'directory', markdownOnly: false });
    input.addEventListener('input', updateWorkspacePathPreview);
    input.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        (window as any).confirmAddWorkspaceDialog();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeAddWorkspaceDialog();
      }
    });
  }

  return overlay;
}

function showAddWorkspaceDialog(): void {
  const overlay = createAddWorkspaceDialog();
  overlay.classList.add('show');

  const input = document.getElementById(ADD_WORKSPACE_INPUT_ID) as HTMLTextAreaElement | null;
  if (input) {
    input.value = '';
    updateWorkspacePathPreview();
    input.focus();
  }
}

function closeAddWorkspaceDialog(): void {
  const overlay = document.getElementById(ADD_WORKSPACE_DIALOG_ID);
  if (overlay) {
    overlay.classList.remove('show');
  }
}

async function confirmAddWorkspaceDialog(): Promise<void> {
  try {
    const input = document.getElementById(ADD_WORKSPACE_INPUT_ID) as HTMLTextAreaElement | null;
    const path = input?.value.trim() || '';
    if (!path) {
      showWarning('请输入工作区路径');
      input?.focus();
      return;
    }

    const name = getWorkspaceNameFromPath(path);
    const { addWorkspace } = await import('../workspace');
    const workspace = addWorkspace(name, path);

    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
    closeAddWorkspaceDialog();
    showSuccess(`已添加工作区: ${workspace.name}`, 2000);
  } catch (error: any) {
    console.error('添加工作区失败:', error);
    showError(`添加工作区失败: ${error?.message || '未知错误'}`);
  }
}

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
          <button class="icon-button" onclick="focusAddInput && focusAddInput()" title="聚焦添加输入">➕</button>
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
        ${pendingRemoveWorkspaceId === workspace.id ? `
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            <button
              class="workspace-remove-confirm"
              title="确认移除"
              onclick="handleConfirmRemoveWorkspace('${escapeAttr(workspace.id)}')"
            >删</button>
          </div>
        ` : `
          <button
            class="workspace-remove"
            title="移除工作区"
            onclick="event.stopPropagation();handleAskRemoveWorkspace('${escapeAttr(workspace.id)}')"
          >
            ×
          </button>
        `}
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
  const currentWorkspace = state.config.workspaces.find(ws => ws.id === state.currentWorkspace) || null;
  const workspacePrefix = currentWorkspace ? `${currentWorkspace.path}/` : null;

  const scopedEntries = Array.from(state.files.entries()).filter(([path]) => {
    if (!workspacePrefix) return true;
    return path === currentWorkspace!.path || path.startsWith(workspacePrefix);
  });
  const scopedMap = new Map(scopedEntries);
  const openFiles = generateDistinctNames(scopedMap);

  if (openFiles.length === 0) {
    const emptyText = currentWorkspace
      ? `当前工作区（${currentWorkspace.name}）暂无打开的文件`
      : '暂无打开的文件';
    return `
      <div class="open-files-section">
        <div class="section-header">
          <span>已打开</span>
        </div>
        <div class="empty-open-files">
          <p>${escapeHtml(emptyText)}</p>
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
  const displayName = file.displayName || file.name;

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
      <span class="open-file-name">${escapeHtml(displayName)}</span>
      <span class="open-file-close" onclick="event.stopPropagation(); handleCloseFile('${escapeAttr(file.path)}')">×</span>
    </div>
  `;
}

// 绑定工作区模式事件
export function bindWorkspaceEvents(): void {
  if (!removeOutsideClickBound) {
    removeOutsideClickBound = true;
    document.addEventListener('click', async (e) => {
      if (!pendingRemoveWorkspaceId) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (target.closest('.workspace-remove-actions') || target.closest('.workspace-remove')) {
        return;
      }

      pendingRemoveWorkspaceId = null;
      const { renderSidebar } = await import('./sidebar');
      renderSidebar();
    });
  }

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

  // 进入移除确认态（非模态）
  (window as any).handleAskRemoveWorkspace = async (workspaceId: string) => {
    pendingRemoveWorkspaceId = workspaceId;
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };

  // 确认移除
  (window as any).handleConfirmRemoveWorkspace = async (workspaceId: string) => {
    const workspace = state.config.workspaces.find(ws => ws.id === workspaceId);
    if (!workspace) return;

    removeWorkspace(workspaceId);
    pendingRemoveWorkspaceId = null;

    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
    showSuccess(`已移除工作区: ${workspace.name}`, 2000);
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
  (window as any).showAddWorkspaceDialog = showAddWorkspaceDialog;
  (window as any).closeAddWorkspaceDialog = closeAddWorkspaceDialog;
  (window as any).confirmAddWorkspaceDialog = confirmAddWorkspaceDialog;
}
