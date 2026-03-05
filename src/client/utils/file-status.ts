import type { FileInfo } from '../types';

export interface FileListStatus {
  badge: 'M' | 'D' | 'dot' | null;  // M=Modified, D=Deleted, dot=蓝点
  color: string | null;
  type: 'modified' | 'deleted' | 'new' | 'normal';
}

/**
 * 获取文件在列表中的显示状态
 * 优先级：isMissing (D) > isDirty (M) > listDiff (🔵) > 正常
 */
export function getFileListStatus(file: FileInfo, isListDiff: boolean = false): FileListStatus {
  // 优先级 1：文件不存在
  if (file.isMissing) {
    return {
      badge: 'D',
      color: '#ff3b30',  // 红色
      type: 'deleted'
    };
  }

  // 优先级 2：文件已修改（dirty）
  const isDirty = file.lastModified > file.displayedModified;
  if (isDirty) {
    return {
      badge: 'M',
      color: '#ff9500',  // 橙色
      type: 'modified'
    };
  }

  // 优先级 3：列表差异（蓝点）
  if (isListDiff) {
    return {
      badge: 'dot',
      color: '#007AFF',  // 蓝色
      type: 'new'
    };
  }

  // 正常状态
  return {
    badge: null,
    color: null,
    type: 'normal'
  };
}

/**
 * 判断文件是否需要刷新
 */
export function needsRefresh(file: FileInfo): boolean {
  return !file.isMissing && file.lastModified > file.displayedModified;
}
