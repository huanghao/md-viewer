// 文件信息类型
export interface FileInfo {
  path: string;
  name: string;
  content: string;
  lastModified: number;
  displayedModified: number;  // 展示内容对应的修改时间
  isRemote: boolean;
  displayName?: string;
  isMissing?: boolean;        // 标识文件是否不存在
  pendingContent?: string;    // 磁盘最新内容（diff 视图使用，内存缓存）
  lastAccessed?: number;      // 最后访问时间（用于 LRU 排序）
}

// 工作区类型
export interface Workspace {
  id: string;
  name: string;
  path: string;
  isExpanded: boolean;
}

// 文件树节点类型
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  isExpanded?: boolean;
  fileCount?: number;  // 目录下的 md/html 文件数
  lastModified?: number; // 文件最后修改时间（仅 file 节点）
}

// 应用配置类型
export interface AppConfig {
  sidebarTab: 'focus' | 'full' | 'list';  // replaces sidebarMode + sidebarView
  focusWindowKey: '8h' | '2d' | '1w' | '1m';  // replaces focusWindowHours
  workspaces: Workspace[];
}

// 应用状态类型
export interface AppState {
  // 会话级文件缓存（用于 tabs/正文缓存/同步上下文），不等同于“工作区全量文件状态”
  sessionFiles: Map<string, FileInfo>;
  currentFile: string | null;
  searchQuery: string;

  // 配置
  config: AppConfig;

  // 工作区模式相关
  currentWorkspace: string | null;  // 当前工作区 ID
  fileTree: Map<string, FileTreeNode>;  // 工作区文件树缓存
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
  roots?: string[];
  query?: string;
}

export interface NearbyResponse {
  files: Array<{ path: string; name: string }>;
}

export interface PathSuggestion {
  path: string;
  display: string;
  type: 'file' | 'directory';
}

export interface PathSuggestionsResponse {
  baseDir: string;
  suggestions: PathSuggestion[];
  error?: string;
}

export type PathKind = 'md_file' | 'html_file' | 'other_file' | 'directory' | 'not_found' | 'invalid';

export interface PathDetectResponse {
  kind: PathKind;
  path: string;
  ext?: string | null;
  isUrl?: boolean;
  error?: string;
}

