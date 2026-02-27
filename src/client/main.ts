// 导入类型
import type { FileData } from './types';

// 导入状态管理
import { state, saveState, restoreState, addOrUpdateFile, removeFile as removeFileFromState, setFileInactive, switchToFile } from './state';

// 导入 API
import { loadFile, searchFiles, getNearbyFiles, openFile } from './api/files';
import { getSyncStatus, getRecentParents, executeSync } from './api/sync';

// 导入工具函数
import { escapeHtml, escapeAttr, escapeJsSingleQuoted } from './utils/escape';
import { formatRelativeTime, formatFileTime } from './utils/format';
import { generateDistinctNames } from './utils/file-names';

// 导入 UI 组件
import { renderFiles, renderTabs } from './ui/sidebar';

// ==================== 消息处理 ====================
async function onFileLoaded(data: FileData, focus: boolean = false) {
  addOrUpdateFile(data, focus);
  renderFiles();
  renderTabs();
  renderContent();
}

// 刷新当前文件（页面加载时自动调用）
async function refreshCurrentFile() {
  if (!state.currentFile) return;
  const data = await loadFile(state.currentFile);
  if (data) {
    const file = state.files.get(data.path);
    if (file) {
      file.content = data.content;
      file.lastModified = data.lastModified;
      renderContent();
      renderFiles();
    }
  }
}

// ==================== UI 渲染 ====================

