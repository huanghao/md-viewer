import type { Workspace, FileTreeNode } from '../types';
import { state } from '../state';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { getFileListStatus } from '../utils/file-status';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { getPinnedFiles, isPinned } from '../utils/pinned-files';
import { scanWorkspace } from '../workspace';

// Simple glob matcher for .mdvignore patterns
// Supports: *, **, ?, and prefix matching (e.g. "bots-ws/" matches any path under bots-ws/)
function globToRegex(pattern: string): RegExp {
  // Escape special regex chars except * and ?
  let p = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  // ** matches any path segment including /
  p = p.replace(/\*\*/g, '§GLOBSTAR§');
  // * matches anything except /
  p = p.replace(/\*/g, '[^/]*');
  // ? matches single char except /
  p = p.replace(/\?/g, '[^/]');
  // restore **
  p = p.replace(/§GLOBSTAR§/g, '.*');
  // If pattern ends with /, match as directory prefix
  if (pattern.endsWith('/')) {
    return new RegExp(`(^|/)${p}`);
  }
  return new RegExp(`(^|/)${p}(/|$)`);
}

function isIgnored(filePath: string, workspacePath: string, patterns: string[]): boolean {
  if (!patterns.length) return false;
  // Get path relative to workspace root
  const rel = filePath.startsWith(workspacePath + '/')
    ? filePath.slice(workspacePath.length + 1)
    : filePath;
  return patterns.some((p) => globToRegex(p).test(rel));
}

// Track in-flight workspace scans to prevent duplicate requests during render
const scanningWorkspaceIds = new Set<string>();

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

// Returns files that are active: mtime within window OR pinned, minus .mdvignore matches
function getActiveFiles(
  workspacePath: string,
  tree: FileTreeNode | undefined,
  windowMs: number,
  pinned: Set<string>
): FileTreeNode[] {
  if (!tree) return [];
  const cutoff = Date.now() - windowMs;
  const ignorePatterns = tree.ignorePatterns || [];
  const all = collectFiles(tree);
  return all.filter((f) => {
    // .mdvignore applies to focus view only (pinned files are also filtered)
    if (ignorePatterns.length && isIgnored(f.path, workspacePath, ignorePatterns)) return false;
    if (pinned.has(f.path)) return true;
    if (typeof f.lastModified === 'number' && f.lastModified >= cutoff) return true;
    return false;
  }).sort((a, b) => {
    // Pinned first, then by mtime descending
    const aPinned = pinned.has(a.path);
    const bPinned = pinned.has(b.path);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;
    return (b.lastModified || 0) - (a.lastModified || 0);
  });
}

function formatRelativeTime(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(diff / 86400000)}d`;
}

function highlightQuery(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  return escapeHtml(text.slice(0, idx))
    + `<mark class="search-highlight">${escapeHtml(text.slice(idx, idx + query.length))}</mark>`
    + escapeHtml(text.slice(idx + query.length));
}

function renderFocusFileItem(file: FileTreeNode, pinned: Set<string>, query: string): string {
  const isCurrent = state.currentFile === file.path;
  const isPinnedFile = pinned.has(file.path);
  const fileInfo = state.sessionFiles.get(file.path);
  const statusType = fileInfo ? getFileListStatus(fileInfo).type : 'normal';
  const icon = getFileTypeIcon(file.path);
  const displayName = stripWorkspaceTreeDisplayExtension(file.name) || file.name;
  const timeStr = file.lastModified ? formatRelativeTime(file.lastModified) : '';

  const statusDot = statusType === 'modified'
    ? '<span class="focus-file-dot modified"></span>'
    : statusType === 'new'
    ? '<span class="focus-file-dot new-file"></span>'
    : '';

  const pinIcon = isPinnedFile
    ? `<button class="tree-pin-btn active" title="取消固定" onclick="event.stopPropagation();handleUnpinFile('${escapeAttr(file.path)}')" data-path="${escapeAttr(file.path)}">📌</button>`
    : `<button class="tree-pin-btn" title="固定到焦点视图" onclick="event.stopPropagation();handlePinFile('${escapeAttr(file.path)}')">📌</button>`;

  return `
    <div class="tree-item file-node focus-file-item${isCurrent ? ' current' : ''}"
         data-path="${escapeAttr(file.path)}"
         onclick="handleFocusFileClick('${escapeAttr(file.path)}')">
      <span class="tree-indent" style="width:8px"></span>
      <span class="file-type-icon ${icon.cls}">${escapeHtml(icon.label)}</span>
      <span class="tree-name"><span class="tree-name-full">${highlightQuery(displayName, query)}</span></span>
      ${statusDot}
      ${timeStr ? `<span class="focus-file-time">${escapeHtml(timeStr)}</span>` : ''}
      ${pinIcon}
    </div>
  `;
}

function renderFilterBar(): string {
  const current = state.config.focusWindowKey || '8h';
  const options: Array<{ key: string; label: string }> = [
    { key: '8h', label: '8h' },
    { key: '2d', label: '2d' },
    { key: '1w', label: '1w' },
    { key: '1m', label: '1m' },
  ];
  const pills = options.map(o =>
    `<button class="focus-time-pill${current === o.key ? ' active' : ''}"
             onclick="setFocusWindowKey('${o.key}')">${o.label}</button>`
  ).join('');
  return `
    <div class="focus-filter-bar">
      <span class="focus-filter-label">最近</span>
      <div class="focus-time-pills">${pills}</div>
    </div>
  `;
}

function renderFocusWorkspaceGroup(
  workspace: Workspace,
  activeFiles: FileTreeNode[],
  pinned: Set<string>,
  loading: boolean,
  query: string
): string {
  const hasFiles = activeFiles.length > 0;
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
        <span class="focus-ws-arrow${hasFiles ? ' open' : ''}">▶</span>
        <span class="focus-ws-name">${escapeHtml(workspace.name)}</span>
        ${badge}
      </div>
      ${hasFiles ? `<div class="focus-ws-files">${filesHtml}</div>` : ''}
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

  const groups = workspaces.map((ws) => {
    const tree = state.fileTree.get(ws.id);
    const loading = !tree;
    if (!tree && !scanningWorkspaceIds.has(ws.id)) {
      scanningWorkspaceIds.add(ws.id);
      void scanWorkspace(ws.id).then((scanned) => {
        scanningWorkspaceIds.delete(ws.id);
        if (scanned) {
          import('./sidebar').then(({ renderSidebar }) => renderSidebar());
        }
      });
    }
    let activeFiles = getActiveFiles(ws.path, tree, windowMs, pinned);
    // Apply search filter: match against file name or path
    if (query) {
      activeFiles = activeFiles.filter((f) => {
        const name = (stripWorkspaceTreeDisplayExtension(f.name) || f.name).toLowerCase();
        return name.includes(query) || f.path.toLowerCase().includes(query);
      });
    }
    return renderFocusWorkspaceGroup(ws, activeFiles, pinned, loading, query);
  }).join('');

  return `<div class="focus-view">${renderFilterBar()}${groups}</div>`;
}
