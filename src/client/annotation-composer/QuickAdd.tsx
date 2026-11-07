import { useSyncExternalStore } from 'react';
import { composerStore } from './store';

export interface QuickAddCallbacks {
  onWriteComment: () => void;
  onAddTray: () => void;
  onPrompt: (text: string) => void;
}

/** 划词后的快捷入口：写评论、加入托盘、快捷评论。挂在 #annotationQuickAddWrap 内，浮层位置由外部计算 */
export function QuickAdd({ callbacks }: { callbacks: QuickAddCallbacks }) {
  const { quickAdd } = useSyncExternalStore(composerStore.subscribe, composerStore.getState);
  const commentVisible = quickAdd.mode === 'comment';
  const trayVisible = quickAdd.mode === 'tray' || quickAdd.trayAvailable;
  const promptsVisible = commentVisible && quickAdd.prompts.length > 0;

  return (
    <>
      <div className="quick-add-section">
        {commentVisible && (
          <button
            id="quickAddComment"
            className="quick-add-btn"
            title="添加评论"
            aria-label="添加评论"
            onClick={(e) => {
              e.stopPropagation();
              callbacks.onWriteComment();
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><rect x="2" y="2.5" width="12" height="11" rx="1.5" /><path d="M5 6h6M5 9h4" /></svg>
            写评论…
          </button>
        )}
        {trayVisible && (
          <button
            id="quickAddTray"
            className="quick-add-btn"
            title="加入 Agent 托盘"
            aria-label="加入 Agent 托盘"
            onClick={(e) => {
              e.stopPropagation();
              callbacks.onAddTray();
            }}
          >
            <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>
            加入 Agent 托盘
          </button>
        )}
      </div>
      {promptsVisible && (
        <div className="quick-add-section" id="quickPromptsSection">
          <div className="quick-add-section-label">快捷评论</div>
          <div id="quickPromptBtns">
            {quickAdd.prompts.map((text, index) => (
              <button
                key={`${index}-${text}`}
                className="quick-add-btn quick-prompt"
                aria-label={text}
                onClick={(e) => {
                  e.stopPropagation();
                  callbacks.onPrompt(text);
                }}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M8 2a6 6 0 110 12A6 6 0 018 2zm0 3v4m0 2.5v.5" /></svg>
                {text}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
