// ==================== 状态管理 ====================
const state = {
  files: new Map(), // path -> { path, name, content, active, lastModified, isRemote }
  currentFile: null,
};

// ==================== 状态持久化 ====================
const STORAGE_KEY = 'md-viewer:openFiles';

function saveState() {
  const data = {
    files: Array.from(state.files.entries()).map(([path, file]) => [path, {
      path: file.path,
      name: file.name,
      active: file.active,
      isRemote: file.isRemote || false
    }]),
    currentFile: state.currentFile
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

async function restoreState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    if (!data.files || data.files.length === 0) return;

    // 恢复文件列表（重新加载内容）
    const validFiles = [];
    for (const [path, fileInfo] of data.files) {
      const fileData = await loadFile(path, true); // 静默加载，不弹窗
      if (fileData) {
        state.files.set(path, {
          path: fileData.path,
          name: fileData.filename,
          content: fileData.content,
          active: fileInfo.active,
          lastModified: fileData.lastModified,
          isRemote: fileData.isRemote || false
        });
        validFiles.push([path, fileInfo]);
      }
    }

    // 清理不存在的文件：用实际存在的文件覆盖 localStorage
    if (validFiles.length !== data.files.length) {
      const currentFile = state.files.has(data.currentFile)
        ? data.currentFile
        : null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        files: validFiles,
        currentFile
      }));
    }

    // 恢复当前文件
    if (data.currentFile && state.files.has(data.currentFile)) {
      state.currentFile = data.currentFile;
    } else {
      // 如果保存的当前文件不存在了，切换到第一个活跃文件
      const activeFiles = Array.from(state.files.values()).filter(f => f.active);
      state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
    }

    renderFiles();
    renderTabs();
    renderContent();
  } catch (e) {
    console.error('恢复状态失败:', e);
  }
}

// ==================== API 请求 ====================
async function loadFile(path, silent = false) {
  try {
    const response = await fetch(`/api/file?path=${encodeURIComponent(path)}`);
    const data = await response.json();
    if (data.error) {
      if (!silent) alert(data.error);
      return null;
    }
    return data;
  } catch (e) {
    if (!silent) alert(`加载失败: ${e.message}`);
    return null;
  }
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

// ==================== 消息处理 ====================
async function onFileLoaded(data, focus = false) {
  state.files.set(data.path, {
    path: data.path,
    name: data.filename,
    content: data.content,
    active: true,
    lastModified: data.lastModified,
    isRemote: data.isRemote || false
  });

  // 只有 focus=true 时才切换到该文件
  if (focus) {
    state.currentFile = data.path;
  }
  
  saveState();
  renderFiles();
  renderTabs();
  renderContent();
}

// ==================== UI 渲染 ====================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str);
}

function escapeJsSingleQuoted(str) {
  if (!str) return '';
  return String(str)
    .replace(/\\/g, '\\')
    .replace(/'/g, "\\'")
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/</g, '\\x3C');
}

// 为同名文件生成区分名称
function getDisplayNames(files) {
  const fileArray = Array.from(files.values());
  const nameCount = {};
  
  // 统计每个 basename 出现的次数
  fileArray.forEach(file => {
    nameCount[file.name] = (nameCount[file.name] || 0) + 1;
  });
  
  return fileArray.map(file => {
    if (nameCount[file.name] === 1) {
      return { ...file, displayName: file.name };
    }
    
    // 有同名文件，需要找区分
    const parts = file.path.split('/').filter(Boolean);
    const otherFiles = fileArray.filter(f => f.name === file.name && f.path !== file.path);
    
    // 从父目录开始找不同的部分
    let diffPart = '';
    for (let i = parts.length - 2; i >= 0; i--) {
      const part = parts[i];
      const isUnique = otherFiles.every(other => {
        const otherParts = other.path.split('/').filter(Boolean);
        return otherParts[i] !== part;
      });
      if (isUnique) {
        diffPart = part;
        break;
      }
    }
    
    // 如果没找到唯一区分的，就用直接父目录
    if (!diffPart && parts.length >= 2) {
      diffPart = parts[parts.length - 2];
    }
    
    return {
      ...file,
      displayName: diffPart ? file.name + ' (' + diffPart + ')' : file.name
    };
  });
}

