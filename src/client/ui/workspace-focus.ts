import type { Workspace, FileTreeNode } from '../types';
import { saveConfig } from '../config';
import {
  state,
  markWorkspaceFailed,
  isWorkspaceFailed,
} from '../state';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { fuzzyMatch } from '../utils/fuzzy-search';
import { getPinnedFiles } from '../utils/pinned-files';
import { scanWorkspace } from '../workspace';
import { renderFileRow } from './file-row';
import { getFileExtension } from '../utils/file-type';
import { storageGet, storageSet } from '../utils/storage';
import {
  normalizeFocusFileType,
  sameFocusActiveTypes,
  sanitizeFocusActiveTypes,
  toggleFocusActiveType,
} from '../utils/focus-type-filter';

// Simple glob matcher for .mdvignore patterns
// Supports: *, **, ?, and prefix matching (e.g. "bots-ws/" matches any path under bots-ws/)
export function globToRegex(pattern: string): RegExp {
  // Escape special regex chars except * and ?
  let p = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // ** matches any path segment including / (zero or more segments)
  // **/ should match empty (current dir) or any number of subdirs
  p = p.replace(/\*\*/g, '§GLOBSTAR§');
  // * matches anything except /
  p = p.replace(/\*/g, '[^/]*');
  // ? matches single char except /
  p = p.replace(/\?/g, '[^/]');
  // restore **: §GLOBSTAR§/ allows zero or more path segments
  p = p.replace(/§GLOBSTAR§\//g, '(?:.+/)?');
  p = p.replace(/§GLOBSTAR§/g, '.*');
  // If pattern ends with /, match as directory prefix
  if (pattern.endsWith('/')) {
    return new RegExp(`(^|/)${p}`);
  }
  return new RegExp(`(^|/)${p}(/|$)`);
}

export function isIgnored(filePath: string, workspacePath: string, patterns: string[]): boolean {
  if (!patterns.length) return false;
  // Get path relative to workspace root
  const rel = filePath.startsWith(workspacePath + '/')
    ? filePath.slice(workspacePath.length + 1)
    : filePath;
  return patterns.some((p) => globToRegex(p).test(rel));
}

// 防止同一工作区在同一渲染周期内被重复触发扫描
const pendingScanIds = new Set<string>();

function getActiveTypes(): Set<string> {
  const types = sanitizeFocusActiveTypes(state.config.focusActiveTypes);
  if (!sameFocusActiveTypes(state.config.focusActiveTypes, types)) {
    state.config.focusActiveTypes = types;
  }
  return new Set(types);
}

export function toggleFocusTypeFilter(ext: string): void {
  const activeTypes = getActiveTypes();
  state.config.focusActiveTypes = toggleFocusActiveType(activeTypes, ext);
  saveConfig(state.config);
  import('./sidebar').then(({ renderSidebar }) => renderSidebar());
}

const FOCUS_COLLAPSED_KEY = 'md-viewer:focus-ws-collapsed';

export function getFocusCollapsed(): Set<string> {
  const arr = storageGet<string[]>(FOCUS_COLLAPSED_KEY, []);
  return new Set(Array.isArray(arr) ? arr : []);
}

export function saveFocusCollapsed(s: Set<string>): void {
  storageSet(FOCUS_COLLAPSED_KEY, [...s]);
}

const FOCUS_WINDOW_MS: Record<string, number> = {
  '8h':  8  * 3600 * 1000,
  '1d':  1  * 86400 * 1000,
  '2d':  2  * 86400 * 1000,
};

// ── Open-signal cache (for 读 strategy) ──────────────────────────────────────

interface OpenSignal { ts: number; type: string; file: string; }

let signalCache: OpenSignal[] = [];

export async function refreshFrecencySignals(): Promise<void> {
  try {
    const res = await fetch('/api/focus-signals?days=7');
    if (!res.ok) return;
    const data = await res.json() as { signals: OpenSignal[] };
    signalCache = data.signals;
  } catch { /* server not available */ }
}

// Returns the most recent 'open' signal timestamp per file
function buildLastOpenMap(signals: OpenSignal[], cutoff: number): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of signals) {
    if (s.type !== 'open' && s.type !== 'annotate') continue;
    if (s.ts < cutoff) continue;
    const prev = map.get(s.file);
    if (prev === undefined || s.ts > prev) map.set(s.file, s.ts);
  }
  return map;
}

