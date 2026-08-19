import { describe, expect, it } from "bun:test";
import { buildPiArgv, handlePiEventLine, truncate } from "../../src/pi-agent";
import type { AgentTranscriptMsg } from "../../src/agent-storage";

describe("buildPiArgv", () => {
  it("prompt 必须排在最后一个——pi 的 parser 一遇到非 flag token 就切到消息正文模式", () => {
    const argv = buildPiArgv({ prompt: "帮我看看这段代码", sessionId: "sess-1", provider: "kimi-coding" });
    expect(argv[argv.length - 1]).toBe("帮我看看这段代码");
    expect(argv).toContain("--session-id");
    expect(argv.indexOf("--session-id")).toBeLessThan(argv.length - 1);
  });

  it("model/thinking 是可选的，不传就不出现在 argv 里", () => {
    const withoutOptional = buildPiArgv({ prompt: "hi", sessionId: "s", provider: "kimi-coding" });
    expect(withoutOptional).not.toContain("--model");
    expect(withoutOptional).not.toContain("--thinking");

    const withOptional = buildPiArgv({ prompt: "hi", sessionId: "s", provider: "kimi-coding", model: "k3-256k", thinking: "high" });
    expect(withOptional).toContain("--model");
    expect(withOptional[withOptional.indexOf("--model") + 1]).toBe("k3-256k");
    expect(withOptional).toContain("--thinking");
    expect(withOptional[withOptional.indexOf("--thinking") + 1]).toBe("high");
  });

  it("provider 透传，不同引擎（kimi/codex）走同一份 argv 构造逻辑，互不写死", () => {
    const kimi = buildPiArgv({ prompt: "hi", sessionId: "s", provider: "kimi-coding" });
    const codex = buildPiArgv({ prompt: "hi", sessionId: "s", provider: "openai-codex" });
    expect(kimi[kimi.indexOf("--provider") + 1]).toBe("kimi-coding");
    expect(codex[codex.indexOf("--provider") + 1]).toBe("openai-codex");
  });

  it("首次在新 cwd 跑需要 --approve，否则会挂在交互式信任确认上", () => {
    const argv = buildPiArgv({ prompt: "hi", sessionId: "s", provider: "kimi-coding" });
    expect(argv).toContain("--approve");
  });
});

describe("truncate", () => {
  it("超长文本截断并加省略号，不超长的原样返回", () => {
    expect(truncate("short")).toBe("short");
    expect(truncate("a".repeat(500), 10)).toBe("a".repeat(10) + "…");
  });
});

