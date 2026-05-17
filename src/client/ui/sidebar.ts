import type { FileInfo } from '../types';
import { state, setSearchQuery, getFilteredFiles, saveState, moveTabOrder } from '../state';
import { hasListDiff } from '../workspace-state';
import { saveConfig } from '../config';
import { escapeAttr, escapeHtml } from '../utils/escape';
import { generateDistinctNames } from '../utils/file-names';
import { getFileListStatus } from '../utils/file-status';
import { isJsonFile, isJsonlFile } from '../utils/file-type';
import { renderFileRow } from './file-row';
import { isPinned } from '../utils/pinned-files';
import { getTabBatchTargets, type TabBatchAction } from '../utils/tab-batch';
import { renderWorkspaceSidebar, bindWorkspaceEvents, type WorkspaceCallbacks } from './sidebar-workspace';
import { syncAnnotationSidebarLayout } from '../annotation';

let lastEscAt = 0;
let lastEscValue = '';
let hasAutoAnchoredCurrentFile = false;
let tabManagerOpen = false;
let tabManagerGlobalBound = false;
let tabsScrollLeft = 0;
let tabsScrollHandlerBound = false;
let lastTabsRenderKey = '';

export interface SearchBoxCallbacks {
  handleUnifiedInputSubmit: (value?: string) => void;
  dismissQuickActionConfirm: () => void;
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

export interface TabsCallbacks {
  switchFile: (path: string) => void;
  removeFile: (path: string) => void;
  applyTabBatchAction: (action: string) => void;
  toggleTabManager: () => void;
}

let tabsCallbacks: TabsCallbacks | null = null;

export function initTabsActions(container: HTMLElement, callbacks: TabsCallbacks): void {
  tabsCallbacks = callbacks;
  container.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const actionEl = target.closest('[data-action]') as HTMLElement | null;
    if (!actionEl) return;
    const action = actionEl.dataset.action;
    if (action === 'remove-file') {
      e.stopPropagation();
      const path = actionEl.dataset.path;
      if (path) tabsCallbacks?.removeFile(path);
    } else if (action === 'switch-file') {
      const path = actionEl.dataset.path;
      if (path) tabsCallbacks?.switchFile(path);
    } else if (action === 'toggle-tab-manager') {
      e.stopPropagation();
      tabsCallbacks?.toggleTabManager();
    } else if (action === 'batch-action') {
      const batch = actionEl.dataset.batch;
      if (batch) tabsCallbacks?.applyTabBatchAction(batch);
    }
  });
}

interface BatchCount { others: number; right: number; unmodified: number; all: number; }
interface FileEntry { path: string; displayName: string; name: string; isMissing?: boolean; }

export function renderTabsHTML(
  filesWithDisplay: FileEntry[],
  currentFile: string | null,
  tabManagerIsOpen: boolean,
  batchCount: BatchCount,
): string {
  const tabsHtml = filesWithDisplay.map((file, index) => {
    const isCurrent = file.path === currentFile;
    const classes = ['tab'];
    if (isCurrent) classes.push('active');
    if (file.isMissing) classes.push('deleted');
    return `
      <div class="${classes.join(' ')}" data-index="${index}" data-path="${escapeAttr(file.path)}"
           data-action="switch-file">
        <span class="tab-name">${escapeHtml(file.displayName)}</span>
        <span class="tab-close" data-action="remove-file" data-path="${escapeAttr(file.path)}">×</span>
      </div>
    `;
  }).join('');

  return `
    <div class="tabs-scroll">${tabsHtml}</div>
    <div class="tab-manager-wrap">
      <button class="tab-manager-toggle ${tabManagerIsOpen ? 'active' : ''}" type="button"
              data-action="toggle-tab-manager">≡ Tabs (${filesWithDisplay.length})</button>
      <div class="tab-manager-panel ${tabManagerIsOpen ? 'show' : ''}"
        <div class="tab-manager-row tab-manager-actions-row">
          <button class="tab-manager-action" type="button" data-action="batch-action" data-batch="close-others">关闭其他 (${batchCount.others})</button>
          <button class="tab-manager-action" type="button" data-action="batch-action" data-batch="close-right">关闭右侧 (${batchCount.right})</button>
          <button class="tab-manager-action" type="button" data-action="batch-action" data-batch="close-unmodified">关闭未修改 (${batchCount.unmodified})</button>
          <button class="tab-manager-action danger" type="button" data-action="batch-action" data-batch="close-all">关闭全部 (${batchCount.all})</button>
        </div>
      </div>
    </div>
  `;
}
interface TabDragState {
  fromIdx: number;
  insertIdx: number;
  ghost: HTMLElement;
  srcEl: HTMLElement;
  offsetX: number;
  offsetY: number;
}
interface FileDragState {
  fromPath: string;
  insertIdx: number;
  ghost: HTMLElement;
  srcEl: HTMLElement;
  offsetX: number;
  offsetY: number;
}
let tabDragState: TabDragState | null = null;
let fileDragState: FileDragState | null = null;
import { attachPathAutocomplete } from './path-autocomplete';
import { renderRagSearchPanel } from './rag-search-panel';

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

