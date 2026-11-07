import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { FindBar, type FindBarCallbacks } from '../../src/client/find-bar/FindBar';
import { findBarStore } from '../../src/client/find-bar/store';
import { findKeyAction, formatFindCount } from '../../src/client/find-bar/logic';

describe('findKeyAction', () => {
  it('Enter 下一个，Shift+Enter 上一个，Escape 关闭，其它键无动作', () => {
    expect(findKeyAction('Enter', false)).toBe('next');
    expect(findKeyAction('Enter', true)).toBe('prev');
    expect(findKeyAction('Escape', false)).toBe('close');
    expect(findKeyAction('a', false)).toBeNull();
  });
});

describe('formatFindCount', () => {
  it('有结果显示 当前 / 总数；无结果且有查询词显示无结果；空查询为空', () => {
    expect(formatFindCount('目标', 0, 3)).toEqual({ text: '1 / 3', noResult: false });
    expect(formatFindCount('目标', 2, 3)).toEqual({ text: '3 / 3', noResult: false });
    expect(formatFindCount('xyz', -1, 0)).toEqual({ text: '无结果', noResult: true });
    expect(formatFindCount('', -1, 0)).toEqual({ text: '', noResult: false });
  });
});

describe('findBarStore', () => {
  it('show 递增 focusToken 并显示；hide 隐藏；setQuery 不重复通知', () => {
    const before = findBarStore.getState().focusToken;
    findBarStore.show();
    expect(findBarStore.getState().visible).toBe(true);
    expect(findBarStore.getState().focusToken).toBe(before + 1);
    findBarStore.hide();
    expect(findBarStore.getState().visible).toBe(false);

    let calls = 0;
    const unsubscribe = findBarStore.subscribe(() => calls++);
    findBarStore.setQuery('a');
    findBarStore.setQuery('a');
    expect(calls).toBe(1);
    unsubscribe();
    findBarStore.setQuery('');
  });
});

const KEYS = ['window', 'document', 'Event', 'HTMLElement', 'MouseEvent', 'HTMLInputElement'] as const;
const saved: Record<string, any> = {};

beforeAll(() => {
  const win = new Window({ url: 'http://localhost/' });
  for (const k of KEYS) {
    saved[k] = (globalThis as any)[k];
    (globalThis as any)[k] = k === 'window' ? win : (win as any)[k];
  }
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
});

afterAll(() => {
  for (const k of KEYS) (globalThis as any)[k] = saved[k];
  delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

describe('FindBar 组件', () => {
  it('渲染计数与可见状态，按钮点击转发给回调', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    const root = createRoot(host);
    const calls: string[] = [];
    const callbacks: FindBarCallbacks = {
      onQuery: (q) => calls.push(`query:${q}`),
      onNext: () => calls.push('next'),
      onPrev: () => calls.push('prev'),
      onClose: () => calls.push('close'),
    };
    findBarStore.setMatches(2, 0);
    findBarStore.setQuery('目标');
    await act(async () => { root.render(createElement(FindBar, { callbacks })); });

    expect(host.querySelector('#findBar')?.classList.contains('visible')).toBe(false);
    expect(host.querySelector('#findBarCount')?.textContent).toBe('1 / 2');

    await act(async () => { findBarStore.show(); });
    expect(host.querySelector('#findBar')?.classList.contains('visible')).toBe(true);

    await act(async () => { findBarStore.setMatches(0, -1); });
    const count = host.querySelector('#findBarCount')!;
    expect(count.textContent).toBe('无结果');
    expect(count.classList.contains('no-result')).toBe(true);

    await act(async () => { host.querySelector<HTMLElement>('#findBarNext')!.click(); });
    await act(async () => { host.querySelector<HTMLElement>('#findBarPrev')!.click(); });
    await act(async () => { host.querySelector<HTMLElement>('#findBarClose')!.click(); });
    expect(calls).toEqual(['next', 'prev', 'close']);

    await act(async () => { findBarStore.hide(); findBarStore.setQuery(''); findBarStore.setMatches(0, -1); });
    await act(async () => { root.unmount(); });
  });
});
