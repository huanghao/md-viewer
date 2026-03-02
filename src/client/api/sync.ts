import type { RecentParentsData, SyncResult, SyncStatusData, SyncPreferences } from '../types';

// 获取同步状态
export async function getSyncStatus(path: string): Promise<SyncStatusData> {
  const response = await fetch(`/api/sync/status?path=${encodeURIComponent(path)}`);
  const data = await response.json();
  return {
    ...data,
    path,
    docId: data?.docId || data?.kmDocId,
    url: data?.url || data?.kmUrl,
    title: data?.title || data?.kmTitle,
    baseTitle: data?.baseTitle,
    version: typeof data?.version === 'number' ? data.version : undefined,
    history: Array.isArray(data?.history) ? data.history : [],
  };
}

// 获取最近使用的父位置
export async function getRecentParents(): Promise<RecentParentsData> {
  const response = await fetch('/api/sync/recent-parents');
  return response.json();
}

export async function getSyncParentMeta(value: string): Promise<{ success: boolean; parentId?: string; title?: string; url?: string; error?: string }> {
  const response = await fetch(`/api/sync/parent-meta?value=${encodeURIComponent(value)}`);
  return response.json();
}

// 执行同步
export async function executeSync(
  path: string,
  title: string,
  parentId: string
): Promise<SyncResult> {
  const response = await fetch('/api/sync/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filePath: path,
      title,
      parentId
    })
  });
  const data = await response.json();
  return {
    ...data,
    docId: data?.docId || data?.kmDocId,
    url: data?.url || data?.kmUrl,
    title: data?.title || data?.kmTitle,
  };
}

// 获取同步偏好设置
export async function getSyncPreferences(): Promise<SyncPreferences> {
  const response = await fetch('/api/sync/preferences');
  return response.json();
}

// 保存同步偏好
export async function saveSyncPreference(key: string, value: any): Promise<void> {
  await fetch('/api/sync/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ [key]: value })
  });
}
