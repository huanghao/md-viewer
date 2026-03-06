// 导入类型
import type { FileData, SyncHistoryItem } from './types';

// 导入状态管理
import { state, saveState, restoreState, addOrUpdateFile, removeFile as removeFileFromState, switchToFile, setSearchQuery, markFileMissing, getSessionFile } from './state';
import { clearListDiff, markWorkspacePathMissing } from './workspace-state';
import { addWorkspace, hydrateExpandedWorkspaces, scanWorkspace, revealFileInWorkspace } from './workspace';

// 导入 API
import { loadFile, searchFiles, getNearbyFiles, openFile, detectPathType } from './api/files';
import { getSyncStatus, getRecentParents, getSyncParentMeta, executeSync, getSyncPreferences, saveSyncPreference } from './api/sync';

// 导入工具函数
import { escapeHtml, escapeAttr, escapeJsSingleQuoted } from './utils/escape';
import { formatRelativeTime, formatFileTime } from './utils/format';
import { generateDistinctNames } from './utils/file-names';

// 导入 UI 组件
import { renderSidebar } from './ui/sidebar';
import { showToast, showSuccess, showError, showWarning, showInfo } from './ui/toast';
import { showSettingsDialog, closeSettingsDialog } from './ui/settings';

// 导入批注功能
import {
  initAnnotationElements,
  applyAnnotations,
  renderAnnotationList,
  handleSelectionForAnnotation,
  setAnnotations,
  getAnnotationCurrentFilePath,
  syncAnnotationSidebarLayout,
  dismissAnnotationPopupByEscape,
} from './annotation';

const SIDEBAR_WIDTH_STORAGE_KEY = 'md-viewer:sidebar-width';
const SIDEBAR_DEFAULT_WIDTH = 260;
const SIDEBAR_MIN_WIDTH = 220;
const SIDEBAR_MAX_WIDTH = 680;
const fileRefreshSeq = new Map<string, number>();
const PARENT_URL_SKIP_SEGMENTS = new Set(['doc', 'docs', 'page', 'pages', 'content', 'wiki']);
let workspacePollRunning = false;
let mermaidInitialized = false;
let syncDialogInteractionBound = false;
function syncAnnotationsForCurrentFile(force = false): void {
  const nextPath = state.currentFile && !isHtmlPath(state.currentFile) ? state.currentFile : null;
  const currentAnnotationFilePath = getAnnotationCurrentFilePath();
  if (force || nextPath !== currentAnnotationFilePath) {
    setAnnotations(nextPath);
  }
  // 重新应用批注到当前正文，避免文件切换后残留上一个文件的高亮/状态。
  applyAnnotations();
  renderAnnotationList(nextPath);
}

// ==================== 消息处理 ====================
async function onFileLoaded(data: FileData, focus: boolean = false) {
  const previousFile = state.currentFile;
  const shouldFocus = focus && !isHtmlPath(data.path);
  addOrUpdateFile(data, shouldFocus);
  if (shouldFocus && state.config.sidebarMode === 'workspace') {
    await revealFileInWorkspace(data.path);
  }
  if (shouldFocus && previousFile !== data.path) {
  }
  renderSidebar();
  renderContent();
  syncAnnotationsForCurrentFile(shouldFocus && previousFile !== data.path);
  if (shouldFocus && previousFile !== data.path) {
    scrollContentToTop();
  }
}

function scrollContentToTop(): void {
  const container = document.getElementById('content');
  if (!container) return;
  container.scrollTo({ top: 0, behavior: 'auto' });
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
  await syncFileFromDisk(state.currentFile, { silent: true, highlight: false });
}

// 手动刷新文件（用户点击刷新按钮）
async function refreshFile(path: string) {
  const updated = await syncFileFromDisk(path, { silent: false, highlight: true });
  if (updated && state.currentFile === path) {
    showSuccess('文件已刷新', 2000);
  }
}

function flashContentUpdated(): void {
  const container = document.getElementById('content');
  if (!container) return;
  container.style.animation = 'flash 700ms ease-out';
  setTimeout(() => {
    container.style.animation = '';
  }, 700);
}

async function syncFileFromDisk(
  path: string,
  options: { silent?: boolean; highlight?: boolean } = {}
): Promise<boolean> {
  const file = state.sessionFiles.get(path);
  if (!file || file.isMissing) return false;

  const nextSeq = (fileRefreshSeq.get(path) || 0) + 1;
  fileRefreshSeq.set(path, nextSeq);

  const data = await loadFile(path, options.silent !== false);
  if (!data) return false;

  if (fileRefreshSeq.get(path) !== nextSeq) return false;

  const targetFile = state.sessionFiles.get(path) || state.sessionFiles.get(data.path);
  if (!targetFile) return false;

  targetFile.content = data.content;
  targetFile.lastModified = data.lastModified;
  targetFile.displayedModified = data.lastModified;
  targetFile.isMissing = false;
  saveState();

  if (state.currentFile === path || state.currentFile === data.path) {
    renderContent();
    syncAnnotationsForCurrentFile(false);
    if (options.highlight) {
      flashContentUpdated();
    }
  }

  renderSidebar();
  await updateToolbarButtons();
  return true;
}

// ==================== UI 渲染 ====================

// 渲染所有 UI（供工作区模式调用）
export function renderAll() {
  renderSidebar();
  renderContent();
  syncAnnotationsForCurrentFile(false);
}

function isMarkdownContent(file: { name: string; path: string }): boolean {
  const lower = `${file.name} ${file.path}`.toLowerCase();
  return lower.includes('.md') || lower.includes('.markdown');
}

