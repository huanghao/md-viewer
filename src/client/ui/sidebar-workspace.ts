import type { Workspace, FileTreeNode } from '../types';
import { compareFileNames } from '../utils/file-sort';
import {
  state,
  getSessionFiles,
  hasSessionFile,
  markWorkspaceLoading,
  markWorkspaceFailed,
  clearWorkspaceFailed,
  isWorkspaceLoading,
  isWorkspaceFailed,
} from '../state';
import { getWorkspaceMissingPaths } from '../workspace-state';
import { searchFiles } from '../api/files';
import { showError, showSuccess } from './toast';
import {
  removeWorkspace,
  moveWorkspaceByOffset,
  toggleWorkspaceExpanded,
  toggleNodeExpanded,
  scanWorkspace,
} from '../workspace';
import { clearListDiff, clearWorkspaceModified } from '../workspace-state';
import { duplicateNameHints } from '../utils/file-names';
import { fuzzyMatch } from '../utils/fuzzy-search';


let pendingRemoveWorkspaceId: string | null = null;
let removeOutsideClickBound = false;

let workspaceSearchQuery = '';
let workspaceSearchRootsKey = '';
let workspaceSearchLoading = false;
let workspaceSearchLoaded = false;
let workspaceSearchPaths = new Set<string>();
let workspaceSearchSeq = 0;

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


function sortTreeChildren(node: FileTreeNode): void {
  if (!node.children) return;
  node.children.sort((a, b) => {
    const aDir = a.type === 'directory' ? 0 : 1;
    const bDir = b.type === 'directory' ? 0 : 1;
    if (aDir !== bDir) return aDir - bDir;
    return compareFileNames(a.name, b.name);
  });
  for (const child of node.children) sortTreeChildren(child);
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

  const dedupedPaths = Array.from(new Set(filePaths));
  for (const fullPath of dedupedPaths) {
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
  sortTreeChildren(root);
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

  redrawSidebar();
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

export interface MissingRowModel {
  path: string;
  name: string;
  nameHint?: string;
  isCurrent: boolean;
  hasRetry: boolean;
  hasClose: boolean;
}

export type WorkspaceTreeStatus =
  | { kind: 'searching' }
  | { kind: 'loading' }
  | { kind: 'failed' }
  | { kind: 'unavailable'; query: boolean }
  | { kind: 'empty'; query: boolean }
  | { kind: 'ready'; tree: FileTreeNode };

export interface WorkspaceViewModel {
  workspace: Workspace;
  isCurrent: boolean;
  isFailed: boolean;
  expanded: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** 折叠时为 null，不计算树状态 */
  treeStatus: WorkspaceTreeStatus | null;
  missingRows: MissingRowModel[];
}

// 文件已从磁盘删除后，不会出现在扫描树里；这里保留一个特殊区块给重试/关闭操作。
function getMissingOpenFileRows(workspacePath: string, tree: FileTreeNode | undefined, query: string): MissingRowModel[] {
  const filePathsInTree = new Set<string>();
  collectTreeFilePaths(tree, filePathsInTree);

  const workspacePrefix = `${workspacePath}/`;
  const missingOpenedFiles = getSessionFiles().filter((file) => {
    if (!file.isMissing) return false;
    if (!file.path.startsWith(workspacePrefix)) return false;
    if (filePathsInTree.has(file.path)) return false;
    if (!query) return true;
    return !!fuzzyMatch(file.name, query) || !!fuzzyMatch(file.path, query);
  });

  const openedSet = new Set(missingOpenedFiles.map((file) => file.path));
  const missingPaths = getWorkspaceMissingPaths(workspacePath)
    .filter((path) => !openedSet.has(path))
    .filter((path) => !filePathsInTree.has(path))
    .filter((path) => {
      if (!query) return true;
      const name = path.split('/').pop() || '';
      return !!fuzzyMatch(name, query) || !!fuzzyMatch(path, query);
    });

  const rows: Array<Omit<MissingRowModel, 'nameHint'>> = [
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
    })),
  ];

  const hints = duplicateNameHints(rows.map((row) => row.path));
  return rows.map((row) => ({ ...row, nameHint: hints.get(row.path) }));
}

function getTreeStatus(workspaceId: string, tree: FileTreeNode | undefined, query: string): WorkspaceTreeStatus {
  if (query && workspaceSearchLoading && workspaceSearchQuery === query) return { kind: 'searching' };
  if (isWorkspaceLoading(workspaceId)) return { kind: 'loading' };
  if (isWorkspaceFailed(workspaceId)) return { kind: 'failed' };
  if (!tree) return { kind: 'unavailable', query: !!query };
  if (!tree.children || tree.children.length === 0) return { kind: 'empty', query: !!query };
  return { kind: 'ready', tree };
}

