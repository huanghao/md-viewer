import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { SearchBox, ViewTabs, isDoubleEscape, isPlainEnter, type SidebarHeaderDeps } from '../../src/client/sidebar/SidebarHeader';
import { sidebarHeaderStore } from '../../src/client/sidebar/store';

// 注意：happy-dom 下 input 元素的键盘/input 事件派发不到 React 的根监听器（button 的 click 可以），
// 所以按键判断抽成纯函数测试；输入与键盘的整体行为在真实浏览器里验证。
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

afterEach(() => {
  sidebarHeaderStore.setSnapshot({ tab: 'focus', query: '' });
  document.body.innerHTML = '';
});

function deps(over: Partial<SidebarHeaderDeps> = {}) {
  return {
    onQueryChange: mock((_q: string) => {}),
    onSubmit: mock((_v: string) => {}),
    dismissQuickActionConfirm: mock(() => {}),
    setSidebarTab: mock((_t: 'focus' | 'full' | 'list') => {}),
    ...over,
  } satisfies SidebarHeaderDeps;
}

const key = (k: string, over: Partial<{ ctrlKey: boolean; metaKey: boolean; isComposing: boolean }> = {}) => ({
  key: k,
  ctrlKey: false,
  metaKey: false,
  isComposing: false,
  ...over,
});

describe('搜索框按键判断', () => {
  it('普通 Enter 才提交；Cmd/Ctrl+Enter 与输入法合成中的 Enter 不走这条路径', () => {
    expect(isPlainEnter(key('Enter'))).toBe(true);
    expect(isPlainEnter(key('Enter', { metaKey: true }))).toBe(false);
    expect(isPlainEnter(key('Enter', { ctrlKey: true }))).toBe(false);
    expect(isPlainEnter(key('Enter', { isComposing: true }))).toBe(false);
    expect(isPlainEnter(key('a'))).toBe(false);
  });

  it('900ms 内、同一搜索词的第二次 Esc 才清空', () => {
    const first = { at: 1000, value: 'abc' };
    expect(isDoubleEscape(first, 1500, 'abc')).toBe(true);
    expect(isDoubleEscape(first, 1900, 'abc')).toBe(false);
    expect(isDoubleEscape(first, 1500, 'abcd')).toBe(false);
    expect(isDoubleEscape({ at: 1000, value: '' }, 1100, '')).toBe(false);
    expect(isDoubleEscape({ at: 0, value: '' }, 1100, 'x')).toBe(false);
  });
});

describe('侧边栏搜索框', () => {
  it('placeholder 跟随 store 中的视图 tab，清空按钮只在有搜索词时显示', async () => {
    sidebarHeaderStore.setSnapshot({ tab: 'list', query: 'abc' });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => root.render(<SearchBox deps={deps()} />));

    const input = host.querySelector('input') as HTMLInputElement;
    expect(input.value).toBe('abc');
    expect(input.placeholder).toContain('搜索已打开的文件');
    expect((host.querySelector('.search-clear') as HTMLElement).style.display).toBe('block');

    await act(async () => sidebarHeaderStore.setSnapshot({ tab: 'full', query: '' }));
    expect(input.placeholder).toContain('输入路径');
    expect((host.querySelector('.search-clear') as HTMLElement).style.display).toBe('none');
    await act(async () => root.unmount());
  });

  it('清空按钮通知 onQueryChange("")', async () => {
    const d = deps();
    sidebarHeaderStore.setSnapshot({ tab: 'focus', query: 'abc' });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => root.render(<SearchBox deps={d} />));
    await act(async () => (host.querySelector('.search-clear') as HTMLElement).click());
    expect(d.onQueryChange).toHaveBeenCalledWith('');
    await act(async () => root.unmount());
  });
});

describe('侧边栏视图切换', () => {
  it('点击按钮调用 setSidebarTab，高亮跟随 store', async () => {
    const d = deps();
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => root.render(<ViewTabs deps={d} />));

    const active = () => host.querySelector('.view-tab.active')!.textContent;
    expect(active()).toBe('最近');

    const buttons = [...host.querySelectorAll<HTMLButtonElement>('.view-tab')];
    await act(async () => buttons[1].click());
    expect(d.setSidebarTab).toHaveBeenCalledWith('full');

    await act(async () => sidebarHeaderStore.setSnapshot({ tab: 'list', query: '' }));
    expect(active()).toBe('打开');
    await act(async () => root.unmount());
  });
});
