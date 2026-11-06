import { useLayoutEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { buildFocusView, type FocusFilterModel, type FocusGroupModel, type FocusRowModel } from '../ui/workspace-focus';
import { FileRow } from '../file-list/FileRow';
import { buildFileListRow } from '../file-list/model';
import { formatRelativeTimeShort } from '../utils/format';
import { focusViewStore } from './store';

export interface FocusViewDeps {
  /** 每次渲染后调用（用于把当前文件滚动到可见位置） */
  onRendered: (container: HTMLElement) => void;
}

const TYPE_OPTIONS: Array<{ ext: string; label: string }> = [
  { ext: 'md', label: 'MD' },
  { ext: 'pdf', label: 'PDF' },
  { ext: 'html', label: 'HTML' },
  { ext: 'json', label: 'JSON' },
];

const TIME_OPTIONS: Array<{ key: string; label: string }> = [
  { key: '8h', label: '8h' },
  { key: '1d', label: '1d' },
  { key: '2d', label: '2d' },
  { key: '1w', label: '1w' },
];

const STRATEGY_OPTIONS: Array<{ key: string; label: string }> = [
  { key: 'mtime', label: '写（mtime）' },
  { key: 'open', label: '读（最近打开）' },
];

function FilterPopup({ filter }: { filter: FocusFilterModel }) {
  const { activeStrategies, windowKey, activeTypes } = filter;
  return (
    <div className="focus-filter-popup">
      <div className="focus-popup-section">
        <div className="focus-popup-label">排序依据</div>
        <div className="focus-popup-options">
          {STRATEGY_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={`focus-popup-option${activeStrategies.has(o.key) ? ' active' : ''}`}
              data-action="toggle-focus-strategy"
              data-key={o.key}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="focus-popup-divider" />
      <div className="focus-popup-section">
        <div className="focus-popup-label">时间窗口</div>
        <div className="focus-popup-options">
          {TIME_OPTIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              className={`focus-popup-option${windowKey === o.key ? ' active' : ''}`}
              data-action="set-focus-window-key"
              data-key={o.key}
              data-also-toggle-filter="1"
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <div className="focus-popup-divider" />
      <div className="focus-popup-section">
        <div className="focus-popup-label">文件类型</div>
        <div className="focus-popup-options">
          {TYPE_OPTIONS.map((o) => (
            <button
              key={o.ext}
              type="button"
              className={`focus-popup-option${activeTypes.has(o.ext) ? ' active' : ''}`}
              data-action="toggle-focus-type-filter"
              data-key={o.ext}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterBar({ filter }: { filter: FocusFilterModel }) {
  const { activeStrategies, windowKey, activeTypes, popupOpen } = filter;
  return (
    <div className="focus-filter-bar">
      <div className="focus-active-tags">
        {activeStrategies.has('mtime') && <span className="focus-active-tag">写</span>}
        {activeStrategies.has('open') && <span className="focus-active-tag">读</span>}
        <span className="focus-active-sep" />
        <span className="focus-active-tag">{windowKey}</span>
        <span className="focus-active-sep" />
        {TYPE_OPTIONS.filter((o) => activeTypes.has(o.ext)).map((o) => (
          <span key={o.ext} className="focus-active-tag">{o.label}</span>
        ))}
      </div>
      <div className="focus-filter-popup-wrap">
        <button type="button" className={`focus-filter-btn${popupOpen ? ' active' : ''}`} data-action="toggle-filter-popup" title="筛选">
          <svg viewBox="0 0 16 16" fill="currentColor" width="11" height="11">
            <path d="M2 3h12L9.5 8v4.5l-3-1.5V8z" />
          </svg>
        </button>
        {popupOpen && <FilterPopup filter={filter} />}
      </div>
    </div>
  );
}

function FocusFileRow({ row, query }: { row: FocusRowModel; query: string }) {
  const { file, nameHint, displayTime } = row;
  const lastModified = displayTime ?? file.lastModified;
  const model = buildFileListRow({ path: file.path, name: file.name, nameHint }, query);
  return (
    <FileRow
      row={model}
      containerClass="tree-item file-node focus-file-item"
      clickAction="focus-file-click"
      indentPx={0}
      showClose={false}
      timeText={lastModified ? formatRelativeTimeShort(lastModified) : undefined}
    />
  );
}

function FocusGroup({ group, query }: { group: FocusGroupModel; query: string }) {
  const { workspace, collapsed, rows } = group;
  return (
    <div className="focus-ws-group has-files">
      <div className="focus-ws-header" data-action="focus-workspace-toggle" data-workspace-id={workspace.id}>
        <span className={`focus-ws-arrow${!collapsed ? ' open' : ''}`}>▶</span>
        <span className="focus-ws-name">{workspace.name}</span>
        <span className="focus-ws-badge">{rows.length}</span>
      </div>
      {!collapsed && (
        <div className="focus-ws-files">
          {rows.map((row) => <FocusFileRow key={row.file.path} row={row} query={query} />)}
        </div>
      )}
    </div>
  );
}

export function FocusView({ deps }: { deps: FocusViewDeps }) {
  useSyncExternalStore(focusViewStore.subscribe, focusViewStore.getState);
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (rootRef.current) deps.onRendered(rootRef.current);
  });

  const view = buildFocusView();
  let content: ReactNode;
  switch (view.kind) {
    case 'no-workspaces':
      content = <div className="focus-empty">暂无工作区</div>;
      break;
    case 'scanning':
      content = (
        <div className="focus-view">
          <FilterBar filter={view.filter} />
          <div className="focus-empty">正在扫描最近文件…</div>
        </div>
      );
      break;
    case 'empty':
      content = (
        <div className="focus-view">
          <FilterBar filter={view.filter} />
          <div className="focus-empty">暂无最近文件</div>
        </div>
      );
      break;
    case 'ready':
      content = (
        <div className="focus-view">
          <FilterBar filter={view.filter} />
          {view.groups.map((group) => <FocusGroup key={group.workspace.id} group={group} query={view.query} />)}
        </div>
      );
      break;
  }

  return <div ref={rootRef}>{content}</div>;
}
