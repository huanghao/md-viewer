export function storageGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw !== null ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T, onQuota?: () => void): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      if (onQuota) {
        onQuota();
        try {
          localStorage.setItem(key, JSON.stringify(value));
        } catch (retryError: any) {
          console.error(`[storage] 保存 ${key} 失败（重试后）:`, retryError?.message ?? retryError);
        }
      }
    } else {
      console.error(`[storage] 保存 ${key} 失败:`, e?.message ?? e);
    }
  }
}

export function storageGetNumber(key: string, fallback: number): number {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    const n = Number(JSON.parse(raw));
    return Number.isFinite(n) ? n : fallback;
  } catch {
    const n = Number(raw);
    return Number.isFinite(n) ? n : fallback;
  }
}

export function getAllStorageKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) keys.push(key);
  }
  return keys;
}

export function storageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore errors
  }
}
