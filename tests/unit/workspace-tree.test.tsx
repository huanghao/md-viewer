import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import type { FileTreeNode, Workspace } from '../../src/client/types';
import { state } from '../../src/client/state';
import { WorkspaceTree } from '../../src/client/workspace-tree/WorkspaceTree';

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

const ws: Workspace = { id: 'ws1', name: 'notes', path: '/root/notes', isExpanded: true };

function resetState() {
  state.config.workspaces = [];
  state.fileTree.clear();
  state.searchQuery = '';
}

beforeEach(resetState);

afterEach(() => {
  resetState();
  document.body.innerHTML = '';
});

async function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(<WorkspaceTree deps={{ onRendered: mock((_el: HTMLElement) => {}) }} />));
  return { host, root };
}

const tree: FileTreeNode = {
  name: 'notes',
  path: '/root/notes',
  type: 'directory',
  children: [
    { name: 'a.md', path: '/root/notes/a.md', type: 'file' },
    {
      name: 'sub',
      path: '/root/notes/sub',
      type: 'directory',
      fileCount: 2,
      children: [{ name: 'b.md', path: '/root/notes/sub/b.md', type: 'file' }],
    },
  ],
};

describe('工作区树', () => {
  it('没有工作区时显示引导文字', async () => {
    const { host, root } = await mount();
    expect(host.querySelector('.empty-workspace p')!.textContent).toBe('暂无工作区');
    await act(async () => root.unmount());
  });

  it('展开的工作区渲染文件节点（file-click）与目录节点（node-click）', async () => {
    state.config.workspaces = [ws];
    state.fileTree.set(ws.id, tree);
    const { host, root } = await mount();

    const header = host.querySelector('.workspace-header')!;
    expect(header.getAttribute('data-action')).toBe('workspace-toggle');
    expect(header.querySelector('.workspace-toggle')!.classList.contains('open')).toBe(true);

    const fileRow = host.querySelector<HTMLElement>('.tree-item.file-node[data-path="/root/notes/a.md"]')!;
    expect(fileRow.dataset.action).toBe('file-click');
    expect(fileRow.querySelector('.tree-pin-btn')).not.toBeNull();

    const dir = host.querySelector<HTMLElement>('.directory-node .tree-name')!;
    expect(dir.dataset.action).toBe('node-click');
    expect(dir.dataset.nodePath).toBe('/root/notes/sub');
    expect(host.querySelector('.tree-count')!.textContent).toBe('2');
    // 子目录内的文件也渲染出来
    expect(host.querySelector('.tree-item.file-node[data-path="/root/notes/sub/b.md"]')).not.toBeNull();
    await act(async () => root.unmount());
  });

  it('折叠的工作区不渲染文件树', async () => {
    state.config.workspaces = [{ ...ws, isExpanded: false }];
    state.fileTree.set(ws.id, tree);
    const { host, root } = await mount();
    expect(host.querySelector('.workspace-toggle')!.classList.contains('open')).toBe(false);
    expect(host.querySelector('.file-tree')).toBeNull();
    await act(async () => root.unmount());
  });

  it('树为空时显示“此目录下没有 Markdown/HTML 文件”', async () => {
    state.config.workspaces = [ws];
    state.fileTree.set(ws.id, { name: 'notes', path: ws.path, type: 'directory', children: [] });
    const { host, root } = await mount();
    expect(host.querySelector('.file-tree.empty .tree-empty')!.textContent).toBe('此目录下没有 Markdown/HTML 文件');
    await act(async () => root.unmount());
  });

  it('搜索无匹配时显示“未找到匹配内容”', async () => {
    state.config.workspaces = [ws];
    state.fileTree.set(ws.id, tree);
    state.searchQuery = 'zzzzqqq';
    const { host, root } = await mount();
    expect(host.querySelector('.empty-workspace p')!.textContent).toBe('未找到匹配内容');
    await act(async () => root.unmount());
  });
});
