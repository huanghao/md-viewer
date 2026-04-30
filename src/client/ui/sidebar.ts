import { state, setSearchQuery, getFilteredFiles } from '../state';
import { hasListDiff } from '../workspace-state';
import { saveConfig } from '../config';
import { escapeAttr, escapeHtml } from '../utils/escape';
import { generateDistinctNames } from '../utils/file-names';
import { getFileListStatus } from '../utils/file-status';
import { isJsonFile, isJsonlFile } from '../utils/file-type';
import { renderFileRow } from './file-row';
import { isPinned } from '../utils/pinned-files';
import { compareFileNames } from '../utils/file-sort';
import { getTabBatchTargets, type TabBatchAction } from '../utils/tab-batch';
import { renderWorkspaceSidebar, bindWorkspaceEvents } from './sidebar-workspace';
import { syncAnnotationSidebarLayout } from '../annotation';
import { ragSearch } from '../api/rag';
import type { RagResult } from '../api/rag';

let lastEscAt = 0;
let lastEscValue = '';
let hasAutoAnchoredCurrentFile = false;
let tabManagerOpen = false;
let tabManagerGlobalBound = false;
let tabsScrollLeft = 0;
let tabsScrollHandlerBound = false;
let lastTabsRenderKey = '';

// RAG search state
let searchMode: 'filename' | 'content' = 'filename';
let ragResults: RagResult[] = [];
let ragLoading = false;
let ragDebounceTimer: ReturnType<typeof setTimeout> | null = null;

function triggerRagSearch(query: string): void {
  if (ragDebounceTimer) clearTimeout(ragDebounceTimer);
  ragResults = [];
  ragLoading = true;
  rerenderByMode();
  ragDebounceTimer = setTimeout(async () => {
    const resp = await ragSearch(query);
    ragResults = resp.results;
    ragLoading = false;
    rerenderByMode();
  }, 300);
}

function renderRagCard(r: RagResult): string {
  const name = r.path.split('/').pop() ?? r.path;
  const preview = escapeHtml(r.text.slice(0, 120));
  const score = Math.round(r.score * 100);
  const heading = r.heading ? `<span class="rag-heading">${escapeHtml(r.heading)}</span>` : '';
  return `
    <div class="rag-card" data-path="${escapeAttr(r.path)}" data-char-start="${r.charStart}">
      <div class="rag-card-title">
        <span class="rag-filename">${escapeHtml(name)}</span>
        ${heading}
        <span class="rag-score">${score}%</span>
      </div>
      <div class="rag-card-preview">${preview}</div>
    </div>
  `;
}

async function openRagResult(path: string, charStart: number): Promise<void> {
  const { loadFile } = await import('../api/files');
  const { addOrUpdateFile, switchToFile } = await import('../state');
  const data = await loadFile(path);
  if (!data) return;
  addOrUpdateFile(data, true);
  switchToFile(path);

  // Scroll to charStart position after content renders
  setTimeout(() => {
    const content = document.getElementById('content');
    const reader = document.getElementById('reader');
    if (!content || !reader) return;
    let walked = 0;
    const walker = document.createTreeWalker(reader, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (walked + node.length >= charStart) {
        const el = node.parentElement;
        if (el) content.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' });
        break;
      }
      walked += node.length;
    }
  }, 300);
}
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

export function setSidebarTab(tab: 'focus' | 'full' | 'list'): void {
  state.config.sidebarTab = tab;
  saveConfig(state.config);
  if (tab === 'focus') {
    import('./workspace-focus').then(({ refreshFrecencySignals, renderFocusView: _ }) => {
      void refreshFrecencySignals().then(() => renderSidebar());
    });
  } else {
    renderSidebar();
  }
}

