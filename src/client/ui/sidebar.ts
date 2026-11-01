import type { FileInfo } from '../types';
import { state, setSearchQuery, getFilteredFiles, saveState, moveTabOrder } from '../state';
import { hasListDiff } from '../workspace-state';
import { saveConfig } from '../config';
import { escapeAttr, escapeHtml } from '../utils/escape';
import { generateDistinctNames } from '../utils/file-names';
import { getFileListStatus } from '../utils/file-status';
import { isJsonFile, isJsonlFile } from '../utils/file-type';
import { renderFileRow } from './file-row';
import { tabsStore } from '../tabs/store';
import { isPinned } from '../utils/pinned-files';
import { getTabBatchTargets, type TabBatchAction } from '../utils/tab-batch';
import { renderWorkspaceSidebar, bindWorkspaceEvents, type WorkspaceCallbacks } from './sidebar-workspace';
import { syncAnnotationSidebarLayout } from '../annotation';
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

interface FileEntry { path: string; displayName: string; name: string; nameHint?: string; isMissing?: boolean; }

const DRAG_THRESHOLD = 4; // px，小于此移动距离视为 click，不启动拖拽
interface FileDragState {
  fromPath: string;
  insertIdx: number;
  ghost: HTMLElement;
  srcEl: HTMLElement;
  offsetX: number;
  offsetY: number;
}
let fileDragState: FileDragState | null = null;

export function resetSidebarFileAnchor(): void {
  hasAutoAnchoredCurrentFile = false;
}

// 将当前打开的文件滚动到侧边栏40%位置
function scrollCurrentFileIntoView(container: HTMLElement): void {
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

function bindFileDragEvents(fileListEl: HTMLElement): void {
  if ((fileListEl as any).__fileDragBound) return;
  (fileListEl as any).__fileDragBound = true;

  fileListEl.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    const item = (e.target as HTMLElement).closest('.file-item') as HTMLElement | null;
    if (!item) return;
    if ((e.target as HTMLElement).closest('.close, .tree-pin-btn')) return;

    const fromPath = item.dataset.path || '';
    if (!fromPath) return;
    const fromIdx = state.tabOrder.indexOf(fromPath);
    if (fromIdx < 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;
    let ghost: HTMLElement | null = null;

    const itemRect = item.getBoundingClientRect();
    const offsetX = e.clientX - itemRect.left;
    const offsetY = e.clientY - itemRect.top;

    function startDrag(): void {
      dragging = true;
      ghost = document.createElement('div');
      ghost.className = 'file-drag-ghost';
      ghost.textContent = item!.querySelector('.tree-name-full')?.textContent || fromPath.split('/').pop() || fromPath;
      ghost.style.width = itemRect.width + 'px';
      ghost.style.left  = itemRect.left + 'px';
      ghost.style.top   = itemRect.top  + 'px';
      document.body.appendChild(ghost);
      item!.classList.add('file-item-dragging');
      fileDragState = { fromPath, insertIdx: fromIdx, ghost, srcEl: item!, offsetX, offsetY };
    }

    function cleanup(): void {
      fileListEl.querySelectorAll<HTMLElement>('.file-item').forEach(el => { el.style.transform = ''; });
      if (ghost) { ghost.remove(); ghost = null; }
      item!.classList.remove('file-item-dragging');
      fileDragState = null;
    }

    function onMove(e: PointerEvent): void {
      if (!dragging) {
        if (Math.abs(e.clientX - startX) < DRAG_THRESHOLD && Math.abs(e.clientY - startY) < DRAG_THRESHOLD) return;
        e.preventDefault();
        startDrag();
      }
      if (!fileDragState || !ghost) return;
      const { srcEl } = fileDragState;

      ghost.style.left = (e.clientX - offsetX) + 'px';
      ghost.style.top  = (e.clientY - offsetY) + 'px';

      const mouseY = e.clientY;
      const itemEls = [...fileListEl.querySelectorAll<HTMLElement>('.file-item:not(.file-item-dragging)')];

      let newInsertIdx = fromIdx;
      let found = false;
      for (let i = 0; i < itemEls.length; i++) {
        const r = itemEls[i].getBoundingClientRect();
        if (mouseY < r.bottom) {
          const itemPath = itemEls[i].dataset.path || '';
          const origIdx = state.tabOrder.indexOf(itemPath);
          if (origIdx < 0) continue;
          newInsertIdx = mouseY < r.top + r.height / 2 ? origIdx : origIdx + 1;
          if (origIdx >= fromIdx) newInsertIdx -= 1;
          found = true;
          break;
        }
      }
      if (!found) newInsertIdx = state.tabOrder.length - 1;

      fileDragState.insertIdx = newInsertIdx;

      const allItemEls = [...fileListEl.querySelectorAll<HTMLElement>('.file-item')];
      const ghostH = ghost.offsetHeight;
      allItemEls.forEach((el, i) => {
        if (el === srcEl) return;
        let dy = 0;
        if (newInsertIdx < fromIdx) {
          if (i >= newInsertIdx && i < fromIdx) dy = ghostH;
        } else {
          if (i > fromIdx && i <= newInsertIdx) dy = -ghostH;
        }
        el.style.transform = dy !== 0 ? `translateY(${dy}px)` : '';
      });
    }

    function onUp(): void {
      item!.removeEventListener('pointermove', onMove);
      item!.removeEventListener('pointerup', onUp);
      item!.removeEventListener('pointercancel', onCancel);

      if (!dragging) return;

      const insertIdx = fileDragState?.insertIdx ?? fromIdx;
      cleanup();
      if (fromIdx >= 0 && fromIdx !== insertIdx) moveTabOrder(fromIdx, insertIdx);
      renderTabs();
      renderFiles();
    }

    function onCancel(): void {
      item!.removeEventListener('pointermove', onMove);
      item!.removeEventListener('pointerup', onUp);
      item!.removeEventListener('pointercancel', onCancel);
      if (dragging) cleanup();
    }

    item.setPointerCapture(e.pointerId);
    item.addEventListener('pointermove', onMove);
    item.addEventListener('pointerup', onUp);
    item.addEventListener('pointercancel', onCancel);
  });
}

