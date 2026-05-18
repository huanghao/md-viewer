import type { AppState, FileInfo, FileData } from './types';
import { loadConfig } from './config';
import { storageGet, storageSet } from './utils/storage';
import { recordSignal } from './utils/focus-signals';
import { fuzzyMatch } from './utils/fuzzy-search';
import {
  clearListDiff,
  clearWorkspacePathMissing,
  markListDiff,
  markWorkspacePathMissing,
  restoreWorkspaceAuxiliaryState,
} from './workspace-state';

// 全局状态
export const state: AppState = {
  sessionFiles: new Map(),
  currentFile: null,
  searchQuery: '', // 搜索关键词
  tabOrder: [],

  // 配置
  config: loadConfig(),

  // 工作区模式
  currentWorkspace: null,
  fileTree: new Map(),
  annotationSummaries: new Map(),
  workspaceLoadingIds: new Set(),
  workspaceFailedIds: new Set(),
};

// 状态持久化
const STORAGE_KEY = 'md-viewer:openFiles';
const MAX_FILES = 100; // 最大保存文件数量（LRU 限制）

export function getSessionFile(path: string): FileInfo | undefined {
  return state.sessionFiles.get(path);
}

export function hasSessionFile(path: string): boolean {
  return state.sessionFiles.has(path);
}

export function getSessionFiles(): FileInfo[] {
  return Array.from(state.sessionFiles.values());
}

function buildStateData() {
  return {
    files: Array.from(state.sessionFiles.entries()).map(([path, file]) => [path, {
      path: file.path,
      name: file.name,
      isRemote: file.isRemote || false,
      isMissing: file.isMissing || false,
      lastModified: file.lastModified,
      displayedModified: file.displayedModified,
      createdAt: file.createdAt,
      gitCreatedAt: file.gitCreatedAt,
      lastAccessed: file.lastAccessed || Date.now()
    }]),
    currentFile: state.currentFile,
    tabOrder: state.tabOrder
  };
}

export function saveState(): void {
  storageSet(STORAGE_KEY, buildStateData(), () => {
    console.warn('localStorage 配额已满，执行清理...');
    cleanupOldFiles();
  });
}

/**
 * 清理旧文件（LRU 策略）
 * 当文件数量超过 MAX_FILES 时，移除最少使用的文件
 */
function cleanupOldFiles(): void {
  if (state.sessionFiles.size <= MAX_FILES) return;

  // 按最后访问时间排序
  const sortedFiles = Array.from(state.sessionFiles.entries())
    .sort((a, b) => (b[1].lastAccessed || b[1].lastModified || 0) - (a[1].lastAccessed || a[1].lastModified || 0));

  // 保留最近的 MAX_FILES 个
  const filesToKeep = sortedFiles.slice(0, MAX_FILES);
  const keepPaths = new Set(filesToKeep.map(([path]) => path));

  // 清理旧文件
  state.sessionFiles.clear();
  filesToKeep.forEach(([path, file]) => {
    state.sessionFiles.set(path, file);
  });
  state.tabOrder = state.tabOrder.filter(p => keepPaths.has(p));

  console.log(`已清理 ${sortedFiles.length - MAX_FILES} 个旧文件`);
}

