import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { invalidateAnnotationElementsCache } from '../../src/client/annotation-layout';
import {
  handleAgentProgressEvent,
  handleAgentRunStatusEvent,
  initAgentRunner,
  onAgentTabActivated,
} from '../../src/client/agent-runner';
import { state } from '../../src/client/state';
import { unmountAgentViews } from '../../src/client/agent/mount';
import { addTrayItem, getTray } from '../../src/client/agent-tray';
import { agentStore } from '../../src/client/agent/store';

/**
 * 锁定 Agent 面板现有行为（迁移到 React 前的安全网）：
 * 断言只看 DOM 输出与发出的请求，不碰模块内部变量，换实现后应原样通过。
 */

const PANEL_HTML = `
  <div id="annotationAgentTab">
    <div class="agent-chat-header" id="agentChatHeader"></div>
    <div id="agentChatStats"></div>
    <div id="agentChatMessages"></div>
    <div class="agent-chat-footer">
      <span id="agentChatStatus"></span>
      <div id="agentTrayRoot"></div>
      <div id="agentChatCompose"></div>
    </div>
  </div>`;

interface Route { match: (url: string, init?: RequestInit) => boolean; body: any }

let routes: Route[] = [];
let requests: { url: string; init?: RequestInit }[] = [];
const realFetch = globalThis.fetch;

function route(prefix: string, body: any) {
  routes.push({ match: (u) => u.startsWith(prefix), body });
}

const q = (id: string) => document.getElementById(id)!;
// React 的更新在宏任务里分片提交：等 DOM 连续两次采样不变再断言，避免靠固定延时
async function flush(): Promise<void> {
  let prev = '';
  for (let i = 0; i < 50; i++) {
    await new Promise((r) => setTimeout(r, 8));
    const cur = document.body.innerHTML;
    if (cur === prev) return;
    prev = cur;
  }
}

function run(over: Record<string, any> = {}) {
  return { id: 'r1', docPath: '/ws/a.md', sessionId: 's1', workspacePath: '/ws', command: '["claude"]', status: 'success', startedAt: 1000, finishedAt: 3000, usage: { inputTokens: 100, outputTokens: 50 }, error: null, transcript: [], ...over };
}

const GLOBAL_KEYS = ['window', 'document', 'Event', 'HTMLElement', 'localStorage', 'requestAnimationFrame'] as const;
const saved: Record<string, any> = {};

beforeAll(() => {
  const win = new Window({ url: 'http://localhost/' });
  for (const k of GLOBAL_KEYS) {
    saved[k] = (globalThis as any)[k];
    (globalThis as any)[k] = k === 'window' ? win : typeof (win as any)[k] === 'function' ? (win as any)[k].bind(win) : (win as any)[k];
  }
});

afterAll(() => {
  for (const k of GLOBAL_KEYS) (globalThis as any)[k] = saved[k];
});

beforeEach(() => {
  document.body.innerHTML = PANEL_HTML;
  invalidateAnnotationElementsCache();
  routes = [];
  requests = [];
  state.config.workspaces = [{ path: '/ws' } as any];
  state.currentFile = '/ws/a.md';
  (globalThis as any).fetch = async (url: any, init?: RequestInit) => {
    const u = String(url);
    requests.push({ url: u, init });
    const r = [...routes].reverse().find((x) => x.match(u, init)); // 后注册的优先
    return new Response(JSON.stringify(r ? r.body : {}), { status: 200 });
  };
  route('/api/agent/backends', { backends: [{ name: 'claude', description: '', default: true, defaultModel: 'sonnet', contextWindow: null, unavailableReason: null }] });
  route('/api/agent/pi-providers', { providers: [] });
  route('/api/agent/sessions?', { sessions: [] });
  route('/api/agent/run', { runId: 'run-new', sessionId: 's1', resumed: false, command: [] });
  route('/api/annotations', []);
  initAgentRunner(); // 挂载 React 视图并绑定事件
});

afterEach(async () => {
  // 清掉模块级状态：以「无文档」激活一次
  await onAgentTabActivated(null);
  agentStore.reset();
  unmountAgentViews();
  await flush();
  globalThis.fetch = realFetch;
});

