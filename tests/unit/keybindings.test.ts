import { beforeEach, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import {
  normalizeKeyCombo,
  registerAction,
  getEffectiveKey,
  saveBinding,
  resetBinding,
  resetAllBindings,
  findActionByKey,
} from '../../src/client/keybindings';

let win: Window;

beforeEach(() => {
  win = new Window({ url: 'http://localhost/' });
  (globalThis as any).document = win.document;
  (globalThis as any).localStorage = new (win as any).localStorage.constructor();
  resetAllBindings();
});

function makeEvent(key: string, opts: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new (win.KeyboardEvent as any)('keydown', {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
}

describe('normalizeKeyCombo', () => {
  it('returns plain key for single key', () => {
    expect(normalizeKeyCombo(makeEvent('p'))).toBe('p');
  });

  it('prefixes Ctrl for ctrlKey', () => {
    expect(normalizeKeyCombo(makeEvent('p', { ctrlKey: true }))).toBe('Ctrl+p');
  });

  it('prefixes Cmd for metaKey', () => {
    expect(normalizeKeyCombo(makeEvent('p', { metaKey: true }))).toBe('Cmd+p');
  });

  it('uses canonical order Ctrl+Cmd+Alt+Shift', () => {
    expect(
      normalizeKeyCombo(makeEvent('Tab', { ctrlKey: true, shiftKey: true }))
    ).toBe('Ctrl+Shift+Tab');
  });

  it('returns empty string for modifier-only events', () => {
    expect(normalizeKeyCombo(makeEvent('Control', { ctrlKey: true }))).toBe('');
    expect(normalizeKeyCombo(makeEvent('Shift', { shiftKey: true }))).toBe('');
    expect(normalizeKeyCombo(makeEvent('Meta', { metaKey: true }))).toBe('');
    expect(normalizeKeyCombo(makeEvent('Alt', { altKey: true }))).toBe('');
  });

  it('preserves non-letter key names as-is', () => {
    expect(normalizeKeyCombo(makeEvent('Tab', { ctrlKey: true }))).toBe('Ctrl+Tab');
    expect(normalizeKeyCombo(makeEvent('ArrowLeft', { altKey: true }))).toBe('Alt+ArrowLeft');
    expect(normalizeKeyCombo(makeEvent('Escape'))).toBe('Escape');
  });

  it('lowercases single letter keys', () => {
    expect(normalizeKeyCombo(makeEvent('K', { ctrlKey: true }))).toBe('Ctrl+k');
    expect(normalizeKeyCombo(makeEvent('W', { metaKey: true }))).toBe('Cmd+w');
  });
});

describe('KeybindingStore', () => {
  beforeEach(() => {
    // Clear registry between tests by re-creating the module state
    // Since we can't re-import, we use resetAllBindings
    resetAllBindings();
  });

  it('returns action defaultKey when no override', () => {
    registerAction({
      id: 'test-action',
      label: 'Test',
      category: 'view',
      defaultKey: 'Ctrl+p',
      handler: () => {},
    });
    expect(getEffectiveKey('test-action')).toBe('Ctrl+p');
  });

  it('returns user override when set', () => {
    registerAction({
      id: 'test-action2',
      label: 'Test2',
      category: 'view',
      defaultKey: 'Ctrl+p',
      handler: () => {},
    });
    saveBinding('test-action2', 'Ctrl+Shift+p');
    expect(getEffectiveKey('test-action2')).toBe('Ctrl+Shift+p');
  });

  it('returns null when binding explicitly unset with null', () => {
    registerAction({
      id: 'test-action3',
      label: 'Test3',
      category: 'view',
      defaultKey: 'Ctrl+p',
      handler: () => {},
    });
    saveBinding('test-action3', null);
    expect(getEffectiveKey('test-action3')).toBeNull();
  });

  it('resets to default after resetBinding', () => {
    registerAction({
      id: 'test-action4',
      label: 'Test4',
      category: 'view',
      defaultKey: 'Ctrl+p',
      handler: () => {},
    });
    saveBinding('test-action4', 'Ctrl+q');
    resetBinding('test-action4');
    expect(getEffectiveKey('test-action4')).toBe('Ctrl+p');
  });

  it('findActionByKey returns action for effective key', () => {
    const handler = () => {};
    registerAction({
      id: 'test-find',
      label: 'Find test',
      category: 'view',
      defaultKey: 'Ctrl+x',
      handler,
    });
    const found = findActionByKey('Ctrl+x');
    expect(found?.id).toBe('test-find');
  });

  it('findActionByKey returns undefined for unknown combo', () => {
    expect(findActionByKey('Ctrl+z')).toBeUndefined();
  });

  it('findActionByKey finds action by user override key, not default', () => {
    registerAction({
      id: 'test-override-find',
      label: 'Test override find',
      category: 'view',
      defaultKey: 'Alt+]',
      handler: () => {},
    });
    saveBinding('test-override-find', 'Alt+[');
    expect(findActionByKey('Alt+[')?.id).toBe('test-override-find');
    expect(findActionByKey('Alt+]')).toBeUndefined();
  });

  it('findActionByKey does not find action with null binding', () => {
    registerAction({
      id: 'test-null-find',
      label: 'Test null find',
      category: 'view',
      defaultKey: 'Alt+m',
      handler: () => {},
    });
    saveBinding('test-null-find', null);
    expect(findActionByKey('Alt+m')).toBeUndefined();
  });

  it('getEffectiveKey returns null for unregistered action', () => {
    expect(getEffectiveKey('nonexistent-action')).toBeNull();
  });

  it('resetAllBindings clears all overrides', () => {
    registerAction({
      id: 'test-reset-all-a',
      label: 'A',
      category: 'view',
      defaultKey: 'Ctrl+a',
      handler: () => {},
    });
    registerAction({
      id: 'test-reset-all-b',
      label: 'B',
      category: 'view',
      defaultKey: 'Ctrl+b',
      handler: () => {},
    });
    saveBinding('test-reset-all-a', 'Alt+a');
    saveBinding('test-reset-all-b', 'Alt+b');
    resetAllBindings();
    expect(getEffectiveKey('test-reset-all-a')).toBe('Ctrl+a');
    expect(getEffectiveKey('test-reset-all-b')).toBe('Ctrl+b');
  });
});
