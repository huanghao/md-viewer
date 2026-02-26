// ==================== 类型定义 ====================

export interface FileInfo {
  path: string;
  name: string;
  content: string;
  lastModified: number;
  isRemote?: boolean;
}

export interface SSEClient {
  controller: ReadableStreamDefaultController<Uint8Array>;
}

export interface FileData {
  content: string;
  error?: string;
  contentType?: string;
}

export interface ContentTypeCheck {
  supported: boolean;
  reason?: string;
}

export interface RemoteCheckResult {
  ok: boolean;
  contentType?: string;
  error?: string;
}