function renderContent() {
  const container = document.getElementById('content');
  if (!container) return;

  if (!state.currentFile) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>欢迎使用 MD Viewer</h2>
        <p>在左侧添加 Markdown 文件开始阅读</p>
      </div>
    `;
    return;
  }

  const file = state.files.get(state.currentFile);
  if (!file) return;

  // 使用 marked 渲染 Markdown
  const html = (window as any).marked.parse(file.content);
  container.innerHTML = `<div class="markdown-body">${html}</div>`;

  // 更新文件元信息
  const meta = document.getElementById('fileMeta');
  if (meta) {
    meta.textContent = `最后修改: ${formatFileTime(file.lastModified)}`;
  }

  // 更新面包屑
  renderBreadcrumb();

  // 更新同步按钮
  updateSyncButton();
}

// ==================== 面包屑导航 ====================
function renderBreadcrumb() {
  const container = document.getElementById('breadcrumb');
  if (!container || !state.currentFile) {
    if (container) container.innerHTML = '';
    return;
  }

  const file = state.files.get(state.currentFile);
  if (!file) return;

  const parts = file.path.split('/').filter(Boolean);
  const breadcrumbItems = parts.map((part, index) => {
    const isLast = index === parts.length - 1;
    const path = '/' + parts.slice(0, index + 1).join('/');

    if (isLast) {
      return `<span class="breadcrumb-item active">${escapeHtml(part)}</span>`;
    }

    return `
      <span class="breadcrumb-item" title="${escapeAttr(path)}">
        ${escapeHtml(part)}
      </span>
      <span class="breadcrumb-separator">/</span>
    `;
  }).join('');

  // 添加附近文件菜单
  container.innerHTML = `
    <div class="breadcrumb-path">
      ${breadcrumbItems}
      <button class="breadcrumb-nearby-btn" onclick="window.showNearbyMenu(event)">
        📁
      </button>
    </div>
  `;
}

// 显示附近文件菜单
async function showNearbyMenu(e: Event) {
  e.stopPropagation();
  if (!state.currentFile) return;

  const button = e.target as HTMLElement;
  const existingMenu = document.querySelector('.nearby-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  try {
    const data = await getNearbyFiles(state.currentFile);
    if (!data.files || data.files.length === 0) {
      alert('附近没有其他 Markdown 文件');
      return;
    }

    const menuElement = document.createElement('div');
    menuElement.className = 'nearby-menu';
    menuElement.innerHTML = `
      <div class="nearby-menu-header">附近的文件</div>
      ${data.files.map(f => `
        <div class="nearby-menu-item" onclick="window.addFileByPath('${escapeAttr(f.path)}', true)">
          📄 ${escapeHtml(f.name)}
        </div>
      `).join('')}
    `;

    const rect = button.getBoundingClientRect();
    menuElement.style.position = 'fixed';
    menuElement.style.left = rect.left + 'px';
    menuElement.style.top = (rect.bottom + 5) + 'px';

    document.body.appendChild(menuElement);

    const closeMenu = () => {
      menuElement.remove();
      document.removeEventListener('click', closeMenu);
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 0);
  } catch (err: any) {
    alert('获取附近文件失败: ' + err.message);
  }
}

// ==================== 用户操作 ====================

// 添加文件
async function addFileByPath(path: string, focus: boolean = true) {
  if (!path.trim()) return;

  const data = await loadFile(path);
  if (data) {
    await onFileLoaded(data, focus);
    await openFile(path, focus);

    // 清空输入框
    const input = document.getElementById('fileInput') as HTMLInputElement;
    if (input) input.value = '';
  }
}

// 切换文件
function switchFile(path: string) {
  switchToFile(path);
  renderFiles();
  renderTabs();
  renderContent();
}

// 移除文件
function removeFileHandler(path: string) {
  removeFileFromState(path);
  renderFiles();
  renderTabs();
  renderContent();
}

// 关闭标签页
function closeTab(path: string) {
  setFileInactive(path);
  renderFiles();
  renderTabs();
  renderContent();
}

// 搜索文件
async function searchFilesHandler() {
  const input = document.getElementById('fileInput') as HTMLInputElement;
  if (!input) return;

  const query = input.value.trim();
  if (!query) return;

  try {
    const data = await searchFiles(query);
    if (data.files && data.files.length > 0) {
      // 显示搜索结果（简单实现：添加第一个）
      await addFileByPath(data.files[0].path);
    } else {
      alert('没有找到匹配的文件');
    }
  } catch (err: any) {
    alert('搜索失败: ' + err.message);
  }
}

// ==================== 拖拽支持 ====================
function setupDragAndDrop() {
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.body.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    for (const file of files) {
      if (file.name.endsWith('.md')) {
        await addFileByPath((file as any).path);
      }
    }
  });
}

// ==================== URL 参数处理 ====================
function handleURLParams() {
  const params = new URLSearchParams(window.location.search);
  const filePath = params.get('file');
  const focus = params.get('focus') !== 'false';

  if (filePath) {
    addFileByPath(filePath, focus);
    // 清理 URL 参数
    window.history.replaceState({}, '', window.location.pathname);
  }
}

// ==================== 同步功能 ====================

// 更新同步按钮状态
async function updateSyncButton() {
  const button = document.getElementById('syncButton');
  const buttonText = document.getElementById('syncButtonText');
  if (!button || !buttonText || !state.currentFile) {
    if (button) button.style.display = 'none';
    return;
  }

  button.style.display = 'flex';

  try {
    const data = await getSyncStatus(state.currentFile);

    if (data.docId) {
      button.className = 'sync-button synced';
      buttonText.textContent = '✓ 已同步';
    } else {
      button.className = 'sync-button';
      buttonText.textContent = '🔄 同步';
    }
  } catch (e) {
    console.error('获取同步状态失败:', e);
  }
}

// 点击同步按钮
async function handleSyncButtonClick() {
  if (!state.currentFile) return;

  const button = document.getElementById('syncButton');
  if (button && button.classList.contains('syncing')) return;

  const data = await getSyncStatus(state.currentFile);

  if (data.docId) {
    showSyncedFileDialog(data);
  } else {
    showSyncDialog();
  }
}

// 显示同步对话框
async function showSyncDialog() {
  const file = state.files.get(state.currentFile!);
  if (!file) return;

  const titleMatch = file.content.match(/^#\s+(.+)$/m);
  const defaultTitle = titleMatch ? titleMatch[1] : file.name.replace('.md', '');

  const recentData = await getRecentParents();

  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  if (!overlay || !title || !body) return;

  title.textContent = '同步到学城';

  let html = `
    <div class="sync-dialog-field">
      <label class="sync-dialog-label">📄 文件</label>
      <div style="color: #586069; font-size: 13px;">${escapeHtml(file.name)}</div>
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-label">📝 标题</label>
      <input type="text" class="sync-dialog-input" id="syncTitle" value="${escapeAttr(defaultTitle)}">
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-label">📍 选择位置</label>
  `;

  if (recentData.parents && recentData.parents.length > 0) {
    html += '<div class="sync-dialog-recent">';
    recentData.parents.forEach((parent) => {
      const isDefault = parent.id === recentData.defaultParentId;
      html += `
        <div class="sync-dialog-recent-item ${isDefault ? 'selected' : ''}" onclick="window.selectRecentParent('${escapeJsSingleQuoted(parent.id)}', event)">
          <input type="radio" name="recentParent" value="${escapeAttr(parent.id)}" class="sync-dialog-recent-radio" ${isDefault ? 'checked' : ''}>
          <div class="sync-dialog-recent-info">
            <div class="sync-dialog-recent-title">${escapeHtml(parent.title)}</div>
            <div class="sync-dialog-recent-meta">ID: ${escapeHtml(parent.id)} · 最后使用：${escapeHtml(formatRelativeTime(parent.lastUsed))}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  html += `
    <div class="sync-dialog-or">或</div>
    <input type="text" class="sync-dialog-input" id="syncParentId" placeholder="输入父文档 ID 或 URL">
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-checkbox">
        <input type="checkbox" id="syncOpenAfter" checked>
        <span>同步后在浏览器中打开</span>
      </label>
    </div>

    <div class="sync-dialog-field">
      <div class="sync-dialog-output-header">
        <label class="sync-dialog-label">将执行的命令：</label>
        <button class="sync-dialog-copy-btn" onclick="window.copySyncCommand()">
          📋 复制
        </button>
      </div>
      <div class="sync-dialog-output" id="syncCommandPreview">km-cli doc create --parent-id "..." --title "..." --markdown-file "${escapeHtml(state.currentFile || '')}" --json</div>
    </div>

    <div class="sync-dialog-footer">
      <button class="sync-dialog-btn sync-dialog-btn-cancel" onclick="window.closeSyncDialog()">取消</button>
      <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="window.confirmSync()">开始同步</button>
    </div>
  `;

  body.innerHTML = html;

  // 如果字符串拼接被异常字符打断，兜底补上命令预览区
  if (!document.getElementById('syncCommandPreview')) {
    const checkbox = body.querySelector('.sync-dialog-checkbox');
    if (checkbox) {
      const fallback = document.createElement('div');
      fallback.className = 'sync-dialog-field';
      fallback.innerHTML = `
        <div class="sync-dialog-output-header">
          <label class="sync-dialog-label">将执行的命令：</label>
          <button class="sync-dialog-copy-btn" onclick="window.copySyncCommand()">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output" id="syncCommandPreview">km-cli doc create --parent-id "..." --title "..." --markdown-file "${escapeHtml(state.currentFile || '')}" --json</div>
      `;
      checkbox.parentNode!.insertBefore(fallback, checkbox);
    }
  }

  overlay.classList.add('show');

  // 监听标题输入变化
  const titleInput = document.getElementById('syncTitle') as HTMLInputElement;
  const parentInput = document.getElementById('syncParentId') as HTMLInputElement;

  if (titleInput) {
    titleInput.addEventListener('input', updateCommandPreview);
  }
  if (parentInput) {
    parentInput.addEventListener('input', () => {
      // 清除最近位置选择
      document.querySelectorAll('.sync-dialog-recent-item').forEach(item => {
        item.classList.remove('selected');
      });
      document.querySelectorAll('.sync-dialog-recent-radio').forEach((radio: any) => {
        radio.checked = false;
      });
      updateCommandPreview();
    });
  }

  updateCommandPreview();
}

