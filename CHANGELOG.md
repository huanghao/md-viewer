# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-04-19

### Added

- **目录面板 (TOC)**: 左侧边栏新增目录面板，支持 Markdown 标题和 PDF 书签，点击跳转，滚动时自动高亮当前章节
- **PDF 翻译**: 段落级翻译，点击段落旁「译」图标触发，译文显示在右侧翻译列表，支持重试和删除
- **翻译双向联动**: 鼠标悬停译文列表条目高亮对应段落图标，点击跳转到原文位置；「译」图标变绿表示已翻译
- **翻译序号**: 译文列表每条显示 `P{页} #{序号}` 标识，按页码顺序编号
- **PDF 滚动条**: PDF 阅读区显示自定义滚动条，与 Markdown 阅读区风格统一
- **PDF 页码指示器**: 固定在右下角显示当前页/总页数，点击可输入页码直接跳转

### Changed

- **PDF 空闲释放**: 超时时间从 10 分钟延长至 30 分钟
- **PDF 跳转行为统一**: 所有 PDF 内跳转（TOC、翻译、批注）统一使用 smooth 动画 + 顶部 100px 留白
- **开发命令**: `just dev` 同时启动前端 watch 和后端 watch，Ctrl+C 一起退出

### Fixed

- TOC 当前项高亮在点击跳转后落到错误条目
- 翻译记录刷新后不显示（改为文件加载时立即从 localStorage 恢复）
- 切换文件时翻译列表未清空
- 翻译跳转位置不准（之前只跳到页顶，现在精确到段落 y 坐标）

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

[Unreleased]: https://github.com/huanghao/md-viewer/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/huanghao/md-viewer/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/huanghao/md-viewer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/huanghao/md-viewer/releases/tag/v0.1.0
