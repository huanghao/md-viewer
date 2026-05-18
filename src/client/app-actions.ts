import type { FileData } from './types';
import { state, saveState, addOrUpdateFile } from './state';
import { renderSidebar } from './ui/sidebar';
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
import { clearDiffMarkers } from './ui/doc-scrollbar';

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
  const nextPath = state.currentFile && !isHtmlPath(state.currentFile) ? state.currentFile : null;
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
  if (focus && (state.config.sidebarTab === 'focus' || state.config.sidebarTab === 'full')) {
    await revealFileInWorkspace(data.path);
  }
  renderSidebar();
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
  renderSidebar();
  renderContent();
  syncAnnotationsForCurrentFile(false);
}

// ── Toolbar buttons ─────────────────────────────────────────────────────────
export async function updateToolbarButtons(): Promise<void> {
  const diffButton = document.getElementById('diffButton');
  const refreshButton = document.getElementById('refreshButton');

  if (!state.currentFile) {
    if (diffButton) diffButton.style.display = 'none';
    if (refreshButton) refreshButton.style.display = 'none';
    return;
  }

  const file = state.sessionFiles.get(state.currentFile);
  if (!file) return;

  if (file.isMissing) {
    if (diffButton) diffButton.style.display = 'none';
    if (refreshButton) refreshButton.style.display = 'none';
    return;
  }

  const isDirty = file.lastModified > file.displayedModified;
  if (diffButton) diffButton.style.display = isDirty && !file.isRemote ? 'flex' : 'none';
  if (refreshButton) refreshButton.style.display = isDirty ? 'flex' : 'none';
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
      const diffBtn = document.getElementById('diffButton');
      if (diffBtn) diffBtn.classList.remove('active');
      const banner = document.getElementById('diffBanner');
      if (banner) banner.remove();
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

  renderSidebar();
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

export function startWorkspacePolling(): void {
  window.setInterval(async () => {
    if (workspacePollRunning) return;
    if (state.config.sidebarTab === 'list') return;
    if (state.config.sidebarTab === 'search') return;

    const toScan = state.config.sidebarTab === 'focus'
      ? state.config.workspaces
      : state.config.workspaces.filter((ws) => ws.isExpanded);
    if (toScan.length === 0) return;

    workspacePollRunning = true;
    try {
      for (const ws of toScan) {
        await scanWorkspace(ws.id);
      }
      renderSidebar();
    } finally {
      workspacePollRunning = false;
    }
  }, state.config.workspacePollInterval ?? 5000);
}
