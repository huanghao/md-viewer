import type { AgentSessionSummary, AgentTranscriptMsg } from '../api/agent';

export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

// human-readable token 数：1.2k / 3.4M，不需要精确到个位
export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M tokens`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k tokens`;
  return `${n} tokens`;
}

/** 成功态由 run 分隔条 / 统计条展示，不再单独占一行 */
export function shouldRenderMsg(m: AgentTranscriptMsg): boolean {
  return !(m.kind === 'result' && m.text.startsWith('✓ 完成'));
}

// 统一的 session 标签格式：优先用第一条 prompt 的预览而不是 doc 名 + id 前缀——
// 光看 id 前缀认不出是不是同一个会话。当前文档自己的 session 和"关联到已有会话"
// 列表里的其它 session 必须用同一套格式。
export function formatSessionLabel(s: AgentSessionSummary): string {
  const label = s.firstPrompt || (s.docPaths[0]?.split('/').pop() || s.docPaths[0]);
  const docCount = s.docPaths.length > 1 ? `，关联 ${s.docPaths.length} 个文档` : '';
  return `${label} (${s.sessionId.slice(0, 8)}${docCount})`;
}
