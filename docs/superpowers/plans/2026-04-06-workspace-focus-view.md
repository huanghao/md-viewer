# Workspace Focus View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "焦点视图" (Focus View) to the workspace sidebar that shows only recently-modified files (by mtime, configurable time window) and user-pinned files, grouped by workspace — replacing the full directory tree with a compact, activity-driven list.

**Architecture:** The focus view is a new rendering path inside the existing workspace sidebar (`sidebar-workspace.ts`). It reads file mtime from the server-side file tree (already fetched per workspace), filters by a configurable time window, and merges in pinned files stored in `localStorage`. The workspace sidebar gains a three-way `sidebarView` toggle: `'simple' | 'workspace' | 'focus'`. Pin state is persisted in a new `localStorage` key `md-viewer:pinned-files` as a `Set<string>` (file paths).

**Tech Stack:** TypeScript, pure DOM, localStorage — zero new dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/client/types.ts` | Modify | Add `sidebarView` to `AppConfig`; add `focusWindowHours` to `AppConfig` |
| `src/client/config.ts` | Modify | Add `sidebarView: 'focus'` default; add `focusWindowHours: 4` default |
| `src/client/ui/workspace-focus.ts` | **Create** | Focus view renderer: filter files by mtime + pins, render grouped list |
| `src/client/ui/sidebar-workspace.ts` | Modify | Export pin/unpin helpers; expose context menu on file nodes |
| `src/client/ui/sidebar.ts` | Modify | Add focus view toggle button; wire `sidebarView` to render path |
| `src/client/css.ts` | Modify | Add focus view styles |

---

### Task 1: Extend config types and defaults

**Files:**
- Modify: `src/client/types.ts`
- Modify: `src/client/config.ts`

- [ ] **Step 1: Add `sidebarView` and `focusWindowHours` to `AppConfig` in `src/client/types.ts`**

Find the `AppConfig` interface (currently at line 35–38) and replace it:

```ts
export interface AppConfig {
  sidebarMode: 'simple' | 'workspace';
  sidebarView: 'focus' | 'full';  // within workspace mode: focus or full tree
  focusWindowHours: number;        // mtime window for focus view (default 4)
  workspaces: Workspace[];
}
```

- [ ] **Step 2: Add defaults in `src/client/config.ts`**

Find `defaultConfig` (currently at line 6–9) and replace it:

```ts
export const defaultConfig: AppConfig = {
  sidebarMode: 'simple',
  sidebarView: 'focus',
  focusWindowHours: 4,
  workspaces: [],
};
```

- [ ] **Step 3: Build to verify no type errors**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/client/types.ts src/client/config.ts
git commit -m "feat: add sidebarView and focusWindowHours to AppConfig"
```

---

### Task 2: Pin state persistence helpers

**Files:**
- Create: `src/client/utils/pinned-files.ts`

- [ ] **Step 1: Create `src/client/utils/pinned-files.ts`**

```ts
const PINNED_KEY = 'md-viewer:pinned-files';

function loadPinned(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function savePinned(pinned: Set<string>): void {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(Array.from(pinned)));
  } catch {
    // ignore quota errors — pins are best-effort
  }
}

export function isPinned(filePath: string): boolean {
  return loadPinned().has(filePath);
}

export function pinFile(filePath: string): void {
  const pinned = loadPinned();
  pinned.add(filePath);
  savePinned(pinned);
}

export function unpinFile(filePath: string): void {
  const pinned = loadPinned();
  pinned.delete(filePath);
  savePinned(pinned);
}

export function getPinnedFiles(): Set<string> {
  return loadPinned();
}
```

- [ ] **Step 2: Build to verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/client/utils/pinned-files.ts
git commit -m "feat: add pinned-files persistence helpers"
```

---

### Task 3: Focus view renderer

**Files:**
- Create: `src/client/ui/workspace-focus.ts`

This is the core rendering logic. It collects active files (mtime within window OR pinned) per workspace and renders a compact grouped list.

- [ ] **Step 1: Create `src/client/ui/workspace-focus.ts`**

```ts
import type { Workspace, FileTreeNode } from '../types';
import { state } from '../state';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { getFileListStatus } from '../utils/file-status';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { getPinnedFiles, isPinned } from '../utils/pinned-files';

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
  const status = getFileListStatus(file.path);
  const icon = getFileTypeIcon(file.path);
  const displayName = stripWorkspaceTreeDisplayExtension(file.name) || file.name;
  const timeStr = file.lastModified ? formatRelativeTime(file.lastModified) : '';
  const statusDot = status === 'modified'
    ? '<span class="focus-file-dot modified"></span>'
    : status === 'new'
    ? '<span class="focus-file-dot new-file"></span>'
    : '';
  const pinIcon = isPinnedFile
    ? `<button class="focus-pin-btn active" title="取消固定" onclick="event.stopPropagation();handleUnpinFile('${escapeAttr(file.path)}')" data-path="${escapeAttr(file.path)}">📌</button>`
    : '';

  return `
    <div class="focus-file-item${isCurrent ? ' current' : ''}"
         data-path="${escapeAttr(file.path)}"
         onclick="handleFocusFileClick('${escapeAttr(file.path)}')">
      <span class="focus-file-icon tree-file-icon ${icon.cls}">${escapeHtml(icon.label)}</span>
      <span class="focus-file-name">${escapeHtml(displayName)}</span>
      ${statusDot}
      ${pinIcon}
      ${timeStr ? `<span class="focus-file-time">${escapeHtml(timeStr)}</span>` : ''}
    </div>
  `;
}