describe('agent-runner 加载与渲染', () => {
  it('无会话：显示空状态', async () => {
    route('/api/agent/session?', { session: null });
    await onAgentTabActivated('/ws/a.md');
    await flush();
    expect(q('agentChatMessages').textContent).toContain('还没有对话');
    expect(q('agentChatStats').textContent).toBe('');
  });

  it('有历史 run：渲染分隔条、各类消息、统计条；"✓ 完成" 结果被隐藏', async () => {
    route('/api/agent/session?', { session: { docPath: '/ws/a.md', sessionId: 's1', running: false, runId: null, updatedAt: 1 } });
    route('/api/agent/runs/by-session', { runs: [run({
      transcript: [
        { kind: 'user', text: '<hi>', timestamp: 1 },
        { kind: 'tool', text: 'Read x', timestamp: 2 },
        { kind: 'result', text: '✓ 完成', timestamp: 3 },
        { kind: 'error', text: 'boom', timestamp: 4 },
      ],
    })] });
    await onAgentTabActivated('/ws/a.md');
    await flush();
    const el = q('agentChatMessages');
    expect(el.querySelectorAll('.agent-run-divider').length).toBe(1);
    expect(el.querySelector('.agent-msg-user')!.textContent).toContain('<hi>'); // 以文本而非标签渲染
    expect(el.querySelector('.agent-msg-user hi')).toBeNull();
    expect(el.querySelector('.agent-msg-tool')!.textContent).toContain('🔧 Read x');
    expect(el.querySelector('.agent-msg-error')!.textContent).toContain('boom');
    expect(el.textContent).not.toContain('✓ 完成');
    expect(q('agentChatStats').textContent).toContain('1 次运行');
  });

  it('会话列表：当前会话被标记且禁用', async () => {
    route('/api/agent/session?', { session: { docPath: '/ws/a.md', sessionId: 's1abcdefgh', running: false, runId: null, updatedAt: 1 } });
    route('/api/agent/sessions?', { sessions: [
      { sessionId: 's1abcdefgh', docPaths: ['/ws/a.md'], updatedAt: 1, firstPrompt: '第一问' },
      { sessionId: 's2abcdefgh', docPaths: ['/ws/b.md'], updatedAt: 1, firstPrompt: null },
    ] });
    await onAgentTabActivated('/ws/a.md');
    await flush();
    const items = document.querySelectorAll<HTMLButtonElement>('.agent-session-item');
    expect(items.length).toBe(2);
    expect(items[0].classList.contains('is-current')).toBe(true);
    expect(items[0].disabled).toBe(true);
    expect(items[0].textContent).toContain('当前：第一问');
    expect(items[1].dataset.sessionId).toBe('s2abcdefgh');
    expect(items[1].textContent).toContain('b.md');
  });
});

describe('agent-runner 会话菜单', () => {
  const sessions = { sessions: [
    { sessionId: 's1abcdefgh', docPaths: ['/ws/a.md'], updatedAt: 1, firstPrompt: '第一问' },
    { sessionId: 's2abcdefgh', docPaths: ['/ws/b.md'], updatedAt: 1, firstPrompt: '第二问' },
  ] };
  const menu = () => q('agentSessionMenu');

  async function open() {
    route('/api/agent/session?', { session: { docPath: '/ws/a.md', sessionId: 's1abcdefgh', running: false, runId: null, updatedAt: 1 } });
    route('/api/agent/sessions?', sessions);
    await onAgentTabActivated('/ws/a.md');
    await flush();
  }

  it('默认关闭；点按钮开关；点菜单外关闭', async () => {
    await open();
    expect(menu().classList.contains('hidden')).toBe(true);
    q('agentSessionMenuButton').click();
    await flush();
    expect(menu().classList.contains('hidden')).toBe(false);
    document.body.click();
    await flush();
    expect(menu().classList.contains('hidden')).toBe(true);
    q('agentSessionMenuButton').click();
    await flush();
    q('agentSessionMenuButton').click();
    await flush();
    expect(menu().classList.contains('hidden')).toBe(true);
  });

  it('按钮 title 带当前会话标签', async () => {
    await open();
    expect(q('agentSessionMenuButton').title).toContain('第一问');
  });

  it('选另一个会话：发 link 请求并关闭菜单；当前项不可点', async () => {
    await open();
    q('agentSessionMenuButton').click();
    await flush();
    const items = document.querySelectorAll<HTMLButtonElement>('.agent-session-item');
    expect(items[0].disabled).toBe(true);
    items[1].click();
    await flush();
    const link = requests.find((r) => r.url === '/api/agent/session/link')!;
    expect(JSON.parse(String(link.init!.body))).toEqual({ path: '/ws/a.md', sessionId: 's2abcdefgh' });
    expect(menu().classList.contains('hidden')).toBe(true);
  });

  it('新建会话：发请求并关闭菜单', async () => {
    await open();
    route('/api/agent/session/new', { sessionId: 'new' });
    q('agentSessionMenuButton').click();
    await flush();
    q('agentNewSessionBtn').click();
    await flush();
    expect(requests.some((r) => r.url === '/api/agent/session/new')).toBe(true);
    expect(menu().classList.contains('hidden')).toBe(true);
  });
});