export async function restoreState(loadFile: (path: string, silent: boolean) => Promise<FileData | null>): Promise<void> {
  try {
    restoreWorkspaceAuxiliaryState();

    const data = storageGet<any>(STORAGE_KEY, null);
    if (!data) return;
    if (!data.files || data.files.length === 0) return;

    // 用 localStorage 里的元数据直接占位，不发网络请求
    for (const [path, fileInfo] of data.files) {
      state.sessionFiles.set(path, {
        path: fileInfo.path || path,
        name: fileInfo.name || path.split('/').pop() || path,
        content: '',
        lastModified: fileInfo.lastModified || 0,
        displayedModified: fileInfo.displayedModified || fileInfo.lastModified || 0,
        createdAt: fileInfo.createdAt,
        gitCreatedAt: fileInfo.gitCreatedAt,
        isRemote: fileInfo.isRemote || false,
        isMissing: fileInfo.isMissing || false,
        lastAccessed: fileInfo.lastAccessed || 0,
      });
    }

    // 恢复 tabOrder
    const restoredOrder: string[] = [];
    const seenPaths = new Set<string>();
    if (data.tabOrder && Array.isArray(data.tabOrder)) {
      for (const p of data.tabOrder) {
        if (state.sessionFiles.has(p) && !seenPaths.has(p)) {
          restoredOrder.push(p);
          seenPaths.add(p);
        }
      }
    }
    for (const path of state.sessionFiles.keys()) {
      if (!seenPaths.has(path)) restoredOrder.push(path);
    }
    state.tabOrder = restoredOrder;

    // 确定当前文件
    if (data.currentFile && state.sessionFiles.has(data.currentFile)) {
      state.currentFile = data.currentFile;
    } else {
      state.currentFile = state.tabOrder.length > 0 ? state.tabOrder[0] : null;
    }

    // 只加载当前文件内容
    if (state.currentFile) {
      const fileData = await loadFile(state.currentFile, true);
      if (fileData) {
        const entry = state.sessionFiles.get(state.currentFile)!;
        entry.content = fileData.content;
        entry.lastModified = Math.max(entry.lastModified, fileData.lastModified);
        entry.displayedModified = fileData.lastModified;
        entry.isMissing = false;
      } else {
        // 当前文件已不存在
        state.sessionFiles.get(state.currentFile)!.isMissing = true;
      }
    }
  } catch (e) {
    console.error('恢复状态失败:', e);
  }
}

export function addOrUpdateFile(fileData: FileData, switchTo: boolean = false): void {
  // 检查是否需要清理（超过限制）
  if (state.sessionFiles.size >= MAX_FILES && !state.sessionFiles.has(fileData.path)) {
    cleanupOldFiles();
  }

  const existing = state.sessionFiles.get(fileData.path);
  const isNewPath = !existing;  // 新加入到列表，打列表差异蓝点

  // content is always replaced with fileData.content, so displayedModified must
  // align to fileData.lastModified — the version we are now displaying.
  // A previously dirty flag (lastModified > displayedModified set by SSE) is no
  // longer meaningful once we've loaded fresh content from the server.
  const displayedModified = fileData.lastModified;

  // Don't downgrade lastModified: an SSE "file-changed" event may have already
  // recorded a newer mtime than what the server returns when re-opening the file.
  const lastModified = existing
    ? Math.max(existing.lastModified, fileData.lastModified)
    : fileData.lastModified;

  state.sessionFiles.set(fileData.path, {
    path: fileData.path,
    name: fileData.filename,
    content: fileData.content,
    lastModified,
    displayedModified,
    createdAt: fileData.createdAt ?? existing?.createdAt,
    gitCreatedAt: fileData.gitCreatedAt ?? existing?.gitCreatedAt,
    isRemote: fileData.isRemote || false,
    isMissing: false,
    lastAccessed: Date.now(),
    savedScrollTop: existing?.savedScrollTop,
  });

  if (switchTo) {
    state.currentFile = fileData.path;
    clearListDiff(fileData.path);
  }
  clearWorkspacePathMissing(fileData.path);

  if (isNewPath) {
    if (!switchTo) {
      markListDiff(fileData.path);
    }
    state.tabOrder.push(fileData.path);
  }

  saveState();
}

export function removeFile(path: string): void {
  const idx = state.tabOrder.indexOf(path);
  state.sessionFiles.delete(path);
  state.tabOrder = state.tabOrder.filter(p => p !== path);
  clearListDiff(path);
  clearWorkspacePathMissing(path);
  if (state.currentFile === path) {
    // 切换到被关闭文件左边（前一个）的文件，若无则取右边第一个
    state.currentFile = state.tabOrder.length > 0 ? state.tabOrder[Math.max(0, idx - 1)] : null;
  }
  saveState();
}

