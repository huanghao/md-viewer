import type { FileData } from './types';
import { state, saveState, getSessionFile } from './state';
import { hydrateExpandedWorkspaces } from './workspace';
import { loadFile } from './api/files';
import { renderSidebar } from './ui/sidebar';
import { renderContent } from './content-renderer';
import { showError, showInfo } from './ui/toast';
import { getDiffViewActive, refreshDiffIfActive } from './diff-view';
import { markWorkspaceModified, clearWorkspacePathMissing, markWorkspacePathMissing } from './workspace-state';

export interface SSEDeps {
  onFileLoaded: (data: FileData, focus?: boolean) => Promise<void>;
  updateToolbarButtons: () => Promise<void>;
}

let _deps: SSEDeps | null = null;

export function initSSEConnection(deps: SSEDeps): void {
  _deps = deps;
}

// ==================== SSE 连接状态 ====================
let sseConnectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' = 'connecting';
let sseRetryCount = 0;
let sseCurrentDelay = 3000;
const SSE_MAX_RETRIES = 10;
const SSE_INITIAL_DELAY = 3000;
const SSE_MAX_DELAY = 30000;
let sseReconnectTimer: ReturnType<typeof setTimeout> | null = null;

function updateConnectionStatus(status: typeof sseConnectionState, retryInfo?: string) {
  sseConnectionState = status;
  const indicator = document.getElementById('connectionIndicator');
  const text = document.getElementById('connectionText');
  const statusEl = document.getElementById('connectionStatus');
  if (!indicator || !text || !statusEl) return;

  indicator.className = 'connection-indicator';
  statusEl.style.cursor = status === 'failed' ? 'pointer' : 'default';
  statusEl.onclick = status === 'failed' ? () => resetAndReconnectSSE() : null;

  if (status === 'connected') {
    indicator.classList.add('connected');
    text.textContent = '';
    statusEl.title = '已连接';
  } else if (status === 'connecting') {
    indicator.classList.add('connecting');
    text.textContent = retryInfo || '重连中...';
    statusEl.title = `正在重新连接... (${retryInfo})`;
  } else if (status === 'failed') {
    indicator.classList.add('disconnected');
    text.textContent = '点击重连';
    statusEl.title = '重连失败，点击手动重连';
  } else {
    indicator.classList.add('disconnected');
    text.textContent = '未连接';
    statusEl.title = '连接已断开';
  }
}

function resetAndReconnectSSE() {
  sseRetryCount = 0;
  sseCurrentDelay = SSE_INITIAL_DELAY;
  if (sseReconnectTimer) {
    clearTimeout(sseReconnectTimer);
    sseReconnectTimer = null;
  }
  connectSSE(true);
}

function scheduleReconnect() {
  if (sseRetryCount >= SSE_MAX_RETRIES) {
    updateConnectionStatus('failed');
    console.error(`SSE 重连失败，已达最大重试次数 (${SSE_MAX_RETRIES})`);
    return;
  }

  sseRetryCount++;
  const retryText = `${sseRetryCount}/${SSE_MAX_RETRIES}`;
  updateConnectionStatus('connecting', retryText);

  console.log(`SSE ${sseRetryCount}/${SSE_MAX_RETRIES} 秒后重连...`);

  sseReconnectTimer = setTimeout(() => {
    sseReconnectTimer = null;
    connectSSE(true);
  }, sseCurrentDelay);

  // 指数退避，但不超过最大值
  sseCurrentDelay = Math.min(sseCurrentDelay * 2, SSE_MAX_DELAY);
}

