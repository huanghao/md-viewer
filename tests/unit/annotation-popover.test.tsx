import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PopoverNote } from '../../src/client/annotation-popover/PopoverNote';
import { popoverNoteStore } from '../../src/client/annotation-popover/store';
import { state } from '../../src/client/annotation-state';
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
  state.annotations = [];
  popoverNoteStore.show('none', null);
  popoverNoteStore.setDraft('p1', '');
  popoverNoteStore.setDraft('p2', '');
  document.body.innerHTML = '';
});

function ann(id: string, extra: Partial<Annotation> = {}): Annotation {
  return {
    id,
    quote: '原文',
    note: '首条',
    status: 'open',
    confidence: 1,
    thread: [
      { id: `${id}-c`, type: 'comment', note: '首条', createdAt: 1 },
      { id: `${id}-r`, type: 'reply', note: '回复一', createdAt: 2 },
    ],
    ...extra,
  } as unknown as Annotation;
}

async function mount() {
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);
  await act(async () => root.render(createElement(PopoverNote)));
  return { host, root };
}

describe('评论浮窗正文', () => {
  it('没有显示的评论时不渲染内容', async () => {
    const { host, root } = await mount();
    expect(host.innerHTML).toBe('');
    await act(async () => root.unmount());
  });

  it('显示评论后渲染线程与回复输入框（属性与旧版一致）', async () => {
    state.annotations = [ann('p1')];
    popoverNoteStore.show('p1', '/a.md');
    const { host, root } = await mount();
    expect(host.querySelectorAll('.annotation-thread-line').length).toBe(2);
    expect(host.querySelector('[data-edit-thread-item="p1-c"]')).not.toBeNull();
    expect(host.querySelector('[data-delete-thread-item="p1-r"]')).not.toBeNull();
    expect(host.querySelector('.annotation-reply-entry[data-popover-reply-entry="p1"]')).not.toBeNull();
    expect(host.querySelector('textarea[data-popover-reply-input="p1"]')).not.toBeNull();
    await act(async () => root.unmount());
  });

  it('编辑态只替换对应条目为编辑框', async () => {
    state.annotations = [ann('p1')];
    popoverNoteStore.show('p1', '/a.md');
    const { host, root } = await mount();
    await act(async () => popoverNoteStore.startEdit('p1-r'));
    const editing = host.querySelector('.annotation-thread-line.is-editing');
    expect(editing?.getAttribute('data-thread-item-id')).toBe('p1-r');
    expect(host.querySelector('.annotation-thread-edit-input')).not.toBeNull();
    expect(host.querySelectorAll('.annotation-thread-line').length).toBe(2);
    await act(async () => popoverNoteStore.stopEdit('p1-r'));
    expect(host.querySelector('.annotation-thread-edit-input')).toBeNull();
    await act(async () => root.unmount());
  });

  it('回复草稿在浮窗切换回来后仍在', async () => {
    state.annotations = [ann('p1'), ann('p2')];
    popoverNoteStore.setDraft('p1', '写到一半');
    popoverNoteStore.show('p1', '/a.md');
    const { host, root } = await mount();
    expect((host.querySelector('[data-popover-reply-input="p1"]') as HTMLTextAreaElement).value).toBe('写到一半');
    await act(async () => popoverNoteStore.show('p2', '/a.md'));
    expect(host.querySelector('[data-popover-reply-input="p1"]')).toBeNull();
    await act(async () => popoverNoteStore.show('p1', '/a.md'));
    expect((host.querySelector('[data-popover-reply-input="p1"]') as HTMLTextAreaElement).value).toBe('写到一半');
    await act(async () => root.unmount());
  });

  it('评论数据变化后 refresh 会重绘线程', async () => {
    const a = ann('p1');
    state.annotations = [a];
    popoverNoteStore.show('p1', '/a.md');
    const { host, root } = await mount();
    expect(host.querySelectorAll('.annotation-thread-line').length).toBe(2);
    a.thread!.push({ id: 'p1-r2', type: 'reply', note: '回复二', createdAt: 3 } as any);
    await act(async () => popoverNoteStore.refresh());
    expect(host.querySelectorAll('.annotation-thread-line').length).toBe(3);
    await act(async () => root.unmount());
  });

  it('切换到另一条评论时退出编辑态，同一条保持编辑态', () => {
    popoverNoteStore.show('p1', '/a.md');
    popoverNoteStore.startEdit('p1-c');
    popoverNoteStore.show('p1', '/a.md');
    expect(popoverNoteStore.getState().editingItemId).toBe('p1-c');
    popoverNoteStore.show('p2', '/a.md');
    expect(popoverNoteStore.getState().editingItemId).toBeNull();
  });
});
