# AI 上下文管理设计

## 问题

在 mdv 里集成 AI chat，需要解决三个问题：
1. 对话历史怎么维护，绑定到哪个维度
2. 文件内容（system prompt）怎么注入，怎么更新
3. 超出模型上下文长度时怎么办

---

## pi-mono 的做法（参考）

pi-mono 的 coding agent 是一个完整的上下文管理实现，核心机制如下：

### 对话历史

- `Agent` 类维护 `AgentMessage[]`，存在内存里
- 每次 LLM 调用前，先经过 `transformContext()` hook（可以在这里做压缩、注入等），再经过 `convertToLlm()` 把自定义消息类型过滤/转换成标准 LLM 格式
- Session 有持久化：`SessionManager` 可以把消息存盘，切换 session 时从磁盘恢复

### 超出上下文长度

pi-mono 有完整的 **compaction（压缩）** 机制：

1. **Token 计数**：每次 LLM 响应后，从 usage 数据拿到真实 token 数；没有真实数据时用 chars/4 启发式估算
2. **阈值检测**：`shouldCompact(contextTokens, contextWindow, settings)` — 当 `contextTokens > contextWindow - reserveTokens` 时触发（reserveTokens 默认 16k，留给模型输出）
3. **压缩流程**：调用 LLM 对历史对话生成摘要，用摘要替换旧消息，保留最近几条消息保持连续性
4. **溢出重试**：如果请求因 context overflow 失败，自动触发压缩后重试

### System Prompt

- 基础 system prompt 在 `AgentSession` 初始化时构建，包含：工具列表、工作目录、当前日期、项目上下文文件（CLAUDE.md 等）
- 工具变更时重新构建
- 通过 `appendSystemPrompt` 支持动态注入（extension 系统用这个注入资源内容）

### Prompt Caching

- 在 system prompt 和工具定义上加 `cache_control: { type: "ephemeral" }`
- 在最后一条 user message 上也加缓存控制
- 默认 short TTL，可通过 `PI_CACHE_RETENTION=long` 改为 1h（仅官方 API）

---

## mdv Chat 的上下文需求

mdv Chat 比 coding agent 简单很多：

| 维度 | coding agent | mdv chat |
|------|-------------|----------|
| 工具调用 | 有，复杂 | 无 |
| Session 持久化 | 需要 | 暂不需要 |
| 多 agent 协作 | 有 | 无 |
| 上下文压缩 | 完整实现 | 需要，但可以简化 |
| System prompt | 动态构建 | 相对固定 |

### System Prompt 设计

```
你是一个文档阅读助手。

# 当前文档
路径：{filePath}
类型：{markdown | pdf}

# 文档内容
{fileContent}

# 说明
请根据文档内容回答用户的问题。如果用户提供了选中内容，优先围绕选中内容回答。
不要修改文档，只提供解释、翻译、总结和建议。
```

**文件内容注入策略**：
- server 端每次请求时实时读取文件，不缓存
- MD 文件：直接读全文，截断到 ~60k chars（约 15k tokens）
- PDF 文件：用现有 text layer 提取文本，截断到 ~60k chars
- 截断时优先保留选中文本周围的段落（±5000 chars）

**System prompt 更新时机**：
- 每次用户发消息时重新构造（server 端读最新文件内容）
- 用户切换文件时，前端清空对话历史，下一条消息自动用新文件

### 对话历史绑定维度

**绑定到文件路径**（`Map<filePath, ChatMessage[]>`）：

```typescript
// 前端维护
const chatHistories = new Map<string, ChatMessage[]>();

function getHistory(filePath: string): ChatMessage[] {
  return chatHistories.get(filePath) ?? [];
}
function appendHistory(filePath: string, msg: ChatMessage) {
  const h = getHistory(filePath);
  h.push(msg);
  chatHistories.set(filePath, h);
}
```

好处：切换文件时历史不丢，回来还在。
代价：需要管理多个文件的历史，内存占用略高（但对话通常不长）。

### 超出上下文长度的处理

**三道防线**：

**第一道：截断文件内容**（server 端）
- 文件内容是 system prompt 的主要来源，截断到 60k chars
- 60k chars ≈ 15k tokens，加上对话历史，总共控制在 100k tokens 以内
- 对 haiku（200k context）绰绰有余

**第二道：前端历史截断**（前端）
- 发送请求前，估算历史 token 数（chars / 4）
- 如果历史超过 ~80k tokens，从最旧的消息开始丢弃，保留最近 N 条
- 简单实现，不做 summarize（mdv chat 场景不需要那么复杂）

```typescript
function trimHistory(history: ChatMessage[], maxTokens = 80000): ChatMessage[] {
  let total = 0;
  const result: ChatMessage[] = [];
  for (let i = history.length - 1; i >= 0; i--) {
    const tokens = Math.ceil(history[i].content.length / 4);
    if (total + tokens > maxTokens) break;
    result.unshift(history[i]);
    total += tokens;
  }
  return result;
}
```

**第三道：API 错误处理**（server 端）
- 如果 API 返回 context overflow 错误，server 返回特定错误码
- 前端提示用户"对话历史过长，已自动清空，请重新提问"，并清空历史

---

## 自己写 vs 用现成框架

### 选项 A：自己写（推荐 Phase 1）

实现量：约 200 行 TypeScript（server 端 handler + 前端历史管理）

优点：
- 完全控制，没有依赖
- 对 mdv chat 场景足够，不需要 compaction 这种重机制
- server 端已有 Hono + Anthropic SDK，直接加一个 handler

缺点：
- 没有 compaction，长对话会丢失早期历史（但对阅读场景影响不大）

### 选项 B：用 pi-mono 的 Agent 类（后续 agent 模式可考虑）

pi-mono 的 `Agent` + `AgentLoopConfig` 提供了完整的上下文管理，包括 compaction、transformContext、session 持久化。

但对 Chat 模式来说太重了：
- 需要 `convertToLlm`、`transformContext` 等配置
- compaction 需要额外的 LLM 调用（成本）
- 没有 tool 的 chat 用不到大部分功能

**结论**：Chat 模式自己写，Agent 模式（Phase 2）可以考虑用 pi-mono 的 Agent 类或直接用 CC SDK。

### 选项 C：用 Vercel AI SDK

提供 `useChat` hook，内置历史管理、流式渲染、错误处理。

但 mdv 前端是纯 TypeScript（无 React/Vue），`useChat` 是 React hook，不适用。

---

## 实现方案总结

```
前端：
  Map<filePath, ChatMessage[]>  ← 对话历史，绑定文件
  trimHistory()                 ← 超长时截断旧消息
  发送：{ message, filePath, selectedText, history: trimHistory(getHistory(filePath)) }

Server 端 /api/chat：
  读取 filePath 文件内容（实时，每次请求）
  截断到 60k chars（优先保留 selectedText 周围段落）
  构造 system prompt
  调用 Anthropic SDK（streaming）
  SSE 流式返回 delta
  
前端收到响应后：
  appendHistory(filePath, { role: 'user', content: message })
  appendHistory(filePath, { role: 'assistant', content: fullResponse })
```

这个方案实现简单，对 mdv 阅读场景完全够用，不引入新依赖。
