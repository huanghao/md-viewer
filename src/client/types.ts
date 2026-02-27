// 文件信息类型
export interface FileInfo {
  path: string;
  name: string;
  content: string;
  lastModified: number;
  displayedModified: number;  // 展示内容对应的修改时间
  isRemote: boolean;
  displayName?: string;
  isNew?: boolean;            // 标识是否为新文件（未读）
  isMissing?: boolean;        // 标识文件是否不存在

  // 同步相关
  syncedDocId?: string;       // 学城文档 ID
  syncedUrl?: string;         // 学城文档 URL
  syncedAt?: number;          // 同步时间
}

// 应用状态类型
export interface AppState {
  files: Map<string, FileInfo>;
  currentFile: string | null;
  searchQuery: string;
}

// API 响应类型
export interface FileData {
  path: string;
  filename: string;
  content: string;
  lastModified: number;
  isRemote?: boolean;
  error?: string;
}

export interface FilesResponse {
  files: Array<{ path: string; name: string }>;
}

export interface NearbyResponse {
  files: Array<{ path: string; name: string }>;
}

export interface SyncParent {
  id: string;
  title: string;
  lastUsed: number;
}

export interface RecentParentsData {
  parents: SyncParent[];
  defaultParentId: string | null;
}

export interface SyncResult {
  success: boolean;
  docId?: string;
  url?: string;
  error?: string;
  command?: string;
  output?: string;
}

export interface SyncStatusData {
  path: string;
  docId?: string;
  url?: string;
  lastSyncTime?: number;
  command?: string;
}
