import type { RecentParentsData, SyncResult, SyncStatusData } from '../types';

// 获取同步状态
export async function getSyncStatus(path: string): Promise<SyncStatusData> {
  const response = await fetch(`/api/sync/status?path=${encodeURIComponent(path)}`);
  return response.json();
}

// 获取最近使用的父位置
export async function getRecentParents(): Promise<RecentParentsData> {
  const response = await fetch('/api/sync/recent-parents');
  return response.json();
}

// 执行同步
export async function executeSync(
  path: string,
  title: string,
  parentId: string,
  isUpdate: boolean = false
): Promise<SyncResult> {
  const response = await fetch('/api/sync/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      path,
      title,
      parentId,
      isUpdate
    })
  });
  return response.json();
}
