# MD Viewer - Markdown Viewer

一个简单的 Markdown 阅读工具，通过 HTTP 接口提供文件浏览功能。

## Key Features

- 本地文件阅读：支持 Markdown/HTML 打开与预览，CLI 一键唤起浏览器页面。
- Server + CLI 一体：`mdv server start|stop|status` 管理服务，`mdv <FILE>` 直接打开文件。
- 实时变更感知：文件更新后显示刷新状态，可一键同步到最新磁盘内容。
- 工作区模式：支持多工作区、目录树浏览、路径补全与快速定位文件。
- 标签页与会话恢复：保留已打开文件列表与当前上下文，减少重复打开成本。
- 学城同步：支持选择/输入父文档位置，按版本连续同步（`-v2/-v3...`）。
- 同步状态服务端持久化：同步记录、历史、最近位置、偏好设置统一保存到 SQLite。
- 评论系统：支持划词评论、状态管理（未解决/已解决/定位失败）与 SQLite 持久化。
- 运维与排障：提供 `mdv stats`、`mdv cleanup`、`mdv logs` 等命令辅助诊断。

## 安装

### Homebrew（推荐）

```bash
# 添加 tap
brew tap huanghao/md-viewer

# 安装
brew install md-viewer
```

或直接安装：

```bash
brew install huanghao/md-viewer/md-viewer
```

### 从源码安装

```bash
# 克隆仓库
git clone https://github.com/huanghao/md-viewer.git
cd md-viewer

# 安装依赖
bun install

# 构建
./scripts/build-all.sh 1.0.0

# 打包
./scripts/package.sh 1.0.0

# 手动安装（复制到 PATH）
sudo cp dist/mdv /usr/local/bin/
sudo cp dist/mdv-iterm2-dispatcher /usr/local/bin/
```

## 快速开始

### 使用

```bash
# 启动服务（前台）
mdv server start

# 启动服务（后台）
mdv server start --daemon

# 打开 Markdown 文件
mdv README.md

# 查看帮助
mdv --help
```

### 开发模式

需要 3 个终端窗口：

```bash
# 终端 1: 启动服务器
bun run dev

# 终端 2: 启动客户端构建监听（开发时需要）
bun run build:client:watch

# 终端 3: 使用 CLI 打开文件
bun run src/cli.ts README.md
# 或在浏览器中访问 http://localhost:3000
```

### 编译与打包

详见 [BUILD.md](BUILD.md)。