function renderFocusWorkspaceGroup(workspace: Workspace, activeFiles: FileTreeNode[], pinned: Set<string>): string {
  const hasFiles = activeFiles.length > 0;
  const badge = hasFiles
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

  const windowMs = (state.config.focusWindowHours || 4) * 3600 * 1000;
  const pinned = getPinnedFiles();

  const groups = workspaces.map((ws) => {
    const tree = state.fileTree.get(ws.id);
    const activeFiles = getActiveFiles(ws.path, tree, windowMs, pinned);
    return renderFocusWorkspaceGroup(ws, activeFiles, pinned);
  }).join('');

  return `<div class="focus-view">${groups}</div>`;
}
```

- [ ] **Step 2: Build to verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -30
```

Expected: build succeeds. If `getFileListStatus` signature is wrong, check `src/client/utils/file-status.ts` and adjust the call.

- [ ] **Step 3: Commit**

```bash
git add src/client/ui/workspace-focus.ts
git commit -m "feat: add focus view renderer for workspace sidebar"
```

---

### Task 4: Wire focus view into sidebar

**Files:**
- Modify: `src/client/ui/sidebar.ts`
- Modify: `src/client/ui/sidebar-workspace.ts`

- [ ] **Step 1: Add focus/full toggle to `renderSidebar` in `sidebar.ts`**

Find `toggleSidebarMode` (line 44) and add a new function after it:

```ts
export function toggleWorkspaceView(): void {
  state.config.sidebarView = state.config.sidebarView === 'focus' ? 'full' : 'focus';
  saveConfig(state.config);
  renderSidebar();
}
```

Also expose it on window (after the existing window assignments around line 51):
```ts
(window as any).toggleWorkspaceView = toggleWorkspaceView;
```

- [ ] **Step 2: Add toggle button to workspace mode header in `sidebar.ts`**

Find where the workspace mode header HTML is rendered (search for `workspace-mode` or the toolbar that shows when `sidebarMode === 'workspace'`). In `renderSidebar`, find the section that renders the workspace header and add a toggle button:

Read `src/client/ui/sidebar.ts` lines 140–200 to find the exact location, then insert:

```ts
// Inside the workspace header HTML, add after the existing buttons:
const viewLabel = state.config.sidebarView === 'focus' ? '焦点' : '全量';
// Add this button to the header actions:
`<button class="sidebar-view-toggle" onclick="toggleWorkspaceView()" title="切换焦点/全量视图">${viewLabel}</button>`
```

- [ ] **Step 3: Wire focus view in `renderWorkspaceSidebar` in `sidebar-workspace.ts`**

Find `renderWorkspaceSidebar` (line 333) and modify it:

```ts
import { renderFocusView } from './workspace-focus';

export function renderWorkspaceSidebar(): string {
  if (state.config.sidebarView === 'focus') {
    return renderFocusView();
  }
  const query = state.searchQuery.trim().toLowerCase();
  ensureWorkspaceSearchResults(query);
  return `
    ${renderWorkspaceSection(query)}
  `;
}
```

- [ ] **Step 4: Add window handlers for focus view interactions in `sidebar-workspace.ts`**

At the bottom of `bindWorkspaceEvents` (or wherever other window handlers are registered), add:

```ts
(window as any).handleFocusFileClick = (path: string) => {
  const { switchFile } = require('../main') as any;
  // Use the existing window.switchFile pattern
  (window as any).switchFile?.(path);
};

(window as any).handleUnpinFile = (path: string) => {
  import('../utils/pinned-files').then(({ unpinFile }) => {
    unpinFile(path);
    renderSidebar();
  });
};

(window as any).handlePinFile = (path: string) => {
  import('../utils/pinned-files').then(({ pinFile }) => {
    pinFile(path);
    renderSidebar();
  });
};

(window as any).handleFocusWorkspaceToggle = (_id: string) => {
  // Focus view groups are always expanded when they have files;
  // clicking a group with 0 files could switch to full view for that workspace.
  // For now, no-op — groups auto-expand based on content.
};
```

