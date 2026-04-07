import type { Workspace, FileTreeNode, FileInfo } from '../types';
import { state, getSessionFile, getSessionFiles, hasSessionFile } from '../state';
import { renderFocusView } from './workspace-focus';
import { hasListDiff, isWorkspacePathMissing, getWorkspaceMissingPaths } from '../workspace-state';
import { searchFiles } from '../api/files';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { getFileListStatus } from '../utils/file-status';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { showError, showSuccess, showWarning } from './toast';
import { attachPathAutocomplete } from './path-autocomplete';
import {
  removeWorkspace,
  moveWorkspaceByOffset,
  toggleWorkspaceExpanded,
  toggleNodeExpanded,
  scanWorkspace,
} from '../workspace';
import { clearListDiff, clearWorkspaceModified, hasWorkspaceModified } from '../workspace-state';
import { isPinned } from '../utils/pinned-files';

const ADD_WORKSPACE_DIALOG_ID = 'addWorkspaceDialogOverlay';
const ADD_WORKSPACE_INPUT_ID = 'addWorkspacePathInput';
const ADD_WORKSPACE_PREVIEW_ID = 'addWorkspacePathPreview';
let pendingRemoveWorkspaceId: string | null = null;
let removeOutsideClickBound = false;
const loadingWorkspaceIds = new Set<string>();
const failedWorkspaceIds = new Set<string>();
let workspaceSearchQuery = '';
let workspaceSearchRootsKey = '';
let workspaceSearchLoading = false;
let workspaceSearchLoaded = false;
let workspaceSearchPaths = new Set<string>();
let workspaceSearchSeq = 0;

function getWorkspaceNameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'workspace';
}

function renderFileNameWithTailPriority(name: string): string {
  // 始终保留完整文本，省略交给 CSS，避免“缩窄后放大不还原”的不可逆截断
  const stripped = stripWorkspaceTreeDisplayExtension(name) || name;
  return `<span class="tree-name-full">${escapeHtml(stripped)}</span>`;
}

function collectTreeFilePaths(node: FileTreeNode | undefined, bag: Set<string>): void {
  if (!node) return;
  if (node.type === 'file') {
    bag.add(node.path);
    return;
  }
  (node.children || []).forEach((child) => collectTreeFilePaths(child, bag));
}

function annotateDirectoryFileCount(node: FileTreeNode): number {
  if (node.type === 'file') return 1;
  let count = 0;
  for (const child of node.children || []) {
    count += annotateDirectoryFileCount(child);
  }
  node.fileCount = count;
  return count;
}

