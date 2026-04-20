import { beforeEach, describe, expect, it, mock } from 'bun:test';
import { Window } from 'happy-dom';
import { setupKeyboardShortcuts, type KeyboardShortcutDeps } from '../../src/client/keyboard-shortcuts';

let doc: Document;
let win: Window;
let KeyboardEventClass: typeof KeyboardEvent;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  doc = win.document as unknown as Document;
  (globalThis as any).document = doc;
  KeyboardEventClass = win.KeyboardEvent as typeof KeyboardEvent;
});

function makeEvent(key: string, opts: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEventClass('keydown', { key, bubbles: true, cancelable: true, ...opts });
}

function makeDeps(overrides: Partial<KeyboardShortcutDeps> = {}): KeyboardShortcutDeps {
  return {
    dismissAnnotationPopup: mock(() => false),
    closeSettings: mock(),
    removeFile: mock(),
    navigateDiff: mock(),
    getCurrentFile: () => '/test/file.md',
    isDiffActive: () => false,
    ...overrides,
  };
}

describe('Escape key', () => {
  it('dismisses annotation popup first, stops propagation', () => {
    const deps = makeDeps({ dismissAnnotationPopup: mock(() => true) });
    setupKeyboardShortcuts(deps);
    const e = makeEvent('Escape');
    document.dispatchEvent(e);
    expect(deps.dismissAnnotationPopup).toHaveBeenCalled();
    expect(deps.closeSettings).not.toHaveBeenCalled();
  });

  it('closes settings if annotation popup not dismissed', () => {
    const overlay = document.createElement('div');
    overlay.id = 'settingsDialogOverlay';
    overlay.classList.add('show');
    document.body.appendChild(overlay);
    const deps = makeDeps();
    setupKeyboardShortcuts(deps);
    document.dispatchEvent(makeEvent('Escape'));
    expect(deps.closeSettings).toHaveBeenCalled();
    document.body.removeChild(overlay);
  });

  it('closes workspace overlay if settings not open', () => {
    const overlay = document.createElement('div');
    overlay.id = 'addWorkspaceDialogOverlay';
    overlay.classList.add('show');
    document.body.appendChild(overlay);
    const deps = makeDeps();
    setupKeyboardShortcuts(deps);
    document.dispatchEvent(makeEvent('Escape'));
    expect(overlay.classList.contains('show')).toBe(false);
    document.body.removeChild(overlay);
  });
});

describe('Cmd/Ctrl-W', () => {
  it('calls removeFile with current file', () => {
    const deps = makeDeps({ getCurrentFile: () => '/test/file.md' });
    setupKeyboardShortcuts(deps);
    document.dispatchEvent(makeEvent('w', { metaKey: true }));
    expect(deps.removeFile).toHaveBeenCalledWith('/test/file.md');
  });

  it('does nothing when no current file', () => {
    const deps = makeDeps({ getCurrentFile: () => undefined });
    setupKeyboardShortcuts(deps);
    document.dispatchEvent(makeEvent('w', { metaKey: true }));
    expect(deps.removeFile).not.toHaveBeenCalled();
  });
});

describe('n/p diff navigation', () => {
  it('calls navigateDiff(1) on n when diff active', () => {
    const deps = makeDeps({ isDiffActive: () => true });
    setupKeyboardShortcuts(deps);
    document.dispatchEvent(makeEvent('n'));
    expect(deps.navigateDiff).toHaveBeenCalledWith(1);
  });

  it('calls navigateDiff(-1) on p when diff active', () => {
    const deps = makeDeps({ isDiffActive: () => true });
    setupKeyboardShortcuts(deps);
    document.dispatchEvent(makeEvent('p'));
    expect(deps.navigateDiff).toHaveBeenCalledWith(-1);
  });

  it('does not navigate when diff not active', () => {
    const deps = makeDeps({ isDiffActive: () => false });
    setupKeyboardShortcuts(deps);
    document.dispatchEvent(makeEvent('n'));
    expect(deps.navigateDiff).not.toHaveBeenCalled();
  });
});
