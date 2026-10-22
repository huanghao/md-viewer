import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { agentSystemPromptArgs, buildSentPrompt, handleAgentEventLine } from "../../src/handlers/agent-handlers";
import { ensureAgentSessionId, getAgentRuns, getAgentSession, insertAgentRun, tryMarkAgentRunning } from "../../src/agent-storage";
import { resetDbForTesting } from "../../src/annotation-db";
import type { AgentTranscriptMsg } from "../../src/agent-storage";

// 跟 tests/unit/agent-storage-session-lock.test.ts 同一套隔离：MDV_DATA_DIR 换临时目录 +
// resetDbForTesting()。handleAgentEventLine 内部会真的调 finishAgentRun/markAgentIdle 写库，
// 所以每个用例先走一遍 ensureAgentSessionId + tryMarkAgentRunning + insertAgentRun，
// 模拟 streamAgentRun 真实调用前的状态，而不是孤立地只测事件解析。
let tempConfigHome = "";
let oldConfigHome: string | undefined;

beforeAll(() => {
  oldConfigHome = process.env.MDV_DATA_DIR;
  tempConfigHome = mkdtempSync(join(tmpdir(), "mdv-agent-event-"));
  process.env.MDV_DATA_DIR = tempConfigHome;
  resetDbForTesting();
});

afterEach(() => {
  resetDbForTesting();
});

afterAll(() => {
  if (oldConfigHome === undefined) delete process.env.MDV_DATA_DIR;
  else process.env.MDV_DATA_DIR = oldConfigHome;
  if (tempConfigHome) rmSync(tempConfigHome, { recursive: true, force: true });
});

function startRun(docPath: string, runId: string) {
  const sessionId = ensureAgentSessionId(docPath);
  tryMarkAgentRunning(docPath, runId);
  insertAgentRun({ id: runId, docPath, sessionId, workspacePath: null, command: ["claude", "-p", "hi"] });
  return sessionId;
}

describe("handleAgentEventLine（claude stream-json）", () => {
  it("解析不了的行直接跳过，不抛异常、不标记结束", () => {
    const transcript: AgentTranscriptMsg[] = [];
    const finalized = handleAgentEventLine("not json", "run-1", "/tmp/x.md", "s1", transcript);
    expect(finalized).toBe(false);
    expect(transcript).toEqual([]);
  });

  it("assistant 事件把 thinking/text/tool_use 分别记进 transcript，不结束运行", () => {
    const transcript: AgentTranscriptMsg[] = [];
    const event = {
      type: "assistant",
      message: {
        model: "claude-sonnet-4-5",
        content: [
          { type: "thinking", thinking: "先看看文件内容" },
          { type: "text", text: "已经处理完批注" },
          { type: "tool_use", name: "Read", input: { file_path: "/a.md" } },
        ],
      },
    };
    const finalized = handleAgentEventLine(JSON.stringify(event), "run-1", "/tmp/x.md", "s1", transcript);
    expect(finalized).toBe(false);
    expect(transcript.map((m) => m.kind)).toEqual(["thinking", "text", "tool"]);
    expect(transcript[2].text).toContain("Read");
    expect(transcript.every((m) => m.model === "claude-sonnet-4-5")).toBe(true);
  });

  it("user 事件里的 tool_result 记进 transcript", () => {
    const transcript: AgentTranscriptMsg[] = [];
    const event = { type: "user", message: { content: [{ type: "tool_result", content: "文件读取成功" }] } };
    handleAgentEventLine(JSON.stringify(event), "run-1", "/tmp/x.md", "s1", transcript);
    expect(transcript).toEqual([{ kind: "tool-result", text: "文件读取成功", timestamp: expect.any(Number) }]);
  });

  it("result 事件（成功）：标记结束、真的把 agent_runs 落库为 success、文档解开运行中锁", () => {
    const docPath = "/tmp/y.md";
    startRun(docPath, "run-success");
    const transcript: AgentTranscriptMsg[] = [];
    const event = {
      type: "result",
      is_error: false,
      usage: { input_tokens: 500, output_tokens: 80, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      total_cost_usd: 0.01,
      modelUsage: { "claude-sonnet-4-5": {} },
    };

    const finalized = handleAgentEventLine(JSON.stringify(event), "run-success", docPath, "s1", transcript);
    expect(finalized).toBe(true);
    expect(transcript.at(-1)).toMatchObject({ kind: "result" });
    expect(transcript.at(-1)?.text).toContain("完成");

    const runs = getAgentRuns(docPath);
    expect(runs[0]).toMatchObject({ status: "success" });
    expect(runs[0].usage).toMatchObject({ inputTokens: 500, outputTokens: 80 });
    expect(getAgentSession(docPath)?.running).toBe(false);
  });

  it("result 事件（is_error: true）：标记结束、落库为 error", () => {
    const docPath = "/tmp/z.md";
    startRun(docPath, "run-fail");
    const transcript: AgentTranscriptMsg[] = [];
    const event = { type: "result", is_error: true, result: "工具执行超时", usage: {} };

    const finalized = handleAgentEventLine(JSON.stringify(event), "run-fail", docPath, "s1", transcript);
    expect(finalized).toBe(true);
    expect(transcript.at(-1)).toMatchObject({ kind: "error", text: "工具执行超时" });

    const runs = getAgentRuns(docPath);
    expect(runs[0]).toMatchObject({ status: "error", error: "工具执行超时" });
    expect(getAgentSession(docPath)?.running).toBe(false);
  });

  it("assistant 里空/未知类型的 block 不记录，不产生空文本行", () => {
    const transcript: AgentTranscriptMsg[] = [];
    const event = { type: "assistant", message: { model: "m", content: [{ type: "thinking", thinking: "" }, { type: "text", text: "" }, { type: "unknown_block" }] } };
    handleAgentEventLine(JSON.stringify(event), "run-1", "/tmp/x.md", "s1", transcript);
    expect(transcript).toEqual([]);
  });
});

describe("buildSentPrompt", () => {
  it("普通消息带上当前文档前缀", () => {
    expect(buildSentPrompt("这个文件写了什么", "/ws/a.md")).toBe("[当前文档: /ws/a.md]\n这个文件写了什么");
  });
  it("以 / 开头的 slash command 原样发送，不加前缀", () => {
    expect(buildSentPrompt("/mdv docs/a.md 只改第三条", "/ws/docs/a.md")).toBe("/mdv docs/a.md 只改第三条");
  });
});

describe("agentSystemPromptArgs", () => {
  it("官方 claude backend 带上 mdv 的写作/联网提示", () => {
    const args = agentSystemPromptArgs("claude");
    expect(args[0]).toBe("--append-system-prompt");
    expect(args[1]).toContain("WebSearch");
  });
  it("其它 backend 和 workspace 自定义命令不加这个参数", () => {
    expect(agentSystemPromptArgs("codex")).toEqual([]);
    expect(agentSystemPromptArgs(null)).toEqual([]);
  });
});
