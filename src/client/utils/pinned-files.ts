import { storageGet, storageSet } from './storage';

const PINNED_KEY = 'md-viewer:pinned-files';

function loadPinned(): Set<string> {
  const arr = storageGet<string[]>(PINNED_KEY, []);
  return Array.isArray(arr) ? new Set(arr) : new Set();
}

function savePinned(pinned: Set<string>): void {
  storageSet(PINNED_KEY, Array.from(pinned));
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
