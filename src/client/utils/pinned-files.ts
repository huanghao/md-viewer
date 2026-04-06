const PINNED_KEY = 'md-viewer:pinned-files';

function loadPinned(): Set<string> {
  try {
    const raw = localStorage.getItem(PINNED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr) : new Set();
  } catch {
    return new Set();
  }
}

function savePinned(pinned: Set<string>): void {
  try {
    localStorage.setItem(PINNED_KEY, JSON.stringify(Array.from(pinned)));
  } catch {
    // ignore quota errors — pins are best-effort
  }
}

export function isPinned(filePath: string): boolean {
  return loadPinned().has(filePath);
}

export function pinFile(filePath: string): void {
  const pinned = loadPinned();
  pinned.add(filePath);
  savePinned(pinned);
}

export function unpinFile(filePath: string): void {
  const pinned = loadPinned();
  pinned.delete(filePath);
  savePinned(pinned);
}

export function getPinnedFiles(): Set<string> {
  return loadPinned();
}