function renderFiles() {
  const container = document.getElementById('fileList');
  if (state.files.size === 0) {
    container.innerHTML = '<div class="empty-tip">点击上方添加 Markdown 文件</div>';
    return;
  }

  const filesWithDisplay = getDisplayNames(state.files);
  container.innerHTML = filesWithDisplay
    .map(file => {
      const isCurrent = file.path === state.currentFile;
      const classes = [
        'file-item',
        file.active ? 'active' : '',
        isCurrent ? 'current' : ''
      ].filter(Boolean).join(' ');
      return `
      <div class="${classes}"
           onclick="switchFile('${escapeAttr(file.path)}')">
        <span class="icon">📄</span>
        <span class="name">${file.displayName}</span>
        <span class="close" onclick="event.stopPropagation();removeFile('${escapeAttr(file.path)}')">×</span>
      </div>
    `}).join('');
}

function renderTabs() {
  const activeFiles = Array.from(state.files.values()).filter(f => f.active);
  const container = document.getElementById('tabs');

  if (activeFiles.length === 0) {
    container.innerHTML = '';
    return;
  }

  // 为活跃标签也计算区分名称（基于所有文件）
  const allFilesWithDisplay = getDisplayNames(state.files);
  const displayNameMap = new Map(allFilesWithDisplay.map(f => [f.path, f.displayName]));
  
  container.innerHTML = activeFiles
    .map(file => `
      <div class="tab ${file.path === state.currentFile ? 'active' : ''}"
           onclick="switchFile('${escapeAttr(file.path)}')">
        <span>${displayNameMap.get(file.path) || file.name}</span>
        <span class="close" onclick="event.stopPropagation();closeFile('${escapeAttr(file.path)}')">×</span>
      </div>
    `).join('');
}

