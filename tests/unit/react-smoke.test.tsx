import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Smoke } from '../../src/client/agent/Smoke';

/** React 工具链冒烟：JSX 能编译、组件能挂载、更新能反映到 DOM。 */

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

describe('react toolchain', () => {
  it('挂载并更新组件', async () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    await act(async () => root.render(<Smoke label="a" />));
    expect(host.textContent).toBe('a');
    expect(host.querySelector('span')!.className).toContain('rounded-md');
    await act(async () => root.render(<Smoke label="b" />));
    expect(host.textContent).toBe('b');
    await act(async () => root.unmount());
    expect(host.innerHTML).toBe('');
  });
});
