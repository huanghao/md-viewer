# MDV - Markdown Viewer

一个简单的 Markdown 阅读工具，通过 HTTP 接口提供文件浏览功能。

## 架构设计

```
┌─────────────────────────────────────┐
│           MDV Server                │
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

## 使用

```bash
# 启动 Server
bun run src/server.ts

# 指定端口
PORT=3001 bun run src/server.ts
```

然后在浏览器打开 `http://localhost:3000/`

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
mdv/
├── src/
│   └── server.ts    # 服务器实现（含前端代码）
├── package.json
└── README.md
```
