import type { FileListRow } from './store';
import type { FileRowStatus } from '../utils/file-row-status';

export interface FileRowProps {
  row: FileListRow;
  /** 外层 class：列表为 file-item，工作区树为 tree-item file-node */
  containerClass: string;
  /** data-action：点击行时由外层委托处理 */
  clickAction: string;
  indentPx: number;
  /** 是否显示关闭按钮（列表显示，工作区树不显示） */
  showClose: boolean;
  /** 已格式化的相对时间（仅 focus 视图） */
  timeText?: string;
}

function StatusMark({ status }: { status: FileRowStatus }) {
  if (status.kind === 'dot') return <span className="new-dot" />;
  if (status.kind === 'badge') {
    return <span className={`status-badge ${status.cls}`} style={{ color: status.color }}>{status.text}</span>;
  }
  return <>{' '}</>;
}

/** 与原 renderFileRow 的 DOM 结构和 class 保持一致，点击与关闭仍由外层的 data-action 委托处理 */
export function FileRow({ row, containerClass, clickAction, indentPx, showClose, timeText }: FileRowProps) {
  const classes = [containerClass, row.isMissing && 'missing', row.isCurrent && 'current'].filter(Boolean).join(' ');
  return (
    <div className={classes} data-path={row.path} data-action={clickAction}>
      <span className="tree-indent" style={{ width: indentPx }} />
      <span className="tree-toggle" />
      <span className={`file-type-icon ${row.typeIcon.cls}`}>{row.typeIcon.label}</span>
      <span className="tree-status-inline"><StatusMark status={row.status} /></span>
      <span className="tree-name" title={row.title}>
        <span className="tree-name-full">
          {/* nameHtml 由 fuzzyMatch 生成，文本已转义 */}
          <span dangerouslySetInnerHTML={{ __html: row.nameHtml }} />
          {row.nameHint && <span className="name-hint">{row.nameHint}</span>}
        </span>
      </span>
      {row.annotationCount > 0 && <span className="annotation-count-badge">{row.annotationCount}</span>}
      {timeText && <span className="focus-file-time">{timeText}</span>}
      <button
        type="button"
        className={`tree-pin-btn${row.pinned ? ' active' : ''}`}
        title={row.pinned ? '取消固定' : '固定到最近视图'}
        data-action={row.pinned ? 'unpin-file' : 'pin-file'}
        data-path={row.path}
      >
        📌
      </button>
      {showClose && <span className="close" data-action="remove-file" data-path={row.path}>×</span>}
    </div>
  );
}
