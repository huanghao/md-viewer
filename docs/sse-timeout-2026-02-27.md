# SSE 连接超时问题

日期: 2026-02-27

## 现象

控制台出现警告：
```
[Bun.serve]: request timed out after 10 seconds. Pass `idleTimeout` to configure.
```

浏览器 SSE 连接每隔 10 秒断开，前端 5 秒后自动重连。

## 原因

Bun.serve 默认 `idleTimeout: 10`，SSE 长连接 10 秒无数据传输即被断开。

```
┌─────────┐          ┌────────┐          ┌─────────┐
│   CLI   │ ───────> │ Server │ ───────> │ Browser │
│(打开文件)│  HTTP    │        │   SSE    │(自动刷新)│
└─────────┘          └────────┘          └─────────┘
                          ↑
                    idleTimeout: 10s
                    SSE 连接每 10s 断开
```

## 我们的选择

设置 `idleTimeout: 0`，SSE 连接永不超时。

```typescript
// src/server.ts
export default {
  port: PORT,
  fetch: app.fetch,
  idleTimeout: 0, // SSE 长连接永不超时
};
```

适用场景：本地工具、单用户、需要实时推送、连接数少。

## 其他方案对比

| 方案 | 做法 | 适用场景 |
|------|------|----------|
| 永不超时 | `idleTimeout: 0` | 本地工具、低连接数 |
| 服务端心跳 | 每 30s 发 `:ping` | 需要检测死连接 |
| 前端心跳 | 定期 HTTP ping | 简单但不够优雅 |

对于 md-viewer，方案 1 最简洁可靠。
