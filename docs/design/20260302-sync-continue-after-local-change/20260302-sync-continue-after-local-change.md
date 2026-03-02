# 本地修改后继续同步：产品与交互设计（v2 方案）

日期：2026-03-02  
状态：Draft（按 2026-03-02 新约束重写）

配套产物：
- 交互文档：`docs/design/20260302-sync-versioning-interaction.md`
- 可视原型：`docs/design/20260302-sync-continue-after-local-change/sync-versioning-prototype.html`
- 重做原型（你要求的两页）：
  - `docs/design/20260302-sync-continue-after-local-change/sync-page-prototype.html`
  - `docs/design/20260302-sync-continue-after-local-change/sync-button-popup-prototype.html`
- 当前确认版（单页整合）：`docs/design/20260302-sync-continue-after-local-change/sync-unified-single-page-prototype.html`

## 待决策项（仅剩实现细节）

1. 版本标题命名是否固定为 `原标题-vN`（N 递增），还是允许自定义模板（例如 `原标题 (vN)`）。
2. 本地保留多少历史版本映射（建议 20，超出按 log rotate 方式裁剪）。
3. “一键还原”默认还原到最近一次成功绑定，还是支持选择任意历史版本。

---

## 1. 已确认原则（来自需求）

1. 同步以**本地维护的同步状态**为主，远端不反查、不回写旧文档。
2. 继续同步采用**新建版本**策略：`xxxx` -> `xxxx-v2` -> `xxxx-v3`。
3. 同步实现**不使用 `km-cli doc update`**，每次都调用 `km-cli doc create` 新建文档。
4. 若文件处于 `M`（本地有未刷新内容），**禁止同步**，必须先刷新。
5. 远端文档不在可控范围内，本流程**不会修改任何历史远端文档**。
6. 交互必须体现步骤流，每步可见成功/失败状态。
7. 必须定义中间失败时的回退、恢复、放弃策略，以及本地状态如何维护。
8. 提供极端场景下的一键清除、一键还原能力。

---

## 2. 产品目标

1. 用户可以持续发布新版本，不会被“已同步状态”卡住。
2. 用户始终知道“当前是否可同步，下一步该做什么”。
3. 任一步失败都不会污染既有成功状态，且可恢复。

非目标：
- 不做远端版本比对与冲突合并。
- 不做远端旧版本删除/覆盖。

---

## 3. 同步状态模型（本地真相源）

## 3.1 文件级状态

- `UNLINKED`：本地没有任何同步绑定（无 `activeDocId`）
- `READY`：有绑定，且非 `M`，可继续同步
- `BLOCKED_M`：文件 `M`，先刷新后才能同步
- `SYNCING`：正在执行步骤流
- `FAILED`：最近一次同步流程失败（可重试/放弃/还原）

## 3.2 本地数据结构（建议）

```ts
interface SyncVersionRecord {
  version: number;           // 1,2,3...
  docId: string;
  url?: string;
  title: string;             // 含 -vN 的实际标题
  syncedAt: number;
  fileModifiedAt: number;    // 同步时的 displayedModified
  status: "success" | "failed" | "abandoned";
  error?: string;
}

interface FileSyncState {
  filePath: string;
  baseTitle: string;         // 不含 -vN 的基标题
  activeVersion: number;     // 当前绑定版本
  activeDocId: string;       // 当前绑定 docId
  lastSuccessfulModified: number;
  history: SyncVersionRecord[]; // rotate 保存，完整保留每次同步记录
  pendingRunId?: string;     // 正在执行时存在
}
```

## 3.3 版本规则（log rotate）

- 初次同步创建 `version=1`（标题可为 `baseTitle`）。
- 继续同步创建 `version = activeVersion + 1`。
- 标题生成：`version=1 -> baseTitle`，`version>=2 -> ${baseTitle}-v${version}`。
- 历史条数超限时裁剪旧记录（如仅保留最近 20 条），但保留 `activeVersion` 对应记录。
- 展示层必须按 `syncedAt` **倒序**渲染历史（最新在最上）。

---

## 4. 交互设计（步骤可视化）

## 4.1 工具栏按钮状态

- `UNLINKED`：`[☁↑ 首次同步]`
- `READY`：`[↑ 继续同步(vN+1)]`
- `BLOCKED_M`：`[先刷新后同步]`（禁用）
- `SYNCING`：`[⏳ 同步中]`（禁用）
- `FAILED`：`[! 同步失败，查看步骤]`

