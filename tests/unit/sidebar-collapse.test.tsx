import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { mountSidebarCollapseControls } from '../../src/client/sidebar-collapse';

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

describe('侧边栏收起/展开按钮', () => {
  it('挂载到占位节点，点击分别触发收起与展开回调，保留原 id 与标题', async () => {
    document.body.innerHTML = '<div id="sidebarCollapseHost"></div><div id="sidebarFloatingOpenHost"></div>';
    const calls: string[] = [];
    await act(async () => {
      mountSidebarCollapseControls({ onCollapse: () => calls.push('collapse'), onExpand: () => calls.push('expand') });
    });
    const collapse = document.getElementById('sidebarCollapseBtn') as HTMLButtonElement;
    const floating = document.getElementById('sidebarFloatingOpenBtn') as HTMLButtonElement;
    expect(collapse.title).toBe('收起侧边栏');
    expect(floating.title).toBe('展开侧边栏');
    expect(collapse.parentElement?.id).toBe('sidebarCollapseHost');
    expect(floating.parentElement?.id).toBe('sidebarFloatingOpenHost');

    await act(async () => { collapse.click(); });
    await act(async () => { floating.click(); });
    expect(calls).toEqual(['collapse', 'expand']);
  });
});
