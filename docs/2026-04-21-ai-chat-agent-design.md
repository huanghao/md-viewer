# AI Chat & Agent 功能设计

## 背景

mdv 是一个本地 MD/PDF 查看器，用户在阅读文档时需要 AI 辅助：解释段落、回答问题、修改文档。本文设计两种 AI 模式的集成方案。

## 两种模式

### 模式 A：Chat（优先实现）

**定位**：轻量问答，每个文件一个对话，AI 只能回答不能修改文件。

- 无 tool，无副作用
- 上下文 = 当前文件内容 + 用户选中文本（可选）
- **手动触发**：点击工具栏"Chat"按钮或 popover 里"Ask AI"才创建对话，不自动创建
- 适合：解释段落、翻译、总结、提问

#### 上下文管理

Chat 模式的上下文分三层：

1. **System prompt（固定，每次请求携带）**：当前文件完整内容（截断到 ~50k chars）。由 server 端读取，不由前端传输。
2. **对话历史（前端内存维护）**：`ChatMessage[]`，随每次请求发给 server。切换文件时清空，不持久化到磁盘。历史只存当次会话，关闭侧边栏即丢弃。
3. **选中文本（每条消息可选附加）**：用户选中文本后点"Ask AI"，选中内容作为当条 user message 的附加上下文，不进入 system prompt。

**资源管理**：Chat 模式无需回收——server 端无状态，每次请求携带完整 history，不在 server 端维护 session。关闭侧边栏即释放内存中的历史。

### 模式 B：Agent（后续实现）

**定位**：有 tool 的 agent，可以读写文件、执行命令，修改文档本身。

- 有 tool：read_file、write_file、bash
- 独立进程，手动启动，通过 session ID 关联
- 多个工作区可以共享同一个 agent
- 适合：重构文档、批量修改、跨文件操作

---

## 架构

### 模式 A 架构

```
┌─────────────────────────────────────────────────────────┐
│  mdv 浏览器前端                                           │
│                                                         │
│  ┌──────────────┐    ┌───────────────────────────────┐  │
│  │  文档查看区   │    │  Chat 侧边栏                   │  │
│  │  (现有)      │    │  - 消息列表                    │  │
│  │              │    │  - 输入框                      │  │
│  │  选中文本 ───────→ │  - 选中文本高亮显示            │  │
│  └──────────────┘    └───────────────┬───────────────┘  │
└────────────────────────────────────── │ ────────────────┘
                                        │ POST /api/chat
                                        ↓
┌─────────────────────────────────────────────────────────┐
│  mdv server (Hono/Bun，现有)                             │
│                                                         │
│  新增：/api/chat 端点（无状态）                           │
│  - 接收 { message, filePath, selectedText, history }    │
│  - server 端读取 filePath 内容注入 system prompt         │
│  - 调用 Anthropic API（ANTHROPIC_BASE_URL）              │
│  - SSE 流式返回                                          │
└─────────────────────────────────────────────────────────┘
                                        │
                                        ↓
                              Anthropic API
```

**关键决策**：chat 请求由 mdv server 转发，不从浏览器直接调 API。原因：
1. 认证信息（ANTHROPIC_AUTH_TOKEN）在 server 端，不暴露到浏览器
2. mdv server 已经在跑，不需要额外进程
3. server 端读取文件内容，前端只传 filePath + message + selectedText

### 模式 B 架构

```
┌─────────────────────────────────────────────────────────┐
│  mdv 浏览器前端                                           │
│                                                         │
│  ┌──────────────┐    ┌───────────────────────────────┐  │
│  │  文档查看区   │    │  Agent 侧边栏                  │  │
│  │  (现有)      │    │  - 消息列表（含 tool 调用展示） │  │
│  │              │    │  - 输入框                      │  │
│  │              │    │  - Agent 连接状态               │  │
│  └──────────────┘    └───────────────┬───────────────┘  │
└────────────────────────────────────── │ ────────────────┘
                                        │ POST /chat (sessionId)
                                        ↓
┌─────────────────────────────────────────────────────────┐
│  Agent Server（独立进程，手动启动）                        │
│  bun run agent-server/server.ts                         │
│                                                         │
│  - 维护 sessions: Map<sessionId, MessageHistory>        │
│  - 完整 agent loop（tool 执行）                          │
│  - tools: read_file, write_file, bash                   │
│  - 可服务多个工作区（通过不同 sessionId）                  │
└─────────────────────────────────────────────────────────┘
                                        │
                                        ↓
                              Anthropic API
```

**Agent 生命周期**：
- 用户在 terminal 手动启动：`bun run agent-server/server.ts`
- mdv UI 里输入 agent URL（默认 `http://localhost:3003`）
- 不同工作区可以用同一个 agent URL + 不同 sessionId
- 也可以用同一个 sessionId 让两个工作区共享上下文

---

## Chat 模式详细设计（优先实现）

### 1. Server 端：新增 `/api/chat` 端点

位置：`src/handlers.ts`（新增 `handleChat`）

请求格式：
```typescript
interface ChatRequest {
  message: string;
  filePath: string;        // server 端用此路径读取文件内容
  selectedText?: string;   // 用户选中的文本，附加到 user message
  history: ChatMessage[];  // 前端维护的完整对话历史
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
```

