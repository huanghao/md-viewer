# Sidebar Three-Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-level sidebar mode switching (workspace/simple toggle + focus/full toggle) with a single three-tab bar (焦点/全量/列表) always visible at the top of the sidebar. Add inline time-window pills (8h/2d/1w/1m, default 8h) to the focus view. Unify file item styles between focus view and full tree.

**Architecture:** Collapse `sidebarMode` ('simple'|'workspace') and `sidebarView` ('focus'|'full') into a single `sidebarTab: 'focus' | 'full' | 'list'` field in `AppConfig`. The three-tab bar replaces `renderModeSwitchRow`. Focus view gets an inline filter bar replacing the settings-dialog time window. File item CSS in focus view is updated to match tree-item styles. `focusWindowHours` is replaced with `focusWindowKey: '8h'|'2d'|'1w'|'1m'`.

**Tech Stack:** TypeScript, pure DOM, localStorage — zero new dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/client/types.ts` | Modify | Replace `sidebarMode`+`sidebarView` with `sidebarTab`; replace `focusWindowHours` with `focusWindowKey` |
| `src/client/config.ts` | Modify | Update `defaultConfig` |
| `src/client/ui/sidebar.ts` | Modify | Replace `renderModeSwitchRow` with `renderViewTabs`; update `renderSidebar` routing |
| `src/client/ui/sidebar-workspace.ts` | Modify | Update references from `sidebarView` to `sidebarTab` |
| `src/client/ui/workspace-focus.ts` | Modify | Add inline filter bar; replace `focusWindowHours` with `focusWindowKey`; unify file item CSS classes |
| `src/client/ui/settings.ts` | Modify | Remove focus window setting (now inline) |
| `src/client/css.ts` | Modify | Add tab bar styles; unify focus file item styles with tree-item |

---

### Task 1: Update config types

**Files:**
- Modify: `src/client/types.ts`
- Modify: `src/client/config.ts`

- [ ] **Step 1: Update `AppConfig` in `src/client/types.ts`**

Replace the current `AppConfig` interface:

```ts
export interface AppConfig {
  sidebarTab: 'focus' | 'full' | 'list';  // replaces sidebarMode + sidebarView
  focusWindowKey: '8h' | '2d' | '1w' | '1m';  // replaces focusWindowHours
  workspaces: Workspace[];
}
```

- [ ] **Step 2: Update `defaultConfig` in `src/client/config.ts`**

```ts
export const defaultConfig: AppConfig = {
  sidebarTab: 'focus',
  focusWindowKey: '8h',
  workspaces: [],
};
```

- [ ] **Step 3: Build to verify type errors propagate**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -40
```

Expected: build FAILS with errors about removed fields — that's expected at this stage. Note all error locations for the next tasks.

- [ ] **Step 4: Commit**

```bash
git add src/client/types.ts src/client/config.ts
git commit -m "refactor: replace sidebarMode/sidebarView/focusWindowHours with sidebarTab/focusWindowKey"
```

---

### Task 2: Update sidebar.ts — three-tab bar and routing

**Files:**
- Modify: `src/client/ui/sidebar.ts`

- [ ] **Step 1: Read `sidebar.ts` to understand current structure**

Read lines 44–65 (toggle functions + window assignments) and lines 281–422 (renderModeSwitchRow + renderSidebar).

- [ ] **Step 2: Replace toggle functions**

Remove `toggleSidebarMode` and `toggleWorkspaceView`. Add:

```ts
export function setSidebarTab(tab: 'focus' | 'full' | 'list'): void {
  state.config.sidebarTab = tab;
  saveConfig(state.config);
  renderSidebar();
}
```

Update window assignments — remove `toggleSidebarMode` and `toggleWorkspaceView`, add:
```ts
(window as any).setSidebarTab = setSidebarTab;
```

- [ ] **Step 3: Replace `renderModeSwitchRow` with `renderViewTabs`**

Replace the entire `renderModeSwitchRow` function:

