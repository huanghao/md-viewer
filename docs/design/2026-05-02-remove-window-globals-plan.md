# Remove window.* Globals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 删除所有 `(window as any).xxx = fn` 模式，恢复 TypeScript 类型安全和 IDE 可追踪性。

**Architecture:** 三条路径并行消除：(1) 新建 `pdf-state.ts` 共享模块替代跨文件 window 状态；(2) main.ts 内部 window 自引用改为模块级变量；(3) HTML 模板 `onclick="fn()"` 字符串改为 `data-action` 事件委托，在各 UI 模块的 `bind*` 函数里处理。

**Tech Stack:** TypeScript, Bun build, browser DOM APIs (CustomEvent, dataset)

**Spec:** `docs/design/2026-05-02-remove-window-globals-design.md`

---

## Files Changed

| 操作 | 文件 | 说明 |
|---|---|---|
| 新建 | `src/client/pdf-state.ts` | 共享 PDF 运行时状态 |
| 修改 | `src/client/main.ts` | 使用 pdf-state；提取模块级变量；CustomEvent 监听 |
| 修改 | `src/client/annotation.ts` | 使用 pdf-state；删除 3 个 window 赋值 |
| 修改 | `src/client/pdf-viewer.ts` | 使用 pdf-state |
| 修改 | `src/client/pdf-annotation.ts` | 使用 pdf-state |
| 修改 | `src/client/ui/toc-panel.ts` | dispatch `toc:close` CustomEvent |
| 修改 | `src/client/ui/preferences.ts` | dynamic import `clearAllAnnotationState` |
| 修改 | `src/client/ui/sidebar-workspace.ts` | 事件委托替代 window.* |
| 修改 | `src/client/ui/workspace-focus.ts` | 事件委托替代 window.* |
| 修改 | `src/client/ui/sidebar.ts` | 事件委托替代 window.setSidebarTab |
| 修改 | `src/client/ui/file-row.ts` | pin 按钮改用 data-action |

---

## Task 1: 新建 pdf-state.ts，迁移跨文件 PDF 状态

**Files:**
- Create: `src/client/pdf-state.ts`
- Modify: `src/client/main.ts`（行 117-130, 902, 967, 1021, 2492）
- Modify: `src/client/annotation.ts`（行 567, 577, 1002）
- Modify: `src/client/pdf-viewer.ts`（行 81, 402-408）
- Modify: `src/client/pdf-annotation.ts`（行 41-43）

- [ ] **Step 1: 创建 `src/client/pdf-state.ts`**

```ts
import type { PdfViewerInstance } from './pdf-viewer';

export let currentPdfViewer: PdfViewerInstance | null = null;
export function setCurrentPdfViewer(v: PdfViewerInstance | null): void {
  currentPdfViewer = v;
}

export let pdfDefaultScale: number | null = null;
export function setPdfDefaultScale(s: number): void {
  pdfDefaultScale = s;
}

export type PdfPendingRectCoords = {
  pageNum: number;
  x1: number; y1: number;
  x2: number; y2: number;
};
export let pdfPendingRectCoords: PdfPendingRectCoords | null = null;
export function setPdfPendingRectCoords(v: PdfPendingRectCoords | null): void {
  pdfPendingRectCoords = v;
}
```

- [ ] **Step 2: 更新 `src/client/annotation.ts`**

在文件顶部 import 区域加入：
```ts
import { currentPdfViewer } from './pdf-state';
```

找到所有 `(window as any).__currentPdfViewer` 读取，替换为 `currentPdfViewer`（共 3 处，行 567、577、1002）：
```ts
// 改前
const pdfViewer = (window as any).__currentPdfViewer as import('./pdf-viewer.js').PdfViewerInstance | undefined;
// 改后
const pdfViewer = currentPdfViewer ?? undefined;
```

- [ ] **Step 3: 更新 `src/client/pdf-viewer.ts`**

在文件顶部 import 区域加入：
```ts
import { pdfDefaultScale, setPdfPendingRectCoords } from './pdf-state';
```

找到 `(window as any).__pdfDefaultScale`（行 81），替换：
```ts
// 改前
? (window as any).__pdfDefaultScale
// 改后
? pdfDefaultScale
```

