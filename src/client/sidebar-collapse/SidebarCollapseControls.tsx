export interface SidebarCollapseCallbacks {
  onCollapse(): void;
  onExpand(): void;
}

/** 侧边栏头部的收起按钮（无状态，显隐由 body.sidebar-collapsed 的 CSS 决定） */
export function SidebarCollapseButton({ onCollapse }: { onCollapse: () => void }) {
  return (
    <button className="sidebar-collapse-btn" id="sidebarCollapseBtn" title="收起侧边栏" aria-label="收起侧边栏" onClick={onCollapse}>
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2.5" width="12" height="11" rx="1.5" fill="none" />
        <path d="M6 2.5v11" />
      </svg>
    </button>
  );
}

/** 收起后显示在左侧边缘的展开按钮 */
export function SidebarFloatingOpenButton({ onExpand }: { onExpand: () => void }) {
  return (
    <button className="sidebar-floating-open-btn" id="sidebarFloatingOpenBtn" title="展开侧边栏" aria-label="展开侧边栏" onClick={onExpand}>
      <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2.5" width="12" height="11" rx="1.5" fill="none" />
        <path d="M6 2.5v11" />
        <path d="M9 6l2 2-2 2" />
      </svg>
    </button>
  );
}
