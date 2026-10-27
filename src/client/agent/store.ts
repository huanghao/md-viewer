import type { AgentRun, AgentSession, AgentSessionSummary, AgentTranscriptMsg } from '../api/agent';

/**
 * Agent 面板的唯一状态来源。reducer 是纯函数，所有状态转移都在这里，便于单测；
 * 视图（现在是手写渲染，之后是 React 组件）只读 getState()，不持有自己的副本。
 */

export interface AgentState {
  docPath: string | null;
  sessionId: string | null;
  /** 当前正在跑的 run；SSE 事件只认这个 id */
  runId: string | null;
  /** 本页面收到的实时消息（当前 run） */
  live: AgentTranscriptMsg[];
  /** 服务端历史 run（不含运行中的那条） */
  pastRuns: AgentRun[];
  sessions: AgentSessionSummary[];
  /** 正在加载会话：消息区显示「加载中…」 */
  loading: boolean;
  /** 发送按钮禁用 + 状态栏计时。发送瞬间 runId 还没返回，所以单独一个标志 */
  running: boolean;
  runningSince: number;
}

export const initialAgentState: AgentState = {
  docPath: null,
  sessionId: null,
  runId: null,
  live: [],
  pastRuns: [],
  sessions: [],
  loading: false,
  running: false,
  runningSince: 0,
};

export type AgentAction =
  | { type: 'docChanged'; path: string | null }
  | { type: 'cleared' }
  | { type: 'loadStarted' }
  | { type: 'sessionFetched'; session: AgentSession | null; now: number }
  | { type: 'loaded'; runs: AgentRun[]; sessions: AgentSessionSummary[]; updatedAt?: number; now: number }
  | { type: 'sent'; text: string; now: number }
  | { type: 'runStarted'; runId: string; sessionId: string }
  | { type: 'startFailed'; text: string; now: number }
  | { type: 'progress'; event: any; now: number }
  | { type: 'runFinished'; ok: boolean; now: number };

const RECONNECT_PLACEHOLDER = '（重新连接到运行中的任务，等待后续更新…）';

export function truncate(text: string, max = 400): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function extractToolResultText(content: any): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((c) => (c?.type === 'text' ? c.text : '')).filter(Boolean).join('\n');
  }
  return '';
}

/** 一个 SSE progress 事件 → 要追加的消息 */
export function messagesFromProgressEvent(evt: any, now: number): AgentTranscriptMsg[] {
  const out: AgentTranscriptMsg[] = [];
  if (evt?.type === 'assistant') {
    const model = evt.message?.model;
    for (const block of evt.message?.content ?? []) {
      if (block.type === 'thinking' && block.thinking) {
        out.push({ kind: 'thinking', text: block.thinking, timestamp: now, model });
      } else if (block.type === 'text' && block.text) {
        out.push({ kind: 'text', text: block.text, timestamp: now, model });
      } else if (block.type === 'tool_use') {
        const inputSummary = block.input ? truncate(JSON.stringify(block.input), 150) : '';
        out.push({ kind: 'tool', text: `${block.name}${inputSummary ? ' ' + inputSummary : ''}`, timestamp: now, model });
      }
    }
  } else if (evt?.type === 'user') {
    for (const block of evt.message?.content ?? []) {
      if (block.type === 'tool_result') {
        const text = extractToolResultText(block.content);
        if (text) out.push({ kind: 'tool-result', text: truncate(text), timestamp: now });
      }
    }
  }
  return out;
}

export function reduceAgent(s: AgentState, a: AgentAction): AgentState {
  switch (a.type) {
    case 'docChanged':
      return { ...s, docPath: a.path };
    case 'cleared':
      return { ...s, live: [], pastRuns: [], sessionId: null };
    case 'loadStarted':
      return { ...s, loading: true };
    case 'sessionFetched': {
      const runId = a.session?.running ? a.session.runId : null;
      // 同一个 run 已经收到过实时消息就保留；占位只给「本页面没见过的 run」（刷新页面、换到别的会话）
      const live = !runId
        ? []
        : runId === s.runId && s.live.length > 0
          ? s.live
          : [{ kind: 'result' as const, text: RECONNECT_PLACEHOLDER, timestamp: a.now }];
      return { ...s, sessionId: a.session?.sessionId ?? null, runId, live };
    }
    case 'loaded':
      return {
        ...s,
        // 运行中的这条已经在实时事件里处理，历史里如果还带着 running 状态就剔除，避免重复展示
        pastRuns: a.runs.filter((r) => r.status !== 'running'),
        sessions: a.sessions,
        loading: false,
        running: !!s.runId,
        runningSince: s.runId ? (a.updatedAt ?? a.now) : s.runningSince,
      };
    case 'sent':
      return { ...s, live: [...s.live, { kind: 'user', text: a.text, timestamp: a.now }], running: true, runningSince: a.now };
    case 'runStarted':
      return { ...s, runId: a.runId, sessionId: a.sessionId };
    case 'startFailed':
      return { ...s, running: false, live: [...s.live, { kind: 'error', text: a.text, timestamp: a.now }] };
    case 'progress': {
      const added = messagesFromProgressEvent(a.event, a.now);
      return added.length ? { ...s, live: [...s.live, ...added] } : s;
    }
    case 'runFinished':
      return {
        ...s,
        runId: null,
        running: false,
        live: a.ok ? s.live : [...s.live, { kind: 'error', text: '✗ Agent 运行出错', timestamp: a.now }],
      };
  }
}

// ==================== store ====================

type Listener = () => void;

let state: AgentState = initialAgentState;
const listeners = new Set<Listener>();

export const agentStore = {
  getState: (): AgentState => state,
  dispatch(action: AgentAction): void {
    const next = reduceAgent(state, action);
    if (next === state) return;
    state = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener): () => void {
    listeners.add(l);
    return () => { listeners.delete(l); };
  },
  /** 仅测试用 */
  reset(): void {
    state = initialAgentState;
  },
};
