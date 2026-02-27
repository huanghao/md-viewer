import type { AppState, FileInfo, FileData } from './types';

// 全局状态
export const state: AppState = {
  files: new Map(),
  currentFile: null,
  searchQuery: '', // 搜索关键词
};

// 状态持久化
const STORAGE_KEY = 'md-viewer:openFiles';
const MAX_FILES = 100; // 最大保存文件数量（LRU 限制）

export function saveState(): void {
  try {
    const data = {
      files: Array.from(state.files.entries()).map(([path, file]) => [path, {
        path: file.path,
        name: file.name,
        isRemote: file.isRemote || false,
        isNew: file.isNew || false,
        isMissing: file.isMissing || false,
        displayedModified: file.displayedModified,
        syncedDocId: file.syncedDocId,
        syncedUrl: file.syncedUrl,
        syncedAt: file.syncedAt,
        lastAccessed: Date.now() // 记录最后访问时间用于 LRU
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
          files: Array.from(state.files.entries()).map(([path, file]) => [path, {
            path: file.path,
            name: file.name,
            isRemote: file.isRemote || false,
            isNew: file.isNew || false,
            isMissing: file.isMissing || false,
            displayedModified: file.displayedModified,
            syncedDocId: file.syncedDocId,
            syncedUrl: file.syncedUrl,
            syncedAt: file.syncedAt,
            lastAccessed: Date.now()
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
  if (state.files.size <= MAX_FILES) return;

  // 按最后访问时间排序
  const sortedFiles = Array.from(state.files.entries())
    .sort((a, b) => (b[1].lastModified || 0) - (a[1].lastModified || 0));

  // 保留最近的 MAX_FILES 个
  const filesToKeep = sortedFiles.slice(0, MAX_FILES);
  const filesToRemove = sortedFiles.slice(MAX_FILES);

  // 清理旧文件
  state.files.clear();
  filesToKeep.forEach(([path, file]) => {
    state.files.set(path, file);
  });

  console.log(`已清理 ${filesToRemove.length} 个旧文件`);
}

export async function restoreState(loadFile: (path: string, silent: boolean) => Promise<FileData | null>): Promise<void> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    if (!data.files || data.files.length === 0) return;

    // 恢复文件列表（重新加载内容）
    const validFiles: Array<[string, any]> = [];
    for (const [path, fileInfo] of data.files) {
      const fileData = await loadFile(path, true); // 静默加载，不弹窗
      if (fileData) {
        state.files.set(path, {
          path: fileData.path,
          name: fileData.filename,
          content: fileData.content,
          lastModified: fileData.lastModified,
          displayedModified: fileInfo.displayedModified || fileData.lastModified,
          isRemote: fileData.isRemote || false,
          isNew: fileInfo.isNew || false,
          isMissing: false,  // 恢复时文件存在，清除 isMissing
          syncedDocId: fileInfo.syncedDocId,
          syncedUrl: fileInfo.syncedUrl,
          syncedAt: fileInfo.syncedAt
        });
        validFiles.push([path, fileInfo]);
      }
    }

    // 清理不存在的文件：用实际存在的文件覆盖 localStorage
    if (validFiles.length !== data.files.length) {
      const currentFile = state.files.has(data.currentFile)
        ? data.currentFile
        : null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        files: validFiles,
        currentFile
      }));
    }

    // 恢复当前文件
    if (data.currentFile && state.files.has(data.currentFile)) {
      state.currentFile = data.currentFile;
    } else {
      // 如果保存的当前文件不存在了，切换到第一个文件
      const firstFile = Array.from(state.files.values())[0];
      state.currentFile = firstFile ? firstFile.path : null;
    }
  } catch (e) {
    console.error('恢复状态失败:', e);
  }
}

export function addOrUpdateFile(fileData: FileData, switchTo: boolean = false): void {
  // 检查是否需要清理（超过限制）
  if (state.files.size >= MAX_FILES && !state.files.has(fileData.path)) {
    cleanupOldFiles();
  }

  const existing = state.files.get(fileData.path);
  const isNew = !existing;  // 如果是新添加的文件，标记为 isNew

  state.files.set(fileData.path, {
    path: fileData.path,
    name: fileData.filename,
    content: fileData.content,
    lastModified: fileData.lastModified,
    displayedModified: fileData.lastModified,  // 初始化时两者相同
    isRemote: fileData.isRemote || false,
    isNew: isNew && !switchTo,  // 新文件且不立即切换时标记为未读
    isMissing: false,
    // 保留已有的同步状态
    syncedDocId: existing?.syncedDocId,
    syncedUrl: existing?.syncedUrl,
    syncedAt: existing?.syncedAt
  });

  if (switchTo) {
    state.currentFile = fileData.path;
  }

  saveState();
}

export function removeFile(path: string): void {
  state.files.delete(path);
  if (state.currentFile === path) {
    // 切换到剩余文件中的第一个
    const remainingFiles = Array.from(state.files.values());
    state.currentFile = remainingFiles.length > 0 ? remainingFiles[0].path : null;
  }
  saveState();
}

export function switchToFile(path: string): void {
  state.currentFile = path;

  // 更新最后访问时间（用于 LRU）
  const file = state.files.get(path);
  if (file) {
    file.lastModified = Date.now();
    // 标记为已读
    if (file.isNew) {
      file.isNew = false;
    }
  }

  saveState();
}

export function setSearchQuery(query: string): void {
  state.searchQuery = query;
}

export function getFilteredFiles(): FileInfo[] {
  const query = state.searchQuery.toLowerCase().trim();
  if (!query) {
    return Array.from(state.files.values());
  }

  return Array.from(state.files.values()).filter(file => {
    return file.name.toLowerCase().includes(query) ||
           file.path.toLowerCase().includes(query);
  });
}