// Collect all file nodes from a tree recursively
function collectFiles(node: FileTreeNode): FileTreeNode[] {
  if (node.type === 'file') return [node];
  const results: FileTreeNode[] = [];
  for (const child of node.children || []) {
    results.push(...collectFiles(child));
  }
  return results;
}

// Returns files active within window: mtime (写) or last open (读), plus pinned
export function getActiveFiles(
  workspacePath: string,
  tree: FileTreeNode | undefined,
  windowMs: number,
  pinned: Set<string>,
  annotationSummaries?: Map<string, { count: number; updatedAt: number }>
): FileTreeNode[] {
  if (!tree) return [];
  const cutoff = Date.now() - windowMs;
  const all = collectFiles(tree);
  return all.filter((f) => {
    if (pinned.has(f.path)) return true;
    if (typeof f.lastModified === 'number' && f.lastModified >= cutoff) return true;
    // Check if file has recent annotation activity
    const annotationUpdatedAt = annotationSummaries?.get(f.path)?.updatedAt;
    if (annotationUpdatedAt && annotationUpdatedAt >= cutoff) return true;
    return false;
  }).sort((a, b) => {
    // Pinned first, then by mtime descending
    const aPinned = pinned.has(a.path);
    const bPinned = pinned.has(b.path);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return (b.lastModified || 0) - (a.lastModified || 0);
  });
}


function renderFocusFileItem(file: FileTreeNode, pinned: Set<string>, query: string, displayTime?: number): string {
  return renderFileRow(file.path, file.name, displayTime ?? file.lastModified, {
    containerClass: 'tree-item file-node focus-file-item',
    onClickAction: 'focus-file-click',
    showPin: true,
    showTime: true,
    indentPx: 8,
    query,
    showClose: false,
  });
}

export function setFocusStrategy(strategy: 'mtime' | 'open'): void {
  state.config.focusStrategy = strategy;
  saveConfig(state.config);
  import('./sidebar').then(({ renderSidebar }) => renderSidebar());
}

let filterPopupOpen = false;

export function toggleFilterPopup(): void {
  filterPopupOpen = !filterPopupOpen;
  import('./sidebar').then(({ renderSidebar }) => renderSidebar());
}

export function closeFilterPopup(): void {
  if (!filterPopupOpen) return;
  filterPopupOpen = false;
  import('./sidebar').then(({ renderSidebar }) => renderSidebar());
}

function renderFilterBar(): string {
  const currentWindow = state.config.focusWindowKey || '8h';
  const currentStrategy = state.config.focusStrategy ?? 'mtime';
  const activeTypes = getActiveTypes();
  const typeOptions: Array<{ ext: string; label: string }> = [
    { ext: 'md', label: 'MD' },
    { ext: 'pdf', label: 'PDF' },
    { ext: 'html', label: 'HTML' },
    { ext: 'json', label: 'JSON' },
  ];
  const timeOptions: Array<{ key: string; label: string }> = [
    { key: '8h', label: '8h' },
    { key: '1d', label: '1d' },
    { key: '2d', label: '2d' },
  ];
  const strategyLabel = currentStrategy === 'open' ? '读' : '写';

  // 当前生效的标签
  const activeTimeLabel = `<span class="focus-active-tag">${currentWindow}</span>`;
  const activeStrategyLabel = `<span class="focus-active-tag">${strategyLabel}</span>`;
  const activeTypeTags = typeOptions
    .filter(o => activeTypes.has(o.ext))
    .map(o => `<span class="focus-active-tag">${o.label}</span>`)
    .join('');

  // popup 内容
  const strategySection = `
    <div class="focus-popup-section">
      <div class="focus-popup-label">排序依据</div>
      <div class="focus-popup-options">
        <button class="focus-popup-option${currentStrategy === 'mtime' ? ' active' : ''}"
                data-action="set-focus-strategy" data-key="mtime">写（mtime）</button>
        <button class="focus-popup-option${currentStrategy === 'open' ? ' active' : ''}"
                data-action="set-focus-strategy" data-key="open">读（最近打开）</button>
      </div>
    </div>
    <div class="focus-popup-divider"></div>`;

  const timeSection = `
    <div class="focus-popup-section">
      <div class="focus-popup-label">时间窗口</div>
      <div class="focus-popup-options">
        ${timeOptions.map(o => `
          <button class="focus-popup-option${currentWindow === o.key ? ' active' : ''}"
                  data-action="set-focus-window-key" data-key="${escapeAttr(o.key)}" data-also-toggle-filter="1">${o.label}</button>
        `).join('')}
      </div>
    </div>
    <div class="focus-popup-divider"></div>`;

  const typeSection = `
    <div class="focus-popup-section">
      <div class="focus-popup-label">文件类型</div>
      <div class="focus-popup-options">
        ${typeOptions.map(o => `
          <button class="focus-popup-option${activeTypes.has(o.ext) ? ' active' : ''}"
                  data-action="toggle-focus-type-filter" data-key="${escapeAttr(o.ext)}">${o.label}</button>
        `).join('')}
      </div>
    </div>`;

  const popup = filterPopupOpen ? `
    <div class="focus-filter-popup">
      ${strategySection}
      ${timeSection}
      ${typeSection}
    </div>` : '';

  return `
    <div class="focus-filter-bar">
      <div class="focus-active-tags">${activeStrategyLabel}<span class="focus-active-sep"></span>${activeTimeLabel}<span class="focus-active-sep"></span>${activeTypeTags}</div>
      <div class="focus-filter-popup-wrap">
        <button class="focus-filter-btn${filterPopupOpen ? ' active' : ''}"
                data-action="toggle-filter-popup" title="筛选">
          <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
            <path d="M2 3h12L9.5 8v4.5l-3-1.5V8z"/>
          </svg>
        </button>
        ${popup}
      </div>
    </div>
  `;
}

