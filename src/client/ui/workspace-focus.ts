import type { Workspace, FileTreeNode } from '../types';
import { saveConfig } from '../config';
import {
  state,
  markWorkspaceLoading,
  markWorkspaceFailed,
  clearWorkspaceFailed,
  isWorkspaceLoading,
  isWorkspaceFailed,
} from '../state';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { fuzzyMatch } from '../utils/fuzzy-search';
import { getPinnedFiles } from '../utils/pinned-files';
import { scanWorkspace } from '../workspace';
import { duplicateNameHints } from '../utils/file-names';
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
let lastFocusWorkspaceRefreshAt = 0;
const FOCUS_WORKSPACE_REFRESH_COOLDOWN_MS = 30_000;

function scheduleFocusWorkspaceScan(workspaceId: string): void {
  if (pendingScanIds.has(workspaceId) || isWorkspaceLoading(workspaceId) || isWorkspaceFailed(workspaceId)) return;

  pendingScanIds.add(workspaceId);
  markWorkspaceLoading(workspaceId);
  void scanWorkspace(workspaceId).then((scanned) => {
    pendingScanIds.delete(workspaceId);
    if (scanned) {
      clearWorkspaceFailed(workspaceId);
    } else {
      markWorkspaceFailed(workspaceId);
    }
    import('./sidebar').then(({ renderSidebar }) => renderSidebar());
  });
}

export function refreshFocusWorkspaces(force = false): void {
  const now = Date.now();
  if (!force && lastFocusWorkspaceRefreshAt && now - lastFocusWorkspaceRefreshAt < FOCUS_WORKSPACE_REFRESH_COOLDOWN_MS) {
    return;
  }
  lastFocusWorkspaceRefreshAt = now;

  for (const ws of state.config.workspaces) {
    scheduleFocusWorkspaceScan(ws.id);
  }
}

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
  '1w':  7  * 86400 * 1000,
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
  annotationSummaries?: Map<string, { count: number; unanchoredCount: number; updatedAt: number }>
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


function getActiveStrategies(): Set<string> {
  const s = state.config.focusStrategies;
  if (!Array.isArray(s) || s.length === 0) return new Set(['mtime']);
  return new Set(s);
}

