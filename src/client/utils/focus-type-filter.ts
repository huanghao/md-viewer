export const DEFAULT_FOCUS_ACTIVE_TYPES = ['md', 'pdf'] as const;

export function normalizeFocusFileType(ext: string): string {
  if (ext === 'markdown') return 'md';
  if (ext === 'htm') return 'html';
  if (ext === 'jsonl') return 'json';
  return ext;
}

export function sanitizeFocusActiveTypes(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_FOCUS_ACTIVE_TYPES];
  const next = Array.from(new Set(value.filter((v): v is string => typeof v === 'string' && v.length > 0)));
  return next.length > 0 ? next : [...DEFAULT_FOCUS_ACTIVE_TYPES];
}

export function sameFocusActiveTypes(a: readonly string[] | undefined, b: readonly string[]): boolean {
  return Array.isArray(a) && a.length === b.length && a.every((v, i) => v === b[i]);
}

export function toggleFocusActiveType(active: Iterable<string>, ext: string): string[] {
  const next = new Set(active);
  if (next.has(ext)) {
    if (next.size > 1) next.delete(ext);
  } else {
    next.add(ext);
  }
  return [...next];
}