function buildTreeFromPaths(workspace: Workspace, filePaths: string[]): FileTreeNode {
  const workspacePath = workspace.path.replace(/\/+$/, '');
  const root: FileTreeNode = {
    name: workspace.name,
    path: workspacePath,
    type: 'directory',
    isExpanded: true,
    children: [],
  };

  const directoryMap = new Map<string, FileTreeNode>([[workspacePath, root]]);

  const sortedPaths = Array.from(new Set(filePaths)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
  for (const fullPath of sortedPaths) {
    if (!fullPath.startsWith(`${workspacePath}/`)) continue;
    const relative = fullPath.slice(workspacePath.length + 1);
    const parts = relative.split('/').filter(Boolean);
    if (parts.length === 0) continue;

    let currentPath = workspacePath;
    let currentNode = root;

    for (let i = 0; i < parts.length; i += 1) {
      const part = parts[i];
      const isFile = i === parts.length - 1;
      currentPath = `${currentPath}/${part}`;

      if (isFile) {
        const exists = (currentNode.children || []).some((child) => child.path === currentPath);
        if (!exists) {
          currentNode.children!.push({
            name: part,
            path: currentPath,
            type: 'file',
          });
        }
      } else {
        let dirNode = directoryMap.get(currentPath);
        if (!dirNode) {
          dirNode = {
            name: part,
            path: currentPath,
            type: 'directory',
            isExpanded: true,
            children: [],
          };
          directoryMap.set(currentPath, dirNode);
          currentNode.children!.push(dirNode);
        }
        currentNode = dirNode;
      }
    }
  }

  annotateDirectoryFileCount(root);
  return root;
}

function buildSearchTree(workspace: Workspace, query: string): FileTreeNode | undefined {
  if (!query) return state.fileTree.get(workspace.id);
  const workspaceRoot = workspace.path.replace(/\/+$/, '');
  const workspacePrefix = `${workspaceRoot}/`;
  const matched = Array.from(workspaceSearchPaths).filter((path) => (
    path === workspaceRoot || path.startsWith(workspacePrefix)
  ));
  if (matched.length === 0) return undefined;
  return buildTreeFromPaths(workspace, matched);
}

function getWorkspaceSearchRoots(): string[] {
  return state.config.workspaces
    .map((workspace) => workspace.path.trim())
    .filter(Boolean);
}

function resetWorkspaceSearchState(): void {
  workspaceSearchQuery = '';
  workspaceSearchRootsKey = '';
  workspaceSearchLoading = false;
  workspaceSearchLoaded = false;
  workspaceSearchPaths = new Set<string>();
}

async function runWorkspaceSearch(query: string, roots: string[], rootsKey: string, seq: number): Promise<void> {
  try {
    const data = await searchFiles(query, { roots, limit: 200 });
    if (seq !== workspaceSearchSeq) return;
    workspaceSearchQuery = query;
    workspaceSearchRootsKey = rootsKey;
    workspaceSearchPaths = new Set((data.files || []).map((file) => file.path).filter(Boolean));
    workspaceSearchLoading = false;
    workspaceSearchLoaded = true;
  } catch (error) {
    if (seq !== workspaceSearchSeq) return;
    console.error('工作区搜索失败:', error);
    workspaceSearchQuery = query;
    workspaceSearchRootsKey = rootsKey;
    workspaceSearchPaths = new Set<string>();
    workspaceSearchLoading = false;
    workspaceSearchLoaded = true;
  }

  const { renderSidebar } = await import('./sidebar');
  renderSidebar();
}

function ensureWorkspaceSearchResults(query: string): void {
  const trimmed = query.trim();
  if (!trimmed) {
    resetWorkspaceSearchState();
    return;
  }

  // 绝对路径或波浪线路径：用户在做路径补全，不需要工作区深度搜索
  if (trimmed.startsWith('/') || trimmed.startsWith('~/') || trimmed.startsWith('~\\')) {
    resetWorkspaceSearchState();
    return;
  }

  const roots = getWorkspaceSearchRoots();
  const rootsKey = roots.join('\n');
  if (roots.length === 0) {
    workspaceSearchQuery = trimmed;
    workspaceSearchRootsKey = rootsKey;
    workspaceSearchPaths = new Set<string>();
    workspaceSearchLoading = false;
    workspaceSearchLoaded = true;
    return;
  }

  if (
    workspaceSearchLoaded &&
    !workspaceSearchLoading &&
    workspaceSearchQuery === trimmed &&
    workspaceSearchRootsKey === rootsKey
  ) {
    return;
  }

  if (
    workspaceSearchLoading &&
    workspaceSearchQuery === trimmed &&
    workspaceSearchRootsKey === rootsKey
  ) {
    return;
  }

  workspaceSearchSeq += 1;
  workspaceSearchQuery = trimmed;
  workspaceSearchRootsKey = rootsKey;
  workspaceSearchLoading = true;
  workspaceSearchLoaded = false;
  workspaceSearchPaths = new Set<string>();
  void runWorkspaceSearch(trimmed, roots, rootsKey, workspaceSearchSeq);
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
  if (state.config.sidebarTab === 'focus') {
    return renderFocusView();
  }
  const query = state.searchQuery.trim().toLowerCase();
  ensureWorkspaceSearchResults(query);
  return `${renderWorkspaceSection(query)}`;
}

// 渲染工作区区域
function renderWorkspaceSection(query: string): string {
  const workspaces = state.config.workspaces;
  const workspaceItems = workspaces
    .map((ws, index) => renderWorkspaceItem(ws, index, workspaces.length, query))
    .filter(Boolean)
    .join('');

  return `
    <div class="workspace-section">
      ${workspaces.length === 0 ? renderEmptyWorkspace() : ''}
      ${workspaces.length > 0 && !workspaceItems ? '<div class="empty-workspace"><p>未找到匹配内容</p></div>' : ''}
      ${workspaceItems}
    </div>
  `;
}

// 渲染空工作区提示
function renderEmptyWorkspace(): string {
  return `
    <div class="empty-workspace">
      <p>暂无工作区</p>
      <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
        在上方输入目录路径后回车添加
      </p>
    </div>
  `;
}

// 渲染单个工作区
function renderWorkspaceItem(workspace: Workspace, index: number, total: number, query: string): string {
  const isCurrent = state.currentWorkspace === workspace.id;
  const tree = query ? buildSearchTree(workspace, query) : state.fileTree.get(workspace.id);
  const shouldExpand = query ? true : workspace.isExpanded;
  const toggle = shouldExpand ? '▼' : '▶';
  const canMoveUp = index > 0;
  const canMoveDown = index < total - 1;
  const workspaceMatched = !query || workspace.name.toLowerCase().includes(query) || workspace.path.toLowerCase().includes(query);
  const hasTreeMatch = !!tree && !!tree.children && tree.children.length > 0;
  const missingSection = shouldExpand ? renderMissingOpenFiles(workspace.id, workspace.path, tree, query) : '';
  const hasMissingMatch = !!missingSection;

  if (query && !workspaceMatched && !hasTreeMatch && !hasMissingMatch) {
    return '';
  }

  return `
    <div class="workspace-item">
      <div class="workspace-header ${isCurrent ? 'active' : ''}" onclick="handleWorkspaceToggle('${escapeAttr(workspace.id)}')">
        <span class="workspace-toggle">${toggle}</span>
        <span class="workspace-icon">📁</span>
        <span class="workspace-name">${escapeHtml(workspace.name)}</span>
        ${pendingRemoveWorkspaceId === workspace.id ? `
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            ${canMoveUp ? `
            <button
              class="workspace-order-btn"
              title="上移"
              onclick="handleMoveWorkspaceUp('${escapeAttr(workspace.id)}')"
            >↑</button>
            ` : ''}
            ${canMoveDown ? `
            <button
              class="workspace-order-btn"
              title="下移"
              onclick="handleMoveWorkspaceDown('${escapeAttr(workspace.id)}')"
            >↓</button>
            ` : ''}
            <button
              class="workspace-remove-confirm"
              title="确认移除"
              onclick="handleConfirmRemoveWorkspace('${escapeAttr(workspace.id)}')"
            >删</button>
          </div>
        ` : `
          <div class="workspace-remove-actions" onclick="event.stopPropagation()">
            ${canMoveUp ? `
            <button
              class="workspace-order-btn"
              title="上移"
              onclick="handleMoveWorkspaceUp('${escapeAttr(workspace.id)}')"
            >↑</button>
            ` : ''}
            ${canMoveDown ? `
            <button
              class="workspace-order-btn"
              title="下移"
              onclick="handleMoveWorkspaceDown('${escapeAttr(workspace.id)}')"
            >↓</button>
            ` : ''}
          <button
            class="workspace-remove"
            title="移除工作区"
            onclick="event.stopPropagation();handleAskRemoveWorkspace('${escapeAttr(workspace.id)}')"
          >
            ×
          </button>
          </div>
        `}
      </div>
      ${shouldExpand ? renderFileTree(workspace.id, tree, query) : ''}
      ${missingSection}
    </div>
  `;
}

// 渲染文件树
function renderFileTree(workspaceId: string, tree: FileTreeNode | undefined, query: string): string {
  if (query && workspaceSearchLoading && workspaceSearchQuery === query) {
    return `
      <div class="file-tree loading">
        <div class="tree-loading">搜索中...</div>
      </div>
    `;
  }

  if (loadingWorkspaceIds.has(workspaceId)) {
    return `
      <div class="file-tree loading">
        <div class="tree-loading">加载中...</div>
      </div>
    `;
  }

  if (failedWorkspaceIds.has(workspaceId)) {
    return `
      <div class="file-tree empty">
        <div class="tree-empty" onclick="retryWorkspaceScan('${escapeAttr(workspaceId)}')" style="cursor: pointer;">加载失败，点击重试</div>
      </div>
    `;
  }

  if (!tree) {
    return `
      <div class="file-tree empty">
        <div class="tree-empty">${query ? '未找到匹配文件' : '目录暂不可用'}</div>
      </div>
    `;
  }

  if (!tree.children || tree.children.length === 0) {
    return `
      <div class="file-tree empty">
        <div class="tree-empty">${query ? '未找到匹配文件' : '此目录下没有 Markdown/HTML 文件'}</div>
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
  const indentPx = 4 + depth * 8;
  const isCurrentFile = state.currentFile === node.path;

  if (node.type === 'file') {
    const openedFile = getSessionFile(node.path);
    const listDiff = hasListDiff(node.path);
    const isMissing = !!openedFile?.isMissing || isWorkspacePathMissing(node.path);
    const typeIcon = getFileTypeIcon(node.path);

    // 获取文件状态（优先级：D > M > 蓝点）
    const wsModified = hasWorkspaceModified(node.path);
    let statusBadge = '&nbsp;';
    if (openedFile) {
      const status = getFileListStatus(openedFile, listDiff);
      if (status.badge === 'dot') {
        statusBadge = '<span class="new-dot"></span>';
      } else if (status.badge) {
        statusBadge = `<span class="status-badge status-${status.type}" style="color: ${status.color}">${status.badge}</span>`;
      }
    } else if (isMissing) {
      statusBadge = '<span class="status-badge status-deleted" style="color: #cf222e">D</span>';
    } else if (wsModified) {
      statusBadge = '<span class="status-badge status-modified" style="color: #ff9500">M</span>';
    } else if (listDiff) {
      statusBadge = '<span class="new-dot"></span>';
    }

    const classes = [
      'tree-item',
      'file-node',
      isMissing ? 'missing' : '',
      isCurrentFile ? 'current' : '',
    ].filter(Boolean).join(' ');

    const pinned = isPinned(node.path);
    const pinBtn = `<button
  class="tree-pin-btn${pinned ? ' active' : ''}"
  title="${pinned ? '取消固定到焦点视图' : '固定到焦点视图'}"
  onclick="event.stopPropagation();${pinned ? `handleUnpinFile` : `handlePinFile`}('${escapeAttr(node.path)}')"
>📌</button>`;

    return `
      <div class="tree-node">
        <div class="${classes}"
             onclick="handleFileClick('${escapeAttr(node.path)}')">
          <span class="tree-indent" style="width: ${indentPx}px"></span>
          <span class="tree-toggle"></span>
          <span class="file-type-icon ${typeIcon.cls}">${escapeHtml(typeIcon.label)}</span>
          <span class="tree-status-inline">${statusBadge}</span>
          <span class="tree-name" title="${escapeAttr(node.name)}">${renderFileNameWithTailPriority(node.name)}</span>
          ${pinBtn}
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
      <div class="tree-item directory-node">
        <span class="tree-indent" style="width: ${indentPx}px"></span>
        <span class="tree-toggle" onclick="${hasChildren ? `event.stopPropagation();handleNodeClick('${escapeAttr(workspaceId)}', '${escapeAttr(node.path)}')` : ''}">${hasChildren ? toggle : ''}</span>
        <span class="tree-name" onclick="${hasChildren ? `event.stopPropagation();handleNodeClick('${escapeAttr(workspaceId)}', '${escapeAttr(node.path)}')` : ''}">${escapeHtml(node.name)}</span>
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

// 文件已从磁盘删除后，不会出现在扫描树里；这里保留一个特殊区块给重试/关闭操作。
function renderMissingOpenFiles(workspaceId: string, workspacePath: string, tree: FileTreeNode | undefined, query: string): string {
  const filePathsInTree = new Set<string>();
  collectTreeFilePaths(tree, filePathsInTree);

  const workspacePrefix = `${workspacePath}/`;
  const missingOpenedFiles = getSessionFiles().filter((file) => {
    if (!file.isMissing) return false;
    if (!file.path.startsWith(workspacePrefix)) return false;
    if (filePathsInTree.has(file.path)) return false;
    if (!query) return true;
    return file.name.toLowerCase().includes(query) || file.path.toLowerCase().includes(query);
  });

  const openedSet = new Set(missingOpenedFiles.map((file) => file.path));
  const missingPaths = getWorkspaceMissingPaths(workspacePath)
    .filter((path) => !openedSet.has(path))
    .filter((path) => !filePathsInTree.has(path))
    .filter((path) => {
      if (!query) return true;
      const lower = path.toLowerCase();
      const name = (path.split('/').pop() || '').toLowerCase();
      return lower.includes(query) || name.includes(query);
    });

  if (missingOpenedFiles.length === 0 && missingPaths.length === 0) {
    return '';
  }

  const missingRows = [
    ...missingOpenedFiles.map((file) => ({
      path: file.path,
      name: file.path.split('/').pop() || file.name,
      isCurrent: state.currentFile === file.path,
      hasRetry: true,
      hasClose: true,
    })),
    ...missingPaths.map((path) => ({
      path,
      name: path.split('/').pop() || path,
      isCurrent: state.currentFile === path,
      hasRetry: false,
      hasClose: false,
    }))
  ];

  return `
    <div class="tree-missing-section">
      <div class="tree-missing-title">已删除</div>
      ${missingRows.map((row) => {
        const typeIcon = getFileTypeIcon(row.path);
        return `
          <div class="tree-item file-node missing ${row.isCurrent ? 'current' : ''}" onclick="handleFileClick('${escapeAttr(row.path)}')">
            <span class="tree-indent" style="width: 12px"></span>
            <span class="tree-toggle"></span>
            <span class="file-type-icon ${typeIcon.cls}">${escapeHtml(typeIcon.label)}</span>
            <span class="tree-status-inline"><span class="status-badge status-deleted">D</span></span>
            <span class="tree-name" title="${escapeAttr(row.name)}">${renderFileNameWithTailPriority(row.name)}</span>
            ${row.hasRetry ? `<button class="tree-inline-action" title="重试加载" onclick="event.stopPropagation(); handleRetryMissingFile('${escapeAttr(row.path)}')">↻</button>` : ''}
            ${row.hasClose ? `<button class="tree-inline-action danger" title="关闭文件" onclick="event.stopPropagation(); handleCloseFile('${escapeAttr(row.path)}')">×</button>` : ''}
          </div>
        `;
      }).join('')}
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

  // 工作区展开/折叠
  (window as any).handleWorkspaceToggle = async (workspaceId: string) => {
    const workspace = state.config.workspaces.find(ws => ws.id === workspaceId);
    if (!workspace) return;

    state.currentWorkspace = workspaceId;
    if (state.searchQuery.trim()) {
      const { renderSidebar } = await import('./sidebar');
      renderSidebar();
      return;
    }
    toggleWorkspaceExpanded(workspaceId);

    // 如果展开且没有加载文件树，则加载
    if (workspace.isExpanded && !state.fileTree.has(workspaceId)) {
      loadingWorkspaceIds.add(workspaceId);
      failedWorkspaceIds.delete(workspaceId);
      const { renderSidebar } = await import('./sidebar');
      renderSidebar();

      const tree = await scanWorkspace(workspaceId);
      loadingWorkspaceIds.delete(workspaceId);
      if (!tree) {
        failedWorkspaceIds.add(workspaceId);
        showError(`工作区扫描失败：${workspace.name}`);
      } else {
        failedWorkspaceIds.delete(workspaceId);
      }
    }

    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };

  // 失败后点击空白提示可重试
  (window as any).retryWorkspaceScan = async (workspaceId: string) => {
    loadingWorkspaceIds.add(workspaceId);
    failedWorkspaceIds.delete(workspaceId);
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();

    const tree = await scanWorkspace(workspaceId);
    loadingWorkspaceIds.delete(workspaceId);
    if (!tree) {
      failedWorkspaceIds.add(workspaceId);
      showError('重试失败，请检查工作区路径是否可访问');
    }

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
    // 清除工作区修改标记（点击即视为已查看）
    clearWorkspaceModified(filePath);
    clearListDiff(filePath);

    const { loadFile } = await import('../api/files');

    // 如果文件未打开，先加载
    if (!hasSessionFile(filePath)) {
      const fileData = await loadFile(filePath, true);
      if (!fileData) {
        const { markFileMissing } = await import('../state');
        markFileMissing(filePath, true);
        const main = await import('../main');
        (main as any).renderAll();
        showError('文件已删除，已标记为 D（无本地缓存）');
        return;
      }
      const { addOrUpdateFile } = await import('../state');
      addOrUpdateFile(fileData, true);
      const main = await import('../main');
      (main as any).renderAll();
    } else {
      // 使用 switchFile（含脏文件自动刷新逻辑）
      (window as any).switchFile?.(filePath);
    }
  };

  // 关闭文件
  (window as any).handleCloseFile = async (filePath: string) => {
    const { removeFile } = await import('../state');
    removeFile(filePath);

    // 重新渲染
    const main = await import('../main');
    (main as any).renderAll();
  };

  // 重试加载已删除文件（例如文件恢复后）
  (window as any).handleRetryMissingFile = async (filePath: string) => {
    const { loadFile } = await import('../api/files');
    const { addOrUpdateFile } = await import('../state');
    const fileData = await loadFile(filePath);
    if (!fileData) return;

    addOrUpdateFile(fileData, state.currentFile === filePath);
    const main = await import('../main');
    (main as any).renderAll();
    showSuccess('文件已重新加载', 2000);
  };

  // 添加工作区对话框
  (window as any).showAddWorkspaceDialog = showAddWorkspaceDialog;
  (window as any).closeAddWorkspaceDialog = closeAddWorkspaceDialog;
  (window as any).confirmAddWorkspaceDialog = confirmAddWorkspaceDialog;

  (window as any).handleMoveWorkspaceUp = async (workspaceId: string) => {
    moveWorkspaceByOffset(workspaceId, -1);
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };

  (window as any).handleMoveWorkspaceDown = async (workspaceId: string) => {
    moveWorkspaceByOffset(workspaceId, 1);
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };

  (window as any).handleFocusFileClick = async (filePath: string) => {
    clearWorkspaceModified(filePath);
    clearListDiff(filePath);

    const { loadFile } = await import('../api/files');

    if (!hasSessionFile(filePath)) {
      const fileData = await loadFile(filePath, true);
      if (!fileData) {
        const { markFileMissing } = await import('../state');
        markFileMissing(filePath, true);
        const main = await import('../main');
        (main as any).renderAll();
        showError('文件已删除，已标记为 D（无本地缓存）');
        return;
      }
      const { addOrUpdateFile } = await import('../state');
      addOrUpdateFile(fileData, true);
      const main = await import('../main');
      (main as any).renderAll();
    } else {
      // 使用 switchFile（含脏文件自动刷新逻辑）
      (window as any).switchFile?.(filePath);
    }
  };

  (window as any).handleUnpinFile = async (path: string) => {
    const { unpinFile } = await import('../utils/pinned-files');
    unpinFile(path);
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };

  (window as any).handlePinFile = async (path: string) => {
    const { pinFile } = await import('../utils/pinned-files');
    pinFile(path);
    const { renderSidebar } = await import('./sidebar');
    renderSidebar();
  };

  (window as any).handleFocusWorkspaceToggle = (_id: string) => {
    // no-op: focus view groups auto-expand based on content
  };

  (window as any).setFocusWindowKey = (key: string) => {
    state.config.focusWindowKey = key as any;
    import('../config').then(({ saveConfig }) => saveConfig(state.config));
    import('./sidebar').then(({ renderSidebar }) => renderSidebar());
  };
}
