import { state } from '../state';
import { saveConfig } from '../config';
import { renderSidebar } from './sidebar';
import { showError, showSuccess } from './toast';

// 初始化：绑定全局函数
if (typeof window !== 'undefined') {
  (window as any).closeSettingsDialog = closeSettingsDialog;
  (window as any).saveSettings = saveSettings;
}

// 显示设置对话框
export function showSettingsDialog(): void {
  const overlay = document.getElementById('settingsDialogOverlay');
  if (!overlay) {
    createSettingsDialog();
  }

  renderSettingsDialog();

  const overlayEl = document.getElementById('settingsDialogOverlay');
  if (overlayEl) {
    overlayEl.classList.add('show');
  }
}

// 创建设置对话框 DOM
function createSettingsDialog(): void {
  const overlay = document.createElement('div');
  overlay.id = 'settingsDialogOverlay';
  overlay.className = 'sync-dialog-overlay';  // 复用同步对话框样式
  overlay.innerHTML = `
    <div class="sync-dialog">
      <div class="sync-dialog-header">
        <div class="sync-dialog-title">设置</div>
        <button class="sync-dialog-close" onclick="closeSettingsDialog()">×</button>
      </div>
      <div class="sync-dialog-body" id="settingsDialogBody">
        <!-- 动态内容 -->
      </div>
      <div class="sync-dialog-footer">
        <button class="sync-dialog-button" onclick="closeSettingsDialog()">取消</button>
        <button class="sync-dialog-button primary" onclick="saveSettings()">保存</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // 点击遮罩关闭
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeSettingsDialog();
    }
  });
}

// 渲染设置对话框内容
function renderSettingsDialog(): void {
  const body = document.getElementById('settingsDialogBody');
  if (!body) return;

  const snapshot = getClientStateSnapshot();
  body.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-title">焦点视图</div>
      <div class="settings-section-desc">工作区精简视图，只显示最近有改动的文件。</div>
      <div class="settings-kv-grid">
        <div>时间窗口</div>
        <div>
          <select id="focusWindowSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
            <option value="1" ${state.config.focusWindowHours === 1 ? 'selected' : ''}>1 小时</option>
            <option value="4" ${state.config.focusWindowHours === 4 ? 'selected' : ''}>4 小时（默认）</option>
            <option value="24" ${state.config.focusWindowHours === 24 ? 'selected' : ''}>24 小时</option>
          </select>
        </div>
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">客户端状态</div>
      <div class="settings-section-desc">用于排查本地缓存是否脏数据，可直接清理。</div>
      <div class="settings-kv-grid">
        <div>当前文件</div><div>${escapeHtml(snapshot.currentFile || '无')}</div>
        <div>已打开文件数</div><div>${snapshot.openFilesCount}</div>
        <div>工作区数</div><div>${snapshot.workspaceCount}</div>
        <div>评论相关本地键数</div><div>${snapshot.commentStateKeyCount}</div>
        <div>md-viewer 本地键数</div><div>${snapshot.mdvKeyCount}</div>
        <div>localStorage 总键数</div><div>${snapshot.localStorageKeyCount}</div>
      </div>
      <div class="settings-key-list">
        ${snapshot.mdvKeys.map((key) => `<span class="settings-key-chip">${escapeHtml(key)}</span>`).join('')}
      </div>
    </div>
    <div class="settings-section">
      <div class="settings-section-title">数据清理</div>
      <div class="settings-section-desc">评论状态清理会同时删除服务端 SQLite 评论数据和客户端评论相关状态，随后自动刷新页面。</div>
      <div class="settings-actions-row">
        <button class="sync-dialog-button" id="clearAllCommentsBtn">清空评论状态</button>
        <button class="sync-dialog-button" id="clearClientStateBtn">清理客户端状态</button>
      </div>
    </div>
  `;

  const clearClientStateBtn = document.getElementById('clearClientStateBtn');
  clearClientStateBtn?.addEventListener('click', () => {
    clearClientState();
  });
  const clearAllCommentsBtn = document.getElementById('clearAllCommentsBtn');
  clearAllCommentsBtn?.addEventListener('click', () => {
    void clearAllComments();
  });
}

// 关闭设置对话框
export function closeSettingsDialog(): void {
  const overlay = document.getElementById('settingsDialogOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

// 保存设置
export function saveSettings(): void {
  const focusWindowSelect = document.getElementById('focusWindowSelect') as HTMLSelectElement | null;
  if (focusWindowSelect) {
    state.config.focusWindowHours = Number(focusWindowSelect.value) || 4;
  }
  saveConfig(state.config);
  renderSidebar();
  closeSettingsDialog();
}

interface ClientStateSnapshot {
  currentFile: string | null;
  openFilesCount: number;
  workspaceCount: number;
  commentStateKeyCount: number;
  mdvKeyCount: number;
  localStorageKeyCount: number;
  mdvKeys: string[];
}

function getClientStateSnapshot(): ClientStateSnapshot {
  const allKeys: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key) allKeys.push(key);
  }
  allKeys.sort();
  const mdvKeys = allKeys.filter((key) => key.startsWith('md-viewer:'));
  const commentStateKeyCount = mdvKeys.filter((key) => (
    key === 'md-viewer:annotation-panel-open-by-file' ||
    key === 'md-viewer:annotation-density' ||
    key === 'md-viewer:annotation-sidebar-width' ||
    key.startsWith('md-viewer:annotations:')
  )).length;
  return {
    currentFile: state.currentFile,
    openFilesCount: state.sessionFiles.size,
    workspaceCount: state.config.workspaces.length,
    commentStateKeyCount,
    mdvKeyCount: mdvKeys.length,
    localStorageKeyCount: allKeys.length,
    mdvKeys,
  };
}

function clearClientState(): void {
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (!key) continue;
    if (key.startsWith('md-viewer:')) toDelete.push(key);
  }
  for (const key of toDelete) {
    localStorage.removeItem(key);
  }
  showSuccess(`已清理客户端状态（${toDelete.length} 项）`, 1800);
  window.setTimeout(() => window.location.reload(), 250);
}

async function clearAllComments(): Promise<void> {
  try {
    const response = await fetch('/api/annotations/clear', { method: 'POST' });
    const data = await response.json();
    if (!response.ok || data?.success !== true) {
      throw new Error(data?.error || `HTTP ${response.status}`);
    }
    const keysToDelete: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('md-viewer:annotations:')) keysToDelete.push(key);
      if (key === 'md-viewer:annotation-panel-open-by-file') keysToDelete.push(key);
      if (key === 'md-viewer:annotation-density') keysToDelete.push(key);
      if (key === 'md-viewer:annotation-sidebar-width') keysToDelete.push(key);
    }
    for (const key of keysToDelete) {
      localStorage.removeItem(key);
    }
    showSuccess(`已清空评论状态（服务端 ${data?.deleted || 0} 条，本地 ${keysToDelete.length} 项）`, 1800);
    window.setTimeout(() => window.location.reload(), 250);
  } catch (error: any) {
    showError(`清空评论状态失败: ${error?.message || '未知错误'}`, 2600);
  }
}

function escapeHtml(input: string): string {
  return String(input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