```ts
function renderViewTabs(): void {
  const container = document.getElementById('modeSwitchRow');
  if (!container) return;

  const tab = state.config.sidebarTab;
  const tabs: Array<{ key: 'focus' | 'full' | 'list'; label: string }> = [
    { key: 'focus', label: '焦点' },
    { key: 'full', label: '全量' },
    { key: 'list', label: '列表' },
  ];

  container.innerHTML = `
    <div class="view-tabs">
      ${tabs.map(t => `
        <button class="view-tab${tab === t.key ? ' active' : ''}"
                onclick="setSidebarTab('${t.key}')">${t.label}</button>
      `).join('')}
    </div>
  `;
}
```

- [ ] **Step 4: Update `renderSidebar` routing**

Replace the current `renderSidebar` function body. The new logic:

```ts
export function renderSidebar(): void {
  const tab = state.config.sidebarTab;
  const container = document.querySelector('.sidebar') as HTMLElement | null;
  if (container) {
    container.classList.toggle('workspace-mode', tab === 'focus' || tab === 'full');
  }

  renderSearchBox();
  renderViewTabs();

  if (tab === 'list') {
    renderCurrentPath();
    renderFiles();
    return;
  }

  // focus or full — workspace rendering
  renderCurrentPath();
  if (!container) return;

  let fileListContainer = document.getElementById('fileList');
  if (!fileListContainer) {
    fileListContainer = document.createElement('div');
    fileListContainer.id = 'fileList';
    fileListContainer.className = 'file-list';
    container.appendChild(fileListContainer);
  }

  fileListContainer.innerHTML = renderWorkspaceSidebar();
  bindWorkspaceEvents();
  scrollCurrentFileIntoView(fileListContainer);
}
```

- [ ] **Step 5: Build and fix remaining errors in sidebar.ts**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -40
```

Fix any errors in `sidebar.ts` only (other files will still have errors).

- [ ] **Step 6: Commit**

```bash
git add src/client/ui/sidebar.ts
git commit -m "refactor: replace mode toggle with three-tab bar in sidebar"
```

---

### Task 3: Update sidebar-workspace.ts

**Files:**
- Modify: `src/client/ui/sidebar-workspace.ts`

- [ ] **Step 1: Find all references to `sidebarMode`, `sidebarView`, `toggleSidebarMode`, `toggleWorkspaceView`**

```bash
grep -n "sidebarMode\|sidebarView\|toggleSidebarMode\|toggleWorkspaceView" /Users/huanghao/workspace/md-viewer/src/client/ui/sidebar-workspace.ts
```

- [ ] **Step 2: Update `renderWorkspaceSidebar`**

Find `renderWorkspaceSidebar` (around line 333). Replace:

```ts
export function renderWorkspaceSidebar(): string {
  if (state.config.sidebarTab === 'focus') {
    return renderFocusView();
  }
  const query = state.searchQuery.trim().toLowerCase();
  ensureWorkspaceSearchResults(query);
  return `${renderWorkspaceSection(query)}`;
}
```

- [ ] **Step 3: Fix any other references**

If there are other references to `sidebarMode` or `sidebarView` in this file, update them to use `sidebarTab`.

- [ ] **Step 4: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
git add src/client/ui/sidebar-workspace.ts
git commit -m "refactor: update sidebar-workspace to use sidebarTab"
```

---

### Task 4: Update workspace-focus.ts — inline filter bar + unified styles + new time keys

**Files:**
- Modify: `src/client/ui/workspace-focus.ts`

- [ ] **Step 1: Add `focusWindowKey` to milliseconds helper**

Replace the `windowMs` calculation. Add a helper at the top of the file:

```ts
const FOCUS_WINDOW_MS: Record<string, number> = {
  '8h':  8  * 3600 * 1000,
  '2d':  2  * 86400 * 1000,
  '1w':  7  * 86400 * 1000,
  '1m':  30 * 86400 * 1000,
};
```

- [ ] **Step 2: Add inline filter bar HTML**

In `renderFocusView`, add a filter bar before the workspace groups:

