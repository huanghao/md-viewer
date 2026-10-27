import { describe, expect, it } from 'bun:test';
import { initialAgentState, messagesFromProgressEvent, reduceAgent, type AgentState } from '../../src/client/agent/store';

const run = (over: any = {}) => ({ id: 'r', docPath: '/a.md', sessionId: 's', workspacePath: null, command: '', status: 'success' as const, startedAt: 1, finishedAt: 2, usage: {}, error: null, transcript: [], ...over });
const sess = (over: any = {}) => ({ docPath: '/a.md', sessionId: 's', running: false, runId: null, updatedAt: 5, ...over });
const st = (over: Partial<AgentState> = {}): AgentState => ({ ...initialAgentState, ...over });

describe('messagesFromProgressEvent', () => {
  it('assistant: thinking/text/tool_use 各出一条，tool 带入参摘要与模型', () => {
    const msgs = messagesFromProgressEvent({ type: 'assistant', message: { model: 'm', content: [
      { type: 'thinking', thinking: 't' }, { type: 'text', text: 'x' }, { type: 'tool_use', name: 'Bash', input: { a: 1 } }, { type: 'text', text: '' },
    ] } }, 9);
    expect(msgs.map((m) => [m.kind, m.text, m.model])).toEqual([['thinking', 't', 'm'], ['text', 'x', 'm'], ['tool', 'Bash {"a":1}', 'm']]);
  });

  it('user: tool_result 文本被截断到 400 字，空结果忽略', () => {
    const long = 'a'.repeat(500);
    const msgs = messagesFromProgressEvent({ type: 'user', message: { content: [
      { type: 'tool_result', content: long }, { type: 'tool_result', content: [] }, { type: 'tool_result', content: [{ type: 'text', text: 'ok' }] },
    ] } }, 1);
    expect(msgs.length).toBe(2);
    expect(msgs[0].text.length).toBe(401);
    expect(msgs[1].text).toBe('ok');
  });

  it('未知事件 → 空', () => {
    expect(messagesFromProgressEvent({ type: 'system' }, 1)).toEqual([]);
    expect(messagesFromProgressEvent(null, 1)).toEqual([]);
  });
});

describe('reduceAgent', () => {
  it('sessionFetched：运行中且本页没见过 → 占位；见过且有实时消息 → 保留', () => {
    const fresh = reduceAgent(st(), { type: 'sessionFetched', session: sess({ running: true, runId: 'r1' }), now: 7 });
    expect(fresh.runId).toBe('r1');
    expect(fresh.live.length).toBe(1);
    expect(fresh.live[0].text).toContain('重新连接');

    const live = [{ kind: 'text' as const, text: 'hi', timestamp: 1 }];
    const kept = reduceAgent(st({ runId: 'r1', live }), { type: 'sessionFetched', session: sess({ running: true, runId: 'r1' }), now: 8 });
    expect(kept.live).toBe(live);

    const other = reduceAgent(st({ runId: 'r0', live }), { type: 'sessionFetched', session: sess({ running: true, runId: 'r1' }), now: 8 });
    expect(other.live[0].text).toContain('重新连接');
  });

  it('sessionFetched：未运行 → 清空实时消息与 runId；无会话 → sessionId 为 null', () => {
    const s = reduceAgent(st({ runId: 'r', live: [{ kind: 'text', text: 'x', timestamp: 1 }] }), { type: 'sessionFetched', session: null, now: 1 });
    expect(s.runId).toBeNull();
    expect(s.live).toEqual([]);
    expect(s.sessionId).toBeNull();
  });

  it('loaded：剔除运行中的 run，按 runId 决定 running 与起始时间', () => {
    const idle = reduceAgent(st(), { type: 'loaded', runs: [run({ id: 'a' }), run({ id: 'b', status: 'running' })], sessions: [], now: 1 });
    expect(idle.pastRuns.map((r) => r.id)).toEqual(['a']);
    expect(idle.running).toBe(false);
    expect(idle.loading).toBe(false);

    const busy = reduceAgent(st({ runId: 'r1', loading: true }), { type: 'loaded', runs: [], sessions: [], updatedAt: 42, now: 99 });
    expect(busy.running).toBe(true);
    expect(busy.runningSince).toBe(42);
  });

  it('sent / runStarted / startFailed', () => {
    let s = reduceAgent(st(), { type: 'sent', text: 'hi', now: 5 });
    expect(s.running).toBe(true);
    expect(s.runningSince).toBe(5);
    expect(s.live[0]).toMatchObject({ kind: 'user', text: 'hi' });
    const started = reduceAgent(s, { type: 'runStarted', runId: 'r', sessionId: 'ss' });
    expect(started).toMatchObject({ runId: 'r', sessionId: 'ss' });
    s = reduceAgent(s, { type: 'startFailed', text: 'boom', now: 6 });
    expect(s.running).toBe(false);
    expect(s.live.at(-1)).toMatchObject({ kind: 'error', text: 'boom' });
  });

  it('runFinished：成功不加错误行，失败追加；runId 清空', () => {
    const ok = reduceAgent(st({ runId: 'r', running: true }), { type: 'runFinished', ok: true, now: 1 });
    expect(ok).toMatchObject({ runId: null, running: false, live: [] });
    const bad = reduceAgent(st({ runId: 'r', running: true }), { type: 'runFinished', ok: false, now: 1 });
    expect(bad.live.at(-1)!.text).toContain('运行出错');
  });

  it('progress 无新消息时返回同一个 state（不触发订阅者）', () => {
    const s = st();
    expect(reduceAgent(s, { type: 'progress', event: { type: 'system' }, now: 1 })).toBe(s);
  });

  it('不可变：旧 state 不被修改', () => {
    const s = st();
    reduceAgent(s, { type: 'sent', text: 'x', now: 1 });
    expect(s.live).toEqual([]);
  });
});