function buildWorkspaceViewModel(
  workspace: Workspace,
  index: number,
  total: number,
  query: string,
): WorkspaceViewModel | null {
  const tree: FileTreeNode | undefined = query ? buildSearchTree(workspace, query) : state.fileTree.get(workspace.id);
  const expanded = query ? true : workspace.isExpanded;
  const workspaceMatched = !query || !!fuzzyMatch(workspace.name, query) || !!fuzzyMatch(workspace.path, query);
  const hasTreeMatch = !!tree && !!tree.children && tree.children.length > 0;
  const missingRows = expanded ? getMissingOpenFileRows(workspace.path, tree, query) : [];

  if (query && !workspaceMatched && !hasTreeMatch && missingRows.length === 0) return null;

  return {
    workspace,
    isCurrent: state.currentWorkspace === workspace.id,
    isFailed: isWorkspaceFailed(workspace.id),
    expanded,
    canMoveUp: index > 0,
    canMoveDown: index < total - 1,
    treeStatus: expanded ? getTreeStatus(workspace.id, tree, query) : null,
    missingRows,
  };
}

/** 工作区模式的全部视图数据；搜索结果的异步加载由 prepareWorkspaceTree 负责，这里保持纯计算 */
export function buildWorkspaceViewModels(query: string): WorkspaceViewModel[] {
  const workspaces = state.config.workspaces;
  return workspaces.flatMap((ws, index) => {
    const vm = buildWorkspaceViewModel(ws, index, workspaces.length, query);
    return vm ? [vm] : [];
  });
}

/** 渲染前调用：按当前搜索词启动工作区搜索（异步，完成后会自行重绘侧边栏） */
export function prepareWorkspaceTree(): void {
  ensureWorkspaceSearchResults(state.searchQuery.trim().toLowerCase());
}

// 绑定工作区模式事件
export interface WorkspaceCallbacks {
  switchFile: (path: string) => void;
  loadAndSwitchFile: (path: string) => Promise<void>;
  /** 全量重绘（侧栏 + 正文 + 批注）；由组合根注入，避免 UI 模块导入入口 main.ts */
  renderAll: () => void;
  /** 侧栏重绘；由组合根注入，避免与 ui/sidebar.ts 形成循环依赖 */
  renderSidebar: () => void;
}

let _workspaceCallbacks: WorkspaceCallbacks | undefined;

function redrawSidebar(): void {
  _workspaceCallbacks?.renderSidebar();
}
let _delegateBound = false;

async function handleWorkspaceToggle(workspaceId: string): Promise<void> {
  const workspace = state.config.workspaces.find(ws => ws.id === workspaceId);
  if (!workspace) return;

  state.currentWorkspace = workspaceId;
  if (state.searchQuery.trim()) {
    redrawSidebar();
    return;
  }
  toggleWorkspaceExpanded(workspaceId);

  // 如果展开且没有加载文件树，则加载
  if (workspace.isExpanded && !state.fileTree.has(workspaceId)) {
    markWorkspaceLoading(workspaceId);
    redrawSidebar();

    const tree = await scanWorkspace(workspaceId);
    if (!tree) {
      markWorkspaceFailed(workspaceId);
      showError(`工作区扫描失败：${workspace.name}`);
    } else {
      clearWorkspaceFailed(workspaceId);
    }
  }

  redrawSidebar();
}

async function retryWorkspaceScan(workspaceId: string): Promise<void> {
  markWorkspaceLoading(workspaceId);
  redrawSidebar();

  const tree = await scanWorkspace(workspaceId);
  if (!tree) {
    markWorkspaceFailed(workspaceId);
    showError('重试失败，请检查工作区路径是否可访问');
  } else {
    clearWorkspaceFailed(workspaceId);
  }

  redrawSidebar();
}

async function handleAskRemoveWorkspace(workspaceId: string): Promise<void> {
  pendingRemoveWorkspaceId = workspaceId;
  redrawSidebar();
}

async function handleConfirmRemoveWorkspace(workspaceId: string): Promise<void> {
  const workspace = state.config.workspaces.find(ws => ws.id === workspaceId);
  if (!workspace) return;

  removeWorkspace(workspaceId);
  pendingRemoveWorkspaceId = null;

  redrawSidebar();
  showSuccess(`已移除工作区: ${workspace.name}`);
}

async function handleNodeClick(workspaceId: string, nodePath: string): Promise<void> {
  toggleNodeExpanded(workspaceId, nodePath);

  redrawSidebar();
}

