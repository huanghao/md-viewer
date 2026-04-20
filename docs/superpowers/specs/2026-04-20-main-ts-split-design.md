# main.ts 拆分设计文档

> 日期：2026-04-20

## 目标

将 `main.ts`（2829 行）中边界最清晰的两个功能模块提取为独立文件，提升 agent 可读性和可测试性。

**不拆 diff 模块**：`diffViewActive` 全局状态被 `renderContent`、`syncFileFromDisk`、`switchFile` 等核心函数直接读写，提取会引入循环依赖，留待后续状态重构时再处理。

---

## 模块 1：`src/client/keyboard-shortcuts.ts`

### 提取范围

`main.ts` 行 1496–1558 的 `setupKeyboardShortcuts()` 函数（62 行）。

### 接口设计

```typescript
export interface KeyboardShortcutDeps {
  dismissAnnotationPopup: () => boolean;
  closeSettings: () => void;
  removeFile: (path: string) => void;
  navigateDiff: (dir: 1 | -1) => void;
  getCurrentFile: () => string | undefined;
  isDiffActive: () => boolean;
}

export function setupKeyboardShortcuts(deps: KeyboardShortcutDeps): void
```

### main.ts 调用方式

```typescript
import { setupKeyboardShortcuts } from './keyboard-shortcuts';

// 在初始化块中：
setupKeyboardShortcuts({
  dismissAnnotationPopup: dismissAnnotationPopupByEscape,
  closeSettings: closeSettingsDialog,
  removeFile: removeFileHandler,
  navigateDiff: navigateDiffBlock,
  getCurrentFile: () => state.currentFile,
  isDiffActive: () => diffViewActive,
});
```

### 测试策略

mock `deps` 对象，验证：
- `Escape` 键按优先级依次触发 annotation popup → settings → workspace overlay
- `Cmd-K` 聚焦 `#searchInput`，但在 textarea/input 内不触发
- `Cmd-W` 调用 `removeFile(currentFile)`，无 currentFile 时不调用
- `n`/`p` 在 diff 激活时调用 `navigateDiff`，在 input/textarea 内不触发

---

## 模块 2：`src/client/zoom-controller.ts`

### 提取范围

`main.ts` 行 1944–2018 的缩放相关代码（~75 行）：
- 模块级变量：`currentFontScale`、`pdfZoomDebounceTimer`
- 函数：`initFontScale`、`applyFontScale`、`zoomIn`、`zoomOut`、`zoomReset`、`adjustPdfZoom`、`setPdfZoomValue`、`getPdfZoom`、`updateZoomDisplay`

### 接口设计

`pdfViewerRegistry` 留在 main.ts，通过 getter 注入：

```typescript
export interface ZoomDeps {
  getCurrentFile: () => string | undefined;
  getPdfViewer: (filePath: string) => { setScale(s: number): Promise<void> } | null;
}

export function initZoom(deps: ZoomDeps): void           // 初始化，读取存储值
export function zoomIn(): void
export function zoomOut(): void
export function zoomReset(): void
export function updateZoomDisplay(): void
export function setPdfZoomValue(filePath: string, scale: number): void
export function getPdfZoom(filePath: string): number
```

`deps` 在模块初始化时注入一次，内部保存引用，后续调用不需要传参。

### main.ts 调用方式

```typescript
import { initZoom, zoomIn, zoomOut, zoomReset, updateZoomDisplay, setPdfZoomValue, getPdfZoom } from './zoom-controller';

// 在初始化块中：
initZoom({
  getCurrentFile: () => state.currentFile,
  getPdfViewer: (filePath) => pdfViewerRegistry.get(filePath)?.viewer ?? null,
});
```

`zoomIn`/`zoomOut`/`zoomReset` 在 main.ts 的按钮事件和快捷键中直接调用（签名不变）。

### 与 zoom.js 的关系

`zoom-controller.ts` 依赖已有的 `zoom.js`（`clampZoom`、`zoomStep`、`pdfZoomKey`、常量），不重复实现。

### 测试策略

mock `deps`，验证：
- `zoomIn` 在 PDF 文件时调用 `getPdfViewer().setScale()`，在 MD 文件时更新 `currentFontScale`
- `zoomReset` 在 PDF 时调用 `setPdfZoomValue(file, PDF_ZOOM_DEFAULT)`，在 MD 时重置为 1.0
- `getPdfZoom` 从存储读取，缺失时返回 `PDF_ZOOM_DEFAULT`
- `updateZoomDisplay` 在 PDF/MD 时显示不同格式

---

## 文件变更总览

| 操作 | 文件 |
|------|------|
| 新建 | `src/client/keyboard-shortcuts.ts` |
| 新建 | `tests/unit/keyboard-shortcuts.test.ts` |
| 新建 | `src/client/zoom-controller.ts` |
| 新建 | `tests/unit/zoom-controller.test.ts` |
| 修改 | `src/client/main.ts`（删除对应函数，添加 import 和调用） |

---

## 不在本次范围内

- Diff 模块（`diffViewActive` 全局状态耦合）
- Sidebar/TOC（行数少，收益小）
- SSE 连接管理（与状态管理深度耦合）
- css.ts 拆分（构建约束）
