import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { mountContentShell } from '../../src/client/content-shell';

const KEYS = ['window', 'document', 'Event', 'HTMLElement', 'MouseEvent'] as const;
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

describe('文档内容区外壳', () => {
  it('挂载时同步清空占位内容，之后命令式写入的子节点不会被 React 清掉', async () => {
    document.body.innerHTML = '<div class="content" id="content"><div class="empty-state">占位</div></div>';
    const el = document.getElementById('content')!;
    let root: ReturnType<typeof mountContentShell> = null;
    await act(async () => { root = mountContentShell(); });
    expect(el.querySelector('.empty-state')).toBeNull();

    el.innerHTML = '<div class="markdown-body" id="reader">正文</div>';
    expect(el.querySelector('#reader')?.textContent).toBe('正文');
    await act(async () => { root?.unmount(); });
  });
});