function normalizeParentIdInput(raw: string): string {
  const input = (raw || '').trim();
  if (!input) return '';

  const pickFromPath = (path: string): string => {
    const segments = path
      .split('/')
      .map((s) => decodeURIComponent(s).trim())
      .filter(Boolean);
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (!seg) continue;
      if (PARENT_URL_SKIP_SEGMENTS.has(seg.toLowerCase())) continue;
      return seg;
    }
    return '';
  };

  if (/^https?:\/\//i.test(input)) {
    try {
      const url = new URL(input);
      const picked = pickFromPath(url.pathname);
      return picked || input;
    } catch {
      return input;
    }
  }

  if (input.includes('/')) {
    const picked = pickFromPath(input);
    return picked || input;
  }

  return input;
}

function stripVersionSuffix(title: string): string {
  const trimmed = (title || '').trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(/-v\d+$/i, '').trim();
}

function normalizeJoinedPath(baseDir: string, relativePath: string): string {
  const merged = `${baseDir}/${relativePath}`;
  const isAbsolute = merged.startsWith('/');
  const parts = merged.split('/');
  const stack: string[] = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0) stack.pop();
      continue;
    }
    stack.push(part);
  }
  return `${isAbsolute ? '/' : ''}${stack.join('/')}`;
}

function resolveMarkdownAssetSrc(src: string, currentFilePath: string): string | null {
  const trimmed = src.trim();
  if (!trimmed) return null;

  // 保留可直接访问或内嵌的来源
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('/api/')
  ) {
    return null;
  }

  // 当前仅为本地文件提供相对资源解析
  if (isUrlPath(currentFilePath)) {
    return null;
  }

  const qIndex = trimmed.indexOf('?');
  const hIndex = trimmed.indexOf('#');
  const cutIndex = [qIndex, hIndex].filter((i) => i >= 0).sort((a, b) => a - b)[0] ?? -1;
  const pathPart = cutIndex >= 0 ? trimmed.slice(0, cutIndex) : trimmed;
  const suffix = cutIndex >= 0 ? trimmed.slice(cutIndex) : '';

  const baseDir = currentFilePath.slice(0, currentFilePath.lastIndexOf('/'));
  const absPath = pathPart.startsWith('/')
    ? pathPart
    : normalizeJoinedPath(baseDir, pathPart);

  return `/api/file-asset?path=${encodeURIComponent(absPath)}${suffix}`;
}

function rewriteMarkdownAssetUrls(container: HTMLElement, currentFilePath: string): void {
  const root = container.querySelector('.markdown-body');
  if (!root) return;

  root.querySelectorAll('img[src], video[src], source[src]').forEach((el) => {
    const source = el.getAttribute('src');
    if (!source) return;
    const resolved = resolveMarkdownAssetSrc(source, currentFilePath);
    if (!resolved) return;
    el.setAttribute('src', resolved);
  });
}

async function renderMermaidDiagrams(container: HTMLElement): Promise<void> {
  const mermaid = (window as any).mermaid;
  if (!mermaid) return;

  const codeBlocks = Array.from(
    container.querySelectorAll(
      '.markdown-body pre > code.language-mermaid, .markdown-body pre > code.lang-mermaid, .markdown-body pre > code.language-flowchart, .markdown-body pre > code.lang-flowchart'
    )
  ) as HTMLElement[];
  if (codeBlocks.length === 0) return;

  if (!mermaidInitialized) {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose'
    });
    mermaidInitialized = true;
  }

  const setCopiedState = (button: HTMLButtonElement): void => {
    const original = button.textContent || '复制';
    button.textContent = '✓';
    button.classList.add('copied');
    window.setTimeout(() => {
      button.textContent = original;
      button.classList.remove('copied');
    }, 900);
  };

  const createMermaidSourcePanel = (
    source: string,
    showByDefault: boolean
  ): { panel: HTMLDivElement; toggleButton: HTMLButtonElement } => {
    const panel = document.createElement('div');
    panel.className = 'mermaid-source-panel';
    panel.style.display = showByDefault ? 'block' : 'none';

    const head = document.createElement('div');
    head.className = 'mermaid-source-head';
    const title = document.createElement('span');
    title.textContent = 'Mermaid 源码';
    const copyBtn = document.createElement('button');
    copyBtn.className = 'mermaid-source-copy';
    copyBtn.textContent = '复制';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(source);
        setCopiedState(copyBtn);
      } catch {
        // ignore clipboard errors
      }
    });
    head.appendChild(title);
    head.appendChild(copyBtn);

    const sourcePre = document.createElement('pre');
    const sourceCode = document.createElement('code');
    sourceCode.className = 'language-mermaid';
    sourceCode.textContent = source;
    sourcePre.appendChild(sourceCode);
    panel.appendChild(head);
    panel.appendChild(sourcePre);

    const toggleButton = document.createElement('button');
    toggleButton.className = 'mermaid-source-toggle';
    toggleButton.textContent = showByDefault ? '隐藏源码' : '源码';
    toggleButton.addEventListener('click', () => {
      const shown = panel.style.display !== 'none';
      panel.style.display = shown ? 'none' : 'block';
      toggleButton.textContent = shown ? '源码' : '隐藏源码';
    });

    return { panel, toggleButton };
  };

  for (let i = 0; i < codeBlocks.length; i += 1) {
    const codeEl = codeBlocks[i];
    const preEl = codeEl.closest('pre');
    if (!preEl) continue;
    const sourceRaw = (codeEl.textContent || '').trim();
    if (!sourceRaw) continue;
    const isFlowchartFence =
      codeEl.classList.contains('language-flowchart') || codeEl.classList.contains('lang-flowchart');
    const firstLine = sourceRaw.split('\n').find((line) => line.trim().length > 0)?.trim().toLowerCase() || '';
    const source = isFlowchartFence && !firstLine.startsWith('flowchart') && !firstLine.startsWith('graph')
      ? `flowchart TD\n${sourceRaw}`
      : sourceRaw;
    if (!source) continue;

    try {
      const renderId = `mdv-mermaid-${Date.now()}-${i}`;
      const { svg, bindFunctions } = await mermaid.render(renderId, source);
      const block = document.createElement('div');
      block.className = 'mermaid-block';
      const actions = document.createElement('div');
      actions.className = 'mermaid-actions';
      const { panel, toggleButton } = createMermaidSourcePanel(source, false);
      actions.appendChild(toggleButton);

      const host = document.createElement('div');
      host.className = 'mermaid';
      host.setAttribute('data-mdv-mermaid', '1');
      host.innerHTML = svg;
      block.appendChild(actions);
      block.appendChild(host);
      block.appendChild(panel);
      preEl.replaceWith(block);

      if (typeof bindFunctions === 'function') {
        bindFunctions(host);
      }
    } catch (error) {
      // 语法错误时回退显示源码，并给出明确提示
      const block = document.createElement('div');
      block.className = 'mermaid-fallback-block';
      const actions = document.createElement('div');
      actions.className = 'mermaid-actions';
      const { panel, toggleButton } = createMermaidSourcePanel(source, true);
      actions.appendChild(toggleButton);

      const notice = document.createElement('div');
      notice.className = 'mermaid-fallback-notice';
      notice.textContent = 'Mermaid 语法错误，已回退为原文显示';
      block.appendChild(actions);
      block.appendChild(notice);
      block.appendChild(panel);
      preEl.replaceWith(block);
      console.error('Mermaid 渲染失败，已回退原文:', error);
    }
  }
}

