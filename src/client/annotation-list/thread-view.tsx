import { useLayoutEffect, useRef, useState } from 'react';
import type { AnnotationThreadItem } from '../annotation-state';
import { autoResizeReplyInput } from '../annotation/thread-manager';
import { iconSvg } from '../annotation/icons';
import { isSubmitKey } from '../utils/input-keys';

/**
 * 评论列表与评论浮窗共用的线程视图。
 * 结构（class / data-*）与旧的字符串模板保持一致，点击的编辑/删除按钮仍由容器委托处理。
 */

interface ThreadLinesProps {
  annotationId: string;
  thread: AnnotationThreadItem[];
  editingItemId: string | null;
  onCommitEdit: (itemId: string, text: string) => void;
  onCancelEdit: (itemId: string) => void;
}

export function ThreadLines({ annotationId, thread, editingItemId, onCommitEdit, onCancelEdit }: ThreadLinesProps) {
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
              <ThreadEditInput
                initial={item.note}
                onCommit={(text) => onCommitEdit(item.id, text)}
                onCancel={() => onCancelEdit(item.id)}
              />
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
  initial: string;
  onCommit: (text: string) => void;
  onCancel: () => void;
}

/** 评论条目编辑态：Cmd+Enter 保存，Esc 取消，焦点离开同一卡片时取消 */
function ThreadEditInput({ initial, onCommit, onCancel }: ThreadEditInputProps) {
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
    onCancel();
  };
  const save = () => {
    if (settled.current) return;
    settled.current = true;
    onCommit(ref.current?.value ?? '');
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
        // 焦点移到同一卡片内（如回复输入框）时不取消
        const related = e.relatedTarget as HTMLElement | null;
        const card = e.currentTarget.closest('.annotation-item, .annotation-popover');
        if (related && card && card.contains(related)) return;
        setTimeout(cancel, 150);
      }}
    />
  );
}

interface ReplyEntryProps {
  /** 外层容器的 data-* 属性（委托据此聚焦输入框） */
  entryData: Record<string, string>;
  /** textarea 的 data-* 属性（委托与测试据此定位） */
  inputData: Record<string, string>;
  /** 草稿初值（列表重建后从外部 store 恢复） */
  draft: string;
  onDraftChange: (value: string) => void;
  onSubmit: (text: string) => void;
}

/** 回复输入区：草稿由调用方保存；Cmd+Enter 提交后清空 */
export function ReplyEntry({ entryData, inputData, draft, onDraftChange, onSubmit }: ReplyEntryProps) {
  const [value, setValue] = useState(draft);
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (ref.current) autoResizeReplyInput(ref.current);
  }, [value]);

  return (
    <div className="annotation-reply-entry" role="button" tabIndex={0} {...entryData}>
      <textarea
        ref={ref}
        rows={1}
        placeholder="输入回复内容（Cmd+Enter 提交）"
        {...inputData}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onDraftChange(e.target.value);
        }}
        onKeyDown={(e) => {
          if (!isSubmitKey(e.nativeEvent)) return;
          e.preventDefault();
          const text = value;
          setValue('');
          onDraftChange('');
          onSubmit(text);
        }}
      />
    </div>
  );
}
