import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { TabStrip, type TabStripDeps } from '../../src/client/tabs/TabStrip';
import { tabsStore, type TabsSnapshot } from '../../src/client/tabs/store';

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

const snapshot = (over: Partial<TabsSnapshot> = {}): TabsSnapshot => ({
  files: [
    { path: '/a.md', name: 'a.md', isMissing: false },
    { path: '/b/a.md', name: 'a.md', nameHint: 'b', isMissing: false },
    { path: '/c.md', name: 'c.md', isMissing: true },
  ],
  currentPath: '/b/a.md',
  batch: { others: 2, right: 1, unmodified: 1, all: 3 },
  ...over,
});

function deps(): TabStripDeps {
  return {
    switchFile: mock((_p: string) => {}),
    removeFile: mock((_p: string) => {}),
    batch: mock((_a: any) => {}),
    reorder: mock((_from: number, _to: number) => {}),
    onLayout: mock(() => {}),
  };
}

async function mount(d: TabStripDeps) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<TabStrip deps={d} />));
  return { host, root };
}

describe('文档标签栏', () => {
  it('按快照渲染标签：当前高亮、缺失标记、同名区分目录', async () => {
    tabsStore.setSnapshot(snapshot());
    const { host, root } = await mount(deps());
    const tabs = [...host.querySelectorAll<HTMLElement>('.tab')];
    expect(tabs.length).toBe(3);
    expect(tabs[1].classList.contains('active')).toBe(true);
    expect(tabs[2].classList.contains('deleted')).toBe(true);
    expect(tabs[1].querySelector('.name-hint')!.textContent).toBe('b');
    expect(tabs[0].dataset.index).toBe('0');
    await act(async () => root.unmount());
  });

  it('点击标签切换文件；点击关闭按钮只关闭，不切换', async () => {
    tabsStore.setSnapshot(snapshot());
    const d = deps();
    const { host, root } = await mount(d);
    const tabs = host.querySelectorAll<HTMLElement>('.tab');
    await act(async () => tabs[0].click());
    expect(d.switchFile).toHaveBeenCalledWith('/a.md');

    await act(async () => host.querySelectorAll<HTMLElement>('.tab-close')[0].click());
    expect(d.removeFile).toHaveBeenCalledWith('/a.md');
    expect(d.switchFile).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
  });

  it('管理面板：点击按钮展开，点击外部收起，批量按钮带数量', async () => {
    tabsStore.setSnapshot(snapshot());
    const d = deps();
    const { host, root } = await mount(d);
    const panel = host.querySelector('.tab-manager-panel')!;
    expect(panel.classList.contains('show')).toBe(false);

    await act(async () => host.querySelector<HTMLElement>('.tab-manager-toggle')!.click());
    expect(panel.classList.contains('show')).toBe(true);
    const actions = [...host.querySelectorAll<HTMLElement>('.tab-manager-action')].map((b) => b.textContent);
    expect(actions).toEqual(['关闭其他 (2)', '关闭右侧 (1)', '关闭未修改 (1)', '关闭全部 (3)']);

    await act(async () => host.querySelectorAll<HTMLElement>('.tab-manager-action')[1].click());
    expect(d.batch).toHaveBeenCalledWith('close-right');

    await act(async () => { document.body.click(); });
    expect(panel.classList.contains('show')).toBe(false);
    await act(async () => root.unmount());
  });

  it('没有标签时不渲染内容', async () => {
    tabsStore.setSnapshot({ files: [], currentPath: null, batch: { others: 0, right: 0, unmodified: 0, all: 0 } });
    const { host, root } = await mount(deps());
    expect(host.innerHTML).toBe('');
    await act(async () => root.unmount());
  });
});
