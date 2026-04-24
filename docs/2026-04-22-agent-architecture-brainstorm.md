# Agent 架构脑暴

## 三个核心问题

1. 进程管理：怎么启动、保活、崩溃恢复、资源回收
2. 文档关联：agent 和文档的关系模型是什么
3. 参数系统：CC 的启动参数和运行时参数怎么处理

---

## 问题一：进程管理

### 现实情况

agent-server 是一个独立的 Bun 进程，mdv server 是另一个进程。用户可能让 mdv 跑好几天不关。这期间 agent 进程可能：
- 内存泄漏（长对话历史积累）
- 崩溃（网络错误、bug）
- token 超限导致请求失败
- API token 过期

### 谁来管理 agent 进程？

**方案 A：用户手动管理**
用户自己在 terminal 跑 `bun run agent-server/server.ts`，mdv UI 里填 agent URL。
- 优点：最简单，完全透明
- 缺点：用户需要手动重启，崩溃了不知道

**方案 B：mdv server 作为父进程，spawn agent**
mdv server 在启动时（或用户触发时）spawn agent 子进程，监控它的 stdout/stderr，崩溃时自动重启。
- 优点：用户无感知，一键启动
- 缺点：mdv server 自己挂了，agent 也没了；两个进程耦合

**方案 C：系统级守护进程（launchd / systemd）**
用 launchd plist（macOS）注册为常驻服务，崩溃自动重启，开机自启。
- 优点：最稳定，完全独立于 mdv
- 缺点：配置复杂，用户需要手动 setup

**方案 D：mdv server 内嵌 agent（同进程）**
agent loop 直接在 mdv server 进程里跑，不是独立进程。
- 优点：最简单，无 IPC
- 缺点：agent 崩溃会拖垮 mdv；重量级操作（bash 工具）会阻塞 server

### 推荐方案

**短期（Phase 1）：方案 A（手动）**
先验证功能，不做进程管理。用户知道自己在用什么。

**中期（Phase 2）：方案 B（mdv spawn）**
mdv server 用 `child_process.spawn` 启动 agent，用 `respawn` 逻辑（崩溃后 delay 重启，避免快速循环）。这是 CC 本身的做法——CC 也是一个进程，你在 terminal 里跑它，terminal 就是它的父进程。

### 资源回收

**Session 不自动过期**：用户的 session 经常会持续好几天甚至更长，不应该按时间自动销毁。参考 CC 的模式——session 一直存在，用户主动 `/new` 才开新的。

**内存管理策略**：
- session 的 AgentMessage[] 常驻内存，不主动回收
- 超长对话通过 compaction 压缩（pi-mono 已内置），而不是丢弃
- 进程重启时从 JSONL 文件恢复，内存压力自然释放

**内存上限**：单个 session 的 AgentMessage[] 超过一定大小时触发 compaction（pi-mono 已内置）。

### 崩溃处理

**agent 进程崩溃**：
- session 文件（JSONL）是 append-only，崩溃不会损坏
- 重启后从文件恢复，用户继续对话感知不到中断
- 前端检测到 SSE 断开，显示"重连中..."，自动重试

**API token 过期**：

token 过期只能靠 API 返回 401 来发现，无法在客户端提前判断。

**mdv 的处理策略**：
- `getApiKey` hook 每次 LLM 调用前从配置动态读取（不缓存），确保 token 刷新后立即生效
- 收到 401 时，前端提示用户刷新 token
- 不需要重启进程，刷新后直接重试请求

---

## 问题二：文档关联模型

### CC 的模式 vs mdv 的模式

**CC 的模式**：一个 terminal = 一个 agent，工作目录是 cwd，agent 知道整个目录。用户通过对话告诉 agent 要做什么。文档是 agent 的操作对象，不是 agent 的容器。

**mdv 的模式**：用户以文档为核心工作，打开多个文档，每个文档有自己的批注、翻译、阅读进度。文档是第一公民。

这两个模式的核心差异：**CC 是"以 agent 为中心"，mdv 需要"以文档为中心"**。

### 关联模型的几种选项

**模型 A：一个 workspace 一个 agent**
一个工作目录（workspace）对应一个 agent session。打开同一目录下的多个文档，都和同一个 agent 对话。agent 的 cwd 就是 workspace 路径。

```
workspace: ~/projects/my-book/
  ├── chapter1.md  ─┐
  ├── chapter2.md  ─┼─→ agent session (cwd: ~/projects/my-book/)
  └── chapter3.md  ─┘
```

