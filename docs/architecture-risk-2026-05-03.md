# 架构风险分析 2026-05-03

> 上次分析：2026-05-02。本次为重新调研，反映本周重构后的实际状态。

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
| `init.ts` | 639 | 启动序列 |
| `content-renderer.ts` | 689 | 内容渲染（Markdown/PDF/JSON/HTML） |
| `app-actions.ts` | 194 | onFileLoaded、renderAll、updateToolbarButtons、refreshFile 等应用级操作 |
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

---

## 当前高风险

### 1. `annotation.ts` 是 2183 行的次级神文件

`src/client/annotation.ts` 包含批注渲染、状态管理、Popover UI、选区处理、PDF 桥接……职责混杂，是目前最大的单文件风险。`main.ts` 拆分后它已成为新的最大文件。

**建议**：按职责拆分为 `annotation-state.ts`（纯状态）、`annotation-ui.ts`（Popover/Composer DOM）、`annotation-pdf.ts`（PDF 桥接逻辑）。

---

## 当前中风险

### 3. `css.ts` 是 4315 行的字符串文件

与上次相同，无变化。整个 UI 样式是一个巨大的 TypeScript 字符串 export，无法用 CSS tooling 处理。

**可接受性**：功能正确，只影响开发体验，不影响运行时。

### 4. `embedded-client.ts` 是 2136 行的压缩 JS 字符串（自动生成）

与上次相同，无变化。构建流程分两阶段，压缩后不可读，必须手动同步。

### 5. 依赖注入模式（initXxx）已系统化但形式不统一

全代码库现有 **26 个 initXxx 函数**，是本次重构引入的主要模式。部分模块（如 `content-renderer.ts`、`file-switcher.ts`）使用模块级 `let _dep = null` + init 注入，部分使用直接 import。模式尚未统一文档化，新开发者理解成本较高。

**建议**：写一段 AGENTS.md 注释说明这个模式的使用边界（何时用 init 注入 vs. 直接 import）。

---

## 当前低风险

### 6. `handlers.ts` 1022 行（服务端）

后端路由处理器，多个 API handler 混在一个文件。不影响前端，但如果后端逻辑增长会重蹈 main.ts 的覆辙。

### 7. `pdf-viewer.ts` 1024 行

PDF 渲染逻辑集中，但职责相对单一（只管 PDF 渲染），可接受。

### 8. `ui/sidebar-workspace.ts` 866 行 + `ui/sidebar.ts` 855 行

侧边栏两个核心文件偏大，但已完成 data-action 事件委托重构，逻辑清晰。

### 9. 3 处 `onClickJs` 模板字符串（file-row.ts / sidebar.ts）

`file-row.ts` 还保留了 `opts.onCloseJs` 和 `opts.onClickJs` 两个内联 onclick 注入口，是上次 `data-action` 重构未覆盖到的角落。功能正常，只是代码风格不统一。

### 10. RAG 重型依赖无降级路径

与上次相同，无变化。

---

## 总体健康状态

| 维度 | 2026-05-02 | 2026-05-03 |
|------|-----------|-----------|
| window.* 全局数量 | 40+ | **0** |
| main.ts 行数 | 3158 | **36** |
| 循环依赖 | 无 | **无**（已彻底消除） |
| 单测通过率 | — | **724/724 (100%)** |
| 最大单文件 | main.ts 3158 行 | annotation.ts 2183 行 |
| 高风险项 | 2 | **1**（annotation.ts） |

原两个高风险项均已解决，annotation.ts 是目前唯一的高风险项。