describe("handlePiEventLine", () => {
  function run(lines: string[]) {
    const transcript: AgentTranscriptMsg[] = [];
    const progress: any[] = [];
    let finishResult: any = null;
    let finalized = false;
    for (const line of lines) {
      const done = handlePiEventLine(line, transcript, (r) => { finishResult = r; }, (e) => progress.push(e));
      finalized = finalized || done;
    }
    return { transcript, progress, finishResult, finalized };
  }

  it("解析不了的行直接跳过，不抛异常、不误判为结束", () => {
    const { transcript, finalized } = run(["not json at all"]);
    expect(transcript).toEqual([]);
    expect(finalized).toBe(false);
  });

  it("message_end(assistant) 把 thinking/text/tool_use 三种 block 分别记进 transcript，并归一化成 claude 形状广播", () => {
    const event = {
      type: "message_end",
      message: {
        role: "assistant",
        model: "k3",
        content: [
          { type: "thinking", thinking: "先想想怎么答" },
          { type: "text", text: "答案是 42" },
          { type: "tool_use", name: "read_file", input: { path: "/a.md" } },
        ],
      },
    };
    const { transcript, progress, finalized } = run([JSON.stringify(event)]);

    expect(transcript.map((m) => m.kind)).toEqual(["thinking", "text", "tool"]);
    expect(transcript[0].text).toBe("先想想怎么答");
    expect(transcript[1].text).toBe("答案是 42");
    expect(transcript[2].text).toContain("read_file");
    expect(transcript.every((m) => m.model === "k3")).toBe(true);
    expect(finalized).toBe(false);
    expect(progress[0]).toMatchObject({ type: "assistant", message: event.message });
  });

  it("message_end(assistant) 里空/未知类型的 block 不记录（不产生空文本行）", () => {
    const event = {
      type: "message_end",
      message: { role: "assistant", model: "k3", content: [{ type: "thinking", thinking: "" }, { type: "text", text: "" }] },
    };
    const { transcript } = run([JSON.stringify(event)]);
    expect(transcript).toEqual([]);
  });

  it("tool_execution_end 记 tool-result 并归一化成 user/tool_result 事件", () => {
    const event = { type: "tool_execution_end", result: "文件内容是 ..." };
    const { transcript, progress } = run([JSON.stringify(event)]);
    expect(transcript[0]).toMatchObject({ kind: "tool-result", text: "文件内容是 ..." });
    expect(progress[0]).toMatchObject({ type: "user", message: { content: [{ type: "tool_result", content: "文件内容是 ..." }] } });
  });

  it("agent_end 正常结束：累计最后一条 assistant 消息的 usage，标记 success", () => {
    const event = {
      type: "agent_end",
      messages: [
        { role: "user", content: [{ type: "text", text: "问题" }] },
        { role: "assistant", model: "gpt-5.4-mini", usage: { input: 100, output: 20 }, content: [{ type: "text", text: "答案" }] },
      ],
    };
    const { transcript, finishResult, finalized } = run([JSON.stringify(event)]);
    expect(finalized).toBe(true);
    expect(finishResult).toMatchObject({ status: "success", usage: { inputTokens: 100, outputTokens: 20, model: "gpt-5.4-mini" } });
    expect(transcript[0].kind).toBe("result");
    expect(transcript[0].text).toContain("完成");
  });

  it("agent_end 但最后一条 assistant 消息 stopReason 是 error 时——provider 侧失败，必须标记 error 而不是 success", () => {
    // 这个 fixture 是真实抓到的形状：pi 连 anthropic provider 时，账号没开 extra usage
    // 额度，Anthropic 返回 400，pi 没有单独发 {type:"error"} 事件，是塞进 agent_end 里
    // 最后一条 assistant 消息的 stopReason/errorMessage 字段里的。之前没处理这个分支，
    // 这种失败会被误判成"成功"，界面上只会显示一个没有内容的"✓ 完成"。
    const event = {
      type: "agent_end",
      messages: [
        { role: "user", content: [{ type: "text", text: "问题" }] },
        {
          role: "assistant",
          model: "claude-haiku-4-5",
          content: [],
          usage: { input: 0, output: 0 },
          stopReason: "error",
          errorMessage: '400 {"type":"error","error":{"type":"invalid_request_error","message":"Third-party apps now draw from your extra usage, not your plan limits."}}',
        },
      ],
    };
    const { transcript, finishResult, finalized } = run([JSON.stringify(event)]);
    expect(finalized).toBe(true);
    expect(finishResult.status).toBe("error");
    expect(finishResult.error).toContain("extra usage");
    expect(transcript[0].kind).toBe("error");
  });

  it("顶层 {type:'error'} 事件也正确结束并标记 error", () => {
    const event = { type: "error", message: "网络超时" };
    const { transcript, finishResult, finalized } = run([JSON.stringify(event)]);
    expect(finalized).toBe(true);
    expect(finishResult).toMatchObject({ status: "error", error: "网络超时" });
    expect(transcript[0]).toMatchObject({ kind: "error", text: "网络超时" });
  });

  it("多行事件按顺序处理：中间过程事件不结束运行，只有最后的 agent_end 结束", () => {
    const lines = [
      JSON.stringify({ type: "session", id: "s" }),
      JSON.stringify({ type: "message_end", message: { role: "assistant", model: "k3", content: [{ type: "text", text: "中间步骤" }] } }),
      JSON.stringify({ type: "tool_execution_end", result: "工具结果" }),
      JSON.stringify({ type: "agent_end", messages: [{ role: "assistant", model: "k3", usage: { input: 1, output: 1 } }] }),
    ];
    const { transcript, finalized } = run(lines);
    expect(finalized).toBe(true);
    expect(transcript.map((m) => m.kind)).toEqual(["text", "tool-result", "result"]);
  });
});