- 优点：agent 有整个 workspace 的上下文，可以跨文档操作
- 缺点：不同文档的对话混在一起，上下文容易乱

**模型 B：一个文档一个 agent session**
每个文件路径对应一个独立 session。agent 的 system prompt 里注入这个文件的内容。

```
chapter1.md → agent session A
chapter2.md → agent session B
```

- 优点：上下文干净，每个文档的对话独立
- 缺点：跨文档操作做不了；打开 10 个文档就有 10 个 session

**模型 C：手动关联（用户决定）**
用户手动启动 agent，手动选择关联哪些文档或 workspace。类似 OpenClaw 的 session 模式——session 是独立实体，用户决定把哪个 session 挂到哪个窗口。

```
agent session X ──→ 用户手动关联 ──→ chapter1.md（当前聚焦文档）
                                   ↘ chapter2.md（可选关联）
```

- 优点：最灵活，用户完全控制
- 缺点：需要 UI 来管理关联关系，复杂

**模型 D：动态上下文注入（通知机制）**
agent 是全局的，但每次用户发消息时，mdv 自动把"当前聚焦文档"的内容注入到消息里。不是 session 级别的关联，而是消息级别的上下文。

```
用户发消息 → mdv 自动附加 {当前文件内容 + 选中文本} → agent
```

类似 pi-mono 的 `appendSystemPrompt` 或 `transformContext`——每次 LLM 调用前动态注入。

- 优点：agent 永远知道当前上下文，不需要维护关联关系
- 缺点：每条消息都携带文件内容，token 消耗高；agent 无法"记住"之前看过的文档

### 推荐方案

**模型 D（动态注入）+ 目录级别 session 组合**

- agent session 绑定到一个**目录**（可以是 workspace 根目录，也可以是子目录——用户决定粒度）
- 每次用户发消息，自动注入当前聚焦文档的内容和选中文本
- agent 可以用 read_file、write_file 等工具操作该目录下的任意文件

目录粒度由用户决定：workspace 是最自然的默认选项（和 CC 的 cwd 一致），但用户也可以选择某个子目录作为 agent 的工作范围。

**消息格式**：
```
用户消息：
  [当前文档: chapter1.md]
  [选中内容: "xxx..."]（可选）
  
  用户的问题
```

**Session 生命周期**：
- session 由用户手动创建（不自动创建）
- session 持久化到磁盘（JSONL），重启后恢复
- 用户可以在 UI 里看到 session 历史，选择"新建"或"继续"

**一个目录可以有多个 agent session**：
用户可能同时跑多个 agent，每个有不同的目的（一个负责写代码、一个负责写文档、一个用不同模型做 review）。这要求 UI 能展示和切换多个 session——右侧边栏一个 tab 可能不够用，需要进一步设计（见待解决问题）。

### OpenClaw session 模式的启发

OpenClaw 把 IM 输入框和 session 分离——输入框只是当前 session 的入口，session 本身是独立实体，可以切换、分支、归档。

- mdv 的 Chat 侧边栏 = 当前 session 的输入/输出窗口
- session = 独立实体，有自己的历史、模型、工具配置、绑定目录
- 用户在侧边栏顶部切换 session，或新建 session
- **session 和侧边栏是多对一关系**：同一个侧边栏可以切换显示不同 session，但同一时刻只显示一个

---

## 问题三：参数系统

### CC 的参数分类

**启动时参数**（进程级别，启动后不变）：
- `--dangerously-skip-permissions`：跳过所有权限确认（你说的最常用的）
- `--model`：指定模型
- `--tools` / `--no-tools`：工具白名单
- `--system-prompt` / `--append-system-prompt`：自定义 system prompt
- `--session` / `--continue` / `--resume`：session 管理
- `--extension`：加载扩展

**运行时可变参数**（对话中途可改）：
- 模型切换：`setModel()`，对话中途换模型
- thinking level：`setThinkingLevel()`
- 工具开关：`setActiveToolsByName()`

### pi-mono 参数 vs CC 参数对比

pi-mono 的参数解析在 `cli/args.ts`，运行时变更通过 `AgentSession.setModel()`、`setThinkingLevel()` 等方法，自动持久化到 session JSONL（`model_change`、`thinking_level_change` entry 类型）——即**运行时参数变更会被记录，恢复 session 时重放**。

