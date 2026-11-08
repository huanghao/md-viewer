import { describe, expect, it } from "bun:test";
import { validateAgentCommand } from "../../src/handlers/workspace-handlers";

describe("validateAgentCommand", () => {
  it("null / undefined / 空数组都表示清除自定义命令", () => {
    expect(validateAgentCommand(null)).toEqual({ ok: true, command: null });
    expect(validateAgentCommand(undefined)).toEqual({ ok: true, command: null });
    expect(validateAgentCommand([])).toEqual({ ok: true, command: null });
  });
  it("合法的字符串数组原样通过", () => {
    expect(validateAgentCommand(["claude", "--verbose"])).toEqual({ ok: true, command: ["claude", "--verbose"] });
  });
  it("非数组或含非字符串元素被拒绝", () => {
    expect(validateAgentCommand("claude").ok).toBe(false);
    expect(validateAgentCommand(["claude", 1]).ok).toBe(false);
    expect(validateAgentCommand([{ x: 1 }]).ok).toBe(false);
  });
  it("空字符串、超长参数、过多参数、NUL 被拒绝", () => {
    expect(validateAgentCommand([""]).ok).toBe(false);
    expect(validateAgentCommand(["a".repeat(1025)]).ok).toBe(false);
    expect(validateAgentCommand(Array.from({ length: 33 }, () => "a")).ok).toBe(false);
    expect(validateAgentCommand(["a\0b"]).ok).toBe(false);
  });
});
