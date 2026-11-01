import { afterAll, beforeAll, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Toolbar, type ToolbarDeps } from '../../src/client/toolbar/Toolbar';
import { toolbarStore } from '../../src/client/toolbar/store';

const KEYS = ['window', 'document', 'Event', 'HTMLElement', 'KeyboardEvent'] as const;
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

function deps(over: Partial<ToolbarDeps> = {}): ToolbarDeps {
  return {
    onDiff: mock(() => {}),
    onRefresh: mock(() => {}),
    onZoomIn: mock(() => {}),
    onZoomOut: mock(() => {}),
    onZoomCommit: mock((_raw: string) => {}),
    onPdfMode: mock((_mode) => {}),
    onSettings: mock(() => {}),
    ...over,
  };
}

async function mount(d: ToolbarDeps) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<Toolbar deps={d} />));
  return { host, root };
}

const byId = <T extends HTMLElement>(host: HTMLElement, id: string) => host.querySelector<T>(`#${id}`)!;

describe('工具栏', () => {
  it('面包屑把家目录折叠成 ~，最后一段高亮', async () => {
    await act(async () => toolbarStore.setBreadcrumb('/Users/huang/workspace/a.md'));
    const { host, root } = await mount(deps());
    const items = [...host.querySelectorAll('.breadcrumb-item')].map((n) => n.textContent);
    expect(items).toEqual(['~', 'workspace', 'a.md']);
    expect(host.querySelector('.breadcrumb-item.active')!.textContent).toBe('a.md');
    await act(async () => root.unmount());
    await act(async () => toolbarStore.setBreadcrumb(null));
  });

  it('Diff 与刷新按钮的显示跟随 store', async () => {
    const { host, root } = await mount(deps());
    const diff = byId<HTMLElement>(host, 'diffButton');
    const refresh = byId<HTMLElement>(host, 'refreshButton');
    expect(diff.style.display).toBe('none');
    expect(refresh.style.display).toBe('none');

    await act(async () => toolbarStore.setDiff({ visible: true, active: true }));
    await act(async () => toolbarStore.setRefreshVisible(true));
    expect(diff.style.display).toBe('flex');
    expect(diff.classList.contains('active')).toBe(true);
    expect(refresh.style.display).toBe('flex');

    await act(async () => toolbarStore.setDiff({ visible: false, active: false }));
    await act(async () => toolbarStore.setRefreshVisible(false));
    await act(async () => root.unmount());
  });

  it('PDF 模式按钮只在 PDF 时显示，并高亮当前模式', async () => {
    const { host, root } = await mount(deps());
    const select = byId<HTMLElement>(host, 'pdfModeSelectBtn');
    const annotate = byId<HTMLElement>(host, 'pdfModeAnnotateBtn');
    expect(select.style.display).toBe('none');

    await act(async () => toolbarStore.setPdf(true, 'annotate'));
    expect(select.style.display).toBe('');
    expect(annotate.classList.contains('is-active')).toBe(true);
    expect(select.classList.contains('is-active')).toBe(false);
    await act(async () => toolbarStore.setPdf(false, 'annotate'));
    await act(async () => root.unmount());
  });

  it('缩放输入框：聚焦时显示草稿，回车提交，Esc 放弃', async () => {
    await act(async () => toolbarStore.setZoomText('100%'));
    const commit = mock((_raw: string) => {});
    const { host, root } = await mount(deps({ onZoomCommit: commit }));
    const input = byId<HTMLInputElement>(host, 'fontScaleInput');
    expect(input.value).toBe('100%');

    await act(async () => { input.dispatchEvent(new Event('focusin', { bubbles: true })); });
    await act(async () => {
      input.value = '150';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    expect(input.value).toBe('150');

    // Esc：放弃草稿，失焦时提交原值
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      input.dispatchEvent(new Event('focusout', { bubbles: true }));
    });
    expect(commit).toHaveBeenLastCalledWith('100%');

    // 回车：失焦并提交输入值
    await act(async () => input.dispatchEvent(new Event('focusin', { bubbles: true })));
    await act(async () => {
      input.value = '150';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
    await act(async () => input.dispatchEvent(new Event('focusout', { bubbles: true })));
    expect(commit).toHaveBeenLastCalledWith('150');
    await act(async () => root.unmount());
  });

  it('缩放输入框未聚焦时跟随 store 更新', async () => {
    const { host, root } = await mount(deps());
    await act(async () => toolbarStore.setZoomText('175%'));
    expect(byId<HTMLInputElement>(host, 'fontScaleInput').value).toBe('175%');
    await act(async () => root.unmount());
  });
});