// 重连时同步所有打开文件的最新状态
async function syncOpenFilesAfterReconnect() {
  const openFiles = Array.from(state.sessionFiles.values());
  if (openFiles.length === 0) return;

  let hasUpdate = false;
  for (const file of openFiles) {
    if (file.isMissing || file.isRemote) continue;

    try {
      const data = await loadFile(file.path, true);
      if (!data) continue;

      // 如果文件有更新
      if (data.lastModified > file.lastModified) {
        file.lastModified = data.lastModified;
        file.pendingContent = data.content;
        hasUpdate = true;
        // 若当前文件正在 diff 模式，刷新 diff 界面
        if (state.currentFile === file.path) refreshDiffIfActive();
      }
    } catch {
      // 忽略单个文件的错误
    }
  }

  if (hasUpdate) {
    saveState();
    renderSidebar();
    await _deps!.updateToolbarButtons();

    // 如果当前文件有更新且未在 diff 模式，给用户提示
    const currentFile = state.currentFile ? state.sessionFiles.get(state.currentFile) : null;
    if (currentFile && currentFile.pendingContent !== undefined && !getDiffViewActive()) {
      showInfo('文件有更新，点击 Diff 查看差异');
    }
  }
}

// ==================== SSE 连接 ====================
export function connectSSE(isReconnect = false) {
  updateConnectionStatus('connecting');
  const eventSource = new EventSource('/api/events');

  eventSource.addEventListener('connected', async () => {
    // 连接成功，重置重连计数器
    if (sseRetryCount > 0) {
      sseRetryCount = 0;
      sseCurrentDelay = SSE_INITIAL_DELAY;
      console.log('SSE 连接恢复');
    }
    updateConnectionStatus('connected');

    // 重连时重新触发工作区扫描，让服务端重新注册 watchWorkspace
    if (isReconnect) {
      void hydrateExpandedWorkspaces();
      // 同步所有打开文件的状态，捕获断连期间的更新
      await syncOpenFilesAfterReconnect();
    }
  });

  // 文件内容变化
  eventSource.addEventListener('file-changed', async (e: any) => {
    const data = JSON.parse(e.data);
    const file = getSessionFile(data.path);

    if (file) {
      // 已打开的文件：更新 lastModified，M 标记由 getFileListStatus 计算
      file.lastModified = data.lastModified;
      // 原子保存后文件重新出现，清除 isMissing 标记
      if (file.isMissing) {
        file.isMissing = false;
        clearWorkspacePathMissing(data.path);
      }
      // 若当前文件正在 diff 模式，fetch 新内容并刷新 diff 界面
      if (getDiffViewActive() && state.currentFile === data.path) {
        const fetched = await loadFile(data.path, true);
        if (fetched) {
          file.pendingContent = fetched.content;
          refreshDiffIfActive();
        }
      }
      saveState();
    } else {
      // 未打开的工作区文件：标记 M，与已打开文件保持一致
      markWorkspaceModified(data.path);
    }

    renderSidebar();
    await _deps!.updateToolbarButtons();
  });

  // 文件删除
  eventSource.addEventListener('file-deleted', async (e: any) => {
    const data = JSON.parse(e.data);
    const file = getSessionFile(data.path);

    if (file) {
      file.isMissing = true;
      saveState();
    } else {
      // 未打开文件的删除态只标记在工作区树中，不污染已打开文件列表。
      markWorkspacePathMissing(data.path);
    }

    // 重新渲染侧边栏（支持简单模式和工作区模式）
    renderSidebar();

    // 如果当前正在查看这个文件，仅提示"已删除"并保留当前正文（不做自动刷新替换）
    if (state.currentFile === data.path) {
      renderContent();
      _deps!.updateToolbarButtons();
      showError('文件已不存在');
    }
  });

  // 文件打开（CLI 触发）
  eventSource.addEventListener('file-opened', async (e: any) => {
    const data = JSON.parse(e.data);
    await _deps!.onFileLoaded(data, data.focus !== false);
  });

  // 服务端请求状态（用于 mdv tabs）
  eventSource.addEventListener('state-request', async (e: any) => {
    const data = JSON.parse(e.data);
    const requestId = data.requestId;

    if (!requestId) return;

    // 立即响应服务端请求
    const openFiles = Array.from(state.sessionFiles.values()).map((file) => ({
      path: file.path,
      name: file.name,
    }));

    try {
      await fetch('/api/session-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          currentFile: state.currentFile,
          openFiles,
        }),
      });
    } catch (error) {
      console.error('响应状态请求失败:', error);
    }
  });

  eventSource.onerror = () => {
    console.error('SSE 连接断开');
    eventSource.close();
    scheduleReconnect();
  };
}