async function handleFileClick(filePath: string): Promise<void> {
  clearWorkspaceModified(filePath);
  clearListDiff(filePath);
  if (!hasSessionFile(filePath)) {
    if (_workspaceCallbacks) {
      await _workspaceCallbacks.loadAndSwitchFile(filePath);
    }
  } else {
    _workspaceCallbacks?.switchFile(filePath);
  }
}

async function handleCloseFile(filePath: string): Promise<void> {
  const { removeFile } = await import('../state');
  removeFile(filePath);
  _workspaceCallbacks?.renderAll();
}

async function handleRetryMissingFile(filePath: string): Promise<void> {
  const { loadFile } = await import('../api/files');
  const { addOrUpdateFile } = await import('../state');
  const fileData = await loadFile(filePath);
  if (!fileData) return;

  addOrUpdateFile(fileData, state.currentFile === filePath);
  _workspaceCallbacks?.renderAll();
  showSuccess('文件已重新加载');
}

async function handleMoveWorkspaceUp(workspaceId: string): Promise<void> {
  moveWorkspaceByOffset(workspaceId, -1);
  redrawSidebar();
}

async function handleMoveWorkspaceDown(workspaceId: string): Promise<void> {
  moveWorkspaceByOffset(workspaceId, 1);
  redrawSidebar();
}

async function handleFocusFileClick(filePath: string): Promise<void> {
  clearWorkspaceModified(filePath);
  clearListDiff(filePath);
  if (!hasSessionFile(filePath)) {
    if (_workspaceCallbacks) {
      await _workspaceCallbacks.loadAndSwitchFile(filePath);
    }
  } else {
    _workspaceCallbacks?.switchFile(filePath);
  }
}

async function handleUnpinFile(path: string): Promise<void> {
  const { unpinFile } = await import('../utils/pinned-files');
  unpinFile(path);
  redrawSidebar();
}

async function handlePinFile(path: string): Promise<void> {
  const { pinFile } = await import('../utils/pinned-files');
  pinFile(path);
  redrawSidebar();
}

/** 工作区树渲染读取：当前处于“再次点击确认移除”状态的工作区 */
export function getPendingRemoveWorkspaceId(): string | null {
  return pendingRemoveWorkspaceId;
}

export function bindWorkspaceEvents(callbacks?: WorkspaceCallbacks): void {
  if (callbacks) _workspaceCallbacks = callbacks;

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
      redrawSidebar();
    });
  }

  if (!_delegateBound) {
    _delegateBound = true;
    document.addEventListener('click', async (e) => {
      const el = (e.target as Element).closest('[data-action]') as HTMLElement | null;
      if (!el) return;

      // Stop propagation for items inside workspace-remove-actions
      if ((e.target as Element).closest('[data-stop-propagation]')) {
        e.stopPropagation();
      }

      const { action, workspaceId, path, nodePath } = el.dataset;

      switch (action) {
        case 'workspace-toggle':
          if (workspaceId) await handleWorkspaceToggle(workspaceId);
          break;
        case 'retry-workspace-scan':
          if (workspaceId) await retryWorkspaceScan(workspaceId);
          break;
        case 'workspace-ask-remove':
          e.stopPropagation();
          if (workspaceId) await handleAskRemoveWorkspace(workspaceId);
          break;
        case 'workspace-confirm-remove':
          if (workspaceId) await handleConfirmRemoveWorkspace(workspaceId);
          break;
        case 'node-click':
          e.stopPropagation();
          if (workspaceId && nodePath) await handleNodeClick(workspaceId, nodePath);
          break;
        case 'file-click':
          if (path) await handleFileClick(path);
          break;
        case 'close-file':
          e.stopPropagation();
          if (path) await handleCloseFile(path);
          break;
        case 'retry-missing-file':
          e.stopPropagation();
          if (path) await handleRetryMissingFile(path);
          break;
        case 'workspace-move-up':
          if (workspaceId) await handleMoveWorkspaceUp(workspaceId);
          break;
        case 'workspace-move-down':
          if (workspaceId) await handleMoveWorkspaceDown(workspaceId);
          break;
        case 'workspace-open-in-editor':
          e.stopPropagation();
          if (path) {
            fetch('/api/open-in-editor', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ path }),
            }).catch((err) => console.error('打开目录失败:', err));
          }
          break;
        case 'focus-file-click':
          if (path) await handleFocusFileClick(path);
          break;
        case 'unpin-file':
          e.stopPropagation();
          if (path) await handleUnpinFile(path);
          break;
        case 'pin-file':
          e.stopPropagation();
          if (path) await handlePinFile(path);
          break;
        // Note: focus-workspace-toggle and set-focus-window-key are handled by workspace-focus.ts
      }
    });
  }
}
