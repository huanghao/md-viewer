import { useLayoutEffect, useRef, useSyncExternalStore, type PointerEvent } from 'react';
import { startFileDrag } from './drag';
import { fileListStore, type FileListRow } from './store';
import type { FileRowStatus } from '../utils/file-row-status';

export interface FileListDeps {
  /** 拖拽松开：与标签栏共用同一份排序状态 */
  reorder: (fromIdx: number, insertIdx: number) => void;
  /** 列表渲染后（用于把当前文件滚动到可见位置） */
  onRendered: (container: HTMLElement) => void;
}

function StatusMark({ status }: { status: FileRowStatus }) {
  if (status.kind === 'dot') return <span className="new-dot" />;
  if (status.kind === 'badge') {
    return <span className={`status-badge ${status.cls}`} style={{ color: status.color }}>{status.text}</span>;
  }
  return <>{' '}</>;
}

/** 行的 class、data-* 与 DOM 结构和原 renderFileRow 保持一致，点击与关闭仍由 ui/sidebar 的 data-action 委托处理 */
function FileRow({ row }: { row: FileListRow }) {
  const classes = ['file-item', row.isMissing && 'missing', row.isCurrent && 'current'].filter(Boolean).join(' ');
  return (
    <div className={classes} data-path={row.path} data-action="switch-file">
      <span className="tree-indent" style={{ width: 0 }} />
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
      <button
        type="button"
        className={`tree-pin-btn${row.pinned ? ' active' : ''}`}
        title={row.pinned ? '取消固定' : '固定到最近视图'}
        data-action={row.pinned ? 'unpin-file' : 'pin-file'}
        data-path={row.path}
      >
        📌
      </button>
      <span className="close" data-action="remove-file" data-path={row.path}>×</span>
    </div>
  );
}

export function FileList({ deps }: { deps: FileListDeps }) {
  const { rows, empty } = useSyncExternalStore(fileListStore.subscribe, fileListStore.getState);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (rootRef.current) deps.onRendered(rootRef.current);
  }, [rows, deps]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!rootRef.current) return;
    startFileDrag(e.nativeEvent, rootRef.current, deps.reorder);
  };

  return (
    <div ref={rootRef} onPointerDown={handlePointerDown}>
      {empty ? (
        <div className="empty-tip">{empty}</div>
      ) : (
        rows.map((row) => <FileRow key={row.path} row={row} />)
      )}
    </div>
  );
}
