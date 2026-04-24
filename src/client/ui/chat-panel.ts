import { escapeHtml } from '../utils/escape.js';
import { storageGet, storageSet } from '../utils/storage.js';

const AGENT_URL_KEY = 'md-viewer:agent-url';
const SESSION_ID_KEY = 'md-viewer:chat-session-id';
const PROMPTS_KEY = 'md-viewer:chat-quick-prompts';
const DEFAULT_AGENT_URL = 'http://localhost:3003';

const DEFAULT_QUICK_PROMPTS = [
  '查看当前文档的评论并更新',
  '总结这篇文档的主要内容',
  '解释选中的这段话',
  '把选中内容翻译成中文',
];

function getQuickPrompts(): string[] {
  return storageGet<string[]>(PROMPTS_KEY, DEFAULT_QUICK_PROMPTS);
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface DocContext {
  filePath?: string;
  quotePrefix?: string;
  quote?: string;
  quoteSuffix?: string;
  lineNumber?: number;
}

interface ChatState {
  sessionId: string;
  history: ChatMessage[];
  selectedText: string | null;
  currentFilePath: string | null;
  streaming: boolean;
  docContext: DocContext;
}

// Persist sessionId across page reloads so history can be resumed
function loadOrCreateSessionId(): string {
  const stored = storageGet<string>(SESSION_ID_KEY, '');
  if (stored) return stored;
  const id = crypto.randomUUID();
  storageSet(SESSION_ID_KEY, id);
  return id;
}

const state: ChatState = {
  sessionId: loadOrCreateSessionId(),
  history: [],
  selectedText: null,
  currentFilePath: null,
  streaming: false,
  docContext: {},
};

export function getAgentUrl(): string {
  return storageGet<string>(AGENT_URL_KEY, DEFAULT_AGENT_URL);
}

export function setAgentUrl(url: string): void {
  storageSet(AGENT_URL_KEY, url);
}

export function setChatSelectedText(text: string | null): void {
  state.selectedText = text;
  // Update docContext.quote for server-side context injection
  state.docContext = { ...state.docContext, quote: text ?? undefined };
  renderSelBar();
}

export function clearChatSelectedText(): void {
  state.selectedText = null;
  state.docContext = { ...state.docContext, quote: undefined, quotePrefix: undefined, quoteSuffix: undefined };
  renderSelBar();
}

// Called with full context when user selects text
export function setChatContext(ctx: DocContext): void {
  state.docContext = ctx;
  state.selectedText = ctx.quote ?? null;
  renderSelBar();
}

// Stable sessionId per file path, stored in localStorage
function sessionIdForFile(filePath: string): string {
  const key = `md-viewer:chat-session:${filePath}`;
  const stored = storageGet<string>(key, '');
  if (stored) return stored;
  const id = crypto.randomUUID();
  storageSet(key, id);
  return id;
}

export function onChatFileSwitch(filePath: string | null): void {
  state.currentFilePath = filePath;
  state.history = [];
  state.selectedText = null;
  state.docContext = filePath ? { filePath } : {};
  // Stable session per file — same file always gets same sessionId
  state.sessionId = filePath ? sessionIdForFile(filePath) : crypto.randomUUID();
  renderChatPanel();
  // Load history for this file's session
  if (filePath) void loadHistory().then(() => renderChatPanel());
}

export function initChatPanel(): void {
  void loadHistory().then(() => renderChatPanel());
}

async function loadHistory(): Promise<void> {
  try {
    const res = await fetch(`${getAgentUrl()}/session/${state.sessionId}/history`);
    if (!res.ok) return;
    const data = await res.json() as { history: Array<{ role: 'user' | 'assistant'; content: string }> };
    if (data.history?.length) {
      state.history = data.history.map((e) => ({ role: e.role, content: e.content }));
    }
  } catch {
    // agent-server not running, ignore
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

export function renderChatPanel(): void {
  // 拆分模式下渲染到独立面板，否则渲染到 tab 里
  const isSplit = document.body.classList.contains('sidebar-split');
  const container = document.getElementById(isSplit ? 'chatListSplit' : 'chatList');
  if (!container) return;

  const agentUrl = getAgentUrl();

  const shortId = state.sessionId.slice(0, 8);
  container.innerHTML = `
    <div class="chat-config-bar">
      <span>Agent:</span>
      <input id="chatAgentUrlInput" type="text" value="${escapeHtml(agentUrl)}" placeholder="${DEFAULT_AGENT_URL}" />
      <button id="chatNewSessionBtn" title="新建会话" style="background:none;border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:2px 6px;cursor:pointer;font-size:11px;color:var(--color-text-muted);white-space:nowrap;">+ 新建</button>
    </div>
    <div class="chat-config-bar" style="border-top:none;padding-top:0;gap:4px;">
      <span style="color:var(--color-text-muted)">Session:</span>
      <code id="chatSessionIdDisplay" title="${escapeHtml(state.sessionId)}" style="flex:1;font-size:10px;color:var(--color-text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer;" onclick="document.getElementById('chatResumeInput').style.display='flex';this.parentElement.style.display='none';">${shortId}…</code>
      <button id="chatCopySessionBtn" title="复制完整 Session ID" style="background:none;border:none;cursor:pointer;font-size:11px;color:var(--color-text-muted);padding:0 2px;">⎘</button>
    </div>
    <div id="chatResumeInput" style="display:none;padding:4px 10px;gap:4px;align-items:center;border-bottom:1px solid var(--color-border);">
      <input id="chatResumeIdInput" type="text" placeholder="粘贴 Session ID…" style="flex:1;background:#fff;border:1px solid var(--color-border);border-radius:var(--radius-sm);padding:3px 6px;font-size:11px;font-family:monospace;outline:none;" />
      <button id="chatResumeConfirmBtn" style="background:var(--color-accent);border:none;border-radius:var(--radius-sm);color:#fff;padding:3px 8px;cursor:pointer;font-size:11px;">Resume</button>
      <button id="chatResumeCancelBtn" style="background:none;border:1px solid var(--color-border);border-radius:var(--radius-sm);color:var(--color-text-muted);padding:3px 6px;cursor:pointer;font-size:11px;">取消</button>
    </div>
    <div class="chat-messages" id="chatMessages">
      ${state.history.length === 0
        ? '<div class="chat-empty">发消息开始对话，AI 可以读写当前工作区的文件</div>'
        : state.history.map(renderMessage).join('')
      }
    </div>
    <div id="chatSelBarSlot"></div>
    <div class="chat-quick-prompts" id="chatQuickPrompts">
      ${getQuickPrompts().map((p, i) =>
        `<button class="chat-quick-btn" data-idx="${i}">${escapeHtml(p)}</button>`
      ).join('')}
    </div>
    <div class="chat-input-area">
      <textarea
        class="chat-input"
        id="chatInput"
        placeholder="问关于文档的问题…"
        rows="1"
      ></textarea>
      <button class="chat-send-btn" id="chatSendBtn" ${state.streaming ? 'disabled' : ''}>↑</button>
    </div>
    <div class="chat-hint">Cmd+Enter 发送 · Enter 换行</div>
  `;

  renderSelBar();
  wireEvents();

  const msgs = document.getElementById('chatMessages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function renderSelBar(): void {
  const slot = document.getElementById('chatSelBarSlot');
  if (!slot) return;
  if (state.selectedText) {
    slot.innerHTML = `
      <div class="chat-sel-bar">
        <div class="chat-sel-bar-label">
          选中内容
          <button id="chatClearSelBtn">× 清除</button>
        </div>
        <div class="chat-sel-bar-text">${escapeHtml(state.selectedText.slice(0, 60))}${state.selectedText.length > 60 ? '…' : ''}</div>
      </div>`;
    document.getElementById('chatClearSelBtn')?.addEventListener('click', clearChatSelectedText);
  } else {
    slot.innerHTML = '';
  }
}

function wireEvents(): void {
  const urlInput = document.getElementById('chatAgentUrlInput') as HTMLInputElement | null;
  if (urlInput) {
    urlInput.addEventListener('change', () => setAgentUrl(urlInput.value.trim() || DEFAULT_AGENT_URL));
  }

  // Quick prompt buttons — click fills input, focus ready for Cmd+Enter
  document.getElementById('chatQuickPrompts')?.querySelectorAll('.chat-quick-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById('chatInput') as HTMLTextAreaElement | null;
      if (!input) return;
      const prompts = getQuickPrompts();
      const idx = Number((btn as HTMLElement).dataset.idx);
      input.value = prompts[idx] ?? '';
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 90) + 'px';
      input.focus();
    });
  });

  // Copy session ID
  document.getElementById('chatCopySessionBtn')?.addEventListener('click', () => {
    navigator.clipboard.writeText(state.sessionId);
  });

  // Resume: confirm
  document.getElementById('chatResumeConfirmBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('chatResumeIdInput') as HTMLInputElement | null;
    const id = input?.value.trim();
    if (!id) return;
    state.sessionId = id;
    state.history = [];
    if (state.currentFilePath) storageSet(`md-viewer:chat-session:${state.currentFilePath}`, id);
    await loadHistory();
    renderChatPanel();
  });

  // Resume: cancel
  document.getElementById('chatResumeCancelBtn')?.addEventListener('click', () => {
    renderChatPanel();
  });

  document.getElementById('chatNewSessionBtn')?.addEventListener('click', () => {
    const id = crypto.randomUUID();
    state.sessionId = id;
    state.history = [];
    state.selectedText = null;
    // Clear the per-file session so next switch creates a fresh one
    if (state.currentFilePath) {
      storageSet(`md-viewer:chat-session:${state.currentFilePath}`, id);
    }
    renderChatPanel();
  });

  const input = document.getElementById('chatInput') as HTMLTextAreaElement | null;
  const sendBtn = document.getElementById('chatSendBtn') as HTMLButtonElement | null;

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        void sendMessage();
      }
      setTimeout(() => {
        input.style.height = 'auto';
        input.style.height = Math.min(input.scrollHeight, 90) + 'px';
      }, 0);
    });
  }

  if (sendBtn) sendBtn.addEventListener('click', () => void sendMessage());
}