找到 `(window as any).__pdfPendingRectCoords = {`（行 402），替换：
```ts
// 改前
(window as any).__pdfPendingRectCoords = {
  pageNum,
  x1: Math.min(downPdfX, upPdfX),
  y1: Math.min(downPdfY, upPdfY),
  x2: Math.max(downPdfX, upPdfX),
  y2: Math.max(downPdfY, upPdfY),
};
// 改后
setPdfPendingRectCoords({
  pageNum,
  x1: Math.min(downPdfX, upPdfX),
  y1: Math.min(downPdfY, upPdfY),
  x2: Math.max(downPdfX, upPdfX),
  y2: Math.max(downPdfY, upPdfY),
});
```

- [ ] **Step 4: 更新 `src/client/pdf-annotation.ts`**

在文件顶部 import 区域加入：
```ts
import { pdfPendingRectCoords, setPdfPendingRectCoords } from './pdf-state';
```

找到 `(window as any).__pdfPendingRectCoords`（行 41-43），替换：
```ts
// 改前
const pendingRect = (window as any).__pdfPendingRectCoords as
  { pageNum: number; x1: number; y1: number; x2: number; y2: number } | null | undefined;
(window as any).__pdfPendingRectCoords = null;
// 改后
const pendingRect = pdfPendingRectCoords;
setPdfPendingRectCoords(null);
```

- [ ] **Step 5: 更新 `src/client/main.ts`**

在文件顶部 import 区域加入：
```ts
import { setCurrentPdfViewer, setPdfDefaultScale } from './pdf-state';
```

找到所有 `(window as any).__currentPdfViewer` 赋值和 `(window as any).__pdfDefaultScale` 赋值，替换：

行 117-130 区域，找到 `(window as any).__currentPdfViewer = null` 替换为 `setCurrentPdfViewer(null)`（共 2 处：行 130 和 902）。

行 967 和 1021：
```ts
// 改前
(window as any).__currentPdfViewer = existingEntry.viewer;
// 改后
setCurrentPdfViewer(existingEntry.viewer);

// 改前
(window as any).__currentPdfViewer = pdfViewerInstance;
// 改后
setCurrentPdfViewer(pdfViewerInstance);
```

行 2492：
```ts
// 改前
(window as any).__pdfDefaultScale = cfg.pdf.defaultScale;
// 改后
setPdfDefaultScale(cfg.pdf.defaultScale);
```

同时检查 `(window as any).setPdfMode` 赋值（行 117）—— `main-actions.ts` 已通过 `data-action="set-pdf-mode"` 处理该操作，window 赋值是死代码。删除整个 `(window as any).setPdfMode = function(...) { ... }` 块（约行 117-136）。

确认方法：搜索 `onclick.*setPdfMode` 应无结果。

