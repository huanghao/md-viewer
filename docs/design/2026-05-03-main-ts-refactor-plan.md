# main.ts 拆分计划 2026-05-03

## 背景

`src/client/main.ts` 当前 3158 行、96 个函数，包含渲染、文件切换、SSE、diff、TOC、find-bar、内存监控等所有逻辑。本计划分阶段将其拆分到职责单一的模块，目标降到 200 行以内。

## 目标与边界

**做到什么程度可以停**：main.ts < 200 行，每个拆出的模块单一职责、可独立理解。功能完全不变。

**不在本计划内**：css.ts（4300行）、embedded-client.ts 拆分。

## 验证策略（每个 Task 都要执行）

1. `npx tsc --noEmit` — 零 TS 错误
2. `bun test` — 全部测试通过（基线：73 个）
3. 手工验证：打开 app，走目标功能的核心路径

**安全机制**：每个 Task 独立 commit（`extract: xxx to yyy`），失败用 `git revert <hash>` 回滚单步。

---

## Phase A：纯提取（零风险，只移动代码）

### Task A1：提取 `diff-view.ts`（~280 行）

**提取函数**：
- `loadPendingContent`
- `renderInlineDiffHTML`
- `renderDiffView`
- `refreshDiffIfActive`
- `handleDiffButtonClick`
- `closeDiffView`
- `navigateDiffBlock`
- `acceptDiffUpdate`

**依赖**：`state`、`api/files`、`ui/diff-banner`、`ui/diff-refresh`、`ui/doc-scrollbar`、`utils/diff`、`utils/undo-queue`

**外部需要**：`renderContent` 和 `updateToolbarButtons` — 通过 init 回调注入

**验证**：`bun test tests/unit/diff*.test.ts`，手工测 diff 模式开关、接受更新

---

### Task A2：提取 `toc-manager.ts`（~260 行）

**提取函数**：
- `loadTocOpen` / `saveTocOpen`
- `applyTocVisibility`
- `setupTocOpenBtn`
- `applyTocPaneHeight` / `initTocPaneHeight`
- `setupTocResize`
- `updateToc`
- `attachPdfScrollHighlight`
- `resolveOutlineDest` / `resolveOutlinePageNums`

**依赖**：`toc-extractor`、`ui/toc-panel`、`utils/resizer`、`pdf-state`

**外部需要**：`state.currentFile`、`currentPdfViewer` — 直接 import

**验证**：手工测 TOC 展开/收起、PDF outline、TOC/content resize 拖拽

---

### Task A3：提取 `find-bar.ts`（~170 行）

**提取函数**：`setupFindBar` 全部代码

**特殊处理**：将 `(window as any).__showFindBar = show` 挪进新模块（Swift 调用入口不变），main.ts 只需 `import './find-bar'`

**验证**：手工测 Cmd+F 查找、高亮导航、关闭

---

### Task A4：提取 `memory-monitor.ts`（~230 行）

**提取函数**：
- `getPdfMemStats`
- `renderMemoryTab`
- `updateMonitorPanel`
- `switchMonitorTab`
- `renderSessionsTab`
- `toggleMonitorPanel`

**外部需要**：`pdfViewerRegistry` Map — 作为 init 参数传入（避免在新模块里 import main.ts）

**验证**：手工测内存监控面板开关、session 列表

---

### Phase A 验收

完成 A1-A4 后，main.ts 应降至 ~2200 行。执行完整 `bun test` + 全功能手工验收。

---

## Phase B：提取核心渲染（中等复杂度）

### Task B1：提取 `content-renderer.ts`（~480 行）

**提取函数**：
- `renderContent`（核心，最复杂）
- `renderMath`
- `renderMermaidDiagrams`
- `mountPdfPageIndicator` / `unmountPdfPageIndicator`
- `resolveMarkdownAssetSrc`
- `rewriteMarkdownAssetUrls`
- `isMarkdownContent`

**挑战**：`renderContent` 内部引用 `pdfViewerRegistry`、`currentPdfBridge`、`updateToc`、`renderBreadcrumb` 等

**解法**：将 `pdfViewerRegistry`、`currentPdfBridge` 及所需回调（`updateToc`、`renderBreadcrumb`）通过模块级 `initContentRenderer(deps)` 注入

**验证**：每种文件类型各测（md、pdf、json、html）、mermaid 图表、LaTeX 公式、图片路径解析

---

### Task B2：提取 `file-switcher.ts`（~250 行）

**提取函数**：
- `switchFile`
- `addFileByPath`
- `handleSmartAddInput`
- `showAddConfirm` / `clearAddConfirm` / `isAddConfirmVisible`
- `executePendingAddAction`
- `removeFileHandler`
- `handleURLParams`
- `looksLikePathInput`

**验证**：切换文件、添加新文件、URL 参数加载、关闭文件

---

### Phase B 验收

完成 B1-B2 后，main.ts 应降至 ~800 行。执行完整 `bun test` + 全功能手工验收。

---

## Phase C：收尾

### Task C1：整理 IIFE → `init.ts`

经过 A1-A4、B1-B2 后，main.ts 的 IIFE 只剩纯胶水调用（各模块 init 函数的串联）。将 IIFE 提取为 `src/client/init.ts`，main.ts 只保留常量定义和 `import './init'`。

**目标**：main.ts < 200 行

---

## 执行顺序与停止点

```
A1 → A2 → A3 → A4
            ↓ Phase A 验收（main.ts ~2200 行）
B1 → B2
            ↓ Phase B 验收（main.ts ~800 行）
C1
            ↓ 完成（main.ts < 200 行）
```

**可以提前停的位置**（每步都是独立 commit）：
- Phase A 后：diff/toc/find-bar 已分离，代码库明显改善，可接受
- B1 后：`renderContent` 独立，最大单步收益，可停
- 任意 Task 后

---

## 各 Task 执行纪律

1. 新建目标文件，复制代码
2. main.ts 删除对应代码，改为 import
3. `npx tsc --noEmit` 通过
4. `bun test` 通过
5. 手工验证功能
6. `git commit -m "extract: <函数列表> to <新文件>"`

## 当前进度

- [x] A1: diff-view.ts (commit e25f87e)
- [x] A2: toc-manager.ts (commit 3a898f7)
- [x] A3: find-bar.ts (commit 95bffb0)
- [x] A4: memory-monitor.ts (commit 637c0ab)
- [x] B1: content-renderer.ts (commit bf79b42)
- [x] B2: file-switcher.ts (commit 1eeba17)
- [x] C1: init.ts + sse-connection.ts + sidebar-layout.ts + clipboard.ts + browsing-signals.ts (commit f63f2c1)

## 完成结果

main.ts: 3158 → 395 行（-87%）
新增模块：diff-view.ts, toc-manager.ts, find-bar.ts, memory-monitor.ts,
          content-renderer.ts, file-switcher.ts, init.ts, sse-connection.ts,
          ui/sidebar-layout.ts, utils/clipboard.ts, utils/browsing-signals.ts
