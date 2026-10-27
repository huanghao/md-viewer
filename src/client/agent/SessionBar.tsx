import { useEffect, useRef, useState } from 'react';
import { formatSessionLabel } from './format';
import { useAgentState } from './useAgentState';

export interface SessionBarActions {
  /** 返回 true 表示成功，菜单随之关闭 */
  onNewSession: () => Promise<boolean>;
  onLinkSession: (sessionId: string) => Promise<boolean>;
}

export function SessionBar({ onNewSession, onLinkSession }: SessionBarActions) {
  const sessions = useAgentState((s) => s.sessions);
  const currentId = useAgentState((s) => s.sessionId);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  // 点菜单外任意位置关闭
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [open]);

  const current = sessions.find((s) => s.sessionId === currentId);
  const title = current
    ? formatSessionLabel(current)
    : (currentId ? `当前文档会话 (${currentId.slice(0, 8)})` : 'Recent sessions');

  const run = async (action: () => Promise<boolean>) => {
    if (await action()) setOpen(false);
  };

  return (
    <>
      <div ref={wrap} style={{ display: 'contents' }}>
        <button
          className="agent-toolbar-icon-btn"
          id="agentSessionMenuButton"
          type="button"
          title={`Recent sessions · ${title}`}
          aria-label="Recent sessions"
          onClick={() => setOpen((v) => !v)}
        >◷</button>
        <div className={`agent-toolbar-popover agent-session-popover${open ? '' : ' hidden'}`} id="agentSessionMenu">
          <div className="agent-menu-label">Recent sessions</div>
          <div className="agent-session-list" id="agentSessionList">
            {sessions.length === 0 ? (
              <div className="agent-session-empty">暂无历史会话</div>
            ) : sessions.map((s) => {
              const isCurrent = s.sessionId === currentId;
              return (
                <button
                  key={s.sessionId}
                  className={`agent-session-item${isCurrent ? ' is-current' : ''}`}
                  type="button"
                  data-session-id={s.sessionId}
                  disabled={isCurrent}
                  onClick={() => void run(() => onLinkSession(s.sessionId))}
                >
                  <span className="agent-session-title">{isCurrent ? `当前：${formatSessionLabel(s)}` : formatSessionLabel(s)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <button
        className="agent-toolbar-icon-btn"
        id="agentNewSessionBtn"
        type="button"
        title="New session"
        aria-label="New session"
        onClick={() => void run(onNewSession)}
      >+</button>
    </>
  );
}
