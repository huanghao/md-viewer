# 代码健康问题清单

## 2026-07-22 Agent 功能关键路径缺自动化测试覆盖
- 位置：`src/agent-storage.ts`（sqlite 存储层）、`src/handlers/agent-handlers.ts`（spawn + stream-json 解析 + SSE 广播）、`src/client/agent-runner.ts`（前端 chat 状态机）
- 问题：spawn headless claude CLI、解析 stream-json 事件、session 并发锁（tryMarkAgentRunning/markAgentIdle）、token/费用落库这些核心逻辑目前只手工 curl 验证过，没有任何自动化测试；`tests/unit/` 下已有的测试对这批新文件零覆盖。
- 建议：至少给 `handleAgentEventLine`（事件行解析 → transcript/usage 提取）和 `agent-storage.ts` 的 session 状态转换（tryMarkAgentRunning 的并发锁语义、ensure/set/reset 三个函数的边界条件）补单元测试；`streamAgentRun` 的进程 spawn 部分可以先跳过，用一个可注入 fake stdout 的方式测 `handleAgentEventLine`。
- 风险：涉及新增测试基础设施/mock 方式的选择，量也不小，超出本轮"顺手修复"的范围，需要单独安排。

## 2026-07-22 server/client 重复解析 stream-json 事件块（现已三处，含 pi 分支）
- 位置：`src/handlers/agent-handlers.ts`（`extractToolResultText`/`truncate`/`fmtTokens`/`handleAgentEventLine` 对 claude stream-json 的解析）、`src/pi-agent.ts`（`truncate`/`fmtTokens`/`handlePiEventLine` 对 pi `--mode json` 事件的解析，形状不同但目的一样）、`src/client/agent-runner.ts`（`extractToolResultText`/`truncate`/`fmtTokens`/`handleAgentProgressEvent` 里几乎相同的解析与格式化逻辑）
- 问题：同一套「事件行 → transcript 片段 → 展示文案」的逻辑在服务端两条 backend 路径 + 前端一共写了三遍，`fmtTokens` 这个纯格式化函数三处逐字重复（Kimi/Codex 接入 pi 这轮又新增了一份）。后续 token 展示格式或 stream-json 形状变化，容易漏改其中一处。
- 建议：抽一个不依赖 Bun/DOM 的纯函数模块（比如 `src/shared/agent-format.ts`），至少先把 `fmtTokens`/`truncate` 这类零依赖的纯函数收敛到一处，server 两条 backend 路径和 client 分别引用；事件解析本身因 claude/pi 形状不同，可以保留各自实现。
- 风险：项目目前没有 `shared/` 目录，client 与 server 的类型/工具一直是各自维护一份（如 `AgentRun`/`AgentSession` 接口在 `agent-storage.ts` 和 `client/api/agent.ts` 里就各定义一遍，这是既有模式），引入跨端共享模块要确认构建流程（`build.ts`/client bundler）能正确处理，属于新增抽象/改变现有约定，不在本轮"明显问题"范围内直接改。
