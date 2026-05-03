# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-05-04

### Added

- **Chat / AI 助手**: 右侧边栏新增 Chat 标签页，支持 SSE 流式对话、上下文注入（当前文件内容、划词引用）、Ask AI 按钮从批注 Popover 直接提问、拆分/合并面板、模型选择、会话持久化与恢复
- **Todo 列表**: 新增 Todo 标签页，支持划词创建 Todo、标记完成、按已完成/全部筛选、浮动按钮 + Badge、`mdv todos` CLI 命令（list/tidy）
- **快捷评论（Quick Comments）**: 在偏好设置「评论」标签页配置常用评论模板，划词后一键插入，支持拖拽排序
- **RAG 内容搜索**: 侧边栏新增「搜索」标签页，基于向量嵌入全文检索工作区文件，结果高亮跳转，Cmd/Ctrl+Shift+F 快捷键
- **翻译（段落双语对照）**: 工具栏「译」按钮，滚动时自动翻译可见段落并在原文下方展示，支持 PDF sidecar 双语模式，需本地启动 translate-server
- **键盘快捷键系统**: 重构快捷键为统一注册/分发机制，支持 vim 风格导航（j/k/h/l）、多 action 分发、偏好设置中查看/自定义所有快捷键，`?` 键打开帮助面板
- **快速打开（Quick Open）**: Ctrl+F 打开，支持搜索所有工作区文件（不只已打开的），Ctrl+N/P 上下导航
- **模糊搜索全面升级**: 文件列表、快速打开、工作区侧边栏、最近视图均改用 fzf-lite 多 token 模糊匹配，支持空格分隔多关键词
- **标签页/文件列表拖拽排序**: 支持指针拖拽重排标签页和文件列表
- **焦点视图（最近）全面升级**: Frecency 评分（打开频率 + 时间衰减）+ 停留/滚动信号采集、时间窗口筛选（8h/1d/2d）、文件类型多选过滤、排序策略改为多选（写+读可同时生效）、新文件 ● 标记
- **批注优化**: Composer/Popover 支持拖拽移动、删除回复 thread 条目、3 选项复制菜单（全部/划词/评论）、乐观撤销（删除/解决 4 秒内可取消）、失锚评论「+ 含失锚」开关
- **缩放控件**: 工具栏缩放改为 −/输入框/+ 三件套，支持直接输入百分比，⌘+/⌘− 快捷键，PDF 和文本分别记忆缩放值
- **PDF 模式切换**: 工具栏新增「选择」/「拉框批注」切换按钮，状态持久化
- **Agent 监控面板**: 监控面板新增 Agent Sessions 标签页，显示会话列表、token 用量、缓存命中率；文件列表显示活跃会话 badge
- **内部链接跳转**: Markdown 文件内 `.md` 链接直接在 mdv 内打开，不跳浏览器
- **CLI 打开 PDF**: `mdv` 命令支持直接传入 PDF 路径
- **面包屑绝对路径按钮**: 面包屑新增独立的复制绝对路径按钮
- **失锚评论视觉区分**: 失锚评论用半透明而非颜色区分，视觉上不抢眼

### Changed

- **最近视图默认策略**: 从 frecency 简化为 mtime/open 双选，去掉 frecency 评分依赖
- **TOC 和批注面板状态**: 开关状态改为全局（不再按文件分别记忆）
- **文件列表排序**: 按扩展名分组后再自然排序，Pin 文件排在最前
- **标签页命名**: 调整为「打开」/「工作区」/「最近」/「搜索」
- **构建架构**: 开发和生产均改为标准静态文件（`public/index.html` + `dist/client.js` + `dist/client.css`），CSS 从 TypeScript 字符串迁移为真实 `.css` 文件
- **术语统一**: orphan（孤立）→ unanchored（失锚）

### Fixed

- 划词包含 LaTeX 公式时点击评论按钮无任何反馈，现在显示 warning 提示
- 多 token 搜索高亮位置计算错误
- 关闭文件后出现空白屏
- RAG 高亮跨 block 边界、跳转时序
- 文件监听范围修正（watch 整个工作区根目录）
- KaTeX 节点在文字偏移计算中的处理
- 滚动同步、Popover 回复草稿丢失、多选竞态等多个批注交互问题

## [0.4.0] - 2026-04-19

### Added

- **目录面板 (TOC)**: 左侧边栏新增目录面板，支持 Markdown 标题和 PDF 书签，点击跳转，滚动时自动高亮当前章节
- **PDF 翻译体验升级**: 翻译双向联动（悬停列表条目高亮对应段落），「译」图标变绿表示已翻译，译文列表显示 `P{页} #{序号}` 标识
- **PDF 滚动条 + 页码指示器**: PDF 阅读区显示自定义滚动条，右下角固定显示当前页/总页数，点击可输入页码跳转

