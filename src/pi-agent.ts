import type { AgentRunUsage, AgentTranscriptMsg } from "./agent-storage.ts";

/**
 * pi（https://github.com/earendil-works/pi，原 badlogic/pi-mono）作为 Agent 运行时的
 * 一个可选 backend——跟现在 spawn claude/kc/mc/codex 的路径并列，不替换，供并排试用对比。
 *
 * 关键实测结论（scratch 环境验证过，见对话记录）：
 * - `--skill <path>` 能直接加载 Claude Code 格式的 SKILL.md，不用改 skills/mdv/SKILL.md 一个字。
 * - `--mode json` 的事件形状跟 claude 的 `stream-json`完全不同（message_start/message_update/
 *   message_end/tool_execution_xxx/agent_end 这一整套，增量 delta 单独发），所以不能复用
 *   agent-handlers.ts 里的 handleAgentEventLine，需要单独一个解析器——这是这个文件存在的原因。
 * - 首次在新 cwd 跑必须带 `--approve`，否则等交互式信任确认会一直挂起。
 * - session 是纯 id 寻址、不绑定 cwd，`--session-id <id>` 就够，不需要 claude 那种
 *   isResume ? --resume : --session-id 的分支判断。
 * - **不能只写裸命令 "pi" 让 PATH 去找**：这个仓库的 node_modules 里躺着一个不相关的
 *   旧包（`@mariozechner/pi-coding-agent`，2026-05-06 装的，早于 earendil-works 改名），
 *   `node_modules/.bin/pi` 指向它，版本 0.70.2，没有 --session-id/--approve 这些新 flag。
 *   Bun.spawn(["pi",...]) 在这个项目 cwd 下会优先解析到这个本地旧版本而不是全局装的新版本，
 *   报错 "Unknown options: --session-id, --approve"——表面看像是 flag 拼错了，其实是命令
 *   本身就解析错了。实测过 Bun.which("pi", {cwd}) 也会踩同一个坑，唯一可靠的办法是从
 *   PATH 里先过滤掉含 node_modules 的条目再解析。
 */

const MDV_SKILL_DIR = new URL("../skills/mdv", import.meta.url).pathname;

function resolvePiBinary(): string {
  const cleanPath = (process.env.PATH || "").split(":").filter((p) => !p.includes("node_modules")).join(":");
  return Bun.which("pi", { PATH: cleanPath }) || "pi";
}

export function buildPiArgv(opts: {
  prompt: string;
  sessionId: string;
  provider: string;
  model?: string;
  thinking?: string;
}): string[] {
  // 所有 flag 必须排在 prompt 前面——prompt 是位置参数，pi 的 parser 一遇到第一个
  // 非 flag token 就切到"后面全是 message 正文"模式，flag 混在 prompt 后面会被当成
  // 未知选项报错（实测踩过一次：--session-id/--approve 放在 prompt 后面直接报
  // "Unknown options: --session-id, --approve"——跟上面 PATH 那个坑报错文案一样，
  // 是两个完全不同的问题，排查时别搞混）
  const argv = [
    resolvePiBinary(),
    "-p",
    "--session-id", opts.sessionId,
    "--mode", "json",
    "--approve",
    "--provider", opts.provider,
    "--skill", MDV_SKILL_DIR,
  ];
  if (opts.model) argv.push("--model", opts.model);
  if (opts.thinking) argv.push("--thinking", opts.thinking);
  argv.push(opts.prompt);
  return argv;
}

export function truncate(text: string, max = 400): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M tokens`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}k tokens`;
  return `${n} tokens`;
}

function extractText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => (c?.type === "text" ? c.text : "")).filter(Boolean).join("\n");
  }
  return "";
}

