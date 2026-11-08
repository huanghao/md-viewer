import { Fragment, useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from 'react';
import { fuzzySegments } from '../utils/fuzzy-search';
import { parentDirOf, sectionStartsOf } from './logic';
import { quickOpenStore } from './store';
import {
  changeQuickOpenQuery,
  closeQuickOpen,
  moveQuickOpenActive,
  selectQuickOpenItem,
} from './controller';

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  return (
    <>
      {fuzzySegments(text, query).map((seg, i) =>
        seg.match ? <mark key={i} className="search-highlight">{seg.text}</mark> : <span key={i}>{seg.text}</span>,
      )}
    </>
  );
}

export function QuickOpen() {
  const state = useSyncExternalStore(quickOpenStore.subscribe, quickOpenStore.getState);
  const inputRef = useRef<HTMLInputElement>(null);

  // 每次打开时清空并聚焦输入框
  useEffect(() => {
    if (!state.visible) return;
    const input = inputRef.current;
    if (input) {
      input.value = '';
      input.focus();
    }
  }, [state.visible]);

  // 高亮项滚入视野
  useEffect(() => {
    if (!state.visible) return;
    document.querySelector('.quick-open-item.active')?.scrollIntoView({ block: 'nearest' });
  }, [state.activeIndex, state.visible]);

  const sections = sectionStartsOf(state.results);

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeQuickOpen();
      return;
    }
    const isNext = e.key === 'ArrowDown' || (e.key === 'n' && e.ctrlKey);
    const isPrev = e.key === 'ArrowUp' || (e.key === 'p' && e.ctrlKey);
    if (isNext) {
      e.preventDefault();
      moveQuickOpenActive(1);
    } else if (isPrev) {
      e.preventDefault();
      moveQuickOpenActive(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      selectQuickOpenItem(quickOpenStore.getState().activeIndex);
    }
  };

  return (
    <div
      className="quick-open-overlay"
      style={{ display: state.visible ? 'flex' : 'none' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeQuickOpen();
      }}
    >
      <div className="quick-open-panel">
        <div className="quick-open-input-row">
          <span className="quick-open-search-icon">🔍</span>
          <input
            ref={inputRef}
            className="quick-open-input"
            placeholder="搜索文件…"
            autoComplete="off"
            spellCheck={false}
            onInput={(e) => changeQuickOpenQuery((e.target as HTMLInputElement).value)}
            onKeyDown={onKeyDown}
          />
          <span className="quick-open-hint">Esc 关闭</span>
        </div>
        <div className="quick-open-results">
          {state.results.length === 0 ? (
            <div className="quick-open-empty">{state.query.trim() ? '没有匹配的文件' : '暂无已打开的文件'}</div>
          ) : (
            state.results.map((item, i) => (
              <Fragment key={item.path}>
                {sections[i] && <div className="quick-open-section-label">{sections[i]}</div>}
                <div
                  className={`quick-open-item${i === state.activeIndex ? ' active' : ''}`}
                  data-index={i}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectQuickOpenItem(i);
                  }}
                  onMouseOver={() => quickOpenStore.setActive(i)}
                >
                  <span className="quick-open-item-icon">📄</span>
                  <span className="quick-open-item-name">
                    <Highlighted text={item.display} query={state.query} />
                  </span>
                  {item.isOpen && <span className="quick-open-tab-badge">已打开</span>}
                  <span className="quick-open-item-path">{parentDirOf(item.path)}</span>
                </div>
              </Fragment>
            ))
          )}
        </div>
        <div className="quick-open-footer">
          <span className="quick-open-footer-hint"><kbd>↑↓</kbd> 选择</span>
          <span className="quick-open-footer-hint"><kbd>↵</kbd> 打开</span>
          <span className="quick-open-footer-hint"><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    </div>
  );
}
