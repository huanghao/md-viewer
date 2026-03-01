import { state, setSearchQuery, getFilteredFiles, hasListDiff } from '../state';
import { saveConfig } from '../config';
import { escapeAttr, escapeHtml } from '../utils/escape';
import { generateDistinctNames } from '../utils/file-names';
import { getFileListStatus } from '../utils/file-status';
import { renderWorkspaceSidebar, bindWorkspaceEvents } from './sidebar-workspace';

let lastEscAt = 0;
let lastEscValue = '';
import { attachPathAutocomplete } from './path-autocomplete';

export function toggleSidebarMode(): void {
  state.config.sidebarMode = state.config.sidebarMode === 'workspace' ? 'simple' : 'workspace';
  saveConfig(state.config);
  renderSidebar();
}

if (typeof window !== 'undefined') {
  (window as any).toggleSidebarMode = toggleSidebarMode;
}

function rerenderByMode(): void {
  if (state.config.sidebarMode === 'workspace') {
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

  if (state.files.size === 0) {
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
      const classes = [
        'file-item',
        isCurrent ? 'current' : ''
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
        <span class="icon">📄</span>
        <span class="name">${displayName}</span>
        <span class="file-item-status">${statusBadge}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('${escapeAttr(file.path)}')">×</span>
      </div>
    `}).join('');
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
  const allFiles = Array.from(state.files.values());
  const container = document.getElementById('tabs');
  if (!container) return;

  if (allFiles.length === 0) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'flex';
  const filesWithDisplay = generateDistinctNames(state.files);

  container.innerHTML = filesWithDisplay
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
}