// 更新命令预览
function updateCommandPreview() {
  const preview = document.getElementById('syncCommandPreview');
  const titleInput = document.getElementById('syncTitle') as HTMLInputElement;
  const parentInput = document.getElementById('syncParentId') as HTMLInputElement;
  const selectedRadio = document.querySelector('.sync-dialog-recent-radio:checked') as HTMLInputElement;

  if (!preview || !state.currentFile) return;

  const title = titleInput?.value || '...';
  let parentId = parentInput?.value.trim() || selectedRadio?.value || '...';

  // 从 URL 提取 ID
  if (parentId.includes('xuecheng.com')) {
    const match = parentId.match(/\/doc\/([a-zA-Z0-9_-]+)/);
    if (match) parentId = match[1];
  }

  preview.textContent = `km-cli doc create --parent-id "${parentId}" --title "${title}" --markdown-file "${state.currentFile}" --json`;
}

// 选择最近位置
function selectRecentParent(parentId: string, e?: Event) {
  const items = document.querySelectorAll('.sync-dialog-recent-item');
  items.forEach(item => item.classList.remove('selected'));

  if (e && e.currentTarget) {
    (e.currentTarget as HTMLElement).classList.add('selected');
  }

  const radio = e && e.currentTarget
    ? (e.currentTarget as HTMLElement).querySelector('input[type="radio"]') as HTMLInputElement
    : null;
  if (radio) radio.checked = true;

  // 清空手动输入
  const parentInput = document.getElementById('syncParentId') as HTMLInputElement;
  if (parentInput) parentInput.value = '';

  updateCommandPreview();
}