function renderContent() {
  const container = document.getElementById('content');
  if (!container) return;

  if (!state.currentFile) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>欢迎使用 MD Viewer</h2>
        <p>在左侧添加 Markdown/HTML 文件开始阅读</p>
      </div>
    `;
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  if (isHtmlPath(file.path)) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>HTML 文件仅支持外部打开</h2>
        <p>请在列表中点击该文件，在浏览器新页面查看</p>
      </div>
    `;
    const meta = document.getElementById('fileMeta');
    if (meta) {
      meta.textContent = formatRelativeTime(file.lastModified);
    }
    renderBreadcrumb();
    updateToolbarButtons();
    return;
  }

  // 使用 marked 渲染 Markdown
  const html = (window as any).marked.parse(file.content);
  const deletedNotice = file.isMissing
    ? `
      <div class="content-file-status deleted">
        该文件已从磁盘删除，当前内容为本地缓存快照。
      </div>
    `
    : '';
  container.innerHTML = `${deletedNotice}<div class="markdown-body" id="reader">${html}</div>`;
  container.setAttribute('data-current-file', file.path);
  rewriteMarkdownAssetUrls(container, file.path);
  void renderMermaidDiagrams(container);

  // 应用批注高亮
  applyAnnotations();

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

  const file = state.sessionFiles.get(state.currentFile);
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

function isHtmlPath(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm');
}

function isUrlPath(path: string): boolean {
  return /^https?:\/\//i.test(path);
}

async function openFileInBrowser(path: string): Promise<void> {
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
    const shouldFocus = focus && !isHtmlPath(data.path || path);
    await onFileLoaded(data, shouldFocus);
    await openFile(path, focus);

    if (focus && isHtmlPath(data.path || path)) {
      openFileInBrowser(data.path || path);
    }

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

  if (result.kind === 'md_file' || result.kind === 'html_file') {
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
  removeSyncInfoPopover();
  if (isHtmlPath(path)) {
    openFileInBrowser(path);
    syncAnnotationsForCurrentFile(true);
    return;
  }
  const previousFile = state.currentFile;
  switchToFile(path);
  renderSidebar();

  renderContent();
  syncAnnotationsForCurrentFile(true);
  if (previousFile !== path) {
    scrollContentToTop();
  }
  const file = state.sessionFiles.get(path);
  if (file && !file.isMissing && file.lastModified > file.displayedModified) {
    void syncFileFromDisk(path, { silent: true, highlight: true });
  }
}

// 移除文件（关闭标签页和从列表删除是同一个操作）
function removeFileHandler(path: string) {
  removeFileFromState(path);
  renderSidebar();
  renderContent();
}

// 搜索文件
async function searchFilesHandler(rawQuery?: string) {
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
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown') || lowerName.endsWith('.html') || lowerName.endsWith('.htm')) {
        await addFileByPath((file as any).path);
      }
    }
  });
}

// ==================== 键盘快捷键 ====================
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (dismissAnnotationPopupByEscape()) {
        e.preventDefault();
        return;
      }
      if (syncInfoPopoverEl) {
        e.preventDefault();
        removeSyncInfoPopover();
        return;
      }
      const syncOverlay = document.getElementById('syncDialogOverlay');
      if (syncOverlay?.classList.contains('show')) {
        e.preventDefault();
        closeSyncDialog();
        return;
      }
      const settingsOverlay = document.getElementById('settingsDialogOverlay');
      if (settingsOverlay?.classList.contains('show')) {
        e.preventDefault();
        closeSettingsDialog();
        return;
      }
      const addWorkspaceOverlay = document.getElementById('addWorkspaceDialogOverlay');
      if (addWorkspaceOverlay?.classList.contains('show')) {
        e.preventDefault();
        addWorkspaceOverlay.classList.remove('show');
        return;
      }
    }

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
let syncInfoPopoverEl: HTMLElement | null = null;

function removeSyncInfoPopover(): void {
  if (syncInfoPopoverEl) {
    syncInfoPopoverEl.remove();
    syncInfoPopoverEl = null;
  }
}

function getSyncDocTitle(syncData: any): string {
  const raw = (syncData?.title || syncData?.kmTitle || '').toString().trim();
  if (raw) return raw;
  const id = (syncData?.docId || syncData?.kmDocId || '').toString().trim();
  return id ? `文档 ${id}` : '已同步文档';
}

