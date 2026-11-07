import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { syncAnnotationScrollWithContent } from '../annotation-layout';
import { iconSvg } from '../annotation/icons';
import {
  appendReply,
  autoResizeReplyInput,
  commitThreadItemEdit,
  refreshAnnotationList,
  stopThreadItemEdit,
} from '../annotation/thread-manager';
import { isSubmitKey } from '../utils/input-keys';
import { resolvePositionedAnnotationOverlaps } from './layout';
import { annotationListStore, type AnnotationRowModel } from './store';
import type { AnnotationThreadItem } from '../annotation-state';

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
          <SimpleThread row={row} />
        ) : (
          <ThreadLines annotationId={row.id} filePath={filePath} thread={row.thread} editingItemId={editingItemId} />
        )}
      </div>
      {!simple && (
        <div className="annotation-reply-entry" data-reply-entry={row.id} role="button" tabIndex={0}>
          <ReplyInput annotationId={row.id} filePath={filePath} />
        </div>
      )}
    </div>
  );
}

function SimpleThread({ row }: { row: AnnotationRowModel }) {
  return (
    <>
      <div className="annotation-note simple">{row.simpleNote}</div>
      {row.replyCount > 0 && <div className="annotation-reply-count">回复 {row.replyCount}</div>}
    </>
  );
}

interface ThreadLinesProps {
  annotationId: string;
  filePath: string;
  thread: AnnotationThreadItem[];
  editingItemId: string | null;
}

function ThreadLines({ annotationId, filePath, thread, editingItemId }: ThreadLinesProps) {
  if (thread.length === 0) {
    return <div className="annotation-thread-line">（无评论内容）</div>;
  }
  return (
    <>
      {thread.map((item) => {
        const isReply = item.type === 'reply';
        if (item.id === editingItemId) {
          return (
            <div
              key={item.id}
              className={`annotation-thread-line is-editing${isReply ? ' is-reply' : ''}`}
              data-thread-item-id={item.id}
              data-annotation-id={annotationId}
            >
              <ThreadEditInput annotationId={annotationId} itemId={item.id} filePath={filePath} initial={item.note} />
            </div>
          );
        }
        return (
          <div
            key={item.id}
            className={`annotation-thread-line${isReply ? ' is-reply' : ''}`}
            data-thread-item-id={item.id}
            data-annotation-id={annotationId}
          >
            <span className="annotation-thread-text">{item.note}</span>
            <button className="annotation-thread-edit-btn" data-edit-thread-item={item.id} data-annotation-id={annotationId} title="编辑" dangerouslySetInnerHTML={{ __html: iconSvg('edit') }} />
            {isReply && (
              <button className="annotation-thread-edit-btn" data-delete-thread-item={item.id} data-annotation-id={annotationId} title="删除回复" dangerouslySetInnerHTML={{ __html: iconSvg('trash') }} />
            )}
          </div>
        );
      })}
    </>
  );
}

interface ThreadEditInputProps {
  annotationId: string;
  itemId: string;
  filePath: string;
  initial: string;
}

/** 评论条目编辑态：Cmd+Enter 保存，Esc 取消，焦点离开同一卡片时取消 */
function ThreadEditInput({ annotationId, itemId, filePath, initial }: ThreadEditInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const settled = useRef(false);

  useLayoutEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = `${Math.max(textarea.scrollHeight, 34)}px`;
    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);
  }, []);

  const cancel = () => {
    if (settled.current) return;
    settled.current = true;
    stopThreadItemEdit(annotationId, itemId);
  };
  const save = () => {
    if (settled.current) return;
    settled.current = true;
    commitThreadItemEdit(annotationId, itemId, filePath, ref.current?.value ?? '');
  };

  return (
    <textarea
      ref={ref}
      className="annotation-thread-edit-input"
      placeholder="Cmd+Enter 保存，Esc 取消"
      defaultValue={initial}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        } else if (isSubmitKey(e.nativeEvent)) {
          e.preventDefault();
          save();
        }
      }}
      onInput={(e) => {
        const textarea = e.currentTarget;
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(200, Math.max(textarea.scrollHeight, 34))}px`;
      }}
      onBlur={(e) => {
        // 焦点移到同一评论卡片内（如回复输入框）时不取消
        const related = e.relatedTarget as HTMLElement | null;
        const card = e.currentTarget.closest('.annotation-item');
        if (related && card && card.contains(related)) return;
        setTimeout(cancel, 150);
      }}
    />
  );
}

interface ReplyInputProps {
  annotationId: string;
  filePath: string;
}

/** 回复输入框：草稿保存在 store 中，列表重建后保留；Cmd+Enter 提交 */
function ReplyInput({ annotationId, filePath }: ReplyInputProps) {
  const [value, setValue] = useState(() => annotationListStore.getDraft(annotationId));
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (ref.current) autoResizeReplyInput(ref.current);
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      data-reply-input={annotationId}
      placeholder="输入回复内容（Cmd+Enter 提交）"
      value={value}
      onChange={(e) => {
        setValue(e.target.value);
        annotationListStore.setDraft(annotationId, e.target.value);
      }}
      onKeyDown={(e) => {
        if (!isSubmitKey(e.nativeEvent)) return;
        e.preventDefault();
        appendReply(annotationId, filePath, value);
        setValue('');
        annotationListStore.setDraft(annotationId, '');
        refreshAnnotationList(filePath);
      }}
    />
  );
}