// 确认同步
async function confirmSync() {
  const titleInput = document.getElementById('syncTitle') as HTMLInputElement;
  const parentInput = document.getElementById('syncParentId') as HTMLInputElement;
  const selectedRadio = document.querySelector('.sync-dialog-recent-radio:checked') as HTMLInputElement;
  const openAfter = (document.getElementById('syncOpenAfter') as HTMLInputElement)?.checked;

  if (!state.currentFile) return;

  const title = titleInput?.value.trim();
  let parentId = parentInput?.value.trim() || selectedRadio?.value;

  if (!title) {
    alert('请输入标题');
    return;
  }

  if (!parentId) {
    alert('请选择位置或输入父文档 ID');
    return;
  }

  // 从 URL 提取 ID
  if (parentId.includes('xuecheng.com')) {
    const match = parentId.match(/\/doc\/([a-zA-Z0-9_-]+)/);
    if (match) parentId = match[1];
  }

  const button = document.querySelector('.sync-dialog-btn-primary') as HTMLButtonElement;
  if (button) {
    button.disabled = true;
    button.textContent = '同步中...';
  }

  try {
    const result = await executeSync(state.currentFile, title, parentId, false);

    if (result.success) {
      showSyncSuccessDialog(result, openAfter);
    } else {
      showSyncErrorDialog(result);
    }
  } catch (err: any) {
    alert('同步失败: ' + err.message);
    if (button) {
      button.disabled = false;
      button.textContent = '开始同步';
    }
  }
}

