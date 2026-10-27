import { fmtDuration, fmtTokens } from './format';
import { useAgentState } from './useAgentState';

export function Stats() {
  const runs = useAgentState((s) => s.pastRuns);
  if (runs.length === 0) return null;
  const totalTokens = runs.reduce((sum, r) => sum + (r.usage.inputTokens || 0) + (r.usage.outputTokens || 0), 0);
  const first = runs[0].startedAt;
  const last = runs[runs.length - 1].finishedAt || runs[runs.length - 1].startedAt;
  return <>{`${runs.length} 次运行 · 总时长 ${fmtDuration(last - first)} · ${fmtTokens(totalTokens)}`}</>;
}