/**
 * 处理一行 `pi --mode json` 的输出，累积到 transcript。
 * 返回 true 表示这行已经把这次运行标记为结束（agent_end / error）。
 *
 * onProgress 可选：把这一行归一化成 claude stream-json 的 assistant/user 事件形状
 * （`{type:'assistant', message:{model, content:[...]}}` / `{type:'user', message:{content:[...]}}`）
 * 回调出去——这样调用方可以原样丢给 broadcastEvent，前端 handleAgentProgressEvent
 * 不用认识 pi 的事件形状就能实时展示，不用改一行客户端代码。
 */
export function handlePiEventLine(
  line: string,
  transcript: AgentTranscriptMsg[],
  onFinish: (result: { status: "success" | "error"; usage: AgentRunUsage; error?: string }) => void,
  onProgress?: (claudeShapedEvent: any) => void
): boolean {
  let event: any;
  try {
    event = JSON.parse(line);
  } catch {
    return false;
  }

  const now = Date.now();

  // 只取 message_end/tool_execution_end 里的完整内容，不处理 message_update 里的逐字 delta——
  // md-viewer 现在展示的是"这一步做完了什么"，不是逐字打字机效果
  if (event?.type === "message_end" && event.message?.role === "assistant") {
    const model = event.message?.model;
    for (const block of event.message?.content ?? []) {
      if (block.type === "thinking" && block.thinking) {
        transcript.push({ kind: "thinking", text: block.thinking, timestamp: now, model });
      } else if (block.type === "text" && block.text) {
        transcript.push({ kind: "text", text: block.text, timestamp: now, model });
      } else if (block.type === "tool_use" || block.type === "toolcall") {
        const name = block.name || block.toolName || "tool";
        const input = block.input ?? block.arguments;
        const inputSummary = input ? truncate(JSON.stringify(input), 150) : "";
        transcript.push({ kind: "tool", text: `${name}${inputSummary ? " " + inputSummary : ""}`, timestamp: now, model });
      }
    }
    onProgress?.({ type: "assistant", message: event.message });
    return false;
  }

  if (event?.type === "tool_execution_end") {
    const text = typeof event.result === "string" ? event.result
      : typeof event.output === "string" ? event.output
      : extractText(event.content);
    if (text) {
      transcript.push({ kind: "tool-result", text: truncate(text), timestamp: now });
      onProgress?.({ type: "user", message: { content: [{ type: "tool_result", content: text }] } });
    }
    return false;
  }

  if (event?.type === "agent_end") {
    const messages: any[] = event.messages ?? [];
    const lastAssistant = [...messages].reverse().find((m) => m?.role === "assistant");
    const u = lastAssistant?.usage ?? {};
    const usage: AgentRunUsage = {
      inputTokens: u.input,
      outputTokens: u.output,
      cacheCreationTokens: u.cacheWrite,
      cacheReadTokens: u.cacheRead,
      model: lastAssistant?.model,
    };
    // provider 侧的失败（比如账号额度不够）不会走单独的 {type:"error"} 事件，是塞进
    // 最后一条 assistant 消息的 stopReason/errorMessage 里的——实测过 anthropic 账号没开
    // extra usage 额度时就是这个形状（content 为空、stopReason:"error"），不认这个字段
    // 会把一次真实失败的运行当成成功展示给用户，只看到一个没有内容的"✓ 完成"
    if (lastAssistant?.stopReason === "error") {
      const text = String(lastAssistant.errorMessage || "pi 运行出错");
      transcript.push({ kind: "error", text, timestamp: now });
      onFinish({ status: "error", usage, error: text });
      return true;
    }
    const tokens = (usage.inputTokens || 0) + (usage.outputTokens || 0);
    transcript.push({ kind: "result", text: `✓ 完成${tokens ? " · " + fmtTokens(tokens) : ""}`, timestamp: now });
    onFinish({ status: "success", usage });
    return true;
  }

  if (event?.type === "error") {
    const text = String(event.message || event.error || "pi 运行出错");
    transcript.push({ kind: "error", text, timestamp: now });
    onFinish({ status: "error", usage: {}, error: text });
    return true;
  }

  return false;
}
