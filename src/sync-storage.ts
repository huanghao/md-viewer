/**
 * 同步记录存储管理
 * 管理最近使用的位置和文件同步状态
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { homedir } from "os";
import { join } from "path";

const SYNC_RECORDS_PATH = join(
  homedir(),
  ".config",
  "md-viewer",
  "sync-records.json"
);

// 同步记录保留时间（6 个月）
const SYNC_RECORD_MAX_AGE = 6 * 30 * 24 * 60 * 60 * 1000;

export interface RecentParent {
  id: string;
  title: string;
  url: string;
  lastUsed: number;
  useCount: number;
}

export interface SyncedFileInfo {
  kmDocId: string;
  kmUrl: string;
  kmTitle: string;
  parentId: string;
  lastSyncTime: number;
  command?: string; // 执行的命令
}

export interface SyncRecords {
  recentParents: RecentParent[];
  syncedFiles: Record<string, SyncedFileInfo>;
  defaultParentId?: string;
}

/**
 * 读取同步记录
 */
export function loadSyncRecords(): SyncRecords {
  if (!existsSync(SYNC_RECORDS_PATH)) {
    return {
      recentParents: [],
      syncedFiles: {},
    };
  }

  try {
    const content = readFileSync(SYNC_RECORDS_PATH, "utf-8");
    const records = JSON.parse(content);

    // 自动清理过期的同步记录
    cleanupExpiredSyncRecords(records);

    return records;
  } catch (error) {
    console.error("读取同步记录失败:", error);
    return {
      recentParents: [],
      syncedFiles: {},
    };
  }
}

/**
 * 清理过期的同步记录（超过 6 个月）
 */
function cleanupExpiredSyncRecords(records: SyncRecords): void {
  const now = Date.now();
  let cleanedCount = 0;

  // 清理过期的文件同步记录
  for (const [filePath, info] of Object.entries(records.syncedFiles)) {
    if (now - info.lastSyncTime > SYNC_RECORD_MAX_AGE) {
      delete records.syncedFiles[filePath];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    console.log(`已清理 ${cleanedCount} 条过期的同步记录（超过 6 个月）`);
    saveSyncRecords(records);
  }
}

/**
 * 保存同步记录
 */
export function saveSyncRecords(records: SyncRecords): void {
  try {
    const dir = dirname(SYNC_RECORDS_PATH);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(SYNC_RECORDS_PATH, JSON.stringify(records, null, 2), "utf-8");
  } catch (error) {
    console.error("保存同步记录失败:", error);
  }
}

/**
 * 添加或更新最近使用的位置
 */
export function addRecentParent(
  parentId: string,
  title: string,
  url: string
): void {
  const records = loadSyncRecords();

  // 查找是否已存在
  const existingIndex = records.recentParents.findIndex(
    (p) => p.id === parentId
  );

  if (existingIndex >= 0) {
    // 更新已有记录
    records.recentParents[existingIndex].lastUsed = Date.now();
    records.recentParents[existingIndex].useCount++;
  } else {
    // 添加新记录
    records.recentParents.unshift({
      id: parentId,
      title,
      url,
      lastUsed: Date.now(),
      useCount: 1,
    });
  }

  // 按最后使用时间排序
  records.recentParents.sort((a, b) => b.lastUsed - a.lastUsed);

  // 最多保留 10 个
  records.recentParents = records.recentParents.slice(0, 10);

  // 更新默认 parent-id
  records.defaultParentId = parentId;

  saveSyncRecords(records);
}

/**
 * 获取最近使用的位置列表
 */
export function getRecentParents(): RecentParent[] {
  const records = loadSyncRecords();
  return records.recentParents;
}

/**
 * 保存文件同步信息
 */
export function saveSyncedFile(
  filePath: string,
  info: SyncedFileInfo
): void {
  const records = loadSyncRecords();
  records.syncedFiles[filePath] = info;
  saveSyncRecords(records);
}

/**
 * 获取文件同步信息
 */
export function getSyncedFile(filePath: string): SyncedFileInfo | null {
  const records = loadSyncRecords();
  return records.syncedFiles[filePath] || null;
}

/**
 * 删除文件同步信息
 */
export function removeSyncedFile(filePath: string): void {
  const records = loadSyncRecords();
  delete records.syncedFiles[filePath];
  saveSyncRecords(records);
}

/**
 * 获取默认 parent-id
 */
export function getDefaultParentId(): string | undefined {
  const records = loadSyncRecords();
  return records.defaultParentId;
}

/**
 * 手动清理所有过期的同步记录
 * 可通过 CLI 调用
 */
export function cleanupAllExpiredRecords(): number {
  const records = loadSyncRecords();
  const now = Date.now();
  let cleanedCount = 0;

  for (const [filePath, info] of Object.entries(records.syncedFiles)) {
    if (now - info.lastSyncTime > SYNC_RECORD_MAX_AGE) {
      delete records.syncedFiles[filePath];
      cleanedCount++;
    }
  }

  if (cleanedCount > 0) {
    saveSyncRecords(records);
  }

  return cleanedCount;
}

/**
 * 获取同步记录统计信息
 */
export function getSyncRecordsStats(): {
  totalFiles: number;
  expiredFiles: number;
  recentParents: number;
  oldestSync: number | null;
  newestSync: number | null;
} {
  const records = loadSyncRecords();
  const now = Date.now();

  const syncTimes = Object.values(records.syncedFiles).map(f => f.lastSyncTime);
  const expiredCount = Object.values(records.syncedFiles)
    .filter(f => now - f.lastSyncTime > SYNC_RECORD_MAX_AGE)
    .length;

  return {
    totalFiles: Object.keys(records.syncedFiles).length,
    expiredFiles: expiredCount,
    recentParents: records.recentParents.length,
    oldestSync: syncTimes.length > 0 ? Math.min(...syncTimes) : null,
    newestSync: syncTimes.length > 0 ? Math.max(...syncTimes) : null,
  };
}
