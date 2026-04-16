# Annotation Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在文件列表每个文件节点右侧显示未解决批注数的红色 badge，帮助用户快速定位有待处理批注的文件。

**Architecture:** 后端新增 `GET /api/annotations/summaries` 端点，返回所有有 open 批注的文件路径及数量。前端在 `AppState` 中增加 `annotationCounts: Map<string, number>`，初始化时拉取一次，批注操作后局部更新，`renderTreeNode` 读取并渲染 badge。

**Tech Stack:** TypeScript, Bun/Hono (backend), vanilla TS (frontend), SQLite via existing `listAnnotatedDocuments()`

---

## File Map

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/handlers.ts` | Modify | 新增 `handleGetAnnotationSummaries` handler |
| `src/server.ts` | Modify | 注册新路由 `GET /api/annotations/summaries` |
| `src/client/types.ts` | Modify | `AppState` 新增 `annotationCounts` 字段 |
| `src/client/state.ts` | Modify | 初始化 `annotationCounts`，新增操作函数 |
| `src/client/api/annotations.ts` | Modify | 新增 `fetchAnnotationSummaries()` |
| `src/client/main.ts` | Modify | 初始化时调用 `fetchAnnotationSummaries` |
| `src/client/ui/sidebar-workspace.ts` | Modify | `renderTreeNode` 插入 badge HTML |
| `src/client/annotation.ts` | Modify | 批注操作后更新 `annotationCounts` 并重渲染侧边栏 |
| `src/client/css.ts` | Modify | 新增 `.annotation-count-badge` 样式 |

---

## Task 1: 后端 API — GET /api/annotations/summaries

**Files:**
- Modify: `src/handlers.ts`
- Modify: `src/server.ts`

- [ ] **Step 1: 在 `src/handlers.ts` 末尾添加 handler**

在 `handleGetAnnotations` 附近（约第 664 行后）添加：

```typescript
// API: 获取所有文档的批注数摘要（仅含 open 批注 > 0 的文档）
export async function handleGetAnnotationSummaries(c: Context) {
  try {
    const docs = listAnnotatedDocuments(1000, 0);
    const summaries: Record<string, number> = {};
    for (const doc of docs) {
      if (doc.anchoredCount > 0) {
        summaries[doc.path] = doc.anchoredCount;
      }
    }
    return c.json({ summaries });
  } catch (error: any) {
    return c.json({ error: error?.message || "获取批注摘要失败" }, 500);
  }
}
```

确认 `listAnnotatedDocuments` 已在 `handlers.ts` 顶部 import（当前未 import，需要添加）。

在 `handlers.ts` 顶部找到 import 块（约第 19 行）：

```typescript
import {
  listAnnotations,
  importLegacyAnnotations,
  clearAllAnnotations,
  // ... 其他已有 import
} from "./annotation-storage.ts";
```

改为（添加 `listAnnotatedDocuments`）：

```typescript
import {
  listAnnotations,
  listAnnotatedDocuments,
  importLegacyAnnotations,
  clearAllAnnotations,
  // ... 其他已有 import
} from "./annotation-storage.ts";
```

- [ ] **Step 2: 在 `src/server.ts` 注册路由**

在 `src/server.ts` 约第 108 行的 annotations 路由块中添加一行：

```typescript
app.get("/api/annotations/summaries", handleGetAnnotationSummaries);
```

同时在该文件顶部 import 中添加 `handleGetAnnotationSummaries`（找到 import handlers 的位置，加入此函数名）。

- [ ] **Step 3: 手动测试 API**

启动服务（如已运行则跳过），然后：

```bash
curl -s "http://localhost:7701/api/annotations/summaries" | head -c 500
```

预期：返回 `{"summaries": {...}}` JSON，有批注的文件路径作为 key，open 数量作为 value。若无批注则返回 `{"summaries": {}}`。

- [ ] **Step 4: Commit**

```bash
git add src/handlers.ts src/server.ts
git commit -m "feat: add GET /api/annotations/summaries endpoint"
```

---

## Task 2: 前端 state — annotationCounts

**Files:**
- Modify: `src/client/types.ts`
- Modify: `src/client/state.ts`

- [ ] **Step 1: 在 `src/client/types.ts` 的 `AppState` 接口添加字段**

找到 `AppState` 接口（约第 47 行），在 `fileTree` 字段后添加：

```typescript
export interface AppState {
  sessionFiles: Map<string, FileInfo>;
  currentFile: string | null;
  searchQuery: string;
  config: AppConfig;
  currentWorkspace: string | null;
  fileTree: Map<string, FileTreeNode>;
  annotationCounts: Map<string, number>;  // path → open 批注数（只含 > 0 的条目）
}
```

- [ ] **Step 2: 在 `src/client/state.ts` 初始化该字段**

找到 `state` 对象定义（约第 12 行），添加 `annotationCounts`：

```typescript
export const state: AppState = {
  sessionFiles: new Map(),
  currentFile: null,
  searchQuery: '',
  config: loadConfig(),
  currentWorkspace: null,
  fileTree: new Map(),
  annotationCounts: new Map(),
};
```

- [ ] **Step 3: 在 `src/client/state.ts` 末尾添加操作函数**

```typescript
export function setAnnotationCounts(counts: Map<string, number>): void {
  state.annotationCounts = counts;
}