describe('agent-runner 托盘', () => {
  beforeEach(() => { try { localStorage.clear(); } catch {} });

  async function ready() {
    route('/api/agent/session?', { session: null });
    await onAgentTabActivated('/ws/a.md');
    await flush();
  }

  it('空托盘不渲染；加入后出现卡片与清空按钮；只显示当前文档的', async () => {
    await ready();
    expect(document.querySelector('.agent-tray')).toBeNull();
    addTrayItem('/ws/a.md', '选中的句子', '');
    addTrayItem('/ws/other.md', '别的文档', '');
    await flush();
    expect(document.querySelectorAll('.agent-tray-chip').length).toBe(1);
    expect((document.querySelector('.agent-tray-chip-quote') as HTMLTextAreaElement).value).toBe('选中的句子');
    expect(document.querySelector('.agent-tray-clear-btn')!.textContent).toBe('清空 (1)');
  });

  it('编辑备注写回存储且不重渲染（保留输入框节点）；× 移除；清空', async () => {
    await ready();
    addTrayItem('/ws/a.md', 'q1', '');
    addTrayItem('/ws/a.md', 'q2', '');
    await flush();
    const note = document.querySelector('.agent-tray-chip-note') as HTMLTextAreaElement;
    note.value = '我的备注';
    note.dispatchEvent(new (window as any).Event('input', { bubbles: true }));
    await flush();
    expect(document.querySelector('.agent-tray-chip-note')).toBe(note);
    expect(getTray('/ws/a.md')[0].note).toBe('我的备注');

    document.querySelector<HTMLElement>('.agent-tray-chip-remove')!.click();
    await flush();
    expect(getTray('/ws/a.md').map((i) => i.quote)).toEqual(['q2']);
    document.querySelector<HTMLElement>('.agent-tray-clear-btn')!.click();
    await flush();
    expect(getTray('/ws/a.md')).toEqual([]);
    expect(document.querySelector('.agent-tray')).toBeNull();
  });

  it('发送时托盘内容拼进 prompt 并清空', async () => {
    await ready();
    addTrayItem('/ws/a.md', '引文', '备注');
    await flush();
    (q('agentChatInput') as HTMLTextAreaElement).value = '请解释';
    q('agentChatSendBtn').click();
    await flush();
    const body = JSON.parse(String(requests.find((r) => r.url === '/api/agent/run')!.init!.body));
    expect(body.prompt).toBe('[划词标注]\n1. "引文" — 备注\n\n请解释');
    expect(getTray('/ws/a.md')).toEqual([]);
    expect(document.querySelector('.agent-tray')).toBeNull();
  });
});

