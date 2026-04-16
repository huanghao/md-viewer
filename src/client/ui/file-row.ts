import { state, getSessionFile } from '../state';
import { hasListDiff, hasWorkspaceModified, isWorkspacePathMissing } from '../workspace-state';
import { getFileListStatus } from '../utils/file-status';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { formatRelativeTime } from '../utils/format';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { isPinned } from '../utils/pinned-files';

export interface FileRowOptions {
  /** 外层 div 的 class（各视图不同，如 'tree-item file-node' 或 'file-item'） */
  containerClass: string;
  /** 点击文件的 onclick JS 字符串，接收 path 返回完整 onclick 属性值 */
  onClickJs: (path: string) => string;
  /** 是否显示 pin 按钮（全量树/焦点：true；列表：false） */
  showPin: boolean;
  /** 是否显示相对修改时间（焦点：true；其余：false） */
  showTime: boolean;
  /** 左侧缩进宽度 px */
  indentPx: number;
  /** 搜索关键词，用于文件名高亮（空字符串表示不高亮） */
  query: string;
  /** 是否显示关闭按钮（列表：true；其余：false） */
  showClose: boolean;
  /** 关闭按钮的 onclick JS 字符串（仅 showClose=true 时使用） */
  onCloseJs?: (path: string) => string;
}

function highlightQuery(text: string, query: string): string {
  if (!query) return escapeHtml(text);
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  return (
    escapeHtml(text.slice(0, idx)) +
    `<mark class="search-highlight">${escapeHtml(text.slice(idx, idx + query.length))}</mark>` +
    escapeHtml(text.slice(idx + query.length))
  );
}

export function renderFileRow(
  path: string,
  name: string,
  lastModified: number | undefined,
  opts: FileRowOptions,
): string {
  const isCurrent = state.currentFile === path;
  const openedFile = getSessionFile(path);
  const listDiff = hasListDiff(path);
  const isMissing = !!openedFile?.isMissing || isWorkspacePathMissing(path);
  const wsModified = hasWorkspaceModified(path);

  // 状态 badge（优先级：D > M > 蓝点）
  let statusBadge = '&nbsp;';
  if (openedFile) {
    const status = getFileListStatus(openedFile, listDiff);
    if (status.badge === 'dot') {
      statusBadge = '<span class="new-dot"></span>';
    } else if (status.badge) {
      statusBadge = `<span class="status-badge status-${status.type}" style="color: ${status.color}">${status.badge}</span>`;
    }
  } else if (isMissing) {
    statusBadge = '<span class="status-badge status-deleted" style="color: #ff3b30">D</span>';
  } else if (wsModified) {
    statusBadge = '<span class="status-badge status-modified" style="color: #ff9500">M</span>';
  } else if (listDiff) {
    statusBadge = '<span class="new-dot"></span>';
  }

  // 文件名：strip 扩展名 + 搜索高亮
  const displayName = stripWorkspaceTreeDisplayExtension(name) || name;
  const highlightedName = highlightQuery(displayName, opts.query);

  // 批注计数 badge
  const annotationCount = state.annotationCounts.get(path) ?? 0;
  const annotationBadge = annotationCount > 0
    ? `<span class="annotation-count-badge">${annotationCount}</span>`
    : '';

  // 相对修改时间（仅焦点视图）
  const timeStr = opts.showTime && lastModified
    ? `<span class="focus-file-time">${escapeHtml(formatRelativeTime(lastModified))}</span>`
    : '';

  // Pin 按钮
  let pinBtn = '';
  if (opts.showPin) {
    const pinned = isPinned(path);
    pinBtn = `<button
      class="tree-pin-btn${pinned ? ' active' : ''}"
      title="${pinned ? '取消固定到焦点视图' : '固定到焦点视图'}"
      onclick="event.stopPropagation();${pinned ? `handleUnpinFile` : `handlePinFile`}('${escapeAttr(path)}')"
    >📌</button>`;
  }

  // 关闭按钮（仅列表视图）
  const closeBtn = opts.showClose && opts.onCloseJs
    ? `<span class="close" onclick="event.stopPropagation();${opts.onCloseJs(path)}">×</span>`
    : '';

  // 外层 class
  const classes = [
    opts.containerClass,
    isMissing ? 'missing' : '',
    isCurrent ? 'current' : '',
  ].filter(Boolean).join(' ');

  const typeIcon = getFileTypeIcon(path);

  return `
    <div class="${classes}" onclick="${opts.onClickJs(path)}">
      <span class="tree-indent" style="width: ${opts.indentPx}px"></span>
      <span class="tree-toggle"></span>
      <span class="file-type-icon ${typeIcon.cls}">${escapeHtml(typeIcon.label)}</span>
      <span class="tree-status-inline">${statusBadge}</span>
      <span class="tree-name" title="${escapeAttr(name)}"><span class="tree-name-full">${highlightedName}</span></span>
      ${annotationBadge}
      ${timeStr}
      ${pinBtn}
      ${closeBtn}
    </div>
  `;
}
