import type { Workspace, FileTreeNode } from '../types';
import { state } from '../state';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { getFileListStatus } from '../utils/file-status';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { getPinnedFiles, isPinned } from '../utils/pinned-files';
import { scanWorkspace } from '../workspace';

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

// Returns files that are active: mtime within window OR pinned
function getActiveFiles(
  workspacePath: string,
  tree: FileTreeNode | undefined,
  windowMs: number,
  pinned: Set<string>
): FileTreeNode[] {
  if (!tree) return [];
  const cutoff = Date.now() - windowMs;
  const all = collectFiles(tree);
  return all.filter((f) => {
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

function renderFocusFileItem(file: FileTreeNode, pinned: Set<string>): string {
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
      <span class="focus-file-icon tree-file-icon ${icon.cls}">${escapeHtml(icon.label)}</span>
      <span class="tree-name"><span class="tree-name-full">${escapeHtml(displayName)}</span></span>
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
  loading: boolean
): string {
  const hasFiles = activeFiles.length > 0;
  const badge = loading
    ? `<span class="focus-ws-badge empty">…</span>`
    : hasFiles
    ? `<span class="focus-ws-badge">${activeFiles.length}</span>`
    : `<span class="focus-ws-badge empty">0</span>`;

  const filesHtml = hasFiles
    ? activeFiles.map((f) => renderFocusFileItem(f, pinned)).join('')
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

  const groups = workspaces.map((ws) => {
    const tree = state.fileTree.get(ws.id);
    const loading = !tree;
    if (!tree) {
      void scanWorkspace(ws.id).then((scanned) => {
        if (scanned) {
          import('./sidebar').then(({ renderSidebar }) => renderSidebar());
        }
      });
    }
    const activeFiles = getActiveFiles(ws.path, tree, windowMs, pinned);
    return renderFocusWorkspaceGroup(ws, activeFiles, pinned, loading);
  }).join('');

  return `<div class="focus-view">${renderFilterBar()}${groups}</div>`;
}
