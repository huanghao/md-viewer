# TODO 文件编辑冲突解决方案

## 问题分析

TODO.md 是一个高频编辑的共享文件：
- **用户（人工）** 添加新任务、修改需求、提供反馈
- **Agent（AI）** 更新任务状态、记录进展、追加子任务

**冲突场景：**
1. 同时编辑同一任务
2. 同时在同一位置插入新任务
3. 一方删除，另一方修改
4. 格式不一致导致 merge 困难

---

## 业界参考

### 1. **Google Docs - 实时协作**
- 操作转换（Operational Transformation）
- 实时同步，无冲突

### 2. **Notion - Block-based 编辑**
- 每个 block 独立 ID
- 细粒度冲突解决

### 3. **Git - 行级合并**
- 不同行的修改自动合并
- 同一行冲突需人工解决

### 4. **CRDTs - 无冲突数据结构**
- Conflict-free Replicated Data Types
- 自动收敛到一致状态

---

## 方案对比

### 方案 A：文件拆分 + 引用

**核心思想：** 将 TODO.md 拆分为多个小文件，减少冲突面。

#### 目录结构

```
docs/
├── TODO.md                    # 索引文件（只读，Agent 生成）
├── tasks/
│   ├── user-tasks.md          # 用户添加的任务（人工编辑）
│   ├── agent-tasks.md         # Agent 生成的任务（Agent 编辑）
│   ├── in-progress/
│   │   ├── task-001.md        # 进行中的任务（独立文件）
│   │   ├── task-002.md
│   │   └── ...
│   ├── completed/
│   │   └── 2026-03.md         # 按月归档
│   └── abandoned/
│       └── 2026-03.md
```

#### TODO.md（自动生成）

```markdown
# 待完成功能

本文件由 Agent 自动生成，请勿手动编辑。

## 用户任务
<!-- include: docs/tasks/user-tasks.md -->

## Agent 生成的任务
<!-- include: docs/tasks/agent-tasks.md -->

## 进行中
<!-- include: docs/tasks/in-progress/*.md -->

## 最近完成
<!-- include: docs/tasks/completed/2026-03.md -->
```

#### 工作流

```typescript
// Agent 更新任务
async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const taskFile = `docs/tasks/in-progress/task-${taskId}.md`;
  await writeFile(taskFile, taskContent);
  await regenerateTodoIndex(); // 重新生成 TODO.md
}

// 用户添加任务
// 直接编辑 docs/tasks/user-tasks.md（无冲突）
```

**优点：**
- ✅ 完全避免冲突（不同文件）
- ✅ 独立任务可并行编辑
- ✅ 历史记录清晰

**缺点：**
- ❌ 文件碎片化
- ❌ 用户体验变差（需要跳转多个文件）
- ❌ 实施复杂度高

---

### 方案 B：分区编辑 + 约定

**核心思想：** 在单个 TODO.md 中划分区域，约定编辑规则。

#### 文件结构

```markdown
# 待完成功能

<!--
==================== 用户编辑区 ====================
用户可以在此区域添加、修改、删除任务
Agent 不会修改此区域
-->

## 📝 用户任务

## 新功能需求 A
描述...

## 新功能需求 B
描述...

<!--
==================== Agent 编辑区 ====================
Agent 在此区域更新任务状态、记录进展
用户请不要修改此区域（可以阅读）
-->

## 🤖 Agent 任务

## 优化在iterm2中的体验 [✅完成 - 2026-03-01]
...

## 字体大小调整功能 [✅完成 - 2026-03-01]
...

<!--
==================== 共享编辑区 ====================
用户和 Agent 都可以编辑
编辑前请 git pull，编辑后立即 commit
-->

## 🔄 进行中

## 某个任务 [🔄进行中 - Claude-A - 2026-03-01]
用户可以在这里添加反馈
Agent 可以在这里更新进展
```

#### 编辑规则

```markdown
# AGENTS.md - TODO 编辑规则

## Agent 编辑规则
1. 只修改「Agent 编辑区」和「共享编辑区」
2. 修改前 `git pull --rebase`
3. 修改后立即 commit（不要积累多个修改）
4. Commit 信息：`chore: update TODO - <task-name> (by Agent-ID)`

## 用户编辑规则
1. 优先在「用户编辑区」添加新任务
2. 可以在「共享编辑区」添加反馈
3. 不要删除「Agent 编辑区」的内容（可以移动到其他区域）
```

**优点：**
- ✅ 保持单文件，用户体验好
- ✅ 简单，易于实施
- ✅ 冲突减少 80%+

**缺点：**
- ❌ 仍可能冲突（共享编辑区）
- ❌ 依赖约定，无强制保障

---

### 方案 C：结构化数据 + 视图生成

**核心思想：** 使用结构化格式存储任务，生成 Markdown 视图。

#### 数据文件

