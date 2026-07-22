# 代码健康问题清单

## 2026-07-22 Agent 功能关键路径缺自动化测试覆盖
- 位置：`src/agent-storage.ts`（sqlite 存储层）、`src/handlers/agent-handlers.ts`（spawn + stream-json 解析 + SSE 广播）、`src/client/agent-runner.ts`（前端 chat 状态机）
- 问题：spawn headless claude CLI、解析 stream-json 事件、session 并发锁（tryMarkAgentRunning/markAgentIdle）、token/费用落库这些核心逻辑目前只手工 curl 验证过，没有任何自动化测试；`tests/unit/` 下已有的测试对这批新文件零覆盖。
- 建议：至少给 `handleAgentEventLine`（事件行解析 → transcript/usage 提取）和 `agent-storage.ts` 的 session 状态转换（tryMarkAgentRunning 的并发锁语义、ensure/set/reset 三个函数的边界条件）补单元测试；`streamAgentRun` 的进程 spawn 部分可以先跳过，用一个可注入 fake stdout 的方式测 `handleAgentEventLine`。
- 风险：涉及新增测试基础设施/mock 方式的选择，量也不小，超出本轮"顺手修复"的范围，需要单独安排。

## 2026-07-22 server/client 重复解析 stream-json 事件块
- 位置：`src/handlers/agent-handlers.ts:93-190`（`extractToolResultText`/`truncate`/`handleAgentEventLine` 中对 assistant/tool_use/tool_result 的解析）与 `src/client/agent-runner.ts:42-52,250-275`（`extractToolResultText`/`truncate`/`handleAgentProgressEvent` 里几乎相同的解析逻辑）
- 问题：同一套 stream-json 事件结构（`assistant.message.content[].type` 为 `text`/`tool_use`，`user.message.content[].type` 为 `tool_result`）在服务端落库和前端渲染两处各写了一遍，包括 `extractToolResultText` 和 `truncate` 两个工具函数完全重复。后续 CLI 输出格式一旦变化，容易只改一处、另一处悄悄漂移。
- 建议：抽一个不依赖 Bun/DOM 的纯函数模块（比如 `src/shared/agent-event-parser.ts`），把「解析一个 stream-json 事件 → 提取 text/tool/tool-result 片段」的逻辑收敛到一处，服务端和客户端分别引用。
- 风险：项目目前没有 `shared/` 目录，client 与 server 的类型/工具一直是各自维护一份（如 `AgentRun`/`AgentSession` 接口在 `agent-storage.ts` 和 `client/api/agent.ts` 里就各定义一遍，这是既有模式），引入跨端共享模块要确认构建流程（`build.ts`/client bundler）能正确处理，属于新增抽象/改变现有约定，不在本轮"明显问题"范围内直接改。
