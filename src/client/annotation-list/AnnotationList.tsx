import { useLayoutEffect, useSyncExternalStore } from 'react';
import { syncAnnotationScrollWithContent } from '../annotation-layout';
import { iconSvg } from '../annotation/icons';
import {
  appendReply,
  commitThreadItemEdit,
  refreshAnnotationList,
  stopThreadItemEdit,
} from '../annotation/thread-manager';
import { resolvePositionedAnnotationOverlaps } from './layout';
import { annotationListStore, type AnnotationRowModel } from './store';
import { ReplyEntry, ThreadLines } from './thread-view';

export interface AnnotationListProps {
  /** 列表容器（#annotationList）：React 根节点；default-mode 类与重叠消解作用于它 */
  container: HTMLElement;
}

/** 评论列表：渲染结构保持与旧版 innerHTML 一致（class / data-* 不变），交互仍由容器上的委托处理 */
export function AnnotationList({ container }: AnnotationListProps) {
  const { view, editing } = useSyncExternalStore(
    annotationListStore.subscribe,
    annotationListStore.getState,
  );

  useLayoutEffect(() => {
    const positioned = view.kind === 'rows' && view.density === 'default';
    if (view.kind === 'rows') container.classList.toggle('default-mode', positioned);
    else container.classList.remove('default-mode');
    if (view.kind === 'rows' && positioned) {
      resolvePositionedAnnotationOverlaps(container, view.contentScrollHeight);
      syncAnnotationScrollWithContent();
    }
  });

  if (view.kind === 'empty') {
    return <div className="annotation-empty">{view.text}</div>;
  }

  const positioned = view.density === 'default';
  const simple = view.density === 'simple';
  const items = view.rows.map((row) => (
    <AnnotationItem
      key={row.id}
      row={row}
      filePath={view.filePath}
      positioned={positioned}
      simple={simple}
      editingItemId={editing?.annotationId === row.id ? editing.itemId : null}
    />
  ));

  if (positioned) {
    return <div className="annotation-canvas" style={{ height: `${view.canvasHeight}px` }}>{items}</div>;
  }
  return <>{items}</>;
}

interface AnnotationItemProps {
  row: AnnotationRowModel;
  filePath: string;
  positioned: boolean;
  simple: boolean;
  editingItemId: string | null;
}

function AnnotationItem({ row, filePath, positioned, simple, editingItemId }: AnnotationItemProps) {
  const className = [
    'annotation-item',
    row.active ? 'is-active' : '',
    `status-${row.track}`,
    row.resolved ? 'is-resolved' : '',
    positioned ? 'positioned' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      data-annotation-id={row.id}
      data-anchor-top={positioned && row.anchorTop !== null ? row.anchorTop : undefined}
      style={positioned && row.anchorTop !== null ? { top: `${row.anchorTop}px` } : undefined}
    >
      <div className="annotation-row-top">
        <div className="annotation-row-title">{row.title}</div>
        <div className="annotation-row-actions">
          <button className="annotation-icon-action" data-action="prev" data-id={row.id} title="上一条" dangerouslySetInnerHTML={{ __html: iconSvg('up') }} />
          <button className="annotation-icon-action" data-action="next" data-id={row.id} title="下一条" dangerouslySetInnerHTML={{ __html: iconSvg('down') }} />
          <button
            className={`annotation-icon-action resolve${row.resolved ? ' is-resolved' : ''}`}
            data-action="resolve"
            data-id={row.id}
            title={row.resolved ? '重新打开' : '标记已解决'}
            dangerouslySetInnerHTML={{ __html: iconSvg(row.resolved ? 'reopen' : 'check') }}
          />
          <button className="annotation-icon-action danger" data-action="delete" data-id={row.id} title="删除" dangerouslySetInnerHTML={{ __html: iconSvg('trash') }} />
        </div>
      </div>
      <div className="annotation-thread">
        {simple ? (
          <>
            <div className="annotation-note simple">{row.simpleNote}</div>
            {row.replyCount > 0 && <div className="annotation-reply-count">回复 {row.replyCount}</div>}
          </>
        ) : (
          <ThreadLines
            annotationId={row.id}
            thread={row.thread}
            editingItemId={editingItemId}
            onCommitEdit={(itemId, text) => {
              annotationListStore.setEditing(null);
              commitThreadItemEdit(row.id, itemId, filePath, text);
            }}
            onCancelEdit={(itemId) => stopThreadItemEdit(row.id, itemId)}
          />
        )}
      </div>
      {!simple && (
        <ReplyEntry
          entryData={{ 'data-reply-entry': row.id }}
          inputData={{ 'data-reply-input': row.id }}
          draft={annotationListStore.getDraft(row.id)}
          onDraftChange={(value) => annotationListStore.setDraft(row.id, value)}
          onSubmit={(text) => {
            appendReply(row.id, filePath, text);
            refreshAnnotationList(filePath);
          }}
        />
      )}
    </div>
  );
}