function renderFocusWorkspaceGroup(
  workspace: Workspace,
  activeFiles: FileTreeNode[],
  pinned: Set<string>,
  loading: boolean,
  query: string,
  collapsed: Set<string>,
  displayTimeMap?: Map<string, number>
): string {
  const hasFiles = activeFiles.length > 0;
  const isCollapsed = collapsed.has(workspace.id);
  const badge = loading
    ? `<span class="focus-ws-badge empty">…</span>`
    : hasFiles
    ? `<span class="focus-ws-badge">${activeFiles.length}</span>`
    : `<span class="focus-ws-badge empty">0</span>`;

  const filesHtml = hasFiles
    ? activeFiles.map((f) => renderFocusFileItem(f, pinned, query, displayTimeMap?.get(f.path))).join('')
    : '';

  return `
    <div class="focus-ws-group${hasFiles ? ' has-files' : ''}">
      <div class="focus-ws-header" data-action="focus-workspace-toggle" data-workspace-id="${escapeAttr(workspace.id)}">
        <span class="focus-ws-arrow${!isCollapsed ? ' open' : ''}">▶</span>
        <span class="focus-ws-name">${escapeHtml(workspace.name)}</span>
        ${badge}
      </div>
      ${hasFiles && !isCollapsed ? `<div class="focus-ws-files">${filesHtml}</div>` : ''}
    </div>
  `;
}

