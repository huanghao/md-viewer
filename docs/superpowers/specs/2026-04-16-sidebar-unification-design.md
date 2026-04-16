# 侧边栏三视图统一设计文档

**日期：** 2026-04-16  
**状态：** 已确认

## 背景与问题

侧边栏有三套独立的文件行渲染逻辑，分布在三个文件中：
- `sidebar-workspace.ts`（全量树）— `renderTreeNode` 文件分支
- `workspace-focus.ts`（焦点视图）— `renderFocusFileItem`
- `sidebar.ts`（列表视图）— `renderFiles` 内联

每次加新功能（如批注 badge）都要改三处，且三处实现容易出现偏差。已知 bug：
- 焦点视图缺少 M/D 状态标记
- 蓝点 class 名不一致（`new-dot` vs `focus-file-dot new-file`）
- 列表视图文件名不 strip 扩展名

工作区扫描状态也有两份独立副本（`sidebar-workspace.ts` 的 `loadingWorkspaceIds`/`failedWorkspaceIds` 和 `workspace-focus.ts` 的 `scanningWorkspaceIds`/`failedWorkspaceIds`），互相不同步，导致状态不一致 bug。

## 目标

1. 提取共用文件行渲染函数，三视图统一调用
2. 工作区扫描状态提升到 `AppState`，统一读写
3. 顺手修掉所有已知不一致

## 功能决策

| 功能 | 全量树 | 焦点 | 列表 | 决策 |
|------|-------|------|------|------|
| 文件类型图标 | ✓ | ✓ | ✓ | 统一 |
| 文件名 strip 扩展名 | ✓ | ✓ | ✗ | **同步**：列表也 strip |
| 删除标记 D | ✓ | ✗ | ✓ | **同步**：焦点补上 |
| 修改标记 M | ✓ | ✗ | ✓ | **同步**：焦点补上 |
| 新文件蓝点 | ✓ `new-dot` | ✓ `focus-file-dot` | ✓ `new-dot` | **同步**：统一用 `new-dot` |
| 批注计数 badge | ✓ | ✓ | ✓ | 统一 |
| 相对修改时间 | ✗ | ✓ | ✗ | **焦点独有**，保留 |
| Pin 按钮 | ✓ | ✓ | ✗ | 保持现状 |
| 关闭按钮 × | ✗ | ✗ | ✓ | **列表独有**，保留 |
| 路径补全 | ✓ | ✗ | ✓ | **同步**：焦点补上 |

## 架构

### 新文件：`src/client/ui/file-row.ts`

导出一个共用文件行渲染函数，接受 options 控制视图差异：

```typescript
export interface FileRowOptions {
  /** 外层容器 class，各视图不同 */
  containerClass: string;
  /** 点击文件的 JS 调用（字符串形式，内嵌到 onclick） */
  onClickJs: (path: string) => string;
  /** 是否显示 pin 按钮（全量树/焦点：true；列表：false） */
  showPin: boolean;
  /** 是否显示相对修改时间（焦点：true；其余：false） */
  showTime: boolean;
  /** 左侧缩进宽度 px（全量树按深度计算传入；其余固定 8） */
  indentPx: number;
  /** 搜索关键词，用于文件名高亮（空字符串表示不高亮） */
  query: string;
  /** 是否显示关闭按钮（列表：true；其余：false） */
  showClose: boolean;
  /** 关闭按钮的 JS 调用（仅 showClose=true 时使用） */
  onCloseJs?: (path: string) => string;
}

export function renderFileRow(
  path: string,
  name: string,
  lastModified: number | undefined,
  opts: FileRowOptions,
): string
```

函数内部统一处理：
1. 文件类型图标
2. 文件名（统一 strip 扩展名 + 搜索高亮）
3. 状态 badge（D/M/蓝点，统一用 `new-dot` class，逻辑同全量树）
4. 批注计数 badge
5. 相对修改时间（`showTime: true` 时）
6. Pin 按钮（`showPin: true` 时）
7. 关闭按钮（`showClose: true` 时）
8. `current` class（读 `state.currentFile`）
9. `missing` class（读 `isWorkspacePathMissing` + session isMissing）

状态 badge 计算逻辑（统一，优先级 D > M > 蓝点）：
```
if (sessionFile) → getFileListStatus(sessionFile, listDiff)
else if isMissing → D
else if wsModified → M
else if listDiff → 蓝点
else → 空
```

### AppState 新增字段

`src/client/types.ts` 的 `AppState` 新增：
```typescript
workspaceLoadingIds: Set<string>;  // 正在扫描中
workspaceFailedIds: Set<string>;   // 扫描失败（永久，直到重试）
```

`src/client/state.ts` 新增操作函数：
```typescript
export function markWorkspaceLoading(id: string): void
export function markWorkspaceFailed(id: string): void   // 同时清 loading
export function clearWorkspaceFailed(id: string): void  // 重试时调用
export function isWorkspaceLoading(id: string): boolean
export function isWorkspaceFailed(id: string): boolean
```

### 各视图改动

**`sidebar-workspace.ts`**
- 删除 `loadingWorkspaceIds`、`failedWorkspaceIds` 私有 Set
- 删除 `markWorkspaceFailed()` 导出函数（移到 state.ts）
- `renderTreeNode` 文件分支：改调 `renderFileRow(node.path, node.name, node.lastModified, { showPin: true, showTime: false, showClose: false, indentPx, ... })`
- 所有读 `loadingWorkspaceIds`/`failedWorkspaceIds` 的地方改读 `state`

**`workspace-focus.ts`**
- 删除 `scanningWorkspaceIds`、`failedWorkspaceIds` 私有 Set
- `renderFocusFileItem`：改调 `renderFileRow(file.path, file.name, file.lastModified, { showPin: true, showTime: true, showClose: false, indentPx: 8, ... })`
- 扫描失败时改调 `markWorkspaceFailed()`（来自 state.ts）
- 补上路径补全（`attachPathAutocomplete`）

**`sidebar.ts`**
- `renderFiles` 文件行：改调 `renderFileRow(file.path, file.name, undefined, { showPin: false, showTime: false, showClose: true, indentPx: 0, ... })`

### CSS 清理

`workspace-focus.ts` 删除 `focus-file-dot` class 后，`css.ts` 中对应的 `.focus-file-dot` 样式也可以删除（或保留作为 alias，取决于是否有其他地方使用）。

## 涉及文件

| 文件 | 操作 |
|------|------|
| `src/client/ui/file-row.ts` | **新建** |
| `src/client/types.ts` | 修改：AppState 新增两个 Set 字段 |
| `src/client/state.ts` | 修改：初始化 + 5 个操作函数 |
| `src/client/ui/sidebar-workspace.ts` | 修改：删私有 Set，改调 renderFileRow，改读 state |
| `src/client/ui/workspace-focus.ts` | 修改：删私有 Set，改调 renderFileRow，补路径补全 |
| `src/client/ui/sidebar.ts` | 修改：改调 renderFileRow |
| `src/client/css.ts` | 修改：清理 `.focus-file-dot` 样式 |

## 不在范围内

- `handleFileClick` / `handleFocusFileClick` 合并（两个函数虽然相似，但调用上下文不同，合并需要更多调查，留 TODO）
- 全量树补 `scrollCurrentFileIntoView`（焦点/全量视图的滚动行为需要单独设计）
- 焦点视图补工作区加载失败重试 UI
