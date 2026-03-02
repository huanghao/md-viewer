# 多 Agent 协作冲突解决方案

## 问题分析

当多个 agent 同时工作时，可能产生的冲突：

### 1. 文件编辑冲突
- 多个 agent 同时修改同一文件
- Git merge conflicts
- 代码逻辑冲突（一个 agent 的修改破坏另一个的功能）

### 2. 任务竞争冲突
- 多个 agent 选择同一任务
- 重复工作，浪费资源
- 任务状态不一致

### 3. 依赖冲突
- Agent A 依赖 Agent B 的输出
- 执行顺序错乱
- 数据不一致

### 4. 资源冲突
- 端口占用（多个开发服务器）
- 数据库连接
- 临时文件覆盖

## 解决方案对比

### 方案 A：乐观锁 + 任务认领机制

**核心思想：** 先到先得，冲突后重试

**实现：**
```markdown
## 任务维护规则
- 任务状态：开始（默认状态）、🔄进行中、⏳等待、✅完成、🚫放弃
- 你每次新拿到任务，立刻更新状态为 🔄进行中，避免另一个agent拿到同一个任务
- 更新状态时带上 agent ID 和时间戳
```

**优点：**
- ✅ 简单，无需额外基础设施
- ✅ 适合低冲突场景
- ✅ 当前 TODO.md 已部分实现

**缺点：**
- ❌ 高并发下仍可能冲突
- ❌ 需要 agent 自觉遵守规则
- ❌ Git merge conflicts 仍需手动解决

**适用场景：** 2-3 个 agent，任务粒度较大

---

### 方案 B：中央任务队列 + 分布式锁

**核心思想：** 统一调度，原子操作

**架构：**
```
┌─────────────────────────────────────┐
│   Task Queue Service (SQLite)      │
│   - tasks table                     │
│   - locks table                     │
│   - agent_status table              │
└─────────────────────────────────────┘
           ↑         ↑         ↑
           │         │         │
      Agent 1    Agent 2    Agent 3
```

**API 设计：**
```typescript
// 任务队列服务
interface TaskQueueService {
  // 原子操作：获取并锁定任务
  claimTask(agentId: string): Task | null;

  // 更新任务状态
  updateTask(taskId: string, status: TaskStatus, agentId: string): boolean;

  // 释放任务锁（失败或放弃时）
  releaseTask(taskId: string, agentId: string): void;

  // 心跳检测（agent 崩溃时自动释放锁）
  heartbeat(agentId: string): void;
}
```

**数据库表结构：**
```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL, -- pending, in_progress, completed, failed
  assigned_to TEXT,     -- agent ID
  locked_at INTEGER,    -- timestamp
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE locks (
  resource TEXT PRIMARY KEY, -- 文件路径或资源名
  holder TEXT NOT NULL,      -- agent ID
  acquired_at INTEGER,
  expires_at INTEGER
);

CREATE TABLE agent_status (
  agent_id TEXT PRIMARY KEY,
  last_heartbeat INTEGER,
  status TEXT -- active, idle, crashed
);
```

**优点：**
- ✅ 强一致性，避免任务重复
- ✅ 支持高并发
- ✅ 自动检测 agent 崩溃
- ✅ 可视化任务队列状态

**缺点：**
- ❌ 需要额外服务
- ❌ 增加系统复杂度
- ❌ 单点故障风险（需要 HA）

**适用场景：** 5+ agents，高并发，生产环境

---

### 方案 C：Git Worktree 隔离 + 最终合并

**核心思想：** 空间换时间，独立工作空间

**工作流：**
```bash
# 每个 agent 独立的 worktree
workspace/
├── main/                 # 主分支
├── agent-1-worktree/     # Agent 1 工作区
├── agent-2-worktree/     # Agent 2 工作区
└── agent-3-worktree/     # Agent 3 工作区

# Agent 工作流
1. 创建独立 worktree: git worktree add agent-1-worktree -b agent-1-task-123
2. 独立开发，无冲突
3. 完成后提交到独立分支
4. 主 agent 或人工审核后合并到 main
```

