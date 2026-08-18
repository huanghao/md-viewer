import { state } from './state';
import { getElements } from './annotation-layout';
import {
  fetchAgentBackends,
  fetchAgentSession,
  fetchRunsBySession,
  fetchWorkspaceAgentSessions,
  linkAgentSession,
  newAgentSession,
  startAgentRun,
  type AgentBackendStatus,
  type AgentRun,
  type AgentSession,
  type AgentTranscriptMsg,
} from './api/agent';
import { showError, showSuccess } from './ui/toast';
import { escapeHtml } from './utils/escape';

const AGENT_BACKEND_KEY = 'md-viewer:agent-backend';

let currentDocPath: string | null = null;
let currentSessionId: string | null = null;
let activeRunId: string | null = null;
let liveMessages: AgentTranscriptMsg[] = [];
let pastRuns: AgentRun[] = [];
let agentBackends: AgentBackendStatus[] = [];
let loadToken = 0;

function guessWorkspaceForPath(path: string): string | null {
  const candidates = state.config.workspaces
    .map((w) => w.path)
    .filter((p): p is string => !!p && (path === p || path.startsWith(p.endsWith('/') ? p : p + '/')));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

function fmtTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function fmtDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m${s % 60}s`;
}

function truncate(text: string, max = 400): string {
  return text.length > max ? text.slice(0, max) + '…' : text;
}

function extractToolResultText(content: any): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((c) => (c?.type === 'text' ? c.text : '')).filter(Boolean).join('\n');
  }
  return '';
}

// ==================== 渲染 ====================

function renderMsgHtml(m: AgentTranscriptMsg): string {
  const time = `<span class="agent-msg-time">${fmtTime(m.timestamp)}</span>`;
  if (m.kind === 'user') return `<div class="agent-msg agent-msg-user">${escapeHtml(m.text)}${time}</div>`;
  if (m.kind === 'tool') return `<div class="agent-msg agent-msg-tool">🔧 ${escapeHtml(m.text)}${time}</div>`;
  if (m.kind === 'tool-result') return `<div class="agent-msg agent-msg-tool">→ ${escapeHtml(m.text)}${time}</div>`;
  if (m.kind === 'error') return `<div class="agent-msg agent-msg-error">${escapeHtml(m.text)}${time}</div>`;
  if (m.kind === 'result') return `<div class="agent-msg agent-msg-result">${escapeHtml(m.text)}${time}</div>`;
  const modelBadge = m.model ? `<span class="agent-msg-model">${escapeHtml(m.model)}</span>` : '';
  return `<div class="agent-msg agent-msg-text">${modelBadge}${escapeHtml(m.text)}${time}</div>`;
}

function renderRunDivider(run: AgentRun): string {
  const time = new Date(run.startedAt).toLocaleString();
  const duration = run.finishedAt ? fmtDuration(run.finishedAt - run.startedAt) : '运行中';
  const cost = typeof run.usage.costUsd === 'number' ? `$${run.usage.costUsd.toFixed(3)}` : '';
  const cmd = run.command ? (() => { try { return JSON.parse(run.command)[0]; } catch { return ''; } })() : '';
  return `<div class="agent-run-divider">${time} · ${duration}${cost ? ' · ' + cost : ''}${cmd ? ' · ' + escapeHtml(cmd) : ''}</div>`;
}

function renderMessages(): void {
  const el = getElements().agentChatMessages;
  if (!el) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;

  const historyHtml = pastRuns.map((r) => renderRunDivider(r) + (r.transcript ?? []).map(renderMsgHtml).join('')).join('');
  const liveHtml = liveMessages.map(renderMsgHtml).join('');

  if (!historyHtml && !liveHtml) {
    el.innerHTML = `<div class="agent-chat-empty">还没有对话，在下面输入内容开始，或者留空直接发送 = 处理这个文档的批注。</div>`;
  } else {
    el.innerHTML = historyHtml + liveHtml;
  }
  if (nearBottom) el.scrollTop = el.scrollHeight;
}

function renderStats(): void {
  const el = getElements().agentChatStats;
  if (!el) return;
  if (pastRuns.length === 0) {
    el.textContent = '';
    return;
  }
  const totalCost = pastRuns.reduce((s, r) => s + (r.usage.costUsd || 0), 0);
  const totalTokens = pastRuns.reduce((s, r) => s + (r.usage.inputTokens || 0) + (r.usage.outputTokens || 0), 0);
  const first = pastRuns[0].startedAt;
  const last = pastRuns[pastRuns.length - 1].finishedAt || pastRuns[pastRuns.length - 1].startedAt;
  el.textContent = `${pastRuns.length} 次运行 · 总时长 ${fmtDuration(last - first)} · ${totalTokens.toLocaleString()} tokens · $${totalCost.toFixed(3)}`;
}

function renderSessionSelect(sessions: AgentSession[]): void {
  const select = getElements().agentSessionSelect;
  if (!select) return;
  const selfLabel = currentSessionId ? `当前文档会话 (${currentSessionId.slice(0, 8)})` : '新建当前文档会话';
  const options = [`<option value="__self__">${escapeHtml(selfLabel)}</option>`];
  if (currentSessionId) options.push(`<option value="__new__">新建会话（放弃当前上下文）</option>`);
  for (const s of sessions) {
    if (s.sessionId === currentSessionId) continue;
    const name = s.docPath.split('/').pop() || s.docPath;
    options.push(`<option value="${escapeHtml(s.sessionId)}">关联历史：${escapeHtml(name)} (${s.sessionId.slice(0, 8)})</option>`);
  }
  select.innerHTML = options.join('');
  select.value = '__self__';
}

function renderBackendSelect(): void {
  const select = getElements().agentBackendSelect;
  if (!select) return;
  const saved = localStorage.getItem(AGENT_BACKEND_KEY) || '';
  const options = [`<option value="">默认 backend</option>`];
  for (const backend of agentBackends) {
    const suffix = backend.default ? ' · 默认' : backend.unavailableReason ? ' · 不可用' : '';
    options.push(`<option value="${escapeHtml(backend.name)}"${backend.unavailableReason ? ' disabled' : ''}>${escapeHtml(backend.name)}${suffix}</option>`);
  }
  select.innerHTML = options.join('');
  select.value = saved && agentBackends.some((backend) => backend.name === saved && !backend.unavailableReason) ? saved : '';
}

function renderContextHint(): void {
  const el = getElements().agentChatContext;
  if (!el) return;
  el.textContent = '上下文：当前文档路径 + mdv 批注；连续性来自 CLI session resume。';
}

function setRunning(running: boolean): void {
  const btn = getElements().agentChatSendBtn;
  if (btn) {
    btn.disabled = running;
    btn.classList.toggle('is-running', running);
  }
  const status = getElements().agentChatStatus;
  if (status) status.textContent = running ? 'Agent 运行中…' : '';
}

// ==================== 加载 ====================

export async function onAgentTabActivated(path: string | null): Promise<void> {
  currentDocPath = path;
  renderContextHint();
  if (agentBackends.length === 0) {
    agentBackends = await fetchAgentBackends().catch(() => []);
    renderBackendSelect();
  }
  if (!path) {
    liveMessages = [];
    pastRuns = [];
    currentSessionId = null;
    renderMessages();
    renderStats();
    return;
  }
  await reloadConversation(path);
}

async function reloadConversation(path: string): Promise<void> {
  const token = ++loadToken;
  const el = getElements().agentChatMessages;
  if (el) el.innerHTML = `<div class="agent-chat-empty">加载中…</div>`;

  const session = await fetchAgentSession(path).catch(() => null);
  if (token !== loadToken) return;

  currentSessionId = session?.sessionId ?? null;
  activeRunId = session?.running ? session.runId : null;
  liveMessages = activeRunId ? [{ kind: 'result', text: '（重新连接到运行中的任务，等待后续更新…）', timestamp: Date.now() }] : [];

  if (currentSessionId) {
    pastRuns = await fetchRunsBySession(currentSessionId).catch(() => []);
    if (token !== loadToken) return;
    // 运行中的这条已经在实时事件里处理，历史列表里如果还带着 running 状态就先剔除，避免重复展示
    pastRuns = pastRuns.filter((r) => r.status !== 'running');
  } else {
    pastRuns = [];
  }

  const workspace = guessWorkspaceForPath(path);
  const sessions = workspace ? await fetchWorkspaceAgentSessions(workspace).catch(() => []) : [];
  if (token !== loadToken) return;

  renderSessionSelect(sessions);
  renderMessages();
  renderStats();
  setRunning(!!activeRunId);
}

// ==================== 交互 ====================

export function initAgentRunner(): void {
  renderContextHint();
  getElements().agentChatSendBtn?.addEventListener('click', () => {
    void triggerAgentRun();
  });

  getElements().agentChatInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    // Enter 换行（textarea 默认行为），⌘/Ctrl+Enter 才发送
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void triggerAgentRun();
    }
  });

  getElements().agentSessionSelect?.addEventListener('change', () => {
    void handleSessionSelectChange();
  });

  getElements().agentBackendSelect?.addEventListener('change', () => {
    const value = getElements().agentBackendSelect?.value || '';
    if (value) localStorage.setItem(AGENT_BACKEND_KEY, value);
    else localStorage.removeItem(AGENT_BACKEND_KEY);
  });

  void fetchAgentBackends().then((backends) => {
    agentBackends = backends;
    renderBackendSelect();
  }).catch(() => {
    agentBackends = [];
    renderBackendSelect();
  });
}

async function handleSessionSelectChange(): Promise<void> {
  const select = getElements().agentSessionSelect;
  const path = currentDocPath;
  if (!select || !path) return;
  const value = select.value;
  if (value === '__self__') return;

  try {
    if (value === '__new__') {
      await newAgentSession(path);
      showSuccess('已新建会话');
    } else {
      await linkAgentSession(path, value);
      showSuccess('已关联，下次运行会共享这个会话的上下文');
    }
    await reloadConversation(path);
  } catch (err: any) {
    showError(err?.message || '操作失败');
    await reloadConversation(path);
  }
}

async function triggerAgentRun(): Promise<void> {
  const path = state.currentFile;
  if (!path) {
    showError('请先打开一个文档');
    return;
  }
  if (activeRunId) return;

  const input = getElements().agentChatInput;
  const prompt = input?.value.trim() || undefined;
  const backend = getElements().agentBackendSelect?.value || undefined;
  const model = getElements().agentModelInput?.value.trim() || undefined;
  const displayText = prompt || '处理这个文档的批注';

  if (input) input.value = '';

  liveMessages.push({ kind: 'user', text: displayText, timestamp: Date.now() });
  setRunning(true);
  renderMessages();

  try {
    const { runId, sessionId } = await startAgentRun(path, { backend, model, prompt });
    activeRunId = runId;
    currentSessionId = sessionId;
  } catch (err: any) {
    setRunning(false);
    liveMessages.push({ kind: 'error', text: err?.message || '启动 Agent 失败', timestamp: Date.now() });
    renderMessages();
  }
}

// ==================== SSE ====================

export function handleAgentProgressEvent(data: { runId: string; docPath: string; event: any }): void {
  if (data.runId !== activeRunId) return;
  const evt = data.event;
  const now = Date.now();

  if (evt?.type === 'assistant') {
    const model = evt.message?.model;
    for (const block of evt.message?.content ?? []) {
      if (block.type === 'text' && block.text) {
        liveMessages.push({ kind: 'text', text: block.text, timestamp: now, model });
      } else if (block.type === 'tool_use') {
        const inputSummary = block.input ? truncate(JSON.stringify(block.input), 150) : '';
        liveMessages.push({ kind: 'tool', text: `${block.name}${inputSummary ? ' ' + inputSummary : ''}`, timestamp: now, model });
      }
    }
    renderMessages();
  } else if (evt?.type === 'user') {
    for (const block of evt.message?.content ?? []) {
      if (block.type === 'tool_result') {
        const text = extractToolResultText(block.content);
        if (text) liveMessages.push({ kind: 'tool-result', text: truncate(text), timestamp: now });
      }
    }
    renderMessages();
  }
}

export function handleAgentRunStatusEvent(data: { runId: string; docPath: string; status: string; usage?: any }): void {
  if (data.runId !== activeRunId) return;
  activeRunId = null;
  setRunning(false);

  const usage = data.usage;
  const tokens = usage ? (usage.inputTokens || 0) + (usage.outputTokens || 0) : 0;
  const cost = typeof usage?.costUsd === 'number' ? `$${usage.costUsd.toFixed(3)}` : '';
  if (data.status === 'success') {
    liveMessages.push({ kind: 'result', text: `✓ 完成${tokens ? ' · ' + tokens + ' tokens' : ''}${cost ? ' · ' + cost : ''}`, timestamp: Date.now() });
  } else {
    liveMessages.push({ kind: 'error', text: '✗ Agent 运行出错', timestamp: Date.now() });
  }
  renderMessages();

  // 这一轮结束后，把它并入历史（下次重新打开该文档 tab 会从服务端重新拉取，这里只是让统计条数字先跟上）
  if (currentDocPath) void reloadConversation(currentDocPath);
}
