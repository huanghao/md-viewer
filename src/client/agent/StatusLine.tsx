import { useEffect, useState } from 'react';
import { fmtDuration } from './format';
import { useAgentState } from './useAgentState';

/** 运行中：「Agent 运行中… 12s」，几秒刷新一次，不需要秒表精度 */
export function StatusLine() {
  const running = useAgentState((s) => s.running);
  const since = useAgentState((s) => s.runningSince);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(t);
  }, [running, since]);

  return <>{running ? `Agent 运行中… ${fmtDuration(Math.max(0, now - since))}` : ''}</>;
}