function showSyncedInfoPopover(syncData: any): void {
  const button = document.getElementById('syncButton') as HTMLButtonElement | null;
  if (!button) return;

  const docUrl = (syncData?.url || syncData?.kmUrl || '').toString().trim();
  if (!docUrl) {
    showWarning('未找到文档链接');
    return;
  }

  const lastSyncTime = Number(syncData?.lastSyncTime);
  const humanTime = Number.isFinite(lastSyncTime) && lastSyncTime > 0
    ? `${formatRelativeTime(lastSyncTime)} (${formatFileTime(lastSyncTime)})`
    : '未知';
  const docTitle = getSyncDocTitle(syncData);

  const existed = syncInfoPopoverEl;
  removeSyncInfoPopover();
  if (existed) return;

  const popover = document.createElement('div');
  popover.className = 'sync-info-popover';
  popover.innerHTML = `
    <a href="${escapeAttr(docUrl)}" target="_blank" class="sync-info-popover-link">${escapeHtml(docTitle)}</a>
    <div class="sync-info-popover-time">同步时间：${escapeHtml(humanTime)}</div>
  `;

  document.body.appendChild(popover);
  syncInfoPopoverEl = popover;

  const rect = button.getBoundingClientRect();
  const width = Math.max(260, Math.min(360, Math.floor(window.innerWidth * 0.42)));
  popover.style.width = `${width}px`;
  popover.style.position = 'fixed';
  popover.style.top = `${rect.bottom + 8}px`;
  popover.style.left = `${Math.max(12, Math.min(window.innerWidth - width - 12, rect.right - width))}px`;
}

function renderSyncCopyButton(onClick: string, tooltip = '复制'): string {
  return `
    <button class="copy-filename-button sync-copy-button" onclick="${onClick}">
      <span class="copy-icon"></span>
      <span class="check-icon">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
        </svg>
      </span>
      <span class="copy-tooltip">${escapeHtml(tooltip)}</span>
    </button>
  `;
}

function renderSyncCodePanel(title: string, content: string, copyOnClick: string, copyTooltip: string): string {
  return `
    <div class="sync-dialog-field">
      <div class="sync-dialog-codepanel">
        <div class="sync-dialog-codepanel-top">
          <span class="sync-dialog-codepanel-title">${escapeHtml(title)}</span>
          ${renderSyncCopyButton(copyOnClick, copyTooltip)}
        </div>
        <div class="sync-dialog-output">${escapeHtml(content)}</div>
      </div>
    </div>
  `;
}

