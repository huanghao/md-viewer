import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { AddConfirmBar } from '../../src/client/add-confirm/AddConfirmBar';
import { addConfirmStore } from '../../src/client/add-confirm/store';

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
  addConfirmStore.hide();
  document.body.innerHTML = '';
  document.body.classList.remove('quick-action-confirm-visible');
});

async function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<AddConfirmBar />));
  return { host, root };
}

describe('添加确认条', () => {
  it('默认隐藏，没有按钮', async () => {
    const { host, root } = await mount();
    const bar = host.querySelector<HTMLElement>('#quickActionConfirm')!;
    expect(bar.style.display).toBe('none');
    expect(host.querySelectorAll('button').length).toBe(0);
    await act(async () => root.unmount());
  });

  it('显示时带文案、模式与主按钮、取消按钮，并给 body 加标记', async () => {
    const onPrimary = mock(() => {});
    const onCancel = mock(() => {});
    const { host, root } = await mount();
    await act(async () => addConfirmStore.show({
      message: '检测到目录，是否作为工作区添加？',
      mode: 'directory',
      primaryLabel: '添加工作区',
      onPrimary,
      onCancel,
      allowCancel: true,
    }));

    const bar = host.querySelector<HTMLElement>('#quickActionConfirm')!;
    expect(bar.style.display).toBe('flex');
    expect(bar.classList.contains('state-directory')).toBe(true);
    expect(host.querySelector('#quickActionConfirmText')!.textContent).toBe('检测到目录，是否作为工作区添加？');
    expect(document.body.classList.contains('quick-action-confirm-visible')).toBe(true);

    const buttons = [...host.querySelectorAll<HTMLButtonElement>('.add-file-confirm-button')];
    expect(buttons.map((b) => b.textContent)).toEqual(['添加工作区', '取消']);
    await act(async () => buttons[0].click());
    expect(onPrimary).toHaveBeenCalled();
    await act(async () => buttons[1].click());
    expect(onCancel).toHaveBeenCalled();
    await act(async () => root.unmount());
  });

  it('allowCancel 为 false 时不显示取消按钮；hide 后恢复隐藏', async () => {
    const { host, root } = await mount();
    await act(async () => addConfirmStore.show({ message: '路径不存在', mode: 'error', allowCancel: false }));
    expect(host.querySelectorAll('.add-file-confirm-button').length).toBe(0);

    await act(async () => addConfirmStore.hide());
    expect(host.querySelector<HTMLElement>('#quickActionConfirm')!.style.display).toBe('none');
    expect(document.body.classList.contains('quick-action-confirm-visible')).toBe(false);
    await act(async () => root.unmount());
  });
});
