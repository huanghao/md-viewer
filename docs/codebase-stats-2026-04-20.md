# Codebase Stats — 2026-04-20

## 源代码（排除打包产物）

| 分类 | 行数 | 说明 |
|------|------|------|
| 服务端 | 3,666 | `src/*.ts`，11 个文件 |
| 客户端业务逻辑 | 12,043 | 排除 css.ts / vendor-css.ts / embedded-client.ts |
| 客户端样式定义 | 5,103 | css.ts + vendor-css.ts（内联 CSS） |
| 客户端合计 | 17,146 | |
| **源码总计** | **20,812** | |

## 测试

| 分类 | 行数 | 文件数 |
|------|------|--------|
| 单元测试 | 4,488 | 44 个 |
| E2E 测试 | 1,014 | 16 个 spec + 辅助文件 |
| **测试总计** | **5,502** | **60 个** |

测试 / 业务代码比 ≈ **1 : 2.9**（5,502 / 15,709，服务端 + 客户端业务）

## 文档

| 分类 | 行数 | 说明 |
|------|------|------|
| 根目录 md | 1,764 | README、CHANGELOG、BUILD 等 |
| docs/ 设计文档 | 26,357 | 架构设计、原型记录 |
| E2E case README | 264 | 测试场景说明 |
| **项目文档合计** | **28,385** | |
| docs/superpowers/ | 7,855 | AI 生成的计划文档，不计入项目文档 |

## 构建 / 配置 / Infra

| 分类 | 行数 |
|------|------|
| build.ts + scripts/ | 646 |
| justfile | 44 |
| playwright configs | 85 |
| package.json / tsconfig / bunfig | 54 |
| **合计** | **829** |

## 值得关注的数字

- **最大单文件**：`main.ts` 2,826 行，占客户端业务代码的 23%，是明显的 God File
- **设计文档 26k 行 vs 服务端代码 3.7k 行**：文档比服务端代码多 7 倍
- **客户端样式 5,103 行**：占客户端代码的 30%，全部内联在 TS 文件里（css.ts）
- **annotation.ts 2,012 行**：批注系统是第二大模块，和整个服务端代码量相当
- **cli.ts 1,148 行 > handlers.ts 921 行**：CLI 逻辑比 HTTP handler 还重

## 最大的 10 个源码文件

| 文件 | 行数 |
|------|------|
| src/client/main.ts | 2,826 |
| src/client/annotation.ts | 2,012 |
| src/cli.ts | 1,148 |
| src/client/pdf-viewer.ts | 1,037 |
| src/handlers.ts | 921 |
| src/client/ui/sidebar-workspace.ts | 901 |
| src/annotation-storage.ts | 659 |
| src/client/ui/sidebar.ts | 546 |
| src/client/workspace.ts | 361 |
| src/client/state.ts | 332 |
