import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { listPiModels, listPiProviders } from "../../src/pi-models";

// 注意：这里不能像 agent-backends.test.ts 那样靠 `process.env.HOME = tmpHome` 隔离——
// 实测过 Bun 的 `os.homedir()` 在进程内不响应运行期对 HOME 的重新赋值（子进程里设
// HOME 之后启动才生效，同一进程内改赋值不生效），会导致测试悄悄读到开发机真实的
// ~/.pi/agent/*，断言凑巧对上就误报通过。所以 pi-models.ts 的路径都做成了可注入参数，
// 这里直接传临时文件路径，不依赖 HOME。

let tmpDir: string | null = null;

afterEach(() => {
  if (tmpDir) {
    rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = null;
  }
});

function writeFixture(auth: Record<string, unknown>, store: Record<string, unknown>) {
  tmpDir = mkdtempSync(join(tmpdir(), "mdv-pi-models-"));
  const authPath = join(tmpDir, "auth.json");
  const storePath = join(tmpDir, "models-store.json");
  Bun.write(authPath, JSON.stringify(auth));
  Bun.write(storePath, JSON.stringify(store));
  return { authPath, storePath };
}

describe("listPiProviders", () => {
  it("只保留同时登录过 且 models-store 里有模型的 provider", () => {
    const { authPath, storePath } = writeFixture(
      { "kimi-coding": { type: "oauth" }, "openai-codex": { type: "oauth" } },
      {
        "kimi-coding": { models: [{ id: "k3" }] },
        "openai-codex": { models: [] }, // 登录了但没模型 → 不可用
        openai: { models: [{ id: "gpt-4" }] }, // 有模型但没登录 → 不可用
      }
    );

    expect(listPiProviders(authPath, storePath)).toEqual(["kimi-coding"]);
  });

  it("即使登录过也强制排除 anthropic（第三方 App 走 extra usage，用户没开这个额度）", () => {
    const { authPath, storePath } = writeFixture(
      { anthropic: { type: "oauth" } },
      { anthropic: { models: [{ id: "claude-haiku-4-5" }] } }
    );

    expect(listPiProviders(authPath, storePath)).toEqual([]);
  });

  it("auth.json 或 models-store.json 缺失时返回空数组，不抛异常", () => {
    tmpDir = mkdtempSync(join(tmpdir(), "mdv-pi-models-"));
    const missingAuth = join(tmpDir, "does-not-exist-auth.json");
    const missingStore = join(tmpDir, "does-not-exist-store.json");
    expect(listPiProviders(missingAuth, missingStore)).toEqual([]);
  });
});

describe("listPiModels", () => {
  it("按 provider 取模型，并算出每个模型真正支持的 thinking 档位", () => {
    const { storePath } = writeFixture(
      {},
      {
        "kimi-coding": {
          models: [
            {
              id: "k3-256k",
              name: "Kimi K3-256K",
              contextWindow: 256000,
              maxTokens: 8192,
              reasoning: true,
              // 跟真实 models-store.json 里 k3-256k 的 thinkingLevelMap 形状一致：
              // 只有 low/high/max 映射到非 null，其余档位这个模型不支持
              thinkingLevelMap: { off: null, minimal: null, low: "low", medium: null, high: "high", xhigh: null, max: "max" },
            },
          ],
        },
      }
    );

    const models = listPiModels("kimi-coding", storePath);
    expect(models).toEqual([
      {
        id: "k3-256k",
        name: "Kimi K3-256K",
        contextWindow: 256000,
        maxTokens: 8192,
        reasoning: true,
        thinkingLevels: ["low", "high", "max"],
      },
    ]);
  });

  it("provider 不存在或 models-store 缺失时返回空数组", () => {
    const { storePath } = writeFixture({}, { "kimi-coding": { models: [] } });
    expect(listPiModels("openai-codex", storePath)).toEqual([]);

    tmpDir && rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = mkdtempSync(join(tmpdir(), "mdv-pi-models-"));
    expect(listPiModels("kimi-coding", join(tmpDir, "missing.json"))).toEqual([]);
  });
});
