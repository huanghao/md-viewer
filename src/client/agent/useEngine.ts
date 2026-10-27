import { useEffect, useMemo, useState } from 'react';
import { fetchAgentBackends, type AgentBackendStatus, type PiModel } from '../api/agent';
import {
  AGENT_ENGINES,
  AGENT_ENGINE_KEY,
  AGENT_MODEL_OVERRIDE_KEY,
  buildModelOptions,
  engineAvailability,
  ensurePiModels,
  ensurePiProviders,
  findEngine,
  pickEngine,
  thinkingLevelsFor,
} from './engines';

function lsGet(key: string): string {
  try { return localStorage.getItem(key) || ''; } catch { return ''; }
}
function lsSet(key: string, value: string | null): void {
  try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value); } catch { /* 无存储时忽略 */ }
}

/** 引擎 / 模型 / 思考强度三个下拉框的状态与派生数据 */
export function useEngine() {
  const [backends, setBackends] = useState<AgentBackendStatus[]>([]);
  const [providers, setProviders] = useState<string[]>([]);
  const [userEngine, setUserEngine] = useState<string | null>(null);
  const [touchedModel, setTouchedModel] = useState<string | null>(null);
  const [thinkingChoice, setThinkingChoice] = useState('');
  const [piModels, setPiModels] = useState<PiModel[]>([]);

  useEffect(() => {
    let alive = true;
    void fetchAgentBackends().catch(() => []).then((b) => alive && setBackends(b));
    void ensurePiProviders().then((p) => alive && setProviders(p));
    return () => { alive = false; };
  }, []);

  const availability = useMemo(() => engineAvailability(providers, backends), [providers, backends]);
  const engineId = userEngine ?? pickEngine(lsGet(AGENT_ENGINE_KEY), availability);
  const engine = findEngine(engineId);
  const provider = engine.provider;

  useEffect(() => {
    if (!provider) { setPiModels([]); return; }
    let alive = true;
    void ensurePiModels(provider).then((m) => alive && setPiModels(m));
    return () => { alive = false; };
  }, [provider]);

  const defaultModel = backends.find((b) => b.name === engine.backend)?.defaultModel || '';
  const wanted = touchedModel ?? (lsGet(`${AGENT_MODEL_OVERRIDE_KEY}:${engine.id}`) || defaultModel);
  const { options: modelOptions, value: model } = buildModelOptions(engine, backends, piModels, wanted);

  const isPi = engine.backend === 'pi';
  const thinkingLevels = isPi ? thinkingLevelsFor(piModels, model || defaultModel) : [];
  const thinking = thinkingLevels.includes(thinkingChoice) ? thinkingChoice : '';

  return {
    engines: AGENT_ENGINES.map((e) => ({ ...e, available: !!availability.get(e.id) })),
    engineId,
    modelOptions,
    model,
    isPi,
    thinkingLevels,
    thinking,
    setEngine(id: string) {
      setUserEngine(id);
      lsSet(AGENT_ENGINE_KEY, !id || id === AGENT_ENGINES[0].id ? null : id);
      setTouchedModel(null);
    },
    setModel(value: string) {
      setTouchedModel(value);
      const v = value.trim();
      lsSet(`${AGENT_MODEL_OVERRIDE_KEY}:${engine.id}`, !v || v === defaultModel ? null : v);
    },
    setThinking: setThinkingChoice,
    /** 发送时用的参数；模型等于后端默认值时不传，由服务端用默认 */
    runParams() {
      return {
        backend: engine.backend,
        provider,
        model: model && model !== defaultModel ? model : undefined,
        thinking: isPi ? (thinking || undefined) : undefined,
      };
    },
  };
}
