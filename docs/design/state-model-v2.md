# 文件状态模型 V2（重构提案）

日期：2026-03-01

## 背景
当前状态可用，但语义混杂：
- 工作区扫描状态（目录快照）
- 文件系统变化状态（M/D）
- 列表差异状态（蓝点）
- 同步状态（学城）

用户感知问题：
1. “扫描到文件”与“蓝点”来源被混淆。
2. 列表状态和工具栏状态边界不清晰。
3. 状态字段来源不同但在 UI 中挤在一起。

---

## 目标
建立“正交状态模型”，每个状态维度只表达一类语义，再定义明确的 UI 投影规则。

---

## V2 状态维度（正交）

### 维度 A：可用性（Availability）
- `exists`
- `missing`

来源：文件系统（watcher + load 失败）

### 维度 B：内容新鲜度（Freshness）
- `clean`
- `dirty`（磁盘版本比当前展示版本新）

来源：`lastModified` vs `displayedModified`

### 维度 C：列表差异（ListDiff）
- `diff`
- `normal`

来源：
- 工作区模式：`workspace 扫描结果` vs `workspaceKnownFiles` 的差异
- 简单模式：路径首次加入 `state.files`

### 维度 D：同步状态（SyncState）
- `unsynced`
- `synced`

来源：同步记录（`syncedDocId/syncedAt/...`）

---

## 状态作用域（必须区分）

### 1) OpenFileState（文件内容态）
- 作用范围：`state.files`
- 包含维度：A/B/C/D
- UI 投影：简单模式列表、工具栏

### 2) WorkspaceTreeState（工作区目录树）
- 作用范围：`state.fileTree`
- 当前模型：目录快照（非实时）
- 建议扩展：`workspaceKnownFiles` + `workspaceNewFiles`
- 包含维度：目录发现语义 + 列表差异语义

---

## UI 投影规则（V2）

### 列表/树右侧 badge（只显示一个）
优先级：`missing > dirty > listDiff > normal`

- missing => `D`
- dirty => `M`
- listDiff => `●`
- normal => 空

### 同步状态显示
- 不进入列表 badge
- 只在工具栏/同步详情显示

### 当前文件高亮
- 属于选择态，不是业务状态
- 与 badge 并列，不参与优先级计算

---

## 与现有字段映射

| 现有字段/逻辑 | V2 维度 | 说明 |
|---|---|---|
| `isMissing` | Availability | `missing` |
| `lastModified > displayedModified` | Freshness | `dirty` |
| `listDiffPaths/workspaceNewFiles` | ListDiff | `diff` |
| `syncedDocId` 等 | SyncState | `synced` |
| `state.currentFile` | 选择态 | 非业务状态 |
| `state.fileTree` | WorkspaceTreeState | 快照，不是 open state |

---

## 与 `state-sync-risk-analysis` 的对齐

已对齐项：
1. “工作区树不是实时状态”结论保持不变。
2. “新增文件蓝点”建议保留，且与 open/read 彻底解耦。
3. watcher 改造仍是优先事项（workspace 级事件）。

冲突消解：
- 文档里“新文件提示规则”对应的是 ListDiff，不是 open/read 状态。

---

## 迁移计划（渐进式）

### Phase 1（不改 watcher，先收敛语义与实现）
1. 固化 UI 规则：badge 只看 A/B/C。
2. 文档明确“sync 状态不入列表 badge”。

### Phase 2（补工作区新文件语义）
1. 新增：
- `workspaceKnownFiles: Map<workspaceId, Set<path>>`
- `workspaceNewFiles: Map<workspaceId, Set<path>>`
2. 扫描差异：首次扫描建基线；后续扫描差异标记为 new。
3. simple 模式“首次加入列表”也映射到同一蓝点语义（ListDiff）。

### Phase 3（实时化）
1. 增加 workspace watcher（`**/*.md` add/unlink/change）。
2. SSE 下发 `workspace-changed`。
3. 客户端对展开中的工作区 debounce 更新。

---

## 测试要点（必须覆盖）

1. `D > M > listDiff` 优先级稳定。
2. listDiff 刷新后保持。
3. workspace 新文件提示与 open/read 不混淆。
4. sync 成功不改变 badge 优先级。
5. 删除文件后 D 状态可重试/可关闭。

---

## 决策点（供 review）

1. 是否同意把“工作区新文件提示”与“open unread”彻底拆分？
2. 是否同意列表 badge 永远只显示 A/B/C，不显示 sync？
3. 是否接受 Phase 2 先于 workspace watcher 落地（低风险）？

---

## Review 结论（2026-03-01）

1. 已确认：拆分“工作区新文件提示”与“open unread”。
2. 已确认：列表 badge 永远只显示 A/B/C，不显示 sync。
3. 已确认：先做 Phase 2，再做 workspace watcher。

补充确认：
- 只要文件被工作区“新扫描到”，就显示当前的小蓝点提示。
- 文件是否“已打开”，不作为蓝点提示的前置条件。

实现提示：
- `workspaceKnownFiles/workspaceNewFiles` 负责工作区蓝点。
- simple 模式首次加入列表同样进入 ListDiff 蓝点语义。
- 保留统一 UI：蓝点只表示“列表差异”，不表示 open/read。
