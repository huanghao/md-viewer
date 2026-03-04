# 批注持久化与锚点稳定性设计（SQLite + 重锚）

文档定位（设计）：
- 回答“批注是否会乱套、是否上本地存储、文档更新后如何保持引用”三类核心问题
- 给出适配 `md-viewer` 的可落地方案（不追求 PR 系统级复杂度）
- 本文不包含代码实现，仅定义方案、边界、阶段计划

## 待决策项（请先确认）

1. 存储位置：是否采用 `~/.config/md-viewer/annotations.db` 作为默认本地批注库？
2. 功能边界：V1 是否先做“单用户、本地文件、单文档线程（无多人协作）”？
3. 失锚策略：V1 是否采用“尽力重锚 + 明确 Unanchored 列表”，而不是保证 100% 自动修复？
4. 迁移策略：是否允许首次启动时从浏览器 `localStorage` 一次性导入到 SQLite（由前端发起）？

## 1. 先回答你的 3 个问题

### 1.1 现在批注存在浏览器里，文档变更后位置会乱吗？

会，且是结构性问题。  
当前实现把批注存成 `start + length + quote`，按当前渲染文本流定位；当文档内容在锚点前后发生编辑时，纯位置锚点会漂移，严重时直接失效。

当前代码事实：
- 存储：`localStorage`，key 为 `md-viewer:annotations:{filePath}`。
- 锚点模型：`start`、`length`、`quote`（见 `src/client/annotation.ts`）。

### 1.2 是否应该存到本地（非浏览器）？

应该。  
把批注上收至本地实体（SQLite）后，至少能得到：
- 可被 CLI/Agent 读取（不再困在浏览器 profile）
- 可做一致备份与迁移
- 可做索引、重锚日志、冲突恢复

### 1.3 文档更新后引用错位怎么解决？

不能靠单一偏移量解决，必须使用“多选择器 + 重锚策略”：
- 主锚：文本位置（快）
- 辅锚：文本引用（exact/prefix/suffix，稳）
- 恢复：位置命中失败时，降级到文本匹配与近邻搜索
- 兜底：标记为 `unanchored`，保留评论内容与原引用证据

## 2. 主流实现调研（抽取对我们有用的部分）

## 2.1 代码评审类（GitHub / GitLab）

共同点：
1. 评论不是只存“当前行号”，还保存“原始定位信息”与 diff 上下文。
2. 当代码演进导致原位置失效，会出现“过时/Outdated”状态，而不是静默丢失。
3. API 数据结构明确区分 `original_*` 与 `current_*` 语义。

对我们的启发：
1. 批注要保留“创建时锚点快照（original）”。
2. UI 要有“已失锚”显式状态，不可假装定位成功。

## 2.2 网页批注类（W3C / Hypothesis）

共同点：
1. W3C 推荐组合选择器：`TextPositionSelector` + `TextQuoteSelector(exact/prefix/suffix)`。
2. 页面变化时允许“失锚（orphan/unanchored）”并继续展示评论实体。
3. 不承诺编辑后永不漂移，而是“尽力重锚 + 可见失败状态”。

对我们的启发：
1. 我们应采用“位置 + 引文上下文”的双锚模型。
2. 明确 `unanchored` 生命周期（可手动重新绑定）。

## 2.3 为什么不直接照搬 PR 系统？

PR 系统依赖：
- 版本图（commit/patch-set）
- 行级 diff 语义
- 多人协作流程（review、resolve、权限）

`md-viewer` 当前是本地文档阅读器，直接照搬会过度复杂。  
应裁剪为：单文档评论 + 轻量版本快照 + 重锚算法 + 失锚管理。

## 3. 目标与非目标

## 3.1 目标（V1）

1. 批注从浏览器 `localStorage` 迁移到本地 SQLite。
2. 文档变更后，批注尽量自动重锚。
3. 重锚失败可见、可检索、可手动恢复。
4. Agent/CLI 能读取批注数据（便于文档迭代时吸收反馈）。

## 3.2 非目标（V1 不做）

1. 多人实时协作与权限体系。
2. 完整版本控制式“任意历史点回放”。
3. 跨设备自动同步（后续再评估）。

## 4. 方案总览（适配 md-viewer）

架构分层：
1. 前端：采集选区、展示批注、调用 `/api/annotations/*`。
2. 服务端：SQLite 持久化、重锚计算、状态管理。
3. 存储：`~/.config/md-viewer/annotations.db`（与现有配置目录一致）。

关键原则：
1. 批注实体与锚点状态分离：评论永不因失锚丢失。
2. 每条批注保存“创建快照 + 当前锚点 + 重锚记录”。
3. 先保证可解释与可恢复，再追求算法精细度。

## 5. 数据模型（SQLite）

建议表结构（逻辑）：

1. `documents`
- `id` TEXT PK
- `path` TEXT UNIQUE（规范化绝对路径）
- `last_content_hash` TEXT
- `last_seen_at` INTEGER

