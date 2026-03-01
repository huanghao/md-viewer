import { state } from '../state';
import { saveConfig } from '../config';
import { renderSidebar } from './sidebar';

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

  body.innerHTML = `
    <div class="settings-empty">
      <div>更多设置项正在整理中</div>
      <div style="margin-top: 8px; font-size: 12px;">侧栏模式请在左侧模式行中切换</div>
    </div>
  `;
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
  saveConfig(state.config);
  renderSidebar();
  closeSettingsDialog();
}