**合并策略：**
```typescript
interface MergeStrategy {
  // 自动合并（无冲突）
  autoMerge(branches: string[]): MergeResult;

  // 冲突检测
  detectConflicts(branches: string[]): Conflict[];

  // 冲突解决建议
  suggestResolution(conflict: Conflict): Resolution[];
}
```

**优点：**
- ✅ 完全隔离，零运行时冲突
- ✅ 支持任意数量 agent
- ✅ 可并行运行测试
- ✅ 易于回滚

**缺点：**
- ❌ 磁盘空间占用大
- ❌ 最终合并仍可能冲突
- ❌ 需要智能合并策略

**适用场景：** 独立功能开发，长时间任务

---

### 方案 D：文件级锁 + 冲突预测

**核心思想：** 细粒度锁，主动避免冲突

**实现：**
```typescript
// 文件锁管理器
class FileLockManager {
  private locks = new Map<string, Lock>();

  // 获取文件锁（阻塞）
  async acquireLock(filePath: string, agentId: string): Promise<Lock> {
    while (this.locks.has(filePath)) {
      await sleep(100);
    }
    const lock = { filePath, holder: agentId, acquiredAt: Date.now() };
    this.locks.set(filePath, lock);
    return lock;
  }

  // 尝试获取锁（非阻塞）
  tryAcquireLock(filePath: string, agentId: string): Lock | null {
    if (this.locks.has(filePath)) return null;
    const lock = { filePath, holder: agentId, acquiredAt: Date.now() };
    this.locks.set(filePath, lock);
    return lock;
  }

  // 释放锁
  releaseLock(filePath: string, agentId: string): void {
    const lock = this.locks.get(filePath);
    if (lock?.holder === agentId) {
      this.locks.delete(filePath);
    }
  }
}

// 冲突预测器
class ConflictPredictor {
  // 分析任务的文件依赖
  analyzeFileDependencies(task: Task): string[] {
    // 使用 AST 分析代码依赖
    // 返回可能修改的文件列表
  }

  // 预测冲突概率
  predictConflict(task1: Task, task2: Task): number {
    const files1 = this.analyzeFileDependencies(task1);
    const files2 = this.analyzeFileDependencies(task2);
    const overlap = intersection(files1, files2);
    return overlap.length / Math.max(files1.length, files2.length);
  }

  // 推荐任务分配
  recommendTaskAllocation(agents: Agent[], tasks: Task[]): Map<Agent, Task> {
    // 最小化冲突的任务分配算法
  }
}
```

**优点：**
- ✅ 细粒度控制
- ✅ 主动避免冲突
- ✅ 智能任务调度

**缺点：**
- ❌ 复杂度高
- ❌ 可能死锁
- ❌ 预测不准确时效果差

**适用场景：** 复杂项目，文件依赖关系清晰

---

## 推荐方案：渐进式混合方案

### 阶段 1：立即可用（当前）
**方案 A + 规范约定**

```markdown
# AGENTS.md - Agent 协作规范

## 任务认领规则
1. 从 TODO.md 选择任务前，先 `git pull` 获取最新状态
2. 立即更新任务状态为 🔄进行中，格式：
   ```
   ## 任务标题 [🔄进行中 - Agent-ID - 2026-03-01 10:30]
   ```
3. 每 5 分钟提交一次进度（避免长时间占用）
4. 完成或放弃时立即更新状态

## 文件编辑规则
1. 优先选择独立文件的任务（减少冲突）
2. 修改共享文件前，检查最近提交记录
3. 提交前 `git pull --rebase` 并解决冲突
4. 提交信息包含 agent ID：`feat: xxx (by Agent-1)`

## 冲突处理流程
1. 遇到 Git 冲突：
   - 保留两个版本的功能（不要删除别人的代码）
   - 添加 TODO 注释标记需要人工审核的部分
   - 提交后在 TODO.md 添加冲突说明任务
2. 遇到任务冲突：
   - 检查另一个 agent 的进度
   - 如果超过 30 分钟无更新，可以接管任务
   - 在任务描述中记录交接信息
```

