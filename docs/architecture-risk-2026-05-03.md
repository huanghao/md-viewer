# 架构风险分析 2026-05-03（持续更新）

> 上次分析：2026-05-02。本文档随重构进展持续更新。最后更新：2026-05-03。

---

## 已解决

### ✅ window.* 全局通信总线（原高风险）

原来 main.ts 末尾暴露 40+ 个全局函数，HTML 模板里 `onclick="window.xxx()"` 字符串调用。

**现状**：`(window as any)` 强制转换已全部清除（过滤掉合法的 CDN 库引用和 Swift 入口后，**0 条**残留）。替换方案：
- HTML 模板改用 `data-action` + 事件委托
- 跨模块通信改用 `document.dispatchEvent(new CustomEvent(...))`
- 内部回调改用 `initXxx(deps)` 依赖注入

### ✅ main.ts 3000 行神文件（原高风险）

**现状**：main.ts 从 3158 行降到 **36 行**（-99%）。拆分出的模块：

| 新模块 | 行数 | 职责 |
|--------|------|------|
| `init.ts` | 634 | 启动序列 |
| `content-renderer.ts` | 689 | 内容渲染（Markdown/PDF/JSON/HTML） |
| `app-actions.ts` | 187 | onFileLoaded、renderAll、updateToolbarButtons 等应用级操作 |
| `file-switcher.ts` | 375 | 文件切换、添加、URL 参数 |
| `diff-view.ts` | 325 | Diff 模式 |
| `toc-manager.ts` | 271 | TOC 管理与 PDF 大纲 |
| `sse-connection.ts` | 248 | SSE 连接与重连 |
| `memory-monitor.ts` | 259 | 内存监控面板 |
| `pdf-registry.ts` | 63 | PDF viewer registry、evict/schedule/cancel、setPdfMode |
| `find-bar.ts` | 172 | 查找栏 |
| `ui/sidebar-layout.ts` | ~80 | 侧边栏宽度/折叠 |
| `utils/clipboard.ts` | ~70 | 剪贴板工具函数 |
| `utils/browsing-signals.ts` | ~80 | Dwell/Scroll 信号 |

### ✅ 循环依赖 init.ts ↔ main.ts（已彻底消除）

提取 `pdf-registry.ts`（共享 registry）、`app-actions.ts`（应用级函数）后，init.ts 不再 import main.ts。`grep "from './main'" src/client/**/*.ts` 返回空。

---

## 当前高风险

### 1. `annotation.ts` 仍有 1447 行（持续改善中）

**拆分进度**（annotation 模块总计 2496 行，分布在 8 个文件）：

| 文件 | 行数 | 状态 |
|------|------|------|
| `annotation.ts` | 1447 | 主文件，orchestration + Popover/Composer/List/Init |
| `annotation-state.ts` | 193 | ✅ 已提取：类型、state 对象、thread normalization |
| `annotation-layout.ts` | 152 | ✅ 已提取：sidebar DOM、宽度/折叠 |
| `annotation-rendering.ts` | 251 | ✅ 已提取：applyAnnotations、clearRenderedMarks、mark DOM |
| `annotation/icons.ts` | 12 | ✅ 已提取：iconSvg 纯函数 |
| `annotation/thread-manager.ts` | 203 | ✅ 已提取：appendReply、editThreadItem、deleteThreadItem |
| `annotation/persistence.ts` | 100 | ✅ 已提取：persistAnnotation、hydrateAnnotationsFromRemote、setAnnotations |
| `annotation/chat-split.ts` | 138 | ✅ 已提取：enterSplitMode、exitSplitMode、syncChatSidebarLayout |

**annotation.ts 剩余结构**：

