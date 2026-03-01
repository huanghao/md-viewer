// 导入类型
import type { FileData } from './types';

// 导入状态管理
import { state, saveState, restoreState, addOrUpdateFile, removeFile as removeFileFromState, switchToFile, setSearchQuery } from './state';
import { addWorkspace, hydrateExpandedWorkspaces } from './workspace';

// 导入 API
import { loadFile, searchFiles, getNearbyFiles, openFile, detectPathType } from './api/files';
import { getSyncStatus, getRecentParents, executeSync, getSyncPreferences, saveSyncPreference } from './api/sync';

// 导入工具函数
import { escapeHtml, escapeAttr, escapeJsSingleQuoted } from './utils/escape';
import { formatRelativeTime, formatFileTime } from './utils/format';
import { generateDistinctNames } from './utils/file-names';

// 导入 UI 组件
import { renderSidebar } from './ui/sidebar';
import { showToast, showSuccess, showError, showWarning, showInfo } from './ui/toast';
import { showSettingsDialog } from './ui/settings';

const SIDEBAR_WIDTH_STORAGE_KEY = 'md-viewer:sidebar-width';
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 680;

// ==================== 消息处理 ====================
async function onFileLoaded(data: FileData, focus: boolean = false) {
  addOrUpdateFile(data, focus);
  renderSidebar();
  renderContent();
}

function getMaxSidebarWidth(): number {
  // 给主内容至少保留可读宽度
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, window.innerWidth - 360));
}

function clampSidebarWidth(width: number): number {
  return Math.min(getMaxSidebarWidth(), Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

function applySidebarWidth(width: number): void {
  const clamped = clampSidebarWidth(width);
  document.documentElement.style.setProperty('--sidebar-width', `${clamped}px`);
}

function initSidebarWidth(): void {
  const saved = Number(localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY));
  const width = Number.isFinite(saved) && saved > 0 ? saved : SIDEBAR_DEFAULT_WIDTH;
  applySidebarWidth(width);
}

function setupSidebarResize(): void {
  const resizer = document.getElementById('sidebarResizer');
  if (!resizer) return;

  let dragging = false;

  const onMove = (event: MouseEvent) => {
    if (!dragging) return;
    const width = clampSidebarWidth(event.clientX);
    applySidebarWidth(width);
  };

  const onUp = (event: MouseEvent) => {
    if (!dragging) return;
    dragging = false;
    const width = clampSidebarWidth(event.clientX);
    applySidebarWidth(width);
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(width));
    document.body.classList.remove('sidebar-resizing');
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };

  resizer.addEventListener('mousedown', (event) => {
    if (window.innerWidth <= 900) return;
    dragging = true;
    document.body.classList.add('sidebar-resizing');
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    event.preventDefault();
  });

  resizer.addEventListener('dblclick', () => {
    applySidebarWidth(SIDEBAR_DEFAULT_WIDTH);
    localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(SIDEBAR_DEFAULT_WIDTH));
  });

  window.addEventListener('resize', () => {
    const current = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'),
      10
    );
    if (Number.isFinite(current)) {
      applySidebarWidth(current);
    }
  });
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
      file.displayedModified = data.lastModified;  // 同步时间戳
      renderContent();
      renderSidebar();
    }
  }
}

// 手动刷新文件（用户点击刷新按钮）
async function refreshFile(path: string) {
  const file = state.files.get(path);
  if (!file) return;

  const data = await loadFile(path);
  if (data) {
    file.content = data.content;
    file.lastModified = data.lastModified;
    file.displayedModified = data.lastModified;  // 同步时间戳，消除 dirty 状态

    // 如果当前正在查看这个文件，重新渲染
    if (state.currentFile === path) {
      renderContent();
      showSuccess('文件已刷新', 2000);
    }

    // 重新渲染侧边栏（M 标识消失）
    renderSidebar();
  }
}

// ==================== UI 渲染 ====================