**成本：** 零，立即可用
**效果：** 解决 80% 的冲突问题

---

### 阶段 2：中期优化（1-2 周）
**方案 A + 方案 C（Worktree）**

```bash
# 添加 agent 工作区管理脚本
# scripts/agent-workspace.sh

#!/bin/bash

# 创建 agent 工作区
create_agent_workspace() {
  agent_id=$1
  task_id=$2
  branch_name="agent-${agent_id}-task-${task_id}"
  worktree_path=".worktrees/${branch_name}"

  git worktree add "$worktree_path" -b "$branch_name"
  echo "Agent workspace created: $worktree_path"
}

# 合并 agent 工作
merge_agent_work() {
  branch_name=$1
  git checkout main
  git merge "$branch_name" --no-ff -m "Merge agent work: $branch_name"
  git worktree remove ".worktrees/$branch_name"
}
```

**使用场景：**
- 简单任务：直接在 main 分支工作（方案 A）
- 复杂任务：使用独立 worktree（方案 C）

**成本：** 1-2 天开发
**效果：** 解决 95% 的冲突问题

---

### 阶段 3：长期方案（1-3 月）
**方案 B（任务队列服务）**

仅在以下情况考虑：
- 同时运行 5+ agents
- 任务吞吐量 > 50 tasks/day
- 需要精确的任务调度和监控

---

## 实施建议

### 立即行动（今天）
1. ✅ 创建 `AGENTS.md` 文档（规范约定）
2. ✅ 在 TODO.md 添加 agent ID 和时间戳格式
3. ✅ 测试：启动 2 个 agent 并行工作

### 短期行动（本周）
1. ⏳ 实现 `scripts/agent-workspace.sh` 脚本
2. ⏳ 添加 pre-commit hook 检测冲突
3. ⏳ 监控冲突频率，评估效果

### 长期行动（按需）
1. ⏸️ 评估是否需要任务队列服务
2. ⏸️ 实现冲突预测器（可选）

---

## 监控指标

```typescript
// 冲突监控指标
interface ConflictMetrics {
  // 任务冲突率
  taskConflictRate: number;  // 多个 agent 选择同一任务的比例

  // Git 冲突率
  gitConflictRate: number;   // merge conflicts / total commits

  // 平均解决时间
  avgResolutionTime: number; // 冲突解决耗时（分钟）

  // Agent 效率
  agentEfficiency: Map<string, number>; // 有效工作时间 / 总时间
}
```

**目标：**
- 任务冲突率 < 5%
- Git 冲突率 < 10%
- 平均解决时间 < 10 分钟

---

## 参考案例

### 业界实践

**1. Kubernetes Controller Pattern**
- 多个 controller 监听同一资源
- 使用 Optimistic Locking（resourceVersion）
- 冲突时重试

**2. Git 本身的设计**
- 分布式，每个开发者独立分支
- 最终通过 merge 整合
- 冲突时人工介入

**3. Bazel 构建系统**
- 细粒度依赖图
- 并行构建，避免冲突
- 确定性输出

**4. Actor Model (Erlang/Akka)**
- 每个 actor 独立状态
- 通过消息传递通信
- 无共享状态，无锁

---

## 总结

**推荐路径：** 渐进式混合方案

1. **现在：** 方案 A（规范约定） ← 立即实施
2. **下周：** 方案 A + 方案 C（Worktree） ← 按需添加
3. **未来：** 方案 B（任务队列） ← 规模化后考虑

**核心原则：**
- 从简单开始，按需演进
- 优先预防，而非事后处理
- 自动化 > 人工介入
- 监控指标驱动优化

---

**下一步：** 创建 `AGENTS.md` 文档，定义协作规范
