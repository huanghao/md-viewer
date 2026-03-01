# MD Viewer - Markdown Viewer

一个简单的 Markdown 阅读工具，通过 HTTP 接口提供文件浏览功能。

## 快速开始

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
