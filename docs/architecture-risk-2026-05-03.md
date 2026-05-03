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

## 当前中高风险（已显著改善）

### 1. `annotation.ts` 1469 行（从 2183 行降低 33%，内部质量也改善）

**annotation 模块分布**（总计 2519 行，9 个文件）：

| 文件 | 行数 | 状态 |
|------|------|------|
| `annotation.ts` | 1469 | 主文件：Popover、Composer、CRUD、List 渲染、Init |
| `annotation-state.ts` | 193 | ✅ 类型、state 对象、thread normalization |
| `annotation-layout.ts` | 153 | ✅ sidebar DOM、宽度/折叠 |
| `annotation-rendering.ts` | 251 | ✅ applyAnnotations、mark DOM |
| `annotation/icons.ts` | 12 | ✅ iconSvg 纯函数 |
| `annotation/thread-manager.ts` | 203 | ✅ appendReply、editThreadItem、deleteThreadItem |
| `annotation/persistence.ts` | 100 | ✅ persistAnnotation、hydrateAnnotationsFromRemote |
| `annotation/chat-split.ts` | 138 | ✅ enterSplitMode、exitSplitMode |

**内部质量改善（非拆文件）**：
- `afterAnnotationWrite` / `afterAnnotationWritePdf`：消除 7 处重复收尾代码
- `renderAnnotationList` 事件委托：从每次 render 重绑定 5 个循环，改为 `initAnnotationElements` 里注册一次的 3 个委托（click/keydown/input）

**剩余 1469 行的评估**：`initAnnotationElements`（~400 行 orchestration）、Popover/Composer/CRUD 三块高度互相依赖，继续拆文件收益递减。维持现状，重点转移。

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
| 最大单文件 | main.ts 3158 行 | annotation.ts **1469 行** |
| 高风险项 | 2 | **0**（annotation.ts 已降至可接受水平） |

---

## 下一步选项

### 选项 A：css.ts 迁移（4320 行字符串 → 真实 CSS）

**收益**：解锁 CSS tooling（变量提示、linter、dead-code 检测），彻底改善样式开发体验。
**成本**：改动面最广，影响所有 UI，需要专项计划评估 esbuild 集成方式。
**建议**：先做一个小模块的 POC，验证构建流程可行后再全量迁移。

### 选项 B：annotation.ts 继续拆分（收益递减）

剩余的 Popover/Composer/CRUD 三块高度互相依赖，继续拆需要大量 callback 注入，可读性不一定提升。除非有明确的测试需求（单元测试覆盖这些逻辑），否则不建议继续。

### 选项 C：功能开发

架构健康度已显著提升，切换到产品功能开发。
