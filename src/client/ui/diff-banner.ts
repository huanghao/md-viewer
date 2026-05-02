export function buildDiffBannerHTML(): string {
  return `
    <span class="diff-banner-label">Diff 模式 · 显示新版本变更</span>
    <button class="diff-nav-btn" id="diffNavPrev" data-action="diff-prev">↑ 上一处</button>
    <span class="diff-nav-count" id="diffNavCount">- / -</span>
    <button class="diff-nav-btn" id="diffNavNext" data-action="diff-next">↓ 下一处</button>
    <button class="diff-accept-btn" data-action="diff-accept">✓ 采用新版本</button>
    <button class="diff-close-btn" data-action="diff-close">✕ 关闭</button>
  `;
}

export interface DiffBannerCallbacks {
  onNavigate: (direction: 1 | -1) => void;
  onAccept: () => void;
  onClose: () => void;
}

export function initDiffBannerActions(banner: HTMLElement, callbacks: DiffBannerCallbacks): void {
  banner.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'diff-prev') {
      callbacks.onNavigate(-1);
    } else if (action === 'diff-next') {
      callbacks.onNavigate(1);
    } else if (action === 'diff-accept') {
      callbacks.onAccept();
    } else if (action === 'diff-close') {
      callbacks.onClose();
    }
  });
}
