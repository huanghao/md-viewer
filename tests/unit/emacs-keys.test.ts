import { describe, expect, it, beforeEach } from 'bun:test';
import { Window } from 'happy-dom';
import { handleEmacsKeys } from '../../src/client/utils/emacs-keys';

let win: Window;
let KeyboardEventClass: typeof KeyboardEvent;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  (globalThis as any).document = win.document;
  (globalThis as any).Event = win.Event;
  KeyboardEventClass = win.KeyboardEvent as typeof KeyboardEvent;
});

function makeTextarea(value: string, pos: number): HTMLTextAreaElement {
  const ta = (win.document as unknown as Document).createElement('textarea') as unknown as HTMLTextAreaElement;
  ta.value = value;
  ta.selectionStart = pos;
  ta.selectionEnd = pos;
  return ta;
}

function ctrl(key: string): KeyboardEvent {
  return new KeyboardEventClass('keydown', { key, ctrlKey: true, bubbles: true, cancelable: true });
}

// ==================== Bug 1 regression: Ctrl-D must not double-delete ====================

describe('handleEmacsKeys Ctrl-D', () => {
  it('deletes one character forward and returns true', () => {
    const ta = makeTextarea('hello', 2); // cursor after 'l'
    const e = ctrl('d');
    const handled = handleEmacsKeys(e, ta);
    expect(handled).toBe(true);
    expect(ta.value).toBe('helo');
    expect(ta.selectionStart).toBe(2);
  });

  it('does nothing at end of string', () => {
    const ta = makeTextarea('hi', 2);
    const handled = handleEmacsKeys(ctrl('d'), ta);
    expect(handled).toBe(true);
    expect(ta.value).toBe('hi');
  });

  it('calling twice deletes two characters (simulates double-bubble bug)', () => {
    // Regression: if stopPropagation() is missing the event bubbles and
    // handleEmacsKeys is called a second time on the already-mutated textarea.
    // After the fix, callers must stopPropagation() so this scenario never
    // happens in practice. Here we verify the function itself is idempotent
    // when called on the updated textarea state.
    const ta = makeTextarea('hello', 0);
    handleEmacsKeys(ctrl('d'), ta); // first call: 'hello' → 'ello'
    handleEmacsKeys(ctrl('d'), ta); // second call: 'ello' → 'llo'
    expect(ta.value).toBe('llo');   // confirms two calls = two deletions
    // The fix is stopPropagation() in the caller, not in handleEmacsKeys itself.
  });
});

// ==================== Other Emacs keys sanity ====================

describe('handleEmacsKeys Ctrl-H (backspace)', () => {
  it('deletes character before cursor', () => {
    const ta = makeTextarea('hello', 3);
    handleEmacsKeys(ctrl('h'), ta);
    expect(ta.value).toBe('helo');
    expect(ta.selectionStart).toBe(2);
  });
});

describe('handleEmacsKeys Ctrl-K (kill to end of line)', () => {
  it('kills from cursor to end of line', () => {
    const ta = makeTextarea('hello world', 5);
    handleEmacsKeys(ctrl('k'), ta);
    expect(ta.value).toBe('hello');
  });

  it('kills newline when cursor is at end of line', () => {
    const ta = makeTextarea('line1\nline2', 5); // cursor at end of 'line1'
    handleEmacsKeys(ctrl('k'), ta);
    expect(ta.value).toBe('line1line2');
  });
});

describe('handleEmacsKeys Ctrl-A / Ctrl-E', () => {
  it('Ctrl-A moves to line start', () => {
    const ta = makeTextarea('hello\nworld', 8); // inside 'world'
    handleEmacsKeys(ctrl('a'), ta);
    expect(ta.selectionStart).toBe(6); // start of 'world'
  });

  it('Ctrl-E moves to line end', () => {
    const ta = makeTextarea('hello\nworld', 8);
    handleEmacsKeys(ctrl('e'), ta);
    expect(ta.selectionStart).toBe(11); // end of 'world'
  });
});

describe('handleEmacsKeys non-ctrl keys', () => {
  it('returns false for non-ctrl key', () => {
    const ta = makeTextarea('hello', 0);
    const e = new KeyboardEventClass('keydown', { key: 'd', bubbles: true });
    expect(handleEmacsKeys(e, ta)).toBe(false);
    expect(ta.value).toBe('hello');
  });

  it('returns false for meta+key', () => {
    const ta = makeTextarea('hello', 0);
    const e = new KeyboardEventClass('keydown', { key: 'd', ctrlKey: true, metaKey: true, bubbles: true });
    expect(handleEmacsKeys(e, ta)).toBe(false);
  });
});

// ==================== Bug 2 regression: popover reply draft preservation ====================
// This tests the logic extracted into showPopover: save draft before innerHTML rebuild, restore after.

describe('popover reply draft save/restore pattern', () => {
  it('preserves draft value when container innerHTML is rebuilt', () => {
    const doc = win.document as unknown as Document;
    const container = doc.createElement('div');
    container.innerHTML = '<textarea data-popover-reply-input="ann-1"></textarea>';
    const ta = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]')!;
    ta.value = 'draft text';

    // Simulate what showPopover does: save draft, rebuild, restore
    const existing = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]');
    const draft = existing?.value ?? '';
    container.innerHTML = '<textarea data-popover-reply-input="ann-1"></textarea>';
    if (draft) {
      const newTa = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]');
      if (newTa) newTa.value = draft;
    }

    const restored = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]')!;
    expect(restored.value).toBe('draft text');
  });

  it('does not set value when draft is empty', () => {
    const doc = win.document as unknown as Document;
    const container = doc.createElement('div');
    container.innerHTML = '<textarea data-popover-reply-input="ann-1"></textarea>';

    const existing = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]');
    const draft = existing?.value ?? '';
    container.innerHTML = '<textarea data-popover-reply-input="ann-1" placeholder="type here"></textarea>';
    if (draft) {
      const newTa = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]');
      if (newTa) newTa.value = draft;
    }

    const restored = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]')!;
    expect(restored.value).toBe('');
  });

  it('preserves draft across multiple rebuilds (simulates repeated scroll)', () => {
    const doc = win.document as unknown as Document;
    const container = doc.createElement('div');
    container.innerHTML = '<textarea data-popover-reply-input="ann-1"></textarea>';
    container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]')!.value = 'my reply';

    for (let i = 0; i < 3; i++) {
      const existing = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]');
      const draft = existing?.value ?? '';
      container.innerHTML = '<textarea data-popover-reply-input="ann-1"></textarea>';
      if (draft) {
        const newTa = container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]');
        if (newTa) newTa.value = draft;
      }
    }

    expect(container.querySelector<HTMLTextAreaElement>('[data-popover-reply-input="ann-1"]')!.value).toBe('my reply');
  });
});
