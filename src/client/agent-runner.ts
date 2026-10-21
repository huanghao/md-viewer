import { state } from './state';
import { getElements } from './annotation-layout';
import {
  fetchAgentBackends,
  fetchAgentSession,
  fetchPiModels,
  fetchPiProviders,
  fetchRunsBySession,
  fetchWorkspaceAgentSessions,
  linkAgentSession,
  newAgentSession,
  startAgentRun,
  type AgentBackendStatus,
  type AgentRun,
  type AgentSession,
  type AgentSessionSummary,
  type AgentTranscriptMsg,
  type PiModel,
} from './api/agent';
import { showError, showSuccess } from './ui/toast';
import { escapeHtml } from './utils/escape';
import { buildTrayPromptPrefix, clearTray, renderTray } from './agent-tray';
import { renderMath } from './content-renderer';
import { storageGetNumber, storageSet } from './utils/storage';

const AGENT_MODEL_OVERRIDE_KEY = 'md-viewer:agent-model-override';

let currentDocPath: string | null = null;
let currentSessionId: string | null = null;
let activeRunId: string | null = null;
let liveMessages: AgentTranscriptMsg[] = [];
let pastRuns: AgentRun[] = [];
let agentBackends: AgentBackendStatus[] = [];
let modelInputTouched = false;
let loadToken = 0;

