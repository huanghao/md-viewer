import type { FileInfo } from '../types';
import { state, setSearchQuery, getFilteredFiles } from '../state';
import { hasListDiff } from '../workspace-state';
import { saveConfig } from '../config';
import { generateDistinctNames } from '../utils/file-names';
import { getFileListStatus } from '../utils/file-status';
import { isJsonFile, isJsonlFile } from '../utils/file-type';
import { buildFileListRow } from '../file-list/model';
import { fileListStore } from '../file-list/store';
import { tabsStore } from '../tabs/store';
import { isPinned } from '../utils/pinned-files';
import { getTabBatchTargets, type TabBatchAction } from '../utils/tab-batch';
import { bindWorkspaceEvents, prepareWorkspaceTree, type WorkspaceCallbacks } from './sidebar-workspace';
import { prepareFocusView } from './workspace-focus';
import { workspaceTreeStore } from '../workspace-tree/store';
import { focusViewStore } from '../focus-view/store';
import { sidebarHeaderStore } from '../sidebar/store';

let hasAutoAnchoredCurrentFile = false;

export interface SearchBoxCallbacks {
  renderContent: () => void;
}

let searchBoxCallbacks: SearchBoxCallbacks | null = null;

export function initSearchBoxCallbacks(callbacks: SearchBoxCallbacks): void {
  searchBoxCallbacks = callbacks;
}

export interface FileListCallbacks {
  switchFile: (path: string) => void;
  removeFile: (path: string) => void;
}

let fileListCallbacks: FileListCallbacks | null = null;
let workspaceCallbacks: WorkspaceCallbacks | null = null;

export function initWorkspaceActions(callbacks: WorkspaceCallbacks): void {
  workspaceCallbacks = callbacks;
}

export function initFileListActions(callbacks: FileListCallbacks): void {
  fileListCallbacks = callbacks;
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;
  sidebar.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const actionEl = target.closest('[data-action]') as HTMLElement | null;
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'remove-file') {
      e.stopPropagation();
      const path = actionEl.dataset.path;
      if (path) fileListCallbacks?.removeFile(path);
    } else if (action === 'switch-file') {
      const path = actionEl.dataset.path;
      if (path) fileListCallbacks?.switchFile(path);
    }
  });
}

export function resetSidebarFileAnchor(): void {
  hasAutoAnchoredCurrentFile = false;
}

// 将当前打开的文件滚动到侧边栏40%位置
export function scrollCurrentFileIntoView(container: HTMLElement): void {
  if (!state.currentFile) return;
  if (hasAutoAnchoredCurrentFile) return;

  requestAnimationFrame(() => {
    const currentItem = container.querySelector('.file-item.current, .tree-item.current') as HTMLElement;
    if (!currentItem) return;
    currentItem.scrollIntoView({ block: 'nearest' });
    hasAutoAnchoredCurrentFile = true;
  });
}

export function setSidebarTab(tab: 'focus' | 'full' | 'list'): void {
  state.config.sidebarTab = tab;
  saveConfig(state.config);
  if (tab === 'focus') {
    import('./workspace-focus').then(({ refreshFrecencySignals, refreshFocusWorkspaces }) => {
      refreshFocusWorkspaces(true);
      void refreshFrecencySignals().then(() => renderSidebar());
    });
  } else if (tab === 'full' && state.currentFile) {
    // 切换到工作区视图时，自动展开并定位当前文件
    import('../workspace').then(({ revealFileInWorkspace }) => {
      void revealFileInWorkspace(state.currentFile!).then(() => {
        hasAutoAnchoredCurrentFile = false;
        renderSidebar();
      });
    });
  } else {
    renderSidebar();
  }
}


export function applyTabBatchAction(action: TabBatchAction, removeFile: (path: string) => void): void {
  const filesWithDisplay = generateDistinctNames(state.sessionFiles);
  const targets = getTabBatchTargets(
    action,
    filesWithDisplay,
    state.currentFile,
    (path) => {
      const file = filesWithDisplay.find((f) => f.path === path);
      if (!file) return false;
      const status = getFileListStatus(file, hasListDiff(file.path));
      return status.type === 'normal' || status.type === 'new';
    }
  );
  const closeable = targets.filter((path) => !isPinned(path));
  if (closeable.length === 0) {
    renderTabs();
    return;
  }
  closeable.forEach((path) => removeFile(path));
}

function rerenderByMode(): void {
  if (state.config.sidebarTab === 'focus' || state.config.sidebarTab === 'full') {
    renderSidebar();
    return;
  }
  renderFiles();
}