| 功能 | CC | pi-mono | 说明 |
|---|---|---|---|
| 跳过权限确认 | `--dangerously-skip-permissions` | **不存在** | pi 通过 Extension `tool_call` 事件实现，见下 |
| 模型选择 | `--model` | `--model` | 完全相同 |
| Provider 选择 | 无 | `--provider` | pi 支持多 provider |
| 工具管理 | `--tools` / `--no-tools` | `--tools` / `--no-tools` | 完全相同 |
| System prompt | `--system-prompt` / `--append-system-prompt` | 同上 | 完全相同 |
| Session 管理 | `--session` / `--continue` / `--resume` | 同上 + `--fork` | pi 多了 fork |
| 扩展 | `--extension` | `--extension` / `--skill` / `--theme` | pi 更细化 |
| Thinking | 无独立参数 | `--thinking off/low/medium/high` | pi 有独立参数 |
| 模型轮换 | 无 | `--models a,b,c` | Ctrl+P 循环切换 |
| 输出格式 | `--print` / `--output-format` | `--print` / `--mode` | 类似 |
| 导出 | 无 | `--export <file>` | 导出为 HTML |

### mdv 的参数方案

**启动参数（进程级别）**：
存在 localStorage 或 mdv 的 config 文件里，启动 agent-server 时作为环境变量或命令行参数传入。

```typescript
// 用户在 mdv 设置里配置
interface AgentConfig {
  skipPermissions: boolean;      // --dangerously-skip-permissions
  model: string;                 // 默认模型
  allowedTools: string[];        // 工具白名单，空=全部允许
  appendSystemPrompt?: string;   // 追加到 system prompt
  agentUrl: string;              // agent server URL
}
```

**运行时参数（对话中途可变）**：
通过 agent-server 的 REST API 暴露：
```
PATCH /session/:id/model { model: "claude-opus-4-7" }
PATCH /session/:id/thinking { level: "high" }
PATCH /session/:id/tools { tools: ["read_file", "write_file"] }
```

前端在 Chat 侧边栏顶部提供快捷切换（模型选择、thinking 开关）。

**`--dangerously-skip-permissions` 的处理**：

CC 用一个全局 flag 跳过所有权限确认。**pi-mono 没有这个参数**，而是通过 Extension 系统实现更细粒度的控制：

- 每个工具调用触发 `tool_call` 事件
- Extension 的事件处理器决定是否 `{ block: true }` 阻止，或弹 UI 确认
- 没有注册任何 Extension 时，所有工具调用直接执行（等价于 skip-permissions）

**mdv 的实现方案**：
- 默认模式（等价 skip-permissions）：不注册权限 Extension，所有工具直接执行
- 严格模式：注册一个 Extension，对 write_file / bash 等危险操作弹前端确认框
- 用户在设置里切换模式

**pi-mono 有 sandbox 吗？**

有，但只在 `mom`（Slack bot）包里，不是 coding agent 的核心功能。Sandbox 支持两种模式：
- `host`：直接在本机执行（默认）
- `docker:container-name`：在指定 Docker 容器里执行

对 mdv 来说暂时不需要 sandbox，用 `host` 模式即可。

### 参数 UI 设计

**设置面板（启动参数，不常变）**：
在 mdv 的 settings dialog 里加一个 "Agent" tab：
- Agent URL（默认 localhost:3003）
- 默认模型
- 工具权限模式：严格（每次确认）/ 宽松（自动允许）/ 自定义白名单
- 追加 system prompt（高级）

**侧边栏顶部（运行时参数，常变）**：
在 Chat tab 的 header 区域：
- 模型选择下拉（haiku / sonnet / opus）
- thinking 开关
- 当前 session 名称 + 新建/切换 session 按钮

---

## 总结：推荐的整体架构

```
mdv server（Bun/Hono）
  ├── 现有功能（文件服务、批注、翻译等）
  ├── /api/agent/* → 转发到 agent-server
  └── spawn agent-server（Phase 2，Phase 1 手动启动）

agent-server（独立进程，基于 pi-mono Agent 类）
  ├── sessions: Map<workspaceId, AgentSession>
  ├── 每个 session 持久化到 ~/.mdv/agent/sessions/{workspace}/
  ├── /chat/:sessionId → SSE 流式输出
  ├── /session/:id/model|thinking|tools → 运行时参数
  └── 工具：read_file, write_file, bash（可配置权限）

前端 Chat 侧边栏
  ├── 绑定到当前 workspace 的 session
  ├── 发消息时自动注入当前文档内容 + 选中文本
  ├── 实时展示工具执行过程
  └── session 切换 / 新建
```

