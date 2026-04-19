import { state } from '../state';
import { saveConfig } from '../config';
import { renderSidebar } from './sidebar';
import { showError, showSuccess } from './toast';
import { MD_THEMES, HL_THEMES } from '../themes/index';

// 打开对话框时保存的原始主题值，用于 Cancel 时恢复
let _savedMarkdownTheme = '';
let _savedCodeTheme = '';
let _savedMathInline = true;

// 初始化：绑定全局函数
if (typeof window !== 'undefined') {
  (window as any).closeSettingsDialog = closeSettingsDialog;
  (window as any).saveSettings = saveSettings;
}

// 显示设置对话框
export function showSettingsDialog(): void {
  // 保存打开时的原始主题值，Cancel 时恢复
  _savedMarkdownTheme = state.config.markdownTheme || 'github';
  _savedCodeTheme = state.config.codeTheme || 'github';
  _savedMathInline = state.config.mathInline !== false;

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
    <div class="settings-group">
      <div class="settings-group-title">外观</div>
      <div class="settings-section-desc">切换 Markdown 正文样式和代码高亮配色。</div>
      <div class="settings-row">
        <label class="settings-label">正文样式</label>
        <select id="markdownThemeSelect" class="settings-select">
          ${MD_THEMES.map(t =>
            `<option value="${t.key}"${state.config.markdownTheme === t.key ? ' selected' : ''}>${t.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="settings-row">
        <label class="settings-label">代码高亮</label>
        <select id="codeThemeSelect" class="settings-select">
          ${HL_THEMES.map(t =>
            `<option value="${t.key}"${state.config.codeTheme === t.key ? ' selected' : ''}>${t.label}</option>`
          ).join('')}
        </select>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">数学公式</div>
      <div class="settings-section-desc">使用 KaTeX 渲染 LaTeX 公式。<code>$$...$$</code> 块级公式始终启用。</div>
      <div class="settings-row">
        <label class="settings-label">行内公式 <code>$...$</code></label>
        <label class="settings-toggle">
          <input type="checkbox" id="mathInlineCheckbox"${state.config.mathInline !== false ? ' checked' : ''}>
          <span class="settings-toggle-label">启用（关闭可避免 <code>$</code> 货币符号误触发）</span>
        </label>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">工作区</div>
      <div class="settings-section-desc">工作区文件树的轮询间隔，用于感知新增/删除文件。文件内容变化由 SSE 实时推送，不受此设置影响。修改后刷新页面生效。</div>
      <div class="settings-row">
        <label class="settings-label">轮询间隔</label>
        <select id="pollIntervalSelect" class="settings-select">
          ${[2000, 5000, 10000, 30000].map(v =>
            `<option value="${v}"${(state.config.workspacePollInterval ?? 5000) === v ? ' selected' : ''}>${v / 1000}s</option>`
          ).join('')}
        </select>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-group-title">客户端状态</div>
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

    <div class="settings-group">
      <div class="settings-group-title">数据清理</div>
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

  const mdSelect = document.getElementById('markdownThemeSelect') as HTMLSelectElement | null;
  const hlSelect = document.getElementById('codeThemeSelect') as HTMLSelectElement | null;

  mdSelect?.addEventListener('change', () => {
    state.config.markdownTheme = mdSelect!.value;
    (window as any).applyTheme?.();
  });

  hlSelect?.addEventListener('change', () => {
    state.config.codeTheme = hlSelect!.value;
    (window as any).applyTheme?.();
  });
}

// 关闭设置对话框（Cancel）：恢复原始主题
export function closeSettingsDialog(): void {
  // 恢复打开时的主题（取消预览）
  if (_savedMarkdownTheme) {
    state.config.markdownTheme = _savedMarkdownTheme;
    state.config.codeTheme = _savedCodeTheme;
    state.config.mathInline = _savedMathInline;
    (window as any).applyTheme?.();
  }
  const overlay = document.getElementById('settingsDialogOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
}

// 保存设置
export function saveSettings(): void {
  const mdSelect = document.getElementById('markdownThemeSelect') as HTMLSelectElement | null;
  const hlSelect = document.getElementById('codeThemeSelect') as HTMLSelectElement | null;
  const mathInlineCheckbox = document.getElementById('mathInlineCheckbox') as HTMLInputElement | null;
  const pollIntervalSelect = document.getElementById('pollIntervalSelect') as HTMLSelectElement | null;
  if (mdSelect) state.config.markdownTheme = mdSelect.value;
  if (hlSelect) state.config.codeTheme = hlSelect.value;
  if (mathInlineCheckbox) state.config.mathInline = mathInlineCheckbox.checked;
  if (pollIntervalSelect) state.config.workspacePollInterval = parseInt(pollIntervalSelect.value, 10);
  saveConfig(state.config);
  renderSidebar();
  // 清掉 saved 值，避免 closeSettingsDialog 误恢复
  _savedMarkdownTheme = '';
  _savedCodeTheme = '';
  _savedMathInline = true;
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
