// 文件信息类型
export interface FileInfo {
  path: string;
  name: string;
  content: string;
  lastModified: number;
  isRemote: boolean;
  displayName?: string;
}

// 应用状态类型
export interface AppState {
  files: Map<string, FileInfo>;
  currentFile: string | null;
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