/** 统一搜索框的输入、清空、双击 Esc 都走这里：更新全局搜索词并重绘当前视图 */
export function setSidebarSearchQuery(query: string): void {
  setSearchQuery(query);
  sidebarHeaderStore.setSnapshot({ tab: state.config.sidebarTab, query });
  rerenderByMode();
  if (state.currentFile && (isJsonFile(state.currentFile) || isJsonlFile(state.currentFile))) {
    searchBoxCallbacks?.renderContent();
  }
}

// 渲染文件列表
export function renderFiles(): void {
  // 文件列表由 React 渲染（file-list/），这里只计算快照
  if (state.sessionFiles.size === 0) {
    fileListStore.setSnapshot({ rows: [], empty: '点击上方添加 Markdown/HTML 文件' });
    return;
  }

  const filteredFiles = getFilteredFiles();
  if (filteredFiles.length === 0) {
    fileListStore.setSnapshot({ rows: [], empty: '未找到匹配的文件' });
    return;
  }

  // 按 tabOrder 排序（过滤掉不在 filteredFiles 中的）
  const filteredPaths = new Set(filteredFiles.map(f => f.path));
  const orderedPaths = state.tabOrder.filter(p => filteredPaths.has(p));
  // 如果有不在 tabOrder 中的（理论上不应发生），追加到末尾
  for (const f of filteredFiles) {
    if (!orderedPaths.includes(f.path)) orderedPaths.push(f.path);
  }

  const orderedMap = new Map(orderedPaths.map(p => [p, state.sessionFiles.get(p)!]));
  const query = state.searchQuery.toLowerCase().trim();
  const rows = generateDistinctNames(orderedMap).map(file => buildFileListRow(file, query));
  fileListStore.setSnapshot({ rows, empty: null });
}

// 渲染整个侧边栏（根据模式选择）
export function renderSidebar(): void {
  const tab = state.config.sidebarTab;
  const container = document.querySelector('.sidebar') as HTMLElement | null;
  if (container) {
    container.classList.toggle('workspace-mode', tab === 'focus' || tab === 'full');
  }

  sidebarHeaderStore.setSnapshot({ tab, query: state.searchQuery });

  // 三种视图共用 #fileList 滚动容器，各自的内容容器按当前 tab 二选一显示
  const openEl = document.getElementById('openFileList');
  const workspaceEl = document.getElementById('workspaceList');
  const focusEl = document.getElementById('focusList');
  if (openEl) openEl.hidden = tab !== 'list';
  if (workspaceEl) workspaceEl.hidden = tab !== 'full';
  if (focusEl) focusEl.hidden = tab !== 'focus';

  if (tab === 'list') {
    renderFiles();
    renderTabs();
    return;
  }

  bindWorkspaceEvents(workspaceCallbacks ?? undefined);
  if (tab === 'full') {
    // 先按搜索词启动工作区搜索（异步），再交给 React 工作区树重绘
    prepareWorkspaceTree();
    workspaceTreeStore.notify();
  } else {
    prepareFocusView();
    focusViewStore.notify();
  }

  // 渲染标签页（两种模式都有）
  renderTabs();
}

// 渲染标签页
export function renderTabs(): void {
  const allFiles = Array.from(state.sessionFiles.values());
  if (allFiles.length === 0) {
    tabsStore.setSnapshot({ files: [], currentPath: null, batch: { others: 0, right: 0, unmodified: 0, all: 0 } });
    return;
  }

  // 按 tabOrder 排序
  const orderedFiles = state.tabOrder
    .map(p => state.sessionFiles.get(p))
    .filter((f): f is FileInfo => !!f);
  const filesWithDisplay = generateDistinctNames(new Map(orderedFiles.map(f => [f.path, f])));

  const countBatch = (action: TabBatchAction, filter: (path: string) => boolean) =>
    getTabBatchTargets(action, filesWithDisplay, state.currentFile, filter).length;
  const isUnmodified = (path: string) => {
    const file = filesWithDisplay.find((f) => f.path === path);
    if (!file) return false;
    const status = getFileListStatus(file, hasListDiff(file.path));
    return status.type === 'normal' || status.type === 'new';
  };

  tabsStore.setSnapshot({
    files: filesWithDisplay.map((f) => ({ path: f.path, name: f.name, nameHint: f.nameHint, isMissing: !!f.isMissing })),
    currentPath: state.currentFile,
    batch: {
      others: countBatch('close-others', () => false),
      right: countBatch('close-right', () => false),
      unmodified: countBatch('close-unmodified', isUnmodified),
      all: countBatch('close-all', () => false),
    },
  });
}
