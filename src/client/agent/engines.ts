import { fetchPiModels, fetchPiProviders, type AgentBackendStatus, type PiModel } from '../api/agent';

// 界面上只暴露一个"选哪个引擎"的下拉框，UI/业务完全不知道背后是 pi 还是本机 claude
// CLI——这张表是唯一知道两条路径存在的地方。去掉其中一条（比如去掉 codex 这一行）
// 不影响另外两条：每条只认自己的 backend/provider，互不读对方的状态。
export interface AgentEngine {
  id: string;
  label: string;
  backend: string;
  provider?: string; // 只有 backend === 'pi' 的引擎才有
}

export const AGENT_ENGINES: AgentEngine[] = [
  { id: 'kimi', label: 'Kimi', backend: 'pi', provider: 'kimi-coding' },
  { id: 'codex', label: 'Codex', backend: 'pi', provider: 'openai-codex' },
  { id: 'cc', label: 'Claude Code', backend: 'claude' },
];

export const AGENT_ENGINE_KEY = 'md-viewer:agent-engine';
export const AGENT_MODEL_OVERRIDE_KEY = 'md-viewer:agent-model-override';
export const CLAUDE_MODEL_ALIASES = ['sonnet', 'opus', 'haiku', 'fable'];
export const ALL_THINKING_LEVELS = ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];

export interface ModelOption { value: string; label: string }

export function findEngine(id: string): AgentEngine {
  return AGENT_ENGINES.find((e) => e.id === id) || AGENT_ENGINES[0];
}

// pi 侧可能同时登录了多个 provider，每个都有自己独立的模型目录 + thinking 档位，
// 按 provider 分开缓存；claude（cc）走本机 CLI，走的是固定别名，不用缓存
let piProviders: string[] | null = null;
let piProvidersPromise: Promise<string[]> | null = null;
const piModelsByProvider = new Map<string, PiModel[]>();
const piModelsPromiseByProvider = new Map<string, Promise<PiModel[]>>();

export function ensurePiProviders(): Promise<string[]> {
  if (piProviders) return Promise.resolve(piProviders);
  if (!piProvidersPromise) {
    piProvidersPromise = fetchPiProviders().then((providers) => {
      piProviders = providers;
      return providers;
    }).catch(() => []);
  }
  return piProvidersPromise;
}

// pi 自己在登录/刷新时把模型目录缓存在 ~/.pi/agent/models-store.json（server 端
// listPiModels 读的就是这份文件，复用 pi-ai 包自己的 getSupportedThinkingLevels
// 判断每个模型支持哪几档思考等级），按 provider 请求一次、缓存住，不用每次切都拉
export function ensurePiModels(provider: string): Promise<PiModel[]> {
  const cached = piModelsByProvider.get(provider);
  if (cached) return Promise.resolve(cached);
  let promise = piModelsPromiseByProvider.get(provider);
  if (!promise) {
    promise = fetchPiModels(provider).then((models) => {
      piModelsByProvider.set(provider, models);
      return models;
    }).catch(() => []);
    piModelsPromiseByProvider.set(provider, promise);
  }
  return promise;
}

/** 仅测试用：清掉 provider/模型缓存 */
export function resetEngineCachesForTesting(): void {
  piProviders = null;
  piProvidersPromise = null;
  piModelsByProvider.clear();
  piModelsPromiseByProvider.clear();
}

// 引擎下拉框只列 3 个固定选项，但要能反映真实可用性：pi 侧引擎要求对应 provider
// 真的登录过，claude（cc）引擎要求 backend 状态里没有 unavailableReason——
// 不可用的选项禁用但仍然可见，不是直接从列表消失
export function engineAvailability(providers: string[], backends: AgentBackendStatus[]): Map<string, boolean> {
  const claude = backends.find((b) => b.name === 'claude');
  const out = new Map<string, boolean>();
  for (const e of AGENT_ENGINES) {
    out.set(e.id, e.backend === 'pi' ? providers.includes(e.provider || '') : !claude || !claude.unavailableReason);
  }
  return out;
}

export function pickEngine(saved: string, availability: Map<string, boolean>): string {
  return availability.get(saved)
    ? saved
    : AGENT_ENGINES.find((e) => availability.get(e.id))?.id || AGENT_ENGINES[0].id;
}

/** 模型下拉的选项与应选中的值；选中值不在列表里时补进去，列表为空时回退到第一项 */
export function buildModelOptions(
  engine: AgentEngine,
  backends: AgentBackendStatus[],
  piModels: PiModel[],
  selected: string,
): { options: ModelOption[]; value: string } {
  let raw: ModelOption[];
  let want = selected;
  if (engine.backend === 'pi') {
    raw = piModels.map((m) => ({ value: m.id, label: m.name }));
  } else {
    const defaultModel = backends.find((b) => b.name === engine.backend)?.defaultModel || '';
    raw = [
      ...(defaultModel ? [{ value: defaultModel, label: `${defaultModel}（默认）` }] : []),
      ...CLAUDE_MODEL_ALIASES.map((m) => ({ value: m, label: m })),
    ];
    want = selected || defaultModel || CLAUDE_MODEL_ALIASES[0] || '';
  }
  const unique = new Map<string, string>();
  for (const o of raw) unique.set(o.value, o.label);
  if (want && !unique.has(want)) unique.set(want, want);
  const options = Array.from(unique.entries()).map(([value, label]) => ({ value, label }));
  return { options, value: want && unique.has(want) ? want : (raw[0]?.value || '') };
}

// 思考等级下拉框只保留当前模型实际支持的档位——k3-256k 只支持 low/high/max，
// 选了 minimal/medium/xhigh 这种 pi 内部会映射成 null，与其让它悄悄失效，不如
// 界面上压根不给选
export function thinkingLevelsFor(piModels: PiModel[], modelId: string): string[] {
  return piModels.find((m) => m.id === modelId)?.thinkingLevels ?? ALL_THINKING_LEVELS;
}
