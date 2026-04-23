// src/client/ui/chat-panel.ts
import { escapeHtml } from '../utils/escape.js';
import { storageGet, storageSet } from '../utils/storage.js';

const AGENT_URL_KEY = 'md-viewer:agent-url';
const DEFAULT_AGENT_URL = 'http://localhost:3003';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatState {
  sessionId: string;
  history: ChatMessage[];
  selectedText: string | null;
  currentFilePath: string | null;
  streaming: boolean;
}

const state: ChatState = {
  sessionId: crypto.randomUUID(),
  history: [],
  selectedText: null,
  currentFilePath: null,
  streaming: false,
};

export function getAgentUrl(): string {
  return storageGet<string>(AGENT_URL_KEY, DEFAULT_AGENT_URL);
}

export function setAgentUrl(url: string): void {
  storageSet(AGENT_URL_KEY, url);
}

export function setChatSelectedText(text: string | null): void {
  state.selectedText = text;
  renderChatPanel();
}

export function clearChatSelectedText(): void {
  state.selectedText = null;
  renderChatPanel();
}

export function onChatFileSwitch(filePath: string | null): void {
  state.currentFilePath = filePath;
  state.history = [];
  state.selectedText = null;
  state.sessionId = crypto.randomUUID();
  renderChatPanel();
}

export function initChatPanel(): void {
  renderChatPanel();
}

export function renderChatPanel(): void {
  const container = document.getElementById('chatList');
  if (!container) return;

  const agentUrl = getAgentUrl();

  container.innerHTML = `
    <div class="chat-config-bar">
      <span>Agent:</span>
      <input id="chatAgentUrlInput" type="text" value="${escapeHtml(agentUrl)}" placeholder="${DEFAULT_AGENT_URL}" />
    </div>
    <div class="chat-messages" id="chatMessages">
      ${state.history.length === 0
        ? '<div class="chat-empty">发消息开始对话，AI 可以读写当前工作区的文件</div>'
        : state.history.map(renderMessage).join('')
      }
    </div>
    ${state.selectedText ? `
      <div class="chat-sel-bar">
        <div class="chat-sel-bar-label">
          选中内容
          <button id="chatClearSelBtn">× 清除</button>
        </div>
        <div class="chat-sel-bar-text">${escapeHtml(state.selectedText.slice(0, 60))}${state.selectedText.length > 60 ? '…' : ''}</div>
      </div>
    ` : ''}
    <div class="chat-input-area">
      <textarea
        class="chat-input"
        id="chatInput"
        placeholder="问关于文档的问题…"
        rows="1"
      ></textarea>
      <button class="chat-send-btn" id="chatSendBtn" ${state.streaming ? 'disabled' : ''}>↑</button>
    </div>
    <div class="chat-hint">Enter 发送 · Shift+Enter 换行</div>
  `;

  const urlInput = document.getElementById('chatAgentUrlInput') as HTMLInputElement | null;
  if (urlInput) {
    urlInput.addEventListener('change', () => setAgentUrl(urlInput.value.trim() || DEFAULT_AGENT_URL));
  }

  const clearSelBtn = document.getElementById('chatClearSelBtn');
  if (clearSelBtn) clearSelBtn.addEventListener('click', clearChatSelectedText);

  const input = document.getElementById('chatInput') as HTMLTextAreaElement | null;
  const sendBtn = document.getElementById('chatSendBtn') as HTMLButtonElement | null;

  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
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

  const msgs = document.getElementById('chatMessages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
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

async function sendMessage(): Promise<void> {
  const input = document.getElementById('chatInput') as HTMLTextAreaElement | null;
  if (!input) return;
  const text = input.value.trim();
  if (!text || state.streaming) return;

  let userContent = text;
  if (state.selectedText) {
    userContent = `${text}\n\n[选中内容]\n${state.selectedText}`;
  }

  input.value = '';
  input.style.height = 'auto';
  state.history.push({ role: 'user', content: userContent });
  state.selectedText = null;
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

  try {
    const res = await fetch(`${getAgentUrl()}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: state.sessionId,
        message: userContent,
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
          if (streamEl?.parentElement) {
            streamEl.parentElement.insertBefore(toolDiv, streamEl);
          }
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
          const streamEl2 = document.getElementById('chatStreamingMsg');
          if (streamEl2) streamEl2.removeAttribute('id');
          state.history.push({ role: 'assistant', content: rawText });
        }

        if (ev.type === 'error') {
          const streamEl2 = document.getElementById('chatStreamingMsg');
          if (streamEl2) {
            streamEl2.innerHTML = `<span style="color:#f87171">错误: ${escapeHtml(ev.message ?? '')}</span>`;
            streamEl2.removeAttribute('id');
          }
        }

        if (msgsEl) msgsEl.scrollTop = msgsEl.scrollHeight;
      }
    }
  } catch (e: any) {
    const streamEl = document.getElementById('chatStreamingMsg');
    if (streamEl) {
      streamEl.innerHTML = `<span style="color:#f87171">连接失败: ${escapeHtml(e.message)}</span>`;
      streamEl.removeAttribute('id');
    }
  } finally {
    state.streaming = false;
    const sendBtn = document.getElementById('chatSendBtn') as HTMLButtonElement | null;
    if (sendBtn) sendBtn.disabled = false;
  }
}