```json
// tasks.json
{
  "tasks": [
    {
      "id": "001",
      "title": "优化在iterm2中的体验",
      "status": "completed",
      "priority": 7,
      "category": "design",
      "assignee": "Claude-A",
      "createdBy": "user",
      "createdAt": "2026-02-28T10:00:00Z",
      "updatedAt": "2026-03-01T15:00:00Z",
      "description": "展示在iterm2输出中的md文件名，我可以直接到mdv中打开吗？",
      "notes": [
        {
          "author": "Claude-A",
          "timestamp": "2026-03-01T12:00:00Z",
          "content": "设计文档已完成：docs/design/20260301-iterm2-integration.md"
        },
        {
          "author": "user",
          "timestamp": "2026-03-01T14:00:00Z",
          "content": "看起来不错，我会手动配置 iTerm2"
        }
      ]
    }
  ]
}
```

#### 视图生成

```typescript
// 生成 TODO.md
function generateTodoMarkdown(tasks: Task[]): string {
  const grouped = groupBy(tasks, 'status');

  return `
# 待完成功能

## 进行中
${grouped.in_progress.map(formatTask).join('\n\n')}

## 已完成
${grouped.completed.map(formatTask).join('\n\n')}

---
_本文件由系统自动生成，请使用 Web UI 或 CLI 编辑任务_
  `.trim();
}

// CLI 工具
// 用户：mdv task add "新任务标题"
// Agent：await taskManager.updateStatus('001', 'completed')
```

#### Web UI

```typescript
// 实时协作的任务管理界面
interface TaskUI {
  // 用户和 Agent 都通过 API 操作
  addTask(task: Task): Promise<void>;
  updateTask(id: string, updates: Partial<Task>): Promise<void>;
  addNote(taskId: string, note: Note): Promise<void>;
}

// 后端使用乐观锁
interface TaskUpdate {
  id: string;
  version: number; // 版本号
  updates: Partial<Task>;
}

// 更新时检查版本
async function updateTask(update: TaskUpdate): Promise<Result> {
  const current = await db.getTask(update.id);
  if (current.version !== update.version) {
    return { error: 'conflict', latestVersion: current };
  }
  // 更新成功
  await db.updateTask(update.id, { ...update.updates, version: current.version + 1 });
  return { success: true };
}
```

**优点：**
- ✅ 完全避免 Git 冲突（结构化数据易合并）
- ✅ 支持实时协作
- ✅ 可扩展（添加字段、查询、统计）
- ✅ 可视化管理

**缺点：**
- ❌ 实施复杂度最高
- ❌ 需要额外 UI 和 API
- ❌ Markdown 可读性变差（生成的）

---

### 方案 D：Git 智能合并 + 冲突标记

**核心思想：** 优化 Git 合并策略，冲突时保留两个版本。

#### 自定义 Merge Driver

```bash
# .gitattributes
TODO.md merge=todo-merge

# .git/config
[merge "todo-merge"]
  name = TODO.md smart merge
  driver = ./scripts/todo-merge.sh %O %A %B %P
```

#### 智能合并脚本

```bash
#!/bin/bash
# scripts/todo-merge.sh

base=$1  # 共同祖先
ours=$2  # 当前分支（用户）
theirs=$3  # 合并分支（Agent）
output=$4  # 输出文件

# 1. 尝试自动合并
git merge-file -p "$ours" "$base" "$theirs" > "$output" 2>/dev/null

if [ $? -eq 0 ]; then
  echo "✅ TODO.md 自动合并成功"
  exit 0
fi

# 2. 自动合并失败，智能处理冲突
echo "⚠️  TODO.md 有冲突，使用智能合并..."

# 解析任务
parse_tasks() {
  # 使用 Node.js/Bun 解析 Markdown 任务列表
  bun run scripts/parse-todo.ts "$1"
}

ours_tasks=$(parse_tasks "$ours")
theirs_tasks=$(parse_tasks "$theirs")

# 合并策略：
# - 新任务：保留两边
# - 状态更新：使用最新时间戳
# - 描述修改：保留两个版本，添加冲突标记

merge_tasks() {
  # 实现合并逻辑
  bun run scripts/merge-todo.ts "$ours_tasks" "$theirs_tasks"
}

merged=$(merge_tasks)

# 输出合并结果
echo "$merged" > "$output"

# 添加冲突标记（如果有）
if has_conflicts; then
  echo "" >> "$output"
  echo "<!-- ⚠️ 合并冲突，请检查以下任务 -->" >> "$output"
  echo "$conflicts" >> "$output"
fi

exit 0
```

#### 冲突标记格式

```markdown
## 某个任务 [🔄进行中]

<!-- ⚠️ 合并冲突：用户和 Agent 同时修改了此任务 -->

### 👤 用户版本
描述：用户的修改...
进展：用户添加的进展...

### 🤖 Agent 版本
描述：Agent 的修改...
进展：Agent 添加的进展...

<!-- 请人工决策保留哪个版本，或合并两者 -->
```

**优点：**
- ✅ 保持 Markdown 格式
- ✅ 自动合并大部分情况
- ✅ 冲突时保留两个版本（不丢失信息）

