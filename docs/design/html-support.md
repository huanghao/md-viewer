# HTML 支持设计

日期：2026-03-01

## 目标
- 支持 `.html/.htm` 文件与 URL 的直接打开。
- HTML 仅在列表/树中展示，点击时在浏览器新页面打开。
- 不影响现有 `M/D/蓝点` 状态模型。

## 范围
- 路径识别：`md_file | html_file | other_file | directory`。
- 文件扫描：工作区树包含 `.md/.markdown/.html/.htm`。
- 内容渲染：
  - Markdown：继续使用 `marked`。
  - HTML：不在内置阅读区渲染。
- 工具栏：同步按钮仅对 Markdown 显示。

## 核心原理
1. 文件类型分流
- 通过扩展名（本地路径）或 URL 路径后缀识别 HTML。
- `handleSmartAddInput` 对 `md_file/html_file` 直接加入列表。

2. 浏览器新页面打开
- 点击 `.html/.htm` 文件时，前端调用 `POST /api/open-local-file`。
- 服务端执行系统命令 `open <absolute-path>`，由默认浏览器直接打开本地文件。
- 远程 URL 类型的 html 直接 `window.open(url)`。

3. 列表与树一致性
- 工作区扫描与“附近文件”统一到同一可展示文件集合。
- `fileCount` 语义为“md/html 文件数”。

## 交互
- HTML 文件点击行为：新页面打开，不切换中间阅读区。
- 中间阅读区只承担 Markdown 阅读。

## 风险与边界
- 新页面打开可能受浏览器弹窗策略影响（用户点击触发通常可通过）。
- HTML 依赖外部资源时，显示效果受网络与站点策略影响。
- 同步能力仍面向 Markdown，不支持 HTML 一键同步。

## 原型稿
- [html-support-prototype.html](/Users/huanghao/workspace/md-viewer/docs/design/html-support-prototype.html)