export function toggleFocusStrategy(strategy: string): void {
  const active = getActiveStrategies();
  if (active.has(strategy)) {
    if (active.size <= 1) return; // 至少保留一个
    active.delete(strategy);
  } else {
    active.add(strategy);
  }
  state.config.focusStrategies = [...active];
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

export interface FocusFilterModel {
  activeStrategies: Set<string>;
  windowKey: string;
  activeTypes: Set<string>;
  popupOpen: boolean;
}

export interface FocusRowModel {
  file: FileTreeNode;
  nameHint?: string;
  /** 写+读同时开启或只读时显示最近打开时间，否则显示修改时间 */
  displayTime?: number;
}

export interface FocusGroupModel {
  workspace: Workspace;
  collapsed: boolean;
  rows: FocusRowModel[];
}

export type FocusViewModel =
  | { kind: 'no-workspaces' }
  | { kind: 'scanning'; filter: FocusFilterModel }
  | { kind: 'empty'; filter: FocusFilterModel }
  | { kind: 'ready'; filter: FocusFilterModel; query: string; groups: FocusGroupModel[] };

function getFilterModel(): FocusFilterModel {
  return {
    activeStrategies: getActiveStrategies(),
    windowKey: state.config.focusWindowKey || '8h',
    activeTypes: getActiveTypes(),
    popupOpen: filterPopupOpen,
  };
}

/** 渲染前调用：启动各工作区的扫描（有副作用，不能放在渲染函数里） */
export function prepareFocusView(): void {
  refreshFocusWorkspaces(false);
  for (const ws of state.config.workspaces) {
    if (!state.fileTree.get(ws.id)) scheduleFocusWorkspaceScan(ws.id);
  }
}

/** focus 视图的全部数据；纯计算，供 React 组件渲染 */
export function buildFocusView(): FocusViewModel {
  const workspaces = state.config.workspaces;
  if (workspaces.length === 0) return { kind: 'no-workspaces' };

  const filter = getFilterModel();
  const activeStrategies = filter.activeStrategies;
  const useMtime = activeStrategies.has('mtime');
  const useOpen = activeStrategies.has('open');
  const windowMs = FOCUS_WINDOW_MS[state.config.focusWindowKey || '8h'] ?? FOCUS_WINDOW_MS['8h'];
  const cutoff = Date.now() - windowMs;
  const pinned = getPinnedFiles();
  const query = state.searchQuery.trim().toLowerCase();
  const collapsed = getFocusCollapsed();
  const activeTypes = filter.activeTypes;

  // 读模式需要 open/annotate 信号
  const lastOpenMap = useOpen
    ? buildLastOpenMap(signalCache, cutoff)
    : new Map<string, number>();

  const allCandidates: Array<{ file: FileTreeNode; ws: Workspace }> = [];

  for (const ws of workspaces) {
    const tree = state.fileTree.get(ws.id);
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

      // 取并集：满足任一启用的策略即可进入列表
      const inMtime = useMtime && (() => {
        const annotationUpdatedAt = state.annotationSummaries?.get(f.path)?.updatedAt;
        const recentAnnotation = annotationUpdatedAt && annotationUpdatedAt >= cutoff;
        const recentMtime = typeof f.lastModified === 'number' && f.lastModified >= cutoff;
        return recentMtime || recentAnnotation;
      })();
      const inOpen = useOpen && lastOpenMap.has(f.path);
      if (!inMtime && !inOpen) continue;

      allCandidates.push({ file: f, ws });
    }
  }

  // Sort: pinned first, then by the most recent relevant time descending
  allCandidates.sort((a, b) => {
    const aPinned = pinned.has(a.file.path);
    const bPinned = pinned.has(b.file.path);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    // Pick the most recent timestamp across enabled strategies for each file
    const getTs = (f: FileTreeNode) => {
      let ts = 0;
      if (useMtime) ts = Math.max(ts, f.lastModified || 0);
      if (useOpen) ts = Math.max(ts, lastOpenMap.get(f.path) ?? 0);
      return ts;
    };
    return getTs(b.file) - getTs(a.file);
  });

  // Search filter
  const filtered = query
    ? allCandidates.filter(({ file: f }) => {
        const name = stripWorkspaceTreeDisplayExtension(f.name) || f.name;
        return !!fuzzyMatch(name, query) || !!fuzzyMatch(f.path, query);
      })
    : allCandidates;

  const hasLoadingWorkspaces = workspaces.some((ws) => isWorkspaceLoading(ws.id) || pendingScanIds.has(ws.id));
  if (filtered.length === 0 && hasLoadingWorkspaces) return { kind: 'scanning', filter };
  if (filtered.length === 0) return { kind: 'empty', filter };

  // Group by workspace
  const byWs = new Map<string, FileTreeNode[]>();
  for (const { file, ws } of filtered) {
    const arr = byWs.get(ws.id) ?? [];
    arr.push(file);
    byWs.set(ws.id, arr);
  }

  // 读模式下显示最近打开时间；写+读同时开时也用最近打开时间（更能反映"最近活跃"）
  const displayTimeMap = useOpen ? lastOpenMap : undefined;

  const groups: FocusGroupModel[] = [];
  for (const ws of workspaces) {
    const files = byWs.get(ws.id);
    if (!files?.length) continue;
    const nameHints = duplicateNameHints(files.map((f) => f.path));
    groups.push({
      workspace: ws,
      collapsed: collapsed.has(ws.id),
      rows: files.map((file) => ({
        file,
        nameHint: nameHints.get(file.path),
        displayTime: displayTimeMap?.get(file.path),
      })),
    });
  }

  return { kind: 'ready', filter, query, groups };
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
        case 'toggle-focus-strategy':
          if (key) toggleFocusStrategy(key);
          break;
        case 'toggle-filter-popup':
          toggleFilterPopup();
          break;
      }
    });
  }
}