2. `annotations`
- `id` TEXT PK
- `document_id` TEXT FK
- `note` TEXT
- `status` TEXT (`anchored`/`unanchored`/`resolved`)
- `created_at` INTEGER
- `updated_at` INTEGER

3. `annotation_anchors`
- `annotation_id` TEXT PK/FK
- `selector_start` INTEGER
- `selector_end` INTEGER
- `quote_exact` TEXT
- `quote_prefix` TEXT
- `quote_suffix` TEXT
- `anchor_hash` TEXT（创建时文本快照 hash）
- `last_reanchor_at` INTEGER
- `confidence` REAL（0~1）
- `is_orphan` INTEGER

4. `annotation_reanchor_log`
- `id` INTEGER PK
- `annotation_id` TEXT FK
- `from_status` TEXT
- `to_status` TEXT
- `strategy` TEXT（position/quote/fuzzy/manual）
- `message` TEXT
- `created_at` INTEGER

说明：
- V1 无需上 FTS；若后续需要评论全文检索，可加 FTS5。

## 6. 锚点算法（V1 可实现）

输入：渲染后纯文本 `T` + 批注锚点 `{start,end,exact,prefix,suffix}`  
输出：新范围或 `unanchored`

流程：
1. `Position Fast Path`
- 检查 `T[start:end] == exact`，命中即成功（高置信度）。

2. `Exact Quote Search`
- 全文查找 `exact`。
- 若唯一命中，成功（中高置信度）。
- 若多命中，进入第 3 步消歧。

3. `Context Disambiguation`
- 用 `prefix/suffix` 对候选命中点打分（距离越近分越高）。
- 最高分超过阈值则成功（中置信度）。

4. `Near-Position Fuzzy Search`
- 在旧位置附近窗口（如 ±2k 字符）做模糊匹配（编辑小改常见）。
- 命中则成功（中低置信度）。

5. `Fail -> Unanchored`
- 不删除批注，标记 `unanchored` 并在侧边栏单独分组显示。

## 7. 文档更新后的引用一致性策略

1. 触发时机
- 打开文件时，如果 `content_hash` 变化，触发该文档批注重锚。
- SSE 文件变更事件后，后台轻量重锚一次。

2. 状态机
- `anchored -> anchored`（正常）
- `anchored -> unanchored`（失锚）
- `unanchored -> anchored`（后续文本回归或手动重绑）

3. UI 约束
- 已失锚批注显示原 `quote_exact`（删除线）+ “重新定位”入口。
- 批量提示：本次重锚成功 N 条，失锚 M 条。

## 8. 本项目裁剪版（相对主流系统）

保留：
1. 双锚选择器（位置 + 引文上下文）
2. Outdated/Unanchored 显式状态
3. 重锚日志

裁剪：
1. 不做分支/提交级精确追踪（不像 GitHub/GitLab）
2. 不做多人线程权限
3. 不做跨端同步协议

## 9. 迁移与落地计划

Phase 0（设计对齐）
1. 冻结数据模型与 API 草案。
2. 明确失锚 UI 文案与交互。

Phase 1（存储上收）
1. 新增 SQLite 存储层与注释 API。
2. 前端改为 API 读写，保留 localStorage 只读兜底。
3. 首次启动提供“一次性导入 localStorage 批注”。

Phase 2（重锚）
1. 实现 4 级重锚策略。
2. 引入 `unanchored` 列表与手动重绑。

Phase 3（稳态治理）
1. 增加重锚命中率指标与日志。
2. 增加导出/备份能力（JSON 或 SQL dump）。

## 10. 风险与复杂度评估

新增复杂度：
1. 从“纯前端状态”升级为“前后端一致性状态”。
2. 需要维护锚点状态机与重锚质量。
3. 增加数据迁移与兼容窗口。

可控策略：
1. 分阶段上线，先存储后重锚。
2. 失败可见（unanchored），避免静默错误。
3. 关键路径可回滚到 localStorage 只读。

## 11. 验收标准（设计阶段）

1. 你能清晰理解“为什么会漂移、为什么要上本地实体、怎么处理失锚”。
2. 能确认 V1 的功能边界与不做项。
3. 能确认是否进入实现阶段（按 Phase 1 -> Phase 2）。

## 参考资料

1. GitHub Pull Request Review Comments API  
https://docs.github.com/en/rest/pulls/comments

2. GitLab Discussions API（MR diff position）  
https://docs.gitlab.com/api/discussions/

3. W3C Web Annotation Data Model（TextQuoteSelector / TextPositionSelector）  
https://www.w3.org/TR/annotation-model/

4. Hypothesis：Unanchored/Orphans 说明  
https://web.hypothes.is/help/what-are-unanchored-annotations/  
https://web.hypothes.is/help/what-are-orphans-and-where-are-they/

5. SQLite WAL  
https://sqlite.org/wal.html

