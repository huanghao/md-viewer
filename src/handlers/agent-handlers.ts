import { dirname, resolve } from "path";
import { randomUUID } from "crypto";
import type { Context } from "hono";
import { broadcastEvent } from "../sse.ts";
import { listAgentBackendStatuses, resolveAgentCommand } from "../agent-backends.ts";
import { listAnnotations } from "../annotation-storage.ts";
import { isOpen } from "../annotation-status.ts";
import { findWorkspaceForPath, getWorkspaceAgentCommand } from "../workspace-storage.ts";
import {
  ensureAgentSessionId,
  finishAgentRun,
  getAgentRuns,
  getAgentSession,
  getAgentUsageSummary,
  getRunsBySession,
  insertAgentRun,
  listAgentSessionsForWorkspace,
  listRecentAgentRuns,
  markAgentIdle,
  resetAgentSessionId,
  sessionHasHistory,
  setAgentSessionId,
  tryMarkAgentRunning,
  type AgentRunUsage,
  type AgentTranscriptMsg,
} from "../agent-storage.ts";
import { log } from "../utils.ts";
import { buildPiArgv, handlePiEventLine } from "../pi-agent.ts";
import { listPiModels, listPiProviders } from "../pi-models.ts";

export async function handleStartAgentRun(c: Context) {
  const body = await c.req.json<{ path?: string; sessionIdOverride?: string; backend?: string; provider?: string; model?: string; prompt?: string; thinking?: string }>().catch(() => ({}) as any);
  const rawPath = body?.path;
  if (!rawPath) return c.json({ error: "缺少 path 参数" }, 400);

  const docPath = resolve(rawPath);
  const customPrompt = body?.prompt?.trim();

  if (!customPrompt) {
    const openCount = listAnnotations(docPath).filter((a) => isOpen(a.status)).length;
    if (openCount === 0) {
      return c.json({ error: "该文档没有待处理的评论" }, 400);
    }
  }

  const existingSession = getAgentSession(docPath);
  if (existingSession?.running) {
    return c.json({ error: "该文档已有 Agent 运行中" }, 409);
  }

  const sessionId = ensureAgentSessionId(docPath, body?.sessionIdOverride);
  const isResume = sessionHasHistory(sessionId);

  const workspacePath = findWorkspaceForPath(docPath);
  const cwd = workspacePath || dirname(docPath);

  // pi（earendil-works/pi）是并排试用的另一条 Agent 运行时路径，不走 agent-backends.yaml
  // 那套 claude 系 CLI 的 argv/解析逻辑（形状完全不同，见 pi-agent.ts 头部注释），
  // 复用同一套 session/run 存储 + SSE 广播，只是 spawn 和解析这两步单独实现。
  if (body?.backend === "pi") {
    const displayPrompt = customPrompt || "处理这个文档的批注";
    const sentPrompt = customPrompt
      ? `[当前文档: ${docPath}]\n${customPrompt}`
      : `/mdv 处理这个文件的批注：${docPath}`;
    const argv = buildPiArgv({ prompt: sentPrompt, sessionId, provider: body?.provider || "kimi-coding", model: body?.model, thinking: body?.thinking });

    const runId = randomUUID();
    if (!tryMarkAgentRunning(docPath, runId)) {
      return c.json({ error: "该文档已有 Agent 运行中" }, 409);
    }
    insertAgentRun({ id: runId, docPath, sessionId, workspacePath, command: argv });

    let proc: Bun.Subprocess<"ignore", "pipe", "pipe">;
    try {
      // -p 非交互模式不需要 stdin，显式 ignore 避免子进程挂在悬空的 pipe 上等输入
      proc = Bun.spawn(argv, { cwd, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
    } catch (error: any) {
      finishAgentRun(runId, { status: "error", error: error?.message || "启动 pi 进程失败" });
      markAgentIdle(docPath);
      return c.json({ error: error?.message || "启动 pi 进程失败" }, 500);
    }

    void streamPiAgentRun(proc, { runId, docPath, sessionId, initialPrompt: displayPrompt });

    return c.json({ success: true, runId, sessionId, resumed: isResume, command: argv, backend: "pi" });
  }

  let agentCommand: string[];
  let backendName: string | null;
  try {
    const resolved = resolveAgentCommand(workspacePath ? getWorkspaceAgentCommand(workspacePath) : null, body?.backend?.trim() || null);
    agentCommand = resolved.command;
    backendName = resolved.backendName;
  } catch (error: any) {
    return c.json({ error: error?.message || "Agent backend 不可用" }, 503);
  }

  // displayPrompt：透传给前端/落库展示的原始内容；sentPrompt：实际发给 CLI 的内容——
  // 自定义消息里通常不会带文件路径（比如"这个文件写的是什么"），必须每轮都显式带上文档路径，
  // 否则 agent 会把"这个文件"理解成系统提示里注入的其它文件（比如 CLAUDE.md）。
  const displayPrompt = customPrompt || "处理这个文档的批注";
  const sentPrompt = customPrompt
    ? `[当前文档: ${docPath}]\n${customPrompt}`
    : `/mdv 处理这个文件的批注：${docPath}`;
  const argv = [
    ...agentCommand,
    "-p", sentPrompt,
    isResume ? "--resume" : "--session-id", sessionId,
    "--output-format", "stream-json",
    "--verbose",
    ...(body?.model ? ["--model", body.model] : []),
  ];

  const runId = randomUUID();
  if (!tryMarkAgentRunning(docPath, runId)) {
    return c.json({ error: "该文档已有 Agent 运行中" }, 409);
  }
  insertAgentRun({ id: runId, docPath, sessionId, workspacePath, command: argv });

  let proc: Bun.Subprocess<"ignore", "pipe", "pipe">;
  try {
    proc = Bun.spawn(argv, { cwd, stdout: "pipe", stderr: "pipe" });
  } catch (error: any) {
    finishAgentRun(runId, { status: "error", error: error?.message || "启动 Agent 进程失败" });
    markAgentIdle(docPath);
    return c.json({ error: error?.message || "启动 Agent 进程失败" }, 500);
  }

  void streamAgentRun(proc, { runId, docPath, sessionId, initialPrompt: displayPrompt });

  return c.json({ success: true, runId, sessionId, resumed: isResume, command: agentCommand, backend: backendName });
}

export function handleListAgentBackends(c: Context) {
  // pi 是并排试用的实验性 backend，不进 ~/.config/agent-backends.yaml（那份文件是给
  // agent_client.py 之类通用调用方共享的，pi 的 argv/输出形状跟那套完全不一样，混进去
  // 反而会让别的调用方读到一条它处理不了的声明）——直接在这里拼一条合成的状态项。
  const backends = listAgentBackendStatuses();
  backends.push({
    name: "pi",
    description: "pi（earendil-works/pi）实验性接入，可跟其它 backend 对比",
    default: false,
    // pi 现在挂了多个 provider（kimi-coding/openai-codex/…），每个的默认模型都不一样，
    // 不能再给这个合成 backend 项写死一个——真正的默认模型由客户端按 provider 取模型列表的第一项决定
    defaultModel: null,
    contextWindow: null,
    unavailableReason: Bun.which("pi") ? null : "本机未安装 pi CLI",
  });
  return c.json({ backends });
}

export function handleListPiModels(c: Context) {
  const provider = c.req.query("provider") || "kimi-coding";
  return c.json({ models: listPiModels(provider) });
}

export function handleListPiProviders(c: Context) {
  return c.json({ providers: listPiProviders() });
}

function extractToolResultText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c: any) => (c?.type === "text" ? c.text : "")).filter(Boolean).join("\n");
  }
  return "";
}