// 渲染文件列表
export function renderFiles(): void {
  const container = document.getElementById('fileList');
  if (!container) return;

  if (state.sessionFiles.size === 0) {
    container.innerHTML = '<div class="empty-tip">点击上方添加 Markdown/HTML 文件</div>';
    return;
  }

  // 使用过滤后的文件列表
  const filteredFiles = getFilteredFiles();

  if (filteredFiles.length === 0) {
    container.innerHTML = '<div class="empty-tip">未找到匹配的文件</div>';
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
  const filesWithDisplay = generateDistinctNames(orderedMap);

  container.innerHTML = filesWithDisplay.map(file => {
    return renderFileRow(file.path, file.name, undefined, {
      containerClass: 'file-item',
      nameHint: file.nameHint,
      onClickAction: 'switch-file',
      showPin: true,
      showTime: false,
      indentPx: 0,
      query: state.searchQuery.toLowerCase().trim(),
      showClose: true,
    });
  }).join('');

  bindFileDragEvents(container);
  // 滚动当前文件到侧边栏40%位置
  scrollCurrentFileIntoView(container);
}

// 渲染整个侧边栏（根据模式选择）
export function renderSidebar(): void {
  const tab = state.config.sidebarTab;
  const container = document.querySelector('.sidebar') as HTMLElement | null;
  if (container) {
    container.classList.toggle('workspace-mode', tab === 'focus' || tab === 'full');
  }

  sidebarHeaderStore.setSnapshot({ tab, query: state.searchQuery });

  if (tab === 'list') {
    const listEl = document.getElementById('fileList');
    if (listEl) listEl.className = 'file-list';
    renderFiles();
    renderTabs();
    return;
  }

  // focus or full — workspace rendering
  if (!container) return;

  let fileListContainer = document.getElementById('fileList');
  if (!fileListContainer) {
    fileListContainer = document.createElement('div');
    fileListContainer.id = 'fileList';
    container.appendChild(fileListContainer);
  }
  fileListContainer.className = 'file-list';

  fileListContainer.innerHTML = renderWorkspaceSidebar();
  bindWorkspaceEvents(workspaceCallbacks ?? undefined);
  scrollCurrentFileIntoView(fileListContainer);

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
