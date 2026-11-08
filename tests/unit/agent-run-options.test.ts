import { describe, expect, it } from "bun:test";
import { validateAgentRunOptions } from "../../src/handlers/agent-handlers";

describe("validateAgentRunOptions", () => {
  it("空值与缺省字段视为未指定", () => {
    expect(validateAgentRunOptions({})).toEqual({ ok: true, options: {} });
    expect(validateAgentRunOptions({ provider: "", model: null, thinking: undefined })).toEqual({ ok: true, options: {} });
    expect(validateAgentRunOptions(undefined)).toEqual({ ok: true, options: {} });
  });
  it("合法值通过并去掉首尾空白", () => {
    expect(validateAgentRunOptions({ provider: " kimi-coding ", model: "claude-sonnet-5-5", thinking: "high" })).toEqual({
      ok: true,
      options: { provider: "kimi-coding", model: "claude-sonnet-5-5", thinking: "high" },
    });
    expect(validateAgentRunOptions({ model: "openai/gpt+x:1.0" }).ok).toBe(true);
  });
  it("以 - 开头的值被拒绝，避免被当成子进程选项", () => {
    expect(validateAgentRunOptions({ provider: "--skill=/tmp/x" }).ok).toBe(false);
    expect(validateAgentRunOptions({ model: "-m" }).ok).toBe(false);
    expect(validateAgentRunOptions({ thinking: "--approve" }).ok).toBe(false);
  });
  it("非字符串、含空白/shell 字符、超长被拒绝", () => {
    expect(validateAgentRunOptions({ model: 1 }).ok).toBe(false);
    expect(validateAgentRunOptions({ model: ["a"] }).ok).toBe(false);
    expect(validateAgentRunOptions({ provider: "a b" }).ok).toBe(false);
    expect(validateAgentRunOptions({ model: "a;rm" }).ok).toBe(false);
    expect(validateAgentRunOptions({ model: "a".repeat(129) }).ok).toBe(false);
  });
});
