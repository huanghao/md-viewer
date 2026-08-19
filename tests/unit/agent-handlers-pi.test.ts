import { describe, expect, it } from "bun:test";
import { handleListAgentBackends, handleListPiModels, handleListPiProviders } from "../../src/handlers/agent-handlers";

// 跟 tests/unit/handlers-api.test.ts 用同一套最小 Context mock 风格
function makeContext(url = "http://localhost/") {
  return {
    req: {
      url,
      query(name: string) {
        return new URL(url).searchParams.get(name) || undefined;
      },
    },
    json(data: unknown, status = 200) {
      return Response.json(data, { status });
    },
  } as any;
}

describe("handleListAgentBackends 里合成的 pi 条目", () => {
  it("defaultModel 必须是 null，不能写死某个 provider 的模型", async () => {
    // 回归测试：这里曾经硬编码过 defaultModel: "k3-256k"（当时 pi 只接了 kimi-coding，
    // 三引擎拆分后这个值会顺着客户端的兜底逻辑泄漏进 codex/其它 provider 的模型下拉框，
    // 实测复现过——切到 Codex 引擎时选中框里混进一个不属于它的假选项 "k3-256k"。
    const res = await handleListAgentBackends(makeContext());
    const data = await res.json();
    const pi = data.backends.find((b: any) => b.name === "pi");
    expect(pi).toBeTruthy();
    expect(pi.defaultModel).toBeNull();
  });
});

describe("handleListPiModels", () => {
  it("没传 provider 时默认查 kimi-coding", async () => {
    const res = await handleListPiModels(makeContext("http://localhost/api/agent/pi-models"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.models)).toBe(true);
  });

  it("透传 provider 查询参数", async () => {
    const res = await handleListPiModels(makeContext("http://localhost/api/agent/pi-models?provider=openai-codex"));
    const data = await res.json();
    expect(Array.isArray(data.models)).toBe(true);
  });
});

describe("handleListPiProviders", () => {
  it("返回 providers 数组", async () => {
    const res = await handleListPiProviders(makeContext());
    const data = await res.json();
    expect(Array.isArray(data.providers)).toBe(true);
    // anthropic 不管有没有登录都不该出现——这条规则跟 listPiProviders 自己的
    // 单元测试（tests/unit/pi-models.test.ts）重复覆盖一次，确保 handler 这层没有
    // 意外绕过过滤逻辑（比如以后有人改成直接读 auth.json 的 key 而不走 listPiProviders）
    expect(data.providers).not.toContain("anthropic");
  });
});
