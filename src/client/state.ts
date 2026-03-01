import type { AppState, FileInfo, FileData } from './types';
import { loadConfig } from './config';

// 全局状态
export const state: AppState = {
  files: new Map(),
  currentFile: null,
  searchQuery: '', // 搜索关键词

  // 配置
  config: loadConfig(),

  // 工作区模式
  currentWorkspace: null,
  fileTree: new Map(),
};

// 状态持久化
const STORAGE_KEY = 'md-viewer:openFiles';
const LIST_DIFF_KEY = 'md-viewer:listDiffPaths';
const WORKSPACE_KNOWN_KEY = 'md-viewer:workspaceKnownFiles';
const MAX_FILES = 100; // 最大保存文件数量（LRU 限制）
const listDiffPaths = new Set<string>();
const workspaceKnownFiles = new Map<string, Set<string>>();

function saveAuxiliaryState(): void {
  try {
    localStorage.setItem(LIST_DIFF_KEY, JSON.stringify(Array.from(listDiffPaths)));
    localStorage.setItem(
      WORKSPACE_KNOWN_KEY,
      JSON.stringify(
        Array.from(workspaceKnownFiles.entries()).map(([workspaceId, paths]) => [workspaceId, Array.from(paths)])
      )
    );
  } catch (e) {
    console.error('保存列表差异状态失败:', e);
  }
}

function isExternallyOpenedFile(path: string): boolean {
  const lower = path.toLowerCase();
  return lower.endsWith('.html') || lower.endsWith('.htm');
}

function restoreAuxiliaryState(): void {
  listDiffPaths.clear();
  workspaceKnownFiles.clear();

  try {
    const savedDiff = localStorage.getItem(LIST_DIFF_KEY);
    if (savedDiff) {
      const paths = JSON.parse(savedDiff);
      if (Array.isArray(paths)) {
        for (const path of paths) {
          if (typeof path === 'string' && path) {
            listDiffPaths.add(path);
          }
        }
      }
    }

    const savedKnown = localStorage.getItem(WORKSPACE_KNOWN_KEY);
    if (savedKnown) {
      const records = JSON.parse(savedKnown);
      if (Array.isArray(records)) {
        for (const item of records) {
          if (!Array.isArray(item) || item.length !== 2) continue;
          const workspaceId = item[0];
          const paths = item[1];
          if (typeof workspaceId !== 'string' || !Array.isArray(paths)) continue;
          workspaceKnownFiles.set(
            workspaceId,
            new Set(paths.filter((path): path is string => typeof path === 'string' && path.length > 0))
          );
        }
      }
    }
  } catch (e) {
    console.error('恢复列表差异状态失败:', e);
  }
}

export function hasListDiff(path: string): boolean {
  return listDiffPaths.has(path);
}

export function updateWorkspaceListDiff(workspaceId: string, scannedPaths: string[]): void {
  const scannedSet = new Set(scannedPaths);
  const knownSet = workspaceKnownFiles.get(workspaceId);

  // 首次扫描仅建立基线，不触发全量蓝点
  if (!knownSet) {
    workspaceKnownFiles.set(workspaceId, scannedSet);
    saveAuxiliaryState();
    return;
  }

  // 新扫描到的路径标记蓝点
  for (const path of scannedSet) {
    if (!knownSet.has(path)) {
      listDiffPaths.add(path);
    }
  }

  // 从工作区中消失的路径，移除蓝点
  for (const oldPath of knownSet) {
    if (!scannedSet.has(oldPath)) {
      listDiffPaths.delete(oldPath);
    }
  }

  workspaceKnownFiles.set(workspaceId, scannedSet);
  saveAuxiliaryState();
}

export function removeWorkspaceTracking(workspaceId: string): void {
  const knownSet = workspaceKnownFiles.get(workspaceId);
  if (knownSet) {
    for (const path of knownSet) {
      listDiffPaths.delete(path);
    }
  }
  workspaceKnownFiles.delete(workspaceId);
  saveAuxiliaryState();
}

export function saveState(): void {
  try {
    const data = {
      files: Array.from(state.files.entries()).map(([path, file]) => [path, {
        path: file.path,
        name: file.name,
        isRemote: file.isRemote || false,
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
    restoreAuxiliaryState();

    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    if (!data.files || data.files.length === 0) return;

    // 恢复文件列表（重新加载内容）
    const validFiles: Array<[string, any]> = [];
    for (const [path, fileInfo] of data.files) {
      const fileData = await loadFile(path, true); // 静默加载，不弹窗
      if (fileData) {
        // 恢复时：如果磁盘文件的修改时间没变，使用保存的 displayedModified
        // 如果磁盘文件已被修改，保持 dirty 状态
        const savedDisplayedModified = fileInfo.displayedModified || fileData.lastModified;

        state.files.set(path, {
          path: fileData.path,
          name: fileData.filename,
          content: fileData.content,
          lastModified: fileData.lastModified,
          displayedModified: savedDisplayedModified,
          isRemote: fileData.isRemote || false,
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
    if (data.currentFile && state.files.has(data.currentFile) && !isExternallyOpenedFile(data.currentFile)) {
      state.currentFile = data.currentFile;
    } else {
      // 如果当前文件不存在或属于外部打开类型，切换到第一个可内置渲染文件
      const firstFile = Array.from(state.files.values()).find((file) => !isExternallyOpenedFile(file.path))
        || Array.from(state.files.values())[0];
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
  const isNewPath = !existing;  // 新加入到列表，打列表差异蓝点

  state.files.set(fileData.path, {
    path: fileData.path,
    name: fileData.filename,
    content: fileData.content,
    lastModified: fileData.lastModified,
    displayedModified: fileData.lastModified,  // 初始化时两者相同
    isRemote: fileData.isRemote || false,
    isMissing: false,
    // 保留已有的同步状态
    syncedDocId: existing?.syncedDocId,
    syncedUrl: existing?.syncedUrl,
    syncedAt: existing?.syncedAt
  });

  if (switchTo) {
    state.currentFile = fileData.path;
  }

  if (isNewPath) {
    listDiffPaths.add(fileData.path);
    saveAuxiliaryState();
  }

  saveState();
}

export function removeFile(path: string): void {
  state.files.delete(path);
  listDiffPaths.delete(path);
  if (state.currentFile === path) {
    // 切换到剩余文件中的第一个
    const remainingFiles = Array.from(state.files.values());
    state.currentFile = remainingFiles.length > 0 ? remainingFiles[0].path : null;
  }
  saveAuxiliaryState();
  saveState();
}

export function switchToFile(path: string): void {
  state.currentFile = path;
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
