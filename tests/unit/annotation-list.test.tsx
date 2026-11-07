import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { AnnotationList } from '../../src/client/annotation-list/AnnotationList';
import { annotationListStore, type AnnotationListView } from '../../src/client/annotation-list/store';
import { buildAnnotationListView } from '../../src/client/annotation-list/model';
import { startThreadItemEdit } from '../../src/client/annotation/thread-manager';
import type { Annotation } from '../../src/client/annotation-state';

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
  annotationListStore.setEditing(null);
  document.body.innerHTML = '';
});

function ann(over: Partial<Annotation> & { id: string }): Annotation {
  return {
    quote: '选中的原文',
    note: '第一条评论',
    status: 'open',
    confidence: 1,
    thread: [
      { id: `${over.id}-c`, type: 'comment', note: '第一条评论', createdAt: 1 },
      { id: `${over.id}-r`, type: 'reply', note: '一条回复', createdAt: 2 },
    ],
    ...over,
  } as unknown as Annotation;
}

async function mount(view: AnnotationListView) {
  annotationListStore.setView(view);
  const host = document.createElement('div');
  document.body.appendChild(host);
  host.id = 'annotationList';
  const root = createRoot(host);
  await act(async () => root.render(createElement(AnnotationList, { container: host })));
  return { host, root };
}

describe('评论列表 model', () => {
  it('没有文件或没有评论时显示空状态文字', () => {
    expect(buildAnnotationListView({
      filePath: null, annotations: [], visible: [], density: 'default',
      activeId: null, anchorTopOf: () => null, contentScrollHeight: 0,
    })).toEqual({ kind: 'empty', text: '无评论（选中文本即可添加）' });
  });

  it('筛选后为空时显示筛选提示', () => {
    const a = ann({ id: 'a' });
    expect(buildAnnotationListView({
      filePath: '/a.md', annotations: [a], visible: [], density: 'default',
      activeId: null, anchorTopOf: () => null, contentScrollHeight: 0,
    })).toEqual({ kind: 'empty', text: '当前筛选下无评论' });
  });

  it('default 密度缺少锚点时按序号 88px 排布，画布高度至少 maxTop + 180', () => {
    const a = ann({ id: 'a', serial: 1 } as any);
    const b = ann({ id: 'b', serial: 2 } as any);
    const view = buildAnnotationListView({
      filePath: '/a.md', annotations: [a, b], visible: [a, b], density: 'default',
      activeId: 'b', anchorTopOf: (id) => (id === 'a' ? 100.4 : null), contentScrollHeight: 0,
    });
    expect(view.kind).toBe('rows');
    if (view.kind !== 'rows') return;
    expect(view.rows.map((r) => r.anchorTop)).toEqual([100, 88]);
    expect(view.rows[1].active).toBe(true);
    // 与旧实现一致：画布高度基于未取整的最大 top
    expect(view.canvasHeight).toBe(100.4 + 180);
  });

  it('标题截断到 28 字符并保留序号；回复数不含首条评论', () => {
    const long = 'x'.repeat(30);
    const a = ann({ id: 'a', quote: long, serial: 3 } as any);
    const view = buildAnnotationListView({
      filePath: '/a.md', annotations: [a], visible: [a], density: 'simple',
      activeId: null, anchorTopOf: () => null, contentScrollHeight: 0,
    });
    if (view.kind !== 'rows') throw new Error('expected rows');
    expect(view.rows[0].title).toBe(`#3 | ${'x'.repeat(28)}...`);
    expect(view.rows[0].replyCount).toBe(1);
    expect(view.rows[0].thread).toEqual([]);
  });
});

describe('评论列表渲染', () => {
  it('simple 密度只显示首条评论内容和回复数', async () => {
    const a = ann({ id: 'a' });
    const view = buildAnnotationListView({
      filePath: '/a.md', annotations: [a], visible: [a], density: 'simple',
      activeId: null, anchorTopOf: () => null, contentScrollHeight: 0,
    });
    const { host, root } = await mount(view);
    expect(host.querySelector('.annotation-note.simple')?.textContent).toBe('第一条评论');
    expect(host.querySelector('.annotation-reply-count')?.textContent).toBe('回复 1');
    expect(host.querySelector('[data-reply-input]')).toBeNull();
    await act(async () => root.unmount());
  });

  it('完整密度显示每条评论、回复的删除按钮和回复输入框', async () => {
    const a = ann({ id: 'a' });
    const view = buildAnnotationListView({
      filePath: '/a.md', annotations: [a], visible: [a], density: 'default',
      activeId: null, anchorTopOf: () => 0, contentScrollHeight: 0,
    });
    const { host, root } = await mount(view);
    expect(host.querySelectorAll('.annotation-thread-line').length).toBe(2);
    expect(host.querySelector('[data-delete-thread-item="a-r"]')).not.toBeNull();
    expect(host.querySelector('[data-delete-thread-item="a-c"]')).toBeNull();
    expect(host.querySelector('[data-reply-input="a"]')).not.toBeNull();
    expect(host.querySelector('.annotation-item.positioned')?.getAttribute('data-anchor-top')).toBe('0');
    expect(host.classList.contains('default-mode')).toBe(true);
    await act(async () => root.unmount());
  });

  it('评论条目进入编辑态后显示编辑框，取消后恢复', async () => {
    const a = ann({ id: 'a' });
    const view = buildAnnotationListView({
      filePath: '/a.md', annotations: [a], visible: [a], density: 'default',
      activeId: null, anchorTopOf: () => 0, contentScrollHeight: 0,
    });
    const { host, root } = await mount(view);
    await act(async () => startThreadItemEdit('a', 'a-r'));
    const textarea = host.querySelector('.annotation-thread-edit-input') as HTMLTextAreaElement | null;
    expect(textarea).not.toBeNull();
    expect(textarea?.value).toBe('一条回复');
    expect(host.querySelector('.annotation-thread-line.is-editing')?.getAttribute('data-thread-item-id')).toBe('a-r');
    await act(async () => annotationListStore.setEditing(null));
    expect(host.querySelector('.annotation-thread-edit-input')).toBeNull();
    await act(async () => root.unmount());
  });

  it('回复草稿保存在 store 中，列表重建后仍可恢复', async () => {
    const a = ann({ id: 'a' });
    const view = buildAnnotationListView({
      filePath: '/a.md', annotations: [a], visible: [a], density: 'default',
      activeId: null, anchorTopOf: () => 0, contentScrollHeight: 0,
    });
    annotationListStore.setDraft('a', '未发送的草稿');
    const { host, root } = await mount(view);
    const input = host.querySelector('[data-reply-input="a"]') as HTMLTextAreaElement;
    expect(input.value).toBe('未发送的草稿');
    await act(async () => root.unmount());
  });

  it('空视图显示提示文字并移除 default-mode', async () => {
    const { host, root } = await mount({ kind: 'empty', text: '当前筛选下无评论' });
    expect(host.querySelector('.annotation-empty')?.textContent).toBe('当前筛选下无评论');
    expect(host.classList.contains('default-mode')).toBe(false);
    await act(async () => root.unmount());
  });
});