```ts
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
```

Update `renderFocusView` to include the filter bar:

```ts
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
```

- [ ] **Step 3: Register `setFocusWindowKey` on window in `sidebar-workspace.ts`**

In `bindWorkspaceEvents` in `sidebar-workspace.ts`, add:

```ts
(window as any).setFocusWindowKey = (key: string) => {
  state.config.focusWindowKey = key as any;
  import('../config').then(({ saveConfig }) => saveConfig(state.config));
  import('./sidebar').then(({ renderSidebar }) => renderSidebar());
};
```

- [ ] **Step 4: Unify file item HTML to use tree-item classes**

In `renderFocusFileItem`, replace the custom `focus-file-item` div with classes matching the full tree:

```ts
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
```

- [ ] **Step 5: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -30
```

Fix any errors.

- [ ] **Step 6: Commit**

```bash
git add src/client/ui/workspace-focus.ts src/client/ui/sidebar-workspace.ts
git commit -m "feat: add inline time filter bar to focus view; unify file item styles"
```

---

### Task 5: Update settings.ts — remove focus window setting

**Files:**
- Modify: `src/client/ui/settings.ts`

- [ ] **Step 1: Remove the 焦点视图 section from `renderSettingsDialog`**

Find the section added in the previous plan:
```html
<div class="settings-section">
  <div class="settings-section-title">焦点视图</div>
  ...
</div>
```
Remove it entirely.

- [ ] **Step 2: Remove focus window from `saveSettings`**

Find:
```ts
const focusWindowSelect = document.getElementById('focusWindowSelect') as HTMLSelectElement | null;
if (focusWindowSelect) {
  state.config.focusWindowHours = Number(focusWindowSelect.value) || 4;
}
```
Remove these lines.

- [ ] **Step 3: Fix any remaining `focusWindowHours` references**

```bash
grep -n "focusWindowHours\|focusWindowSelect\|sidebarMode\|sidebarView\|toggleSidebarMode\|toggleWorkspaceView" /Users/huanghao/workspace/md-viewer/src/client/ui/settings.ts
```

Remove or update any found references.

- [ ] **Step 4: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
git add src/client/ui/settings.ts
git commit -m "refactor: remove focus window setting from settings dialog (now inline)"
```

---

### Task 6: Update CSS

**Files:**
- Modify: `src/client/css.ts`

- [ ] **Step 1: Add three-tab bar CSS**

Find the `.mode-switch-row` section (around line 129) and add after it:

```css
    /* ==================== Three-Tab View Switcher ==================== */
    .view-tabs {
      display: flex;
      border-bottom: 1px solid #e8e8e8;
      background: #fafafa;
      padding: 0 8px;
      flex-shrink: 0;
    }
    .view-tab {
      flex: 1;
      font-size: 12px;
      font-weight: 500;
      color: #888;
      padding: 7px 0 6px;
      text-align: center;
      cursor: pointer;
      border: none;
      background: transparent;
      border-bottom: 2px solid transparent;
      user-select: none;
      transition: color 0.15s, border-color 0.15s;
    }
    .view-tab:hover { color: #444; }
    .view-tab.active {
      color: #0969da;
      border-bottom-color: #0969da;
    }
```

- [ ] **Step 2: Add focus filter bar CSS**

In the Focus View section (around line 2802), add after `.focus-view`:

```css
    .focus-filter-bar {
      display: flex;
      align-items: center;
      padding: 5px 10px;
      border-bottom: 1px solid #f0f0f0;
      background: #fefefe;
      gap: 6px;
      flex-shrink: 0;
    }
    .focus-filter-label {
      font-size: 11px;
      color: #999;
      flex-shrink: 0;
    }
    .focus-time-pills {
      display: flex;
      gap: 3px;
    }
    .focus-time-pill {
      font-size: 10px;
      padding: 1px 7px;
      border-radius: 10px;
      border: 1px solid #e0e0e0;
      background: #fff;
      color: #666;
      cursor: pointer;
      transition: all 0.12s;
    }
    .focus-time-pill:hover { border-color: #aaa; color: #333; }
    .focus-time-pill.active {
      background: #0969da;
      border-color: #0969da;
      color: #fff;
    }
```

