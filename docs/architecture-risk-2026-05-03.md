# 架构风险分析 2026-05-03（持续更新）

> 上次分析：2026-05-02。本文档随重构进展持续更新。最后更新：2026-05-03 晚。

---

## 已解决

### ✅ window.* 全局通信总线（原高风险）

原来 main.ts 末尾暴露 40+ 个全局函数，HTML 模板里 `onclick="window.xxx()"` 字符串调用。

**现状**：`(window as any)` 强制转换已全部清除（过滤掉合法的 CDN 库引用和 Swift 入口后，**0 条**残留）。替换方案：
- HTML 模板改用 `data-action` + 事件委托
- 跨模块通信改用 `document.dispatchEvent(new CustomEvent(...))`
- 内部回调改用 `initXxx(deps)` 依赖注入

### ✅ main.ts 3000 行神文件（原高风险）

**现状**：main.ts 从 3158 行降到 **41 行**（-99%）。拆分出的模块：

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

提取 `pdf-registry.ts`、`app-actions.ts` 后，init.ts 不再 import main.ts。**0 个模块**依赖 main.ts。

### ✅ css.ts 是 4320 行的 TypeScript 字符串文件（原中风险）

**现状**：CSS 已迁移为真正的 `.css` 文件，开发体验正常：
- `src/client/styles.css`（4345 行）— 真实 CSS，支持 IDE 变量提示、linter、格式化
- `src/client/vendor-github-markdown.css`（1125 行）— vendor CSS
- `src/client/vendor-highlight-github.css`（118 行）— vendor CSS
- `css.ts`、`vendor-css.ts` 降为 3-4 行 shim（生产/Swift 路径保留）

esbuild 将所有 CSS 打包输出为 `dist/client.css`，与 `dist/client.js` 对称。

### ✅ CSS/JS 全部内联在动态生成 HTML 里（原中风险）

**现状**：开发模式已改为标准静态文件架构：
- `public/index.html`（343 行）— 真正的 HTML 文件，`<link>` + `<script src>` 引入
- 服务端 serve `dist/client.js` 和 `dist/client.css` 两个静态文件
- `html.ts` 仍保留用于生产/Swift App 内联模式（见下方 TODO）

---

## 当前中高风险

### 1. `annotation.ts` 仍有 1471 行

已完成多次提取，annotation 模块总计 9 个文件 2521 行：

| 文件 | 行数 | 状态 |
|------|------|------|
| `annotation.ts` | 1471 | 主文件：Popover、Composer、CRUD、List 渲染、Init |
| `annotation-state.ts` | 193 | ✅ 类型、state 对象、thread normalization |
| `annotation-layout.ts` | 153 | ✅ sidebar DOM、宽度/折叠 |
| `annotation-rendering.ts` | 251 | ✅ applyAnnotations、mark DOM |
| `annotation/icons.ts` | 12 | ✅ iconSvg 纯函数 |
| `annotation/thread-manager.ts` | 203 | ✅ appendReply、editThreadItem |
| `annotation/persistence.ts` | 100 | ✅ persistAnnotation、hydrateAnnotationsFromRemote |
| `annotation/chat-split.ts` | 138 | ✅ enterSplitMode、exitSplitMode |

**内部质量改善**：
- `afterAnnotationWrite` / `afterAnnotationWritePdf`：消除 7 处重复收尾代码
- `renderAnnotationList` 事件委托：从每次重绑定改为 initAnnotationElements 里注册一次

**结论**：剩余 1471 行（Popover/Composer/CRUD 高度互相依赖），继续拆文件收益递减，暂维持现状。

---

## 当前中风险

### 2. `html.ts` 398 行（生产路径遗留）

开发模式已绕过 `html.ts`（直接 serve `public/index.html`），但生产/Swift App 打包仍走动态生成 HTML 的老路。`html.ts` 内联 CSS（`fs.readFileSync`）和 JS（`embedded-client.ts`）的方式本质上没有改变。

**建议**：见 TODO.md — Swift App 改用 Bundle Resources + loadFileURL，届时可删掉 `html.ts`、`embedded-client.ts`、`css.ts`、`vendor-css.ts`。

### 3. `embedded-client.ts` 是 2136 行的压缩 JS 字符串（自动生成）

构建流程分两阶段，压缩后不可读，代码审查不可见。是生产/Swift 路径必要产物，等 Swift 集成改造完成后可删。

### 4. `handlers.ts` 1022 行（服务端）

后端路由处理器，多个 API handler 混在一个文件。不影响前端，暂可接受。

---

## 当前低风险

### 5. 依赖注入模式（initXxx）已系统化

全代码库 26 个 `initXxx` 函数，使用规则已在 AGENTS.md 记录。

### 6. `pdf-viewer.ts` 1024 行

职责相对单一（只管 PDF 渲染），可接受。

### 7. `ui/sidebar-workspace.ts` 866 行 + `ui/sidebar.ts` 855 行

已完成 data-action 事件委托重构，逻辑清晰，暂不优先。

### 8. RAG 重型依赖无降级路径

`@huggingface/transformers`、`onnxruntime-node` 在某些环境下安装可能失败，无优雅降级机制。

---

## 总体健康状态

| 维度 | 2026-05-02（起点） | 2026-05-03（最新） |
|------|------------------|-------------------|
| window.* 全局数量 | 40+ | **0** |
| main.ts 行数 | 3158 | **41** |
| 循环依赖 | 无 | **无** |
| css.ts | 4320 行 TS 字符串 | **3 行 shim + 真实 .css 文件** |
| HTML 架构 | 动态生成、全内联 | **开发：标准静态文件** |
| 单测通过率 | — | **724/724 (100%)** |
| 最大单文件 | main.ts 3158 行 | annotation.ts **1471 行** |
| 高风险项 | 2 | **0** |

---

## 下一步选项

### 待处理（有明确路径）

1. **Swift App 静态文件集成**（见 TODO.md）
   - 把 `dist/` 放入 Bundle Resources
   - Swift WebView 改用 loadFileURL
   - 完成后删除 `html.ts`、`embedded-client.ts`、`css.ts`、`vendor-css.ts`

### 可选改善

2. **annotation.ts 继续拆分**（收益递减）
   - 剩余 Popover/Composer/CRUD 耦合度高，不建议继续，除非有具体测试需求

3. **功能开发**
   - 架构健康度已显著提升，适合切换到产品功能
