# 文件列表批注数 Badge 设计文档

**日期：** 2026-04-16  
**状态：** 已确认

## 功能概述

在文件列表（侧边栏 workspace 树）的每个文件节点右侧，显示该文件未解决批注（open annotations，即 `status = 'anchored'`）的数量 badge。帮助用户在多文档切换时快速定位有待处理批注的文件。

## UI 设计

- **有批注**：文件名右侧显示红色圆角数字 badge，例如 `3`
- **无批注**：不显示任何 badge，保持行布局干净
- **目录节点**：不显示汇总数（只在文件节点上显示）
- **样式**：与现有 `status-badge` 体系一致，新增 `annotation-count-badge` class

## 数据架构

### 后端：新增 API 端点

```
GET /api/annotations/summaries
```

**响应：**
```json
{
  "summaries": {
    "/abs/path/to/file.md": 3,
    "/abs/path/to/other.pdf": 1
  }
}
```

只返回 `anchoredCount > 0` 的文件，其余不包含在响应中。

实现：调用已有的 `listAnnotatedDocuments(1000, 0)`，过滤 `anchoredCount > 0`，构建 path → anchoredCount 映射。

### 前端 state

在 `src/client/state.ts` 的 `AppState` 中新增：

```ts
annotationCounts: Map<string, number>  // path → open 批注数，不含 0
```

初始值为空 Map。

### 前端 API

`src/client/api/annotations.ts` 新增：

```ts
export async function fetchAnnotationSummaries(): Promise<Map<string, number>>
```

调用 `/api/annotations/summaries`，返回 `Map<string, number>`。

## 初始化流程

`src/client/main.ts` 初始化时调用 `fetchAnnotationSummaries()`，写入 `state.annotationCounts`，然后触发侧边栏渲染。失败时静默忽略（badge 不显示，不影响主功能）。

## 渲染

`src/client/ui/sidebar-workspace.ts` 的 `renderTreeNode()` 文件节点分支：

```ts
const count = state.annotationCounts.get(node.path) ?? 0;
const badgeHtml = count > 0
  ? `<span class="annotation-count-badge">${count}</span>`
  : '';
```

插入位置：`tree-name` span 之后，pin 按钮之前。

## 实时更新

`src/client/annotation.ts` 中批注操作完成后更新 state：

- **新增批注**（`upsertAnnotationRemote` 成功后）：`state.annotationCounts` 对应 path +1
- **解决批注**（`updateAnnotationStatusRemote` 改为 `resolved` 后）：对应 path -1，减到 0 时删除该 key
- **删除批注**（`deleteAnnotationRemote` 成功后，且被删批注为 open 状态）：对应 path -1

每次更新后调用 `renderSidebar()`（已有函数）。

## 样式

`src/client/css.ts` 新增：

```css
.annotation-count-badge {
  background: #e05252;
  color: white;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.4;
  flex-shrink: 0;
}
```

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/handlers.ts` | 新增 `GET /api/annotations/summaries` 路由 |
| `src/client/state.ts` | `AppState` 新增 `annotationCounts: Map<string, number>` |
| `src/client/api/annotations.ts` | 新增 `fetchAnnotationSummaries()` |
| `src/client/main.ts` | 初始化时拉取 summaries |
| `src/client/ui/sidebar-workspace.ts` | `renderTreeNode` 文件节点插入 badge |
| `src/client/annotation.ts` | 批注操作后更新 `state.annotationCounts` 并重渲染侧边栏 |
| `src/client/css.ts` | 新增 `.annotation-count-badge` 样式 |

## 不在范围内

- 目录节点的批注汇总数
- 批注数的实时 SSE 推送（操作方触自己更新即可）
- PDF 批注与 MD 批注的分类显示
