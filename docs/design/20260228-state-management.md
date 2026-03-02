# MD Viewer 状态管理设计文档（当前实现）

日期：2026-03-02

## 1. 概述

当前状态管理已按职责拆分为两条主线：

1. `Session State`：会话缓存态（正文、tabs、同步上下文）
2. `Workspace State`：工作区真实态（树、蓝点、删除态）

核心原则：
- `sessionFiles` 不代表“工作区全量文件”
- 工作区删除态不依赖“是否打开过文件”

---

## 2. 客户端状态

### 2.1 Session State（会话缓存）

位置：
- `src/client/state.ts`
- `src/client/types.ts`

关键字段：
```ts
state.sessionFiles: Map<string, FileInfo>
state.currentFile: string | null
```

职责：
- 渲染 tabs
- 渲染当前正文
- 维护同步功能所需上下文
- 保存到 `localStorage`（`md-viewer:openFiles`）

说明：
- 会话恢复时会重新读取磁盘文件内容
- 不把 `sessionFiles` 当作工作区真实文件清单

### 2.2 Workspace State（工作区真实态）

Facade 位置：
- `src/client/workspace-state.ts`

分层模块：
- `src/client/workspace-state-diff.ts`
- `src/client/workspace-state-missing.ts`
- `src/client/workspace-state-persistence.ts`

职责分工：
- `diff`：蓝点与目录扫描差异（新增/消失）
- `missing`：删除态集合（`D + 划线`）
- `persistence`：工作区已知文件快照持久化（`md-viewer:workspaceKnownFiles`）

---

## 3. 服务端状态

### 3.1 文件变更来源

位置：
- `src/file-watcher.ts`
- `src/handlers.ts`

当前策略：
- 打开文件会注册文件级监听
- 扫描工作区会注册目录级监听（md/markdown/html/htm）
- 触发 `file-changed` / `file-deleted` SSE

### 3.2 SSE 连接态

位置：
- `src/sse.ts`

说明：
- 内存 `Set` 保存连接
- 客户端断线自动重连

---

## 4. 关键状态流

### 4.1 未打开文件被删除（关键修复路径）

1. 工作区扫描后，文件 `A` 出现在树中（可未打开）
2. `rm A` 后：
- 目录监听或扫描差异识别“消失路径”
- `workspaceMissingPaths` 标记为 missing
3. UI 立即显示：
- 删除态行（`D + 红色划线`）
4. 点击删除态项：
- 若有缓存，显示缓存并标注删除提示
- 若无缓存，显示“无本地缓存内容”

### 4.2 已打开文件被删除

1. `file-deleted` 到达
2. `sessionFiles[path].isMissing = true`
3. tabs/正文同步进入删除态

---

## 5. 当前清理与风险

已实现：
- `sessionFiles` 与工作区状态解耦
- 工作区删除态独立维护
- LRU/配额保护已在 `state.ts` 中处理

待增强：
1. 将目录监听与轮询策略统一成可配置策略（可选）

已完成补充：
1. `workspace-state-diff` 细粒度单测：`tests/unit/workspace-state-diff.test.ts`
2. 同步状态拆分：`src/client/sync-state.ts`（与 `sessionFiles` 解耦）

---

## 6. 测试覆盖（与状态强相关）

已覆盖 E2E：
- `case-11`：当前文件删除态
- `case-12`：工作区删除态样式
- `case-13`：非当前文件删除流程
- `case-14`：工作区非当前文件删除流程
- `case-15`：工作区未打开文件删除后立即删除态

对应目录：
- `tests/e2e/cases/case-11/` 到 `tests/e2e/cases/case-15/`
