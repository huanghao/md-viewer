# 架构风险分析 2026-05-03（持续更新）

> 起点：2026-05-02。本文档随重构进展持续更新。最后更新：2026-05-03 深夜。

---

## 已解决

### ✅ window.* 全局通信总线（原高风险）

原来 40+ 个 `window.xxx` 全局函数，HTML 模板里 `onclick="window.xxx()"` 字符串调用。

**现状**：`(window as any)` 强制转换 **0 条**残留（排除合法 CDN 库和 Swift 入口）。替换方案：`data-action` 事件委托、`CustomEvent`、`initXxx(deps)` 依赖注入。

### ✅ main.ts 3000 行神文件（原高风险）

**现状**：main.ts 从 3158 行降到 **41 行**（-99%），拆出 13 个职责单一模块。无模块 import main.ts（循环依赖 0）。

### ✅ css.ts 4320 行 TS 字符串（原中风险）

**现状**：
- `styles.css`（4345 行）、`vendor-github-markdown.css`（1125 行）、`vendor-highlight-github.css`（118 行）— 真实 CSS 文件，支持全套 IDE tooling
- `css.ts`（3 行）、`vendor-css.ts`（4 行）— 仅保留作生产路径 shim
- esbuild 统一打包输出 `dist/client.css`

### ✅ HTML/CSS/JS 全部内联在动态生成 HTML 里（原中风险）

**现状**：架构已完全标准化：

**开发模式**：
- `public/index.html` — 真正的 HTML 文件，直接编辑
- `dist/client.js` + `dist/client.css` — esbuild 构建产物，`<script src>` + `<link>` 引入
- 改 CSS/TS → esbuild watch 自动重新构建，刷新浏览器生效

**生产模式（打包）**：
- `build-server-for-xcode.sh` 把 `public/index.html`、`dist/client.js`、`dist/client.css` 复制到 `dist-server/server/static/`
- `static.ts` 在生产模式下从 `static/` 目录 serve 文件
- `generateClientHTML()` 和 `embedded-client.ts` 仍存在但**不再被调用**

验证方法：`cd dist-server/server && NODE_ENV=production PORT=53099 bun run src/server.ts`，响应 HTML 中出现 `<link href="/client.css">` 而非 `Version: 时间戳`。

---

## 当前中高风险

### 1. `annotation.ts` 1471 行（持续改善，暂维持）

已拆出 8 个子模块（annotation-state / layout / rendering + annotation/ 子目录 4 个），总计 2521 行分布在 9 个文件。内部质量改善：`afterAnnotationWrite` 消除重复、`renderAnnotationList` 事件委托。

剩余 Popover/Composer/CRUD 高度互相依赖，继续拆收益递减，暂维持。

---

## 当前中风险

### 2. `html.ts`（398 行）+ `embedded-client.ts`（897 行）— 生产遗留

这两个文件现在在正常路径下不再被调用（生产模式已走静态文件），但仍保留作 fallback。

**下一步**：可以安全删除，前提是确认 Swift App 打包验证无误（`just install` 跑通）。

### 3. `handlers.ts` 1024 行（服务端）

多个 API handler 混在一个文件，不影响前端，暂可接受。

### 4. 2 个单元测试失败

- `client annotation api > fetchAnnotationSummaries`
- `handlers — annotation APIs > supports annotation upsert...`

与架构无关，是近期功能改动引入。需要单独修复。

---

## 当前低风险

### 5. `pdf-viewer.ts` 1024 行

职责单一，可接受。

### 6. `ui/sidebar-workspace.ts` 866 行 + `ui/sidebar.ts` 855 行

已完成 data-action 重构，逻辑清晰，暂不优先。

### 7. RAG 重型依赖无降级路径

`@huggingface/transformers`、`onnxruntime-node` 安装可能失败，无优雅降级。

---

## 总体健康状态

| 维度 | 2026-05-02（起点） | 现在 |
|------|------------------|------|
| window.* 全局 | 40+ | **0** |
| main.ts | 3158 行 | **41 行** |
| 循环依赖 | — | **0** |
| CSS 架构 | 4320 行 TS 字符串 | **真实 .css 文件** |
| HTML 架构 | TS 动态生成、全内联 | **标准静态文件（开发+生产）** |
| 单测 | — | **728/730（2 个失败待修）** |
| 最大单文件 | main.ts 3158 行 | annotation.ts **1471 行** |
| 高风险项 | 2 | **0** |

---

## 下一步

### 立即可做
1. **修复 2 个失败测试**（annotation API 相关）

### 确认打包后可做
2. **删除 `html.ts`、`embedded-client.ts`、`css.ts`、`vendor-css.ts`**
   - 先跑 `just install` 确认 Swift App 打包正常
   - 然后删除这 4 个文件，`server.ts` 里移除 `generateClientHTML` fallback

### 可选
3. **功能开发** — 架构已足够健康
4. **`handlers.ts` 拆分** — 1024 行服务端文件，不紧急