| 区块 | 约行数 | 可提取性 |
|------|--------|----------|
| `initAnnotationElements()` 事件绑定 | ~450 | 难——是所有逻辑的 orchestration hub，提取收益递减 |
| `renderAnnotationList()` + 内部事件绑定 | ~174 | 中——需要传入大量 callback |
| Popover 管理 | ~100 | 中——依赖 renderAnnotationList |
| Composer/Selection pipeline | ~170 | 高风险——与 Popover 双向耦合 |
| CRUD（savePendingAnnotation/removeAnnotation/toggleResolved） | ~150 | 高风险——深度依赖 state 和多个 UI 函数 |
| 其他小工具 | ~50 | 易提取但收益小 |

**结论**：annotation.ts 的剩余部分耦合度显著高于已提取部分，继续机械地拆分会引入越来越多的 callback 注入，代码可读性可能反而下降。当前 1447 行已从原始 2183 行降低 34%，且每个已提取模块都有清晰的单一职责。**建议暂停 annotation 拆分，转向其他技术债。**

---

## 当前中风险

### 2. `css.ts` 是 4320 行的字符串文件

整个 UI 样式是一个巨大的 TypeScript 字符串 export，无法用 CSS tooling（linter、变量提示、dead-code 检测）处理。

**可行方案**：将 css.ts 拆分为若干 `.css` 文件，用 esbuild 的 `loader: { '.css': 'text' }` 内联，或改用 CSS-in-JS 方案。影响所有 UI，需要专项计划。

**可接受性**：功能正确，只影响开发体验，不影响运行时。

### 3. `embedded-client.ts` 是 2136 行的压缩 JS 字符串（自动生成）

构建流程分两阶段（bun build → embed-client.ts），压缩后不可读，代码审查不可见，必须手动触发同步。这是 SwiftUI WebView 的必要产物，改动成本高。

### 4. 依赖注入模式（initXxx）已系统化但未文档化

全代码库现有 26 个 `initXxx` 函数。已在 AGENTS.md 添加规则，说明何时用 init 注入 vs 直接 import。

---

## 当前低风险

### 5. `handlers.ts` 1022 行（服务端）

后端路由处理器，多个 API handler 混在一个文件。不影响前端，暂可接受。

### 6. `pdf-viewer.ts` 1024 行

PDF 渲染逻辑集中，职责相对单一，可接受。

### 7. `ui/sidebar-workspace.ts` 866 行 + `ui/sidebar.ts` 855 行

偏大但已完成 data-action 事件委托重构，逻辑清晰，暂不优先。

### 8. 3 处 `onClickJs` 模板字符串（file-row.ts）

`file-row.ts` 保留了 `opts.onCloseJs` 和 `opts.onClickJs` 两个内联 onclick 注入口，是 data-action 重构未覆盖的角落。功能正常。

### 9. RAG 重型依赖无降级路径

`@huggingface/transformers`、`onnxruntime-node` 在某些环境下安装可能失败，无优雅降级机制。

---

## 总体健康状态

| 维度 | 2026-05-02 | 2026-05-03（最新） |
|------|-----------|-------------------|
| window.* 全局数量 | 40+ | **0** |
| main.ts 行数 | 3158 | **36** |
| 循环依赖 | 无 | **无** |
| 单测通过率 | — | **724/724 (100%)** |
| 最大单文件 | main.ts 3158 行 | annotation.ts **1447 行** |
| 高风险项 | 2 | **1**（annotation.ts，持续改善） |

---

## 下一步选项

### 选项 A：annotation.ts 继续拆分（递减收益）

剩余可提取块：
- `renderAnnotationList`（~174 行，需大量 callback）
- `popover.ts`（~100 行，依赖 renderAnnotationList）
- `crud.ts`（~150 行，高风险）
- Composer/Selection pipeline（~170 行，高风险）

风险：callback 注入越来越多，可读性边际递减。收益：annotation.ts 可降至 ~600 行左右。

### 选项 B：css.ts 迁移（高收益，高成本）

将 4320 行 TypeScript 字符串迁移为真实 CSS 文件，解锁 CSS tooling，彻底改善样式开发体验。需要专项计划，改动面最广。

### 选项 C：功能开发

架构已足够健康，切换到新功能开发。
