import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { StatusBar } from '../../src/client/statusbar/StatusBar';
import { updateStatusbarConnection, updateStatusbarFile } from '../../src/client/statusbar';

const KEYS = ['window', 'document', 'Event', 'HTMLElement'] as const;
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

async function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<StatusBar />));
  return { host, root };
}

describe('状态栏', () => {
  it('显示字数与创建时间，取文件系统与 git 中较早者', async () => {
    const { host, root } = await mount();
    const early = new Date(2024, 0, 5).getTime();
    const late = new Date(2025, 5, 20).getTime();
    await act(async () => updateStatusbarFile(12345, late, early));
    expect(host.querySelector('#sbCharCount')!.textContent).toBe('12,345 字');
    expect(host.querySelector('#sbCreatedAt')!.textContent).toBe('创建于 2024-01-05');
    await act(async () => root.unmount());
  });

  it('无字数/时间时两项为空', async () => {
    const { host, root } = await mount();
    await act(async () => updateStatusbarFile(0));
    expect(host.querySelector('#sbCharCount')!.textContent).toBe('');
    expect(host.querySelector('#sbCreatedAt')!.textContent).toBe('');
    await act(async () => root.unmount());
  });

  it('连接状态：圆点类名与文字随状态变化，failed 按未连接显示', async () => {
    const { host, root } = await mount();
    const dot = () => host.querySelector('#sbDot')!.className;
    const text = () => host.querySelector('#sbConnectionText')!.textContent;
    await act(async () => updateStatusbarConnection('connected'));
    expect(dot()).toContain('connected');
    expect(text()).toBe('已连接');
    await act(async () => updateStatusbarConnection('connecting'));
    expect(dot()).toContain('connecting');
    expect(text()).toBe('连接中');
    await act(async () => updateStatusbarConnection('failed'));
    expect(dot()).toContain('disconnected');
    expect(text()).toBe('未连接');
    await act(async () => root.unmount());
  });
});
