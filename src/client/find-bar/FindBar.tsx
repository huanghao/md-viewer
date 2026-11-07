import { useEffect, useRef, useSyncExternalStore } from 'react';
import { findBarStore } from './store';
import { findKeyAction, formatFindCount } from './logic';

export interface FindBarCallbacks {
  onQuery(query: string): void;
  onNext(): void;
  onPrev(): void;
  onClose(): void;
}

/** 页内查找栏。高亮与滚动由 find-bar.ts 命令式完成，这里只渲染状态并转发动作。 */
export function FindBar({ callbacks }: { callbacks: FindBarCallbacks }) {
  const s = useSyncExternalStore(findBarStore.subscribe, findBarStore.getState);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!s.visible) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [s.visible, s.focusToken]);

  const count = formatFindCount(s.query, s.current, s.total);

  return (
    <div id="findBar" className={s.visible ? 'visible' : undefined}>
      <input
        id="findBarInput"
        ref={inputRef}
        type="text"
        placeholder="查找..."
        autoComplete="off"
        spellCheck={false}
        value={s.query}
        onChange={(e) => callbacks.onQuery(e.target.value)}
        onKeyDown={(e) => {
          const action = findKeyAction(e.key, e.shiftKey);
          if (!action) return;
          e.preventDefault();
          if (action === 'next') callbacks.onNext();
          else if (action === 'prev') callbacks.onPrev();
          else callbacks.onClose();
        }}
      />
      <span id="findBarCount" className={count.noResult ? 'no-result' : undefined}>{count.text}</span>
      <button id="findBarPrev" title="上一个 (⇧⌘G)" onClick={callbacks.onPrev}>&#8593;</button>
      <button id="findBarNext" title="下一个 (⌘G)" onClick={callbacks.onNext}>&#8595;</button>
      <button id="findBarClose" title="关闭 (Esc)" onClick={callbacks.onClose}>&#10005;</button>
    </div>
  );
}
