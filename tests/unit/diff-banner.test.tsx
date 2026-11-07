import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { DiffBanner, type DiffBannerCallbacks } from '../../src/client/diff-banner/DiffBanner';
import { diffBannerStore } from '../../src/client/diff-banner/store';

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
  diffBannerStore.hide();
  document.body.innerHTML = '';
});

function callbacks(): DiffBannerCallbacks {
  return {
    onNavigate: mock((_dir: 1 | -1) => {}),
    onAccept: mock(() => {}),
    onClose: mock(() => {}),
    onSwitchMode: mock(() => {}),
  };
}

async function mount(cbs: DiffBannerCallbacks) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(createElement(DiffBanner, { callbacks: cbs })));
  return { host, root };
}

describe('Diff 横幅 store', () => {
  it('show 进入段落模式并重置导航，hide 清空', () => {
    diffBannerStore.show('line');
    expect(diffBannerStore.getState()).toMatchObject({ visible: true, mode: 'line', count: '- / -', prevDisabled: true });
    diffBannerStore.hide();
    expect(diffBannerStore.getState().visible).toBe(false);
  });

  it('切换模式会清除标题覆盖', () => {
    diffBannerStore.show('paragraph');
    diffBannerStore.setLabelOverride('已刷新');
    diffBannerStore.setMode('line');
    expect(diffBannerStore.getState().labelOverride).toBeNull();
  });
});

describe('Diff 横幅渲染', () => {
  it('未显示时不渲染任何内容', async () => {
    const { host, root } = await mount(callbacks());
    expect(host.querySelector('#diffBanner')).toBeNull();
    await act(async () => root.unmount());
  });

  it('段落模式显示标题、计数与按钮状态', async () => {
    diffBannerStore.show('paragraph');
    diffBannerStore.setNav({ count: '1 / 3', prevDisabled: true, nextDisabled: false });
    const { host, root } = await mount(callbacks());
    expect(host.querySelector('.diff-banner-label')?.textContent).toBe('段落 Diff · 显示变更段落');
    expect(host.querySelector('#diffNavCount')?.textContent).toBe('1 / 3');
    expect((host.querySelector('#diffNavPrev') as HTMLButtonElement).disabled).toBe(true);
    expect((host.querySelector('#diffNavNext') as HTMLButtonElement).disabled).toBe(false);
    expect(host.querySelector('#diffModeToggle')?.textContent).toBe('行级视图');
    await act(async () => root.unmount());
  });

  it('行级模式切换标题与模式按钮文字', async () => {
    diffBannerStore.show('paragraph');
    const { host, root } = await mount(callbacks());
    await act(async () => diffBannerStore.setMode('line'));
    expect(host.querySelector('.diff-banner-label')?.textContent).toBe('行级 Diff · 完整行变更');
    expect(host.querySelector('#diffModeToggle')?.textContent).toBe('段落视图');
    await act(async () => root.unmount());
  });

  it('标题覆盖（文件再次更新）显示提示文字', async () => {
    diffBannerStore.show('paragraph');
    diffBannerStore.setLabelOverride('Diff 模式 · 文件已再次更新，已刷新至最新版本');
    const { host, root } = await mount(callbacks());
    expect(host.querySelector('.diff-banner-label')?.textContent).toBe('Diff 模式 · 文件已再次更新，已刷新至最新版本');
    await act(async () => root.unmount());
  });

  it('按钮回调各自触发对应动作', async () => {
    diffBannerStore.show('paragraph');
    diffBannerStore.setNav({ count: '2 / 3', prevDisabled: false, nextDisabled: false });
    const cbs = callbacks();
    const { host, root } = await mount(cbs);
    (host.querySelector('#diffNavPrev') as HTMLElement).click();
    (host.querySelector('#diffNavNext') as HTMLElement).click();
    (host.querySelector('#diffModeToggle') as HTMLElement).click();
    (host.querySelector('.diff-accept-btn') as HTMLElement).click();
    (host.querySelector('.diff-close-btn') as HTMLElement).click();
    expect(cbs.onNavigate).toHaveBeenNthCalledWith(1, -1);
    expect(cbs.onNavigate).toHaveBeenNthCalledWith(2, 1);
    expect(cbs.onSwitchMode).toHaveBeenCalledTimes(1);
    expect(cbs.onAccept).toHaveBeenCalledTimes(1);
    expect(cbs.onClose).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
  });
});