// 渲染所有 UI（供工作区模式调用）
export function renderAll() {
  renderSidebar();
  renderContent();
}

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

  // 更新文件元信息（仅显示相对时间）
  const meta = document.getElementById('fileMeta');
  if (meta) {
    meta.textContent = formatRelativeTime(file.lastModified);
  }

  // 更新面包屑
  renderBreadcrumb();

  // 更新工具栏按钮（刷新按钮和同步按钮）
  updateToolbarButtons();
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
  const fileName = parts[parts.length - 1] || '';

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

  // 显示面包屑路径和复制按钮
  container.innerHTML = `
    ${breadcrumbItems}
    <button class="copy-filename-button" onclick="copyFileName('${escapeAttr(fileName)}', event)">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">复制路径</span>
    </button>
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
      showInfo('附近没有其他 Markdown 文件', 3000);
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
    showError('获取附近文件失败: ' + err.message);
  }
}

// ==================== 用户操作 ====================

type PendingAddAction =
  | { kind: 'add-other-file'; path: string; ext: string | null }
  | { kind: 'add-workspace'; path: string };

let pendingAddAction: PendingAddAction | null = null;

function getWorkspaceNameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'workspace';
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

function clearAddConfirm(): void {
  pendingAddAction = null;
  const bar = document.getElementById('quickActionConfirm') as HTMLElement | null;
  const text = document.getElementById('quickActionConfirmText') as HTMLElement | null;
  const actions = document.getElementById('quickActionConfirmActions') as HTMLElement | null;
  if (bar) {
    bar.style.display = 'none';
    bar.className = 'add-file-confirm';
  }
  if (text) text.textContent = '';
  if (actions) actions.innerHTML = '';
  document.body.classList.remove('quick-action-confirm-visible');
}

function isAddConfirmVisible(): boolean {
  const bar = document.getElementById('quickActionConfirm') as HTMLElement | null;
  return !!bar && bar.style.display !== 'none';
}

function showAddConfirm(
  message: string,
  mode: 'warning' | 'directory' | 'error',
  opts: { primaryLabel?: string; onPrimary?: () => Promise<void> | void; allowCancel?: boolean } = {}
): void {
  const searchInput = document.getElementById('searchInput') as HTMLInputElement | null;
  searchInput?.dispatchEvent(new Event('path-autocomplete-hide'));

  const bar = document.getElementById('quickActionConfirm') as HTMLElement | null;
  const text = document.getElementById('quickActionConfirmText') as HTMLElement | null;
  const actions = document.getElementById('quickActionConfirmActions') as HTMLElement | null;
  if (!bar || !text || !actions) return;

  text.textContent = message;
  actions.innerHTML = '';
  bar.className = `add-file-confirm state-${mode}`;
  bar.style.display = 'flex';
  document.body.classList.add('quick-action-confirm-visible');

  if (opts.primaryLabel && opts.onPrimary) {
    const primary = document.createElement('button');
    primary.className = 'add-file-confirm-button primary';
    primary.textContent = opts.primaryLabel;
    primary.onclick = async () => {
      await opts.onPrimary!();
      clearAddConfirm();
    };
    actions.appendChild(primary);
  }

  if (opts.allowCancel !== false) {
    const cancel = document.createElement('button');
    cancel.className = 'add-file-confirm-button';
    cancel.textContent = '取消';
    cancel.onclick = () => clearAddConfirm();
    actions.appendChild(cancel);
  }
}

async function executePendingAddAction(): Promise<void> {
  if (!pendingAddAction) return;

  if (pendingAddAction.kind === 'add-other-file') {
    await addFileByPath(pendingAddAction.path, true);
    return;
  }

  const workspace = addWorkspace(getWorkspaceNameFromPath(pendingAddAction.path), pendingAddAction.path);
  renderSidebar();
  showSuccess(`已添加工作区: ${workspace.name}`, 2000);
  setSearchQuery('');
  renderSidebar();
}

// 添加文件
async function addFileByPath(path: string, focus: boolean = true) {
  if (!path.trim()) return;

  const data = await loadFile(path);
  if (data) {
    await onFileLoaded(data, focus);
    await openFile(path, focus);


    // 清空统一输入框
    setSearchQuery('');
    renderSidebar();
  }
}

async function handleSmartAddInput(path: string): Promise<void> {
  const trimmed = path.trim();
  if (!trimmed) return;

  const result = await detectPathType(trimmed);
  const detectedPath = result.path || trimmed;

  if (result.kind === 'md_file') {
    clearAddConfirm();
    await addFileByPath(detectedPath, true);
    return;
  }

  if (result.kind === 'other_file') {
    pendingAddAction = {
      kind: 'add-other-file',
      path: detectedPath,
      ext: result.ext || null
    };
    showAddConfirm(
      `检测到非 Markdown 文件${result.ext ? `: ${result.ext}` : ''}`,
      'warning',
      {
        primaryLabel: '继续添加文件',
        onPrimary: executePendingAddAction
      }
    );
    return;
  }

  if (result.kind === 'directory') {
    pendingAddAction = {
      kind: 'add-workspace',
      path: detectedPath
    };
    showAddConfirm('检测到目录，是否作为工作区添加？', 'directory', {
      primaryLabel: '添加工作区',
      onPrimary: executePendingAddAction
    });
    return;
  }

  if (result.kind === 'not_found') {
    pendingAddAction = null;
    showAddConfirm('路径不存在，请检查后重试', 'error', { allowCancel: true });
    return;
  }

  pendingAddAction = null;
  showAddConfirm(result.error || '无法识别输入路径', 'error', { allowCancel: true });
}

// 切换文件
function switchFile(path: string) {
  switchToFile(path);
  renderSidebar();
  renderContent();
}

// 移除文件（关闭标签页和从列表删除是同一个操作）
function removeFileHandler(path: string) {
  removeFileFromState(path);
  renderSidebar();
  renderContent();
}

// 搜索文件
async function searchFilesHandler() {
  const input = document.getElementById('searchInput') as HTMLInputElement;
  if (!input) return;

  const query = input.value.trim();
  if (!query) return;

  try {
    const data = await searchFiles(query);
    if (data.files && data.files.length > 0) {
      // 显示搜索结果（简单实现：添加第一个）
      await addFileByPath(data.files[0].path);
    } else {
      showInfo('没有找到匹配的文件', 3000);
    }
  } catch (err: any) {
    showError('搜索失败: ' + err.message);
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

// ==================== 键盘快捷键 ====================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Cmd-K (Mac) 或 Ctrl-K (Windows/Linux) 聚焦搜索框
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const input = document.getElementById('searchInput') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }

    // Cmd-W (Mac) 或 Ctrl-W (Windows/Linux) 关闭当前标签页
    if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
      e.preventDefault(); // 阻止关闭浏览器标签

      // 如果有当前文件，关闭它
      if (state.currentFile) {
        removeFileHandler(state.currentFile);
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
// 更新工具栏按钮（刷新按钮和同步按钮）
async function updateToolbarButtons() {
  if (!state.currentFile) {
    // 没有当前文件时隐藏所有按钮
    const refreshButton = document.getElementById('refreshButton');
    const syncButton = document.getElementById('syncButton');
    if (refreshButton) refreshButton.style.display = 'none';
    if (syncButton) syncButton.style.display = 'none';
    return;
  }

  const file = state.files.get(state.currentFile);
  if (!file) return;

  // 更新刷新按钮：只有当文件 dirty 时才显示
  const refreshButton = document.getElementById('refreshButton');
  if (refreshButton) {
    const isDirty = file.lastModified > file.displayedModified;
    refreshButton.style.display = isDirty ? 'flex' : 'none';
  }

  // 更新同步按钮
  await updateSyncButton();
}

async function updateSyncButton() {
  const button = document.getElementById('syncButton');
  const buttonText = document.getElementById('syncButtonText');

  if (!button || !buttonText || !state.currentFile) {
    if (button) button.style.display = 'none';
    return;
  }

  button.style.display = 'block';

  try {
    const data = await getSyncStatus(state.currentFile);

    if (data.docId) {
      button.className = 'toolbar-text-button synced';
      buttonText.textContent = '[✓ 已同步]';
    } else {
      button.className = 'toolbar-text-button';
      buttonText.textContent = '[☁↑ 同步]';
    }
  } catch (e) {
    console.error('获取同步状态失败:', e);
  }
}

// 点击刷新按钮
async function handleRefreshButtonClick() {
  if (!state.currentFile) return;

  const file = state.files.get(state.currentFile);
  if (!file) return;

  try {
    // 重新加载文件
    const response = await fetch(`/api/file?path=${encodeURIComponent(state.currentFile)}`);
    const data = await response.json();

    if (data.error) {
      showError(`刷新失败: ${data.error}`);
      return;
    }

    // 更新文件内容和时间戳
    file.content = data.content;
    file.lastModified = data.lastModified;
    file.displayedModified = data.lastModified; // 同步时间戳，消除 dirty 状态

    // 重新渲染
    renderContent();
    renderSidebar(); // 刷新侧边栏，M 标识消失
    saveState();

    // 可选：添加内容闪烁效果
    const container = document.getElementById('content');
    if (container) {
      container.style.animation = 'flash 1s ease-out';
      setTimeout(() => {
        container.style.animation = '';
      }, 1000);
    }
  } catch (e) {
    console.error('刷新文件失败:', e);
    showError('刷新文件失败');
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
  const preferences = await getSyncPreferences();

  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  if (!overlay || !title || !body) return;

  title.textContent = '同步到学城';

  // 开始构建 HTML（移除文件名展示）
  let html = `
    <div class="sync-dialog-field">
      <label class="sync-dialog-label">📝 标题</label>
      <input type="text" class="sync-dialog-input" id="syncTitle" value="${escapeAttr(defaultTitle)}">
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-label">📍 选择位置</label>
  `;

  // 最近位置列表（带链接）
  if (recentData.parents && recentData.parents.length > 0) {
    html += '<div class="sync-dialog-recent">';
    recentData.parents.forEach((parent) => {
      const isDefault = parent.id === recentData.defaultParentId;
      html += `
        <div class="sync-dialog-recent-item ${isDefault ? 'selected' : ''}" onclick="window.selectRecentParent('${escapeJsSingleQuoted(parent.id)}', event)">
          <input type="radio" name="recentParent" value="${escapeAttr(parent.id)}" class="sync-dialog-recent-radio" ${isDefault ? 'checked' : ''}>
          <div class="sync-dialog-recent-info">
            <div class="sync-dialog-recent-title">
              ${escapeHtml(parent.title)}
              ${parent.url ? `<a href="${escapeAttr(parent.url)}" target="_blank" class="sync-dialog-link-icon" onclick="event.stopPropagation()" title="在学城中打开">🔗</a>` : ''}
            </div>
            <div class="sync-dialog-recent-meta">ID: ${escapeHtml(parent.id)} · 最后使用：${escapeHtml(formatRelativeTime(parent.lastUsed))}</div>
          </div>
        </div>
      `;
    });
    html += '</div>';
  }

  // 手动输入区域（合并，移除独立的「或」行）
  const placeholder = recentData.parents && recentData.parents.length > 0
    ? '或输入父文档 ID / URL'
    : '输入父文档 ID / URL';

  html += `
    <input type="text" class="sync-dialog-input sync-dialog-manual-input" id="syncParentId" placeholder="${placeholder}">
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-checkbox">
        <input type="checkbox" id="syncOpenAfter" ${preferences.openAfterSync !== false ? 'checked' : ''}>
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
      <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="window.confirmSync()">同步</button>
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
    showWarning('请输入标题');
    return;
  }

  if (!parentId) {
    showWarning('请选择位置或输入父文档 ID');
    return;
  }

  // 从 URL 提取 ID
  if (parentId.includes('xuecheng.com')) {
    const match = parentId.match(/\/doc\/([a-zA-Z0-9_-]+)/);
    if (match) parentId = match[1];
  }

  // 保存用户偏好
  try {
    await saveSyncPreference('openAfterSync', openAfter);
  } catch (err) {
    console.error('保存偏好失败:', err);
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
    showError('同步失败: ' + err.message);
    if (button) {
      button.disabled = false;
      button.textContent = '同步';
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
      showSuccess('命令已复制到剪贴板', 2000);
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

// 复制文件名
function copyFileName(fileName: string, event?: Event) {
  navigator.clipboard.writeText(fileName).then(() => {
    // 只显示视觉反馈（对勾），不显示 Toast
    if (event) {
      const btn = (event.target as HTMLElement).closest('.copy-filename-button') as HTMLButtonElement;
      if (btn) {
        btn.classList.add('success');
        const tooltip = btn.querySelector('.copy-tooltip');
        if (tooltip) {
          const originalText = tooltip.textContent;
          tooltip.textContent = '已复制';

          // 1秒后恢复
          setTimeout(() => {
            btn.classList.remove('success');
            if (tooltip && originalText) {
              tooltip.textContent = originalText;
            }
          }, 1000);
        }
      }
    }
  }).catch(() => {
    showError('复制失败');
  });
}

// 复制错误信息
function copyErrorInfo() {
  const outputs = document.querySelectorAll('.sync-dialog-output');
  if (outputs.length > 0) {
    const texts = Array.from(outputs).map(el => el.textContent).join('\n\n');
    navigator.clipboard.writeText(texts).then(() => {
      showSuccess('错误信息已复制到剪贴板', 2000);
    });
  }
}

// ==================== 字体缩放功能 ====================
let currentFontScale = 1.0;

// 初始化字体缩放
function initFontScale() {
  // 从 localStorage 恢复
  const saved = localStorage.getItem('fontScale');
  if (saved) {
    currentFontScale = parseFloat(saved);
  }
  applyFontScale();
}

// 应用字体缩放
function applyFontScale() {
  document.documentElement.style.setProperty('--font-scale', currentFontScale.toString());
  updateFontScaleDisplay();

  // 保存到 localStorage
  localStorage.setItem('fontScale', currentFontScale.toString());
}

// 更新显示
function updateFontScaleDisplay() {
  const button = document.getElementById('fontScaleText');
  if (button) {
    const percent = Math.round(currentFontScale * 100);
    button.textContent = `${percent}%`;
  }

  // 更新菜单中的选中状态
  const options = document.querySelectorAll('.font-scale-option');
  options.forEach((option) => {
    option.classList.remove('active');
  });

  // 标记当前选中的选项
  const currentPercent = Math.round(currentFontScale * 100);
  options.forEach((option) => {
    const text = option.textContent?.trim();
    if (text === `${currentPercent}%`) {
      option.classList.add('active');
    }
  });
}

// 设置字体缩放
function setFontScale(scale: number) {
  currentFontScale = scale;
  applyFontScale();
  closeFontScaleMenu();
}

// 切换菜单显示
function toggleFontScaleMenu() {
  const menu = document.getElementById('fontScaleMenu');
  if (!menu) return;

  const isVisible = menu.style.display !== 'none';
  if (isVisible) {
    closeFontScaleMenu();
  } else {
    menu.style.display = 'block';
    updateFontScaleDisplay();
  }
}

// 关闭菜单
function closeFontScaleMenu() {
  const menu = document.getElementById('fontScaleMenu');
  if (menu) {
    menu.style.display = 'none';
  }
}

// 点击外部关闭菜单
document.addEventListener('click', (e) => {
  const menu = document.getElementById('fontScaleMenu');
  const button = document.getElementById('fontScaleButton');

  if (!menu || !button) return;

  const target = e.target as HTMLElement;
  if (!menu.contains(target) && !button.contains(target)) {
    closeFontScaleMenu();
  }
});

// ==================== SSE 连接 ====================
function connectSSE() {
  const eventSource = new EventSource('/api/events');

  // 文件内容变化
  eventSource.addEventListener('file-changed', async (e: any) => {
    const data = JSON.parse(e.data);
    const file = state.files.get(data.path);

    if (file) {
      // 只更新 lastModified，不更新 content 和 displayedModified
      // 这样 lastModified > displayedModified，触发 isDirty 状态
      file.lastModified = data.lastModified;

      // 重新渲染侧边栏（支持简单模式和工作区模式）
      renderSidebar();

      // 如果是当前文件，更新工具栏（显示刷新按钮）
      if (state.currentFile === data.path) {
        updateToolbarButtons();
      }
    }
  });

  // 文件删除
  eventSource.addEventListener('file-deleted', async (e: any) => {
    const data = JSON.parse(e.data);
    const file = state.files.get(data.path);

    if (file) {
      // 标记文件为不存在
      file.isMissing = true;

      // 重新渲染侧边栏（支持简单模式和工作区模式）
      renderSidebar();

      // 如果当前正在查看这个文件，显示提示
      if (state.currentFile === data.path) {
        showError('文件已不存在');
      }
    }
  });

  // 文件打开（CLI 触发）
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
    handleUnifiedInputSubmit?: (value?: string) => void;
    dismissQuickActionConfirm?: () => void;
    switchFile: (path: string) => void;
    removeFile: (path: string) => void;
    showNearbyMenu: (e: Event) => void;
    addFileByPath: (path: string, focus: boolean) => void;
    refreshFile: (path: string) => void;
    handleRefreshButtonClick: () => void;
    handleSyncButtonClick: () => void;
    closeSyncDialog: () => void;
    selectRecentParent: (parentId: string, e?: Event) => void;
    confirmSync: () => void;
    copySyncCommand: () => void;
    copySingleText: (text: string, e?: Event) => void;
    copyFileName: (fileName: string) => void;
    copyErrorInfo: () => void;
    showToast?: (message: string, type: string) => void;
    showSettingsDialog: () => void;
    toggleFontScaleMenu: () => void;
    setFontScale: (scale: number) => void;
  }
}

window.addFile = () => {
  const input = document.getElementById('searchInput') as HTMLInputElement;
  if (input) {
    handleSmartAddInput(input.value).catch((err: any) => {
      showError(`添加失败: ${err?.message || '未知错误'}`);
    });
  }
};
window.handleUnifiedInputSubmit = (value?: string) => {
  const input = document.getElementById('searchInput') as HTMLInputElement | null;
  const raw = (typeof value === 'string' ? value : input?.value || '').trim();
  if (!raw) return;
  if (!looksLikePathInput(raw)) return;
  handleSmartAddInput(raw).catch((err: any) => {
    showError(`添加失败: ${err?.message || '未知错误'}`);
  });
};
window.dismissQuickActionConfirm = () => {
  if (isAddConfirmVisible()) {
    clearAddConfirm();
  }
};
window.switchFile = switchFile;
window.removeFile = removeFileHandler;
window.showNearbyMenu = showNearbyMenu;
window.addFileByPath = addFileByPath;
window.refreshFile = refreshFile;
window.handleRefreshButtonClick = handleRefreshButtonClick;
window.handleSyncButtonClick = handleSyncButtonClick;
window.closeSyncDialog = closeSyncDialog;
window.selectRecentParent = selectRecentParent;
window.confirmSync = confirmSync;
window.copySyncCommand = copySyncCommand;
window.copySingleText = copySingleText;
window.copyFileName = copyFileName;
window.copyErrorInfo = copyErrorInfo;
window.showToast = showToast;
window.showSettingsDialog = showSettingsDialog;
window.toggleFontScaleMenu = toggleFontScaleMenu;
window.setFontScale = setFontScale;

// ==================== 初始化 ====================
(async () => {
  initSidebarWidth();

  // 初始化字体缩放
  initFontScale();

  await restoreState(loadFile);
  await hydrateExpandedWorkspaces();

  // 根据配置渲染侧边栏
  renderSidebar();
  renderContent();

  setupDragAndDrop();
  setupSidebarResize();
  document.addEventListener('click', (e) => {
    if (!isAddConfirmVisible()) return;
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest('.sidebar-header')) return;
    if (target.closest('#quickActionConfirm')) return;
    clearAddConfirm();
  });
  handleURLParams();
  setupKeyboardShortcuts();

  // 页面刷新时，自动刷新当前正在展示的文件
  await refreshCurrentFile();
  connectSSE();
})();