// 显示同步成功对话框
function showSyncSuccessDialog(result: any, openAfter: boolean) {
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  if (!title || !body) return;

  title.textContent = '✓ 同步成功';

  body.innerHTML = `
    ${result.command ? `
      <div class="sync-dialog-field">
        <div class="sync-dialog-output-header">
          <label class="sync-dialog-label">执行的命令：</label>
          <button class="sync-dialog-copy-btn" onclick="window.copySingleText('${escapeJsSingleQuoted(result.command)}', event)">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output">${escapeHtml(result.command)}</div>
      </div>
    ` : ''}

    ${result.output ? `
      <div class="sync-dialog-field">
        <div class="sync-dialog-output-header">
          <label class="sync-dialog-label">km-cli 返回：</label>
          <button class="sync-dialog-copy-btn" onclick="window.copySingleText('${escapeJsSingleQuoted(result.output)}', event)">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output">${escapeHtml(result.output)}</div>
      </div>
    ` : ''}

    <div class="sync-dialog-success">
      <div class="sync-dialog-success-icon">✓</div>
      <div class="sync-dialog-success-text">文档已成功同步到学城</div>
      ${result.url ? `<a href="${escapeAttr(result.url)}" target="_blank" class="sync-dialog-link">${escapeHtml(result.url)}</a>` : ''}
    </div>

    <div class="sync-dialog-footer">
      <button class="sync-dialog-btn sync-dialog-btn-cancel" onclick="window.closeSyncDialog()">关闭</button>
      ${result.url ? `<button class="sync-dialog-btn sync-dialog-btn-primary" onclick="window.open('${escapeAttr(result.url)}', '_blank')">在浏览器中打开</button>` : ''}
    </div>
  `;

  if (openAfter && result.url) {
    window.open(result.url, '_blank');
  }

  updateSyncButton();
}

// 显示同步错误对话框
function showSyncErrorDialog(result: any) {
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  if (!title || !body) return;

  title.textContent = '✗ 同步失败';

  body.innerHTML = `
    ${result.command ? `
      <div class="sync-dialog-field">
        <div class="sync-dialog-output-header">
          <label class="sync-dialog-label">执行的命令：</label>
          <button class="sync-dialog-copy-btn" onclick="window.copySingleText('${escapeJsSingleQuoted(result.command)}', event)">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output">${escapeHtml(result.command)}</div>
      </div>
    ` : ''}

    <div class="sync-dialog-field">
      <div class="sync-dialog-output-header">
        <label class="sync-dialog-label">km-cli 返回：</label>
        <button class="sync-dialog-copy-btn" onclick="window.copySingleText('${escapeJsSingleQuoted(result.output || '无输出')}', event)">
          📋 复制
        </button>
      </div>
      <div class="sync-dialog-output">${escapeHtml(result.output || '无输出')}</div>
    </div>

    <div class="sync-dialog-footer">
      <button class="sync-dialog-btn sync-dialog-btn-cancel" onclick="window.closeSyncDialog()">关闭</button>
      <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="window.copyErrorInfo()">复制错误信息</button>
    </div>
  `;
}

// 显示已同步文件的对话框
async function showSyncedFileDialog(syncData: any) {
  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  if (!overlay || !title || !body) return;

  title.textContent = '文档同步信息';

  body.innerHTML = `
    <div class="sync-dialog-field">
      <label class="sync-dialog-label">📄 本地文件</label>
      <div style="color: #586069; font-size: 13px;">${escapeHtml(syncData.path)}</div>
    </div>

    ${syncData.command ? `
      <div class="sync-dialog-field">
        <div class="sync-dialog-output-header">
          <label class="sync-dialog-label">执行的命令：</label>
          <button class="sync-dialog-copy-btn" onclick="window.copySingleText('${escapeJsSingleQuoted(syncData.command)}', event)">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output">${escapeHtml(syncData.command)}</div>
      </div>
    ` : ''}

    <div class="sync-dialog-success">
      <div class="sync-dialog-success-icon">✓</div>
      <div class="sync-dialog-success-text">此文档已同步到学城</div>
      ${syncData.url ? `<a href="${escapeAttr(syncData.url)}" target="_blank" class="sync-dialog-link">${escapeHtml(syncData.url)}</a>` : ''}
      ${syncData.lastSyncTime ? `<div style="color: #586069; font-size: 12px; margin-top: 8px;">最后同步: ${formatFileTime(syncData.lastSyncTime)}</div>` : ''}
    </div>

    <div class="sync-dialog-footer">
      <button class="sync-dialog-btn sync-dialog-btn-cancel" onclick="window.closeSyncDialog()">关闭</button>
      ${syncData.url ? `<button class="sync-dialog-btn sync-dialog-btn-primary" onclick="window.open('${escapeAttr(syncData.url)}', '_blank')">在浏览器中打开</button>` : ''}
    </div>
  `;

  overlay.classList.add('show');
}