export function setSidebarTab(tab: 'focus' | 'full' | 'list' | 'search'): void {
  state.config.sidebarTab = tab;
  saveConfig(state.config);
  if (tab === 'focus') {
    import('./workspace-focus').then(({ refreshFrecencySignals, renderFocusView: _ }) => {
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

if (typeof window !== 'undefined') {
  document.addEventListener('sidebar:set-tab', (e) => {
    setSidebarTab((e as CustomEvent<{ tab: string }>).detail.tab as Parameters<typeof setSidebarTab>[0]);
  });
  document.addEventListener('click', (ev: MouseEvent) => {
    const el = (ev.target as Element).closest('[data-action]') as HTMLElement | null;
    if (!el) return;
    if (el.dataset.action === 'set-sidebar-tab') {
      const tab = el.dataset.tab;
      if (tab) setSidebarTab(tab as Parameters<typeof setSidebarTab>[0]);
    }
  });
}

export function toggleTabManager(): void {
  tabManagerOpen = !tabManagerOpen;
  renderTabs();
}

function closeTabManager(): void {
  if (!tabManagerOpen) return;
  tabManagerOpen = false;
  renderTabs();
}

function ensureTabManagerGlobalEvents(): void {
  if (tabManagerGlobalBound) return;
  tabManagerGlobalBound = true;
  document.addEventListener('click', (event) => {
    if (!tabManagerOpen) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('.tab-manager-wrap')) return;
    closeTabManager();
  });
}

function ensureTabsScrollHandler(): void {
  if (tabsScrollHandlerBound) return;
  tabsScrollHandlerBound = true;

  const container = document.getElementById('tabs');
  if (!container) return;

  // 使用事件委托，只绑定一次
  container.addEventListener('scroll', (event) => {
    const target = event.target as HTMLElement;
    if (target.classList.contains('tabs-scroll')) {
      tabsScrollLeft = target.scrollLeft;
    }
  }, { passive: true, capture: true });
}

export function applyTabBatchAction(action: TabBatchAction): void {
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
  if (!tabsCallbacks || closeable.length === 0) {
    renderTabs();
    return;
  }
  closeable.forEach((path) => tabsCallbacks!.removeFile(path));
}

function rerenderByMode(): void {
  if (state.config.sidebarTab === 'focus' || state.config.sidebarTab === 'full') {
    renderSidebar();
    return;
  }
  renderFiles();
}

function looksLikePathInput(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('/') || v.startsWith('~/') || v.startsWith('./') || v.startsWith('../')) return true;
  if (v.includes('/') || v.includes('\\')) return true;
  if (/\.[a-zA-Z0-9]{1,10}$/.test(v)) return true;
  return false;
}

// 渲染搜索框
export function renderSearchBox(): void {
  const container = document.getElementById('searchBox');
  if (!container) return;

  let input = container.querySelector('#searchInput') as HTMLInputElement | null;
  let clearBtn = container.querySelector('#searchClear') as HTMLButtonElement | null;

  const tab = state.config.sidebarTab;
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const kKey = isMac ? '⌘K' : 'Ctrl+K';
  const placeholder = tab === 'list'
    ? `搜索已打开的文件 (${kKey})`
    : tab === 'focus'
    ? `搜索最近文件 (${kKey})`
    : '搜索或输入路径（Enter补全，Cmd/Ctrl+Enter添加）';

  if (!input || !clearBtn) {
    container.innerHTML = `
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="search-input"
          placeholder="${placeholder}"
          id="searchInput"
        />
        <button class="search-clear" id="searchClear">×</button>
      </div>
    `;

    input = container.querySelector('#searchInput') as HTMLInputElement | null;
    clearBtn = container.querySelector('#searchClear') as HTMLButtonElement | null;
    if (!input || !clearBtn) return;

    // 路径补全仅在“像路径”的输入下触发，避免干扰普通搜索
    attachPathAutocomplete(input, {
      kind: 'file',
      markdownOnly: false,
      shouldActivate: looksLikePathInput
    });

    input.addEventListener('input', (e) => {
      searchBoxCallbacks?.dismissQuickActionConfirm();
      const query = (e.target as HTMLInputElement).value;
      lastEscAt = 0;
      lastEscValue = '';
      setSearchQuery(query);
      if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
      }
      rerenderByMode();
      // If current file is JSON, re-render with new query
      if (state.currentFile && (isJsonFile(state.currentFile) || isJsonlFile(state.currentFile))) {
        searchBoxCallbacks?.renderContent();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        input!.dispatchEvent(new Event('path-autocomplete-hide'));
        searchBoxCallbacks?.handleUnifiedInputSubmit(input!.value);
        return;
      }
      if (e.defaultPrevented) {
        // 自动补全面板已消费 Enter/Tab/Escape，不再触发统一提交逻辑
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        input!.dispatchEvent(new Event('path-autocomplete-hide'));
        searchBoxCallbacks?.handleUnifiedInputSubmit(input!.value);
      }
      if (e.key === 'Escape') {
        searchBoxCallbacks?.dismissQuickActionConfirm();
        const now = Date.now();
        const currentValue = input!.value;
        const isDoubleEsc = now - lastEscAt < 900 && lastEscValue === currentValue;
        if (isDoubleEsc && currentValue) {
          setSearchQuery('');
          input!.value = '';
          if (clearBtn) clearBtn.style.display = 'none';
          rerenderByMode();
          lastEscAt = 0;
          lastEscValue = '';
          e.preventDefault();
          return;
        }
        lastEscAt = now;
        lastEscValue = currentValue;
      }
    });

    clearBtn.addEventListener('click', () => {
      setSearchQuery('');
      if (input) {
        input.value = '';
      }
      clearBtn!.style.display = 'none';
      rerenderByMode();
      input?.focus();
    });
  }

  // 同步显示（避免输入时强行覆盖用户正在编辑的值）
  if (document.activeElement !== input && input.value !== state.searchQuery) {
    input.value = state.searchQuery;
  }
  clearBtn.style.display = state.searchQuery ? 'block' : 'none';
  // 同步 placeholder（切换 tab 时更新）
  input.placeholder = placeholder;
}

// 渲染当前文件路径（已移除，功能由面包屑导航提供）
export function renderCurrentPath(): void {
  const container = document.getElementById('currentPath');
  if (!container) return;

  // 隐藏当前路径区域
  container.innerHTML = '';
  container.style.display = 'none';
}

function renderViewTabs(): void {
  const container = document.getElementById('modeSwitchRow');
  if (!container) return;

  const tab = state.config.sidebarTab;
  const tabs: Array<{ key: 'focus' | 'full' | 'list' | 'search'; label: string }> = [
    { key: 'focus', label: '最近' },
    { key: 'full', label: '工作区' },
    { key: 'list', label: '打开' },
    { key: 'search', label: '搜索' },
  ];

  container.innerHTML = `
    <div class="view-tabs">
      ${tabs.map(t => `
        <button class="view-tab${tab === t.key ? ' active' : ''}"
                data-action="set-sidebar-tab" data-tab="${t.key}">${t.label}</button>
      `).join('')}
    </div>
  `;
}

const DRAG_THRESHOLD = 4; // px，小于此移动距离视为 click，不启动拖拽

function bindTabDragEvents(tabsScrollEl: HTMLElement): void {
  tabsScrollEl.addEventListener('pointerdown', (e: PointerEvent) => {
    if (e.button !== 0) return;
    const tab = (e.target as HTMLElement).closest('.tab') as HTMLElement | null;
    if (!tab) return;
    if ((e.target as HTMLElement).classList.contains('tab-close')) return;

    const fromIdx = parseInt(tab.dataset.index || '-1', 10);
    if (fromIdx < 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;
    let ghost: HTMLElement | null = null;

    const tabRect = tab.getBoundingClientRect();
    const offsetX = e.clientX - tabRect.left;
    const offsetY = e.clientY - tabRect.top;

    // 记录所有 tab 的原始位置（拖拽开始时快照，之后不再变），用于阈值判断
    let tabOrigRects: Array<{ origIdx: number; left: number; width: number }> = [];

    function startDrag(): void {
      dragging = true;
      ghost = document.createElement('div');
      ghost.className = 'tab-drag-ghost';
      ghost.innerHTML = tab!.querySelector('.tab-name')?.outerHTML || tab!.innerHTML;
      ghost.style.width = tabRect.width + 'px';
      ghost.style.left  = tabRect.left + 'px';
      ghost.style.top   = tabRect.top  + 'px';
      document.body.appendChild(ghost);
      tab!.classList.add('tab-dragging');
      // 快照原始位置（此时 transform 还没加）
      tabOrigRects = [...tabsScrollEl.querySelectorAll<HTMLElement>('.tab')].map(el => ({
        origIdx: parseInt(el.dataset.index || '0', 10),
        left: el.getBoundingClientRect().left,
        width: el.getBoundingClientRect().width,
      }));
      tabDragState = { fromIdx, insertIdx: fromIdx, ghost, srcEl: tab!, offsetX, offsetY };
    }

    function cleanup(): void {
      tabsScrollEl.querySelectorAll<HTMLElement>('.tab').forEach(el => { el.style.transform = ''; });
      if (ghost) { ghost.remove(); ghost = null; }
      tab!.classList.remove('tab-dragging');
      tabDragState = null;
    }

    function onMove(e: PointerEvent): void {
      if (!dragging) {
        if (Math.abs(e.clientX - startX) < DRAG_THRESHOLD && Math.abs(e.clientY - startY) < DRAG_THRESHOLD) return;
        e.preventDefault();
        startDrag();
      }
      if (!tabDragState || !ghost) return;
      const { srcEl } = tabDragState;

      ghost.style.left = (e.clientX - offsetX) + 'px';
      ghost.style.top  = (e.clientY - offsetY) + 'px';

      // 用原始位置（拖拽开始时快照）判断阈值，避免 translateX 偏移导致来回体感不一致
      const mouseX = e.clientX;
      // 按原始 left 升序遍历（快照已按 DOM 顺序，即原始顺序）
      const others = tabOrigRects.filter(t => t.origIdx !== fromIdx);

      let newInsertIdx = fromIdx;
      let found = false;
      for (let i = 0; i < others.length; i++) {
        const t = others[i];
        if (mouseX < t.left + t.width) {
          const movingRight = t.origIdx > fromIdx;
          // 向右拖：越过目标原始左边 1/3；向左拖：越过目标原始右边 1/3
          const trigger = movingRight ? t.left + t.width / 3 : t.left + t.width * 2 / 3;
          newInsertIdx = mouseX < trigger ? t.origIdx : t.origIdx + 1;
          if (t.origIdx >= fromIdx) newInsertIdx -= 1;
          found = true;
          break;
        }
      }
      if (!found) newInsertIdx = state.tabOrder.length - 1;

      tabDragState.insertIdx = newInsertIdx;

      const allTabEls = [...tabsScrollEl.querySelectorAll<HTMLElement>('.tab')];
      const ghostW = ghost.offsetWidth;
      allTabEls.forEach((el, i) => {
        if (el === srcEl) return;
        let dx = 0;
        if (newInsertIdx < fromIdx) {
          if (i >= newInsertIdx && i < fromIdx) dx = ghostW;
        } else {
          if (i > fromIdx && i <= newInsertIdx) dx = -ghostW;
        }
        el.style.transform = dx !== 0 ? `translateX(${dx}px)` : '';
      });
    }

    function onUp(): void {
      tab!.removeEventListener('pointermove', onMove);
      tab!.removeEventListener('pointerup', onUp);
      tab!.removeEventListener('pointercancel', onCancel);

      if (!dragging) return; // 没拖过阈值，视为 click，不处理排序

      const insertIdx = tabDragState?.insertIdx ?? fromIdx;
      cleanup();
      lastTabsRenderKey = '';
      if (fromIdx !== insertIdx) moveTabOrder(fromIdx, insertIdx);
      renderTabs();
      renderFiles();
    }

    function onCancel(): void {
      tab!.removeEventListener('pointermove', onMove);
      tab!.removeEventListener('pointerup', onUp);
      tab!.removeEventListener('pointercancel', onCancel);
      if (dragging) cleanup();
    }

    tab.setPointerCapture(e.pointerId);
    tab.addEventListener('pointermove', onMove);
    tab.addEventListener('pointerup', onUp);
    tab.addEventListener('pointercancel', onCancel);
  });
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
    return renderFileRow(file.path, file.displayName || file.name, undefined, {
      containerClass: 'file-item',
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

  renderSearchBox();
  renderViewTabs();

  if (tab === 'search') {
    renderCurrentPath();
    let searchContainer = document.getElementById('fileList');
    if (!searchContainer) {
      searchContainer = document.createElement('div');
      searchContainer.id = 'fileList';
      const sidebarEl = document.querySelector('.sidebar');
      sidebarEl?.appendChild(searchContainer);
    }
    searchContainer.className = 'rag-search-container';
    // Only build the panel once — rebuilding it resets input and scroll position
    if (!searchContainer.querySelector('.rag-search-wrap')) {
      renderRagSearchPanel(searchContainer);
    }
    renderTabs();
    return;
  }
  if (tab === 'list') {
    renderCurrentPath();
    const listEl = document.getElementById('fileList');
    if (listEl) listEl.className = 'file-list';
    renderFiles();
    renderTabs();
    return;
  }

  // focus or full — workspace rendering
  renderCurrentPath();
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
  const container = document.getElementById('tabs');
  if (!container) return;
  ensureTabManagerGlobalEvents();
  ensureTabsScrollHandler();

  // 保存 tabs-scroll 的滚动位置
  const prevTabsScroll = container.querySelector('.tabs-scroll') as HTMLElement | null;
  if (prevTabsScroll) {
    tabsScrollLeft = prevTabsScroll.scrollLeft;
  }

  if (allFiles.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    tabManagerOpen = false;
    lastTabsRenderKey = '';
    return;
  }

  // 按 tabOrder 排序
  const orderedFiles = state.tabOrder
    .map(p => state.sessionFiles.get(p))
    .filter((f): f is FileInfo => !!f);
  const filesWithDisplay = generateDistinctNames(new Map(orderedFiles.map(f => [f.path, f])));
  const tabsRenderSnapshot = filesWithDisplay
    .map((file) => {
      const status = getFileListStatus(file, hasListDiff(file.path));
      return [
        file.path,
        file.displayName || file.name,
        file.isMissing ? '1' : '0',
        file.path === state.currentFile ? '1' : '0',
        status.type,
        status.badge || ''
      ].join('|');
    })
    .join('||');
  const nextTabsRenderKey = [
    state.currentFile || '',
    tabManagerOpen ? '1' : '0',
    tabsRenderSnapshot
  ].join('###');

  // 确保 tabs 可见（display 可能被外部操作改为 none）
  container.style.display = 'flex';

  // 当 tabs 可见数据没有变化时，避免重复重建 DOM 导致滚动条闪烁
  if (nextTabsRenderKey === lastTabsRenderKey) {
    return;
  }
  lastTabsRenderKey = nextTabsRenderKey;

  const batchCount = {
    others: getTabBatchTargets('close-others', filesWithDisplay, state.currentFile, () => false).length,
    right: getTabBatchTargets('close-right', filesWithDisplay, state.currentFile, () => false).length,
    unmodified: getTabBatchTargets('close-unmodified', filesWithDisplay, state.currentFile, (path) => {
      const file = filesWithDisplay.find((f) => f.path === path);
      if (!file) return false;
      const status = getFileListStatus(file, hasListDiff(file.path));
      return status.type === 'normal' || status.type === 'new';
    }).length,
    all: getTabBatchTargets('close-all', filesWithDisplay, state.currentFile, () => false).length,
  };

  container.innerHTML = renderTabsHTML(filesWithDisplay, state.currentFile, tabManagerOpen, batchCount);

  requestAnimationFrame(() => {
    const tabsScrollEl = container.querySelector('.tabs-scroll') as HTMLElement | null;
    if (tabsScrollEl) {
      if (tabsScrollLeft > 0) tabsScrollEl.scrollLeft = tabsScrollLeft;
      bindTabDragEvents(tabsScrollEl);
      // 将当前 active tab 滚动到可视区域
      const activeTab = tabsScrollEl.querySelector('.tab.active') as HTMLElement | null;
      if (activeTab) {
        const scrollEl = tabsScrollEl;
        const tabLeft = activeTab.offsetLeft;
        const tabRight = tabLeft + activeTab.offsetWidth;
        const visibleLeft = scrollEl.scrollLeft;
        const visibleRight = visibleLeft + scrollEl.clientWidth;
        if (tabLeft < visibleLeft) {
          scrollEl.scrollLeft = tabLeft - 8;
        } else if (tabRight > visibleRight) {
          scrollEl.scrollLeft = tabRight - scrollEl.clientWidth + 8;
        }
      }
    }
    syncAnnotationSidebarLayout();
  });
}
