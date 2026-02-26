# MD Viewer - Markdown Viewer

一个简单的 Markdown 阅读工具，通过 HTTP 接口提供文件浏览功能。

## 架构设计

```
┌─────────────────────────────────────┐
│        MD Viewer Server             │
│  ┌─────────────┐  ┌─────────────┐  │
│  │ HTTP Server │  │ File Reader │  │
│  └──────┬──────┘  └─────────────┘  │
│         │                           │
│         └─────────────────────┐     │
│                               ▼     │
│                    ┌─────────────────┐
│                    │   /api/file     │
│                    │   /api/files    │
│                    └─────────────────┘
└─────────────────────────────────────┘
              │
              ▼
         ┌─────────┐
         │ Browser │
         │ (Client)│
         └─────────┘
```

## 特性

- **简单轻量**: 纯 HTTP 接口，无需 WebSocket
- **多文件支持**: 左侧边栏管理文件，标签页切换
- **手动刷新**: 点击刷新按钮获取最新内容
- **文件元信息**: 显示文件最后修改时间

## 安装

### 前提条件

- 安装 [Bun](https://bun.sh): `curl -fsSL https://bun.sh/install | bash`

### 方式一：本地开发（推荐）

```bash
# 克隆仓库
git clone <repository-url>
cd md-viewer

# 安装依赖
bun install
```

### 方式二：安装到系统 PATH

```bash
# 运行安装脚本
./scripts/install.sh

# 现在可以在任何地方使用 md-viewer-cli 命令
md-viewer-cli --help
```

---

## 使用

### 启动服务端

```bash
# 开发模式（自动重载）
bun run dev

# 生产模式
bun run src/server.ts

# 指定端口
PORT=3001 bun run src/server.ts
```

然后在浏览器打开 `http://localhost:3000/`

### 使用 CLI 客户端打开文件

```bash
# 在项目目录内
bun run cli README.md

# 如果已安装到 PATH，可在任意目录使用
md-viewer-cli ~/Documents/notes.md
md-viewer-cli -p 3001 ./docs/guide.md
```

## HTTP API

### 获取文件内容

```
GET /api/file?path=/path/to/file.md
```

响应:
```json
{
  "content": "# Markdown content...",
  "path": "/path/to/file.md",
  "filename": "file.md",
  "lastModified": 1704067200000
}
```

### 获取目录下的 Markdown 文件列表

```
GET /api/files?dir=/path/to/dir
```

响应:
```json
{
  "files": [
    { "path": "/path/to/file1.md", "name": "file1.md" },
    { "path": "/path/to/file2.md", "name": "file2.md" }
  ]
}
```

## 文件结构

```
md-viewer/
├── src/
│   ├── server.ts    # 服务器实现（含前端代码）
│   └── cli.ts       # 命令行客户端
├── package.json
└── README.md
```

## CLI 客户端

安装命令行工具:

```bash
# 使用 bun 运行
bun run src/cli.ts <文件路径>

# 或使用 npm link 后全局使用
npm link
md-viewer-cli README.md
```

用法:

```bash
# 基本用法
md-viewer-cli README.md

# 指定端口
md-viewer-cli -p 3001 notes.md

# 显示帮助
md-viewer-cli --help
```
