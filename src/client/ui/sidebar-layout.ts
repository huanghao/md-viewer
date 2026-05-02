// Sidebar layout: width, collapse, and resize management
import { storageGet, storageSet, storageGetNumber } from '../utils/storage';
import { createResizer } from '../utils/resizer';

export const SIDEBAR_WIDTH_STORAGE_KEY = 'md-viewer:sidebar-width';
export const SIDEBAR_COLLAPSED_KEY = 'md-viewer:sidebar-collapsed';
export const SIDEBAR_DEFAULT_WIDTH = 260;
export const SIDEBAR_MIN_WIDTH = 220;
export const SIDEBAR_MAX_WIDTH = 680;

export function getMaxSidebarWidth(): number {
  // 给主内容至少保留可读宽度
  return Math.max(SIDEBAR_MIN_WIDTH, Math.min(SIDEBAR_MAX_WIDTH, window.innerWidth - 360));
}

export function clampSidebarWidth(width: number): number {
  return Math.min(getMaxSidebarWidth(), Math.max(SIDEBAR_MIN_WIDTH, Math.round(width)));
}

export function applySidebarWidth(width: number): void {
  const clamped = clampSidebarWidth(width);
  document.documentElement.style.setProperty('--sidebar-width', `${clamped}px`);
}

export function initSidebarWidth(): void {
  const saved = storageGetNumber(SIDEBAR_WIDTH_STORAGE_KEY, SIDEBAR_DEFAULT_WIDTH);
  applySidebarWidth(saved > 0 ? saved : SIDEBAR_DEFAULT_WIDTH);
}

export function setSidebarCollapsed(collapsed: boolean): void {
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  storageSet(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
}

export function initSidebarCollapsed(): void {
  const saved = storageGet<string>(SIDEBAR_COLLAPSED_KEY, '');
  if (saved === '1') setSidebarCollapsed(true);
}

export function setupSidebarCollapse(): void {
  document.getElementById('sidebarCollapseBtn')?.addEventListener('click', () => {
    setSidebarCollapsed(true);
  });
  document.getElementById('sidebarFloatingOpenBtn')?.addEventListener('click', () => {
    setSidebarCollapsed(false);
  });
}

export function setupSidebarResize(): void {
  const resizer = document.getElementById('sidebarResizer');
  if (!resizer) return;

  createResizer({
    element: resizer,
    bodyClass: 'sidebar-resizing',
    guard: () => window.innerWidth > 900,
    onMove: (_delta, clientX) => {
      applySidebarWidth(clampSidebarWidth(clientX));
    },
    onEnd: (_delta, clientX) => {
      const width = clampSidebarWidth(clientX);
      applySidebarWidth(width);
      storageSet(SIDEBAR_WIDTH_STORAGE_KEY, width);
    },
  });

  window.addEventListener('resize', () => {
    const current = Number.parseInt(
      getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width'),
      10
    );
    if (Number.isFinite(current)) {
      applySidebarWidth(current);
    }
  });
}
