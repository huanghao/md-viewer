import { afterAll, afterEach, beforeAll, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { FileList, type FileListDeps } from '../../src/client/file-list/FileList';
import { fileListStore, type FileListRow } from '../../src/client/file-list/store';

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
  fileListStore.setSnapshot({ rows: [], empty: null });
  document.body.innerHTML = '';
});

function row(over: Partial<FileListRow> = {}): FileListRow {
  return {
    path: '/a/readme.md',
    name: 'readme',
    title: '/a/readme.md',
    nameHtml: 'readme',
    isCurrent: false,
    isMissing: false,
    status: { kind: 'none' },
    annotationCount: 0,
    pinned: false,
    typeIcon: { cls: 'md', label: 'M' },
    ...over,
  };
}

function deps(): FileListDeps {
  return { reorder: mock((_from: number, _to: number) => {}), onRendered: mock((_el: HTMLElement) => {}) };
}

async function mount(d: FileListDeps) {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<FileList deps={d} />));
  return { host, root };
}

describe('文件列表', () => {
  it('空状态显示提示文字，没有行', async () => {
    fileListStore.setSnapshot({ rows: [], empty: '未找到匹配的文件' });
    const { host, root } = await mount(deps());
    expect(host.querySelector('.empty-tip')!.textContent).toBe('未找到匹配的文件');
    expect(host.querySelectorAll('.file-item').length).toBe(0);
    await act(async () => root.unmount());
  });

  it('行的 class、徽标、同名提示、批注数与固定按钮跟随快照', async () => {
    fileListStore.setSnapshot({
      empty: null,
      rows: [
        row({ path: '/a/readme.md', isCurrent: true, status: { kind: 'badge', text: 'M', cls: 'status-modified', color: '#ff9500' }, annotationCount: 3, pinned: true, nameHint: 'a', title: '/a/readme.md' }),
        row({ path: '/b/gone.md', name: 'gone', nameHtml: 'gone', isMissing: true, status: { kind: 'dot' } }),
      ],
    });
    const { host, root } = await mount(deps());

    const items = [...host.querySelectorAll<HTMLElement>('.file-item')];
    expect(items.map((el) => el.dataset.path)).toEqual(['/a/readme.md', '/b/gone.md']);
    expect(items[0].classList.contains('current')).toBe(true);
    expect(items[1].classList.contains('missing')).toBe(true);
    expect(items[0].querySelector('.status-badge.status-modified')!.textContent).toBe('M');
    expect(items[1].querySelector('.new-dot')).not.toBeNull();
    expect(items[0].querySelector('.name-hint')!.textContent).toBe('a');
    expect(items[0].querySelector('.annotation-count-badge')!.textContent).toBe('3');
    expect(items[1].querySelector('.annotation-count-badge')).toBeNull();

    const pin = items[0].querySelector<HTMLElement>('.tree-pin-btn')!;
    expect(pin.classList.contains('active')).toBe(true);
    expect(pin.dataset.action).toBe('unpin-file');
    expect(items[1].querySelector<HTMLElement>('.tree-pin-btn')!.dataset.action).toBe('pin-file');
    expect(items[0].querySelector<HTMLElement>('.close')!.dataset.action).toBe('remove-file');
    await act(async () => root.unmount());
  });

  it('快照更新后重新渲染，并通知 onRendered', async () => {
    const d = deps();
    const { host, root } = await mount(d);
    await act(async () => fileListStore.setSnapshot({ rows: [row()], empty: null }));
    expect(host.querySelectorAll('.file-item').length).toBe(1);
    expect(d.onRendered).toHaveBeenCalled();
    await act(async () => fileListStore.setSnapshot({ rows: [], empty: '点击上方添加 Markdown/HTML 文件' }));
    expect(host.querySelector('.empty-tip')!.textContent).toContain('点击上方添加');
    await act(async () => root.unmount());
  });
});