Note: Check how `switchFile` is called elsewhere in `sidebar-workspace.ts` (search for `switchFile` or `window.switchFile`) and use the same pattern.

- [ ] **Step 5: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -30
```

Expected: build succeeds. Fix any import errors.

- [ ] **Step 6: Commit**

```bash
git add src/client/ui/sidebar.ts src/client/ui/sidebar-workspace.ts
git commit -m "feat: wire focus view toggle into workspace sidebar"
```

---

### Task 5: Pin from full view (context menu on file nodes)

**Files:**
- Modify: `src/client/ui/sidebar-workspace.ts`

The full tree view needs a way to pin files. Add a pin button that appears on hover for each file node.

- [ ] **Step 1: Import pin helpers in `sidebar-workspace.ts`**

At the top of `sidebar-workspace.ts`, add:

```ts
import { isPinned, pinFile, unpinFile } from '../utils/pinned-files';
```

- [ ] **Step 2: Find the file node renderer in `sidebar-workspace.ts`**

Search for `renderFileNode` or `tree-item file-node` in `sidebar-workspace.ts`. Read that function to understand its current HTML structure.

- [ ] **Step 3: Add pin button to file node HTML**

Inside the file node renderer, after the existing file name span, add a pin button that shows on hover:

```ts
const pinned = isPinned(node.path);
const pinBtn = `<button
  class="tree-pin-btn${pinned ? ' active' : ''}"
  title="${pinned ? '取消固定到焦点视图' : '固定到焦点视图'}"
  onclick="event.stopPropagation();${pinned ? `handleUnpinFile` : `handlePinFile`}('${escapeAttr(node.path)}')"
>📌</button>`;
```

Insert `${pinBtn}` into the file node HTML.

- [ ] **Step 4: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/client/ui/sidebar-workspace.ts
git commit -m "feat: add pin button to file nodes in full workspace tree"
```

---

### Task 6: CSS for focus view

**Files:**
- Modify: `src/client/css.ts`

- [ ] **Step 1: Append focus view CSS to `src/client/css.ts`**

Find the end of the template literal in `css.ts` (last line before the closing backtick) and insert before it:

```css
    /* ==================== Focus View ==================== */
    .focus-view {
      padding: 4px 0;
    }
    .focus-ws-group {
      border-bottom: 1px solid #f0f0f0;
    }
    .focus-ws-group:last-child {
      border-bottom: none;
    }
    .focus-ws-header {
      display: flex;
      align-items: center;
      padding: 5px 10px;
      cursor: pointer;
      user-select: none;
      gap: 5px;
    }
    .focus-ws-header:hover {
      background: rgba(0,0,0,0.03);
    }
    .focus-ws-arrow {
      font-size: 9px;
      color: #aaa;
      width: 10px;
      flex-shrink: 0;
      transition: transform 0.15s;
    }
    .focus-ws-arrow.open {
      transform: rotate(90deg);
    }
    .focus-ws-name {
      font-size: 12px;
      font-weight: 600;
      color: #444;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .focus-ws-badge {
      font-size: 10px;
      background: #e8f0fe;
      color: #4a7fd4;
      border-radius: 8px;
      padding: 1px 5px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .focus-ws-badge.empty {
      background: #f3f4f6;
      color: #bbb;
    }
    .focus-ws-files {
      padding: 2px 0 4px;
    }
    .focus-file-item {
      display: flex;
      align-items: center;
      padding: 3px 8px 3px 20px;
      cursor: pointer;
      gap: 4px;
      position: relative;
    }
    .focus-file-item:hover {
      background: rgba(0,0,0,0.04);
    }
    .focus-file-item.current {
      background: #e8f0fe;
    }
    .focus-file-item.current .focus-file-name {
      color: #1a56db;
      font-weight: 500;
    }
    .focus-file-icon {
      font-size: 10px;
      flex-shrink: 0;
      width: 14px;
      text-align: center;
    }
    .focus-file-name {
      font-size: 12px;
      color: #333;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }
    .focus-file-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .focus-file-dot.modified { background: #f59e0b; }
    .focus-file-dot.new-file { background: #10b981; }
    .focus-file-time {
      font-size: 10px;
      color: #bbb;
      flex-shrink: 0;
    }
    .focus-pin-btn {
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 10px;
      padding: 0 2px;
      opacity: 0.5;
      flex-shrink: 0;
      line-height: 1;
    }
    .focus-pin-btn:hover, .focus-pin-btn.active { opacity: 1; }
    .focus-empty {
      font-size: 12px;
      color: #aaa;
      padding: 12px 16px;
      font-style: italic;
    }
    /* Pin button in full tree view — show on hover */
    .tree-item .tree-pin-btn {
      display: none;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 10px;
      padding: 0 2px;
      opacity: 0.5;
      line-height: 1;
      margin-left: auto;
    }
    .tree-item:hover .tree-pin-btn { display: inline; }
    .tree-item .tree-pin-btn.active { display: inline; opacity: 1; }
    /* Sidebar view toggle button */
    .sidebar-view-toggle {
      font-size: 10px;
      padding: 2px 7px;
      border: 1px solid #ddd;
      border-radius: 3px;
      background: #f5f5f5;
      color: #555;
      cursor: pointer;
      white-space: nowrap;
    }
    .sidebar-view-toggle:hover {
      background: #e8e8e8;
    }
```

