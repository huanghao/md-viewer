import type { AppState, FileInfo, FileData } from './types';

// 全局状态
export const state: AppState = {
  files: new Map(),
  currentFile: null,
};

// 状态持久化
const STORAGE_KEY = 'md-viewer:openFiles';

export function saveState(): void {
  const data = {
    files: Array.from(state.files.entries()).map(([path, file]) => [path, {
      path: file.path,
      name: file.name,
      active: file.active,
      isRemote: file.isRemote || false
    }]),
    currentFile: state.currentFile
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
          active: fileInfo.active,
          lastModified: fileData.lastModified,
          isRemote: fileData.isRemote || false
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
      // 如果保存的当前文件不存在了，切换到第一个活跃文件
      const activeFiles = Array.from(state.files.values()).filter(f => f.active);
      state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
    }
  } catch (e) {
    console.error('恢复状态失败:', e);
  }
}

export function addOrUpdateFile(fileData: FileData, switchTo: boolean = false): void {
  state.files.set(fileData.path, {
    path: fileData.path,
    name: fileData.filename,
    content: fileData.content,
    active: true,
    lastModified: fileData.lastModified,
    isRemote: fileData.isRemote || false
  });

  if (switchTo) {
    state.currentFile = fileData.path;
  }

  saveState();
}

export function removeFile(path: string): void {
  state.files.delete(path);
  if (state.currentFile === path) {
    const activeFiles = Array.from(state.files.values()).filter(f => f.active);
    state.currentFile = activeFiles.length > 0 ? activeFiles[0].path : null;
  }
  saveState();
}

export function setFileInactive(path: string): void {
  const file = state.files.get(path);
  if (file) {
    file.active = false;
    saveState();
  }
}

export function switchToFile(path: string): void {
  state.currentFile = path;
  saveState();
}