describe('agent-runner 运行中重连与实时事件', () => {
  const runningSession = { docPath: '/ws/a.md', sessionId: 's1', running: true, runId: 'run-1', updatedAt: Date.now() };

  it('刷新页面时发现任务在运行：显示重连占位、按钮禁用、状态栏计时', async () => {
    route('/api/agent/session?', { session: runningSession });
    route('/api/agent/runs/by-session', { runs: [run({ id: 'run-1', status: 'running' })] });
    await onAgentTabActivated('/ws/a.md');
    await flush();
    expect(q('agentChatMessages').textContent).toContain('重新连接到运行中的任务');
    expect((q('agentChatSendBtn') as HTMLButtonElement).disabled).toBe(true);
    expect(q('agentChatSendBtn').classList.contains('is-running')).toBe(true);
    expect(q('agentChatStatus').textContent).toContain('Agent 运行中');
    // 运行中的 run 不重复出现在历史里
    expect(q('agentChatMessages').querySelectorAll('.agent-run-divider').length).toBe(0);
  });

  it('实时事件追加消息；其它 runId 的事件被忽略', async () => {
    route('/api/agent/session?', { session: runningSession });
    route('/api/agent/runs/by-session', { runs: [] });
    await onAgentTabActivated('/ws/a.md');
    await flush();

    handleAgentProgressEvent({ runId: 'other', docPath: '/ws/a.md', event: { type: 'assistant', message: { content: [{ type: 'text', text: 'ignored' }] } } });
    await flush();
    expect(q('agentChatMessages').textContent).not.toContain('ignored');

    handleAgentProgressEvent({ runId: 'run-1', docPath: '/ws/a.md', event: { type: 'assistant', message: { model: 'm', content: [
      { type: 'thinking', thinking: '想一想' },
      { type: 'text', text: '**粗体**' },
      { type: 'tool_use', name: 'Bash', input: { cmd: 'ls' } },
    ] } } });
    handleAgentProgressEvent({ runId: 'run-1', docPath: '/ws/a.md', event: { type: 'user', message: { content: [{ type: 'tool_result', content: [{ type: 'text', text: 'out' }] }] } } });
    await flush();
    const el = q('agentChatMessages');
    expect(el.querySelector('.agent-msg-thinking')!.textContent).toContain('想一想');
    expect(el.querySelector('.agent-msg-text')).not.toBeNull();
    expect(el.querySelector('.agent-msg-tool')!.textContent).toContain('Bash {"cmd":"ls"}');
    expect(el.textContent).toContain('→ out');
  });

  it('同工程内换文档或切换 tab 回来：不重载，已流出的消息保留', async () => {
    route('/api/agent/session?', { session: runningSession });
    route('/api/agent/runs/by-session', { runs: [] });
    await onAgentTabActivated('/ws/a.md');
    handleAgentProgressEvent({ runId: 'run-1', docPath: '/ws/a.md', event: { type: 'assistant', message: { content: [{ type: 'text', text: '流出的内容' }] } } });
    const before = requests.length;

    await onAgentTabActivated('/ws/a.md'); // 评论 tab 切回
    await onAgentTabActivated('/ws/b.md'); // 同工程换文档
    expect(requests.length).toBe(before);
    await flush();
    expect(q('agentChatMessages').textContent).toContain('流出的内容');
  });

  it('结束事件：按钮恢复、状态栏清空、重新拉取会话', async () => {
    route('/api/agent/session?', { session: runningSession });
    route('/api/agent/runs/by-session', { runs: [] });
    await onAgentTabActivated('/ws/a.md');
    await flush();
    route('/api/agent/session?', { session: { ...runningSession, running: false, runId: null } });

    handleAgentRunStatusEvent({ runId: 'run-1', docPath: '/ws/a.md', status: 'error' });
    await flush();
    expect((q('agentChatSendBtn') as HTMLButtonElement).disabled).toBe(false);
    expect(q('agentChatStatus').textContent).toBe('');
    await flush();
    await flush();
    // 现状：结束后立即重载会话，实时消息（含这条错误行）随之被服务端历史取代
    expect(q('agentChatMessages').textContent).not.toContain('加载中');
    expect(requests.filter((r) => r.url.startsWith('/api/agent/session?')).length).toBeGreaterThanOrEqual(2);
  });
});

