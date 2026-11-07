import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { setupAnnotationInteractions } from '../../src/client/annotation/interactions';

const KEYS = ['window', 'document', 'Event', 'HTMLElement', 'MouseEvent', 'CustomEvent'] as const;
const saved: Record<string, any> = {};

beforeAll(() => {
  const win = new Window({ url: 'http://localhost/' });
  for (const k of KEYS) {
    saved[k] = (globalThis as any)[k];
    (globalThis as any)[k] = k === 'window' ? win : (win as any)[k];
  }
});

afterAll(() => {
  for (const k of KEYS) (globalThis as any)[k] = saved[k];
});

describe('setupAnnotationInteractions', () => {
  it('PDF 批注事件触发当前桥接的高亮刷新，pdf:show-composer 转交给待处理批注设置器', () => {
    document.body.innerHTML = '<div id="content"></div>';
    const rendered: number[] = [];
    const pending: unknown[] = [];
    const anns = [{ id: 'a1' }] as any[];
    setupAnnotationInteractions({
      getAnnotations: () => anns,
      getBridge: () => ({ renderHighlights: (list) => rendered.push(list.length) }),
      getPendingAnnotationSetter: () => (ann, filePath, x, y) => pending.push([ann.id, filePath, x, y]),
      openComposerFromPending: () => {},
      handleSelectionForAnnotation: () => {},
    });

    document.dispatchEvent(new Event('annotation:created'));
    document.dispatchEvent(new Event('annotations:loaded'));
    expect(rendered).toEqual([1, 1]);

    document.dispatchEvent(new CustomEvent('pdf:show-composer', {
      detail: { annotation: { id: 'x' }, filePath: '/f.pdf', clientX: 10, clientY: 20 },
    }));
    expect(pending).toEqual([['x', '/f.pdf', 10, 20]]);
  });

  it('没有桥接时事件不报错', () => {
    document.body.innerHTML = '<div id="content"></div>';
    setupAnnotationInteractions({
      getAnnotations: () => [],
      getBridge: () => null,
      getPendingAnnotationSetter: () => null,
      openComposerFromPending: () => {},
      handleSelectionForAnnotation: () => {},
    });
    expect(() => document.dispatchEvent(new Event('annotation:deleted'))).not.toThrow();
  });
});