if (typeof window !== 'undefined') {
  (window as any).setSidebarTab = setSidebarTab;
  (window as any).toggleTabManager = toggleTabManager;
  (window as any).applyTabBatchAction = applyTabBatchAction;
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
  const closeable = targets.filter((path) => !isPinned(path));
  if (!removeHandler || closeable.length === 0) {
    renderTabs();
    return;
  }
  closeable.forEach((path) => removeHandler(path));
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
      <div class=”search-wrapper”>
        <span class=”search-icon”>🔍</span>
        <input
          type=”text”
          class=”search-input”
          placeholder=”${placeholder}”
          id=”searchInput”
        />
        <button class=”search-clear” id=”searchClear”>×</button>
      </div>
      <div class=”search-mode-toggle” id=”searchModeToggle”>
        <button class=”search-mode-btn ${searchMode === 'filename' ? 'active' : ''}” data-mode=”filename”>文件名</button>
        <button class=”search-mode-btn ${searchMode === 'content' ? 'active' : ''}” data-mode=”content”>内容</button>
      </div>
    `;

    input = container.querySelector('#searchInput') as HTMLInputElement | null;
    clearBtn = container.querySelector('#searchClear') as HTMLButtonElement | null;
    if (!input || !clearBtn) return;

    const modeToggle = container.querySelector('#searchModeToggle');
    modeToggle?.querySelectorAll('.search-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        searchMode = (btn as HTMLElement).dataset.mode as 'filename' | 'content';
        modeToggle.querySelectorAll('.search-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (searchMode === 'content' && state.searchQuery.trim()) {
          triggerRagSearch(state.searchQuery);
        } else {
          ragResults = [];
          ragLoading = false;
          rerenderByMode();
        }
      });
    });

    // 路径补全仅在”像路径”的输入下触发，避免干扰普通搜索
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
      if (searchMode === 'content') {
        if (query.trim()) {
          triggerRagSearch(query);
        } else {
          ragResults = [];
          ragLoading = false;
          rerenderByMode();
        }
      } else {
        rerenderByMode();
      }
      // If current file is JSON, re-render with new query
      if (state.currentFile && (isJsonFile(state.currentFile) || isJsonlFile(state.currentFile))) {
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
  const tabs: Array<{ key: 'focus' | 'full' | 'list'; label: string }> = [
    { key: 'focus', label: '最近' },
    { key: 'full', label: '工作区' },
    { key: 'list', label: '打开' },
  ];

  container.innerHTML = `
    <div class="view-tabs">
      ${tabs.map(t => `
        <button class="view-tab${tab === t.key ? ' active' : ''}"
                onclick="setSidebarTab('${t.key}')">${t.label}</button>
      `).join('')}
    </div>
  `;
}

// 渲染文件列表
export function renderFiles(): void {
  const container = document.getElementById('fileList');
  if (!container) return;

  // Content search mode: show RAG results
  if (searchMode === 'content' && state.searchQuery.trim()) {
    if (ragLoading) {
      container.innerHTML = '<div class="rag-status">搜索中...</div>';
      return;
    }
    if (ragResults.length === 0) {
      container.innerHTML = '<div class="rag-status">无结果</div>';
      return;
    }
    container.innerHTML = ragResults.map(r => renderRagCard(r)).join('');
    container.querySelectorAll<HTMLElement>('.rag-card').forEach(card => {
      card.addEventListener('click', () => {
        const path = card.dataset.path!;
        const charStart = parseInt(card.dataset.charStart ?? '0');
        openRagResult(path, charStart);
      });
    });
    return;
  }

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

  // 将过滤后的文件转换为 Map 以便生成显示名称，按文件名排序
  const filteredMap = new Map(filteredFiles.map(f => [f.path, f]));
  const filesWithDisplay = generateDistinctNames(filteredMap)
    .sort((a, b) => {
      const aPinned = isPinned(a.path);
      const bPinned = isPinned(b.path);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;
      return compareFileNames(a.displayName || a.name, b.displayName || b.name);
    });

  container.innerHTML = filesWithDisplay.map(file => {
    return renderFileRow(file.path, file.displayName || file.name, undefined, {
      containerClass: 'file-item',
      onClickJs: (p) => `window.switchFile('${escapeAttr(p)}')`,
      showPin: true,
      showTime: false,
      indentPx: 0,
      query: state.searchQuery.toLowerCase().trim(),
      showClose: true,
      onCloseJs: (p) => `window.removeFile('${escapeAttr(p)}')`,
    });
  }).join('');

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

  if (tab === 'list') {
    renderCurrentPath();
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
    fileListContainer.className = 'file-list';
    container.appendChild(fileListContainer);
  }

  fileListContainer.innerHTML = renderWorkspaceSidebar();
  bindWorkspaceEvents();
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
    tabsRenderSnapshot
  ].join('###');

  // 确保 tabs 可见（display 可能被外部操作改为 none）
  container.style.display = 'flex';

  // 当 tabs 可见数据没有变化时，避免重复重建 DOM 导致滚动条闪烁
  if (nextTabsRenderKey === lastTabsRenderKey) {
    return;
  }
  lastTabsRenderKey = nextTabsRenderKey;

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
      </div>
    </div>
  `;

  requestAnimationFrame(() => {
    const tabsScrollEl = container.querySelector('.tabs-scroll') as HTMLElement | null;
    if (tabsScrollEl && tabsScrollLeft > 0) {
      tabsScrollEl.scrollLeft = tabsScrollLeft;
    }
    syncAnnotationSidebarLayout();
  });
}