export function renderFocusView(): string {
  const workspaces = state.config.workspaces;
  if (workspaces.length === 0) {
    return '<div class="focus-empty">暂无工作区</div>';
  }

  const strategy = state.config.focusStrategy ?? 'mtime';
  const windowMs = FOCUS_WINDOW_MS[state.config.focusWindowKey || '8h'] ?? FOCUS_WINDOW_MS['8h'];
  const cutoff = Date.now() - windowMs;
  const pinned = getPinnedFiles();
  const query = state.searchQuery.trim().toLowerCase();
  const collapsed = getFocusCollapsed();
  const activeTypes = getActiveTypes();

  // 读模式：按最近 open/annotate 信号时间排序，只展示有信号的文件
  const lastOpenMap = strategy === 'open'
    ? buildLastOpenMap(signalCache, cutoff)
    : new Map<string, number>();

  const allCandidates: Array<{ file: FileTreeNode; ws: typeof workspaces[0] }> = [];

  for (const ws of workspaces) {
    const tree = state.fileTree.get(ws.id);
    if (!tree && !pendingScanIds.has(ws.id) && !isWorkspaceFailed(ws.id)) {
      pendingScanIds.add(ws.id);
      void scanWorkspace(ws.id).then((scanned) => {
        pendingScanIds.delete(ws.id);
        if (scanned) {
          import('./sidebar').then(({ renderSidebar }) => renderSidebar());
        } else {
          markWorkspaceFailed(ws.id);
          import('./sidebar').then(({ renderSidebar }) => renderSidebar());
        }
      });
    }
    if (!tree) continue;

    for (const f of collectFiles(tree)) {
      // Type filter (pinned bypass)
      if (!pinned.has(f.path)) {
        const ext = getFileExtension(f.path);
        if (ext === 'jsonl' || ext === 'log') continue;
        if (!activeTypes.has(normalizeFocusFileType(ext))) continue;
      }

      if (pinned.has(f.path)) {
        allCandidates.push({ file: f, ws });
        continue;
      }

      if (strategy === 'open') {
        // 读模式：只显示在时间窗口内有 open/annotate 信号的文件
        if (!lastOpenMap.has(f.path)) continue;
      } else {
        // 写模式：只显示在时间窗口内有 mtime 变化的文件
        const annotationUpdatedAt = state.annotationSummaries?.get(f.path)?.updatedAt;
        const recentAnnotation = annotationUpdatedAt && annotationUpdatedAt >= cutoff;
        const recentMtime = typeof f.lastModified === 'number' && f.lastModified >= cutoff;
        if (!recentMtime && !recentAnnotation) continue;
      }

      allCandidates.push({ file: f, ws });
    }
  }

  // Sort: pinned first, then by relevant time descending
  allCandidates.sort((a, b) => {
    const aPinned = pinned.has(a.file.path);
    const bPinned = pinned.has(b.file.path);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    if (strategy === 'open') {
      const aTs = lastOpenMap.get(a.file.path) ?? 0;
      const bTs = lastOpenMap.get(b.file.path) ?? 0;
      return bTs - aTs;
    } else {
      return (b.file.lastModified || 0) - (a.file.lastModified || 0);
    }
  });

  // Search filter
  const filtered = query
    ? allCandidates.filter(({ file: f }) => {
        const name = stripWorkspaceTreeDisplayExtension(f.name) || f.name;
        return !!fuzzyMatch(name, query) || !!fuzzyMatch(f.path, query);
      })
    : allCandidates;

  if (filtered.length === 0) {
    return `<div class="focus-view">${renderFilterBar()}<div class="focus-empty">暂无最近文件</div></div>`;
  }

  // Group by workspace
  const byWs = new Map<string, FileTreeNode[]>();
  for (const { file, ws } of filtered) {
    const arr = byWs.get(ws.id) ?? [];
    arr.push(file);
    byWs.set(ws.id, arr);
  }

  const groups = workspaces.map((ws) => {
    const files = byWs.get(ws.id);
    if (!files?.length) return '';
    const displayTimeMap = strategy === 'open' ? lastOpenMap : undefined;
    return renderFocusWorkspaceGroup(ws, files, pinned, false, query, collapsed, displayTimeMap);
  }).join('');

  return `<div class="focus-view">${renderFilterBar()}${groups}</div>`;
}

// ── Functions moved here from sidebar-workspace.ts (no circular import) ──────

function setFocusWindowKey(key: string): void {
  state.config.focusWindowKey = key as '8h' | '2d' | '1w' | '1m';
  saveConfig(state.config);
  // 切换时间窗口后，读模式需要重新拉信号（窗口可能扩大）
  refreshFrecencySignals().then(() =>
    import('./sidebar').then(({ renderSidebar }) => renderSidebar())
  );
}

async function handleFocusWorkspaceToggle(workspaceId: string): Promise<void> {
  const collapsed = getFocusCollapsed();
  if (collapsed.has(workspaceId)) {
    collapsed.delete(workspaceId);
  } else {
    collapsed.add(workspaceId);
  }
  saveFocusCollapsed(collapsed);
  const { renderSidebar } = await import('./sidebar');
  renderSidebar();
}

// ── Event delegation ──────────────────────────────────────────────────────────

let _delegateBound = false;

if (typeof window !== 'undefined') {
  void refreshFrecencySignals();

  if (!_delegateBound) {
    _delegateBound = true;

    document.addEventListener('click', async (e) => {
      // 点击 popup 外部关闭
      if (filterPopupOpen && !(e.target as HTMLElement).closest('.focus-filter-popup-wrap')) {
        closeFilterPopup();
      }

      const el = (e.target as Element).closest('[data-action]') as HTMLElement | null;
      if (!el) return;

      const { action, key, workspaceId, alsoToggleFilter } = el.dataset;

      switch (action) {
        case 'focus-workspace-toggle':
          if (workspaceId) await handleFocusWorkspaceToggle(workspaceId);
          break;
        case 'set-focus-window-key':
          if (key) setFocusWindowKey(key);
          if (alsoToggleFilter) toggleFilterPopup();
          break;
        case 'toggle-focus-type-filter':
          if (key) toggleFocusTypeFilter(key);
          break;
        case 'set-focus-strategy':
          if (key) setFocusStrategy(key as 'mtime' | 'open');
          break;
        case 'toggle-filter-popup':
          toggleFilterPopup();
          break;
      }
    });
  }
}