- [ ] **Step 2: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/client/css.ts
git commit -m "feat: add focus view CSS styles"
```

---

### Task 7: Add focusWindowHours to settings dialog

**Files:**
- Modify: `src/client/ui/settings.ts`

- [ ] **Step 1: Add focus window setting to `renderSettingsDialog` in `settings.ts`**

Find `renderSettingsDialog` (around line 58) and add a new settings section before the existing ones:

```ts
// Add this section at the top of body.innerHTML = `...`:
<div class="settings-section">
  <div class="settings-section-title">焦点视图</div>
  <div class="settings-section-desc">精简工作区视图，只显示最近有改动的文件。</div>
  <div class="settings-kv-grid">
    <div>时间窗口</div>
    <div>
      <select id="focusWindowSelect" style="font-size:12px;padding:2px 6px;border:1px solid #ddd;border-radius:3px">
        <option value="1" ${state.config.focusWindowHours === 1 ? 'selected' : ''}>1 小时</option>
        <option value="4" ${state.config.focusWindowHours === 4 ? 'selected' : ''}>4 小时（默认）</option>
        <option value="24" ${state.config.focusWindowHours === 24 ? 'selected' : ''}>24 小时</option>
      </select>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Wire the select to `saveSettings` in `settings.ts`**

Find `saveSettings` (around line 108) and update it to read the select value:

```ts
export function saveSettings(): void {
  const focusWindowSelect = document.getElementById('focusWindowSelect') as HTMLSelectElement | null;
  if (focusWindowSelect) {
    state.config.focusWindowHours = Number(focusWindowSelect.value) || 4;
  }
  saveConfig(state.config);
  renderSidebar();
  closeSettingsDialog();
}
```

- [ ] **Step 3: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/client/ui/settings.ts
git commit -m "feat: add focus window hours setting to settings dialog"
```

---

### Task 8: Full build and smoke test

**Files:**
- Run build pipeline

- [ ] **Step 1: Full build**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build
```

Expected: succeeds.

- [ ] **Step 2: Manual smoke test**

```bash
bun run dev
```

1. Switch to workspace mode — verify the "焦点/全量" toggle button appears in the sidebar header
2. In focus view: verify only files modified within the time window appear, grouped by workspace
3. In full view: verify the existing tree renders correctly (no regression)
4. Pin a file from full view — verify it appears in focus view even outside the time window
5. Unpin from focus view — verify it disappears from focus view (if outside window)
6. Open Settings — verify the time window dropdown appears and changing it affects focus view
7. Reload the page — verify pin state and view preference persist

- [ ] **Step 3: Commit**

```bash
git add dist/ src/client/embedded-client.ts
git commit -m "build: rebuild embedded client with workspace focus view"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| 焦点视图：mtime 过滤 | Task 3 (`getActiveFiles`) |
| 焦点视图：Pin 文件常驻 | Task 2 + Task 3 |
| 焦点视图：按工作区分组 | Task 3 (`renderFocusWorkspaceGroup`) |
| 无活跃文件的工作区折叠显示 | Task 3 (badge "0", no files rendered) |
| 焦点/全量切换按钮 | Task 4 (`toggleWorkspaceView`) |
| 从全量视图 pin 文件 | Task 5 (pin button on tree nodes) |
| 从焦点视图 unpin 文件 | Task 3 + Task 4 (`handleUnpinFile`) |
| 时间窗口可配置（设置里改） | Task 1 + Task 7 |
| Pin 状态持久化 | Task 2 (localStorage) |
| 视图偏好持久化 | Task 1 (`sidebarView` in config) |

**Placeholder scan:** None found.

**Type consistency:** `sidebarView` and `focusWindowHours` defined in Task 1, used in Tasks 3, 4, 7. `getPinnedFiles`/`pinFile`/`unpinFile`/`isPinned` defined in Task 2, used in Tasks 3, 5. `renderFocusView` defined in Task 3, imported in Task 4.
