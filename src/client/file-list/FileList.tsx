import { useLayoutEffect, useRef, useSyncExternalStore, type PointerEvent } from 'react';
import { startFileDrag } from './drag';
import { fileListStore, type FileListRow } from './store';
import { FileRow } from './FileRow';

export interface FileListDeps {
  /** 拖拽松开：与标签栏共用同一份排序状态 */
  reorder: (fromIdx: number, insertIdx: number) => void;
  /** 列表渲染后（用于把当前文件滚动到可见位置） */
  onRendered: (container: HTMLElement) => void;
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
        rows.map((row) => (
          <FileRow key={row.path} row={row} containerClass="file-item" clickAction="switch-file" indentPx={0} showClose />
        ))
      )}
    </div>
  );
}