**缺点：**
- ❌ 实施复杂度中等
- ❌ 仍需人工解决冲突

---

## 推荐方案：渐进式混合

### 阶段 1：立即可用（方案 B）

**分区编辑 + 约定**

```markdown
# TODO.md 结构

<!-- ==================== 用户区 ==================== -->
## 📝 新任务（用户添加）
...

<!-- ==================== Agent 区 ==================== -->
## 🤖 任务进展（Agent 更新）
...

<!-- ==================== 共享区 ==================== -->
## 💬 讨论与反馈
...
```

**编辑规则（AGENTS.md）：**
- Agent 只修改「Agent 区」和「共享区」
- 修改前 `git pull --rebase`
- 修改后立即 commit

**成本：** 1 小时（调整 TODO.md 结构）
**效果：** 冲突减少 80%+

---

### 阶段 2：中期优化（方案 D）

**智能合并脚本**

```bash
# 实现自定义 merge driver
1. 解析 Markdown 任务列表
2. 智能合并（新任务、状态、描述）
3. 冲突时保留两个版本
```

**成本：** 1-2 天开发
**效果：** 冲突减少 95%+

---

### 阶段 3：长期方案（方案 C）

**结构化任务管理**

仅在以下情况考虑：
- 任务数量 > 100
- 需要复杂查询（按优先级、类别、时间过滤）
- 需要可视化看板
- 多个 Agent 高频协作

**成本：** 1-2 周开发（API + UI）
**效果：** 完全避免冲突

---

## 实施建议

### 立即行动（今天）

1. ✅ 调整 TODO.md 结构（添加分区标记）
2. ✅ 在 AGENTS.md 添加编辑规则
3. ✅ 测试：用户和 Agent 同时编辑

```markdown
# TODO.md 新结构

<!--
🎯 编辑规则：
- 用户：在「用户区」添加新任务
- Agent：在「Agent 区」更新状态
- 共享：在「共享区」讨论反馈
-->

# 待完成功能

<!-- ==================== 用户区 ==================== -->

## 📝 用户任务

### 新功能 A
描述...

### 新功能 B
描述...

<!-- ==================== Agent 区 ==================== -->

## 🤖 Agent 任务进展

### 优化在iterm2中的体验 [✅完成 - 2026-03-01]
- 设计文档：docs/design/20260301-iterm2-integration.md
...

### 字体大小调整功能 [✅完成 - 2026-03-01]
- 设计文档：docs/design/20260301-font-size-control.md
...

<!-- ==================== 共享区 ==================== -->

## 💬 讨论与反馈

### 某个任务的讨论
- 用户反馈：...
- Agent 回复：...
```

---

### 短期行动（本周）

1. ⏳ 实现简单的合并脚本（可选）
2. ⏳ 添加 pre-commit hook 检测冲突
3. ⏳ 监控冲突频率

```bash
# .git/hooks/pre-commit
#!/bin/bash

# 检查 TODO.md 是否有冲突标记
if git diff --cached TODO.md | grep -q "^<<<<<<<"; then
  echo "❌ TODO.md 有未解决的冲突，请先解决"
  exit 1
fi

# 检查是否违反编辑规则
# （例如：Agent 修改了用户区）
```

---

### 长期行动（按需）

1. ⏸️ 评估是否需要结构化任务管理
2. ⏸️ 实现 Web UI（可选）

---

## 监控指标

```typescript
interface ConflictMetrics {
  // TODO.md 冲突频率
  conflictRate: number;  // 冲突次数 / 总提交次数

  // 冲突解决时间
  avgResolutionTime: number; // 分钟

  // 编辑分布
  userEdits: number;     // 用户编辑次数
  agentEdits: number;    // Agent 编辑次数
  overlaps: number;      // 重叠编辑次数
}
```

**目标：**
- 冲突率 < 5%
- 平均解决时间 < 5 分钟

---

## 替代方案：使用专门的任务管理工具

如果冲突问题严重，考虑使用现成工具：

### 1. **GitHub Issues**
- ✅ 天然支持协作
- ✅ 无冲突
- ❌ 需要网络
- ❌ 无法离线工作

### 2. **Linear / Jira**
- ✅ 专业任务管理
- ✅ 实时协作
- ❌ 复杂度高
- ❌ 需要额外成本

### 3. **Notion / Coda**
- ✅ 灵活
- ✅ 实时协作
- ❌ 需要网络
- ❌ API 限制

### 4. **SQLite + Web UI**
- ✅ 本地优先
- ✅ 无冲突
- ✅ 可扩展
- ❌ 需要开发

---

## 总结

### 推荐路径

1. **现在：** 方案 B（分区编辑） ← 立即实施
2. **下周：** 方案 D（智能合并） ← 按需添加
3. **未来：** 方案 C（结构化） ← 规模化后考虑

### 核心原则

- 从简单开始，按需演进
- 优先预防，而非事后处理
- 保持 Markdown 可读性
- 监控指标驱动优化

---

**下一步：** 调整 TODO.md 结构，添加分区标记
