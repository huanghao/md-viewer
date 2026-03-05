# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/huanghao/md-viewer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/huanghao/md-viewer/releases/tag/v0.1.0