function renderSyncHistoryRows(history: SyncHistoryItem[]): string {
  if (!history || history.length === 0) {
    return '<div class="sync-history-empty">暂无历史记录</div>';
  }

  return `
    <table class="sync-history-table">
      <thead>
        <tr>
          <th class="sync-history-col-version">版本</th>
          <th class="sync-history-col-status">状态</th>
          <th>标题</th>
          <th class="sync-history-col-time">时间</th>
          <th class="sync-history-col-doc">文档 / 错误</th>
        </tr>
      </thead>
      <tbody>
        ${history.map((item) => {
          const status = item.status === 'failed' ? 'failed' : 'success';
          const statusText = status === 'failed' ? '失败' : '成功';
          const versionText = item.version > 0 ? `v${item.version}` : '-';
          const titleText = item.kmTitle || '-';
          const timeText = item.syncedAt ? formatFileTime(item.syncedAt) : '-';
          let docOrError = '-';
          if (item.kmDocId) {
            docOrError = item.kmUrl
              ? `<a href="${escapeAttr(item.kmUrl)}" target="_blank" class="sync-history-link">${escapeHtml(item.kmDocId)}</a>`
              : escapeHtml(item.kmDocId);
          } else if (item.error) {
            docOrError = `<span class="sync-history-error" title="${escapeAttr(item.error)}">${escapeHtml(item.error)}</span>`;
          }
          return `
            <tr>
              <td class="sync-history-col-version">${escapeHtml(versionText)}</td>
              <td class="sync-history-col-status"><span class="sync-history-status is-${status}">${statusText}</span></td>
              <td title="${escapeAttr(titleText)}">${escapeHtml(titleText)}</td>
              <td class="sync-history-col-time">${escapeHtml(timeText)}</td>
              <td class="sync-history-col-doc">${docOrError}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function refreshSyncHistoryList(history: SyncHistoryItem[]): void {
  const historyEl = document.getElementById('syncHistoryList');
  if (!historyEl) return;
  historyEl.innerHTML = renderSyncHistoryRows(history || []);
}

async function refreshParentMetaPreview(rawValue: string): Promise<void> {
  const metaEl = document.getElementById('syncParentMeta') as HTMLElement | null;
  if (!metaEl) return;

  const raw = (rawValue || '').trim();
  if (!raw) {
    metaEl.style.display = 'none';
    metaEl.innerHTML = '';
    return;
  }

  const parentId = normalizeParentIdInput(raw);
  if (!parentId) {
    metaEl.style.display = 'none';
    metaEl.innerHTML = '';
    return;
  }

  metaEl.style.display = 'block';
  metaEl.innerHTML = `<span class="sync-dialog-parent-meta-muted">正在获取父文档标题...</span>`;

  try {
    const data = await getSyncParentMeta(raw);
    if (!data?.success) {
      metaEl.innerHTML = `<span class="sync-dialog-parent-meta-muted">未获取到父文档标题</span>`;
      return;
    }
    const title = (data.title || '').trim() || `Parent ${data.parentId || parentId}`;
    if (data.url) {
      metaEl.innerHTML = `<a href="${escapeAttr(data.url)}" target="_blank" class="sync-dialog-parent-meta-link">${escapeHtml(title)}</a>`;
      return;
    }
    metaEl.innerHTML = `<span class="sync-dialog-parent-meta-text">${escapeHtml(title)}</span>`;
  } catch {
    metaEl.innerHTML = `<span class="sync-dialog-parent-meta-muted">未获取到父文档标题</span>`;
  }
}

function setSyncDialogStatus(
  phase: 'idle' | 'running' | 'error' | 'success',
  data?: { message?: string; output?: string; title?: string; url?: string; time?: number }
): void {
  const runningEl = document.getElementById('syncStatusRunning') as HTMLElement | null;
  const errorEl = document.getElementById('syncStatusError') as HTMLElement | null;
  const successEl = document.getElementById('syncStatusSuccess') as HTMLElement | null;
  if (!runningEl || !errorEl || !successEl) return;

  runningEl.style.display = phase === 'running' ? 'block' : 'none';
  errorEl.style.display = phase === 'error' ? 'block' : 'none';
  successEl.style.display = phase === 'success' ? 'block' : 'none';

  if (phase === 'error') {
    const messageEl = document.getElementById('syncStatusErrorMessage') as HTMLElement | null;
    const outputEl = document.getElementById('syncStatusErrorOutput') as HTMLElement | null;
    if (messageEl) {
      messageEl.textContent = data?.message || '同步失败，保留当前输入，可直接修改后重试。';
    }
    if (outputEl) {
      outputEl.textContent = data?.output || '';
    }
  }

  if (phase === 'success') {
    const titleLink = document.getElementById('syncStatusDocTitle') as HTMLAnchorElement | null;
    const timeEl = document.getElementById('syncStatusTime') as HTMLElement | null;
    const outputEl = document.getElementById('syncStatusSuccessOutput') as HTMLElement | null;
    if (titleLink) {
      titleLink.textContent = data?.title || '已同步文档';
      if (data?.url) {
        titleLink.href = data.url;
        titleLink.style.pointerEvents = '';
        titleLink.style.opacity = '';
      } else {
        titleLink.removeAttribute('href');
        titleLink.style.pointerEvents = 'none';
        titleLink.style.opacity = '0.75';
      }
    }
    if (timeEl) {
      const ts = data?.time ?? Date.now();
      timeEl.textContent = `同步时间：${formatRelativeTime(ts)} (${formatFileTime(ts)})`;
    }
    if (outputEl) {
      outputEl.textContent = data?.output || '';
    }
  }
}

// 更新同步按钮状态
// 更新工具栏按钮（刷新按钮和同步按钮）
async function updateToolbarButtons() {
  if (!state.currentFile) {
    removeSyncInfoPopover();
    // 没有当前文件时隐藏所有按钮
    const refreshButton = document.getElementById('refreshButton');
    const syncButton = document.getElementById('syncButton');
    if (refreshButton) refreshButton.style.display = 'none';
    if (syncButton) syncButton.style.display = 'none';
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  if (file.isMissing) {
    const refreshButton = document.getElementById('refreshButton');
    const syncButton = document.getElementById('syncButton');
    if (refreshButton) refreshButton.style.display = 'none';
    if (syncButton) syncButton.style.display = 'none';
    return;
  }

  // 更新刷新按钮：只有当文件 dirty 时才显示
  const refreshButton = document.getElementById('refreshButton');
  if (refreshButton) {
    const isDirty = file.lastModified > file.displayedModified;
    refreshButton.style.display = isDirty ? 'flex' : 'none';
  }

  // 更新同步按钮（仅 Markdown 可同步）
  const syncButton = document.getElementById('syncButton');
  if (!isMarkdownContent(file)) {
    removeSyncInfoPopover();
    if (syncButton) syncButton.style.display = 'none';
    return;
  }

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
  const currentPath = state.currentFile;
  const file = state.sessionFiles.get(currentPath);
  const isDirty = !!file && file.lastModified > file.displayedModified;

  // M 状态下禁止同步，必须先刷新
  if (isDirty) {
    button.className = 'toolbar-text-button';
    buttonText.textContent = '[先刷新后同步]';
    button.title = '文件有未刷新改动，请先刷新';
    button.setAttribute('aria-disabled', 'true');
    return;
  }
  button.removeAttribute('aria-disabled');
  button.title = '同步到学城';

  button.className = 'toolbar-text-button';
  buttonText.textContent = '[☁↑ 首次同步]';

  try {
    const data = await getSyncStatus(currentPath);

    if (data.docId) {
      button.className = 'toolbar-text-button synced';
      buttonText.textContent = `[↑ 继续同步(v${(data.version || 1) + 1})]`;
    }
  } catch (e) {
    console.error('获取同步状态失败:', e);
  }
}

// 点击刷新按钮
async function handleRefreshButtonClick() {
  if (!state.currentFile) return;
  await refreshFile(state.currentFile);
}

// 点击同步按钮
async function handleSyncButtonClick() {
  if (!state.currentFile) return;
  const file = state.sessionFiles.get(state.currentFile);
  if (file && file.lastModified > file.displayedModified) {
    showWarning('请先刷新文件，再继续同步');
    return;
  }

  const button = document.getElementById('syncButton');
  if (button && button.classList.contains('syncing')) return;

  await getSyncStatus(state.currentFile);

  removeSyncInfoPopover();
  ensureSyncDialogInteraction();
  showSyncDialog();
}

function ensureSyncDialogChrome(): void {
  const overlay = document.getElementById('syncDialogOverlay');
  if (!overlay) return;

  const dialog = overlay.querySelector('.sync-dialog') as HTMLElement | null;
  if (!dialog) return;

  let header = dialog.querySelector('.sync-dialog-header') as HTMLElement | null;
  if (!header) {
    header = document.createElement('div');
    header.className = 'sync-dialog-header';
    header.innerHTML = `
      <div class="sync-dialog-title" id="syncDialogTitle">同步到学城</div>
      <button class="sync-dialog-close" type="button" aria-label="关闭同步窗口">×</button>
    `;
    dialog.insertBefore(header, dialog.firstChild);
  }

  let closeBtn = header.querySelector('.sync-dialog-close') as HTMLButtonElement | null;
  if (!closeBtn) {
    closeBtn = document.createElement('button');
    closeBtn.className = 'sync-dialog-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', '关闭同步窗口');
    closeBtn.textContent = '×';
    header.appendChild(closeBtn);
  }
}

function ensureSyncDialogInteraction(): void {
  ensureSyncDialogChrome();
  const overlay = document.getElementById('syncDialogOverlay');
  if (!overlay || syncDialogInteractionBound) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeSyncDialog();
    }
  });

  overlay.addEventListener('click', (e) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (!target.closest('.sync-dialog-close')) return;
    closeSyncDialog();
  });

  syncDialogInteractionBound = true;
}

