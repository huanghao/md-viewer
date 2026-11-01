import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { TabBatchAction } from '../utils/tab-batch';
import { tabsStore } from './store';
import { startTabDrag } from './drag';

export interface TabStripDeps {
  switchFile: (path: string) => void;
  removeFile: (path: string) => void;
  batch: (action: TabBatchAction) => void;
  /** 拖拽松开：from 与 insertIdx 为标签下标 */
  reorder: (fromIdx: number, insertIdx: number) => void;
  /** 标签栏高度可能变化，调用方据此重新定位侧边栏 */
  onLayout: () => void;
}

const BATCH_ACTIONS: Array<{ action: TabBatchAction; label: string; key: keyof import('./store').TabBatchCounts; danger?: boolean }> = [
  { action: 'close-others', label: '关闭其他', key: 'others' },
  { action: 'close-right', label: '关闭右侧', key: 'right' },
  { action: 'close-unmodified', label: '关闭未修改', key: 'unmodified' },
  { action: 'close-all', label: '关闭全部', key: 'all', danger: true },
];

/** 文档标签栏：标签切换与关闭、拖拽排序、标签管理下拉（批量关闭）。渲染到静态的 #tabs 容器内。 */
export function TabStrip({ deps }: { deps: TabStripDeps }) {
  const { files, currentPath, batch } = useSyncExternalStore(tabsStore.subscribe, tabsStore.getState);
  const [managerOpen, setManagerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasFiles = files.length > 0;

  // 没有标签时收起管理面板
  useEffect(() => {
    if (!hasFiles) setManagerOpen(false);
  }, [hasFiles]);

  // 管理面板：点击外部关闭
  useEffect(() => {
    if (!managerOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement | null)?.closest('.tab-manager-wrap')) return;
      setManagerOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [managerOpen]);

  // 每次内容变化后：把当前标签滚动到可视区域，并同步侧边栏位置
  useLayoutEffect(() => {
    const scrollEl = scrollRef.current;
    const activeTab = scrollEl?.querySelector<HTMLElement>('.tab.active');
    if (scrollEl && activeTab) {
      const tabLeft = activeTab.offsetLeft;
      const tabRight = tabLeft + activeTab.offsetWidth;
      const visibleLeft = scrollEl.scrollLeft;
      const visibleRight = visibleLeft + scrollEl.clientWidth;
      if (tabLeft < visibleLeft) {
        scrollEl.scrollLeft = tabLeft - 8;
      } else if (tabRight > visibleRight) {
        scrollEl.scrollLeft = tabRight - scrollEl.clientWidth + 8;
      }
    }
    deps.onLayout();
  }, [files, currentPath]);

  if (!hasFiles) return null;

  return (
    <>
      <div
        className="tabs-scroll"
        ref={scrollRef}
        onPointerDown={(e) => {
          if (scrollRef.current) startTabDrag(e.nativeEvent, scrollRef.current, files.length, deps.reorder);
        }}
      >
        {files.map((file, index) => (
          <div
            key={file.path}
            className={['tab', file.path === currentPath && 'active', file.isMissing && 'deleted'].filter(Boolean).join(' ')}
            data-index={index}
            data-path={file.path}
            onClick={() => deps.switchFile(file.path)}
          >
            <span className="tab-name">
              {file.name}
              {file.nameHint && <span className="name-hint">{file.nameHint}</span>}
            </span>
            <span
              className="tab-close"
              data-path={file.path}
              onClick={(e) => {
                e.stopPropagation();
                deps.removeFile(file.path);
              }}
            >
              ×
            </span>
          </div>
        ))}
      </div>
      <div className="tab-manager-wrap">
        <button
          className={`tab-manager-toggle${managerOpen ? ' active' : ''}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setManagerOpen((open) => !open);
          }}
        >
          ≡ Tabs ({files.length})
        </button>
        <div className={`tab-manager-panel${managerOpen ? ' show' : ''}`}>
          <div className="tab-manager-row tab-manager-actions-row">
            {BATCH_ACTIONS.map((a) => (
              <button
                key={a.action}
                className={`tab-manager-action${a.danger ? ' danger' : ''}`}
                type="button"
                onClick={() => deps.batch(a.action)}
              >
                {a.label} ({batch[a.key]})
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
