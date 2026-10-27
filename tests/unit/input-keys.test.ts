import { describe, expect, it, beforeEach } from 'bun:test';
import { Window } from 'happy-dom';
import { isSubmitKey, handleCtrlEnterNewline } from '../../src/client/utils/input-keys';

let win: Window;
let K: typeof KeyboardEvent;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  (globalThis as any).document = win.document;
  (globalThis as any).Event = win.Event;
  K = win.KeyboardEvent as typeof KeyboardEvent;
});

const key = (init: KeyboardEventInit) => new K('keydown', { key: 'Enter', ...init });

describe('isSubmitKey', () => {
  it('only Cmd+Enter submits', () => {
    expect(isSubmitKey(key({ metaKey: true }))).toBe(true);
    expect(isSubmitKey(key({}))).toBe(false);
    expect(isSubmitKey(key({ ctrlKey: true }))).toBe(false);
    expect(isSubmitKey(key({ metaKey: true, ctrlKey: true }))).toBe(false);
    expect(isSubmitKey(key({ metaKey: true, shiftKey: true }))).toBe(false);
  });

  it('does not submit during IME composition', () => {
    expect(isSubmitKey(key({ metaKey: true, isComposing: true }))).toBe(false);
  });
});

describe('handleCtrlEnterNewline', () => {
  const ta = (value: string, pos: number) => {
    const el = (win.document as any).createElement('textarea') as HTMLTextAreaElement;
    el.value = value;
    el.setSelectionRange(pos, pos);
    return el;
  };

  it('inserts a newline for Ctrl+Enter in a textarea', () => {
    const el = ta('ab', 1);
    expect(handleCtrlEnterNewline(key({ ctrlKey: true }), el)).toBe(true);
    expect(el.value).toBe('a\nb');
  });

  it('ignores plain Enter, Cmd+Enter and non-textarea', () => {
    const el = ta('ab', 1);
    expect(handleCtrlEnterNewline(key({}), el)).toBe(false);
    expect(handleCtrlEnterNewline(key({ metaKey: true }), el)).toBe(false);
    const input = (win.document as any).createElement('input') as HTMLInputElement;
    expect(handleCtrlEnterNewline(key({ ctrlKey: true }), input)).toBe(false);
  });
});
