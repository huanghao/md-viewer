import type { SyncMeta } from './types';

const SYNC_STATE_KEY = 'md-viewer:syncState';

const syncMetaByPath = new Map<string, SyncMeta>();

function persistSyncState(): void {
  try {
    localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(Array.from(syncMetaByPath.entries())));
  } catch (e) {
    console.error('保存同步状态失败:', e);
  }
}

export function restoreSyncState(): void {
  syncMetaByPath.clear();
  try {
    const raw = localStorage.getItem(SYNC_STATE_KEY);
    if (!raw) return;
    const records = JSON.parse(raw);
    if (!Array.isArray(records)) return;
    for (const item of records) {
      if (!Array.isArray(item) || item.length !== 2) continue;
      const path = item[0];
      const meta = item[1];
      if (typeof path !== 'string' || !meta || typeof meta !== 'object') continue;
      syncMetaByPath.set(path, {
        docId: typeof meta.docId === 'string' ? meta.docId : undefined,
        url: typeof meta.url === 'string' ? meta.url : undefined,
        title: typeof meta.title === 'string' ? meta.title : undefined,
        syncedAt: typeof meta.syncedAt === 'number' ? meta.syncedAt : undefined,
      });
    }
  } catch (e) {
    console.error('恢复同步状态失败:', e);
  }
}

export function getSyncMeta(path: string): SyncMeta | undefined {
  return syncMetaByPath.get(path);
}

export function setSyncMeta(path: string, meta: SyncMeta): void {
  syncMetaByPath.set(path, {
    docId: meta.docId,
    url: meta.url,
    title: meta.title,
    syncedAt: meta.syncedAt,
  });
  persistSyncState();
}

export function clearSyncMeta(path: string): void {
  if (!syncMetaByPath.has(path)) return;
  syncMetaByPath.delete(path);
  persistSyncState();
}
