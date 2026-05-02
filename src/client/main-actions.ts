export interface ToolbarCallbacks {
  handleDiffButtonClick: () => void;
  handleRefreshButtonClick: () => void;
  showSettingsDialog: () => void;
  toggleMonitorPanel: () => void;
  switchMonitorTab: (tab: string) => void;
  switchAnnotationTab: (tab: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setPdfMode: (mode: string) => void;
  handleTranslateButtonClick: () => void;
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
      case 'show-settings':         callbacks.showSettingsDialog(); break;
      case 'diff-button':           callbacks.handleDiffButtonClick(); break;
      case 'refresh-button':        callbacks.handleRefreshButtonClick(); break;
      case 'toggle-monitor':        callbacks.toggleMonitorPanel(); break;
      case 'switch-monitor-tab':    callbacks.switchMonitorTab(el.dataset.tab ?? ''); break;
      case 'zoom-in':               callbacks.zoomIn(); break;
      case 'zoom-out':              callbacks.zoomOut(); break;
      case 'set-pdf-mode':          callbacks.setPdfMode(el.dataset.mode ?? ''); break;
      case 'translate-button':      callbacks.handleTranslateButtonClick(); break;
      case 'switch-annotation-tab': callbacks.switchAnnotationTab(el.dataset.tab ?? ''); break;
      case 'add-file':              callbacks.addFile(); break;
      case 'unified-input-submit':  callbacks.handleUnifiedInputSubmit(); break;
      case 'dismiss-quick-confirm': callbacks.dismissQuickActionConfirm(); break;
    }
  });
}