- [ ] **Step 3: Update focus file item styles**

Find `.focus-file-item` (around line 2858) and replace with minimal override (since it now uses `tree-item` base):

```css
    .focus-file-item {
      padding-left: 20px;
    }
    .focus-file-time {
      font-size: 10px;
      color: #bbb;
      flex-shrink: 0;
    }
```

Remove the now-redundant `.focus-file-item:hover`, `.focus-file-item.current`, `.focus-file-icon`, `.focus-file-name` rules (they're covered by `.tree-item` styles).

- [ ] **Step 4: Remove `.sidebar-view-toggle` CSS** (replaced by `.view-tab`)

Find and remove:
```css
    .sidebar-view-toggle { ... }
    .sidebar-view-toggle:hover { ... }
```

- [ ] **Step 5: Build and verify**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build:client 2>&1 | head -20
```

- [ ] **Step 6: Commit**

```bash
git add src/client/css.ts
git commit -m "feat: add three-tab and focus filter bar CSS; unify focus file item styles"
```

---

### Task 7: Fix remaining references and full build

**Files:**
- Check all client files for stale references

- [ ] **Step 1: Scan for stale references**

```bash
grep -rn "sidebarMode\|sidebarView\|focusWindowHours\|toggleSidebarMode\|toggleWorkspaceView\|sidebar-view-toggle" /Users/huanghao/workspace/md-viewer/src/client/ --include="*.ts" | grep -v embedded-client
```

- [ ] **Step 2: Fix any remaining references**

For each hit:
- `sidebarMode === 'workspace'` → `sidebarTab === 'focus' || sidebarTab === 'full'`
- `sidebarMode === 'simple'` → `sidebarTab === 'list'`
- `sidebarView === 'focus'` → `sidebarTab === 'focus'`
- `sidebarView === 'full'` → `sidebarTab === 'full'`
- `focusWindowHours` → `focusWindowKey`
- Remove `toggleSidebarMode`/`toggleWorkspaceView` calls

Key place to check: `src/client/main.ts` — search for `sidebarMode` (used in `onFileLoaded` to decide whether to reveal file in workspace).

In `main.ts`, replace:
```ts
if (shouldFocus && state.config.sidebarMode === 'workspace') {
```
with:
```ts
if (shouldFocus && (state.config.sidebarTab === 'focus' || state.config.sidebarTab === 'full')) {
```

Also check `src/client/workspace.ts` for any `sidebarMode` references.

- [ ] **Step 3: Full build**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build 2>&1 | tail -8
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "build: rebuild embedded client with three-tab sidebar redesign"
```

---

## Self-Review

**Spec coverage:**

| Requirement | Task |
|---|---|
| 三 tab 替换两级切换 | Task 2 (`renderViewTabs`, `setSidebarTab`) |
| 焦点/全量/列表 routing | Task 2 (`renderSidebar`) |
| 焦点视图内联时间 pill (8h/2d/1w/1m) | Task 4 (`renderFilterBar`) |
| 默认 8h | Task 1 (`focusWindowKey: '8h'`) |
| 时间 pill 点击更新视图 | Task 4 (`setFocusWindowKey`) |
| 焦点文件项样式与全量一致 | Task 4 (uses `tree-item` classes) |
| 移除设置对话框时间窗口 | Task 5 |
| CSS tab bar | Task 6 |
| 旧字段清理 | Task 7 |

**Placeholder scan:** None.

**Type consistency:** `sidebarTab` and `focusWindowKey` defined in Task 1, used throughout Tasks 2–7. `FOCUS_WINDOW_MS` defined in Task 4 and used only in `workspace-focus.ts`. `setSidebarTab` defined in Task 2, `setFocusWindowKey` defined in Task 4 (registered in `sidebar-workspace.ts`).
