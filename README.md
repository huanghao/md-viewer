# MDV - Markdown Viewer

一个支持 Server/Client 架构的 Markdown 阅读工具，具有实时文件监听和多文件管理能力。

## 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                         MDV Server                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ HTTP Server │  │ File Watcher│  │  WebSocket Manager  │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                    │             │
│         └────────────────┴────────────────────┘             │
│                          │                                  │
│                   ┌──────┴──────┐                          │
│                   │   状态管理    │                          │
│                   │ - watchList  │  // 全局监听列表          │
│                   │ - clients    │  // 客户端连接            │
│                   │ - fileStates │  // 文件状态              │
│                   └─────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │ WebSocket           │ WebSocket          │ WebSocket
        ▼                     ▼                     ▼
   ┌─────────┐           ┌─────────┐           ┌─────────┐
   │ Client 1│           │ Client 2│           │ Client 3│
   │ (File A)│           │ (File B)│           │(Browse) │
   └─────────┘           └─────────┘           └─────────┘
```

## 特性

- **Server/Client 架构**: Server 长期运行，动态管理文件监听列表
- **多文件支持**: 左侧边栏管理文件，标签页切换
- **动态监听**: Client 发送文件路径，Server 动态添加/移除监听
- **自动更新内容**: 文件变更后自动推送最新内容
- **文件元信息**: 本地文件显示最后修改时间
- **WebSocket 通信**: 实时双向通信，断线自动重连

## 使用

```bash
# 启动 Server
bun run src/server.ts

# 指定端口
PORT=3001 bun run src/server.ts
```

然后在浏览器打开 `http://localhost:3000/`

## WebSocket 协议

### Client -> Server

| 消息类型 | 数据 | 说明 |
|---------|------|------|
| `watch` | `path: string` | 添加文件监听 |
| `unwatch` | `path: string` | 移除文件监听 |
| `close-tab` | `path: string` | 关闭标签页 |

### Server -> Client

| 消息类型 | 数据 | 说明 |
|---------|------|------|
| `file-loaded` | `{path, filename, content, lastModified}` | 文件内容加载完成 |
| `file-updated` | `{path, filename, content, lastModified}` | 文件内容更新推送 |
| `file-list` | `{files: []}` | 文件列表 |

## 文件结构

```
mdv/
├── src/
│   └── server.ts    # 完整的 Server 实现（含前端代码）
├── package.json
└── README.md
```