describe('agent-runner 发送', () => {
  async function ready() {
    route('/api/agent/session?', { session: null });
    await onAgentTabActivated('/ws/a.md');
    await flush();
  }

  it('空输入不发请求', async () => {
    await ready();
    q('agentChatSendBtn').click();
    await flush();
    expect(requests.some((r) => r.url === '/api/agent/run')).toBe(false);
  });

  it('发送：清空输入、插入用户消息、按钮禁用、请求带 prompt 与 path', async () => {
    await ready();
    (q('agentChatInput') as HTMLTextAreaElement).value = '  你好  ';
    q('agentChatSendBtn').click();
    await flush();
    const req = requests.find((r) => r.url === '/api/agent/run')!;
    const body = JSON.parse(String(req.init!.body));
    expect(body.path).toBe('/ws/a.md');
    expect(body.prompt).toBe('你好');
    expect((q('agentChatInput') as HTMLTextAreaElement).value).toBe('');
    expect(q('agentChatMessages').querySelector('.agent-msg-user')!.textContent).toContain('你好');
    expect((q('agentChatSendBtn') as HTMLButtonElement).disabled).toBe(true);
  });

  it('/mdv chip：prompt 以 /mdv 开头并带相对路径', async () => {
    await ready();
    q('agentMdvBtn').click();
    await flush();
    expect(q('agentChatChips').classList.contains('hidden')).toBe(false);
    q('agentChatSendBtn').click();
    await flush();
    const body = JSON.parse(String(requests.find((r) => r.url === '/api/agent/run')!.init!.body));
    expect(body.prompt.startsWith('/mdv ')).toBe(true);
    expect(body.prompt).toContain('a.md');
  });

  it('/mdv chip：点 × 移除路径 chip 后只剩命令；输入为空时 Backspace 依次删 chip', async () => {
    await ready();
    q('agentMdvBtn').click();
    await flush();
    expect(document.querySelectorAll('.agent-chat-chip').length).toBe(2);
    document.querySelector<HTMLElement>('[data-chip="path"]')!.click();
    await flush();
    expect(document.querySelectorAll('.agent-chat-chip').length).toBe(1);
    const input = q('agentChatInput');
    input.dispatchEvent(new (window as any).KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true }));
    await flush();
    expect(document.querySelectorAll('.agent-chat-chip').length).toBe(0);
    expect(q('agentChatChips').classList.contains('hidden')).toBe(true);
  });

  it('Cmd+Enter 发送；Enter 和 Ctrl+Enter 不发送', async () => {
    await ready();
    const input = q('agentChatInput') as HTMLTextAreaElement;
    input.value = 'go';
    const key = (init: any) => input.dispatchEvent(new (window as any).KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, ...init }));
    key({});
    key({ ctrlKey: true });
    await flush();
    expect(requests.some((r) => r.url === '/api/agent/run')).toBe(false);
    key({ metaKey: true });
    await flush();
    expect(requests.some((r) => r.url === '/api/agent/run')).toBe(true);
  });

  it('引擎：未登录 pi 的引擎禁用；默认选 Claude Code，思考强度藏起来；请求带 backend 且默认模型不传', async () => {
    await ready();
    const engineSel = q('agentEngineSelect') as HTMLSelectElement;
    const opts = Array.from(engineSel.options);
    expect(opts.map((o) => [o.value, o.disabled])).toEqual([['kimi', true], ['codex', true], ['cc', false]]);
    expect(engineSel.value).toBe('cc');
    expect(q('agentThinkingSection').classList.contains('hidden')).toBe(true);
    expect((q('agentModelInput') as HTMLSelectElement).value).toBe('sonnet');
    (q('agentChatInput') as HTMLTextAreaElement).value = 'x';
    q('agentChatSendBtn').click();
    await flush();
    const body = JSON.parse(String(requests.find((r) => r.url === '/api/agent/run')!.init!.body));
    expect(body.backend).toBe('claude');
    expect(body.model).toBeUndefined();
  });

  it('选了非默认模型：请求带 model', async () => {
    await ready();
    const sel = q('agentModelInput') as HTMLSelectElement;
    sel.value = 'opus';
    sel.dispatchEvent(new (window as any).Event('change', { bubbles: true }));
    await flush();
    (q('agentChatInput') as HTMLTextAreaElement).value = 'x';
    q('agentChatSendBtn').click();
    await flush();
    const body = JSON.parse(String(requests.find((r) => r.url === '/api/agent/run')!.init!.body));
    expect(body.model).toBe('opus');
  });

  it('启动失败：恢复按钮并追加错误消息', async () => {
    await ready();
        (globalThis as any).fetch = async () => new Response(JSON.stringify({ error: '启动炸了' }), { status: 500 });
    (q('agentChatInput') as HTMLTextAreaElement).value = 'x';
    q('agentChatSendBtn').click();
    await flush();
    await flush();
    expect((q('agentChatSendBtn') as HTMLButtonElement).disabled).toBe(false);
    expect(q('agentChatMessages').querySelector('.agent-msg-error')!.textContent).toContain('启动炸了');
  });
});