function renderContent() {
  const container = document.getElementById('content');
  const file = state.currentFile ? state.files.get(state.currentFile) : null;

  if (!file) {
    updateFileMeta(null);
    renderBreadcrumb(null);
    container.innerHTML = `
      <div class="empty-state">
        <h2>欢迎使用 MD Viewer</h2>
        <p>在左侧添加 Markdown 文件开始阅读</p>
      </div>
    `;
    return;
  }

  try {
    const html = marked.parse(file.content || '');
    container.innerHTML = `
      <div class="markdown-wrapper">
        <div class="markdown-body">${html}</div>
      </div>
    `;
  } catch (e) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>渲染错误</h2>
        <p>${e.message}</p>
      </div>
    `;
  }

  updateFileMeta(file.lastModified);
  renderBreadcrumb(file.path);
  updateSyncButton();
}

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;
  const date = new Date(timestamp);

  // 时间单位（毫秒）
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  // 计算相对时间文本
  let relativeText;
  if (diff < minute) {
    relativeText = '刚刚';
  } else if (diff < hour) {
    relativeText = Math.floor(diff / minute) + '分钟前';
  } else if (diff < day) {
    relativeText = Math.floor(diff / hour) + '小时前';
  } else if (diff < week) {
    relativeText = Math.floor(diff / day) + '天前';
  } else if (diff < 4 * week) {
    relativeText = Math.floor(diff / week) + '周前';
  } else {
    relativeText = Math.floor(diff / (30 * day)) + '个月前';
  }

  // 格式化日期时间
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const timeStr = hours + ':' + minutes;

  // 判断是否是今天/昨天/本周
  const nowDate = new Date(now);
  const isSameDay = date.toDateString() === nowDate.toDateString();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  if (isSameDay) {
    return '今天 ' + timeStr + '（' + relativeText + '）';
  } else if (isYesterday) {
    return '昨天 ' + timeStr + '（' + relativeText + '）';
  } else if (diff < week) {
    return weekDays[date.getDay()] + ' ' + timeStr + '（' + relativeText + '）';
  } else {
    // 更早的显示月-日
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return month + '-' + day + ' ' + timeStr + '（' + relativeText + '）';
  }
}

function updateFileMeta(lastModified) {
  const el = document.getElementById('fileMeta');
  if (!el) return;
  if (!lastModified) {
    el.textContent = '最后修改: -';
    return;
  }
  el.textContent = '最后修改: ' + formatRelativeTime(lastModified);
}

// ==================== 面包屑导航 ====================
function renderBreadcrumb(filePath) {
  const container = document.getElementById('breadcrumb');
  if (!container) return;

  if (!filePath) {
    container.innerHTML = '';
    return;
  }

  const parts = filePath.split('/').filter(Boolean);
  const fileName = parts[parts.length - 1];
  const parentDir = parts.length > 1 ? parts[parts.length - 2] : '';

  // 显示：父目录 / 文件名
  container.innerHTML = `
    <div class="breadcrumb-folder" onclick="toggleNearbyMenu(event)">
      <span>📁</span>
      <span>${parentDir || '(root)'}</span>
      <span>▼</span>
    </div>
    <span class="breadcrumb-separator">/</span>
    <span class="breadcrumb-file">${fileName}</span>
  `;
}

async function toggleNearbyMenu(event) {
  event.stopPropagation();

  // 检查是否已有菜单
  let menu = document.querySelector('.nearby-menu');
  if (menu) {
    menu.classList.toggle('show');
    return;
  }

  // 创建菜单
  menu = document.createElement('div');
  menu.className = 'nearby-menu';

  const breadcrumb = document.getElementById('breadcrumb');
  if (breadcrumb) {
    breadcrumb.appendChild(menu);
  }

  // 加载附近文件
  await loadNearbyFiles(menu);
  menu.classList.add('show');

  // 点击外部关闭菜单
  setTimeout(() => {
    document.addEventListener('click', closeNearbyMenu);
  }, 0);
}

function closeNearbyMenu() {
  const menu = document.querySelector('.nearby-menu');
  if (menu) {
    menu.classList.remove('show');
  }
  document.removeEventListener('click', closeNearbyMenu);
}

async function loadNearbyFiles(menuElement) {
  if (!state.currentFile) return;

  try {
    const response = await fetch(`/api/nearby?path=${encodeURIComponent(state.currentFile)}`);
    const data = await response.json();

    if (data.error) {
      menuElement.innerHTML = `
        <div class="nearby-menu-empty">${data.error}</div>
      `;
      return;
    }

    renderNearbyMenu(menuElement, data);
  } catch (e) {
    menuElement.innerHTML = `
      <div class="nearby-menu-empty">加载失败</div>
    `;
  }
}

function renderNearbyMenu(menuElement, data) {
  const { currentDir, parentDir, subdirs, siblings } = data;
  let html = '';

  // 当前目录的文件
  if (siblings && siblings.length > 0) {
    html += `
      <div class="nearby-menu-section">
        <div class="nearby-menu-title">当前目录 (${currentDir})</div>
    `;
    siblings.forEach(file => {
      const isCurrent = file.path === state.currentFile;
      html += `
        <div class="nearby-menu-item ${isCurrent ? 'current' : ''}"
             onclick="openNearbyFile('${escapeAttr(file.path)}')">
          <span class="icon">📄</span>
          <span class="name">${file.name}</span>
          ${isCurrent ? '<span class="badge">当前</span>' : ''}
        </div>
      `;
    });
    html += '</div>';
  }

  // 父目录
  if (parentDir) {
    html += `
      <div class="nearby-menu-section">
        <div class="nearby-menu-title">父目录</div>
        <div class="nearby-menu-item" onclick="openNearbyFile('${escapeAttr(parentDir)}')">
          <span class="icon">📁</span>
          <span class="name">..</span>
        </div>
      </div>
    `;
  }

  // 子目录
  if (subdirs && subdirs.length > 0) {
    html += `
      <div class="nearby-menu-section">
        <div class="nearby-menu-title">子目录</div>
    `;
    subdirs.forEach(dir => {
      html += `
        <div class="nearby-menu-item" onclick="openNearbyFile('${escapeAttr(dir.path)}')">
          <span class="icon">📁</span>
          <span class="name">${dir.name}</span>
          <span class="badge">${dir.count} 个文件</span>
        </div>
      `;
    });
    html += '</div>';
  }

  if (!html) {
    html = '<div class="nearby-menu-empty">没有附近的文件</div>';
  }

  menuElement.innerHTML = html;
}

async function openNearbyFile(path) {
  closeNearbyMenu();

  // 如果是目录，暂时不处理（未来可以展开）
  if (!path.endsWith('.md')) {
    return;
  }

  // 如果文件已打开，直接切换
  if (state.files.has(path)) {
    switchFile(path);
    return;
  }

  // 加载新文件
  const data = await loadFile(path);
  if (data) {
    onFileLoaded(data, true);
  }
}

// ==================== 用户操作 ====================
async function addFile() {
  const input = document.getElementById('fileInput');
  const path = input.value.trim();
  if (!path) return;

  input.value = '';

  // 加载文件
  const data = await loadFile(path);
  if (data) {
    onFileLoaded(data);
  }
}

function switchFile(path) {
  state.currentFile = path;
  const file = state.files.get(path);
  if (file) {
    file.active = true;
  }
  saveState();
  renderFiles();
  renderTabs();
  renderContent();
}

function closeFile(path) {
  // 右侧标签页关闭：设为 inactive，不从列表删除
  const file = state.files.get(path);
  if (!file) return;

  file.active = false;

  // 如果关闭的是当前文件，切换到其他文件
  if (state.currentFile === path) {
    const activeFiles = Array.from(state.files.values()).filter(f => f.active);
    state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
  }

  saveState();
  renderFiles();
  renderTabs();
  renderContent();
}

function removeFile(path) {
  // 左侧文件列表关闭：直接删除文件
  const file = state.files.get(path);
  if (!file) return;

  // 如果删除的是当前文件，先切换
  if (state.currentFile === path) {
    // 找其他 active 文件，或者找其他任意文件
    const otherActive = Array.from(state.files.values())
      .filter(f => f.active && f.path !== path);
    if (otherActive.length > 0) {
      state.currentFile = otherActive[0].path;
    } else {
      // 没有 active 文件了，找任意其他文件
      const otherFiles = Array.from(state.files.values())
        .filter(f => f.path !== path);
      state.currentFile = otherFiles.length > 0 ? otherFiles[0].path : null;
    }
  }

  // 彻底删除
  state.files.delete(path);

  saveState();
  renderFiles();
  renderTabs();
  renderContent();
}

// ==================== 拖拽支持 ====================
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', async e => {
  e.preventDefault();
  const files = e.dataTransfer?.files;
  if (files) {
    for (const file of files) {
      if (file.name.endsWith('.md')) {
        const data = await loadFile(file.path);
        if (data) {
          onFileLoaded(data);
        }
      }
    }
  }
});

// ==================== URL 参数处理 ====================
async function handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const openPath = params.get('open');
  
  if (openPath) {
    // 从 URL 加载指定文件，默认切换
    const data = await loadFile(openPath);
    if (data) {
      onFileLoaded(data, true);
    }
    // 清除 URL 参数，避免刷新时重复加载
    window.history.replaceState({}, '', '/');
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

  // 获取同步状态
  try {
    const response = await fetch(`/api/sync/status?path=${encodeURIComponent(state.currentFile)}`);
    const data = await response.json();

    if (data.synced) {
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

  // 获取同步状态
  const response = await fetch(`/api/sync/status?path=${encodeURIComponent(state.currentFile)}`);
  const data = await response.json();

  if (data.synced) {
    // 已同步，显示详情对话框
    showSyncedFileDialog(data);
  } else {
    // 未同步，显示同步对话框
    showSyncDialog();
  }
}

// 显示同步对话框
async function showSyncDialog() {
  const file = state.files.get(state.currentFile);
  if (!file) return;

  // 从 Markdown 提取标题
  const titleMatch = file.content.match(/^#\s+(.+)$/m);
  const defaultTitle = titleMatch ? titleMatch[1] : file.name.replace('.md', '');

  // 获取最近位置
  const recentResponse = await fetch('/api/sync/recent-parents');
  const recentData = await recentResponse.json();

  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

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
    recentData.parents.forEach((parent, index) => {
      const isDefault = parent.id === recentData.defaultParentId;
      html += `
        <div class="sync-dialog-recent-item ${isDefault ? 'selected' : ''}" onclick="selectRecentParent('${escapeJsSingleQuoted(parent.id)}', event)">
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
      <label class="sync-dialog-label" style="margin-top: 12px;">或手动输入 Parent ID：</label>
      <input type="text" class="sync-dialog-input" id="syncParentId" placeholder="123456" oninput="updateSyncCommand()">
    </div>

    <div class="sync-dialog-field">
      <div class="sync-dialog-output-header">
        <label class="sync-dialog-label">将执行的命令：</label>
        <button class="sync-dialog-copy-btn" onclick="copySyncCommand()">
          📋 复制
        </button>
      </div>
      <div class="sync-dialog-output" id="syncCommandPreview">km-cli doc create --parent-id "..." --title "..." --markdown-file "${state.currentFile}" --json</div>
    </div>

    <div class="sync-dialog-checkbox">
      <input type="checkbox" id="syncOpenAfter" checked>
      <label for="syncOpenAfter">同步后打开学城页面</label>
    </div>

    <div class="sync-dialog-footer">
      <button class="sync-dialog-button" onclick="closeSyncDialog()">取消</button>
      <button class="sync-dialog-button primary" onclick="executeSyncDialog()">确定</button>
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
          <button class="sync-dialog-copy-btn" onclick="copySyncCommand()">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output" id="syncCommandPreview">km-cli doc create --parent-id "..." --title "..." --markdown-file "${escapeHtml(state.currentFile || '')}" --json</div>
      `;
      checkbox.parentNode.insertBefore(fallback, checkbox);
    }
  }

  overlay.classList.add('show');

  // 监听标题输入变化
  const titleInput = document.getElementById('syncTitle');
  if (titleInput) {
    titleInput.addEventListener('input', updateSyncCommand);
  }

  // 初始更新命令预览
  updateSyncCommand();
}

// 更新同步命令预览
function updateSyncCommand() {
  const titleInput = document.getElementById('syncTitle');
  const manualInput = document.getElementById('syncParentId');
  const preview = document.getElementById('syncCommandPreview');

  if (!preview) return;

  const title = titleInput ? titleInput.value.trim() : '';
  const manualParentId = manualInput ? manualInput.value.trim() : '';

  // 获取选中的 parent-id
  let parentId = manualParentId;
  if (!parentId) {
    const selectedRadio = document.querySelector('input[name="recentParent"]:checked');
    parentId = selectedRadio ? selectedRadio.value : '';
  }

  // 生成命令预览
  const cmd = `km-cli doc create --parent-id "${parentId || '...'}" --title "${title || '...'}" --markdown-file "${state.currentFile}" --json`;
  preview.textContent = cmd;
}

// 复制同步命令
function copySyncCommand() {
  const preview = document.getElementById('syncCommandPreview');
  if (preview) {
    copySingleText(preview.textContent);
  }
}

// 选择最近位置
function selectRecentParent(parentId, e) {
  const items = document.querySelectorAll('.sync-dialog-recent-item');
  items.forEach(item => item.classList.remove('selected'));
  if (e && e.currentTarget) {
    e.currentTarget.classList.add('selected');
  }

  const radio = e && e.currentTarget
    ? e.currentTarget.querySelector('input[type="radio"]')
    : null;
  if (radio) radio.checked = true;

  // 清空手动输入
  const manualInput = document.getElementById('syncParentId');
  if (manualInput) manualInput.value = '';

  // 更新命令预览
  updateSyncCommand();
}

// 执行同步
async function executeSyncDialog() {
  const titleInput = document.getElementById('syncTitle');
  const manualInput = document.getElementById('syncParentId');
  const openAfterCheckbox = document.getElementById('syncOpenAfter');

  const title = titleInput ? titleInput.value.trim() : '';
  const manualParentId = manualInput ? manualInput.value.trim() : '';
  const openAfter = openAfterCheckbox ? openAfterCheckbox.checked : false;

  // 获取选中的 parent-id
  let parentId = manualParentId;
  if (!parentId) {
    const selectedRadio = document.querySelector('input[name="recentParent"]:checked');
    parentId = selectedRadio ? selectedRadio.value : '';
  }

  if (!title) {
    alert('请输入标题');
    return;
  }

  if (!parentId) {
    alert('请选择位置或输入 Parent ID');
    return;
  }

  // 关闭对话框，显示同步中状态
  closeSyncDialog();

  const button = document.getElementById('syncButton');
  const buttonText = document.getElementById('syncButtonText');
  if (button && buttonText) {
    button.className = 'sync-button syncing';
    button.disabled = true;
    buttonText.textContent = '⏳ 同步中...';
  }

  // 调用同步 API
  try {
    const response = await fetch('/api/sync/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath: state.currentFile,
        parentId,
        title,
        openAfterSync: openAfter
      })
    });

    const result = await response.json();

    if (result.success) {
      // 同步成功
      showSyncSuccessDialog(result);
      updateSyncButton();
    } else {
      // 同步失败
      showSyncErrorDialog(result);
    }
  } catch (e) {
    showSyncErrorDialog({
      success: false,
      error: e.message,
      output: e.stack || ''
    });
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

// 显示同步成功对话框
function showSyncSuccessDialog(result) {
  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  title.textContent = '同步成功！';

  body.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
      <div style="font-size: 16px; color: #24292e; margin-bottom: 24px;">文档已成功同步到学城</div>

      <div style="text-align: left; background: #f6f8fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
        <div style="margin-bottom: 8px;">
          <span style="color: #586069;">📄 标题：</span>
          <span style="color: #24292e;">${result.kmTitle}</span>
        </div>
        <div>
          <span style="color: #586069;">🔗 链接：</span>
          <a href="${result.kmUrl}" target="_blank" style="color: #0969da;">${result.kmUrl}</a>
        </div>
      </div>
    </div>

    ${result.command ? `
      <div class="sync-dialog-field">
        <div class="sync-dialog-output-header">
          <label class="sync-dialog-label">执行的命令：</label>
          <button class="sync-dialog-copy-btn" onclick="copySingleText('${escapeJsSingleQuoted(result.command)}', event)">
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
          <button class="sync-dialog-copy-btn" onclick="copySingleText('${escapeJsSingleQuoted(result.output)}', event)">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output">${escapeHtml(result.output)}</div>
      </div>
    ` : ''}

    <div class="sync-dialog-footer">
      <button class="sync-dialog-button" onclick="closeSyncDialog()">关闭</button>
      <button class="sync-dialog-button primary" onclick="window.open('${result.kmUrl}', '_blank');closeSyncDialog();">在学城中打开</button>
    </div>
  `;

  overlay.classList.add('show');

  // 如果勾选了自动打开
  if (result.openAfterSync) {
    setTimeout(() => {
      window.open(result.kmUrl, '_blank');
    }, 500);
  }
}

