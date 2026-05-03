import { state, getSessionFile } from '../state';
import { state as annotationState } from '../annotation-state';
import { hasListDiff, hasWorkspaceModified, isWorkspacePathMissing } from '../workspace-state';
import { getFileListStatus } from '../utils/file-status';
import { getFileTypeIcon } from '../utils/file-type';
import { stripWorkspaceTreeDisplayExtension } from '../utils/workspace-file-name';
import { formatRelativeTimeShort } from '../utils/format';
import { escapeHtml, escapeAttr } from '../utils/escape';
import { isPinned } from '../utils/pinned-files';
import { fuzzyMatch } from '../utils/fuzzy-search';

export interface FileRowOptions {
  /** 外层 div 的 class（各视图不同，如 'tree-item file-node' 或 'file-item'） */
  containerClass: string;
  /**
   * 点击文件的处理方式（二选一）：
   * - onClickAction: data-action 值，由外层容器事件委托处理（推荐）
   * - onClickJs: 兼容旧用法，直接生成 onclick 字符串
   */
  onClickAction?: string;
  /** @deprecated 用 onClickAction 替代 */
  onClickJs?: (path: string) => string;
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
  return fuzzyMatch(text, query)?.highlight ?? escapeHtml(text);
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
  const summary = state.annotationSummaries.get(path);
  const anchoredCount = summary?.count ?? 0;
  const unanchoredCount = summary?.unanchoredCount ?? 0;
  const annotationCount = annotationState.includeUnanchored ? anchoredCount + unanchoredCount : anchoredCount;
  const annotationBadge = annotationCount > 0
    ? `<span class="annotation-count-badge">${annotationCount}</span>`
    : '';

  const chatBadge = '';

  // 相对修改时间（仅焦点视图）
  const timeStr = opts.showTime && lastModified
    ? `<span class="focus-file-time">${escapeHtml(formatRelativeTimeShort(lastModified))}</span>`
    : '';

  // Pin 按钮
  let pinBtn = '';
  if (opts.showPin) {
    const pinned = isPinned(path);
    pinBtn = `<button
      class="tree-pin-btn${pinned ? ' active' : ''}"
      title="${pinned ? '取消固定' : '固定到最近视图'}"
      data-action="${pinned ? 'unpin-file' : 'pin-file'}"
      data-path="${escapeAttr(path)}"
    >📌</button>`;
  }

  // 关闭按钮（仅列表视图）
  let closeBtn = '';
  if (opts.showClose) {
    if (opts.onCloseJs) {
      closeBtn = `<span class="close" onclick="event.stopPropagation();${opts.onCloseJs(path)}">×</span>`;
    } else if (opts.onClickAction) {
      closeBtn = `<span class="close" data-action="remove-file" data-path="${escapeAttr(path)}">×</span>`;
    }
  }

  // 外层 class
  const classes = [
    opts.containerClass,
    isMissing ? 'missing' : '',
    isCurrent ? 'current' : '',
  ].filter(Boolean).join(' ');

  const typeIcon = getFileTypeIcon(path);

  // onclick 属性：优先 onClickJs（旧用法），否则用 data-action
  const clickAttr = opts.onClickJs
    ? `onclick="${opts.onClickJs(path)}"`
    : opts.onClickAction
      ? `data-action="${escapeAttr(opts.onClickAction)}" data-path="${escapeAttr(path)}"`
      : '';

  return `
    <div class="${classes}" data-path="${escapeAttr(path)}" ${clickAttr}>
      <span class="tree-indent" style="width: ${opts.indentPx}px"></span>
      <span class="tree-toggle"></span>
      <span class="file-type-icon ${typeIcon.cls}">${escapeHtml(typeIcon.label)}</span>
      <span class="tree-status-inline">${statusBadge}</span>
      <span class="tree-name" title="${escapeAttr(name)}"><span class="tree-name-full">${highlightedName}</span></span>
      ${annotationBadge}${chatBadge}
      ${timeStr}
      ${pinBtn}
      ${closeBtn}
    </div>
  `;
}
