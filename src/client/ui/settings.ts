import { state } from '../state';
import { saveConfig } from '../config';
import { renderSidebar } from './sidebar';

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

  const config = state.config;

  body.innerHTML = `
    <div class="settings-section">
      <h3 class="settings-section-title">侧边栏模式</h3>
      <p class="settings-section-desc">选择侧边栏的显示方式</p>

      <div class="settings-radio-group">
        <label class="settings-radio-item">
          <input type="radio" name="sidebarMode" value="simple" ${config.sidebarMode === 'simple' ? 'checked' : ''}>
          <div class="settings-radio-content">
            <div class="settings-radio-title">简单模式</div>
            <div class="settings-radio-desc">输入框 + 文件列表，简洁快速</div>
          </div>
        </label>

        <label class="settings-radio-item">
          <input type="radio" name="sidebarMode" value="workspace" ${config.sidebarMode === 'workspace' ? 'checked' : ''}>
          <div class="settings-radio-content">
            <div class="settings-radio-title">工作区模式</div>
            <div class="settings-radio-desc">工作区 + 目录树 + 已打开文件，适合多工程协作</div>
          </div>
        </label>
      </div>
    </div>

    ${config.sidebarMode === 'workspace' ? renderWorkspaceSettings() : ''}
  `;
}

// 渲染工作区设置
function renderWorkspaceSettings(): string {
  const workspaces = state.config.workspaces;

  return `
    <div class="settings-section">
      <h3 class="settings-section-title">工作区管理</h3>
      <p class="settings-section-desc">管理你的工作区列表</p>

      ${workspaces.length === 0 ? `
        <div class="settings-empty">
          <p>暂无工作区</p>
          <p style="font-size: 12px; color: #57606a; margin-top: 8px;">
            切换到工作区模式后，点击侧边栏的 ➕ 按钮添加工作区
          </p>
        </div>
      ` : `
        <div class="settings-workspace-list">
          ${workspaces.map((ws, index) => `
            <div class="settings-workspace-item">
              <div class="settings-workspace-info">
                <div class="settings-workspace-name">📁 ${ws.name}</div>
                <div class="settings-workspace-path">${ws.path}</div>
              </div>
              <button class="settings-workspace-remove" onclick="removeWorkspaceFromSettings(${index})" title="移除">
                ×
              </button>
            </div>
          `).join('')}
        </div>
      `}
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
  // 获取侧边栏模式
  const modeRadio = document.querySelector('input[name="sidebarMode"]:checked') as HTMLInputElement;
  if (!modeRadio) return;

  const oldMode = state.config.sidebarMode;
  const newMode = modeRadio.value as 'simple' | 'workspace';

  // 更新配置
  state.config.sidebarMode = newMode;
  saveConfig(state.config);

  // 如果模式改变了，提示需要刷新
  if (oldMode !== newMode) {
    closeSettingsDialog();

    // 显示提示并刷新页面
    if (confirm('侧边栏模式已更改，需要刷新页面生效。是否立即刷新？')) {
      window.location.reload();
    }
  } else {
    closeSettingsDialog();
  }
}

// 从设置中移除工作区
export function removeWorkspaceFromSettings(index: number): void {
  if (confirm('确定要移除这个工作区吗？')) {
    state.config.workspaces.splice(index, 1);
    saveConfig(state.config);
    renderSettingsDialog();
  }
}

// 绑定全局函数
(window as any).closeSettingsDialog = closeSettingsDialog;
(window as any).saveSettings = saveSettings;
(window as any).removeWorkspaceFromSettings = removeWorkspaceFromSettings;
