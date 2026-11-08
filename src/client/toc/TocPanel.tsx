import { useMemo, useSyncExternalStore } from 'react';
import { findActiveIndex, flattenToc } from './logic';
import { tocStore } from './store';

/** 收起目录：移除侧栏展开状态，并通知外部记住偏好（toc:close） */
function closeToc(): void {
  document.querySelector('.sidebar')?.classList.remove('toc-visible');
  document.dispatchEvent(new CustomEvent('toc:close'));
}

/** 目录标题栏 + 列表。标题文字都作为文本渲染，不经过 HTML 解析。 */
export function TocPanel() {
  const s = useSyncExternalStore(tocStore.subscribe, tocStore.getState);
  const flat = useMemo(() => flattenToc(s.items), [s.items]);
  const activeIndex = findActiveIndex(flat, s.active);

  return (
    <>
      {s.headerShown && (
        <div className="toc-header">
          <span className="toc-header-label">目录</span>
          <button className="toc-toggle-btn" title="收起目录" aria-label="收起目录" onClick={closeToc}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 10l4 4 4-4" />
            </svg>
          </button>
        </div>
      )}
      <div className="toc-panel" id="tocPanel">
        {s.status === 'loading' && <div className="toc-empty">加载中…</div>}
        {(s.status === 'idle' || s.status === 'empty') && <div className="toc-empty">无目录</div>}
        {s.status === 'error' && (
          <div className="toc-error">
            目录加载失败
            <br />
            <span className="toc-error-detail">{s.error}</span>
          </div>
        )}
        {s.status === 'ready' &&
          flat.map((item) => (
            <a
              key={item.index}
              className={`toc-item${item.index === activeIndex ? ' active' : ''}`}
              data-level={item.level}
              data-page={item.pageNum ?? ''}
              data-anchor={item.anchor ?? ''}
              title={item.title}
              onClick={() => s.onJump?.(item)}
            >
              <span className="toc-level-badge">#{item.level}</span>
              <span className="toc-item-title">{item.title}</span>
              {item.pageNum ? <span className="toc-page-badge">{item.pageNum}</span> : null}
            </a>
          ))}
      </div>
    </>
  );
}
