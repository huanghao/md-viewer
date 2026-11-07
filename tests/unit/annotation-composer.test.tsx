import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { QuickAdd, type QuickAddCallbacks } from '../../src/client/annotation-composer/QuickAdd';
import { Composer, type ComposerCallbacks } from '../../src/client/annotation-composer/Composer';
import { composerStore } from '../../src/client/annotation-composer/store';

const KEYS = ['window', 'document', 'Event', 'HTMLElement', 'MouseEvent', 'HTMLTextAreaElement'] as const;
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
  composerStore.setQuickAdd({ mode: 'comment', trayAvailable: false, prompts: [] });
  composerStore.setDraft('comment', '');
  composerStore.setDraft('tray', '');
  document.body.innerHTML = '';
});

async function render(element: any) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return { host, root };
}

function quickCallbacks(): QuickAddCallbacks {
  return {
    onWriteComment: mock(() => {}),
    onAddTray: mock(() => {}),
    onPrompt: mock((_text: string) => {}),
  };
}

function composerCallbacks(): ComposerCallbacks {
  return { onSave: mock(() => {}), onCancel: mock(() => {}) };
}

describe('划词快捷入口', () => {
  it('评论模式默认只显示“写评论”，不显示托盘入口与快捷评论', async () => {
    const { host, root } = await render(createElement(QuickAdd, { callbacks: quickCallbacks() }));
    expect(host.querySelector('#quickAddComment')).not.toBeNull();
    expect(host.querySelector('#quickAddTray')).toBeNull();
    expect(host.querySelector('#quickPromptsSection')).toBeNull();
    await act(async () => root.unmount());
  });

  it('Agent 标签页下显示托盘入口，快捷评论按文字渲染并回调', async () => {
    composerStore.setQuickAdd({ mode: 'comment', trayAvailable: true, prompts: ['这里不懂', '<b>标签</b>'] });
    const callbacks = quickCallbacks();
    const { host, root } = await render(createElement(QuickAdd, { callbacks }));
    expect(host.querySelector('#quickAddTray')).not.toBeNull();
    const prompts = host.querySelectorAll('.quick-prompt');
    expect(prompts.length).toBe(2);
    expect(prompts[1].textContent).toContain('<b>标签</b>');
    expect(host.querySelector('b')).toBeNull();
    (prompts[0] as HTMLElement).click();
    expect(callbacks.onPrompt).toHaveBeenCalledWith('这里不懂');
    await act(async () => root.unmount());
  });

  it('托盘模式只显示托盘入口，隐藏写评论与快捷评论', async () => {
    composerStore.setQuickAdd({ mode: 'tray', prompts: ['这里不懂'] });
    const callbacks = quickCallbacks();
    const { host, root } = await render(createElement(QuickAdd, { callbacks }));
    expect(host.querySelector('#quickAddComment')).toBeNull();
    expect(host.querySelector('#quickPromptsSection')).toBeNull();
    (host.querySelector('#quickAddTray') as HTMLElement).click();
    expect(callbacks.onAddTray).toHaveBeenCalled();
    await act(async () => root.unmount());
  });
});

describe('划词输入浮层', () => {
  it('评论浮层显示标题与草稿，保存/取消按钮回调', async () => {
    composerStore.setDraft('comment', '草稿内容');
    const callbacks = composerCallbacks();
    const { host, root } = await render(createElement(Composer, { kind: 'comment', callbacks }));
    expect(host.querySelector('.annotation-row-title')?.textContent).toBe('新评论');
    expect((host.querySelector('#composerNote') as HTMLTextAreaElement).value).toBe('草稿内容');
    (host.querySelector('#composerSaveBtn') as HTMLElement).click();
    (host.querySelector('#composerCancelBtn') as HTMLElement).click();
    expect(callbacks.onSave).toHaveBeenCalledTimes(1);
    expect(callbacks.onCancel).toHaveBeenCalledTimes(1);
    await act(async () => root.unmount());
  });

  it('托盘浮层使用自己的草稿与标题，不会读到评论草稿', async () => {
    composerStore.setDraft('comment', '评论的');
    composerStore.setDraft('tray', '托盘的');
    const { host, root } = await render(createElement(Composer, { kind: 'tray', callbacks: composerCallbacks() }));
    expect(host.querySelector('.annotation-row-title')?.textContent).toBe('记到 Agent 托盘');
    expect((host.querySelector('#agentTrayComposerNote') as HTMLTextAreaElement).value).toBe('托盘的');
    await act(async () => root.unmount());
  });

  it('外部改写草稿后输入框同步更新（如快捷评论点击）', async () => {
    const { host, root } = await render(createElement(Composer, { kind: 'comment', callbacks: composerCallbacks() }));
    await act(async () => composerStore.setDraft('comment', '快捷评论'));
    expect((host.querySelector('#composerNote') as HTMLTextAreaElement).value).toBe('快捷评论');
    await act(async () => composerStore.setDraft('comment', ''));
    expect((host.querySelector('#composerNote') as HTMLTextAreaElement).value).toBe('');
    await act(async () => root.unmount());
  });
});

describe('composerStore', () => {
  it('requestFocus 每次递增，供组件感知聚焦请求', () => {
    const before = composerStore.getState().focusToken.comment;
    composerStore.requestFocus('comment');
    composerStore.requestFocus('comment');
    expect(composerStore.getState().focusToken.comment).toBe(before + 2);
  });

  it('相同草稿不重复通知', () => {
    let count = 0;
    const off = composerStore.subscribe(() => { count += 1; });
    composerStore.setDraft('comment', 'x');
    composerStore.setDraft('comment', 'x');
    off();
    expect(count).toBe(1);
  });
});
