import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { getSupportedThinkingLevels, type Model, type Api, type ModelThinkingLevel } from "@earendil-works/pi-ai";
import { log } from "./utils.ts";

/**
 * 模型列表 + 思考等级：读 pi 自己维护的本地缓存（`~/.pi/agent/models-store.json`，
 * 登录/刷新时 pi 自己写的，带 etag/lastModified，是标准的 HTTP 缓存套路，不是我们去猜的），
 * 不用现起一个 `pi --list-models` 子进程去问。
 *
 * "哪个模型支持哪几档思考等级"这个判断逻辑直接复用 pi-ai 包导出的
 * `getSupportedThinkingLevels`，不是我们自己拍的——它内部读的是 model.thinkingLevelMap，
 * 纯函数、不需要认证/网络，可以直接对着缓存文件里的 model 对象调用。
 */

const MODELS_STORE_PATH = () => join(homedir(), ".pi", "agent", "models-store.json");
const AUTH_PATH = () => join(homedir(), ".pi", "agent", "auth.json");

// anthropic 走的是 OAuth 直连 API，Anthropic 把第三方 App（pi 也算）这条通道单独隔离到
// "extra usage" 里，不算进 Claude Code 订阅套餐——用户只有 Claude Code 的用量，没开这个
// 额外额度，选了也用不了，直接从候选里去掉，不只是不推荐
const EXCLUDED_PROVIDERS = new Set(["anthropic"]);

/** 文件不存在（还没登录过 pi / 没跑过一次）是预期内的状态，静默返回空；
 * 文件存在但读不出来（权限、JSON 损坏等）是意外情况，打日志留痕迹方便排查。 */
function readJsonFileOrNull(path: string): any | null {
  let raw: string;
  try {
    raw = readFileSync(path, "utf-8");
  } catch (error: any) {
    if (error?.code !== "ENOENT") log(`⚠️ 读取 ${path} 失败: ${error?.message || error}`);
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (error: any) {
    log(`⚠️ 解析 ${path} 失败: ${error?.message || error}`);
    return null;
  }
}

/** 真正登录过的 provider 列表——models-store.json 里的 key 不代表已登录（比如未登录也可能
 * 缓存过公开的 openai 目录），要跟 auth.json 的登录态取交集，且必须两边都有模型才可用。
 * authPath/modelsStorePath 参数只为测试注入——`homedir()` 在 Bun 里进程内不响应
 * `process.env.HOME` 的运行期重新赋值（实测过，见 pi-models.test.ts 里的说明），
 * 测试没法像别处那样靠换 HOME 隔离，必须显式传路径。 */
export function listPiProviders(authPath = AUTH_PATH(), modelsStorePath = MODELS_STORE_PATH()): string[] {
  const auth = readJsonFileOrNull(authPath);
  if (!auth) return [];
  const store = readJsonFileOrNull(modelsStorePath) as Record<string, { models?: Model<Api>[] }> | null;
  if (!store) return [];

  const authKeys = Object.keys(auth);
  return authKeys.filter((p) => !EXCLUDED_PROVIDERS.has(p) && (store[p]?.models?.length ?? 0) > 0);
}

interface PiModelSummary {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  thinkingLevels: ModelThinkingLevel[];
}

export function listPiModels(provider: string, modelsStorePath = MODELS_STORE_PATH()): PiModelSummary[] {
  const store = readJsonFileOrNull(modelsStorePath) as Record<string, { models?: Model<Api>[] }> | null;
  if (!store) return [];

  const models = store[provider]?.models ?? [];
  return models.map((m) => ({
    id: m.id,
    name: m.name,
    contextWindow: m.contextWindow,
    maxTokens: m.maxTokens,
    reasoning: m.reasoning,
    thinkingLevels: getSupportedThinkingLevels(m),
  }));
}