// 显示同步失败对话框
function showSyncErrorDialog(result) {
  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  title.textContent = '同步失败';

  body.innerHTML = `
    <div class="sync-dialog-error">
      ✗ ${result.error || '同步失败'}
    </div>

    ${result.command ? `
      <div class="sync-dialog-field">
        <div class="sync-dialog-output-header">
          <label class="sync-dialog-label">执行的命令：</label>
          <button class="sync-dialog-copy-btn" onclick="copySingleText('${escapeJsSingleQuoted(result.command)}', event)">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output">${escapeHtml(result.command)}</div>
      </div>
    ` : ''}

    <div class="sync-dialog-field">
      <div class="sync-dialog-output-header">
        <label class="sync-dialog-label">km-cli 返回：</label>
        <button class="sync-dialog-copy-btn" onclick="copySingleText('${escapeJsSingleQuoted(result.output || '无输出')}', event)">
          📋 复制
        </button>
      </div>
      <div class="sync-dialog-output">${escapeHtml(result.output || '无输出')}</div>
    </div>

    <div class="sync-dialog-footer">
      <button class="sync-dialog-button" onclick="copyErrorOutput()">复制错误信息</button>
      <button class="sync-dialog-button primary" onclick="closeSyncDialog()">关闭</button>
    </div>
  `;

  overlay.classList.add('show');
}