function truncate(text: string, max = 400): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

// human-readable token 数，跟客户端 agent-runner.ts 的 fmtTokens 保持一致：不展示价格
// （单价不确定，展示金额容易误导），这段文本会直接存进 transcript_json，历史记录里也不该带 $
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M tokens`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k tokens`;
  return `${n} tokens`;
}

async function streamAgentRun(
  proc: Bun.Subprocess<"ignore", "pipe", "pipe">,
  ctx: { runId: string; docPath: string; sessionId: string; initialPrompt: string }
) {
  const { runId, docPath, sessionId, initialPrompt } = ctx;
  let finalized = false;
  const transcript: AgentTranscriptMsg[] = [{ kind: "user", text: initialPrompt, timestamp: Date.now() }];

  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for await (const chunk of proc.stdout as any as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        finalized = handleAgentEventLine(line, runId, docPath, sessionId, transcript) || finalized;
      }
    }
  } catch (error: any) {
    log(`⚠️ agent run ${runId} stdout 读取失败: ${error?.message || error}`);
  }

  const exitCode = await proc.exited;

  if (!finalized) {
    const stderrText = await new Response(proc.stderr).text().catch(() => "");
    const status = exitCode === 0 ? "success" : "error";
    const error = exitCode === 0 ? undefined : (stderrText || `退出码 ${exitCode}`);
    if (error) transcript.push({ kind: "error", text: error, timestamp: Date.now() });
    finishAgentRun(runId, { status, error, transcript });
    markAgentIdle(docPath);
    broadcastEvent({ type: "agent-run-status", runId, docPath, status });
  }
}

