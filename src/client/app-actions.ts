import type { FileData } from './types';
import { state, saveState, addOrUpdateFile } from './state';
import { renderSidebar, requestSidebarRender } from './ui/sidebar';
import { diffBannerStore } from './diff-banner/store';
import { renderContent, flashContentUpdated, isHtmlPath } from './content-renderer';
import { updateToc } from './toc-manager';
import { updateZoomDisplay } from './zoom-controller';
import { loadFile } from './api/files';
import { revealFileInWorkspace } from './workspace';
import { scanWorkspace } from './workspace';
import { getMdThemeCss, getHlThemeCss } from './themes/index';
import { showSuccess } from './ui/toast';
import {
  setAnnotations,
  getAnnotationCurrentFilePath,
  applyAnnotations,
  renderAnnotationList,
} from './annotation';
import { getDiffViewActive, setDiffViewActive } from './diff-view';
import { fetchSnapshot } from './api/snapshots';
import { clearDiffMarkers } from './ui/doc-scrollbar';
import { toolbarStore } from './toolbar/store';

export let _setPendingAnnotation: ((ann: any, filePath: string, x: number, y: number) => void) | null = null;
export function set_setPendingAnnotation(fn: typeof _setPendingAnnotation) { _setPendingAnnotation = fn; }

// ── Theme ───────────────────────────────────────────────────────────────────
export function applyTheme(): void {
  const mdCss = getMdThemeCss(state.config.markdownTheme || 'github');
  const hlCss = getHlThemeCss(state.config.codeTheme || 'github');
  const mdStyle = document.getElementById('theme-md-css');
  const hlStyle = document.getElementById('theme-hl-css');
  if (mdStyle) mdStyle.textContent = mdCss;
  if (hlStyle) hlStyle.textContent = hlCss;
}

// ── Annotation sync ─────────────────────────────────────────────────────────
export function syncAnnotationsForCurrentFile(force = false): void {
  // HTML 文件现在走 Shadow DOM 挂载，同样支持批注，不再排除
  // （历史上 HTML 只能进 iframe、批注系统够不到，这里曾经硬排除过）。
  const nextPath = state.currentFile ?? null;
  const currentAnnotationFilePath = getAnnotationCurrentFilePath();
  if (force || nextPath !== currentAnnotationFilePath) {
    setAnnotations(nextPath);
  }
  applyAnnotations();
  renderAnnotationList(nextPath);
}

// ── File loaded ─────────────────────────────────────────────────────────────
export async function onFileLoaded(data: FileData, focus = false): Promise<void> {
  const previousFile = state.currentFile;
  addOrUpdateFile(data, focus);

  // 刷新页面后，从服务端快照恢复 diff 状态（base vs 磁盘当前版本）
  const file = state.sessionFiles.get(data.path);
  if (file && file.pendingContent === undefined && !isHtmlPath(data.path)) {
    void fetchSnapshot(data.path).then(snap => {
      if (!snap) return;
      // 快照与磁盘内容相同说明已过期，不需要恢复
      if (snap.content === file.content) return;
      // 还原：base = 快照，pending = 磁盘当前内容
      file.pendingContent = file.content;
      file.content = snap.content;
      saveState();   // 状态写入会触发侧栏重绘（M 标记随之出现）
    });
  }

  if (focus && (state.config.sidebarTab === 'focus' || state.config.sidebarTab === 'full')) {
    await revealFileInWorkspace(data.path);
  }
  requestSidebarRender();
  renderContent();
  syncAnnotationsForCurrentFile(focus && previousFile !== data.path);
  if (focus) {
    updateToc(data.path);
    updateZoomDisplay(true);
  }
}

// ── Scroll ──────────────────────────────────────────────────────────────────
export function scrollContentToTop(): void {
  const container = document.getElementById('content');
  if (!container) return;
  container.scrollTo({ top: 0, behavior: 'auto' });
}

// ── Render all ──────────────────────────────────────────────────────────────
export function renderAll(): void {
  requestSidebarRender();
  renderContent();
  syncAnnotationsForCurrentFile(false);
}

// ── Toolbar buttons ─────────────────────────────────────────────────────────
export async function updateToolbarButtons(): Promise<void> {
  if (!state.currentFile) {
    toolbarStore.setDiff({ visible: false });
    toolbarStore.setRefreshVisible(false);
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  if (file.isMissing) {
    toolbarStore.setDiff({ visible: false });
    toolbarStore.setRefreshVisible(false);
    return;
  }

  const isDirty = file.lastModified > file.displayedModified;
  toolbarStore.setDiff({ visible: isDirty && !file.isRemote });
  toolbarStore.setRefreshVisible(isDirty);
}

// ── File refresh ─────────────────────────────────────────────────────────────
const fileRefreshSeq = new Map<string, number>();

async function syncFileFromDisk(path: string, options: { silent?: boolean; highlight?: boolean } = {}): Promise<boolean> {
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
  targetFile.pendingContent = undefined;
  if (data.lastModified >= (targetFile.lastModified || 0)) {
    targetFile.lastModified = data.lastModified;
  }
  targetFile.displayedModified = data.lastModified;
  targetFile.isMissing = false;
  saveState();

  if (state.currentFile === path || state.currentFile === data.path) {
    if (getDiffViewActive()) {
      setDiffViewActive(false);
      toolbarStore.setDiff({ active: false });
      diffBannerStore.hide();
      document.getElementById('content')?.classList.remove('diff-active');
      clearDiffMarkers();
    }
    renderContent();
    if (state.currentFile) updateToc(state.currentFile);
    requestAnimationFrame(() => {
      syncAnnotationsForCurrentFile(false);
      if (options.highlight) flashContentUpdated();
    });
  }

  requestSidebarRender();
  await updateToolbarButtons();
  return true;
}

export async function refreshCurrentFile(): Promise<void> {
  if (!state.currentFile) return;
  await syncFileFromDisk(state.currentFile, { silent: true, highlight: false });
}

export async function refreshFile(path: string): Promise<void> {
  const updated = await syncFileFromDisk(path, { silent: false, highlight: true });
  if (updated && state.currentFile === path) {
    showSuccess('文件已刷新');
  }
}

export async function handleRefreshButtonClick(): Promise<void> {
  if (!state.currentFile) return;
  await refreshFile(state.currentFile);
}

// ── Workspace polling ────────────────────────────────────────────────────────
export let workspacePollRunning = false;
let workspacePollTimer: number | null = null;

export function startWorkspacePolling(): void {
  if (workspacePollTimer !== null) return;

  workspacePollTimer = window.setInterval(async () => {
    if (document.hidden) return;
    if (workspacePollRunning) return;
    if (state.config.sidebarTab === 'list') return;

    const toScan = state.config.sidebarTab === 'focus'
      ? state.config.workspaces
      : state.config.workspaces.filter((ws) => ws.isExpanded);
    if (toScan.length === 0) return;

    // 并发扫描全部工作区，而不是每个 tick 轮转扫一个——daemon 侧现在默认走
    // force:false（内存命中，开销很低），"扫得更全"不再意味着"扫得更贵"。
    workspacePollRunning = true;
    try {
      // scanWorkspace 写入 state.fileTree 并同步更新 M/蓝点集合，订阅会合并重绘
      await Promise.allSettled(toScan.map((workspace) => scanWorkspace(workspace.id)));
    } finally {
      workspacePollRunning = false;
    }
  }, state.config.workspacePollInterval ?? 5000);
}