- [ ] **Step 6: 构建验证**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build
```

预期：无类型错误，构建成功。

- [ ] **Step 7: 提交**

```bash
git add src/client/pdf-state.ts src/client/main.ts src/client/annotation.ts src/client/pdf-viewer.ts src/client/pdf-annotation.ts
git commit -m "refactor: replace window.__currentPdfViewer/pdfDefaultScale/pdfPendingRectCoords with pdf-state module"
```

---

## Task 2: main.ts 内部 window 自引用 → 模块级变量

**Files:**
- Modify: `src/client/main.ts`（`__resetDwell`、`__setPendingAnnotation`）

- [ ] **Step 1: 提取模块级变量**

在 `src/client/main.ts` 顶层（import 之后、任何函数之前）添加：
```ts
let _resetDwell: (() => void) | null = null;
let _setPendingAnnotation: ((ann: any, filePath: string, x: number, y: number) => void) | null = null;
```

- [ ] **Step 2: 替换 `__resetDwell` 写入**

找到行 2415：
```ts
// 改前
(window as any).__resetDwell = () => {
// 改后
_resetDwell = () => {
```

- [ ] **Step 3: 替换 `__resetDwell` 读取**

找到行 1404：
```ts
// 改前
(window as any).__resetDwell?.();
// 改后
_resetDwell?.();
```

- [ ] **Step 4: 替换 `__setPendingAnnotation` 写入**

找到行 2558：
```ts
// 改前
(window as any).__setPendingAnnotation = setPendingAnnotation;
// 改后
_setPendingAnnotation = setPendingAnnotation;
```

- [ ] **Step 5: 替换 `__setPendingAnnotation` 读取**

找到行 2935-2936：
```ts
// 改前
if ((window as any).__setPendingAnnotation) {
  (window as any).__setPendingAnnotation(annotation, filePath, clientX, clientY);
}
// 改后
if (_setPendingAnnotation) {
  _setPendingAnnotation(annotation, filePath, clientX, clientY);
}
```

- [ ] **Step 6: 构建验证**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build
```

预期：无错误。

- [ ] **Step 7: 提交**

```bash
git add src/client/main.ts
git commit -m "refactor: replace window.__resetDwell and window.__setPendingAnnotation with module-level variables"
```

---

## Task 3: 跨模块回调清理（toc:close CustomEvent、preferences dynamic import、annotation window 删除）

**Files:**
- Modify: `src/client/ui/toc-panel.ts`
- Modify: `src/client/main.ts`（添加 toc:close 监听）
- Modify: `src/client/ui/preferences.ts`
- Modify: `src/client/annotation.ts`

**同时处理 `window.setSidebarTab` —— main.ts 调用侧改为 CustomEvent（因为 main.ts → sidebar.ts 存在循环 import 风险）**

- [ ] **Step 1: `toc-panel.ts` 改用 CustomEvent**

找到 `src/client/ui/toc-panel.ts` 行 66：
```ts
// 改前
(window as any).__onTocClose?.();
// 改后
document.dispatchEvent(new CustomEvent('toc:close'));
```

- [ ] **Step 2: `main.ts` 把 `__onTocClose` 逻辑改为监听 CustomEvent**

找到行 287（`(window as any).__onTocClose = () => {`），把整个赋值块改为 addEventListener：
```ts
// 改前
(window as any).__onTocClose = () => {
  // ...原来的逻辑...
};
// 改后（在同一位置）
document.addEventListener('toc:close', () => {
  // ...原来的逻辑不变...
});
```

- [ ] **Step 3: main.ts `window.setSidebarTab` 调用侧改为 CustomEvent**

找到行 2743：
```ts
// 改前
(window as any).setSidebarTab?.('search');
// 改后
document.dispatchEvent(new CustomEvent('sidebar:set-tab', { detail: { tab: 'search' } }));
```

- [ ] **Step 4: `sidebar.ts` 把 window.setSidebarTab 改为监听 CustomEvent**

找到行 190-192：
```ts
// 改前
if (typeof window !== 'undefined') {
  (window as any).setSidebarTab = setSidebarTab;
}
// 改后
if (typeof window !== 'undefined') {
  document.addEventListener('sidebar:set-tab', (e) => {
    setSidebarTab((e as CustomEvent<{ tab: string }>).detail.tab);
  });
}
```

- [ ] **Step 5: `preferences.ts` 清理死代码**

`clearAllAnnotationState` 函数在任何模块里都没有定义（用了 `?.()` optional chaining 说明原本就可能不存在）。这个按钮"清空评论状态"目前点击无效果。

处理方式：直接删除这个 window 调用，留下空 click handler（或 TODO 注释说明此功能尚未实现）：
```ts
const clearCommentsBtn = document.getElementById('clearAllCommentsBtn');
clearCommentsBtn?.addEventListener('click', () => {
  // TODO: implement clearAllAnnotationState
});
```

- [ ] **Step 6: `annotation.ts` 删除多余的 window 赋值**

找到行 1969-1971，这三行直接删除（`main.ts` 已通过具名 import 直接调用，`todo-panel.ts` 通过 callbacks 注入）：
```ts
// 删除这三行
(window as any).openAnnotationSidebar = openAnnotationSidebar;
(window as any).closeAnnotationSidebar = closeAnnotationSidebar;
(window as any).toggleAnnotationSidebar = toggleAnnotationSidebar;
```

确认 `clearAllAnnotationState` 已在 `annotation.ts` 里 export（检查有无 `export function clearAllAnnotationState`）。若只是普通函数，在函数定义前加 `export`。

- [ ] **Step 7: 构建验证**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build
```

- [ ] **Step 8: 提交**

```bash
git add src/client/ui/toc-panel.ts src/client/main.ts src/client/ui/preferences.ts src/client/annotation.ts src/client/ui/sidebar.ts
git commit -m "refactor: replace window.__onTocClose/setSidebarTab/clearAllAnnotationState with CustomEvent and dynamic import"
```

---

## Task 4: sidebar-workspace.ts 事件委托（最大一组，18 个 window 全局）

**Files:**
- Modify: `src/client/ui/sidebar-workspace.ts`
- Modify: `src/client/ui/file-row.ts`（pin 按钮 data-action）

**原理：** 把模板里的 `onclick="fn('${x}')"` 改为 `data-action="xxx" data-yyy="${x}"`，在 `bindWorkspaceEvents` 里改为挂一个 click listener 到 `document`，读 `closest('[data-action]').dataset` 分发。

- [ ] **Step 1: 修改模板 - workspace header**

在 `renderWorkspaceItem` 函数（行 392）里，把 workspace-header 的 `onclick` 改为 data 属性：
```ts
// 改前
`<div class="workspace-header ${isCurrent ? 'active' : ''}" onclick="handleWorkspaceToggle('${escapeAttr(workspace.id)}')">`
// 改后
`<div class="workspace-header ${isCurrent ? 'active' : ''}" data-action="workspace-toggle" data-workspace-id="${escapeAttr(workspace.id)}">`
```

workspace-remove-actions 容器的 `onclick="event.stopPropagation()"` 改为：
```ts
// 改前
`<div class="workspace-remove-actions" onclick="event.stopPropagation()">`
// 改后
`<div class="workspace-remove-actions" data-stop-propagation="true">`
```
（在 delegate 里统一处理：如果 target.closest('[data-stop-propagation]')，stopPropagation）

移动按钮：
```ts
// 改前
onclick="handleMoveWorkspaceUp('${escapeAttr(workspace.id)}')"
// 改后
data-action="workspace-move-up" data-workspace-id="${escapeAttr(workspace.id)}"

// 改前
onclick="handleMoveWorkspaceDown('${escapeAttr(workspace.id)}')"
// 改后
data-action="workspace-move-down" data-workspace-id="${escapeAttr(workspace.id)}"
```

确认/删除按钮：
```ts
// 改前
onclick="handleConfirmRemoveWorkspace('${escapeAttr(workspace.id)}')"
// 改后
data-action="workspace-confirm-remove" data-workspace-id="${escapeAttr(workspace.id)}"

// 改前
onclick="event.stopPropagation();handleAskRemoveWorkspace('${escapeAttr(workspace.id)}')"
// 改后
data-action="workspace-ask-remove" data-workspace-id="${escapeAttr(workspace.id)}"
```

- [ ] **Step 2: 修改模板 - 目录节点**

在 `renderTreeNode` 函数（行 520）里：
```ts
// 改前
onclick="${hasChildren ? `event.stopPropagation();handleNodeClick('${escapeAttr(workspaceId)}', '${escapeAttr(node.path)}')` : ''}"
// 改后（tree-toggle span）
${hasChildren ? `data-action="node-click" data-workspace-id="${escapeAttr(workspaceId)}" data-node-path="${escapeAttr(node.path)}"` : ''}

// 同理修改 tree-name span
```

- [ ] **Step 3: 修改模板 - missing 文件行**

在 `renderMissingOpenFiles` 函数（行 558）里：
```ts
// 改前
onclick="handleFileClick('${escapeAttr(row.path)}')"
// 改后
data-action="file-click" data-path="${escapeAttr(row.path)}"

// 改前
onclick="event.stopPropagation(); handleRetryMissingFile('${escapeAttr(row.path)}')"
// 改后
data-action="retry-missing-file" data-path="${escapeAttr(row.path)}"

// 改前
onclick="event.stopPropagation(); handleCloseFile('${escapeAttr(row.path)}')"
// 改后
data-action="close-file" data-path="${escapeAttr(row.path)}"
```

- [ ] **Step 4: 修改模板 - retryWorkspaceScan**

在 `renderFileTree` 函数（行 491）里：
```ts
// 改前
onclick="retryWorkspaceScan('${escapeAttr(workspaceId)}')"
// 改后
data-action="retry-workspace-scan" data-workspace-id="${escapeAttr(workspaceId)}"
```

- [ ] **Step 5: 修改模板 - renderTreeNode 文件行 onClickJs**

在 `renderTreeNode` 里，`renderFileRow` 的 `onClickJs` 回调改为 `onClickAction`：
```ts
// 改前
onClickJs: (p) => `handleFileClick('${escapeAttr(p)}')`,
// 改后
onClickAction: 'file-click',
```

- [ ] **Step 6: 修改模板 - add workspace dialog 按钮**

在 `createAddWorkspaceDialogElement` 函数（行 250 区域）里：
```ts
// 改前
onclick="closeAddWorkspaceDialog()"  (两处)
// 改后
data-action="close-add-workspace"  (两处)

// 改前
onclick="confirmAddWorkspaceDialog()"
// 改后
data-action="confirm-add-workspace"
```

同一函数里 `(window as any).confirmAddWorkspaceDialog()` 调用（行 297）改为直接调用：
```ts
// 改前
(window as any).confirmAddWorkspaceDialog();
// 改后
confirmAddWorkspaceDialog();
```

- [ ] **Step 7: 修改 `file-row.ts` pin 按钮**

在 `src/client/ui/file-row.ts` 行 96-100，把 pin 按钮的 onclick 改为 data 属性：
```ts
// 改前
pinBtn = `<button
  class="tree-pin-btn${pinned ? ' active' : ''}"
  title="${pinned ? '取消固定' : '固定到最近视图'}"
  onclick="event.stopPropagation();${pinned ? `handleUnpinFile` : `handlePinFile`}('${escapeAttr(path)}')"
>📌</button>`;
// 改后
pinBtn = `<button
  class="tree-pin-btn${pinned ? ' active' : ''}"
  title="${pinned ? '取消固定' : '固定到最近视图'}"
  data-action="${pinned ? 'unpin-file' : 'pin-file'}"
  data-path="${escapeAttr(path)}"
>📌</button>`;
```

同时确保 `file-row.ts` 在使用 `onClickAction` 时也输出 `data-path`。找到行 122-127：
```ts
// 改前
const clickAttr = opts.onClickJs
  ? `onclick="${opts.onClickJs(path)}"`
  : opts.onClickAction
    ? `data-action="${escapeAttr(opts.onClickAction)}"`
    : '';
// 改后
const clickAttr = opts.onClickJs
  ? `onclick="${opts.onClickJs(path)}"`
  : opts.onClickAction
    ? `data-action="${escapeAttr(opts.onClickAction)}" data-path="${escapeAttr(path)}"`
    : '';
```

- [ ] **Step 8: 重写 `bindWorkspaceEvents` - 删除 window.* 赋值，改为事件委托**

在 `bindWorkspaceEvents` 函数（行 633）里，保留原有的 `removeOutsideClickBound` 逻辑不变，把从行 654 开始的所有 `(window as any).xxx = ...` 全部删除，改为一个 click 委托：

```ts
if (!(bindWorkspaceEvents as any).__delegateBound) {
  (bindWorkspaceEvents as any).__delegateBound = true;
  document.addEventListener('click', async (e) => {
    const el = (e.target as Element).closest('[data-action]') as HTMLElement | null;
    if (!el) return;

    // 阻止冒泡的容器
    if ((e.target as Element).closest('[data-stop-propagation]')) {
      e.stopPropagation();
    }

    const { action, workspaceId, path, nodePath } = el.dataset;

    switch (action) {
      case 'workspace-toggle':
        if (workspaceId) await handleWorkspaceToggle(workspaceId);
        break;
      case 'retry-workspace-scan':
        if (workspaceId) await retryWorkspaceScan(workspaceId);
        break;
      case 'workspace-ask-remove':
        e.stopPropagation();
        if (workspaceId) await handleAskRemoveWorkspace(workspaceId);
        break;
      case 'workspace-confirm-remove':
        if (workspaceId) await handleConfirmRemoveWorkspace(workspaceId);
        break;
      case 'node-click':
        e.stopPropagation();
        if (workspaceId && nodePath) await handleNodeClick(workspaceId, nodePath);
        break;
      case 'file-click':
        if (path) await handleFileClick(path);
        break;
      case 'close-file':
        e.stopPropagation();
        if (path) await handleCloseFile(path);
        break;
      case 'retry-missing-file':
        e.stopPropagation();
        if (path) await handleRetryMissingFile(path);
        break;
      case 'show-add-workspace':
        showAddWorkspaceDialog();
        break;
      case 'close-add-workspace':
        closeAddWorkspaceDialog();
        break;
      case 'confirm-add-workspace':
        await confirmAddWorkspaceDialog();
        break;
      case 'workspace-move-up':
        if (workspaceId) await handleMoveWorkspaceUp(workspaceId);
        break;
      case 'workspace-move-down':
        if (workspaceId) await handleMoveWorkspaceDown(workspaceId);
        break;
      case 'focus-file-click':
        if (path) await handleFocusFileClick(path);
        break;
      case 'unpin-file':
        e.stopPropagation();
        if (path) await handleUnpinFile(path);
        break;
      case 'pin-file':
        e.stopPropagation();
        if (path) await handlePinFile(path);
        break;
      // focus-workspace-toggle 和 set-focus-window-key 由 workspace-focus.ts 自己的委托处理
      // （见 Task 5），不在这里处理，避免循环依赖
    }
  });
}
```

把 `handleWorkspaceToggle`、`retryWorkspaceScan` 等原来的 `(window as any).xxx = async (id) => {...}` 函数体提取为普通函数（直接在文件里用 `async function handleWorkspaceToggle(workspaceId: string) { ... }`）。

`workspaceCallbacks` 通过闭包访问（`bindWorkspaceEvents` 第一次调用时用 `_callbacks` 变量存储）：
```ts
let _workspaceCallbacks: WorkspaceCallbacks | undefined;

export function bindWorkspaceEvents(callbacks?: WorkspaceCallbacks): void {
  if (callbacks) _workspaceCallbacks = callbacks;
  // ...其余逻辑
}
```
然后 `handleFileClick` 等函数引用 `_workspaceCallbacks` 而非参数。

- [ ] **Step 9: 构建验证**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build
```

预期：无类型错误。若有 `cannot find name 'handleXxx'` 错误，说明某函数还未提取为普通函数，补全即可。

- [ ] **Step 10: 提交**

```bash
git add src/client/ui/sidebar-workspace.ts src/client/ui/file-row.ts
git commit -m "refactor: replace window.* globals in sidebar-workspace with event delegation"
```

---

## Task 5: workspace-focus.ts + sidebar.ts 剩余事件委托

**Files:**
- Modify: `src/client/ui/workspace-focus.ts`
- Modify: `src/client/ui/sidebar.ts`

**关键点：** `setFocusWindowKey` 和 `handleFocusWorkspaceToggle` 目前定义在 `sidebar-workspace.ts`（因为是从那里的 `bindWorkspaceEvents` 注册的），但它们的逻辑只用到 workspace-focus.ts 的内部函数。**这两个函数需要从 sidebar-workspace.ts 迁移到 workspace-focus.ts**，以便在 workspace-focus.ts 自己的委托里处理，避免循环依赖（sidebar-workspace.ts 已 import workspace-focus.ts，反向 import 会循环）。

- [ ] **Step 1: 把 setFocusWindowKey / handleFocusWorkspaceToggle 迁移到 workspace-focus.ts**

在 `src/client/ui/workspace-focus.ts` 里，在 `setFocusStrategy` 函数附近添加（这两个函数用的都是 workspace-focus.ts 内部能直接访问的模块）：

```ts
export function setFocusWindowKey(key: string): void {
  state.config.focusWindowKey = key as any;
  import('../config').then(({ saveConfig }) => saveConfig(state.config));
  refreshFrecencySignals().then(() =>
    import('./sidebar').then(({ renderSidebar }) => renderSidebar())
  );
}

export function handleFocusWorkspaceToggle(id: string): void {
  const collapsed = getFocusCollapsed();
  if (collapsed.has(id)) collapsed.delete(id);
  else collapsed.add(id);
  saveFocusCollapsed(collapsed);
  import('./sidebar').then(({ renderSidebar }) => renderSidebar());
}
```

然后在 `src/client/ui/sidebar-workspace.ts` 的 `bindWorkspaceEvents` 里，**删除**以下两个 `(window as any).xxx = ...` 赋值（行 810-829）——它们会在 Task 5 Step 2 的新委托里处理。

- [ ] **Step 2: 修改 workspace-focus.ts 模板**

在 `renderFilterBar` 函数（行 195 区域），时间窗口按钮：
```ts
// 改前
onclick="setFocusWindowKey('${o.key}');toggleFilterPopup()"
// 改后
data-action="set-focus-window-key" data-key="${o.key}" data-also-toggle-filter="true"
```

文件类型按钮：
```ts
// 改前
onclick="toggleFocusTypeFilter('${o.ext}')"
// 改后
data-action="toggle-focus-type-filter" data-ext="${o.ext}"
```

筛选按钮：
```ts
// 改前
onclick="toggleFilterPopup()"
// 改后
data-action="toggle-filter-popup"
```

在 `renderFocusWorkspaceGroup` 函数（行 260 区域），workspace header：
```ts
// 改前
onclick="handleFocusWorkspaceToggle('${escapeAttr(workspace.id)}')"
// 改后
data-action="focus-workspace-toggle" data-workspace-id="${escapeAttr(workspace.id)}"
```

`renderFocusFileItem` 里的 `onClickJs` 改为 `onClickAction`：
```ts
// 改前
onClickJs: (p) => `handleFocusFileClick('${escapeAttr(p)}')`,
// 改后
onClickAction: 'focus-file-click',
```

- [ ] **Step 3: 删除 workspace-focus.ts 底部 window.* 赋值块，改为 click 委托**

找到文件末尾（行 445-448），删除三行 window 赋值，然后把整个 `if (typeof window !== 'undefined')` 块改成：
```ts
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e: MouseEvent) => {
    const el = (e.target as Element).closest('[data-action]') as HTMLElement | null;
    if (!el) return;
    const { action } = el.dataset;
    if (action === 'toggle-focus-type-filter') {
      const ext = el.dataset.ext;
      if (ext) toggleFocusTypeFilter(ext);
    } else if (action === 'set-focus-strategy') {
      const strategy = el.dataset.strategy as 'frecency' | 'mtime' | undefined;
      if (strategy) setFocusStrategy(strategy);
    } else if (action === 'toggle-filter-popup') {
      toggleFilterPopup();
    } else if (action === 'set-focus-window-key') {
      const key = el.dataset.key;
      if (key) {
        setFocusWindowKey(key);
        if (el.dataset.alsoToggleFilter) toggleFilterPopup();
      }
    }
  });

  void refreshFrecencySignals();

  // 点击 popup 外部关闭（保持不变）
  document.addEventListener('click', (e) => {
    if (!filterPopupOpen) return;
    if ((e.target as HTMLElement).closest('.focus-filter-popup-wrap')) return;
    closeFilterPopup();
  });
}
```

注意：`setFocusWindowKey` 目前在 `sidebar-workspace.ts` 的 Task 4 委托里也被处理，这里的 `set-focus-window-key` action 在 workspace-focus.ts 里处理即可，从 Task 4 的 switch 里移除。

- [ ] **Step 3: sidebar.ts 的 setSidebarTab 模板**

- [ ] **Step 4: sidebar.ts 模板 + 委托**

找到行 411：
```ts
// 改前
onclick="setSidebarTab('${t.key}')"
// 改后
data-action="set-sidebar-tab" data-tab="${t.key}"
```

`sidebar.ts` 的 `if (typeof window !== 'undefined')` 块改为（合并到 Task 3 Step 4 的监听里，或单独在这里处理）：
```ts
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e: MouseEvent) => {
    const el = (e.target as Element).closest('[data-action]') as HTMLElement | null;
    if (!el) return;
    if (el.dataset.action === 'set-sidebar-tab') {
      const tab = el.dataset.tab;
      if (tab) setSidebarTab(tab);
    }
  });
  document.addEventListener('sidebar:set-tab', (e) => {
    setSidebarTab((e as CustomEvent<{ tab: string }>).detail.tab);
  });
}
```

- [ ] **Step 4: 构建验证 + 全量 window.* 检查**

```bash
cd /Users/huanghao/workspace/md-viewer && bun run build
```

验收命令：
```bash
# 只应剩 CDN 库读取（marked/mermaid/renderMathInElement/pdfjsLib）和 pdfjsLib 写入（html.ts 里的标准模式）
grep -rn "(window as any)\." src/client/ --include="*.ts" | grep -v "embedded-client.ts"
```

预期输出：只剩 `main.ts` 里的 `(window as any).marked`、`(window as any).mermaid`、`(window as any).renderMathInElement`、`pdf-viewer.ts` 里的 `(window as any).pdfjsLib`。无任何 `= ` 赋值行。

- [ ] **Step 5: 提交**

```bash
git add src/client/ui/workspace-focus.ts src/client/ui/sidebar.ts
git commit -m "refactor: replace remaining window.* globals in workspace-focus and sidebar with event delegation"
```
