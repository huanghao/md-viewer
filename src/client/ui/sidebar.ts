import { state, setSearchQuery, getFilteredFiles } from '../state';
import { escapeAttr, escapeHtml } from '../utils/escape';
import { generateDistinctNames } from '../utils/file-names';
import { getFileListStatus } from '../utils/file-status';
import { renderWorkspaceSidebar, bindWorkspaceEvents } from './sidebar-workspace';
import { showFileContextMenu } from './context-menu';

// 渲染搜索框
export function renderSearchBox(): void {
  const container = document.getElementById('searchBox');
  if (!container) return;

  container.innerHTML = `
    <div class="search-wrapper">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        class="search-input"
        placeholder="搜索文件..."
        value="${escapeAttr(state.searchQuery)}"
        id="searchInput"
      />
      ${state.searchQuery ? '<button class="search-clear" id="searchClear">×</button>' : ''}
    </div>
  `;

  // 绑定事件
  const input = document.getElementById('searchInput') as HTMLInputElement;
  if (input) {
    input.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      const cursorPosition = input.selectionStart || 0;
      setSearchQuery(query);
      renderSearchBox();
      renderFiles();

      // 重新渲染后恢复焦点和光标位置
      const newInput = document.getElementById('searchInput') as HTMLInputElement;
      if (newInput) {
        newInput.focus();
        newInput.setSelectionRange(cursorPosition, cursorPosition);
      }
    });
  }

  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      setSearchQuery('');
      renderSearchBox();
      renderFiles();

      // 清除后恢复焦点
      const newInput = document.getElementById('searchInput') as HTMLInputElement;
      if (newInput) {
        newInput.focus();
      }
    });
  }
}

// 渲染当前文件路径
export function renderCurrentPath(): void {
  const container = document.getElementById('currentPath');
  if (!container) return;

  if (!state.currentFile) {
    container.innerHTML = '';
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  container.innerHTML = `
    <div class="current-path-wrapper">
      <span class="current-path-text" title="${escapeAttr(state.currentFile)}">${escapeAttr(state.currentFile)}</span>
      <button class="current-path-copy" id="copyPathBtn" title="复制路径">📋</button>
    </div>
  `;

  // 绑定复制事件
  const copyBtn = document.getElementById('copyPathBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(state.currentFile || '');
        // 视觉反馈：按钮短暂变化
        copyBtn.textContent = '✓';
        setTimeout(() => {
          copyBtn.textContent = '📋';
        }, 1000);
      } catch (err) {
        console.error('复制失败:', err);
        // 失败时显示错误图标
        copyBtn.textContent = '✗';
        setTimeout(() => {
          copyBtn.textContent = '📋';
        }, 1000);
      }
    });
  }
}

// 渲染文件列表
export function renderFiles(): void {
  const container = document.getElementById('fileList');
  if (!container) return;

  if (state.files.size === 0) {
    container.innerHTML = '<div class="empty-tip">点击上方添加 Markdown 文件</div>';
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
      let displayName = file.displayName;
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
      <div class="${classes}"
           data-file-path="${escapeAttr(file.path)}"
           onclick="window.switchFile('${escapeAttr(file.path)}')">
        <span class="file-item-status">${statusBadge}</span>
        <span class="icon">📄</span>
        <span class="name">${displayName}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('${escapeAttr(file.path)}')">×</span>
      </div>
    `}).join('');

  // 绑定右键菜单事件
  container.querySelectorAll('.file-item').forEach(item => {
    const fileItem = item as HTMLElement;
    const filePath = fileItem.getAttribute('data-file-path');
    if (filePath) {
      fileItem.addEventListener('contextmenu', (e) => {
        showFileContextMenu(e as MouseEvent, filePath);
      });
    }
  });
}

// 渲染整个侧边栏（根据模式选择）
export function renderSidebar(): void {
  const mode = state.config.sidebarMode;

  // 渲染搜索框
  renderSearchBox();

  if (mode === 'workspace') {
    // 工作区模式
    renderCurrentPath();  // 工作区模式也显示当前路径
    const container = document.querySelector('.sidebar') as HTMLElement;
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
             data-file-path="${escapeAttr(file.path)}"
             onclick="window.switchFile('${escapeAttr(file.path)}')">
          <span class="tab-name">${escapeHtml(file.displayName)}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('${escapeAttr(file.path)}')">×</span>
        </div>
      `;
    }).join('');

  // 绑定右键菜单事件
  container.querySelectorAll('.tab').forEach(tab => {
    const tabElement = tab as HTMLElement;
    const filePath = tabElement.getAttribute('data-file-path');
    if (filePath) {
      tabElement.addEventListener('contextmenu', (e) => {
        showFileContextMenu(e as MouseEvent, filePath);
      });
    }
  });
}