// 显示同步对话框
async function showSyncDialog() {
  ensureSyncDialogChrome();
  const file = state.sessionFiles.get(state.currentFile!);
  if (!file) return;

  const titleMatch = file.content.match(/^#\s+(.+)$/m);
  const guessedTitle = titleMatch ? titleMatch[1] : file.name.replace(/\.(md|markdown|html?|txt)$/i, '');
  const syncStatus = await getSyncStatus(state.currentFile!);
  const currentVersion = syncStatus.version || 0;
  const baseTitle = syncStatus.baseTitle || stripVersionSuffix(syncStatus.title || guessedTitle);
  const nextVersion = currentVersion + 1;
  const nextTitle = nextVersion <= 1 ? baseTitle : `${baseTitle}-v${nextVersion}`;

  const recentData = await getRecentParents();
  const preferences = await getSyncPreferences();

  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  if (!overlay || !title || !body) return;

  title.textContent = '同步到学城';

  // 开始构建 HTML（操作在上，执行反馈在下，历史在最下）
  let html = `
    <div class="sync-dialog-field">
      <div class="sync-dialog-meta">当前文件：${escapeHtml(state.currentFile || '')}</div>
      <div class="sync-dialog-meta">当前版本：${currentVersion > 0 ? `v${currentVersion}` : '未绑定'} · 下一版本：v${nextVersion}</div>
      <div class="sync-dialog-meta">本次将创建：${escapeHtml(nextTitle)}</div>
      <input type="hidden" id="syncCurrentVersion" value="${currentVersion}">
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-label">基础标题（自动生成 -vN）</label>
      <input type="text" class="sync-dialog-input" id="syncTitle" value="${escapeAttr(baseTitle)}">
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-label">选择位置</label>
  `;

  // 最近位置列表（带链接）
  if (recentData.parents && recentData.parents.length > 0) {
    html += '<div class="sync-dialog-recent">';
    recentData.parents.forEach((parent) => {
      const isDefault = parent.id === recentData.defaultParentId;
      const titleText = (!parent.title || /^Parent\s+\S+$/i.test(parent.title.trim()))
        ? parent.id
        : parent.title;
      html += `
        <div class="sync-dialog-recent-item ${isDefault ? 'selected' : ''}" onclick="window.selectRecentParent('${escapeJsSingleQuoted(parent.id)}', event)">
          <input type="radio" name="recentParent" value="${escapeAttr(parent.id)}" class="sync-dialog-recent-radio" ${isDefault ? 'checked' : ''}>
          <div class="sync-dialog-recent-main">
            ${parent.url
              ? `<a href="${escapeAttr(parent.url)}" target="_blank" class="sync-dialog-recent-title-link" onclick="event.stopPropagation()">${escapeHtml(titleText)}</a>`
              : `<span class="sync-dialog-recent-title-link">${escapeHtml(titleText)}</span>`
            }
            <span class="sync-dialog-recent-inline-meta">#${escapeHtml(parent.id)} · ${escapeHtml(formatRelativeTime(parent.lastUsed))}</span>
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
    <input type="text" class="sync-dialog-input sync-dialog-manual-input" id="syncParentId" placeholder="${placeholder}" autocomplete="off">
    <div id="syncParentMeta" class="sync-dialog-parent-meta" style="display:none;"></div>
    </div>

    <div class="sync-dialog-field">
      <label class="sync-dialog-checkbox">
        <input type="checkbox" id="syncOpenAfter" ${preferences.openAfterSync !== false ? 'checked' : ''}>
        <span>同步后在浏览器中打开</span>
      </label>
    </div>

    <div class="sync-dialog-field">
      <div class="sync-dialog-codepanel">
        <div class="sync-dialog-codepanel-top">
          <span class="sync-dialog-codepanel-title">将执行的命令</span>
        ${renderSyncCopyButton('window.copySyncCommand(event)', '复制命令')}
        </div>
        <div class="sync-dialog-output" id="syncCommandPreview">km-cli doc create --parent-id "..." --title "${escapeHtml(nextTitle)}" --markdown-file "${escapeHtml(state.currentFile || '')}" --json</div>
      </div>
    </div>

    <div class="sync-dialog-footer">
      <button class="sync-dialog-btn sync-dialog-btn-primary" onclick="window.confirmSync()">同步</button>
      <div class="sync-dialog-shortcut-hint">快捷键：Cmd/Ctrl + Enter</div>
    </div>

    <div class="sync-dialog-status">
      <div class="sync-dialog-status-block running" id="syncStatusRunning" style="display:none;">
        正在调用 km-cli，请稍候...
      </div>
      <div class="sync-dialog-status-block error" id="syncStatusError" style="display:none;">
        <div class="sync-dialog-status-message" id="syncStatusErrorMessage"></div>
        <div class="sync-dialog-codepanel">
          <div class="sync-dialog-codepanel-top">
            <span class="sync-dialog-codepanel-title">原始返回</span>
            ${renderSyncCopyButton(`window.copySingleText(document.getElementById('syncStatusErrorOutput')?.textContent || '', event)`, '复制返回')}
          </div>
          <div class="sync-dialog-output" id="syncStatusErrorOutput"></div>
        </div>
      </div>
      <div class="sync-dialog-status-block success" id="syncStatusSuccess" style="display:none;">
        <div class="sync-dialog-status-line">
          文档：
          <a href="#" target="_blank" class="sync-dialog-doc-link" id="syncStatusDocTitle">已同步文档</a>
        </div>
        <div class="sync-dialog-status-line" id="syncStatusTime"></div>
        <div class="sync-dialog-codepanel">
          <div class="sync-dialog-codepanel-top">
            <span class="sync-dialog-codepanel-title">原始返回</span>
            ${renderSyncCopyButton(`window.copySingleText(document.getElementById('syncStatusSuccessOutput')?.textContent || '', event)`, '复制返回')}
          </div>
          <div class="sync-dialog-output" id="syncStatusSuccessOutput"></div>
        </div>
      </div>
    </div>
    <div class="sync-dialog-field">
      <div class="sync-dialog-codepanel">
        <div class="sync-dialog-codepanel-top">
          <span class="sync-dialog-codepanel-title">历史版本（按时间倒序）</span>
        </div>
        <div class="sync-dialog-history" id="syncHistoryList">${renderSyncHistoryRows(syncStatus.history || [])}</div>
      </div>
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
        <div class="sync-dialog-codepanel">
          <div class="sync-dialog-codepanel-top">
            <span class="sync-dialog-codepanel-title">将执行的命令</span>
          ${renderSyncCopyButton('window.copySyncCommand(event)', '复制命令')}
          </div>
          <div class="sync-dialog-output" id="syncCommandPreview">km-cli doc create --parent-id "..." --title "${escapeHtml(nextTitle)}" --markdown-file "${escapeHtml(state.currentFile || '')}" --json</div>
        </div>
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
    titleInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      void confirmSync();
    });
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
      const metaEl = document.getElementById('syncParentMeta') as HTMLElement | null;
      if (metaEl) {
        metaEl.style.display = 'none';
        metaEl.innerHTML = '';
      }
      updateCommandPreview();
    });
    parentInput.addEventListener('blur', () => {
      refreshParentMetaPreview(parentInput.value);
    });
    parentInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      if (!(event.metaKey || event.ctrlKey)) return;
      event.preventDefault();
      void confirmSync();
    });
  }

  updateCommandPreview();
  setSyncDialogStatus('idle');
}

// 更新命令预览
function updateCommandPreview() {
  const preview = document.getElementById('syncCommandPreview');
  const titleInput = document.getElementById('syncTitle') as HTMLInputElement;
  const parentInput = document.getElementById('syncParentId') as HTMLInputElement;
  const selectedRadio = document.querySelector('.sync-dialog-recent-radio:checked') as HTMLInputElement;
  const versionInput = document.getElementById('syncCurrentVersion') as HTMLInputElement | null;

  if (!preview || !state.currentFile) return;

  const baseTitle = (titleInput?.value || '').trim() || '...';
  const currentVersion = Number(versionInput?.value || 0) || 0;
  const nextVersion = currentVersion + 1;
  const versionedTitle = nextVersion <= 1 ? baseTitle : `${baseTitle}-v${nextVersion}`;
  let parentId = parentInput?.value.trim() || selectedRadio?.value || '...';
  parentId = normalizeParentIdInput(parentId) || '...';

  preview.textContent = `km-cli doc create --parent-id "${parentId}" --title "${versionedTitle}" --markdown-file "${state.currentFile}" --json`;
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
  const metaEl = document.getElementById('syncParentMeta') as HTMLElement | null;
  if (metaEl) {
    metaEl.style.display = 'none';
    metaEl.innerHTML = '';
  }

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
  parentId = normalizeParentIdInput(parentId || '');

  if (!title) {
    showWarning('请输入标题');
    return;
  }

  if (!parentId) {
    showWarning('请选择位置或输入父文档 ID');
    return;
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
  setSyncDialogStatus('running');

  try {
    const result = await executeSync(state.currentFile, title, parentId);

    if (result.success) {
      const now = Date.now();
      if (openAfter && result.url) {
        window.open(result.url, '_blank');
        closeSyncDialog();
        updateSyncButton();
        return;
      }
      const rawOutput = (typeof result.output === 'string' && result.output.trim())
        ? result.output
        : JSON.stringify(result, null, 2);
      const docTitle = (result.title || '').trim() || '已同步文档';
      setSyncDialogStatus('success', {
        title: docTitle,
        url: result.url || '',
        output: rawOutput,
        time: now,
      });
      const status = await getSyncStatus(state.currentFile);
      refreshSyncHistoryList(status.history || []);
      updateSyncButton();
    } else {
      const rawOutput = (typeof result.output === 'string' && result.output.trim())
        ? result.output
        : JSON.stringify(result, null, 2);
      setSyncDialogStatus('error', {
        message: '同步失败，保留当前输入，可直接修改后重试。',
        output: rawOutput,
      });
      const status = await getSyncStatus(state.currentFile);
      refreshSyncHistoryList(status.history || []);
    }
  } catch (err: any) {
    setSyncDialogStatus('error', {
      message: `同步失败: ${err.message}`,
      output: err?.stack || err?.message || '未知错误',
    });
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = '同步';
    }
  }
}

// 显示已同步文件的对话框
async function showSyncedFileDialog(syncData: any) {
  ensureSyncDialogChrome();
  const overlay = document.getElementById('syncDialogOverlay');
  const title = document.getElementById('syncDialogTitle');
  const body = document.getElementById('syncDialogBody');

  if (!overlay || !title || !body) return;

  title.textContent = '文档同步信息';
  const commandText = syncData.command || '';
  const rawOutput = (typeof syncData.output === 'string' && syncData.output.trim())
    ? syncData.output
    : '';

  body.innerHTML = `
    <div class="sync-dialog-field">
      <div class="sync-dialog-meta">本地文件：${escapeHtml(syncData.path)}</div>
      ${syncData.lastSyncTime ? `<div class="sync-dialog-meta">最后同步：${escapeHtml(formatFileTime(syncData.lastSyncTime))}</div>` : ''}
    </div>

    ${commandText
      ? renderSyncCodePanel(
          '执行命令',
          commandText,
          `window.copySingleText('${escapeJsSingleQuoted(commandText)}', event)`,
          '复制命令'
        )
      : ''}
    ${rawOutput
      ? renderSyncCodePanel(
          '原始返回',
          rawOutput,
          `window.copySingleText('${escapeJsSingleQuoted(rawOutput)}', event)`,
          '复制返回'
        )
      : ''}
    ${syncData.url ? `
      <div class="sync-dialog-link-row">
        <a href="${escapeAttr(syncData.url)}" target="_blank" class="sync-dialog-link">${escapeHtml(syncData.url)}</a>
      </div>
    ` : ''}
  `;

  overlay.classList.add('show');
}

// 关闭同步对话框
function closeSyncDialog() {
  const overlay = document.getElementById('syncDialogOverlay');
  if (overlay) {
    overlay.classList.remove('show');
  }
  removeSyncInfoPopover();
}

// 复制命令
function copySyncCommand(e?: Event) {
  const preview = document.getElementById('syncCommandPreview');
  if (preview) {
    copyTextWithFeedback(preview.textContent || '', e);
  }
}

function resolveCopyFeedbackTarget(e?: Event): HTMLElement | null {
  if (!e?.target) return null;
  return (e.target as HTMLElement).closest('.copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn') as HTMLElement | null;
}

function applyCopyFeedback(target: HTMLElement | null): void {
  if (!target) return;

  if (target.classList.contains('copy-filename-button')) {
    target.classList.add('success');
    const tooltip = target.querySelector('.copy-tooltip');
    const originalText = tooltip?.textContent;
    if (tooltip) tooltip.textContent = '已复制';
    setTimeout(() => {
      target.classList.remove('success');
      if (tooltip && originalText) tooltip.textContent = originalText;
    }, 1000);
    return;
  }

  const originalText = target.textContent;
  target.textContent = '✓ 已复制';
  setTimeout(() => {
    if (originalText != null) target.textContent = originalText;
  }, 1000);
}

function copyTextWithFeedback(text: string, e?: Event): void {
  navigator.clipboard.writeText(text).then(() => {
    applyCopyFeedback(resolveCopyFeedbackTarget(e));
  }).catch(() => {
    showError('复制失败');
  });
}

// 复制单个文本
function copySingleText(text: string, e?: Event) {
  copyTextWithFeedback(text, e);
}

// 复制文件名
function copyFileName(fileName: string, event?: Event) {
  copyTextWithFeedback(fileName, event);
}

// 复制错误信息
function copyErrorInfo(e?: Event) {
  const outputs = document.querySelectorAll('.sync-dialog-output');
  if (outputs.length > 0) {
    const texts = Array.from(outputs).map(el => el.textContent || '').join('\n\n');
    copyTextWithFeedback(texts, e);
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
  const syncButton = document.getElementById('syncButton');

  if (!menu || !button) return;

  const target = e.target as HTMLElement;
  if (!menu.contains(target) && !button.contains(target)) {
    closeFontScaleMenu();
  }

  if (syncInfoPopoverEl && !syncInfoPopoverEl.contains(target) && !syncButton?.contains(target)) {
    removeSyncInfoPopover();
  }
});

window.addEventListener('resize', removeSyncInfoPopover);
window.addEventListener('scroll', removeSyncInfoPopover, true);

// ==================== SSE 连接 ====================
function connectSSE() {
  const eventSource = new EventSource('/api/events');

  // 文件内容变化
  eventSource.addEventListener('file-changed', async (e: any) => {
    const data = JSON.parse(e.data);
    const file = getSessionFile(data.path);

    if (file) {
      // 统一策略：仅更新状态，不自动替换正文（当前/非当前一致）
      file.lastModified = data.lastModified;
      renderSidebar();
      await updateToolbarButtons();
    }
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

    // 如果当前正在查看这个文件，仅提示“已删除”并保留当前正文（不做自动刷新替换）
    if (state.currentFile === data.path) {
      renderContent();
      updateToolbarButtons();
      showError('文件已不存在');
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
    copySyncCommand: (e?: Event) => void;
    copySingleText: (text: string, e?: Event) => void;
    copyFileName: (fileName: string) => void;
    copyErrorInfo: (e?: Event) => void;
    showToast?: (message: string, type: string) => void;
    showSettingsDialog: () => void;
    toggleFontScaleMenu: () => void;
    setFontScale: (scale: number) => void;
    openExternalFile?: (path: string) => void | Promise<void>;
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
  if (!looksLikePathInput(raw)) {
    searchFilesHandler(raw).catch((err: any) => {
      showError(`搜索失败: ${err?.message || '未知错误'}`);
    });
    return;
  }
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
window.openExternalFile = openFileInBrowser;

function startWorkspacePolling() {
  window.setInterval(async () => {
    if (workspacePollRunning) return;
    if (state.config.sidebarMode !== 'workspace') return;

    const expanded = state.config.workspaces.filter((ws) => ws.isExpanded);
    if (expanded.length === 0) return;

    workspacePollRunning = true;
    try {
      for (const ws of expanded) {
        await scanWorkspace(ws.id);
      }
      renderSidebar();
    } finally {
      workspacePollRunning = false;
    }
  }, 1500);
}

// ==================== 初始化 ====================
(async () => {
  ensureSyncDialogInteraction();
  initSidebarWidth();

  // 初始化字体缩放
  initFontScale();

  // 初始化批注功能
  initAnnotationElements();
  syncAnnotationSidebarLayout();
  window.addEventListener('resize', () => {
    syncAnnotationSidebarLayout();
  });

  await restoreState(loadFile);
  await hydrateExpandedWorkspaces();
  startWorkspacePolling();

  // 根据配置渲染侧边栏
  renderSidebar();

  renderContent();
  syncAnnotationsForCurrentFile(true);

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

  // 添加批注文本选中监听
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const filePath = document.getElementById('content')?.getAttribute('data-current-file') || null;
      handleSelectionForAnnotation(filePath);
    }, 0);
  });

  // 页面刷新时，自动刷新当前正在展示的文件
  await refreshCurrentFile();
  connectSSE();
})();