function renderMessage(msg: ChatMessage): string {
  if (msg.role === 'user') {
    return `<div class="chat-msg-user">${escapeHtml(msg.content)}</div>`;
  }
  const html = escapeHtml(msg.content)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
  return `<div class="chat-msg-ai">${html}</div>`;
}

// ── Send ──────────────────────────────────────────────────────────────────────

async function sendMessage(): Promise<void> {
  const input = document.getElementById('chatInput') as HTMLTextAreaElement | null;
  if (!input) return;
  const text = input.value.trim();
  if (!text || state.streaming) return;

  input.value = '';
  input.style.height = 'auto';
  state.history.push({ role: 'user', content: text });
  const selText = state.selectedText;
  state.selectedText = null;
  state.docContext = { ...state.docContext, quote: undefined, quotePrefix: undefined, quoteSuffix: undefined };
  state.streaming = true;
  renderChatPanel();

  const msgs = document.getElementById('chatMessages');
  if (msgs) {
    const aiDiv = document.createElement('div');
    aiDiv.className = 'chat-msg-ai';
    aiDiv.id = 'chatStreamingMsg';
    aiDiv.innerHTML = '<span class="chat-cursor"></span>';
    msgs.appendChild(aiDiv);
    msgs.scrollTop = msgs.scrollHeight;
  }

  let rawText = '';
  let currentToolDiv: HTMLElement | null = null;

  // Build context for server: include selected text in docContext
  const contextPayload: DocContext = {
    ...state.docContext,
    ...(selText ? { quote: selText } : {}),
  };

  try {
    const res = await fetch(`${getAgentUrl()}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        message: text,
        context: Object.keys(contextPayload).length ? contextPayload : undefined,
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const ev = JSON.parse(line.slice(6)) as {
          type: string;
          delta?: string;
          name?: string;
          input?: string;
          result?: string;
          isError?: boolean;
          message?: string;
        };
        const streamEl = document.getElementById('chatStreamingMsg');
        const cursor = streamEl?.querySelector('.chat-cursor');
        const msgsEl = document.getElementById('chatMessages');

        if (ev.type === 'text_delta' && ev.delta) {
          rawText += ev.delta;
          if (streamEl) {
            cursor?.remove();
            streamEl.innerHTML = escapeHtml(rawText)
              .replace(/`([^`]+)`/g, '<code>$1</code>')
              .replace(/\n/g, '<br>');
            const newCursor = document.createElement('span');
            newCursor.className = 'chat-cursor';
            streamEl.appendChild(newCursor);
          }
        }

        if (ev.type === 'tool_start') {
          cursor?.remove();
          const toolDiv = document.createElement('div');
          toolDiv.className = 'chat-tool-call';
          toolDiv.innerHTML = `<span class="chat-tool-name">⚡ ${escapeHtml(ev.name ?? '')}</span> ${escapeHtml(ev.input ?? '')}`;
          if (streamEl?.parentElement) streamEl.parentElement.insertBefore(toolDiv, streamEl);
          currentToolDiv = toolDiv;
          if (streamEl) {
            const newCursor = document.createElement('span');
            newCursor.className = 'chat-cursor';
            streamEl.appendChild(newCursor);
          }
        }

        if (ev.type === 'tool_end' && currentToolDiv) {
          const resultDiv = document.createElement('div');
          resultDiv.className = 'chat-tool-result';
          resultDiv.textContent = ev.result ?? '';
          currentToolDiv.appendChild(resultDiv);
          currentToolDiv = null;
        }

        if (ev.type === 'done') {
          document.getElementById('chatStreamingMsg')?.removeAttribute('id');
          state.history.push({ role: 'assistant', content: rawText });
        }

        if (ev.type === 'error') {
          const el = document.getElementById('chatStreamingMsg');
          if (el) {
            el.innerHTML = `<span style="color:var(--color-error)">错误: ${escapeHtml(ev.message ?? '')}</span>`;
            el.removeAttribute('id');
          }
        }

        if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
      }
    }
  } catch (e: any) {
    const el = document.getElementById('chatStreamingMsg');
    if (el) {
      el.innerHTML = `<span style="color:var(--color-error)">连接失败: ${escapeHtml(e.message)}</span>`;
      el.removeAttribute('id');
    }
  } finally {
    state.streaming = false;
    const sendBtn = document.getElementById('chatSendBtn') as HTMLButtonElement | null;
    if (sendBtn) sendBtn.disabled = false;
  }
}