响应：SSE 流，每行 `data: {"type":"delta","text":"..."}` 或 `data: {"type":"done"}`

System prompt 构造：
```
你是一个文档阅读助手。当前用户正在阅读：{filePath}

文档内容：
{fileContent}  // server 端读取，截断到 ~50k chars

请根据文档内容回答用户的问题。不要修改文档，只提供解释和建议。
```

User message 构造（当有选中文本时）：
```
{用户输入的问题}

[选中内容]
{selectedText}
```

认证：直接读 `process.env.ANTHROPIC_AUTH_TOKEN` 和 `ANTHROPIC_BASE_URL`，和 demo 一致。

### 2. 前端：Chat 侧边栏

位置：新文件 `src/client/ui/chat-sidebar.ts`

**键盘行为**：
- `Enter`：发送消息
- `Shift+Enter`：输入框内换行
- `Escape`：关闭侧边栏

UI 结构：
```
┌─────────────────────────┐
│ Chat  [当前文件名]  [×] │  ← header，× 关闭
├─────────────────────────┤
│                         │
│  [用户消息气泡]          │
│                         │
│  [AI 回复，markdown]    │
│  ▌ (流式光标)           │
│                         │
├─────────────────────────┤
│ 选中文本：              │  ← 仅当有选中文本时显示
│ "xxx..."           [×]  │  ← × 清除选中文本
├─────────────────────────┤
│ [输入框]        [发送]  │  ← Enter 发送，Shift+Enter 换行
└─────────────────────────┘
```

触发方式：
1. 工具栏按钮"Chat"打开侧边栏（空对话）
2. 选中文本后，annotation popover 里"Ask AI"按钮，自动带入选中文本并打开侧边栏

状态管理：
- 对话历史存在内存，切换文件时清空
- 不持久化到磁盘

### 3. 与现有 annotation sidebar 的关系

Chat 集成进现有右侧边栏，不新增独立侧边栏。

**Tab 结构**：在现有「评论 | 译」基础上加入 Chat tab：
```
评论 | ✨ Chat | 译       [⊞]  [×]
```

**合并/拆分**：tab 旁的 `⊞` 图标可将侧边栏拆分为两个独立面板（评论 + Chat 并排），`⊟` 合并回来。

**状态机（3 个维度，最多 2 步到达任何状态）**：
1. 侧边栏开/关 — 工具栏右侧 `⊙` 按钮
2. 合并/拆分 — 面板内 `⊞/⊟` 按钮
3. 当前 tab — 合并模式下点 tab 切换

**Ask AI 入口（两个，行为一致）**：
1. 拖拽选文 → 小 popover → `✨` 图标
2. 点击已有批注下划线 → annotationPopover → `✨ Ask AI` 按钮

两个入口都把对应文本带入 Chat 侧边栏的「选中内容」栏。

---

## Agent 模式详细设计（后续实现）

### Agent Server 扩展

在现有 `agent-server/server.ts` 基础上：
- 增加 `GET /sessions` 列出活跃 sessions
- 增加 session 元数据（关联的文件路径、工作区）
- 增加 `/api/inject` 端点：mdv 可以向 agent 注入上下文（当前文件内容、选中文本）

### mdv 集成

mdv server 新增：
- `GET /api/agent-status`：检查 agent server 是否可达
- Agent URL 配置存 localStorage

前端 Agent 侧边栏额外功能（相比 Chat）：
- Tool 调用可视化（显示执行了什么命令、读写了什么文件）
- "应用修改"按钮：agent 修改文件后，mdv 重新加载文档
- Session 管理：查看/切换/清空

---

## 实现顺序

### Phase 1：Chat 模式（2-3 天）

1. `src/handlers.ts` 新增 `handleChat`，接入 Anthropic API
2. `src/server.ts` 注册 `/api/chat` 路由
3. `src/client/ui/chat-sidebar.ts` 新建 chat 侧边栏
4. `src/client/annotation.ts` 在 popover 加"Ask AI"按钮
5. `src/client/main.ts` 连接 chat sidebar 和文件切换事件

### Phase 2：Agent 模式（后续）

1. 完善 `agent-server/server.ts`（session 管理、inject 端点）
2. mdv 前端 Agent 侧边栏
3. Agent 连接配置 UI

---

## 环境变量

mdv server 需要：
```bash
ANTHROPIC_BASE_URL=<API endpoint>
ANTHROPIC_AUTH_TOKEN=<token>
```

启动方式：确保上述环境变量已设置后运行：
```bash
just dev
```

---

## 未解决的问题

1. **文件内容截断策略**：大 PDF/MD 文件如何截断？优先取选中文本周围的段落，还是整个文档？
2. **PDF 支持**：PDF 的文本内容如何传给 AI？用现有的 text layer 还是单独提取？
3. **对话历史持久化**：Chat 历史要不要存到磁盘？存在哪里（annotation storage 旁边？）
4. **模型选择**：默认用 haiku（便宜快），还是让用户选？
5. **费用控制**：API 是否有配额限制？是否需要在 UI 里显示 token 消耗？
