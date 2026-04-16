import type { AppState, FileInfo, FileData } from './types';
import { loadConfig } from './config';
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

  // 配置
  config: loadConfig(),

  // 工作区模式
  currentWorkspace: null,
  fileTree: new Map(),
  annotationCounts: new Map(),
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

export function saveState(): void {
  try {
    const data = {
      files: Array.from(state.sessionFiles.entries()).map(([path, file]) => [path, {
        path: file.path,
        name: file.name,
        isRemote: file.isRemote || false,
        isMissing: file.isMissing || false,
        lastModified: file.lastModified,
        displayedModified: file.displayedModified,
        lastAccessed: file.lastAccessed || Date.now()
      }]),
      currentFile: state.currentFile
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e: any) {
    // 处理 QuotaExceededError
    if (e.name === 'QuotaExceededError' || e.code === 22) {
      console.warn('localStorage 配额已满，执行清理...');
      cleanupOldFiles();
      // 重试保存
      try {
        const data = {
          files: Array.from(state.sessionFiles.entries()).map(([path, file]) => [path, {
            path: file.path,
            name: file.name,
            isRemote: file.isRemote || false,
            isMissing: file.isMissing || false,
            lastModified: file.lastModified,
            displayedModified: file.displayedModified,
            lastAccessed: file.lastAccessed || Date.now()
          }]),
          currentFile: state.currentFile
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (retryError) {
        console.error('保存状态失败（重试后）:', retryError);
      }
    } else {
      console.error('保存状态失败:', e);
    }
  }
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
  const filesToRemove = sortedFiles.slice(MAX_FILES);

  // 清理旧文件
  state.sessionFiles.clear();
  filesToKeep.forEach(([path, file]) => {
    state.sessionFiles.set(path, file);
  });

  console.log(`已清理 ${filesToRemove.length} 个旧文件`);
}

export async function restoreState(loadFile: (path: string, silent: boolean) => Promise<FileData | null>): Promise<void> {
  try {
    restoreWorkspaceAuxiliaryState();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    if (!data.files || data.files.length === 0) return;

    // 恢复文件列表（重新加载内容）
    const validFiles: Array<[string, any]> = [];
    for (const [path, fileInfo] of data.files) {
      const fileData = await loadFile(path, true); // 静默加载，不弹窗
      if (fileData) {
        // content is loaded fresh from disk (fileData.content), so displayedModified
        // must align to fileData.lastModified — we are displaying that version.
        // lastModified takes the max in case an SSE event before reload recorded a
        // newer mtime than the disk value we just read.
        const lastModified = Math.max(fileData.lastModified, fileInfo.lastModified || 0);

        state.sessionFiles.set(path, {
          path: fileData.path,
          name: fileData.filename,
          content: fileData.content,
          lastModified,
          displayedModified: fileData.lastModified,
          isRemote: fileData.isRemote || false,
          isMissing: false,  // 恢复时文件存在，清除 isMissing
          lastAccessed: fileInfo.lastAccessed || fileData.lastModified,
        });
        validFiles.push([path, fileInfo]);
      }
    }

    // 清理不存在的文件：用实际存在的文件覆盖 localStorage
    if (validFiles.length !== data.files.length) {
      const currentFile = state.sessionFiles.has(data.currentFile)
        ? data.currentFile
        : null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        files: validFiles,
        currentFile
      }));
    }

    // 恢复当前文件
    if (data.currentFile && state.sessionFiles.has(data.currentFile)) {
      state.currentFile = data.currentFile;
    } else {
      // 如果保存的当前文件不存在了，切换到第一个文件
      const firstFile = Array.from(state.sessionFiles.values())[0];
      state.currentFile = firstFile ? firstFile.path : null;
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
    isRemote: fileData.isRemote || false,
    isMissing: false,
    lastAccessed: Date.now(),
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
  }

  saveState();
}

export function removeFile(path: string): void {
  const allFiles = Array.from(state.sessionFiles.keys());
  const idx = allFiles.indexOf(path);
  state.sessionFiles.delete(path);
  clearListDiff(path);
  clearWorkspacePathMissing(path);
  if (state.currentFile === path) {
    // 切换到被关闭文件左边（前一个）的文件，若无则取右边第一个
    const remainingFiles = Array.from(state.sessionFiles.values());
    state.currentFile = remainingFiles.length > 0 ? remainingFiles[Math.max(0, idx - 1)].path : null;
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

export function setSearchQuery(query: string): void {
  state.searchQuery = query;
}

export function setAnnotationCounts(counts: Map<string, number>): void {
  state.annotationCounts = counts;
}

export function adjustAnnotationCount(path: string, delta: number): void {
  const current = state.annotationCounts.get(path) ?? 0;
  const next = current + delta;
  if (next <= 0) {
    state.annotationCounts.delete(path);
  } else {
    state.annotationCounts.set(path, next);
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

export function getFilteredFiles(): FileInfo[] {
  const query = state.searchQuery.toLowerCase().trim();
  if (!query) {
    return Array.from(state.sessionFiles.values());
  }

  return Array.from(state.sessionFiles.values()).filter(file => {
    return file.name.toLowerCase().includes(query) ||
           file.path.toLowerCase().includes(query);
  });
}
