import { useSyncExternalStore } from 'react';
import { statusbarStore, type ConnectionStatus } from './store';

function fmt(ts: number): string {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const CONNECTION_TEXT: Record<ConnectionStatus, string> = {
  connected: '已连接',
  connecting: '连接中',
  disconnected: '未连接',
  failed: '未连接',
};

/** 状态栏：文件创建时间、字数、SSE 连接状态。 */
export function StatusBar() {
  const { charCount, createdAt, gitCreatedAt, connection } = useSyncExternalStore(
    statusbarStore.subscribe,
    statusbarStore.getState,
  );
  // 文件系统创建时间与 git 首次提交时间取较早者
  const ts = createdAt && gitCreatedAt ? Math.min(createdAt, gitCreatedAt) : createdAt ?? gitCreatedAt;
  const dotClass = connection === 'failed' ? 'disconnected' : connection;
  return (
    <>
      <div className="sb-spacer" />
      <span className="sb-item" id="sbCreatedAt">{ts ? `创建于 ${fmt(ts)}` : ''}</span>
      <span className="sb-item" id="sbCharCount">{charCount > 0 ? `${charCount.toLocaleString()} 字` : ''}</span>
      {/* 正常态保持安静：只有连接异常时才出现 */}
      {connection !== 'connected' && (
        <span className="sb-item sb-connection" id="sbConnection">
          <span className={`sb-dot ${dotClass}`} id="sbDot" />
          <span id="sbConnectionText">{CONNECTION_TEXT[connection]}</span>
        </span>
      )}
    </>
  );
}
