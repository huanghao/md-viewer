export type ActionCategory = 'navigation' | 'file' | 'view' | 'diff';

export interface Action {
  id: string;
  label: string;
  category: ActionCategory;
  defaultKey: string | null;
  handler: () => void;
  shouldActivate?: (e: KeyboardEvent) => boolean;
}

const registry = new Map<string, Action>();

export function registerAction(action: Action): void {
  registry.set(action.id, action);
}

export function getRegisteredActions(): Action[] {
  return Array.from(registry.values());
}

const MODIFIERS = new Set(['Control', 'Meta', 'Alt', 'Shift']);

export function normalizeKeyCombo(e: KeyboardEvent): string {
  if (MODIFIERS.has(e.key)) return '';
  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.metaKey) parts.push('Cmd');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  parts.push(e.key.length === 1 ? e.key.toLowerCase() : e.key);
  return parts.join('+');
}

const STORAGE_KEY = 'mdv-keybindings';

function loadUserBindings(): Record<string, string | null> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Record<string, string | null>;
  } catch {
    return {};
  }
}

function saveUserBindings(bindings: Record<string, string | null>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
}

export function getEffectiveKey(actionId: string): string | null {
  const bindings = loadUserBindings();
  if (Object.prototype.hasOwnProperty.call(bindings, actionId)) {
    return bindings[actionId];
  }
  return registry.get(actionId)?.defaultKey ?? null;
}

export function saveBinding(actionId: string, keyCombo: string | null): void {
  const bindings = loadUserBindings();
  bindings[actionId] = keyCombo;
  saveUserBindings(bindings);
}

export function resetBinding(actionId: string): void {
  const bindings = loadUserBindings();
  delete bindings[actionId];
  saveUserBindings(bindings);
}

export function resetAllBindings(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function findActionByKey(combo: string): Action | undefined {
  for (const action of registry.values()) {
    if (getEffectiveKey(action.id) === combo) return action;
  }
  return undefined;
}

export function initDispatcher(): void {
  document.addEventListener('keydown', (e) => {
    const combo = normalizeKeyCombo(e);
    if (!combo) return;
    const action = findActionByKey(combo);
    if (!action) return;
    if (action.shouldActivate && !action.shouldActivate(e)) return;
    e.preventDefault();
    action.handler();
  });
}
