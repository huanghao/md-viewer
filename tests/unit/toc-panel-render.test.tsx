import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { TocPanel } from '../../src/client/toc/TocPanel';
import { tocStore } from '../../src/client/toc/store';
import type { TocItem } from '../../src/client/toc-extractor';

const KEYS = ['window', 'document', 'Node', 'HTMLElement', 'Event', 'MouseEvent', 'CustomEvent'] as const;
const saved: Record<string, any> = {};
let root: Root | null = null;
let container: HTMLElement;

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
});

function mount(): void {
  tocStore.reset();
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root!.render(createElement(TocPanel)));
}

function cleanup(): void {
  if (root) act(() => root!.unmount());
  root = null;
  container?.remove();
  tocStore.reset();
}

const items: TocItem[] = [
  { title: 'Intro', level: 1, anchor: 'intro', children: [
    { title: 'Background', level: 2, anchor: 'background', children: [] },
  ] },
  { title: 'Conclusion', level: 1, anchor: 'conclusion', children: [] },
];

describe('TocPanel 渲染', () => {
  it('列表项带 data 属性与层级徽标，标题作为文字显示', () => {
    mount();
    act(() => tocStore.setItems(items, () => {}));
    const links = container.querySelectorAll('.toc-item');
    expect(links.length).toBe(3);
    expect(links[1].getAttribute('data-level')).toBe('2');
    expect(links[0].querySelector('.toc-level-badge')?.textContent).toBe('#1');
    expect(links[1].querySelector('.toc-item-title')?.textContent).toBe('Background');
    cleanup();
  });

  it('标题中的 HTML 作为文字显示，不生成元素', () => {
    mount();
    act(() => tocStore.setItems([{ title: '<img src=x onerror="window.__x=1">注入', level: 1, children: [] }], () => {}));
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.toc-item-title')?.textContent).toBe('<img src=x onerror="window.__x=1">注入');
    cleanup();
  });

  it('点击条目调用 onJump，并传入对应条目', () => {
    mount();
    const jumped: string[] = [];
    act(() => tocStore.setItems(items, (item) => jumped.push(item.title)));
    (container.querySelectorAll('.toc-item')[2] as HTMLElement).click();
    expect(jumped).toEqual(['Conclusion']);
    cleanup();
  });

  it('激活项获得 active 类', () => {
    mount();
    act(() => {
      tocStore.setItems(items, () => {});
      tocStore.setActive({ title: 'Background' });
    });
    const active = container.querySelectorAll('.toc-item.active');
    expect(active.length).toBe(1);
    expect(active[0].querySelector('.toc-item-title')?.textContent).toBe('Background');
    cleanup();
  });

  it('加载中、无目录、出错三种占位', () => {
    mount();
    act(() => tocStore.setLoading());
    expect(container.querySelector('.toc-empty')?.textContent).toBe('加载中…');
    act(() => tocStore.setEmpty());
    expect(container.querySelector('.toc-empty')?.textContent).toBe('无目录');
    act(() => tocStore.setError('bad'));
    expect(container.querySelector('.toc-error-detail')?.textContent).toBe('bad');
    cleanup();
  });

  it('收起按钮只在标题栏出现后显示，且只渲染一个标题栏', () => {
    mount();
    expect(container.querySelector('.toc-header')).toBeNull();
    act(() => tocStore.setItems(items, () => {}));
    act(() => tocStore.setItems(items, () => {}));
    expect(container.querySelectorAll('.toc-header').length).toBe(1);
    expect(container.querySelector('.toc-toggle-btn')).not.toBeNull();
    cleanup();
  });

  it('收起按钮移除侧栏的 toc-visible 并派发 toc:close', () => {
    const sidebar = document.createElement('div');
    sidebar.className = 'sidebar toc-visible';
    document.body.appendChild(sidebar);
    let closed = 0;
    const onClose = () => closed++;
    document.addEventListener('toc:close', onClose);
    mount();
    act(() => tocStore.setItems(items, () => {}));
    (container.querySelector('.toc-toggle-btn') as HTMLElement).click();
    expect(sidebar.classList.contains('toc-visible')).toBe(false);
    expect(closed).toBe(1);
    document.removeEventListener('toc:close', onClose);
    sidebar.remove();
    cleanup();
  });
});