**Phase 1 最小实现**：
- agent-server 手动启动（用户自己在 terminal 跑）
- session 由用户手动创建，绑定到目录
- 动态注入当前文档上下文
- 工具：read_file, write_file, bash（默认不弹确认，等价 skip-permissions）
- bash 工具的 cwd = session 绑定的目录（workspace）
- 前端：Chat tab + 消息列表 + 工具执行展示

**待解决的问题**：
1. session 文件存哪里？`~/.mdv/` 还是 workspace 目录下？
2. 多个 mdv 窗口打开同一个 workspace，共享同一个 session 还是各自独立？
3. agent 修改文件后，mdv 的文件监听会自动刷新，但批注锚点可能失效——怎么处理？
4. **一个 workspace 多个 agent session 的 UI 怎么设计？** 右侧边栏一个 tab 可能不够，需要 session 列表面板或独立窗口。

---

## 附录：主流 Agent System Prompt 对比

来源：社区逆向，版本日期见各链接，不代表当前生产版本。

| 维度 | Claude Code (v2.0) | Cursor Agent | GitHub Copilot | pi-mono |
|---|---|---|---|---|
| **开场定位** | "interactive CLI tool for software engineering" | "powerful agentic AI coding assistant in Cursor" | "AI programming assistant called GitHub Copilot" | "expert coding assistant inside pi" |
| **结构风格** | Markdown 标题分节 | XML 标签分节 | 编号规则列表 | 极简 Markdown |
| **指令风格** | 命令式，大量 IMPORTANT/NEVER/CRITICAL | XML 域 + 编号列表 | 纯编号规则，简洁 | 描述式，无强调词 |
| **安全条款** | 详细（defensive only，禁 credential harvesting） | 无（仅工具保密） | 最多（拒绝 jailbreak/roleplay/版权） | 无 |
| **任务管理** | TodoWrite 工具，频繁使用 | todo_write + status_update 规范 | planskill 工具 | 无 |
| **并行调用** | 明确要求多 tool 并行 | CRITICAL 强调，有 multi_tool_use.parallel | 有 parallel 工具 | 无规范 |
| **prompt 长度** | v1: ~13K chars；v2: ~57K chars | v1: ~19K；v2: ~39K | ~1.5K–5K | ~0.8K–10K（可变） |
| **可配置性** | 低（硬编码） | 低（硬编码） | 低（硬编码） | 高（完全可替换/追加/动态注入） |

### 关键设计差异

**CC 的核心理念**（对 mdv 最有参考价值）：
- System prompt 极长（57K chars），大量篇幅描述工具使用规范和边界
- 强调"minimize output tokens"——agent 的回复要短，行动要多
- 明确的 git 操作规范（何时 commit、何时问用户）
- 安全边界写在 prompt 里，不依赖外部配置

**pi-mono 的理念**（mdv agent 可以参考）：
- System prompt 极简，大部分内容动态注入（contextFiles、skills、appendSystemPrompt）
- 没有硬编码的安全限制，完全由配置决定
- 适合 mdv 这种"用户自己的工具"场景——用户信任 agent，不需要 Copilot 那种严格的内容审查

**mdv agent system prompt 建议结构**：
```
你是 mdv 的 AI 助手，帮助用户阅读和编辑文档。

# 当前工作区
路径：{workspacePath}

# 可用工具
{工具列表，动态注入}

# 行为准则
- 修改文件前先确认（除非用户开启了跳过确认模式）
- 优先使用工具操作，少说多做
- 修改文档时保持原有格式风格

{appendSystemPrompt}  ← 用户自定义追加
```

来源链接：
- [CC system prompt (x1xhlol)](https://github.com/x1xhlol/system-prompts-and-models-of-ai-tools/blob/main/Anthropic/Claude%20Code%202.0.txt)
- [Cursor Agent prompt (jujumilk3)](https://github.com/jujumilk3/leaked-system-prompts/blob/main/cursor-ide-agent-claude-sonnet-3.7_20250309.md)
- [GitHub Copilot prompt (jujumilk3)](https://github.com/jujumilk3/leaked-system-prompts/blob/main/github-copilot-chat_20240930.md)