// 显示已同步文件详情对话框
function showSyncedFileDialog(syncData) {
  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  title.textContent = '文档已同步';

  body.innerHTML = `
    <div style="padding: 20px 0;">
      <div style="margin-bottom: 16px;">
        <span style="color: #586069;">📄 标题：</span>
        <span style="color: #24292e;">${syncData.kmTitle}</span>
      </div>
      <div style="margin-bottom: 16px;">
        <span style="color: #586069;">🔗 链接：</span>
        <a href="${syncData.kmUrl}" target="_blank" style="color: #0969da;">${syncData.kmUrl}</a>
      </div>
      <div style="margin-bottom: 16px;">
        <span style="color: #586069;">🕐 同步时间：</span>
        <span style="color: #24292e;">${formatRelativeTime(syncData.lastSyncTime)}</span>
      </div>
    </div>

    ${syncData.command ? `
      <div class="sync-dialog-field">
        <div class="sync-dialog-output-header">
          <label class="sync-dialog-label">执行的命令：</label>
          <button class="sync-dialog-copy-btn" onclick="copySingleText('${escapeJsSingleQuoted(syncData.command)}', event)">
            📋 复制
          </button>
        </div>
        <div class="sync-dialog-output">${escapeHtml(syncData.command)}</div>
      </div>
    ` : ''}

    <div class="sync-dialog-footer">
      <button class="sync-dialog-button" onclick="window.open('${syncData.kmUrl}', '_blank')">在学城中打开</button>
      <button class="sync-dialog-button primary" onclick="closeSyncDialog();showSyncDialog();">重新同步</button>
    </div>
  `;

  overlay.classList.add('show');
}

