import { state, setSearchQuery, getFilteredFiles } from '../state';
import { hasListDiff } from '../workspace-state';
import { saveConfig } from '../config';
import { escapeAttr, escapeHtml } from '../utils/escape';
import { generateDistinctNames } from '../utils/file-names';
import { getFileListStatus } from '../utils/file-status';
import { getFileTypeIcon } from '../utils/file-type';
import { getTabBatchTargets, type TabBatchAction } from '../utils/tab-batch';
import { renderWorkspaceSidebar, bindWorkspaceEvents } from './sidebar-workspace';
import { syncAnnotationSidebarLayout } from '../annotation';

let lastEscAt = 0;
let lastEscValue = '';
let hasAutoAnchoredCurrentFile = false;
let tabManagerOpen = false;
let tabManagerQuery = '';
let tabManagerSort: 'recent' | 'name' = 'recent';
let tabManagerGlobalBound = false;
let tabManagerListScrollTop = 0;
let tabsScrollLeft = 0;
let tabsScrollHandlerBound = false;
let lastTabsRenderKey = '';
const tabAccessOrder: string[] = [];
import { attachPathAutocomplete } from './path-autocomplete';

// 将当前打开的文件滚动到侧边栏40%位置
function scrollCurrentFileIntoView(container: HTMLElement): void {
  if (!state.currentFile) return;
  if (hasAutoAnchoredCurrentFile) return;

  requestAnimationFrame(() => {
    const currentItem = container.querySelector('.file-item.current, .tree-item.current') as HTMLElement;
    if (!currentItem) return;

    const targetScrollTop = currentItem.offsetTop - (container.clientHeight * 0.4);
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const clampedTop = Math.max(0, Math.min(targetScrollTop, maxScrollTop));

    container.scrollTo({ top: clampedTop, behavior: 'auto' });
    hasAutoAnchoredCurrentFile = true;
  });
}

export function toggleSidebarMode(): void {
  state.config.sidebarMode = state.config.sidebarMode === 'workspace' ? 'simple' : 'workspace';
  saveConfig(state.config);
  renderSidebar();
}

if (typeof window !== 'undefined') {
  (window as any).toggleSidebarMode = toggleSidebarMode;
  (window as any).toggleTabManager = toggleTabManager;
  (window as any).setTabManagerQuery = setTabManagerQuery;
  (window as any).setTabManagerSort = setTabManagerSort;
  (window as any).applyTabBatchAction = applyTabBatchAction;
}

function touchTabAccess(path: string | null): void {
  if (!path) return;
  const index = tabAccessOrder.indexOf(path);
  if (index >= 0) tabAccessOrder.splice(index, 1);
  tabAccessOrder.unshift(path);
  if (tabAccessOrder.length > 300) tabAccessOrder.length = 300;
}

function getTabRecentRank(path: string): number {
  const index = tabAccessOrder.indexOf(path);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function toggleTabManager(): void {
  tabManagerOpen = !tabManagerOpen;
  renderTabs();
}

function closeTabManager(): void {
  if (!tabManagerOpen) return;
  tabManagerOpen = false;
  renderTabs();
}

function setTabManagerQuery(query: string): void {
  tabManagerQuery = (query || '').trimStart();
  if (!tabManagerOpen) tabManagerOpen = true;
  renderTabs();
}

function setTabManagerSort(sort: string): void {
  tabManagerSort = sort === 'name' ? 'name' : 'recent';
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
    } else if (target.classList.contains('tab-manager-list')) {
      tabManagerListScrollTop = target.scrollTop;
    }
  }, { passive: true, capture: true });
}

function applyTabBatchAction(action: TabBatchAction): void {
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
  const removeHandler = (window as any).removeFile as ((path: string) => void) | undefined;
  if (!removeHandler || targets.length === 0) {
    renderTabs();
    return;
  }
  targets.forEach((path) => removeHandler(path));
}

function rerenderByMode(): void {
  if (state.config.sidebarMode === 'workspace') {
    renderSidebar();
    return;
  }
  renderFiles();
}

function isJsonPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.json') || lower.endsWith('.jsonl');
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

  if (!input || !clearBtn) {
    container.innerHTML = `
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="search-input"
          placeholder="搜索或输入路径（Enter补全，Cmd/Ctrl+Enter添加）"
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
      (window as any).dismissQuickActionConfirm?.();
      const query = (e.target as HTMLInputElement).value;
      lastEscAt = 0;
      lastEscValue = '';
      setSearchQuery(query);
      if (clearBtn) {
        clearBtn.style.display = query ? 'block' : 'none';
      }
      rerenderByMode();
      // If current file is JSON, re-render with new query
      if (state.currentFile && isJsonPath(state.currentFile)) {
        (window as any).renderContent?.();
      }
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        input!.dispatchEvent(new Event('path-autocomplete-hide'));
        (window as any).handleUnifiedInputSubmit?.(input!.value);
        return;
      }
      if (e.defaultPrevented) {
        // 自动补全面板已消费 Enter/Tab/Escape，不再触发统一提交逻辑
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        input!.dispatchEvent(new Event('path-autocomplete-hide'));
        (window as any).handleUnifiedInputSubmit?.(input!.value);
      }
      if (e.key === 'Escape') {
        (window as any).dismissQuickActionConfirm?.();
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
}

// 渲染当前文件路径（已移除，功能由面包屑导航提供）
export function renderCurrentPath(): void {
  const container = document.getElementById('currentPath');
  if (!container) return;

  // 隐藏当前路径区域
  container.innerHTML = '';
  container.style.display = 'none';
}

function renderModeSwitchRow(): void {
  const container = document.getElementById('modeSwitchRow');
  if (!container) return;

  const isWorkspace = state.config.sidebarMode === 'workspace';
  const label = isWorkspace ? '工作区' : '文件';
  const title = isWorkspace ? '切换到简单模式' : '切换到工作区模式';

  container.innerHTML = `
    <div class="mode-switch-row">
      <button
        class="mode-switch-icon"
        title="${title}"
        aria-label="${title}"
        onclick="window.toggleSidebarMode()"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M16 3l4 4l-4 4"></path>
          <path d="M10 7l10 0"></path>
          <path d="M8 13l-4 4l4 4"></path>
          <path d="M4 17l9 0"></path>
        </svg>
      </button>
      <span class="mode-switch-label">${label}</span>
    </div>
  `;
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

  // 将过滤后的文件转换为 Map 以便生成显示名称
  const filteredMap = new Map(filteredFiles.map(f => [f.path, f]));
  const filesWithDisplay = generateDistinctNames(filteredMap);

  container.innerHTML = filesWithDisplay
    .map(file => {
      const isCurrent = file.path === state.currentFile;
      const isMissing = file.isMissing || false;
      const typeIcon = getFileTypeIcon(file.path);
      const classes = [
        'file-item',
        isCurrent ? 'current' : '',
        isMissing ? 'deleted' : ''
      ].filter(Boolean).join(' ');

      // 高亮匹配的文本
      let displayName = file.displayName || file.name;
      const query = state.searchQuery.toLowerCase().trim();
      if (query) {
        const index = displayName.toLowerCase().indexOf(query);
        if (index !== -1) {
          const before = displayName.substring(0, index);
          const match = displayName.substring(index, index + query.length);
          const after = displayName.substring(index + query.length);
          displayName = `${before}<mark class="search-highlight">${match}</mark>${after}`;
        }
      }

      // 获取文件状态（优先级：D > M > 🔵）
      const status = getFileListStatus(file, hasListDiff(file.path));
      let statusBadge = '&nbsp;'; // 默认使用不间断空格占位

      if (status.badge === 'dot') {
        // 蓝色圆点
        statusBadge = '<span class="new-dot"></span>';
      } else if (status.badge) {
        // M 或 D 字母标识
        statusBadge = `<span class="status-badge status-${status.type}" style="color: ${status.color}">${status.badge}</span>`;
      }

      return `
      <div class="${classes}"
           onclick="window.switchFile('${escapeAttr(file.path)}')">
        <span class="file-type-icon ${typeIcon.cls}">${escapeHtml(typeIcon.label)}</span>
        <span class="name">${displayName}</span>
        <span class="file-item-status">${statusBadge}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('${escapeAttr(file.path)}')">×</span>
      </div>
    `}).join('');

  // 滚动当前文件到侧边栏40%位置
  scrollCurrentFileIntoView(container);
}

// 渲染整个侧边栏（根据模式选择）
export function renderSidebar(): void {
  const mode = state.config.sidebarMode;
  const container = document.querySelector('.sidebar') as HTMLElement | null;
  if (container) {
    container.classList.toggle('workspace-mode', mode === 'workspace');
  }

  // 渲染搜索框
  renderSearchBox();
  renderModeSwitchRow();

  if (mode === 'workspace') {
    // 工作区模式
    renderCurrentPath();  // 工作区模式也显示当前路径
    if (!container) return;

    // 查找或创建文件列表容器
    let fileListContainer = document.getElementById('fileList');
    if (!fileListContainer) {
      fileListContainer = document.createElement('div');
      fileListContainer.id = 'fileList';
      fileListContainer.className = 'file-list';
      container.appendChild(fileListContainer);
    }

    // 渲染工作区侧边栏
    fileListContainer.innerHTML = renderWorkspaceSidebar();

    // 绑定事件
    bindWorkspaceEvents();

    // 滚动当前文件到侧边栏40%位置
    scrollCurrentFileIntoView(fileListContainer);
  } else {
    // 简单模式
    renderCurrentPath();
    renderFiles();
  }

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

  // 保存 tab-manager-list 的滚动位置
  const prevList = container.querySelector('.tab-manager-list') as HTMLElement | null;
  if (prevList) {
    tabManagerListScrollTop = prevList.scrollTop;
  }

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

  const filesWithDisplay = generateDistinctNames(state.sessionFiles);
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
    tabManagerSort,
    tabManagerQuery,
    tabsRenderSnapshot
  ].join('###');

  // 当 tabs 可见数据没有变化时，避免重复重建 DOM 导致滚动条闪烁
  if (nextTabsRenderKey === lastTabsRenderKey) {
    return;
  }
  lastTabsRenderKey = nextTabsRenderKey;

  touchTabAccess(state.currentFile);
  container.style.display = 'flex';

  const tabsHtml = filesWithDisplay
    .map(file => {
      const isCurrent = file.path === state.currentFile;
      const isMissing = file.isMissing || false;
      const classes = ['tab'];
      if (isCurrent) classes.push('active');
      if (isMissing) classes.push('deleted');

      return `
        <div class="${classes.join(' ')}"
             onclick="window.switchFile('${escapeAttr(file.path)}')">
          <span class="tab-name">${escapeHtml(file.displayName)}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('${escapeAttr(file.path)}')">×</span>
        </div>
      `;
    }).join('');

  const query = tabManagerQuery.toLowerCase().trim();
  const managedFiles = filesWithDisplay
    .filter((file) => {
      const displayName = file.displayName || file.name;
      if (!query) return true;
      return displayName.toLowerCase().includes(query) || file.path.toLowerCase().includes(query);
    })
    .sort((a, b) => {
      const nameA = a.displayName || a.name;
      const nameB = b.displayName || b.name;
      if (tabManagerSort === 'name') {
        return nameA.localeCompare(nameB, 'zh-CN');
      }
      const recentDiff = getTabRecentRank(a.path) - getTabRecentRank(b.path);
      if (recentDiff !== 0) return recentDiff;
      return nameA.localeCompare(nameB, 'zh-CN');
    });

  const managerListHtml = managedFiles.length === 0
    ? '<div class="tab-manager-empty">没有匹配的已打开文件</div>'
    : managedFiles.map((file) => {
        const displayName = file.displayName || file.name;
        const isCurrent = file.path === state.currentFile;
        const status = getFileListStatus(file, hasListDiff(file.path));
        const statusBadge = status.badge
          ? `<span class="tab-manager-status status-${status.type}">${escapeHtml(status.badge)}</span>`
          : '';
        return `
          <div class="tab-manager-item ${isCurrent ? 'active' : ''}" onclick="window.switchFile('${escapeAttr(file.path)}')">
            <span class="tab-manager-name" title="${escapeAttr(file.path)}">${escapeHtml(displayName)}</span>
            <span class="tab-manager-actions">
              ${statusBadge}
              <button class="tab-manager-close" type="button" title="关闭" onclick="event.stopPropagation();window.removeFile('${escapeAttr(file.path)}')">×</button>
            </span>
          </div>
        `;
      }).join('');

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

  container.innerHTML = `
    <div class="tabs-scroll">${tabsHtml}</div>
    <div class="tab-manager-wrap">
      <button class="tab-manager-toggle ${tabManagerOpen ? 'active' : ''}" type="button" onclick="event.stopPropagation();window.toggleTabManager()">≡ Tabs (${filesWithDisplay.length})</button>
      <div class="tab-manager-panel ${tabManagerOpen ? 'show' : ''}" onclick="event.stopPropagation()">
        <div class="tab-manager-row tab-manager-actions-row">
          <button class="tab-manager-action" type="button" data-action="close-others" onclick="window.applyTabBatchAction('close-others')">关闭其他 (${batchCount.others})</button>
          <button class="tab-manager-action" type="button" data-action="close-right" onclick="window.applyTabBatchAction('close-right')">关闭右侧 (${batchCount.right})</button>
          <button class="tab-manager-action" type="button" data-action="close-unmodified" onclick="window.applyTabBatchAction('close-unmodified')">关闭未修改 (${batchCount.unmodified})</button>
          <button class="tab-manager-action danger" type="button" data-action="close-all" onclick="window.applyTabBatchAction('close-all')">关闭全部 (${batchCount.all})</button>
        </div>
        <div class="tab-manager-row">
          <input class="tab-manager-search" placeholder="搜索已打开文件" value="${escapeAttr(tabManagerQuery)}" oninput="window.setTabManagerQuery(this.value)">
        </div>
        <div class="tab-manager-row">
          <button class="tab-manager-sort ${tabManagerSort === 'recent' ? 'active' : ''}" type="button" onclick="window.setTabManagerSort('recent')">最近使用</button>
          <button class="tab-manager-sort ${tabManagerSort === 'name' ? 'active' : ''}" type="button" onclick="window.setTabManagerSort('name')">按名称</button>
        </div>
        <div class="tab-manager-list">${managerListHtml}</div>
      </div>
    </div>
  `;

  // 使用 requestAnimationFrame 延迟恢复滚动位置，避免闪烁
  requestAnimationFrame(() => {
    const listEl = container.querySelector('.tab-manager-list') as HTMLElement | null;
    if (listEl && tabManagerListScrollTop > 0) {
      listEl.scrollTop = tabManagerListScrollTop;
    }

    const tabsScrollEl = container.querySelector('.tabs-scroll') as HTMLElement | null;
    if (tabsScrollEl && tabsScrollLeft > 0) {
      tabsScrollEl.scrollLeft = tabsScrollLeft;
    }
    syncAnnotationSidebarLayout();
  });
}
