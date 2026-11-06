import { state } from '../state';
import { state as annotationState } from '../annotation-state';
import { getFileRowState } from '../utils/file-row-status';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { fuzzyMatch } from '../utils/fuzzy-search';
import { escapeHtml } from '../utils/escape';
import { isPinned } from '../utils/pinned-files';
import type { FileListRow } from './store';

export interface FileListEntry {
  path: string;
  name: string;
  nameHint?: string;
}

/** 把一个打开的文件转成列表行的展示数据（与 renderFileRow 的 file-item 形态对应） */
export function buildFileListRow(entry: FileListEntry, query: string): FileListRow {
  const { isMissing, status } = getFileRowState(entry.path);
  const displayName = stripWorkspaceTreeDisplayExtension(entry.name) || entry.name;
  const summary = state.annotationSummaries.get(entry.path);
  const anchored = summary?.count ?? 0;
  const unanchored = summary?.unanchoredCount ?? 0;

  return {
    path: entry.path,
    name: displayName,
    title: entry.nameHint ? entry.path : entry.name,
    nameHint: entry.nameHint,
    nameHtml: fuzzyMatch(displayName, query)?.highlight ?? escapeHtml(displayName),
    isCurrent: state.currentFile === entry.path,
    isMissing,
    status,
    annotationCount: annotationState.includeUnanchored ? anchored + unanchored : anchored,
    pinned: isPinned(entry.path),
    typeIcon: getFileTypeIcon(entry.path),
  };
}
