import { describe, expect, it, mock, beforeEach } from 'bun:test';
import { createResizer } from '../../src/client/utils/resizer';

describe('createResizer', () => {
  let listeners: Record<string, Function[]>;

  beforeEach(() => {
    listeners = {};
    (globalThis as any).window = {
      addEventListener: (type: string, fn: Function) => {
        listeners[type] = listeners[type] || [];
        listeners[type].push(fn);
      },
      removeEventListener: (type: string, fn: Function) => {
        listeners[type] = (listeners[type] || []).filter(f => f !== fn);
      },
    };
    (globalThis as any).document = {
      body: { classList: { add: mock(), remove: mock() } },
    };
  });

  it('calls onMove with delta and clientX on mousemove', () => {
    const onMove = mock();
    const el = { addEventListener: mock() } as any;
    createResizer({ element: el, bodyClass: 'resizing', onMove, onEnd: mock() });

    const [[, mousedownFn]] = (el.addEventListener as any).mock.calls;
    mousedownFn({ clientX: 100, preventDefault: mock() });

    listeners['mousemove'][0]({ clientX: 80 });
    expect(onMove).toHaveBeenCalledWith(20, 80);
  });

  it('calls onEnd with delta and clientX, removes listeners on mouseup', () => {
    const onEnd = mock();
    const el = { addEventListener: mock() } as any;
    createResizer({ element: el, bodyClass: 'resizing', onMove: mock(), onEnd });

    const [[, mousedownFn]] = (el.addEventListener as any).mock.calls;
    mousedownFn({ clientX: 100, preventDefault: mock() });
    listeners['mouseup'][0]({ clientX: 80 });

    expect(onEnd).toHaveBeenCalledWith(20, 80);
    expect(listeners['mousemove'].length).toBe(0);
    expect(listeners['mouseup'].length).toBe(0);
  });

  it('does not start drag if guard returns false', () => {
    const onMove = mock();
    const el = { addEventListener: mock() } as any;
    createResizer({ element: el, bodyClass: 'resizing', onMove, onEnd: mock(), guard: () => false });

    const [[, mousedownFn]] = (el.addEventListener as any).mock.calls;
    mousedownFn({ clientX: 100, preventDefault: mock() });

    expect(listeners['mousemove']).toBeUndefined();
    expect(onMove).not.toHaveBeenCalled();
  });

  it('adds bodyClass on mousedown and removes on mouseup', () => {
    const el = { addEventListener: mock() } as any;
    createResizer({ element: el, bodyClass: 'my-resizing', onMove: mock(), onEnd: mock() });

    const [[, mousedownFn]] = (el.addEventListener as any).mock.calls;
    mousedownFn({ clientX: 100, preventDefault: mock() });
    expect((document.body.classList.add as any).mock.calls[0][0]).toBe('my-resizing');

    listeners['mouseup'][0]({ clientX: 90 });
    expect((document.body.classList.remove as any).mock.calls[0][0]).toBe('my-resizing');
  });
});