// 关闭同步对话框
function closeSyncDialog() {
  const overlay = document.getElementById('syncDialogOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

// 复制命令
function copySyncCommand() {
  const preview = document.getElementById('syncCommandPreview');
  if (preview) {
    navigator.clipboard.writeText(preview.textContent || '').then(() => {
      alert('命令已复制到剪贴板');
    });
  }
}

// 复制单个文本
function copySingleText(text: string, e?: Event) {
  navigator.clipboard.writeText(text).then(() => {
    const btn = e && e.target ? (e.target as HTMLElement).closest('.sync-dialog-copy-btn') : null;
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ 已复制';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.classList.remove('copied');
      }, 2000);
    }
  });
}

// 复制错误信息
function copyErrorInfo() {
  const outputs = document.querySelectorAll('.sync-dialog-output');
  if (outputs.length > 0) {
    const texts = Array.from(outputs).map(el => el.textContent).join('\n\n');
    navigator.clipboard.writeText(texts).then(() => {
      alert('错误信息已复制到剪贴板');
    });
  }
}

// ==================== SSE 连接 ====================
function connectSSE() {
  const eventSource = new EventSource('/api/events');

  eventSource.addEventListener('file-changed', async (e: any) => {
    const data = JSON.parse(e.data);
    if (state.files.has(data.path)) {
      await refreshCurrentFile();
    }
  });

  eventSource.addEventListener('file-opened', async (e: any) => {
    const data = JSON.parse(e.data);
    await onFileLoaded(data, data.focus !== false);
  });

  eventSource.onerror = () => {
    console.error('SSE 连接断开，尝试重连...');
    eventSource.close();
    setTimeout(connectSSE, 3000);
  };
}

// ==================== 暴露全局函数 ====================
declare global {
  interface Window {
    addFile: () => void;
    switchFile: (path: string) => void;
    removeFile: (path: string) => void;
    closeTab: (path: string) => void;
    showNearbyMenu: (e: Event) => void;
    addFileByPath: (path: string, focus: boolean) => void;
    handleSyncButtonClick: () => void;
    closeSyncDialog: () => void;
    selectRecentParent: (parentId: string, e?: Event) => void;
    confirmSync: () => void;
    copySyncCommand: () => void;
    copySingleText: (text: string, e?: Event) => void;
    copyErrorInfo: () => void;
  }
}

window.addFile = () => {
  const input = document.getElementById('fileInput') as HTMLInputElement;
  if (input) addFileByPath(input.value, true);
};
window.switchFile = switchFile;
window.removeFile = removeFileHandler;
window.closeTab = closeTab;
window.showNearbyMenu = showNearbyMenu;
window.addFileByPath = addFileByPath;
window.handleSyncButtonClick = handleSyncButtonClick;
window.closeSyncDialog = closeSyncDialog;
window.selectRecentParent = selectRecentParent;
window.confirmSync = confirmSync;
window.copySyncCommand = copySyncCommand;
window.copySingleText = copySingleText;
window.copyErrorInfo = copyErrorInfo;

// ==================== 初始化 ====================
(async () => {
  await restoreState(loadFile);
  renderFiles();
  renderTabs();
  renderContent();

  setupDragAndDrop();
  handleURLParams();

  // 页面刷新时，自动刷新当前正在展示的文件
  await refreshCurrentFile();
  connectSSE();
})();
