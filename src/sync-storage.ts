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
    return JSON.parse(content);
  } catch (error) {
    console.error("读取同步记录失败:", error);
    return {
      recentParents: [],
      syncedFiles: {},
    };
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
