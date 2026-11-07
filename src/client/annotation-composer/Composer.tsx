import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from 'react';
import { autoResizeComposerInput } from '../annotation/thread-manager';
import { isSubmitKey } from '../utils/input-keys';
import { composerStore, type ComposerKind } from './store';

export interface ComposerCallbacks {
  onSave: () => void;
  onCancel: () => void;
}

const TITLE: Record<ComposerKind, string> = {
  comment: '新评论',
  tray: '记到 Agent 托盘',
};
const PLACEHOLDER: Record<ComposerKind, string> = {
  comment: '输入评论内容（Cmd+Enter 提交）',
  tray: '写下你的疑问/注释…（Cmd+Enter 提交）',
};
const SAVE_TITLE: Record<ComposerKind, string> = {
  comment: '保存',
  tray: '加入托盘',
};

const CLOSE_ICON = '<path d="M4.2 4.2L8 8l3.8-3.8 1 1L9 9l3.8 3.8-1 1L8 10l-3.8 3.8-1-1L7 9 3.2 5.2z"/>';
const CHECK_ICON = '<path d="M6.4 11.2L3.5 8.3l1.1-1.1 1.8 1.8 5-5 1.1 1.1z"/>';

/**
 * 评论输入浮层（kind=comment）与 Agent 托盘输入浮层（kind=tray）。
 * 挂在 #annotationComposer / #agentTrayComposer 内，显隐与位置由外部负责。
 * 草稿放在 store 中，外部读取保存时用 composerStore.getDraft。
 */
export function Composer({ kind, callbacks }: { kind: ComposerKind; callbacks: ComposerCallbacks }) {
  const { drafts, focusToken } = useSyncExternalStore(composerStore.subscribe, composerStore.getState);
  const value = drafts[kind];
  const ref = useRef<HTMLTextAreaElement>(null);
  const isTray = kind === 'tray';

  useEffect(() => {
    if (focusToken[kind] > 0) ref.current?.focus();
  }, [focusToken, kind]);

  useLayoutEffect(() => {
    // 托盘输入框保持单行高度（与旧实现一致），评论输入框随内容增高
    if (!isTray && ref.current) autoResizeComposerInput(ref.current);
  }, [value, isTray]);

  const ids = isTray
    ? { header: 'agentTrayComposerHeader', save: 'agentTrayComposerSaveBtn', cancel: 'agentTrayComposerCancelBtn', textarea: 'agentTrayComposerNote' }
    : { header: 'annotationComposerHeader', save: 'composerSaveBtn', cancel: 'composerCancelBtn', textarea: 'composerNote' };

  return (
    <>
      <div id={ids.header} className="annotation-composer-header">
        <div className="annotation-row-top">
          <div className="annotation-row-title">{TITLE[kind]}</div>
          <div className="annotation-row-actions">
            <button
              id={ids.cancel}
              className="annotation-icon-action"
              title="取消"
              aria-label="取消"
              onClick={(e) => {
                if (isTray) e.stopPropagation();
                callbacks.onCancel();
              }}
              dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 16 16" aria-hidden="true">${CLOSE_ICON}</svg>` }}
            />
            <button
              id={ids.save}
              className="annotation-icon-action resolve"
              title={SAVE_TITLE[kind]}
              aria-label={SAVE_TITLE[kind]}
              onClick={(e) => {
                if (isTray) e.stopPropagation();
                callbacks.onSave();
              }}
              dangerouslySetInnerHTML={{ __html: `<svg viewBox="0 0 16 16" aria-hidden="true">${CHECK_ICON}</svg>` }}
            />
          </div>
        </div>
      </div>
      <div className="annotation-reply-entry annotation-composer-input">
        <textarea
          ref={ref}
          id={ids.textarea}
          rows={1}
          placeholder={PLACEHOLDER[kind]}
          value={value}
          onChange={(e) => composerStore.setDraft(kind, e.target.value)}
          onKeyDown={(e) => {
            if (isTray) {
              e.stopPropagation();
              if (isSubmitKey(e.nativeEvent)) {
                e.preventDefault();
                callbacks.onSave();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                callbacks.onCancel();
              }
              return;
            }
            if (!isSubmitKey(e.nativeEvent)) return;
            e.preventDefault();
            callbacks.onSave();
          }}
        />
      </div>
    </>
  );
}
