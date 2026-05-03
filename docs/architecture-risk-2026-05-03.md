# 架构风险分析 2026-05-03（持续更新）

> 上次分析：2026-05-02。本文档随重构进展持续更新。

---

## 已解决

### ✅ window.* 全局通信总线（原高风险）

原来 main.ts 末尾暴露 40+ 个全局函数，HTML 模板里 `onclick="window.xxx()"` 字符串调用。

**现状**：`(window as any)` 强制转换已全部清除（过滤掉合法的 CDN 库引用和 Swift 入口后，**0 条**残留）。替换方案：
- HTML 模板改用 `data-action` + 事件委托
- 跨模块通信改用 `document.dispatchEvent(new CustomEvent(...))`
- 内部回调改用 `initXxx(deps)` 依赖注入

### ✅ main.ts 3000 行神文件（原高风险）

**现状**：main.ts 从 3158 行降到 **36 行**（-99%），只剩 re-export + `import './init'`。拆分出的模块：

| 新模块 | 行数 | 职责 |
|--------|------|------|
| `init.ts` | 634 | 启动序列 |
| `content-renderer.ts` | 689 | 内容渲染（Markdown/PDF/JSON/HTML） |
| `app-actions.ts` | 187 | onFileLoaded、renderAll、updateToolbarButtons、refreshFile 等应用级操作 |
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

原因：`init.ts` import `main.ts`，`main.ts` import `'./init'`，esbuild 打包时 `pdfViewerRegistry` 求值为 `undefined`，触发了运行时 crash。

**修复过程**：
1. 提取 `pdf-registry.ts`（pdfViewerRegistry、currentPdfBridgeRef 独立）→ 缓解
2. 提取 `app-actions.ts`（onFileLoaded、renderAll 等应用级函数）→ init.ts 不再需要 import main.ts，循环彻底消除

**现状**：`grep "from './main'" src/client/**/*.ts` 返回空，无任何模块 import main.ts。

---

## 当前高风险

### 1. `annotation.ts` 仍有 1946 行

已完成两次提取：
- `annotation-state.ts`（189 行）：类型定义、state 对象、thread normalization、state 访问器
- `annotation-layout.ts`（152 行）：sidebar DOM 管理、宽度/折叠、syncAnnotationSidebarLayout

**剩余 1946 行**包含渲染（applyAnnotations）、Popover/Thread、Composer/Selection、init 全部耦合在一起，继续拆需要 callback 或 event 解耦，改动较大。

**建议**：可在 annotation-state.ts / annotation-layout.ts 已分离的基础上，下一步提取 `annotation-rendering.ts`（applyAnnotations、renderAnnotationList、mark DOM 操作），约 400 行，依赖最少。

---

## 当前中风险

### 2. `css.ts` 是 4315 行的字符串文件

整个 UI 样式是一个巨大的 TypeScript 字符串 export，无法用 CSS tooling 处理。改一个颜色需要搜字符串，无变量自动补全，重复规则不易发现。

**可接受性**：功能正确，只影响开发体验，不影响运行时。改动面极广，暂不优先。

### 3. `embedded-client.ts` 是 2136 行的压缩 JS 字符串（自动生成）

构建流程分两阶段（bun build → embed-client.ts），压缩后不可读，代码审查不可见，必须手动触发同步。

### 4. 依赖注入模式（initXxx）已系统化但未文档化

全代码库现有 26 个 `initXxx` 函数。何时用 init 注入 vs. 直接 import 无明确规则，新 agent 容易引入新的循环依赖。

**建议**：在 AGENTS.md 补充一条规则：「如果 A 需要 B 的函数，且 B 会被 A 的上层 import，则用 initXxx 注入，不要直接 import」。

---

## 当前低风险

### 5. `handlers.ts` 1022 行（服务端）

后端路由处理器，多个 API handler 混在一个文件。不影响前端，暂可接受。

### 6. `pdf-viewer.ts` 1024 行

PDF 渲染逻辑集中，职责相对单一，可接受。

### 7. `ui/sidebar-workspace.ts` 866 行 + `ui/sidebar.ts` 855 行

偏大但已完成 data-action 事件委托重构，逻辑清晰，暂不优先。

### 8. 3 处 `onClickJs` 模板字符串（file-row.ts）

保留了 `opts.onCloseJs` 和 `opts.onClickJs` 两个内联 onclick 注入口，是 data-action 重构未覆盖的角落。功能正常。

### 9. RAG 重型依赖无降级路径

`@huggingface/transformers`、`onnxruntime-node` 在某些环境下安装可能失败，无优雅降级机制。长期存在，低优先级。

---

## 总体健康状态

| 维度 | 2026-05-02 | 2026-05-03（最新） |
|------|-----------|-------------------|
| window.* 全局数量 | 40+ | **0** |
| main.ts 行数 | 3158 | **36** |
| 循环依赖 | 无 | **无** |
| 单测通过率 | — | **724/724 (100%)** |
| 最大单文件 | main.ts 3158 行 | annotation.ts **1946 行** |
| 高风险项 | 2 | **1**（annotation.ts 继续拆分中） |

---

## 推荐下一步（优先级排序）

1. **annotation-rendering.ts 提取**（高价值，中难度）
   - 从 annotation.ts 提取 `applyAnnotations`、`renderAnnotationList`、`applySingleAnnotation`、mark DOM 操作，约 400 行
   - 纯渲染逻辑，与 Popover/Composer 解耦度较好

2. **AGENTS.md 补充 initXxx 规则**（低成本，防御性）
   - 防止未来 agent 再次引入循环依赖

3. **css.ts 迁移**（高收益但高成本）
   - 改用真实 CSS 文件 + esbuild 内联，解锁 CSS tooling
   - 影响所有 UI，需要专项计划
