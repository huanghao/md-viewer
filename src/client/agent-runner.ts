import { state } from './state';
import {
  fetchAgentSession,
  fetchRunsBySession,
  fetchWorkspaceAgentSessions,
  linkAgentSession,
  newAgentSession,
} from './api/agent';
import { showError, showSuccess } from './ui/toast';
import { hydrateAnnotationsFromRemote } from './annotation/persistence';
import { agentStore } from './agent/store';
import { mountAgentViews } from './agent/mount';

/**
 * Agent 面板的控制层：会话加载/切换、SSE 事件入口。
 * 状态在 agent/store.ts，视图是 agent/ 下的 React 组件，这里不碰 DOM。
 */

const S = () => agentStore.getState();
let loadToken = 0;

function guessWorkspaceForPath(path: string): string | null {
  const candidates = state.config.workspaces
    .map((w) => w.path)
    .filter((p): p is string => !!p && (path === p || path.startsWith(p.endsWith('/') ? p : p + '/')));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

// ==================== 加载 ====================

export async function onAgentTabActivated(path: string | null): Promise<void> {
  const { docPath: currentDocPath, sessionId: currentSessionId, runId: activeRunId } = S();
  // 同一个工程内共用一个会话：换文档不需要重载对话，保留已经收到的实时消息，
  // 否则运行中切换文档会丢掉已流出的内容，只剩一条"重新连接"占位
  // 评论 tab 切回 Agent tab 时 path 不变，运行中同样不能重载，否则流出的内容会被"重新连接"占位顶掉
  if (path && currentDocPath && currentSessionId && (path !== currentDocPath || activeRunId)) {
    const ws = guessWorkspaceForPath(path);
    if (path === currentDocPath || (ws && ws === guessWorkspaceForPath(currentDocPath))) {
      agentStore.dispatch({ type: 'docChanged', path });
      return;
    }
  }
  agentStore.dispatch({ type: 'docChanged', path });
  if (!path) {
    agentStore.dispatch({ type: 'cleared' });
    return;
  }
  await reloadConversation(path);
}

async function reloadConversation(path: string): Promise<void> {
  const token = ++loadToken;
  agentStore.dispatch({ type: 'loadStarted' });

  const session = await fetchAgentSession(path).catch(() => null);
  if (token !== loadToken) return;
  agentStore.dispatch({ type: 'sessionFetched', session, now: Date.now() });

  const sessionId = S().sessionId;
  const runs = sessionId ? await fetchRunsBySession(sessionId).catch(() => []) : [];
  if (token !== loadToken) return;

  const workspace = guessWorkspaceForPath(path);
  const sessions = workspace ? await fetchWorkspaceAgentSessions(workspace).catch(() => []) : [];
  if (token !== loadToken) return;

  agentStore.dispatch({ type: 'loaded', runs, sessions, updatedAt: session?.updatedAt, now: Date.now() });
}

// ==================== 会话操作 ====================

async function createNewAgentSession(): Promise<boolean> {
  const path = S().docPath;
  if (!path) return false;
  try {
    await newAgentSession(path);
    showSuccess('已新建会话，本工程的文档之后都会用它');
    await reloadConversation(path);
    return true;
  } catch (err: any) {
    showError(err?.message || '操作失败');
    await reloadConversation(path);
    return false;
  }
}

async function linkAgentSessionById(sessionId: string): Promise<boolean> {
  const path = S().docPath;
  if (!path || !sessionId) return false;
  try {
    await linkAgentSession(path, sessionId);
    showSuccess('已切换，本工程的文档之后都会用这个会话');
    await reloadConversation(path);
    return true;
  } catch (err: any) {
    showError(err?.message || '操作失败');
    await reloadConversation(path);
    return false;
  }
}

export function initAgentRunner(): void {
  mountAgentViews({ onNewSession: createNewAgentSession, onLinkSession: linkAgentSessionById });
}

// ==================== SSE ====================

export function handleAgentProgressEvent(data: { runId: string; docPath: string; event: any }): void {
  if (data.runId !== S().runId) return;
  agentStore.dispatch({ type: 'progress', event: data.event, now: Date.now() });
}

export function handleAgentRunStatusEvent(data: { runId: string; docPath: string; status: string; usage?: any }): void {
  if (data.runId !== S().runId) return;
  // 成功态由 run 分隔条 / 统计条展示；不再额外插入一条“完成”消息，占用一行。
  agentStore.dispatch({ type: 'runFinished', ok: data.status === 'success', now: Date.now() });
  // agent 处理批注会通过 CLI 往库里写回复，运行结束后刷新当前文档的评论
  if (data.docPath === state.currentFile) void hydrateAnnotationsFromRemote(data.docPath);

  // 这一轮结束后，把它并入历史
  const docPath = S().docPath;
  if (docPath) void reloadConversation(docPath);
}
