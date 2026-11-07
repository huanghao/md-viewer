import { useSyncExternalStore } from 'react';
import { diffBannerStore } from './store';

export interface DiffBannerCallbacks {
  onNavigate: (direction: 1 | -1) => void;
  onAccept: () => void;
  onClose: () => void;
  onSwitchMode: () => void;
}

const MODE_LABEL = {
  paragraph: '段落 Diff · 显示变更段落',
  line: '行级 Diff · 完整行变更',
} as const;

/** Diff 横幅：挂在 #diffBannerHost 中（display: contents，布局上位于内容区之前） */
export function DiffBanner({ callbacks }: { callbacks: DiffBannerCallbacks }) {
  const s = useSyncExternalStore(diffBannerStore.subscribe, diffBannerStore.getState);
  if (!s.visible) return null;

  return (
    <div id="diffBanner" className="diff-banner">
      <span className="diff-banner-label">{s.labelOverride ?? MODE_LABEL[s.mode]}</span>
      <button className="diff-nav-btn" id="diffNavPrev" disabled={s.prevDisabled} onClick={() => callbacks.onNavigate(-1)}>↑ 上一处</button>
      <span className="diff-nav-count" id="diffNavCount">{s.count}</span>
      <button className="diff-nav-btn" id="diffNavNext" disabled={s.nextDisabled} onClick={() => callbacks.onNavigate(1)}>↓ 下一处</button>
      <button className="diff-mode-btn" id="diffModeToggle" onClick={() => callbacks.onSwitchMode()}>
        {s.mode === 'paragraph' ? '行级视图' : '段落视图'}
      </button>
      <button className="diff-accept-btn" onClick={() => callbacks.onAccept()}>✓ 采用新版本</button>
      <button className="diff-close-btn" onClick={() => callbacks.onClose()}>✕ 关闭</button>
    </div>
  );
}