async function streamPiAgentRun(
  proc: Bun.Subprocess<"ignore", "pipe", "pipe">,
  ctx: { runId: string; docPath: string; sessionId: string; initialPrompt: string }
) {
  const { runId, docPath, initialPrompt } = ctx;
  let finalized = false;
  const transcript: AgentTranscriptMsg[] = [{ kind: "user", text: initialPrompt, timestamp: Date.now() }];

  const onFinish = (result: { status: "success" | "error"; usage: AgentRunUsage; error?: string }) => {
    finalized = true;
    finishAgentRun(runId, { ...result, transcript });
    markAgentIdle(docPath);
    broadcastEvent({ type: "agent-run-status", runId, docPath, status: result.status, usage: result.usage });
  };

  const decoder = new TextDecoder();
  let buffer = "";
  try {
    for await (const chunk of proc.stdout as any as AsyncIterable<Uint8Array>) {
      buffer += decoder.decode(chunk, { stream: true });
      let idx: number;
      while ((idx = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 1);
        if (!line) continue;
        // onProgress 把 pi 的事件归一化成 claude 那套 assistant/user 形状再广播，
        // 前端 handleAgentProgressEvent 不用认识 pi 的格式就能实时展示，不用改客户端代码
        handlePiEventLine(line, transcript, onFinish, (evt) => {
          broadcastEvent({ type: "agent-progress", runId, docPath, event: evt });
        });
      }
    }
  } catch (error: any) {
    log(`⚠️ pi run ${runId} stdout 读取失败: ${error?.message || error}`);
  }

  const exitCode = await proc.exited;

  if (!finalized) {
    const stderrText = await new Response(proc.stderr).text().catch(() => "");
    const status = exitCode === 0 ? "success" : "error";
    const error = exitCode === 0 ? undefined : (stderrText || `退出码 ${exitCode}`);
    if (error) transcript.push({ kind: "error", text: error, timestamp: Date.now() });
    finishAgentRun(runId, { status, error, transcript });
    markAgentIdle(docPath);
    broadcastEvent({ type: "agent-run-status", runId, docPath, status });
  }
}

/** 处理一行 stream-json 事件，累积到 transcript；返回 true 表示这行已经把这次运行标记为结束（result 事件）。
 * export 是为了让 tests/unit/agent-handlers-claude-event.test.ts 能直接调用——内部会真的
 * 写 agent_runs/agent_sessions（走跟 streamAgentRun 一样的 finishAgentRun/markAgentIdle），
 * 测试跟 agent-storage-session-lock.test.ts 一样靠 XDG_CONFIG_HOME 换临时库隔离，
 * 不需要 mock，SSE 广播在没有连接的 client 时本来就是空操作。 */
