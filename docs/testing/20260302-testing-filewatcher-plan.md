# File Watcher 测试计划（基于当前代码重构）

日期：2026-03-01  
状态：🔄进行中（测试计划文档）

## 1. 当前代码事实基线（仅陈述现状）

### 1.1 监听入口与范围
- 本地文件：`GET /api/file` 成功后调用 `watchFile(resolvedPath)`。
- 工作区：`POST /api/scan-workspace` 后调用 `watchWorkspace(resolvedPath)`（按 root 去重）。
- 远程 URL：不进入 watcher。
- 监听文件类型：`*.md/*.markdown/*.html/*.htm`（通过 `isSupportedTextFile` 过滤）。

### 1.2 事件与消息链路
- 服务端 watcher 只处理两类事件：`change`、`unlink`。
- SSE 广播事件：
1. `file-changed`：`{ path, lastModified }`
2. `file-deleted`：`{ path }`

### 1.3 客户端状态语义
- `file-changed` 到达后：
1. 若文件未在 `sessionFiles` 中，忽略。
2. 当前/非当前文件统一仅更新 `lastModified`，并通过 `lastModified > displayedModified` 进入 `M`。
3. 需要用户触发手动刷新（或切换后触发的同步路径）才会更新正文并清除 `M`。
- `file-deleted` 到达后：
1. 若文件已打开：标记 `isMissing=true`（`D`）。
2. 若文件未打开：仅标记 `workspaceMissingPaths`，不污染已打开列表。
3. 若是当前文件：内容区显示删除提示，保留本地缓存正文，并显示错误 toast。
4. 若是工作区中“未打开且已删除”的路径：在“已删除”分组渲染 `D + 划线`，可点击进入删除提示页。

### 1.4 工作区视图与蓝点
- 蓝点来源于列表差异/工作区扫描，不是 watcher 事件。
- 优先级：`D > M > 蓝点`。
- 工作区中，树里不存在但已标记 missing 的路径，会在“已删除”分组显示。

### 1.5 重连与轮询
- SSE 断开后客户端 `3s` 自动重连（`EventSource` onerror）。
- 工作区模式下，对展开工作区每 `1500ms` 轮询扫描一次，用于树结构刷新与差异更新。

## 2. 测试目标

- G1：验证端到端链路（磁盘变更 -> chokidar -> SSE -> UI 状态）。
- G2：验证当前/非当前文件在 `change` 与 `unlink` 下的分叉行为。
- G3：验证简单模式与工作区模式下 `M/D/删除提示` 语义一致。
- G4：验证“未打开文件删除”在工作区下可见且可交互。
- G5：覆盖高风险稳定性边界（连续写入、删除后重建、SSE 重连）。

## 3. 现有用例映射（按当前仓库）

### P0（回归必跑）
- ✅ `case-10`：`file-changed`（当前/非当前统一 `M`，手动刷新或切换触发同步）。
- ✅ `case-11`：当前文件删除后的可见删除态（简单模式）。
- ✅ `case-12`：工作区模式删除态样式（已打开文件）。
- ✅ `case-13`：非当前文件删除 + 点击行为 + 刷新清理（简单模式）。
- ✅ `case-14`：工作区模式删除非当前已打开文件。
- ✅ `case-15`：工作区模式删除未打开文件后立即显示 `D`。

### P1（缺口已补齐）
- ✅ `case-16` 覆盖 `P1-1`：连续快速修改收敛。
- ✅ `case-17` 覆盖 `P1-2`：删除后同路径重建并恢复监听。
- ✅ `case-18` 覆盖 `P1-3`：SSE 断线重连恢复后继续接收变更。

## 4. 新增用例设计（已落地）

### case-16（P1-1）连续写入收敛
- 前置：打开 A 并保持为当前。
- 步骤：短时间连续写入 A（例如 5 次不同内容）。
- 预期：先进入 `M/可刷新`，手动刷新后正文收敛到最后一次内容。

### case-17（P1-2）删除后重建恢复
- 前置：A 先打开，删除后进入 `D`。
- 步骤：同路径重建 A，点击“重试加载”（或重新打开）。
- 预期：A 从 `D` 恢复为正常可读；删除提示消失；后续修改继续进入 `M/可刷新`。

### case-18（P1-3）SSE 重连恢复
- 前置：页面已建立 SSE。
- 步骤：重启服务或主动断连后恢复，再修改已监听文件。
- 预期：客户端重连成功，继续收到 `file-changed/file-deleted`。

## 5. 执行策略

### 阶段 A：P0 回归（每次 watcher/state 改动必跑）
1. `bun run test:e2e -- tests/e2e/cases/case-10/case-10.spec.ts`
2. `bun run test:e2e -- tests/e2e/cases/case-11/case-11.spec.ts`
3. `bun run test:e2e -- tests/e2e/cases/case-12/case-12.spec.ts`
4. `bun run test:e2e -- tests/e2e/cases/case-13/case-13.spec.ts`
5. `bun run test:e2e -- tests/e2e/cases/case-14/case-14.spec.ts`
6. `bun run test:e2e -- tests/e2e/cases/case-15/case-15.spec.ts`

### 阶段 B：补齐缺口（已完成）
1. 已新增 `case-16/17/18`（按 README -> spec 顺序落地）。
2. 当前优先级转为维护稳定性：`case-17 > case-18 > case-16`。

## 6. 通过标准

- 功能正确：状态与交互符合“当前代码事实基线”。
- 稳定性：关键 case 连续运行 3 次通过。
- 可诊断：失败时有 trace/video 支持定位。

## 7. 待决策项

1. `unlink` 后同路径重建是否需要“自动恢复监听体验”，还是继续依赖“重试加载/重新打开”。
2. `M` 状态与“需手动刷新”是否需要更明确的用户引导文案。
3. 是否将 SSE 重连场景提升为 P0（当前为 P1）。