备注：
- `M` 状态优先于同步状态展示。
- 远端文件（`isRemote=true`）不展示同步按钮。

## 4.2 非模态“同步步骤面板”（右侧抽屉）

展示固定 4 步：
1. `预检查`（本地可同步、非远端、非 M）
2. `计算版本`（生成 `vN` 与目标标题）
3. `创建远端文档`（km-cli create）
4. `写入本地状态`（切换 activeDocId/version，写历史）

每一步展示：
- `进行中 / 成功 / 失败`
- 失败时显示错误摘要 + 展开原始输出

底部操作区：
- 主按钮：`重试当前步骤` / `重试整次同步`
- 次按钮：`放弃本次`
- 危险按钮：`一键还原`（仅在有上一个成功版本时可点）

## 4.3 信息区（非模态）

面板顶部展示：
- 当前绑定：`vN -> <url>`
- 下一个版本：`vN+1`
- 本地内容状态：`已刷新` / `待刷新(M)`

同步历史区（必选）：
- 显示该文件每一次同步记录（`success/failed/abandoned`）
- 排序：按时间倒序（`syncedAt desc`）
- 每条展示：版本号、标题、时间、状态、docId、跳转链接（如有）

---

## 5. 关键流程

## 5.1 流程 A：继续同步（主路径）

1. 用户刷新文件，`M` 清除
2. 点击 `[↑ 继续同步(vN+1)]`
3. 步骤 1~4 顺序执行
4. 成功后：
   - `activeVersion = N+1`
   - `activeDocId` 切换到新文档
   - 历史新增一条 `success`

## 5.2 流程 B：文件是 M

1. 按钮禁用，显示 `先刷新后同步`
2. 用户点击按钮仅提示：`请先刷新文件，再继续同步`
3. 刷新成功后自动进入 `READY`

## 5.3 流程 C：无同步状态（本期先占位）

1. 显示 `首次同步`
2. 若用户希望关联历史文档，入口显示“手动关联（即将支持）”
3. 关联能力本期不实现，列入 TODO（见第 10 节）

---

## 6. 失败处理与回退策略

## 6.1 原子性原则

- 只有在“创建远端文档成功”后，才允许写本地 active 绑定。
- 本地状态更新失败时，不覆盖旧 active 绑定。

## 6.2 各步骤失败时处理

1. `预检查失败`
   - 不产生远端副作用
   - 状态保持原样
2. `创建远端文档失败`
   - 不更新 active 绑定
   - 写一条 `failed` 历史（不改变 active）
3. `本地状态写入失败`
   - 远端已创建但本地未切换，记为 `failed` + `orphanDocId`
   - 面板提供：`重试写入` / `放弃并记录`

## 6.3 放弃、恢复、回滚

- `放弃本次`：将本次 run 标记 `abandoned`，active 保持旧版本。
- `一键还原`：active 回到最近一次 `success` 记录（通常无需远端操作）。
- `一键清除`：清空该文件同步状态（包括 active 与历史），文件回到 `UNLINKED`。

---

## 7. 极端场景能力

## 7.1 一键清除

入口：同步面板的“更多”菜单。  
行为：
- 删除当前文件在 `sync-state` 中的所有记录
- 不影响远端任何文档
- UI 回到 `UNLINKED`

## 7.2 一键还原

入口：`FAILED` 或“更多”菜单。  
行为：
- 将 active 指针恢复到最近成功版本
- 保留失败记录用于审计
- 不修改远端

---

## 8. API 与实现约束

本方案仅依赖 `km-cli doc create`（强约束）：
- 明确不调用 `km-cli doc update`
- 不触碰旧远端文档
- 每次继续同步都 create 新文档

建议扩展 `POST /api/sync/execute`：

```json
{
  "filePath": "...",
  "title": "...",
  "parentId": "...",
  "mode": "create_new_version",
  "version": 3,
  "baseTitle": "xxxx"
}
```

---

## 9. 验收标准

1. 已同步文件在本地刷新后可继续同步，标题自动递增到 `-vN`。
2. 处于 `M` 时按钮不可执行同步。
3. 历史远端文档不被修改。
4. 任一步失败后 active 绑定不被错误覆盖。
5. 提供可用的一键清除与一键还原。

---

## 10. TODO（后续实现）

1. 手动关联已有远端文档：当本地无同步状态时，允许输入 docId 建立初始绑定，再进入本方案流程。
