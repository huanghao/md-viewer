# 侧边栏三视图统一 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提取共用文件行渲染函数 `renderFileRow`，将工作区扫描状态提升到 `AppState`，消除三套视图的功能偏差和重复代码。

**Architecture:** 新建 `src/client/ui/file-row.ts` 导出 `renderFileRow()`，三套视图改调它。工作区扫描状态（loading/failed）从模块私有变量移到 `AppState`，通过 `state.ts` 的操作函数统一读写。

**Tech Stack:** TypeScript, vanilla DOM, Bun (build)

---

## File Map

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/client/ui/file-row.ts` | **新建** | 共用文件行渲染函数 |
| `src/client/types.ts` | 修改 | AppState 新增 `workspaceLoadingIds`/`workspaceFailedIds` |
| `src/client/state.ts` | 修改 | 初始化新字段 + 5 个操作函数 |
| `src/client/ui/sidebar-workspace.ts` | 修改 | 删私有 Set，改调 `renderFileRow`，改读 state |
| `src/client/ui/workspace-focus.ts` | 修改 | 删私有 Set，改调 `renderFileRow` |
| `src/client/ui/sidebar.ts` | 修改 | `renderFiles` 改调 `renderFileRow` |
| `src/client/css.ts` | 修改 | 删除 `.focus-file-dot` 样式 |

---

## Task 1: 工作区扫描状态提升到 AppState

**Files:**
- Modify: `src/client/types.ts:47-59`
- Modify: `src/client/state.ts:12-23` 和文件末尾

- [ ] **Step 1: `types.ts` 的 `AppState` 接口新增两个字段**

找到 `AppState` 接口（约第 47 行），在 `annotationCounts` 字段后添加：

```typescript
export interface AppState {
  sessionFiles: Map<string, FileInfo>;
  currentFile: string | null;
  searchQuery: string;
  config: AppConfig;
  currentWorkspace: string | null;
  fileTree: Map<string, FileTreeNode>;
  annotationCounts: Map<string, number>;
  workspaceLoadingIds: Set<string>;  // 正在扫描中的工作区
  workspaceFailedIds: Set<string>;   // 扫描失败的工作区（直到重试前永久）
}
```

- [ ] **Step 2: `state.ts` 初始化新字段**

找到 `state` 对象定义（约第 12 行），添加两个新字段：

```typescript
export const state: AppState = {
  sessionFiles: new Map(),
  currentFile: null,
  searchQuery: '',
  config: loadConfig(),
  currentWorkspace: null,
  fileTree: new Map(),
  annotationCounts: new Map(),
  workspaceLoadingIds: new Set(),
  workspaceFailedIds: new Set(),
};
```

- [ ] **Step 3: `state.ts` 末尾添加 5 个操作函数**

在 `adjustAnnotationCount` 函数之后添加：

```typescript
export function markWorkspaceLoading(id: string): void {
  state.workspaceLoadingIds.add(id);
  state.workspaceFailedIds.delete(id);
}

export function markWorkspaceFailed(id: string): void {
  state.workspaceFailedIds.add(id);
  state.workspaceLoadingIds.delete(id);
}

export function clearWorkspaceFailed(id: string): void {
  state.workspaceFailedIds.delete(id);
  state.workspaceLoadingIds.delete(id);
}

export function isWorkspaceLoading(id: string): boolean {
  return state.workspaceLoadingIds.has(id);
}

