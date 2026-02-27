import { state, setSearchQuery, getFilteredFiles } from '../state';
import { escapeAttr } from '../utils/escape';
import { generateDistinctNames } from '../utils/file-names';

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
      setSearchQuery(query);
      renderSearchBox();
      renderFiles();
    });
  }

  const clearBtn = document.getElementById('searchClear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      setSearchQuery('');
      renderSearchBox();
      renderFiles();
      input?.focus();
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
        // 触发 toast 提示
        if (window.showToast) {
          window.showToast('已复制路径', 'success');
        }
      } catch (err) {
        console.error('复制失败:', err);
        if (window.showToast) {
          window.showToast('复制失败', 'error');
        }
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

      return `
      <div class="${classes}"
           onclick="window.switchFile('${escapeAttr(file.path)}')">
        <span class="icon">📄</span>
        <span class="name">${displayName}</span>
        <span class="close" onclick="event.stopPropagation();window.removeFile('${escapeAttr(file.path)}')">×</span>
      </div>
    `}).join('');
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
      return `
        <div class="tab ${isCurrent ? 'active' : ''}"
             onclick="window.switchFile('${escapeAttr(file.path)}')">
          <span class="tab-name">${file.displayName}</span>
          <span class="tab-close" onclick="event.stopPropagation();window.removeFile('${escapeAttr(file.path)}')">×</span>
        </div>
      `;
    }).join('');
}
