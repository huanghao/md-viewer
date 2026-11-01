export interface ToolbarCallbacks {
  switchAnnotationTab: (tab: string) => void;
  addFile: () => void;
  handleUnifiedInputSubmit: (value?: string) => void;
  dismissQuickActionConfirm: () => void;
  refreshFile: (path: string) => void;
}

export function initToolbarActions(root: HTMLElement | Document, callbacks: ToolbarCallbacks): void {
  root.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement;
    const el = target.closest('[data-action]') as HTMLElement | null;
    if (!el) return;
    const action = el.dataset.action;
    switch (action) {
      case 'switch-annotation-tab': callbacks.switchAnnotationTab(el.dataset.tab ?? ''); break;
      case 'add-file':              callbacks.addFile(); break;
      case 'unified-input-submit':  callbacks.handleUnifiedInputSubmit(); break;
      case 'dismiss-quick-confirm': callbacks.dismissQuickActionConfirm(); break;
    }
  });
}