export function isWorkspaceFailed(id: string): boolean {
  return state.workspaceFailedIds.has(id);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/client/types.ts src/client/state.ts
git commit -m "feat: add workspaceLoadingIds/workspaceFailedIds to AppState"
```

---

## Task 2: sidebar-workspace.ts 改用全局扫描状态

**Files:**
- Modify: `src/client/ui/sidebar-workspace.ts`

- [ ] **Step 1: 更新 import，引入新的 state 操作函数**

找到文件顶部 import（约第 1-20 行），将 `state` 的 import 改为同时引入新函数：

```typescript
import {
  state,
  getSessionFile,
  getSessionFiles,
  hasSessionFile,
  markWorkspaceLoading,
  markWorkspaceFailed,
  clearWorkspaceFailed,
  isWorkspaceLoading,
  isWorkspaceFailed,
} from '../state';
```

- [ ] **Step 2: 删除私有 Set 和旧的 `markWorkspaceFailed` 导出函数**

找到约第 49-55 行，删除以下代码：

```typescript
const loadingWorkspaceIds = new Set<string>();
const failedWorkspaceIds = new Set<string>();

export function markWorkspaceFailed(workspaceId: string): void {
  failedWorkspaceIds.add(workspaceId);
  loadingWorkspaceIds.delete(workspaceId);
}
```

- [ ] **Step 3: 更新 `renderFileTree` 中对 loading/failed 的读取**

找到 `renderFileTree` 函数（约第 488-534 行），将对私有 Set 的引用改为调用 state 函数：

将：
```typescript
if (loadingWorkspaceIds.has(workspaceId)) {
```
改为：
```typescript
if (isWorkspaceLoading(workspaceId)) {
```

将：
```typescript
if (failedWorkspaceIds.has(workspaceId)) {
```
改为：
```typescript
if (isWorkspaceFailed(workspaceId)) {
```

- [ ] **Step 4: 更新 `renderWorkspaceItem` 中对 failed 的读取**

找到约第 424 行的 `renderWorkspaceItem`，将：
```typescript
<span class="workspace-icon">${failedWorkspaceIds.has(workspace.id) ? '⚠️' : '📁'}</span>
<span class="workspace-name${failedWorkspaceIds.has(workspace.id) ? ' workspace-name--failed' : ''}">
```
改为：
```typescript
<span class="workspace-icon">${isWorkspaceFailed(workspace.id) ? '⚠️' : '📁'}</span>
<span class="workspace-name${isWorkspaceFailed(workspace.id) ? ' workspace-name--failed' : ''}">
```

- [ ] **Step 5: 更新 `handleWorkspaceToggle` 中对 loading/failed 的写入**

找到约第 719-731 行的 `handleWorkspaceToggle` 内部扫描逻辑，将：
```typescript
loadingWorkspaceIds.add(workspaceId);
failedWorkspaceIds.delete(workspaceId);
```
改为：
```typescript
markWorkspaceLoading(workspaceId);
```

将：
```typescript
loadingWorkspaceIds.delete(workspaceId);
if (!tree) {
  failedWorkspaceIds.add(workspaceId);
  showError(`工作区扫描失败：${workspace.name}`);
} else {
  failedWorkspaceIds.delete(workspaceId);
}
```
改为：
```typescript
if (!tree) {
  markWorkspaceFailed(workspaceId);
  showError(`工作区扫描失败：${workspace.name}`);
} else {
  clearWorkspaceFailed(workspaceId);
}
```

- [ ] **Step 6: 更新 `retryWorkspaceScan` 中对 loading/failed 的写入**

找到约第 739-752 行的 `retryWorkspaceScan`，将：
```typescript
loadingWorkspaceIds.add(workspaceId);
failedWorkspaceIds.delete(workspaceId);
```
改为：
```typescript
markWorkspaceLoading(workspaceId);
```

将：
```typescript
loadingWorkspaceIds.delete(workspaceId);
if (!tree) {
  failedWorkspaceIds.add(workspaceId);
  showError('重试失败，请检查工作区路径是否可访问');
}
```
改为：
```typescript
if (!tree) {
  markWorkspaceFailed(workspaceId);
  showError('重试失败，请检查工作区路径是否可访问');
} else {
  clearWorkspaceFailed(workspaceId);
}
```

- [ ] **Step 7: Commit**

```bash
git add src/client/ui/sidebar-workspace.ts
git commit -m "refactor: use AppState for workspace loading/failed state in sidebar-workspace"
```

---

## Task 3: workspace-focus.ts 改用全局扫描状态

**Files:**
- Modify: `src/client/ui/workspace-focus.ts`

- [ ] **Step 1: 更新 import**

找到文件顶部 import，将 `state` 的 import 改为同时引入新函数：

```typescript
import {
  state,
  markWorkspaceFailed,
  isWorkspaceFailed,
} from '../state';
```

（`markWorkspaceLoading` 不需要，因为焦点视图的扫描是 fire-and-forget，不显示 loading 状态。）

- [ ] **Step 2: 删除私有 Set**

找到约第 43-46 行，删除：

```typescript
const scanningWorkspaceIds = new Set<string>();
const failedWorkspaceIds = new Set<string>();
```

注意：`scanningWorkspaceIds` 是防止同一工作区被并发扫描的，需要保留但改名更清晰：

```typescript
// 防止同一工作区在同一渲染周期内被重复触发扫描
const pendingScanIds = new Set<string>();
```

- [ ] **Step 3: 更新 `renderFocusView` 中对 Set 的引用**

找到约第 211-227 行的扫描触发逻辑，将：
```typescript
if (!tree && !scanningWorkspaceIds.has(ws.id) && !failedWorkspaceIds.has(ws.id)) {
  scanningWorkspaceIds.add(ws.id);
  void scanWorkspace(ws.id).then((scanned) => {
    scanningWorkspaceIds.delete(ws.id);
    if (scanned) {
      import('./sidebar').then(({ renderSidebar }) => renderSidebar());
    } else {
      failedWorkspaceIds.add(ws.id);
      import('./sidebar-workspace').then(({ markWorkspaceFailed }) => {
        markWorkspaceFailed(ws.id);
        import('./sidebar').then(({ renderSidebar }) => renderSidebar());
      });
    }
  });
}
```
改为：
```typescript
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
```

- [ ] **Step 4: Commit**

```bash
git add src/client/ui/workspace-focus.ts
git commit -m "refactor: use AppState for workspace failed state in workspace-focus"
```

---

## Task 4: 新建 file-row.ts 共用文件行渲染函数

**Files:**
- Create: `src/client/ui/file-row.ts`

- [ ] **Step 1: 新建文件，写入完整实现**

```typescript
import { state, getSessionFile } from '../state';
import { hasListDiff } from '../workspace-state';
import { hasWorkspaceModified, isWorkspacePathMissing } from '../workspace-state';
import { getFileListStatus } from '../utils/file-status';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { formatRelativeTime } from '../utils/format';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { isPinned } from '../utils/pinned-files';

export interface FileRowOptions {
  /** 外层 div 的 class（各视图不同，如 'tree-item file-node' 或 'file-item'） */
  containerClass: string;
  /** 点击文件的 onclick JS 字符串，接收 path 返回完整 onclick 值 */
  onClickJs: (path: string) => string;
  /** 是否显示 pin 按钮（全量树/焦点：true；列表：false） */
  showPin: boolean;
  /** 是否显示相对修改时间（焦点：true；其余：false） */
  showTime: boolean;
  /** 左侧缩进宽度 px */
  indentPx: number;
  /** 搜索关键词，用于文件名高亮（空字符串表示不高亮） */
  query: string;
  /** 是否显示关闭按钮（列表：true；其余：false） */
  showClose: boolean;
  /** 关闭按钮的 onclick JS 字符串（仅 showClose=true 时使用） */
  onCloseJs?: (path: string) => string;
}

function highlightQuery(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, idx)) +
    `<mark class="search-highlight">${escapeHtml(text.slice(idx, idx + query.length))}</mark>` +
    escapeHtml(text.slice(idx + query.length))
  );
}

export function renderFileRow(
  path: string,
  name: string,
  lastModified: number | undefined,
  opts: FileRowOptions,
): string {
  const isCurrent = state.currentFile === path;
  const openedFile = getSessionFile(path);
  const listDiff = hasListDiff(path);
  const isMissing = !!openedFile?.isMissing || isWorkspacePathMissing(path);
  const wsModified = hasWorkspaceModified(path);

  // 状态 badge（优先级：D > M > 蓝点）
  let statusBadge = '&nbsp;';
  if (openedFile) {
    const status = getFileListStatus(openedFile, listDiff);
    if (status.badge === 'dot') {
      statusBadge = '<span class="new-dot"></span>';
    } else if (status.badge) {
      statusBadge = `<span class="status-badge status-${status.type}" style="color: ${status.color}">${status.badge}</span>`;
    }
  } else if (isMissing) {
    statusBadge = '<span class="status-badge status-deleted" style="color: #cf222e">D</span>';
  } else if (wsModified) {
    statusBadge = '<span class="status-badge status-modified" style="color: #ff9500">M</span>';
  } else if (listDiff) {
    statusBadge = '<span class="new-dot"></span>';
  }

  // 文件名：strip 扩展名 + 搜索高亮
  const displayName = stripWorkspaceTreeDisplayExtension(name) || name;
  const highlightedName = highlightQuery(displayName, opts.query);

  // 批注计数 badge
  const annotationCount = state.annotationCounts.get(path) ?? 0;
  const annotationBadge = annotationCount > 0
    ? `<span class="annotation-count-badge">${annotationCount}</span>`
    : '';

  // 相对修改时间（仅焦点视图）
  const timeStr = opts.showTime && lastModified
    ? `<span class="focus-file-time">${escapeHtml(formatRelativeTime(lastModified))}</span>`
    : '';

  // Pin 按钮
  let pinBtn = '';
  if (opts.showPin) {
    const pinned = isPinned(path);
    pinBtn = `<button
      class="tree-pin-btn${pinned ? ' active' : ''}"
      title="${pinned ? '取消固定到焦点视图' : '固定到焦点视图'}"
      onclick="event.stopPropagation();${pinned ? `handleUnpinFile` : `handlePinFile`}('${escapeAttr(path)}')"
    >📌</button>`;
  }

  // 关闭按钮（仅列表视图）
  const closeBtn = opts.showClose && opts.onCloseJs
    ? `<span class="close" onclick="event.stopPropagation();${opts.onCloseJs(path)}">×</span>`
    : '';

  // 外层 class
  const classes = [
    opts.containerClass,
    isMissing ? 'missing' : '',
    isCurrent ? 'current' : '',
  ].filter(Boolean).join(' ');

  return `
    <div class="${classes}" onclick="${opts.onClickJs(path)}">
      <span class="tree-indent" style="width: ${opts.indentPx}px"></span>
      <span class="file-type-icon ${getFileTypeIcon(path).cls}">${escapeHtml(getFileTypeIcon(path).label)}</span>
      <span class="tree-status-inline">${statusBadge}</span>
      <span class="tree-name" title="${escapeAttr(name)}"><span class="tree-name-full">${highlightedName}</span></span>
      ${annotationBadge}
      ${timeStr}
      ${pinBtn}
      ${closeBtn}
    </div>
  `;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/ui/file-row.ts
git commit -m "feat: add shared renderFileRow utility for all sidebar views"
```

---

## Task 5: sidebar-workspace.ts 改调 renderFileRow

**Files:**
- Modify: `src/client/ui/sidebar-workspace.ts`

- [ ] **Step 1: 添加 import**

在文件顶部 import 块中添加：

```typescript
import { renderFileRow } from './file-row';
```

- [ ] **Step 2: 替换 `renderTreeNode` 文件分支**

找到 `renderTreeNode` 函数中 `if (node.type === 'file')` 分支（约第 541-598 行），将整个分支替换为：

```typescript
if (node.type === 'file') {
  const rowHtml = renderFileRow(node.path, node.name, node.lastModified, {
    containerClass: 'tree-item file-node',
    onClickJs: (p) => `handleFileClick('${escapeAttr(p)}')`,
    showPin: true,
    showTime: false,
    indentPx,
    query: state.searchQuery.trim().toLowerCase(),
    showClose: false,
  });

  return `<div class="tree-node">${rowHtml}</div>`;
}
```

- [ ] **Step 3: 删除不再使用的 `renderFileNameWithTailPriority` 函数**

找到约第 68-72 行的 `renderFileNameWithTailPriority` 函数，确认没有其他地方调用它（用 grep 确认），然后删除：

```typescript
function renderFileNameWithTailPriority(name: string): string {
  const stripped = stripWorkspaceTreeDisplayExtension(name) || name;
  return `<span class="tree-name-full">${escapeHtml(stripped)}</span>`;
}
```

- [ ] **Step 4: 验证全量树视图正常**

启动服务（`npm run dev`），打开全量树视图，确认：
- 文件行正常显示
- 当前文件有 `current` 高亮
- 状态 badge（M/D/蓝点）正常
- Pin 按钮正常
- 批注计数 badge 正常

- [ ] **Step 5: Commit**

```bash
git add src/client/ui/sidebar-workspace.ts
git commit -m "refactor: use renderFileRow in sidebar-workspace renderTreeNode"
```

---

## Task 6: workspace-focus.ts 改调 renderFileRow

**Files:**
- Modify: `src/client/ui/workspace-focus.ts`

- [ ] **Step 1: 添加 import**

在文件顶部 import 块中添加：

```typescript
import { renderFileRow } from './file-row';
```

- [ ] **Step 2: 替换 `renderFocusFileItem` 函数体**

找到 `renderFocusFileItem` 函数（约第 108-148 行），将函数体替换为：

```typescript
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
```

注意：`pinned` 参数不再需要传入（`renderFileRow` 内部直接调用 `isPinned()`），但函数签名暂时保留以避免调用处报错，下一步清理。

- [ ] **Step 3: 清理 `renderFocusFileItem` 调用处**

找到调用 `renderFocusFileItem(file, pinned, query)` 的地方（约第 230 行附近），确认 `pinned` 参数已不被使用后，可以简化调用——但由于函数签名还在，暂时保持不变，不影响正确性。

- [ ] **Step 4: 删除不再使用的 import 和函数**

检查以下内容是否还被 `renderFocusFileItem` 之外的代码使用，若不再使用则删除对应 import：
- `isPinned`（现在由 `file-row.ts` 内部使用）
- `getFileListStatus`
- `getFileTypeIcon`
- `stripWorkspaceTreeDisplayExtension`
- `formatRelativeTime`
- `escapeHtml`, `escapeAttr`（可能仍被其他函数使用，仔细检查）

删除不再使用的本地函数 `highlightQuery`（已移到 `file-row.ts`）。

- [ ] **Step 5: 验证焦点视图正常**

确认：
- 文件行正常显示
- M/D 状态标记现在正确显示（之前缺失的 bug 已修复）
- 蓝点使用 `new-dot` class（不再是 `focus-file-dot new-file`）
- 相对修改时间正常
- Pin 按钮正常

- [ ] **Step 6: Commit**

```bash
git add src/client/ui/workspace-focus.ts
git commit -m "refactor: use renderFileRow in workspace-focus, fix missing M/D badges"
```

---

## Task 7: sidebar.ts 改调 renderFileRow

**Files:**
- Modify: `src/client/ui/sidebar.ts`

- [ ] **Step 1: 添加 import**

在文件顶部 import 块中添加：

```typescript
import { renderFileRow } from './file-row';
```

- [ ] **Step 2: 替换 `renderFiles` 中的文件行渲染**

找到 `renderFiles` 函数（约第 305-375 行），将 `container.innerHTML = filesWithDisplay.map(file => { ... }).join('')` 部分替换为：

```typescript
container.innerHTML = filesWithDisplay.map(file => {
  return renderFileRow(file.path, file.displayName || file.name, undefined, {
    containerClass: 'file-item',
    onClickJs: (p) => `window.switchFile('${escapeAttr(p)}')`,
    showPin: false,
    showTime: false,
    indentPx: 0,
    query: state.searchQuery.toLowerCase().trim(),
    showClose: true,
    onCloseJs: (p) => `window.removeFile('${escapeAttr(p)}')`,
  });
}).join('');
```

注意：列表视图传 `file.displayName || file.name`（已含去重后缀如 `(docs)`），而不是 `file.name`，这样 strip 扩展名后仍能保留去重信息。

- [ ] **Step 3: 验证列表视图正常**

确认：
- 文件行正常显示
- 文件名现在 strip 扩展名（之前不 strip 的 bug 已修复）
- 状态 badge 正常
- 关闭按钮正常
- 批注计数 badge 正常

- [ ] **Step 4: Commit**

```bash
git add src/client/ui/sidebar.ts
git commit -m "refactor: use renderFileRow in sidebar list view, fix filename stripping"
```

---

## Task 8: 清理 CSS 中的 focus-file-dot 样式

**Files:**
- Modify: `src/client/css.ts`

- [ ] **Step 1: 确认 `focus-file-dot` 不再被使用**

运行：
```bash
grep -r "focus-file-dot" src/
```

预期：只在 `css.ts` 中找到，不在任何 `.ts` 文件中出现（因为 Task 6 已将其替换为 `new-dot`）。

- [ ] **Step 2: 删除 `.focus-file-dot` 相关样式**

找到约第 2969-2976 行，删除：

```css
.focus-file-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}
.focus-file-dot.modified { background: #f59e0b; }
.focus-file-dot.new-file { background: #007AFF; }
```

- [ ] **Step 3: Commit**

```bash
git add src/client/css.ts
git commit -m "chore: remove unused focus-file-dot CSS after sidebar unification"
```

---

## Task 9: 运行测试 + 构建验证

**Files:** 无代码改动

- [ ] **Step 1: 运行单元测试**

```bash
bun test tests/unit/
```

预期：197 pass, 0 fail

- [ ] **Step 2: 构建客户端**

```bash
npm run build:client
```

预期：`✅ Build completed!`

- [ ] **Step 3: 端到端验证**

启动服务 `npm run dev`，在浏览器中验证：
1. 全量树视图：文件行正常，M/D/蓝点正常，pin 正常，批注 badge 正常
2. 焦点视图：M/D 标记现在显示（之前 bug），时间显示正常，pin 正常
3. 列表视图：文件名 strip 扩展名（之前 bug），关闭按钮正常

- [ ] **Step 4: 最终 commit（如有遗留改动）**

```bash
git status
# 若有未提交改动则提交
```
