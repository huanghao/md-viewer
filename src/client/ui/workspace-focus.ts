import type { Workspace, FileTreeNode } from '../types';
import {
  state,
  markWorkspaceFailed,
  isWorkspaceFailed,
} from '../state';
import { buildIgnoredSet } from '../utils/ignore-filter';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { getPinnedFiles } from '../utils/pinned-files';
import { scanWorkspace } from '../workspace';
import { renderFileRow } from './file-row';
import { getFileExtension } from '../utils/file-type';
import { storageGet, storageSet } from '../utils/storage';

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

const activeTypes: Set<string> = new Set(['md', 'pdf']);

export function toggleFocusTypeFilter(ext: string): void {
  if (activeTypes.has(ext)) {
    if (activeTypes.size > 1) {
      activeTypes.delete(ext);
    }
  } else {
    activeTypes.add(ext);
  }
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

// ── Frecency ──────────────────────────────────────────────────────────────────

const FRECENCY_WEIGHTS = { open: 10, annotate: 15, mtime: 1 } as const;
const FRECENCY_HALF_LIFE_HOURS = { open: 48, annotate: 48, mtime: 8 } as const;
type FrecencySignalType = keyof typeof FRECENCY_WEIGHTS;

interface FrecencySignal { ts: number; type: string; file: string; }

// In-memory signal cache, refreshed periodically
let signalCache: FrecencySignal[] = [];
let signalCacheTs = 0;
const SIGNAL_CACHE_TTL = 30_000; // refresh every 30s

export async function refreshFrecencySignals(): Promise<void> {
  try {
    const res = await fetch('/api/focus-signals?days=7');
    if (!res.ok) return;
    const data = await res.json() as { signals: FrecencySignal[] };
    signalCache = data.signals;
    signalCacheTs = Date.now();
  } catch { /* server not available */ }
}

function getSignalCache(): FrecencySignal[] {
  if (Date.now() - signalCacheTs > SIGNAL_CACHE_TTL) {
    void refreshFrecencySignals();
  }
  return signalCache;
}

// Compute frecency score for a single file
function computeFrecencyScore(filePath: string, signals: FrecencySignal[]): number {
  const now = Date.now();
  return signals
    .filter((s) => s.file === filePath)
    .reduce((sum, s) => {
      const type = (s.type in FRECENCY_WEIGHTS ? s.type : 'mtime') as FrecencySignalType;
      const ageHours = (now - s.ts) / 3_600_000;
      const lambda = Math.LN2 / FRECENCY_HALF_LIFE_HOURS[type];
      return sum + FRECENCY_WEIGHTS[type] * Math.exp(-lambda * ageHours);
    }, 0);
}

// Build a score map for all files that appear in signals
export function buildFrecencyMap(signals: FrecencySignal[]): Map<string, number> {
  const files = new Set(signals.map((s) => s.file));
  const map = new Map<string, number>();
  for (const f of files) {
    map.set(f, computeFrecencyScore(f, signals));
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

// Returns files that are active: mtime within window OR recent annotation OR pinned, minus .mdvignore matches
export function getActiveFiles(
  workspacePath: string,
  tree: FileTreeNode | undefined,
  windowMs: number,
  pinned: Set<string>,
  annotationSummaries?: Map<string, { count: number; updatedAt: number }>
): FileTreeNode[] {
  if (!tree) return [];
  const cutoff = Date.now() - windowMs;
  const ignored = buildIgnoredSet(tree, workspacePath);
  const all = collectFiles(tree);
  return all.filter((f) => {
    if (ignored.has(f.path)) return false;
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


function renderFocusFileItem(file: FileTreeNode, pinned: Set<string>, query: string): string {
  return renderFileRow(file.path, file.name, file.lastModified, {
    containerClass: 'tree-item file-node focus-file-item',
    onClickJs: (p) => `handleFocusFileClick('${escapeAttr(p)}')`,
    showPin: true,
    showTime: true,
    indentPx: 8,
    query,
    showClose: false,
  });
}

export function setFocusStrategy(strategy: 'frecency' | 'mtime'): void {
  state.config.focusStrategy = strategy;
  import('../config').then(({ saveConfig }) => saveConfig(state.config));
  import('./sidebar').then(({ renderSidebar }) => renderSidebar());
}

function renderFilterBar(): string {
  const strategy = state.config.focusStrategy ?? 'frecency';
  const typeOptions: Array<{ ext: string; label: string }> = [
    { ext: 'md', label: 'MD' },
    { ext: 'pdf', label: 'PDF' },
    { ext: 'html', label: 'HTML' },
    { ext: 'json', label: 'JSON' },
  ];
  const typePills = typeOptions.map(o =>
    `<button class="focus-type-pill${activeTypes.has(o.ext) ? ' active' : ''}"
             onclick="toggleFocusTypeFilter('${o.ext}')">${o.label}</button>`
  ).join('');

  // Time window pills (only shown in mtime strategy)
  const timeOptions: Array<{ key: string; label: string }> = [
    { key: '8h', label: '8h' },
    { key: '1d', label: '1d' },
    { key: '2d', label: '2d' },
  ];
  const current = state.config.focusWindowKey || '8h';
  const timePills = strategy === 'mtime' ? `
    <div class="focus-time-pills">${timeOptions.map(o =>
      `<button class="focus-time-pill${current === o.key ? ' active' : ''}"
               onclick="setFocusWindowKey('${o.key}')">${o.label}</button>`
    ).join('')}</div>
    <span class="focus-filter-sep">│</span>` : '';

  return `
    <div class="focus-filter-bar">
      <span class="focus-filter-label">最近</span>
      ${timePills}
      <div class="focus-type-pills">${typePills}</div>
    </div>
  `;
}

function renderFocusWorkspaceGroup(
  workspace: Workspace,
  activeFiles: FileTreeNode[],
  pinned: Set<string>,
  loading: boolean,
  query: string,
  collapsed: Set<string>
): string {
  const hasFiles = activeFiles.length > 0;
  const isCollapsed = collapsed.has(workspace.id);
  const badge = loading
    ? `<span class="focus-ws-badge empty">…</span>`
    : hasFiles
    ? `<span class="focus-ws-badge">${activeFiles.length}</span>`
    : `<span class="focus-ws-badge empty">0</span>`;

  const filesHtml = hasFiles
    ? activeFiles.map((f) => renderFocusFileItem(f, pinned, query)).join('')
    : '';

  return `
    <div class="focus-ws-group${hasFiles ? ' has-files' : ''}">
      <div class="focus-ws-header" onclick="handleFocusWorkspaceToggle('${escapeAttr(workspace.id)}')">
        <span class="focus-ws-arrow${!isCollapsed ? ' open' : ''}">▶</span>
        <span class="focus-ws-name">${escapeHtml(workspace.name)}</span>
        ${badge}
      </div>
      ${hasFiles && !isCollapsed ? `<div class="focus-ws-files">${filesHtml}</div>` : ''}
    </div>
  `;
}

const FOCUS_PAGE_SIZE = 15;
let focusPage = 1; // in-memory only, resets on page refresh

export function loadMoreFocus(): void {
  focusPage += 1;
  import('./sidebar').then(({ renderSidebar }) => renderSidebar());
}

function renderFocusViewMtime(): string {
  const workspaces = state.config.workspaces;
  const windowMs = FOCUS_WINDOW_MS[state.config.focusWindowKey || '8h'] ?? FOCUS_WINDOW_MS['8h'];
  const pinned = getPinnedFiles();
  const query = state.searchQuery.trim().toLowerCase();
  const collapsed = getFocusCollapsed();

  const groups = workspaces.map((ws) => {
    const tree = state.fileTree.get(ws.id);
    const loading = !tree;
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
    let activeFiles = getActiveFiles(ws.path, tree, windowMs, pinned, state.annotationSummaries);
    if (query) {
      activeFiles = activeFiles.filter((f) => {
        const name = (stripWorkspaceTreeDisplayExtension(f.name) || f.name).toLowerCase();
        return name.includes(query) || f.path.toLowerCase().includes(query);
      });
    }
    activeFiles = activeFiles.filter((f) => {
      if (pinned.has(f.path)) return true;
      const ext = getFileExtension(f.path);
      const norm = ext === 'markdown' ? 'md' : ext === 'htm' ? 'html' : ext === 'jsonl' ? 'json' : ext;
      return activeTypes.has(norm);
    });
    if (!loading && activeFiles.length === 0) return '';
    return renderFocusWorkspaceGroup(ws, activeFiles, pinned, loading, query, collapsed);
  }).join('');

  const allEmpty = !groups.replace(/\s/g, '');
  return `<div class="focus-view">${renderFilterBar()}${allEmpty ? '<div class="focus-empty">暂无最近文件</div>' : groups}</div>`;
}

export function renderFocusView(): string {
  const workspaces = state.config.workspaces;
  if (workspaces.length === 0) {
    return '<div class="focus-empty">暂无工作区</div>';
  }

  const strategy = state.config.focusStrategy ?? 'frecency';

  // mtime strategy: delegate to original time-window logic
  if (strategy === 'mtime') {
    return renderFocusViewMtime();
  }

  const pinned = getPinnedFiles();
  const query = state.searchQuery.trim().toLowerCase();
  const signals = getSignalCache();
  const frecencyMap = buildFrecencyMap(signals);
  const collapsed = getFocusCollapsed();

  // Collect all files across workspaces, trigger scans as needed
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
    const ignored = buildIgnoredSet(tree, ws.path);
    for (const f of collectFiles(tree)) {
      if (ignored.has(f.path)) continue;
      // Type filter (pinned bypass)
      if (!pinned.has(f.path)) {
        const ext = getFileExtension(f.path);
        const norm = ext === 'markdown' ? 'md' : ext === 'htm' ? 'html' : ext === 'jsonl' ? 'json' : ext;
        if (!activeTypes.has(norm)) continue;
      }
      // Only include files that have at least some frecency signal
      const score = frecencyMap.get(f.path) ?? 0;
      if (!pinned.has(f.path) && score === 0) continue;
      allCandidates.push({ file: f, ws });
    }
  }

  // Sort: pinned first, then by frecency score desc, fallback to mtime
  allCandidates.sort((a, b) => {
    const aPinned = pinned.has(a.file.path);
    const bPinned = pinned.has(b.file.path);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    const aScore = frecencyMap.get(a.file.path) ?? 0;
    const bScore = frecencyMap.get(b.file.path) ?? 0;
    if (bScore !== aScore) return bScore - aScore;
    return (b.file.lastModified || 0) - (a.file.lastModified || 0);
  });

  // Search filter
  let filtered = query
    ? allCandidates.filter(({ file: f }) => {
        const name = (stripWorkspaceTreeDisplayExtension(f.name) || f.name).toLowerCase();
        return name.includes(query) || f.path.toLowerCase().includes(query);
      })
    : allCandidates;

  if (filtered.length === 0) {
    return `<div class="focus-view">${renderFilterBar()}<div class="focus-empty">暂无最近文件</div></div>`;
  }

  const limit = focusPage * FOCUS_PAGE_SIZE;
  const visible = filtered.slice(0, limit);
  const remaining = filtered.length - visible.length;

  // Group visible files by workspace for display
  const byWs = new Map<string, FileTreeNode[]>();
  for (const { file, ws } of visible) {
    const arr = byWs.get(ws.id) ?? [];
    arr.push(file);
    byWs.set(ws.id, arr);
  }

  const groups = workspaces.map((ws) => {
    const files = byWs.get(ws.id);
    if (!files?.length) return '';
    return renderFocusWorkspaceGroup(ws, files, pinned, false, query, collapsed);
  }).join('');

  const moreBtn = remaining > 0
    ? `<button class="focus-more-btn" onclick="loadMoreFocus()">显示更多 (还有 ${remaining} 个)</button>`
    : '';

  return `<div class="focus-view">${renderFilterBar()}${groups}${moreBtn}</div>`;
}

if (typeof window !== 'undefined') {
  (window as any).toggleFocusTypeFilter = toggleFocusTypeFilter;
  (window as any).loadMoreFocus = loadMoreFocus;
  (window as any).setFocusStrategy = setFocusStrategy;
  void refreshFrecencySignals();
}