function guessWorkspaceForPath(path: string): string | null {
  const candidates = state.config.workspaces
    .map((w) => w.path)
    .filter((p): p is string => !!p && (path === p || path.startsWith(p.endsWith('/') ? p : p + '/')));
  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

// 输入框上方的 /mdv 命令 chip：点 /mdv 按钮后出现 [/mdv] [文档相对路径]，发送时拼成
// `/mdv <path> <更多文本>`（mdv skill 本来就认这个形状）。路径 chip 可以单独删掉，
// 然后在文本里自己写别的文件名或绝对路径；命令 chip 删掉则退回普通消息。
let mdvChipOn = false;
let mdvPathChipOn = false;

// 相对 workspace 根（agent 的 cwd 就是它）；不在任何 workspace 里时 cwd 是文档所在目录，只剩文件名
function docRelPath(path: string): string {
  const ws = guessWorkspaceForPath(path);
  if (ws) return path.slice(ws.endsWith('/') ? ws.length : ws.length + 1);
  return path.split('/').pop() || path;
}

function quoteIfNeeded(text: string): string {
  return /\s/.test(text) ? `"${text}"` : text;
}

function renderChatChips(): void {
  const el = getElements().agentChatChips;
  const btn = getElements().agentMdvBtn;
  btn?.classList.toggle('is-active', mdvChipOn);
  if (!el) return;
  const file = state.currentFile;
  if (!mdvChipOn) {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }
  const chip = (kind: string, label: string, extra = '') =>
    `<span class="agent-chat-chip${extra}"><span class="agent-chat-chip-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>` +
    `<button class="agent-chat-chip-remove" type="button" data-chip="${kind}" aria-label="移除">×</button></span>`;
  el.innerHTML = chip('mdv', '/mdv', ' is-command') + (mdvPathChipOn && file ? chip('path', docRelPath(file)) : '');
  el.classList.remove('hidden');
}

function removeLastChatChip(): boolean {
  if (mdvPathChipOn) mdvPathChipOn = false;
  else if (mdvChipOn) mdvChipOn = false;
  else return false;
  renderChatChips();
  return true;
}

function activateMdvChip(): void {
  mdvChipOn = true;
  mdvPathChipOn = true;
  renderChatChips();
  getElements().agentChatInput?.focus();
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

// human-readable token 数：1.2k / 3.4M，不需要精确到个位
function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M tokens`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}k tokens`;
  return `${n} tokens`;
}

// 助手回复按 markdown 渲染（复用正文渲染同一个 marked 实例），其它消息类型
// 保持纯文本——状态行/工具调用没有 markdown 语义，escape 更安全
function renderMarkdown(text: string): string {
  try {
    return (window as any).marked.parse(text);
  } catch {
    return escapeHtml(text);
  }
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
  if (m.kind === 'thinking') return `<div class="agent-msg agent-msg-thinking">💭 ${escapeHtml(m.text)}${time}</div>`;
  return `<div class="agent-msg agent-msg-text agent-msg-markdown">${renderMarkdown(m.text)}${time}</div>`;
}

function shouldRenderMsg(m: AgentTranscriptMsg): boolean {
  return !(m.kind === 'result' && m.text.startsWith('✓ 完成'));
}

function renderRunDivider(run: AgentRun): string {
  const time = new Date(run.startedAt).toLocaleString();
  const duration = run.finishedAt ? fmtDuration(run.finishedAt - run.startedAt) : '运行中';
  const cmd = run.command ? (() => { try { return JSON.parse(run.command)[0]; } catch { return ''; } })() : '';
  return `<div class="agent-run-divider">${time} · ${duration}${cmd ? ' · ' + escapeHtml(cmd) : ''}</div>`;
}

function renderMessages(): void {
  const el = getElements().agentChatMessages;
  if (!el) return;
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;

  const historyHtml = pastRuns.map((r) => renderRunDivider(r) + (r.transcript ?? []).filter(shouldRenderMsg).map(renderMsgHtml).join('')).join('');
  const liveHtml = liveMessages.filter(shouldRenderMsg).map(renderMsgHtml).join('');

  if (!historyHtml && !liveHtml) {
    el.innerHTML = `<div class="agent-chat-empty">还没有对话，在下面输入内容开始，或点 /mdv 处理这个文档的批注。</div>`;
  } else {
    el.innerHTML = historyHtml + liveHtml;
    renderMath(el);
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
  const totalTokens = pastRuns.reduce((s, r) => s + (r.usage.inputTokens || 0) + (r.usage.outputTokens || 0), 0);
  const first = pastRuns[0].startedAt;
  const last = pastRuns[pastRuns.length - 1].finishedAt || pastRuns[pastRuns.length - 1].startedAt;
  el.textContent = `${pastRuns.length} 次运行 · 总时长 ${fmtDuration(last - first)} · ${fmtTokens(totalTokens)}`;
}

// 统一的 session 标签格式：优先用第一条 prompt 的预览而不是 doc 名 + id 前缀——
// 光看 id 前缀认不出是不是同一个会话。当前文档自己的 session 和"关联到已有会话"
// 列表里的其它 session 必须用同一套格式，不然会出现「关联前是文字预览、关联后
// 突然只剩 id」这种不一致，反而更难辨认。
function formatSessionLabel(s: AgentSessionSummary): string {
  const label = s.firstPrompt || (s.docPaths[0]?.split('/').pop() || s.docPaths[0]);
  const docCount = s.docPaths.length > 1 ? `，关联 ${s.docPaths.length} 个文档` : '';
  return `${label} (${s.sessionId.slice(0, 8)}${docCount})`;
}

function renderSessionSelect(sessions: AgentSessionSummary[]): void {
  const list = getElements().agentSessionList;
  const button = getElements().agentSessionMenuButton;
  if (!list) return;
  const current = sessions.find((s) => s.sessionId === currentSessionId);
  if (button) {
    const title = current ? formatSessionLabel(current) : (currentSessionId ? `当前文档会话 (${currentSessionId.slice(0, 8)})` : 'Recent sessions');
    button.title = `Recent sessions · ${title}`;
  }
  if (sessions.length === 0) {
    list.innerHTML = `<div class="agent-session-empty">暂无历史会话</div>`;
    return;
  }
  list.innerHTML = sessions.map((s) => {
    const isCurrent = s.sessionId === currentSessionId;
    return `
      <button class="agent-session-item${isCurrent ? ' is-current' : ''}" type="button" data-session-id="${escapeHtml(s.sessionId)}"${isCurrent ? ' disabled' : ''}>
        <span class="agent-session-title">${escapeHtml(isCurrent ? `当前：${formatSessionLabel(s)}` : formatSessionLabel(s))}</span>
      </button>
    `;
  }).join('');
}

// 界面上只暴露一个"选哪个引擎"的下拉框，UI/业务完全不知道背后是 pi 还是本机 claude
// CLI——这张表是唯一知道两条路径存在的地方。去掉其中一条（比如去掉 codex 这一行）
// 不影响另外两条：每条只认自己的 backend/provider，互不读对方的状态。
interface AgentEngine {
  id: string;
  label: string;
  backend: string;
  provider?: string; // 只有 backend === 'pi' 的引擎才有
}
const AGENT_ENGINES: AgentEngine[] = [
  { id: 'kimi', label: 'Kimi', backend: 'pi', provider: 'kimi-coding' },
  { id: 'codex', label: 'Codex', backend: 'pi', provider: 'openai-codex' },
  { id: 'cc', label: 'Claude Code', backend: 'claude' },
];
const AGENT_ENGINE_KEY = 'md-viewer:agent-engine';
const CLAUDE_MODEL_ALIASES = ['sonnet', 'opus', 'haiku', 'fable'];

function currentEngine(): AgentEngine {
  const id = getElements().agentEngineSelect?.value || '';
  return AGENT_ENGINES.find((e) => e.id === id) || AGENT_ENGINES[0];
}

// pi 侧可能同时登录了多个 provider，每个都有自己独立的模型目录 + thinking 档位，
// 按 provider 分开缓存；claude（cc）走本机 CLI，走的是固定别名，不用缓存
let piProviders: string[] | null = null;
let piProvidersPromise: Promise<string[]> | null = null;
const piModelsByProvider = new Map<string, PiModel[]>();
const piModelsPromiseByProvider = new Map<string, Promise<PiModel[]>>();

async function ensurePiProviders(): Promise<string[]> {
  if (piProviders) return piProviders;
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
async function ensurePiModels(provider: string): Promise<PiModel[]> {
  const cached = piModelsByProvider.get(provider);
  if (cached) return cached;
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

// 引擎下拉框只列 3 个固定选项，但要能反映真实可用性：pi 侧引擎要求对应 provider
// 真的登录过（走 /api/agent/pi-providers），claude（cc）引擎要求 backend 状态里没有
// unavailableReason——不可用的选项禁用但仍然可见，不是直接从列表消失
async function renderEngineSelect(): Promise<void> {
  const select = getElements().agentEngineSelect;
  if (!select) return;
  const providers = await ensurePiProviders();
  const claudeBackend = agentBackends.find((b) => b.name === 'claude');
  const availability = new Map<string, boolean>();
  for (const engine of AGENT_ENGINES) {
    const available = engine.backend === 'pi'
      ? providers.includes(engine.provider || '')
      : !claudeBackend || !claudeBackend.unavailableReason;
    availability.set(engine.id, available);
  }

  const saved = localStorage.getItem(AGENT_ENGINE_KEY) || '';
  const selected = availability.get(saved)
    ? saved
    : AGENT_ENGINES.find((e) => availability.get(e.id))?.id || AGENT_ENGINES[0].id;

  select.innerHTML = AGENT_ENGINES.map((engine) => {
    const ok = availability.get(engine.id);
    return `<option value="${escapeHtml(engine.id)}"${ok ? '' : ' disabled'}>${escapeHtml(engine.label)}${ok ? '' : '（不可用）'}</option>`;
  }).join('');
  select.value = selected;
  await syncModelInputForEngine(selected);
}

// 思考等级下拉框只保留当前模型实际支持的档位——k3-256k 只支持 low/high/max，
// 选了 minimal/medium/xhigh 这种 pi 内部会映射成 null，与其让它悄悄失效，不如
// 界面上压根不给选
function updateThinkingOptionsForModel(modelId: string): void {
  const select = getElements().agentThinkingLevel;
  if (!select) return;
  const engine = currentEngine();
  const model = engine.provider ? piModelsByProvider.get(engine.provider)?.find((m) => m.id === modelId) : undefined;
  const levels = model?.thinkingLevels ?? ['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'];
  const current = select.value;
  select.innerHTML = ['<option value="">默认</option>', ...levels.map((l) => `<option value="${escapeHtml(l)}">${escapeHtml(l)}</option>`)].join('');
  select.value = levels.includes(current) ? current : '';
}

function renderModelOptions(options: { value: string; label: string }[], selected: string): void {
  const select = getElements().agentModelInput;
  if (!select) return;
  const unique = new Map<string, string>();
  for (const option of options) unique.set(option.value, option.label);
  if (selected && !unique.has(selected)) unique.set(selected, selected);
  select.innerHTML = Array.from(unique.entries()).map(([value, label]) =>
    `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
  ).join('');
  select.value = selected && unique.has(selected) ? selected : (options[0]?.value || '');
}

function updateModelOptions(engine: AgentEngine, selected: string): void {
  if (engine.backend === 'pi' && engine.provider) {
    void ensurePiModels(engine.provider).then((models) => {
      renderModelOptions(models.map((m) => ({ value: m.id, label: m.name })), selected);
      updateThinkingOptionsForModel(getElements().agentModelInput?.value.trim() || '');
      renderModelMenuButton();
    });
  } else {
    const backend = agentBackends.find((item) => item.name === engine.backend);
    const defaultModel = backend?.defaultModel || '';
    renderModelOptions([
      ...(defaultModel ? [{ value: defaultModel, label: `${defaultModel}（默认）` }] : []),
      ...CLAUDE_MODEL_ALIASES.map((model) => ({ value: model, label: model })),
    ], selected || defaultModel || CLAUDE_MODEL_ALIASES[0] || '');
  }
}

async function syncModelInputForEngine(engineId: string): Promise<void> {
  const engine = AGENT_ENGINES.find((e) => e.id === engineId) || AGENT_ENGINES[0];
  // /settings 之类 TUI 内置命令在 -p 非交互模式下不会被处理，直接打进输入框只会当成
  // 普通消息发出去（pi 自己遇到这种情况会回一句"这是 TUI 命令，我这跑不了"）——
  // 思考强度只能靠这个下拉框传 --thinking，claude（cc）没有这个概念，切走就藏起来
  getElements().agentThinkingSection?.classList.toggle('hidden', engine.backend !== 'pi');

  const input = getElements().agentModelInput;
  if (!input) return;
  const backend = agentBackends.find((item) => item.name === engine.backend);
  const defaultModel = backend?.defaultModel || '';
  const override = localStorage.getItem(`${AGENT_MODEL_OVERRIDE_KEY}:${engine.id}`) || '';
  const selected = modelInputTouched ? input.value : (override || defaultModel);
  updateModelOptions(engine, selected);
  renderModelMenuButton();
}

function renderModelMenuButton(): void {
  const button = getElements().agentModelMenuButton;
  if (!button) return;
  const engine = currentEngine();
  const model = getElements().agentModelInput?.value.trim() || 'model';
  const thinking = engine.backend === 'pi' ? (getElements().agentThinkingLevel?.value || 'default') : 'default';
  button.textContent = `${engine.label}/${model}/${thinking}`;
}

function closeAgentMenus(except?: HTMLElement | null): void {
  for (const menu of [getElements().agentModelMenu, getElements().agentSessionMenu]) {
    if (menu && menu !== except) menu.classList.add('hidden');
  }
}

function toggleAgentMenu(menu: HTMLElement | null): void {
  if (!menu) return;
  const nextOpen = menu.classList.contains('hidden');
  closeAgentMenus(menu);
  menu.classList.toggle('hidden', !nextOpen);
}

let runningTicker: ReturnType<typeof setInterval> | null = null;
let runningSince = 0;

function stopRunningTicker(): void {
  if (runningTicker) {
    clearInterval(runningTicker);
    runningTicker = null;
  }
}

function tickRunningStatus(): void {
  const status = getElements().agentChatStatus;
  if (status) status.textContent = `Agent 运行中… ${fmtDuration(Date.now() - runningSince)}`;
}

function setRunning(running: boolean, since?: number): void {
  const btn = getElements().agentChatSendBtn;
  if (btn) {
    btn.disabled = running;
    btn.classList.toggle('is-running', running);
  }
  stopRunningTicker();
  if (running) {
    runningSince = since ?? Date.now();
    tickRunningStatus();
    // 扫描级别就够：不需要秒表精度，几秒钟更新一次让人知道它还活着即可
    runningTicker = setInterval(tickRunningStatus, 3000);
  } else {
    const status = getElements().agentChatStatus;
    if (status) status.textContent = '';
  }
}

// ==================== 加载 ====================

export async function onAgentTabActivated(path: string | null): Promise<void> {
  currentDocPath = path;
  renderTray(path);
  if (agentBackends.length === 0) {
    agentBackends = await fetchAgentBackends().catch(() => []);
    void renderEngineSelect();
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
  renderChatChips();
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
  setRunning(!!activeRunId, activeRunId ? session?.updatedAt : undefined);
}

// ==================== 交互 ====================

const CHAT_INPUT_DEFAULT_MIN_HEIGHT = 60;
const CHAT_INPUT_MAX_RATIO = 0.7; // 手动拖拽和打字自动撑高共用同一个上限，两者不打架
const AGENT_CHAT_INPUT_HEIGHT_KEY = 'md-viewer:agent-chat-input-height';

// 手动拖出来的高度是"用户偏好"的下限——打字自动撑高只管往上长，不该把它缩回默认值。
// 不然刷新恢复的高度会在用户打第一个字的时候就被 autoResizeChatInput 悄悄吃掉。
let chatInputMinHeight = CHAT_INPUT_DEFAULT_MIN_HEIGHT;

function autoResizeChatInput(el: HTMLTextAreaElement): void {
  el.style.height = 'auto';
  const maxHeight = window.innerHeight * CHAT_INPUT_MAX_RATIO;
  const next = Math.min(maxHeight, Math.max(el.scrollHeight, chatInputMinHeight));
  el.style.height = `${next}px`;
  el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
}

// 刷新页面后恢复上次手动拖出来的高度（不记打字自动撑高的高度——那是跟内容走的，
// 刷新后输入框总是空的，记它没意义；只有手动拖拽定的高度才是稳定的用户偏好）
function restoreChatInputHeight(): void {
  const input = getElements().agentChatInput;
  if (!input) return;
  const saved = storageGetNumber(AGENT_CHAT_INPUT_HEIGHT_KEY, 0);
  if (saved >= CHAT_INPUT_DEFAULT_MIN_HEIGHT) {
    chatInputMinHeight = saved;
    input.style.height = `${saved}px`;
  }
}

// 输入框上沿放一条细把手：往上拖增高，往下拖收窄；高度作为用户偏好保存。
function initChatInputResizer(): void {
  const handle = document.getElementById('agentChatInputResizer');
  const input = getElements().agentChatInput;
  if (!handle || !input) return;

  handle.addEventListener('mousedown', (event: MouseEvent) => {
    event.preventDefault();
    const startY = event.clientY;
    const startHeight = input.getBoundingClientRect().height;
    document.body.classList.add('is-resizing-ns');
    input.style.height = `${startHeight}px`;

    const onMove = (e: MouseEvent) => {
      const maxHeight = window.innerHeight * CHAT_INPUT_MAX_RATIO;
      const next = Math.min(maxHeight, Math.max(CHAT_INPUT_DEFAULT_MIN_HEIGHT, startHeight + (startY - e.clientY)));
      input.style.height = `${next}px`;
      input.style.overflowY = next >= maxHeight ? 'auto' : 'hidden';
      chatInputMinHeight = next;
    };
    const onUp = () => {
      document.body.classList.remove('is-resizing-ns');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      storageSet(AGENT_CHAT_INPUT_HEIGHT_KEY, Math.round(input.getBoundingClientRect().height));
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  });
}

export function initAgentRunner(): void {
  restoreChatInputHeight();
  initChatInputResizer();
  getElements().agentChatSendBtn?.addEventListener('click', () => {
    void triggerAgentRun();
  });

  getElements().agentMdvBtn?.addEventListener('click', activateMdvChip);
  getElements().agentChatChips?.addEventListener('click', (event) => {
    const btn = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-chip]');
    if (!btn) return;
    if (btn.dataset.chip === 'path') mdvPathChipOn = false;
    else mdvChipOn = mdvPathChipOn = false;
    renderChatChips();
    getElements().agentChatInput?.focus();
  });

  getElements().agentChatInput?.addEventListener('input', (e) => {
    autoResizeChatInput(e.currentTarget as HTMLTextAreaElement);
  });

  getElements().agentChatInput?.addEventListener('keydown', (e: KeyboardEvent) => {
    // 输入框为空时 Backspace 像 omnibox 一样先删掉最后一个 chip
    if (e.key === 'Backspace' && !(e.currentTarget as HTMLTextAreaElement).value && removeLastChatChip()) {
      e.preventDefault();
      return;
    }
    // Enter 换行（textarea 默认行为），⌘/Ctrl+Enter 才发送
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void triggerAgentRun();
    }
  });

  getElements().agentModelMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleAgentMenu(getElements().agentModelMenu);
  });

  getElements().agentSessionMenuButton?.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleAgentMenu(getElements().agentSessionMenu);
  });

  getElements().agentNewSessionBtn?.addEventListener('click', (event) => {
    event.stopPropagation();
    void createNewAgentSession();
  });

  getElements().agentSessionList?.addEventListener('click', (event) => {
    const target = event.target as HTMLElement | null;
    const btn = target?.closest<HTMLButtonElement>('[data-session-id]');
    if (!btn || btn.disabled) return;
    void linkAgentSessionById(btn.dataset.sessionId || '');
  });

  getElements().agentEngineSelect?.addEventListener('change', () => {
    const value = getElements().agentEngineSelect?.value || '';
    if (!value || value === AGENT_ENGINES[0].id) localStorage.removeItem(AGENT_ENGINE_KEY);
    else localStorage.setItem(AGENT_ENGINE_KEY, value);
    modelInputTouched = false;
    void syncModelInputForEngine(value);
    renderModelMenuButton();
  });

  getElements().agentModelInput?.addEventListener('change', () => {
    modelInputTouched = true;
    const engine = currentEngine();
    const model = getElements().agentModelInput?.value.trim() || '';
    const defaultModel = agentBackends.find((item) => item.name === engine.backend)?.defaultModel || '';
    if (!model || model === defaultModel) localStorage.removeItem(`${AGENT_MODEL_OVERRIDE_KEY}:${engine.id}`);
    else localStorage.setItem(`${AGENT_MODEL_OVERRIDE_KEY}:${engine.id}`, model);
    if (engine.backend === 'pi') updateThinkingOptionsForModel(model || defaultModel);
    renderModelMenuButton();
  });

  getElements().agentThinkingLevel?.addEventListener('change', () => {
    renderModelMenuButton();
  });

  document.addEventListener('click', (event) => {
    const target = event.target as Node | null;
    const el = getElements();
    if (
      target &&
      (el.agentModelMenu?.contains(target) ||
        el.agentModelMenuButton?.contains(target) ||
        el.agentSessionMenu?.contains(target) ||
        el.agentSessionMenuButton?.contains(target))
    ) return;
    closeAgentMenus();
  });

  void fetchAgentBackends().then((backends) => {
    agentBackends = backends;
    void renderEngineSelect();
  }).catch(() => {
    agentBackends = [];
    void renderEngineSelect();
  });
}

async function createNewAgentSession(): Promise<void> {
  const path = currentDocPath;
  if (!path) return;
  try {
    await newAgentSession(path);
    closeAgentMenus();
    showSuccess('已新建会话，本工程的文档之后都会用它');
    await reloadConversation(path);
  } catch (err: any) {
    showError(err?.message || '操作失败');
    await reloadConversation(path);
  }
}

async function linkAgentSessionById(sessionId: string): Promise<void> {
  const path = currentDocPath;
  if (!path || !sessionId) return;
  try {
    await linkAgentSession(path, sessionId);
    closeAgentMenus();
    showSuccess('已切换，本工程的文档之后都会用这个会话');
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
  const typedPrompt = input?.value.trim() || '';
  const engine = currentEngine();
  const backend = engine.backend;
  const provider = engine.provider;
  const rawModel = getElements().agentModelInput?.value.trim() || '';
  const defaultModel = agentBackends.find((item) => item.name === backend)?.defaultModel || '';
  const model = rawModel && rawModel !== defaultModel ? rawModel : undefined;
  const thinking = backend === 'pi' ? (getElements().agentThinkingLevel?.value || undefined) : undefined;

  // 划词攒进 Agent 托盘的疑问/注释拼进这一轮的 prompt 前面，作为对话上下文，
  // 而不是走批注锚定/回复那一整套持久化流程；发送后托盘清空
  const trayPrefix = buildTrayPromptPrefix(path);
  // /mdv 命令必须在 prompt 最前面才会被当成 slash command，所以托盘内容放到命令后面
  const mdvCommand = mdvChipOn
    ? ['/mdv', mdvPathChipOn ? quoteIfNeeded(docRelPath(path)) : '', typedPrompt].filter(Boolean).join(' ')
    : '';
  const prompt = mdvCommand
    ? (trayPrefix ? `${mdvCommand}\n\n${trayPrefix}` : mdvCommand)
    : trayPrefix
      ? (typedPrompt ? `${trayPrefix}\n\n${typedPrompt}` : trayPrefix)
      : (typedPrompt || undefined);
  // 只有选了 /mdv 才允许输入框为空；否则空消息没有意义，不再默认当成"处理批注"
  if (!prompt) {
    showError('请输入内容，或点 /mdv 处理批注');
    return;
  }
  mdvChipOn = mdvPathChipOn = false;
  renderChatChips();
  const displayText = prompt;

  if (input) {
    input.value = '';
    autoResizeChatInput(input);
  }
  clearTray(path);

  liveMessages.push({ kind: 'user', text: displayText, timestamp: Date.now() });
  setRunning(true);
  renderMessages();

  try {
    const { runId, sessionId } = await startAgentRun(path, { backend, provider, model, prompt, thinking });
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
      if (block.type === 'thinking' && block.thinking) {
        liveMessages.push({ kind: 'thinking', text: block.thinking, timestamp: now, model });
      } else if (block.type === 'text' && block.text) {
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

  if (data.status === 'success') {
    // 成功态由 run divider / stats 展示；不再额外插入一条“完成”消息，占用一行。
  } else {
    liveMessages.push({ kind: 'error', text: '✗ Agent 运行出错', timestamp: Date.now() });
  }
  renderMessages();

  // 这一轮结束后，把它并入历史（下次重新打开该文档 tab 会从服务端重新拉取，这里只是让统计条数字先跟上）
  if (currentDocPath) void reloadConversation(currentDocPath);
}
