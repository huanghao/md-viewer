import { useEffect, useRef, useSyncExternalStore, type KeyboardEvent } from 'react';
import { attachPathAutocomplete } from '../ui/path-autocomplete';
import { isSubmitKey } from '../utils/input-keys';
import { looksLikePathInput } from '../utils/path-input';
import { sidebarHeaderStore, type SidebarTab } from './store';

export interface SidebarHeaderDeps {
  /** 搜索词变化（输入、清空、双击 Esc） */
  onQueryChange: (query: string) => void;
  /** Enter / Cmd+Enter 提交：路径添加或全文搜索由调用方决定 */
  onSubmit: (value: string) => void;
  dismissQuickActionConfirm: () => void;
  setSidebarTab: (tab: SidebarTab) => void;
}

const DOUBLE_ESC_MS = 900;

/** 普通 Enter（不含组合键与输入法合成中）：提交搜索或添加路径 */
export function isPlainEnter(e: { key: string; ctrlKey: boolean; metaKey: boolean; isComposing: boolean }): boolean {
  return e.key === 'Enter' && !e.isComposing && !e.ctrlKey && !e.metaKey;
}

/** 900ms 内连按两次 Esc 且搜索词未变：清空搜索 */
export function isDoubleEscape(last: { at: number; value: string }, now: number, value: string): boolean {
  return now - last.at < DOUBLE_ESC_MS && last.value === value && value !== '';
}

const VIEW_TABS: Array<{ key: SidebarTab; label: string }> = [
  { key: 'focus', label: '最近' },
  { key: 'full', label: '工作区' },
  { key: 'list', label: '打开' },
];

function placeholderFor(tab: SidebarTab): string {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  const kKey = isMac ? '⌘K' : 'Ctrl+K';
  if (tab === 'list') return `搜索已打开的文件 (${kKey})`;
  if (tab === 'focus') return `搜索最近文件 (${kKey})`;
  return '搜索或输入路径（Enter补全，Cmd+Enter添加）';
}

export function SearchBox({ deps }: { deps: SidebarHeaderDeps }) {
  const { tab, query } = useSyncExternalStore(sidebarHeaderStore.subscribe, sidebarHeaderStore.getState);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastEscRef = useRef({ at: 0, value: '' });

  // 路径补全只挂一次：输入框在组件生命周期内不会被替换
  useEffect(() => {
    if (!inputRef.current) return;
    attachPathAutocomplete(inputRef.current, {
      kind: 'file',
      markdownOnly: false,
      shouldActivate: looksLikePathInput,
    });
  }, []);

  const submit = () => {
    const input = inputRef.current;
    if (!input) return;
    input.dispatchEvent(new Event('path-autocomplete-hide'));
    deps.onSubmit(input.value);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const native = e.nativeEvent;
    if (isSubmitKey(native)) {
      e.preventDefault();
      submit();
      return;
    }
    // 自动补全面板已消费 Enter/Tab/Escape，不再触发统一提交逻辑
    if (native.defaultPrevented) return;
    if (isPlainEnter(native)) {
      e.preventDefault();
      submit();
      return;
    }
    if (e.key === 'Escape') {
      deps.dismissQuickActionConfirm();
      const now = Date.now();
      const last = lastEscRef.current;
      if (isDoubleEscape(last, now, query)) {
        lastEscRef.current = { at: 0, value: '' };
        e.preventDefault();
        deps.onQueryChange('');
        return;
      }
      lastEscRef.current = { at: now, value: query };
    }
  };

  const handleChange = (value: string) => {
    deps.dismissQuickActionConfirm();
    lastEscRef.current = { at: 0, value: '' };
    deps.onQueryChange(value);
  };

  const clear = () => {
    deps.onQueryChange('');
    inputRef.current?.focus();
  };

  return (
    <div className="search-wrapper">
      <span className="search-icon">🔍</span>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        id="searchInput"
        placeholder={placeholderFor(tab)}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="search-clear"
        id="searchClear"
        style={{ display: query ? 'block' : 'none' }}
        onClick={clear}
      >
        ×
      </button>
    </div>
  );
}

export function ViewTabs({ deps }: { deps: Pick<SidebarHeaderDeps, 'setSidebarTab'> }) {
  const { tab } = useSyncExternalStore(sidebarHeaderStore.subscribe, sidebarHeaderStore.getState);
  return (
    <div className="view-tabs">
      {VIEW_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          className={`view-tab${tab === t.key ? ' active' : ''}`}
          onClick={() => deps.setSidebarTab(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