### Changed

- **PDF 空闲释放**: 超时时间从 10 分钟延长至 30 分钟
- **PDF 跳转行为统一**: 所有 PDF 内跳转（TOC、翻译、批注）统一使用 smooth 动画 + 顶部 100px 留白
- **开发命令**: `just dev` 同时启动前端 watch 和后端 watch，Ctrl+C 一起退出

### Fixed

- TOC 当前项高亮在点击跳转后落到错误条目
- 翻译记录刷新后不显示（改为文件加载时立即从 localStorage 恢复）
- 切换文件时翻译列表未清空
- 翻译跳转位置不准（之前只跳到页顶，现在精确到段落 y 坐标）

## [0.3.0] - 2026-04-07

### Added

- **PDF 阅读**: PDF.js 渲染、文字层、懒加载（IntersectionObserver）、滚动位置持久化
- **PDF 批注**: 文字选中创建批注，精确高亮，点击批注跳转
- **PDF 翻译**: 段落级翻译，本地 ONNX opus-mt-en-zh 模型（离线可用），延迟约 1.5s
- **目录面板 (TOC)**: Markdown 标题和 PDF 书签提取，左侧边栏展示，点击跳转
- **Diff 视图**: 内联 diff，N/P 键块导航，滚动条标记
- **JSON/JSONL 查看器**: 树形展开，搜索过滤
- **焦点视图**: 按最近修改时间筛选文件，支持 pin 置顶
- **主题系统**: Markdown 主题（GitHub/Notion/Bear）+ 代码高亮主题三选一，实时预览
- **批注 badge**: 文件列表显示未解决批注数量
- **页内查找**: Cmd+F 全文搜索高亮
- **KaTeX 数学渲染**: 行内公式支持

### Changed

- **侧边栏重构**: 三 tab 设计（列表/树/焦点），统一文件行样式
- **批注性能**: TextNodeIndex 将 applyAnnotations 从 O(N×M) 优化到 O(M+N·logM)
- **CSS 设计 token**: 统一次要文字色、字号、圆角、z-index 为命名变量

### Fixed

- PDF 已解决批注仍高亮
- diff 导航使用视口位置而非点击索引
- 工作区文件修改实时显示 M 标记

## [0.2.0] - 2026-03-19

### Added

- **单实例保护**: 防止重复启动服务器
- **Tabs 命令**: `mdv tabs` 查看当前打开的标签页
- **线程回复**: 批注支持多级回复和批量回复
- **工作区树状态持久化**: 记住文件树展开状态

### Changed

- **前端状态管理**: 状态只保存在客户端，服务端按需请求
- **事件驱动同步**: 改用事件驱动的状态同步机制
- **窗口默认尺寸**: 增大窗口默认尺寸，移除状态栏
- **批注来源**: 批注改为服务端来源，支持增量加载

### Fixed

- 服务器端跟踪打开的文件
- 工作区搜索与树缓存解耦
- 批注与渲染文件正确绑定
- 回复输入框始终可见

## [0.1.0] - 2026-03-05

### Added

- **Homebrew 分发**: 通过 Homebrew 一键安装
- **统一 CLI**: 合并所有命令到 `mdv`
- **服务管理**: 前台/后台模式启动 Server
- **运维统计**: `mdv stats` 查看服务器状态、同步记录、日志大小
- **评论功能**: `mdv comments list/get/stats` 管理批注
- **配置管理**: `mdv config get/set` 管理配置
- **数据清理**: `mdv cleanup` 清理过期数据
- **日志查看**: `mdv logs --tail N` 查看服务日志
- **单一二进制**: 60MB 无依赖二进制，完全自包含
- **前端资源嵌入**: client.js, CSS, favicon 完全嵌入
- **多平台支持**: macOS (arm64/x64), Linux (x64/arm64)

### Changed

- 重构 CLI 架构，从多个命令合并为统一的 `mdv` 命令
- Server 默认前台运行（符合容器化习惯）
- 批注统计移到 `mdv comments stats`
- 删除 `mdv-admin` 命令，功能合并到 `mdv`

### Technical

- Bun 编译为单一二进制
- 前端资源通过 `embedded-client.ts` 嵌入
- Server 支持被 import 时直接启动
- PID 文件管理（后台模式）
- 日志文件输出到 `~/.config/md-viewer/server.log`

## [0.x] - Before 2026-03-05

Initial development versions (not released via Homebrew).

[Unreleased]: https://github.com/huanghao/md-viewer/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/huanghao/md-viewer/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/huanghao/md-viewer/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/huanghao/md-viewer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/huanghao/md-viewer/releases/tag/v0.1.0
