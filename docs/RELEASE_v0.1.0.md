# Release v0.1.0

首个 Homebrew 发布版本。

## 版本信息

- **版本**: 0.1.0
- **日期**: 2026-03-05
- **类型**: 初始发布

## 主要功能

### 统一 CLI

合并所有命令到 `mdv`：

```bash
mdv <FILE>                    # 打开文件
mdv server start              # 启动服务（前台）
mdv server start --daemon     # 启动服务（后台）
mdv server stop/restart/status
mdv logs [--tail N]           # 查看日志
mdv config [get|set]          # 配置管理
mdv stats                     # 运维统计
mdv comments list/get/stats   # 评论管理
mdv cleanup                   # 清理过期数据
```

### 单一二进制

- ✅ 60MB 自包含二进制
- ✅ 无需 Node.js/Bun 运行时
- ✅ 完全嵌入前端资源（client.js + CSS + favicon）
- ✅ 支持 macOS (arm64/x64), Linux (x64/arm64)

### 核心特性

- 本地文件阅读：Markdown/HTML 预览
- 实时变更感知：文件更新提示
- 工作区模式：目录树浏览、路径补全
- 标签页与会话恢复
- 学城同步：版本连续同步
- 评论系统：划词评论、状态管理、SQLite 持久化
- 运维工具：stats/cleanup/logs 命令

## 安装方式

### Homebrew

```bash
brew tap huanghao/md-viewer
brew install md-viewer
```

### 从源码

```bash
git clone https://github.com/huanghao/md-viewer.git
cd md-viewer
./scripts/build-all.sh 0.1.0
sudo cp dist/mdv /usr/local/bin/
```

## 技术实现

### 架构

- **语言**: TypeScript
- **运行时**: Bun (编译为二进制)
- **前端**: Vanilla JS (100KB)
- **数据库**: SQLite (annotations, sync-records)
- **配置**: JSON (~/.config/md-viewer/)

### 构建

- 前端构建: esbuild
- 资源嵌入: 自定义脚本
- 二进制编译: Bun --compile
- 打包: tar.gz (60MB → 22MB)

### 分发

- GitHub Release: 4 个平台的 tarball
- Homebrew Formula: 自动安装和配置
- CI/CD: GitHub Actions 自动构建

## 已知问题

1. **后台模式不稳定**: `mdv server start --daemon` 有问题
   - **临时方案**: 使用前台模式 `mdv server start`
   - **影响**: 不影响主要使用场景（Docker/systemd 等）

2. **PATH 优先级**: 如果通过 bun 全局安装，可能优先级高于 Homebrew
   - **解决**: 卸载 bun 全局安装 `bun pm uninstall -g md-viewer`

## 后续计划

- 修复后台模式进程管理
- 添加更多平台支持
- 性能优化
- 文档完善

## 发布清单

- [x] 构建 0.1.0 版本
- [x] 打包 tarball
- [x] 更新 CHANGELOG.md
- [x] 更新 Formula 版本号
- [x] 本地测试安装
- [ ] 打 tag: `git tag -a v0.1.0 -m "Release v0.1.0"`
- [ ] 推送 tag: `git push origin v0.1.0`
- [ ] 等待 CI 构建
- [ ] 更新 Formula SHA256
- [ ] 推送 Formula 更新
- [ ] 测试 Homebrew 安装

## 文件清单

### 构建产物

```
dist/
├── mdv (60MB)
└── mdv-iterm2-dispatcher (4KB)

packages/
└── mdv-darwin-arm64.tar.gz (22MB)
```

### Formula

```
Formula/
├── md-viewer.rb              # 正式版本
├── md-viewer-local.rb        # 本地测试
└── README.md
```

### 脚本

```
scripts/
├── build-all.sh              # 构建
├── package.sh                # 打包
├── update-formula-sha.sh     # 更新 SHA256
└── embed-client.ts           # 嵌入前端
```

### CI/CD

```
.github/workflows/
└── release.yml               # 自动构建和发布
```

## 致谢

感谢 Claude Sonnet 4.6 协助完成此次发布的所有技术实现。
