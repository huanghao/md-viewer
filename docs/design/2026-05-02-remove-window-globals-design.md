# 消除 window.* 全局通信总线

**日期：** 2026-05-02

## 目标

删除所有 `(window as any).xxx = fn` 模式，恢复 TypeScript 类型安全和 IDE 可追踪性。完成后 `grep "(window as any)\." src/client/ --include="*.ts"` 只剩第三方库的读取（marked、mermaid、renderMathInElement、pdfjsLib），无任何写入。

## 问题分类

### 组 1：onclick 模板字符串 → 事件委托（最多，~22 个全局）

HTML 模板里的 `onclick="fn('${x}')"` 要求 `fn` 在 `window` 上。

**受影响文件：**
- `ui/sidebar-workspace.ts`：18 个（handleFileClick、handleWorkspaceToggle、handleNodeClick、handleCloseFile、handleRetryMissingFile、handleAskRemoveWorkspace、handleConfirmRemoveWorkspace、handleMoveWorkspaceUp、handleMoveWorkspaceDown、handleFocusFileClick、handleUnpinFile、handlePinFile、handleFocusWorkspaceToggle、setFocusWindowKey、showAddWorkspaceDialog、closeAddWorkspaceDialog、confirmAddWorkspaceDialog、retryWorkspaceScan）
- `ui/workspace-focus.ts`：3 个（toggleFocusTypeFilter、setFocusStrategy、toggleFilterPopup）
- `ui/sidebar.ts`：1 个（setSidebarTab）

**方案：事件委托**

把模板里的 `onclick="fn('${x}')"` 改成 `data-action="fn" data-xxx="${x}"`，在容器上挂一个 `click` listener，读 `dataset` 分发到对应函数。

```ts
// 改前
`onclick="handleFileClick('${escapeAttr(path)}')"`

// 改后（模板）
`data-action="file-click" data-path="${escapeAttr(path)}"`

// 改后（initWorkspaceSidebar 里）
container.addEventListener('click', (e) => {
  const el = (e.target as Element).closest('[data-action]') as HTMLElement | null;
  if (!el) return;
  e.stopPropagation(); // 在单个 switch 里统一管控冒泡
  const { action } = el.dataset;
  switch (action) {
    case 'file-click': handleFileClick(el.dataset.path!); break;
    case 'workspace-toggle': handleWorkspaceToggle(el.dataset.workspaceId!); break;
    // ...
  }
});
```

容器绑定点：
- `sidebar-workspace.ts`：绑在 `#sidebarContent`（整个侧栏内容区）
- `workspace-focus.ts`：绑在 `.focus-view`（focus 视图根节点）
- `sidebar.ts`：绑在 `#sidebar`（sidebar 根节点）

注意：现有 `onclick` 字符串里有一些 `event.stopPropagation()` 调用，改造后在委托 handler 里按需处理冒泡，不再需要内联。

### 组 2：跨文件私有状态 → 共享模块

`window.__xxx` 被用来在模块间传递运行时状态，因为没有合适的共享模块。

**受影响的状态：**

| window 变量 | 写入方 | 读取方 | 类型 |
|---|---|---|---|
| `__currentPdfViewer` | `main.ts` | `annotation.ts` | `PdfViewerInstance \| null` |
| `__pdfDefaultScale` | `main.ts` | `pdf-viewer.ts` | `number \| null` |
| `__pdfPendingRectCoords` | `pdf-viewer.ts` | `pdf-annotation.ts` | 矩形坐标对象 \| null |

**方案：新建 `src/client/pdf-state.ts`**

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

export type PdfPendingRectCoords = { page: number; x1: number; y1: number; x2: number; y2: number };
export let pdfPendingRectCoords: PdfPendingRectCoords | null = null;
export function setPdfPendingRectCoords(v: PdfPendingRectCoords | null): void {
  pdfPendingRectCoords = v;
}
```

各文件直接 `import { currentPdfViewer, setCurrentPdfViewer } from './pdf-state'`，删除对应 `window.__xxx`。

### 组 3：main.ts 内部自引用 → 模块级变量

`__resetDwell` 和 `__setPendingAnnotation` 都在 `main.ts` 内部写入并读取，用 window 只是因为定义和调用之间存在初始化顺序问题。

**方案：** 提取为模块级 `let` 变量：

```ts
// main.ts 顶部
let resetDwell: (() => void) | null = null;
let setPendingAnnotationFn: ((ann: any, filePath: string, x: number, y: number) => void) | null = null;
```

在 IIFE 里赋值，调用处直接用变量名，删除所有 `(window as any).__resetDwell` 和 `(window as any).__setPendingAnnotation`。

同理：`setPdfMode` 是顶层定义但内联使用了 window，改为直接 export 函数供 HTML 内调用，或通过事件委托（main.ts 也应挂一个全局 data-action 委托）。

### 组 4：跨模块回调 → dynamic import 或 CustomEvent

**`toc-panel.ts` → `__onTocClose`（main.ts 定义）：**

改为 CustomEvent：
```ts
// toc-panel.ts
document.dispatchEvent(new CustomEvent('toc:close'));

// main.ts
document.addEventListener('toc:close', () => { /* 原来的 __onTocClose 逻辑 */ });
```

**`preferences.ts` → `clearAllAnnotationState`（annotation.ts 定义）：**

改为 dynamic import（annotation.ts 已导出该函数）：
```ts
// preferences.ts
import('../annotation').then(m => m.clearAllAnnotationState());
```

**`annotation.ts` 的三个全局（openAnnotationSidebar、closeAnnotationSidebar、toggleAnnotationSidebar）：**

`main.ts` 已通过具名 import 直接使用，`todo-panel.ts` 通过 callback 注入，window 暴露是多余的。直接删除 annotation.ts 末尾的三行赋值。

## 不改动的部分

下列 `window` 读取是 CDN 加载的第三方库，保持现状：
- `window.marked`
- `window.mermaid`
- `window.renderMathInElement`
- `window.pdfjsLib`（`html.ts` 里通过 `window.pdfjsLib = pdfjsLib` 设置，这是标准的 pdfjs 加载模式）

## 执行顺序建议

1. **新建 `pdf-state.ts`**，迁移组 2（最独立，无 HTML 模板变化，改完可立即验证）
2. **组 3**：main.ts 内部变量，不涉及其他文件
3. **组 4**：toc-panel CustomEvent、preferences dynamic import、annotation.ts 三行删除
4. **组 1 sidebar-workspace.ts**：事件委托，改动最大，分 action 类型逐一迁移
5. **组 1 workspace-focus.ts + sidebar.ts**：补剩余的模板 onclick

## 验收命令

```bash
# 应该只剩 window 读取（marked/mermaid/renderMathInElement/pdfjsLib）
grep -rn "(window as any)\." src/client/ --include="*.ts" | grep -v "embedded-client.ts"

# 应该没有 window.xxx = 的赋值
grep -rn "(window as any)\." src/client/ --include="*.ts" | grep -v "embedded-client.ts" | grep "="

# 构建应通过
bun run build
```
