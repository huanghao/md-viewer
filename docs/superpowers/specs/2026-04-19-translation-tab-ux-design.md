# Translation Tab UX Improvements

## Goal

改善翻译侧边栏的使用体验：新翻译出现在最前、历史上限 10 条、新增一键清空工具栏。

## Changes

### 1. 新翻译显示在最前

`renderTranslationList`（`src/client/annotation.ts`）渲染时按 timestamp 降序排列，最新翻译显示在列表顶部。存储结构不变。

### 2. 历史上限 10 条

- `recentCalls`（调用统计，`src/client/pdf-translation.ts:86`）上限从 20 改为 10。
- `localStorage` 中的翻译条目也限制为最近 10 条：每次写入新条目后，若该文件的翻译总数超过 10，删除最旧的（timestamp 最小的）。

### 3. 翻译 Tab 工具栏（清空按钮）

**位置：** `annotation-tabs`（tab 标签行）下方，`translationList` 上方，新增 `div#translationToolbar`。

**样式：**
- `padding: 7px 8px`，`border-bottom: 1px solid #e1e4e8`，`display: flex`，`justify-content: flex-end`
- 高度与 tab 行等高（~34px）
- 仅在翻译 tab 激活时显示（`display: none` 默认，切换 tab 时同步显示/隐藏）

**按钮：**
- 复用 `annotation-icon-btn` class
- 垃圾桶 SVG 图标（16×16，黑色/素色）
- hover 效果继承 `.annotation-icon-btn:hover`（蓝色描边）
- `title="清空全部翻译"`
- 点击后清空当前文件所有 localStorage 翻译条目，刷新列表

## Files Affected

- `src/client/annotation.ts` — `renderTranslationList`（排序）、`switchAnnotationTab`（工具栏显示/隐藏）
- `src/client/html.ts` — 新增 `#translationToolbar` DOM
- `src/client/pdf-translation.ts` — `recentCalls` 上限、localStorage 10 条上限、新增 `clearAllTranslations(filePath)`
- `src/client/main.ts` 或调用处 — 绑定清空按钮事件
