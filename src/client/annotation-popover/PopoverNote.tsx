import { useSyncExternalStore } from 'react';
import { state as annotationState } from '../annotation-state';
import { appendReply, commitThreadItemEdit, getCommentThread, refreshAnnotationList } from '../annotation/thread-manager';
import { ReplyEntry, ThreadLines } from '../annotation-list/thread-view';
import { popoverNoteStore } from './store';

/** 评论浮窗正文：线程与回复输入。每次渲染都从 state 取最新的评论对象（后台保存会替换它） */
export function PopoverNote() {
  const { annotationId, filePath, editingItemId } = useSyncExternalStore(
    popoverNoteStore.subscribe,
    popoverNoteStore.getState,
  );
  const ann = annotationId ? annotationState.annotations.find((item) => item.id === annotationId) : undefined;
  if (!ann) return null;

  return (
    <>
      <div className="annotation-thread">
        <ThreadLines
          annotationId={ann.id}
          thread={getCommentThread(ann)}
          editingItemId={editingItemId}
          onCommitEdit={(itemId, text) => {
            popoverNoteStore.stopEdit(itemId);
            if (filePath) commitThreadItemEdit(ann.id, itemId, filePath, text);
          }}
          onCancelEdit={(itemId) => popoverNoteStore.stopEdit(itemId)}
        />
      </div>
      <ReplyEntry
        key={ann.id}
        entryData={{ 'data-popover-reply-entry': ann.id }}
        inputData={{ 'data-popover-reply-input': ann.id }}
        draft={popoverNoteStore.getDraft(ann.id)}
        onDraftChange={(value) => popoverNoteStore.setDraft(ann.id, value)}
        onSubmit={(text) => {
          if (!filePath) return;
          appendReply(ann.id, filePath, text);
          refreshAnnotationList(filePath);
        }}
      />
    </>
  );
}
