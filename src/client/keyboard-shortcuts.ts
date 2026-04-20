export interface KeyboardShortcutDeps {
  dismissAnnotationPopup: () => boolean;
  closeSettings: () => void;
  removeFile: (path: string) => void;
  navigateDiff: (dir: 1 | -1) => void;
  getCurrentFile: () => string | undefined;
  isDiffActive: () => boolean;
}

export function setupKeyboardShortcuts(deps: KeyboardShortcutDeps): void {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (deps.dismissAnnotationPopup()) {
        e.preventDefault();
        return;
      }
      const settingsOverlay = document.getElementById('settingsDialogOverlay');
      if (settingsOverlay?.classList.contains('show')) {
        e.preventDefault();
        deps.closeSettings();
        return;
      }
      const addWorkspaceOverlay = document.getElementById('addWorkspaceDialogOverlay');
      if (addWorkspaceOverlay?.classList.contains('show')) {
        e.preventDefault();
        addWorkspaceOverlay.classList.remove('show');
        return;
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input') return;
      e.preventDefault();
      const input = document.getElementById('searchInput') as HTMLInputElement | null;
      if (input) {
        input.focus();
        input.select();
      }
      return;
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
      e.preventDefault();
      const currentFile = deps.getCurrentFile();
      if (currentFile) {
        deps.removeFile(currentFile);
      }
    }

    if (deps.isDiffActive() && !e.metaKey && !e.ctrlKey && !e.altKey) {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag !== 'input' && tag !== 'textarea') {
        if (e.key === 'n') {
          e.preventDefault();
          deps.navigateDiff(1);
          return;
        }
        if (e.key === 'p') {
          e.preventDefault();
          deps.navigateDiff(-1);
          return;
        }
      }
    }
  });
}