export function adjustAnnotationCount(path: string, delta: number): void {
  const current = state.annotationCounts.get(path) ?? 0;
  const next = current + delta;
  if (next <= 0) {
    state.annotationCounts.delete(path);
  } else {
    state.annotationCounts.set(path, next);
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/client/types.ts src/client/state.ts
git commit -m "feat: add annotationCounts to AppState"
```

---

## Task 3: 前端 API — fetchAnnotationSummaries

**Files:**
- Modify: `src/client/api/annotations.ts`

- [ ] **Step 1: 在 `src/client/api/annotations.ts` 末尾添加函数**

```typescript
export async function fetchAnnotationSummaries(): Promise<Map<string, number>> {
  try {
    const response = await fetch('/api/annotations/summaries');
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.summaries) return new Map();
    return new Map(Object.entries(data.summaries).map(([k, v]) => [k, Number(v)]));
  } catch {
    return new Map();
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/client/api/annotations.ts
git commit -m "feat: add fetchAnnotationSummaries API client"
```

---

## Task 4: 初始化时拉取 summaries

**Files:**
- Modify: `src/client/main.ts`

- [ ] **Step 1: 在 `src/client/main.ts` 顶部 import 中添加两个引用**

找到 annotation 相关 import（约第 28 行），在 `import { ... } from './annotation'` 块中或单独添加：

```typescript
import { fetchAnnotationSummaries } from './api/annotations';
import { setAnnotationCounts } from './state';
```

- [ ] **Step 2: 找到初始化入口并添加调用**

在 `main.ts` 中搜索 `restoreState` 或初始化逻辑的位置（应在 DOMContentLoaded 或类似的初始化函数中）。在 `renderSidebar()` 首次调用之前或之后，添加：

```typescript
// 拉取批注摘要（失败静默忽略，不阻塞主流程）
fetchAnnotationSummaries().then((counts) => {
  setAnnotationCounts(counts);
  renderSidebar();
}).catch(() => {/* 静默忽略 */});
```

- [ ] **Step 3: 验证**

在浏览器 DevTools Network 面板中确认页面加载后有一次 `/api/annotations/summaries` 请求，且返回 200。

- [ ] **Step 4: Commit**

```bash
git add src/client/main.ts
git commit -m "feat: fetch annotation summaries on init"
```

---

## Task 5: 渲染 badge

**Files:**
- Modify: `src/client/ui/sidebar-workspace.ts`
- Modify: `src/client/css.ts`

- [ ] **Step 1: 在 `src/client/css.ts` 末尾添加样式**

在文件末尾（或 `.tree-count` 样式附近）添加：

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
  margin-left: auto;
}
```

- [ ] **Step 2: 在 `src/client/ui/sidebar-workspace.ts` 的 `renderTreeNode` 文件分支插入 badge**

找到 `renderTreeNode` 函数中 `node.type === 'file'` 分支的 return 语句（约第 574 行）。

在 `const pinned = isPinned(node.path);` 之前添加：

```typescript
const annotationCount = state.annotationCounts.get(node.path) ?? 0;
const annotationBadge = annotationCount > 0
  ? `<span class="annotation-count-badge">${annotationCount}</span>`
  : '';
```

然后在返回的 HTML 中，将 badge 插入到 `tree-name` span 之后、pin 按钮之前：

```typescript
return `
  <div class="tree-node">
    <div class="${classes}"
         onclick="handleFileClick('${escapeAttr(node.path)}')">
      <span class="tree-indent" style="width: ${indentPx}px"></span>
      <span class="tree-toggle"></span>
      <span class="file-type-icon ${typeIcon.cls}">${escapeHtml(typeIcon.label)}</span>
      <span class="tree-status-inline">${statusBadge}</span>
      <span class="tree-name" title="${escapeAttr(node.name)}">${renderFileNameWithTailPriority(node.name)}</span>
      ${annotationBadge}
      ${pinBtn}
    </div>
  </div>
`;
```

- [ ] **Step 3: 验证渲染**

在浏览器中打开有批注的文件所在工作区，确认文件列表中对应文件右侧出现红色数字 badge。无批注的文件不显示 badge。

- [ ] **Step 4: Commit**

```bash
git add src/client/ui/sidebar-workspace.ts src/client/css.ts
git commit -m "feat: render annotation count badge in file tree"
```

---

## Task 6: 批注操作后更新 badge

**Files:**
- Modify: `src/client/annotation.ts`

- [ ] **Step 1: 在 `src/client/annotation.ts` 顶部 import 中添加引用**

找到 import 块，添加：

```typescript
import { adjustAnnotationCount } from '../state';
import { renderSidebar } from './ui/sidebar';
```

（注意：`renderSidebar` 可能已经通过动态 import 引入，需检查文件中是否已有 `import('./ui/sidebar')` 的用法。若已有动态 import，则改用静态 import 或复用动态 import 方式。）

实际检查：搜索 `renderSidebar` 在 `annotation.ts` 中的用法，若没有则添加静态 import；若已有动态 import，则在需要调用的地方也用动态 import。

- [ ] **Step 2: 新增批注时更新计数**

找到 `createAnnotation` 函数（约第 940 行附近），在 `persistAnnotation(filePath, ann, ...)` 调用之后添加：

```typescript
adjustAnnotationCount(filePath, +1);
// 动态 import 避免循环依赖（与文件内现有模式保持一致）
import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
```

若文件内已有 `import { renderSidebar } from './ui/sidebar'` 的静态 import，则直接调用 `renderSidebar()`。

- [ ] **Step 3: 解决/取消解决批注时更新计数**

找到 `toggleResolved` 函数（约第 1056 行）。在 `void updateAnnotationStatusRemote(...)` 调用之前，根据状态变化更新计数：

```typescript
// 切换前：ann.status 已更新为 nextStatus
if (nextStatus === 'resolved') {
  // open → resolved：open 数 -1
  adjustAnnotationCount(filePath, -1);
} else if (previousStatus === 'resolved') {
  // resolved → open：open 数 +1
  adjustAnnotationCount(filePath, +1);
}
import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
```

在 `.catch` 的回滚逻辑中，需要反向恢复计数：

```typescript
void updateAnnotationStatusRemote(filePath, { id }, nextStatus).catch((error) => {
  ann.status = previousStatus;
  // 回滚计数
  if (nextStatus === 'resolved') {
    adjustAnnotationCount(filePath, +1);
  } else if (previousStatus === 'resolved') {
    adjustAnnotationCount(filePath, -1);
  }
  showError(`更新评论状态失败: ${error?.message || '未知错误'}`, 2600);
  applyAnnotations();
  renderAnnotationList(filePath);
  import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
});
```

- [ ] **Step 4: 删除批注时更新计数**

找到 `removeAnnotation` 函数（约第 978 行）。在 `void deleteAnnotationRemote(...)` 调用之前，检查被删批注是否为 open 状态并更新计数：

```typescript
// 找到被删除的批注（从 previous 中查，因为 state.annotations 已过滤掉它）
const removed = previous.find((a) => a.id === id);
if (removed && removed.status !== 'resolved') {
  adjustAnnotationCount(filePath, -1);
  import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
}
void deleteAnnotationRemote(filePath, { id }).catch((error) => {
  state.annotations = previous;
  // 回滚计数
  if (removed && removed.status !== 'resolved') {
    adjustAnnotationCount(filePath, +1);
    import('./ui/sidebar').then(({ renderSidebar }) => renderSidebar());
  }
  showError(`删除评论失败: ${error?.message || '未知错误'}`, 2600);
  applyAnnotations();
  renderAnnotationList(filePath);
});
```

- [ ] **Step 5: 验证实时更新**

1. 打开一个文件，添加批注 → 文件列表该文件出现 badge（数字 1）
2. 再添加一条批注 → badge 变为 2
3. 解决一条批注 → badge 变为 1
4. 删除另一条批注 → badge 消失

- [ ] **Step 6: Commit**

```bash
git add src/client/annotation.ts
git commit -m "feat: update annotation count badge on create/resolve/delete"
```