export function handleAgentEventLine(line: string, runId: string, docPath: string, sessionId: string, transcript: AgentTranscriptMsg[]): boolean {
  let event: any;
  try {
    event = JSON.parse(line);
  } catch {
    return false;
  }

  broadcastEvent({ type: "agent-progress", runId, docPath, event });

  const now = Date.now();
  if (event?.type === "assistant") {
    const model = event.message?.model;
    for (const block of event.message?.content ?? []) {
      if (block.type === "thinking" && block.thinking) {
        transcript.push({ kind: "thinking", text: block.thinking, timestamp: now, model });
      } else if (block.type === "text" && block.text) {
        transcript.push({ kind: "text", text: block.text, timestamp: now, model });
      } else if (block.type === "tool_use") {
        const inputSummary = block.input ? truncate(JSON.stringify(block.input), 150) : "";
        transcript.push({ kind: "tool", text: `${block.name}${inputSummary ? " " + inputSummary : ""}`, timestamp: now, model });
      }
    }
  } else if (event?.type === "user") {
    for (const block of event.message?.content ?? []) {
      if (block.type === "tool_result") {
        const text = extractToolResultText(block.content);
        if (text) transcript.push({ kind: "tool-result", text: truncate(text), timestamp: now });
      }
    }
  }

  if (event?.type !== "result") return false;

  const usage: AgentRunUsage = {
    inputTokens: event.usage?.input_tokens,
    outputTokens: event.usage?.output_tokens,
    cacheCreationTokens: event.usage?.cache_creation_input_tokens,
    cacheReadTokens: event.usage?.cache_read_input_tokens,
    costUsd: event.total_cost_usd,
    model: Object.keys(event.modelUsage || {})[0],
  };
  const status = event.is_error ? "error" : "success";
  const tokens = (usage.inputTokens || 0) + (usage.outputTokens || 0);
  if (event.is_error) transcript.push({ kind: "error", text: String(event.result ?? ""), timestamp: now });
  else transcript.push({ kind: "result", text: `✓ 完成${tokens ? " · " + fmtTokens(tokens) : ""}`, timestamp: now });
  finishAgentRun(runId, { status, usage, error: event.is_error ? String(event.result ?? "") : undefined, transcript });
  markAgentIdle(docPath);
  broadcastEvent({ type: "agent-run-status", runId, docPath, status, usage });
  return true;
}

export async function handleGetAgentRuns(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  return c.json({ runs: getAgentRuns(resolve(path)) });
}

export async function handleListRecentAgentRuns(c: Context) {
  const limit = Math.min(Number(c.req.query("limit") ?? "50"), 200);
  const workspace = c.req.query("workspace") || undefined;
  return c.json({ runs: listRecentAgentRuns(limit, workspace) });
}

export async function handleGetAgentUsage(c: Context) {
  const sinceDays = Number(c.req.query("sinceDays") ?? "30");
  const sinceMs = Date.now() - Math.max(1, sinceDays) * 24 * 60 * 60 * 1000;
  return c.json({ summary: getAgentUsageSummary(sinceMs) });
}

export function handleGetAgentSession(c: Context) {
  const path = c.req.query("path");
  if (!path) return c.json({ error: "缺少 path 参数" }, 400);
  return c.json({ session: getAgentSession(resolve(path)) });
}

export function handleListWorkspaceAgentSessions(c: Context) {
  const workspace = c.req.query("workspace");
  if (!workspace) return c.json({ error: "缺少 workspace 参数" }, 400);
  return c.json({ sessions: listAgentSessionsForWorkspace(resolve(workspace)) });
}

export async function handleLinkAgentSession(c: Context) {
  const body = await c.req.json<{ path?: string; sessionId?: string }>().catch(() => ({}) as any);
  if (!body?.path || !body?.sessionId) return c.json({ error: "缺少 path / sessionId 参数" }, 400);
  const ok = setAgentSessionId(resolve(body.path), body.sessionId);
  if (!ok) return c.json({ error: "该文档已有 Agent 运行中，无法切换会话" }, 409);
  return c.json({ ok: true });
}

export async function handleNewAgentSession(c: Context) {
  const body = await c.req.json<{ path?: string }>().catch(() => ({}) as any);
  if (!body?.path) return c.json({ error: "缺少 path 参数" }, 400);
  const sessionId = resetAgentSessionId(resolve(body.path));
  if (!sessionId) return c.json({ error: "该文档已有 Agent 运行中，无法新建会话" }, 409);
  return c.json({ ok: true, sessionId });
}

export async function handleGetRunsBySession(c: Context) {
  const sessionId = c.req.query("sessionId");
  if (!sessionId) return c.json({ error: "缺少 sessionId 参数" }, 400);
  return c.json({ runs: getRunsBySession(sessionId) });
}
