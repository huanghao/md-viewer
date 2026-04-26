export type SignalType = 'open' | 'annotate' | 'mtime' | 'dwell' | 'scroll';

export function recordSignal(filePath: string, type: SignalType): void {
  fetch('/api/focus-signal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, file: filePath }),
  }).catch(() => {});
}