export function switchToFile(path: string): void {
  state.currentFile = path;
  const f = state.sessionFiles.get(path);
  if (f) f.lastAccessed = Date.now();
  clearListDiff(path);
  clearWorkspacePathMissing(path);
  saveState();
  recordSignal(path, 'open');
}

export function markFileMissing(path: string, switchTo: boolean = false): void {
  const existing = state.sessionFiles.get(path);
  const now = Date.now();
  const name = path.split('/').pop() || existing?.name || path;

  state.sessionFiles.set(path, {
    path,
    name,
    content: existing?.content || '# 文件已删除\n\n该文件已从磁盘删除，且当前无本地缓存内容。',
    lastModified: existing?.lastModified || now,
    displayedModified: existing?.displayedModified || now,
    isRemote: existing?.isRemote || false,
    isMissing: true,
  });

  if (switchTo) {
    state.currentFile = path;
    clearListDiff(path);
  }
  markWorkspacePathMissing(path);

  saveState();
}

export function moveTabOrder(fromIndex: number, toIndex: number): void {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
  const [path] = state.tabOrder.splice(fromIndex, 1);
  state.tabOrder.splice(toIndex, 0, path);
  saveState();
}

export function setSearchQuery(query: string): void {
  state.searchQuery = query;
}

export function setAnnotationSummaries(summaries: Map<string, { count: number; unanchoredCount: number; updatedAt: number }>): void {
  state.annotationSummaries = summaries;
}

/** @deprecated 使用 setAnnotationSummaries */
export function setAnnotationCounts(counts: Map<string, number>): void {
  state.annotationSummaries = new Map(
    Array.from(counts.entries()).map(([k, v]) => [k, { count: v, unanchoredCount: 0, updatedAt: 0 }])
  );
}

export function adjustAnnotationCount(path: string, delta: number): void {
  const current = state.annotationSummaries.get(path)?.count ?? 0;
  const next = current + delta;
  const unanchoredCount = state.annotationSummaries.get(path)?.unanchoredCount ?? 0;
  if (next <= 0 && unanchoredCount <= 0) {
    state.annotationSummaries.delete(path);
  } else {
    const updatedAt = Date.now();
    state.annotationSummaries.set(path, { count: Math.max(0, next), unanchoredCount, updatedAt });
  }
}

export function adjustUnanchoredCount(path: string, delta: number): void {
  const count = state.annotationSummaries.get(path)?.count ?? 0;
  const current = state.annotationSummaries.get(path)?.unanchoredCount ?? 0;
  const next = current + delta;
  if (count <= 0 && next <= 0) {
    state.annotationSummaries.delete(path);
  } else {
    const updatedAt = Date.now();
    state.annotationSummaries.set(path, { count, unanchoredCount: Math.max(0, next), updatedAt });
  }
}

export function markWorkspaceLoading(id: string): void {
  state.workspaceLoadingIds.add(id);
  state.workspaceFailedIds.delete(id);
}

export function markWorkspaceFailed(id: string): void {
  state.workspaceFailedIds.add(id);
  state.workspaceLoadingIds.delete(id);
}

export function clearWorkspaceFailed(id: string): void {
  state.workspaceFailedIds.delete(id);
  state.workspaceLoadingIds.delete(id);
}

export function isWorkspaceLoading(id: string): boolean {
  return state.workspaceLoadingIds.has(id);
}

export function isWorkspaceFailed(id: string): boolean {
  return state.workspaceFailedIds.has(id);
}

export function saveScrollPosition(path: string, scrollTop: number): void {
  const file = state.sessionFiles.get(path);
  if (!file) return;
  file.savedScrollTop = scrollTop;
}

export function getFilteredFiles(): FileInfo[] {
  const query = state.searchQuery.toLowerCase().trim();
  if (!query) {
    return Array.from(state.sessionFiles.values());
  }

  return Array.from(state.sessionFiles.values()).filter(file => {
    return !!fuzzyMatch(file.name, query) || !!fuzzyMatch(file.path, query);
  });
}
