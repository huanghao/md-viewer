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
  try {
    return new Set(JSON.parse(localStorage.getItem(FOCUS_COLLAPSED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export function saveFocusCollapsed(s: Set<string>): void {
  localStorage.setItem(FOCUS_COLLAPSED_KEY, JSON.stringify([...s]));
}

const FOCUS_WINDOW_MS: Record<string, number> = {
  '8h':  8  * 3600 * 1000,
  '2d':  2  * 86400 * 1000,
  '1w':  7  * 86400 * 1000,
  '1m':  30 * 86400 * 1000,
};

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

function renderFilterBar(): string {
  const current = state.config.focusWindowKey || '8h';
  const timeOptions: Array<{ key: string; label: string }> = [
    { key: '8h', label: '8h' },
    { key: '2d', label: '2d' },
    { key: '1w', label: '1w' },
    { key: '1m', label: '1m' },
  ];
  const timePills = timeOptions.map(o =>
    `<button class="focus-time-pill${current === o.key ? ' active' : ''}"
             onclick="setFocusWindowKey('${o.key}')">${o.label}</button>`
  ).join('');

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

  return `
    <div class="focus-filter-bar">
      <span class="focus-filter-label">最近</span>
      <div class="focus-time-pills">${timePills}</div>
      <span class="focus-filter-sep">│</span>
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

export function renderFocusView(): string {
  const workspaces = state.config.workspaces;
  if (workspaces.length === 0) {
    return '<div class="focus-empty">暂无工作区</div>';
  }

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
    // Apply search filter: match against file name or path
    if (query) {
      activeFiles = activeFiles.filter((f) => {
        const name = (stripWorkspaceTreeDisplayExtension(f.name) || f.name).toLowerCase();
        return name.includes(query) || f.path.toLowerCase().includes(query);
      });
    }
    return renderFocusWorkspaceGroup(ws, activeFiles, pinned, loading, query, collapsed);
  }).join('');

  return `<div class="focus-view">${renderFilterBar()}${groups}</div>`;
}

if (typeof window !== 'undefined') {
  (window as any).toggleFocusTypeFilter = toggleFocusTypeFilter;
}
