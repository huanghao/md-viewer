import { afterAll, afterEach, beforeAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import {
  findClaudeSessionFile,
  isRunProcessAlive,
  parseClaudeSessionJsonl,
  recoverStuckAgentRuns,
  resetAgentRecoveryForTesting,
} from "../../src/agent-recovery";
import {
  ensureAgentSessionId,
  getAgentRuns,
  getAgentSession,
  insertAgentRun,
  setAgentRunPid,
  tryMarkAgentRunning,
} from "../../src/agent-storage";
import { resetDbForTesting } from "../../src/annotation-db";

let tempHome = "";
let oldDataDir: string | undefined;

beforeAll(() => {
  oldDataDir = process.env.MDV_DATA_DIR;
  tempHome = mkdtempSync(join(tmpdir(), "mdv-agent-recovery-"));
  process.env.MDV_DATA_DIR = tempHome;
  resetDbForTesting();
});

afterEach(() => {
  resetAgentRecoveryForTesting();
  resetDbForTesting();
});

afterAll(() => {
  if (oldDataDir === undefined) delete process.env.MDV_DATA_DIR;
  else process.env.MDV_DATA_DIR = oldDataDir;
  rmSync(tempHome, { recursive: true, force: true });
});

const line = (o: object) => JSON.stringify(o);

describe("parseClaudeSessionJsonl", () => {
  const since = Date.parse("2026-10-22T14:00:00Z");

  it("只取这次 run 之后的对话，最后以 end_turn 结束算完成", () => {
    const text = [
      line({ type: "assistant", timestamp: "2026-10-22T13:00:00Z", message: { content: [{ type: "text", text: "旧的一轮" }], stop_reason: "end_turn" } }),
      line({ type: "assistant", timestamp: "2026-10-22T14:01:00Z", message: { model: "m", content: [{ type: "tool_use", name: "Bash", input: { command: "ls" } }], stop_reason: "tool_use" } }),
      line({ type: "user", timestamp: "2026-10-22T14:01:01Z", message: { content: [{ type: "tool_result", content: "a.md" }] } }),
      line({ type: "assistant", timestamp: "2026-10-22T14:02:00Z", message: { content: [{ type: "text", text: "改好了" }], stop_reason: "end_turn" } }),
    ].join("\n");
    const { transcript, finished } = parseClaudeSessionJsonl(text, since);
    expect(finished).toBe(true);
    expect(transcript.map((m) => m.kind)).toEqual(["tool", "tool-result", "text"]);
    expect(transcript.some((m) => m.text === "旧的一轮")).toBe(false);
  });

  it("停在工具调用上说明被打断，不算完成", () => {
    const text = line({ type: "assistant", timestamp: "2026-10-22T14:01:00Z", message: { content: [{ type: "tool_use", name: "Bash", input: {} }], stop_reason: "tool_use" } });
    expect(parseClaudeSessionJsonl(text, since).finished).toBe(false);
  });
});

describe("findClaudeSessionFile", () => {
  it("在各项目目录下按 sessionId 找会话文件", () => {
    const dir = mkdtempSync(join(tmpdir(), "mdv-projects-"));
    mkdirSync(join(dir, "-some-project"));
    writeFileSync(join(dir, "-some-project", "abc.jsonl"), "");
    expect(findClaudeSessionFile("abc", dir)).toBe(join(dir, "-some-project", "abc.jsonl"));
    expect(findClaudeSessionFile("nope", dir)).toBeNull();
    rmSync(dir, { recursive: true, force: true });
  });
});

describe("isRunProcessAlive", () => {
  it("没有 pid、或 pid 对应的不是这次 run 的进程，都不算活着", () => {
    expect(isRunProcessAlive({ pid: null, sessionId: "s" })).toBe(false);
    expect(isRunProcessAlive({ pid: process.pid, sessionId: "not-in-argv-xyz" })).toBe(false);
  });
});

describe("recoverStuckAgentRuns", () => {
  it("进程已不在：收尾成 error（找不到会话记录），并解开文档的运行锁", () => {
    const docPath = "/tmp/recover-dead.md";
    const sessionId = ensureAgentSessionId(docPath);
    tryMarkAgentRunning(docPath, "run-dead");
    insertAgentRun({ id: "run-dead", docPath, sessionId, workspacePath: null, command: ["claude", "-p", "hi"] });

    const r = recoverStuckAgentRuns();
    expect(r.finalized).toBeGreaterThanOrEqual(1);
    const run = getAgentRuns(docPath)[0];
    expect(run.status).toBe("error");
    expect(getAgentSession(docPath)?.running).toBe(false);
  });

  it("进程还活着：保持运行中并继续占着会话锁", () => {
    const docPath = "/tmp/recover-alive.md";
    const sessionId = ensureAgentSessionId(docPath);
    tryMarkAgentRunning(docPath, "run-alive");
    insertAgentRun({ id: "run-alive", docPath, sessionId, workspacePath: null, command: ["claude", "-p", "hi"] });
    // 命令行里带上 sessionId，模拟真实的 `claude ... --session-id <id>` 进程
    const proc = Bun.spawn(["sh", "-c", `sleep 30 # ${sessionId}`]);
    try {
      setAgentRunPid("run-alive", proc.pid);
      const r = recoverStuckAgentRuns();
      expect(r.reattached).toBe(1);
      expect(getAgentRuns(docPath)[0].status).toBe("running");
      expect(getAgentSession(docPath)?.running).toBe(true);
      expect(tryMarkAgentRunning(docPath, "another")).toBe(false);
    } finally {
      proc.kill();
    }
  });
});
