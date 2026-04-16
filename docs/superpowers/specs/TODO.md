# TODO

## 重构：工作区状态提升到全局 state

**问题：** `failedWorkspaceIds`、`loadingWorkspaceIds` 等工作区扫描状态分散在三个视图文件里（`sidebar-workspace.ts`、`workspace-focus.ts`），每次加新逻辑都要改三处，已经踩坑两次。

**方案：** 将 `failedWorkspaceIds: Set<string>` 和 `loadingWorkspaceIds: Set<string>` 加到 `AppState`（`types.ts` + `state.ts`），三个视图统一从 `state` 读取，扫描逻辑统一写 `state`。

**影响文件：**
- `src/client/types.ts` — AppState 新增两个字段
- `src/client/state.ts` — 初始化，新增操作函数
- `src/client/ui/sidebar-workspace.ts` — 移除模块私有变量，改读 state
- `src/client/ui/workspace-focus.ts` — 移除模块私有变量，改读 state
- `src/client/workspace.ts` — 扫描失败时写 state
