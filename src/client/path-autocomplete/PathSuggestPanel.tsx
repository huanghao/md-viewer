import { useSyncExternalStore } from 'react';
import { pathSuggestStore } from './store';

export function PathSuggestPanel() {
  const s = useSyncExternalStore(pathSuggestStore.subscribe, pathSuggestStore.getState);
  return (
    <div
      className="path-autocomplete-panel"
      style={{
        display: s.visible ? 'block' : 'none',
        left: `${s.left}px`,
        top: `${s.top}px`,
        width: `${s.width}px`,
      }}
      onMouseDown={(e) => {
        // 阻止输入框失焦，点击才能生效
        e.preventDefault();
        const target = (e.target as HTMLElement).closest('.path-autocomplete-item') as HTMLElement | null;
        if (!target) return;
        const index = Number(target.dataset.index);
        if (Number.isNaN(index)) return;
        s.onPick?.(index);
      }}
    >
      {s.items.map((item, index) => (
        <div
          key={`${index}:${item.path}`}
          className={index === s.activeIndex ? 'path-autocomplete-item active' : 'path-autocomplete-item'}
          data-index={index}
        >
          <span className="path-autocomplete-icon">{item.type === 'directory' ? '📁' : '📄'}</span>
          <span className="path-autocomplete-text">{item.display}</span>
        </div>
      ))}
    </div>
  );
}
