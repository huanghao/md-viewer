export function buildDiffBannerHTML(): string {
  return `
    <span class="diff-banner-label">段落 Diff · 显示变更段落</span>
    <button class="diff-nav-btn" id="diffNavPrev" data-action="diff-prev">↑ 上一处</button>
    <span class="diff-nav-count" id="diffNavCount">- / -</span>
    <button class="diff-nav-btn" id="diffNavNext" data-action="diff-next">↓ 下一处</button>
    <button class="diff-mode-btn" id="diffModeToggle" data-action="diff-mode-toggle">行级视图</button>
    <button class="diff-accept-btn" data-action="diff-accept">✓ 采用新版本</button>
    <button class="diff-close-btn" data-action="diff-close">✕ 关闭</button>
  `;
}

export function updateBannerForMode(banner: HTMLElement, mode: 'paragraph' | 'line'): void {
  const label = banner.querySelector<HTMLElement>('.diff-banner-label');
  const toggleBtn = banner.querySelector<HTMLButtonElement>('#diffModeToggle');
  if (label) label.textContent = mode === 'paragraph' ? '段落 Diff · 显示变更段落' : '行级 Diff · 完整行变更';
  if (toggleBtn) toggleBtn.textContent = mode === 'paragraph' ? '行级视图' : '段落视图';
}

export interface DiffBannerCallbacks {
  onNavigate: (direction: 1 | -1) => void;
  onAccept: () => void;
  onClose: () => void;
  onSwitchMode: () => void;
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
    } else if (action === 'diff-mode-toggle') {
      callbacks.onSwitchMode();
    }
  });
}
