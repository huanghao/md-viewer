# 架构风险分析 2026-05-02

## 高风险

### 1. `main.ts` 是 3000 行的神文件

`src/client/main.ts` 包含渲染逻辑、SSE 连接、UI 交互、TOC 更新、diff 视图、find-bar、PDF 管理、键盘绑定初始化……几乎所有东西都在这里。annotation/sidebar/pdf 等模块已经拆出去了，但 `main.ts` 仍然是它们的胶水层和很多逻辑的实际居所。

任何新功能都会继续往这里塞。现在找一个函数的副作用已经需要全文搜索，6 个月后更难。

**建议**：优先把底部的初始化 IIFE 和 `renderContent` 拆出来，这是最容易腐烂的地方。

### 2. `window.*` 作为跨模块通信总线

`main.ts` 末尾暴露了 40+ 个全局函数（`window.switchFile`、`window.removeFile`、`window.renderContent`…），HTML 模板里的 `onclick="window.xxx()"` 字符串是调用方。

TypeScript 类型完全帮不了你：重命名一个函数需要手搜字符串；组件之间的依赖关系在 IDE 里不可见；测试极难。`window.__onTocClose`、`window.__setPendingAnnotation`、`window.__showFindBar` 等 `__` 前缀表明这是已知的临时方案。

**建议**：逐步用 `CustomEvent` 替换，不需要一次性改完。

## 中风险

### 3. `css.ts` 是 4300 行的字符串文件

整个 UI 样式是一个巨大的 TypeScript 字符串 export，无法用 CSS tooling（linter、变量提示、dead-code 检测）处理。改一个颜色需要搜字符串，没有 CSS 变量自动补全，重复规则不易发现。

### 4. `embedded-client.ts` 是 2100 行的压缩 JS 字符串

`scripts/embed-client.ts` 把编译产物嵌进 TypeScript 文件，用于 SwiftUI WebView。存在以下问题：
- `dist/client.js` 和 `embedded-client.ts` 必须手动保持同步
- 压缩后的代码在代码审查里完全不可读
- 构建流程分两阶段（bun build → embed），容易忘记步骤

### 5. RAG 依赖重型包但没有降级路径

`@huggingface/transformers`、`onnxruntime-node` 在某些环境（ARM/Linux）下安装可能失败，拖慢 install 速度。目前没有"如果 RAG 不可用则优雅降级"的明确机制。

## 低风险（值得注意）

- `translate-server/` 是独立 Python 服务，和主项目完全分离，如果长期不用会腐烂
- `agent-server/` 依赖 `@mariozechner/pi-*` 私有包，上游不维护则 blocked
- `Package.swift` + `MDViewer/` 是 SwiftUI 壳，和 JS 主体靠 embed 耦合，Swift 部分升级会影响
