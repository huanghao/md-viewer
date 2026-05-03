// File switching and navigation logic extracted from main.ts (Task B2)
import type { FileData } from './types';
import {
  state,
  removeFile as removeFileFromState,
  switchToFile,
  setSearchQuery,
} from './state';
import { addWorkspace } from './workspace';
import { loadFile, searchFiles, openFile, detectPathType } from './api/files';
import { renderSidebar } from './ui/sidebar';
import { showSuccess, showError, showInfo } from './ui/toast';
import { renderContent } from './content-renderer';
import { isHtmlPath, isPdfPath, isUrlPath } from './content-renderer';
import { saveState } from './state';
import { getDiffViewActive, setDiffViewActive } from './diff-view';
import { renderTocPanel } from './ui/toc-panel.js';
import { updateToc } from './toc-manager';
import { updateZoomDisplay } from './zoom-controller';
import { onChatFileSwitch } from './ui/chat-panel.js';

export interface FileSwitcherDeps {
  onFileLoaded: (data: FileData, focus?: boolean) => Promise<void>;
  syncAnnotationsForCurrentFile: (force?: boolean) => void;
  updateToolbarButtons: () => Promise<void>;
  evictPdfViewer: (filePath: string) => void;
}

let _deps: FileSwitcherDeps | null = null;

export function initFileSwitcher(deps: FileSwitcherDeps): void {
  _deps = deps;
}

function getDeps(): FileSwitcherDeps {
  if (!_deps) throw new Error('initFileSwitcher not called');
  return _deps;
}

// ==================== Path helpers ====================

export function getWorkspaceNameFromPath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  return parts[parts.length - 1] || 'workspace';
}

// ==================== File operations ====================

export async function openFileInBrowser(path: string): Promise<void> {
  const { clearListDiff } = await import('./workspace-state');
  clearListDiff(path);
  renderSidebar();

  if (isUrlPath(path)) {
    window.open(path, '_blank', 'noopener,noreferrer');
    return;
  }
  try {
    const response = await fetch('/api/open-local-file', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path })
    });
    const data = await response.json();
    if (data?.error) {
      showError(`打开 HTML 失败: ${data.error}`);
    }
  } catch (error: any) {
    showError(`打开 HTML 失败: ${error?.message || '未知错误'}`);
  }
}

export function looksLikePathInput(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^https?:\/\//i.test(v)) return true;
  if (v.startsWith('/') || v.startsWith('~/') || v.startsWith('./') || v.startsWith('../')) return true;
  if (v.includes('/') || v.includes('\\')) return true;
  if (/\.[a-zA-Z0-9]{1,10}$/.test(v)) return true;
  return false;
}

// ==================== Add confirm UI ====================

type PendingAddAction =
  | { kind: 'add-other-file'; path: string; ext: string | null }
  | { kind: 'add-workspace'; path: string };

let pendingAddAction: PendingAddAction | null = null;

