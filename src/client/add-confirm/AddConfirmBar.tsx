import { useLayoutEffect, useSyncExternalStore } from 'react';
import { addConfirmStore } from './store';

/** 与原 #quickActionConfirm 的结构和 class 保持一致（事件点击检测与样式依赖这些） */
export function AddConfirmBar() {
  const s = useSyncExternalStore(addConfirmStore.subscribe, addConfirmStore.getState);

  // 确认条打开时给 body 加标记：路径补全面板据此让位
  useLayoutEffect(() => {
    document.body.classList.toggle('quick-action-confirm-visible', s.visible);
  }, [s.visible]);

  return (
    <div
      className={s.visible ? `add-file-confirm state-${s.mode}` : 'add-file-confirm'}
      id="quickActionConfirm"
      style={{ display: s.visible ? 'flex' : 'none' }}
    >
      <div className="add-file-confirm-text" id="quickActionConfirmText">{s.message}</div>
      <div className="add-file-confirm-actions" id="quickActionConfirmActions">
        {s.visible && s.primaryLabel && s.onPrimary && (
          <button type="button" className="add-file-confirm-button primary" onClick={() => void s.onPrimary?.()}>
            {s.primaryLabel}
          </button>
        )}
        {s.visible && s.allowCancel && (
          <button type="button" className="add-file-confirm-button" onClick={() => s.onCancel?.()}>取消</button>
        )}
      </div>
    </div>
  );
}