// 关闭对话框
function closeSyncDialog() {
  const overlay = document.getElementById('syncDialogOverlay');
  overlay.classList.remove('show');
}

// 复制错误信息
function copyErrorOutput() {
  const outputs = document.querySelectorAll('.sync-dialog-output');
  if (outputs.length > 0) {
    // 收集所有输出框的内容
    const texts = Array.from(outputs).map(el => el.textContent).join('\n\n');
    navigator.clipboard.writeText(texts).then(() => {
      alert('错误信息已复制到剪贴板');
    });
  }
}

// 复制单个文本
function copySingleText(text, e) {
  navigator.clipboard.writeText(text).then(() => {
    // 临时显示复制成功提示
    const btn = e && e.target ? e.target.closest('.sync-dialog-copy-btn') : null;
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = '✓ 已复制';
      btn.style.color = '#2ea44f';
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.style.color = '';
      }, 1500);
    }
  }).catch(() => {
    alert('复制失败');
  });
}

// ==================== SSE 连接 ====================
function connectSSE() {
  const evtSource = new EventSource('/api/events');

  evtSource.onmessage = (e) => {
    try {
      const { type, data, focus } = JSON.parse(e.data);
      if (type === 'file-opened') {
        onFileLoaded(data, focus);
      }
    } catch (err) {
      console.error('SSE 消息解析错误:', err);
    }
  };

  evtSource.onerror = () => {
    console.log('SSE 连接断开，5秒后重连...');
    evtSource.close();
    setTimeout(connectSSE, 5000);
  };
}

// ==================== 暴露全局函数 ====================
// 这些函数需要在 HTML onclick 中调用，所以必须暴露到全局
window.handleSyncButtonClick = handleSyncButtonClick;
window.closeSyncDialog = closeSyncDialog;
window.showSyncDialog = showSyncDialog;
window.selectRecentParent = selectRecentParent;
window.executeSyncDialog = executeSyncDialog;
window.copyErrorOutput = copyErrorOutput;
window.copySingleText = copySingleText;
window.updateSyncCommand = updateSyncCommand;
window.copySyncCommand = copySyncCommand;

// ==================== 初始化 ====================
(async function init() {
  await restoreState();
  await handleUrlParams();
  // 页面刷新时，自动刷新当前正在展示的文件
  await refreshCurrentFile();
  connectSSE();
})();
