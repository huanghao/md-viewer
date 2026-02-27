import { state } from '../state';
import { escapeAttr } from '../utils/escape';
import { generateDistinctNames } from '../utils/file-names';

// 渲染文件列表
export function renderFiles(): void {
  const container = document.getElementById('fileList');
  if (!container) return;

  if (state.files.size === 0) {
    container.innerHTML = '<div class="empty-tip">点击上方添加 Markdown 文件</div>';
    return;
  }

  const filesWithDisplay = generateDistinctNames(state.files);
  container.innerHTML = filesWithDisplay
    .map(file => {
      const isCurrent = file.path === state.currentFile;
      const classes = [
        'file-item',
        isCurrent ? 'current' : ''
      ].filter(Boolean).join(' ');
      return `
      <div class="${classes}"
           onclick="window.switchFile('${escapeAttr(file.path)}')">
        <span class="icon">📄</span>
        <span class="name">${file.displayName}</span>
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