export function clearAddConfirm(): void {
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

export function isAddConfirmVisible(): boolean {
  const bar = document.getElementById('quickActionConfirm') as HTMLElement | null;
  return !!bar && bar.style.display !== 'none';
}

export function showAddConfirm(
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
  showSuccess(`已添加工作区: ${workspace.name}`);
  setSearchQuery('');
  renderSidebar();
}

// 添加文件
export async function addFileByPath(path: string, focus: boolean = true) {
  if (!path.trim()) return;

  const data = await loadFile(path);
  if (data) {
    await getDeps().onFileLoaded(data, focus);
    await openFile(path, focus);

    // 清空统一输入框
    setSearchQuery('');
    renderSidebar();
  }
}

export async function handleSmartAddInput(path: string): Promise<void> {
  const trimmed = path.trim();
  if (!trimmed) return;

  const result = await detectPathType(trimmed);
  const detectedPath = result.path || trimmed;

  if (result.kind === 'md_file' || result.kind === 'html_file' || String(result.kind) === 'pdf_file') {
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

// ==================== File switching ====================

// 切换文件
export async function switchFile(path: string) {
  const deps = getDeps();
  // 切换文件时关闭 diff 视图
  if (getDiffViewActive()) {
    setDiffViewActive(false);
    const diffBtn = document.getElementById('diffButton');
    if (diffBtn) diffBtn.classList.remove('active');
    const banner = document.getElementById('diffBanner');
    if (banner) banner.remove();
  }
  switchToFile(path);
  updateZoomDisplay(true);
  renderSidebar();

  // Immediately show loading state to avoid stale TOC during transition
  const tocPanel = document.getElementById('tocPanel');
  if (tocPanel) renderTocPanel(tocPanel, [], () => {}, true);

  // 懒加载：占位 entry 的 content 为空时，先拉内容再渲染
  const entry = state.sessionFiles.get(path);
  if (entry && !entry.content && !entry.isMissing && !isPdfPath(path)) {
    const fileData = await loadFile(path, true);
    if (fileData) {
      entry.content = fileData.content;
      entry.lastModified = Math.max(entry.lastModified, fileData.lastModified);
      entry.displayedModified = fileData.lastModified;
      entry.isMissing = false;
    } else {
      entry.isMissing = true;
    }
    saveState();
  }

  renderContent();
  if (!isPdfPath(path)) updateToc(path);
  deps.syncAnnotationsForCurrentFile(true);
  onChatFileSwitch(path);
  await deps.updateToolbarButtons();
}

// 移除文件（关闭标签页和从列表删除是同一个操作）
export function removeFileHandler(path: string) {
  const deps = getDeps();
  if (isPdfPath(path)) deps.evictPdfViewer(path);
  removeFileFromState(path);
  if (state.currentFile) {
    // Reuse switchFile so lazy-loading triggers for session files with empty content.
    void switchFile(state.currentFile);
  } else {
    renderSidebar();
    renderContent();
    deps.syncAnnotationsForCurrentFile(true);
    const panel = document.getElementById('tocPanel');
    if (panel) renderTocPanel(panel, [], () => {});
  }
}

export function navigateFileInView(direction: 1 | -1): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('#fileList [data-path]'));
  if (items.length === 0) return;
  const paths = items.map(el => el.dataset.path!);
  const currentIdx = state.currentFile ? paths.indexOf(state.currentFile) : -1;
  const nextIdx = currentIdx === -1
    ? (direction === 1 ? 0 : paths.length - 1)
    : Math.max(0, Math.min(paths.length - 1, currentIdx + direction));
  if (paths[nextIdx] && paths[nextIdx] !== state.currentFile) {
    void switchFile(paths[nextIdx]);
  }
}

export function cycleTab(direction: 1 | -1): void {
  const files = state.tabOrder.filter(p => state.sessionFiles.has(p));
  if (files.length <= 1) return;
  const currentIndex = state.currentFile ? files.indexOf(state.currentFile) : -1;
  const nextIndex = (currentIndex + direction + files.length) % files.length;
  void switchFile(files[nextIndex]);
}

export function jumpToTab(n: number): void {
  const files = state.tabOrder.filter(p => state.sessionFiles.has(p));
  if (files.length === 0) return;
  const index = n === 9 ? files.length - 1 : n - 1;
  if (index >= 0 && index < files.length) void switchFile(files[index]);
}

// ==================== File search ====================

// 搜索文件
export async function searchFilesHandler(rawQuery?: string) {
  const input = document.getElementById('searchInput') as HTMLInputElement | null;
  const query = (typeof rawQuery === 'string' ? rawQuery : input?.value || '').trim();
  if (!query) return;

  try {
    const workspaceRoots = state.config.workspaces.map((ws) => ws.path).filter(Boolean);
    const data = await searchFiles(query, {
      roots: workspaceRoots,
      limit: 50,
    });
    if (data.files && data.files.length > 0) {
      // 显示搜索结果（简单实现：添加第一个）
      await addFileByPath(data.files[0].path);
    } else {
      showInfo('没有找到匹配的文件');
    }
  } catch (err: any) {
    showError('搜索失败: ' + err.message);
  }
}

// ==================== 拖拽支持 ====================
export function setupDragAndDrop() {
  document.body.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.body.addEventListener('drop', async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files || []);
    for (const file of files) {
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
        await addFileByPath((file as any).path);
      }
    }
  });
}

// ==================== URL 参数处理 ====================
export function handleURLParams() {
  const params = new URLSearchParams(window.location.search);
  const filePath = params.get('file');
  const focus = params.get('focus') !== 'false';

  if (filePath) {
    addFileByPath(filePath, focus);
    // 清理 URL 参数
    window.history.replaceState({}, '', window.location.pathname);
  }
}
