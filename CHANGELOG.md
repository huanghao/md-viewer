# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/huanghao/md-viewer/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/huanghao/md-viewer/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/huanghao/md-viewer/releases/tag/v0.1.0
