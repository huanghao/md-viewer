import { existsSync, readdirSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { broadcastEvent } from "./sse.ts";
import {
  clearUnbackedRunningFlags,
  extractPromptFromCommand,
  finishAgentRun,
  listRunningAgentRuns,
  markAgentIdle,
  type AgentTranscriptMsg,
  type RunningAgentRun,
} from "./agent-storage.ts";
import { extractToolResultText, truncate } from "./handlers/agent-handlers.ts";
import { log } from "./utils.ts";

/**
 * 服务重启（开发时 `bun --watch` 一存文件就重启）会让正在运行的 agent 子进程成为孤儿：
 * 子进程不会被带走，会继续改文档、写回复直到跑完，只是没人再收它的输出、回写运行状态。
 * 这里在启动时把这些 run 认回来：
 * - 进程还活着：保持"运行中"（继续占着会话锁，避免并发 --resume 写坏会话），等它结束；
 * - 进程已经结束：直接收尾。
 * 收尾时从 claude 自己落盘的会话文件重建对话和结果，不把"其实已经成功"的 run 误报成中断。
 */

const POLL_INTERVAL_MS = 3000;

function claudeProjectsDir(): string {
  return join(homedir(), ".claude", "projects");
}

/** claude 把会话存在 ~/.claude/projects/<编码后的 cwd>/<sessionId>.jsonl，编码规则不去猜，直接按文件名找。 */
export function findClaudeSessionFile(sessionId: string, projectsDir = claudeProjectsDir()): string | null {
  if (!existsSync(projectsDir)) return null;
  for (const dir of readdirSync(projectsDir)) {
    const file = join(projectsDir, dir, `${sessionId}.jsonl`);
    if (existsSync(file)) return file;
  }
  return null;
}

/**
 * 从 claude 会话文件里取出这次 run（时间不早于 sinceMs）的对话。
 * finished：最后一条 assistant 消息以 end_turn 结束，说明 agent 把话说完了，不是被打断。
 */
export function parseClaudeSessionJsonl(text: string, sinceMs: number): { transcript: AgentTranscriptMsg[]; finished: boolean } {
  const transcript: AgentTranscriptMsg[] = [];
  let finished = false;
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    let event: any;
    try {
      event = JSON.parse(line);
    } catch {
      continue;
    }
    const ts = Date.parse(event?.timestamp ?? "");
    if (!Number.isFinite(ts) || ts < sinceMs) continue;

    if (event.type === "assistant") {
      const model = event.message?.model;
      for (const block of event.message?.content ?? []) {
        if (block.type === "thinking" && block.thinking) {
          transcript.push({ kind: "thinking", text: block.thinking, timestamp: ts, model });
        } else if (block.type === "text" && block.text) {
          transcript.push({ kind: "text", text: block.text, timestamp: ts, model });
        } else if (block.type === "tool_use") {
          const inputSummary = block.input ? truncate(JSON.stringify(block.input), 150) : "";
          transcript.push({ kind: "tool", text: `${block.name}${inputSummary ? " " + inputSummary : ""}`, timestamp: ts, model });
        }
      }
      finished = event.message?.stop_reason === "end_turn";
    } else if (event.type === "user") {
      const content = event.message?.content;
      if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "tool_result") {
            const out = extractToolResultText(block.content);
            if (out) transcript.push({ kind: "tool-result", text: truncate(out), timestamp: ts });
          }
        }
      }
      finished = false;
    }
  }
  return { transcript, finished };
}

/** pid 还活着，并且确实是这次 run 的 agent（防止 pid 被系统回收给了别的进程）。 */
export function isRunProcessAlive(run: Pick<RunningAgentRun, "pid" | "sessionId">): boolean {
  if (!run.pid) return false;
  try {
    process.kill(run.pid, 0);
  } catch {
    return false;
  }
  const ps = Bun.spawnSync(["ps", "-p", String(run.pid), "-o", "command="]);
  return ps.success && ps.stdout.toString().includes(run.sessionId);
}

function finalizeRun(run: RunningAgentRun): "success" | "error" {
  const prompt = extractPromptFromCommand(run.command);
  const transcript: AgentTranscriptMsg[] = prompt ? [{ kind: "user", text: prompt, timestamp: run.startedAt }] : [];

  const file = findClaudeSessionFile(run.sessionId);
  let status: "success" | "error" = "error";
  let error: string | undefined;
  if (file) {
    const parsed = parseClaudeSessionJsonl(readFileSync(file, "utf-8"), run.startedAt - 1000);
    transcript.push(...parsed.transcript);
    if (parsed.finished) {
      status = "success";
      transcript.push({ kind: "result", text: "✓ 完成（服务重启后从会话记录恢复）", timestamp: Date.now() });
    } else {
      error = "服务重启时运行中断，会话记录里没有完成标记";
    }
  } else {
    error = "服务重启期间运行已结束，找不到会话记录，结果未知";
  }
  if (error) transcript.push({ kind: "error", text: error, timestamp: Date.now() });

  finishAgentRun(run.id, { status, error, transcript });
  markAgentIdle(run.docPath);
  broadcastEvent({ type: "agent-run-status", runId: run.id, docPath: run.docPath, status });
  return status;
}

const orphans = new Map<string, RunningAgentRun>();
let timer: ReturnType<typeof setInterval> | null = null;

function pollOrphans(): void {
  for (const [id, run] of orphans) {
    if (isRunProcessAlive(run)) continue;
    orphans.delete(id);
    const status = finalizeRun(run);
    log(`🧹 重启前遗留的 Agent run ${id.slice(0, 8)} 已结束，结果：${status}`);
  }
  if (orphans.size === 0 && timer) {
    clearInterval(timer);
    timer = null;
  }
}

/** 仅供测试：清掉跟踪的孤儿和定时器，避免定时器泄漏到别的用例。 */
export function resetAgentRecoveryForTesting(): void {
  orphans.clear();
  if (timer) clearInterval(timer);
  timer = null;
}

/** 启动时调用一次。返回 { reattached, finalized }。 */
export function recoverStuckAgentRuns(): { reattached: number; finalized: number } {
  let reattached = 0;
  let finalized = 0;
  for (const run of listRunningAgentRuns()) {
    if (isRunProcessAlive(run)) {
      orphans.set(run.id, run);
      reattached++;
    } else {
      finalizeRun(run);
      finalized++;
    }
  }
  clearUnbackedRunningFlags();
  if (orphans.size > 0 && !timer) {
    timer = setInterval(pollOrphans, POLL_INTERVAL_MS);
  }
  return { reattached, finalized };
}
