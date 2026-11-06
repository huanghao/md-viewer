import { getSessionFile } from '../state';
import { hasListDiff, hasWorkspaceModified, isWorkspacePathMissing } from '../workspace-state';
import { getFileListStatus } from './file-status';

export type FileRowStatus =
  | { kind: 'none' }
  | { kind: 'dot' }
  | { kind: 'badge'; text: string; cls: string; color: string };

export interface FileRowState {
  isMissing: boolean;
  status: FileRowStatus;
}

/** 文件列表行的缺失状态与左侧标记（优先级：已打开文件的状态 > 缺失 > 工作区修改 > 列表差异） */
export function getFileRowState(path: string): FileRowState {
  const openedFile = getSessionFile(path);
  const listDiff = hasListDiff(path);
  const isMissing = !!openedFile?.isMissing || isWorkspacePathMissing(path);

  if (openedFile) {
    const status = getFileListStatus(openedFile, listDiff);
    if (status.badge === 'dot') return { isMissing, status: { kind: 'dot' } };
    if (status.badge) {
      return { isMissing, status: { kind: 'badge', text: status.badge, cls: `status-${status.type}`, color: status.color ?? '' } };
    }
    return { isMissing, status: { kind: 'none' } };
  }
  if (isMissing) return { isMissing, status: { kind: 'badge', text: 'D', cls: 'status-deleted', color: '#ff3b30' } };
  if (hasWorkspaceModified(path)) return { isMissing, status: { kind: 'badge', text: 'M', cls: 'status-modified', color: '#ff9500' } };
  if (listDiff) return { isMissing, status: { kind: 'dot' } };
  return { isMissing, status: { kind: 'none' } };
}
