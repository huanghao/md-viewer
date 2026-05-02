// Clipboard copy utilities with visual feedback
import { state } from '../state';
import { showError } from '../ui/toast';

export function resolveCopyFeedbackTarget(e?: Event): HTMLElement | null {
  if (!e?.target) return null;
  return (e.target as HTMLElement).closest('.copy-filename-button, .sync-dialog-copy-btn, .sync-dialog-btn') as HTMLElement | null;
}

export function applyCopyFeedback(target: HTMLElement | null, successMsg?: string): void {
  if (!target) return;

  if (target.classList.contains('copy-filename-button')) {
    target.classList.add('success');
    const tooltip = target.querySelector('.copy-tooltip');
    const originalText = tooltip?.textContent;
    if (tooltip) tooltip.textContent = successMsg || '已复制';
    setTimeout(() => {
      target.classList.remove('success');
      if (tooltip && originalText) tooltip.textContent = originalText;
    }, 1000);
    return;
  }

  const originalText = target.textContent;
  target.textContent = '✓ 已复制';
  setTimeout(() => {
    if (originalText != null) target.textContent = originalText;
  }, 1000);
}

export function copyTextWithFeedback(text: string, e?: Event, successMsg?: string): void {
  navigator.clipboard.writeText(text).then(() => {
    applyCopyFeedback(resolveCopyFeedbackTarget(e), successMsg);
  }).catch(() => {
    showError('复制失败');
  });
}

// 复制单个文本
export function copySingleText(text: string, e?: Event) {
  copyTextWithFeedback(text, e);
}

// 复制文件路径：默认复制相对工作区根目录的相对路径，Alt+Click 复制绝对路径
export function copyFilePath(filePath: string, event?: Event) {
  // 找当前文件所属工作区，计算相对路径
  const workspaces = state.config.workspaces;
  let relPath = filePath;
  for (const ws of workspaces) {
    const root = ws.path.replace(/\/+$/, '');
    if (filePath === root || filePath.startsWith(root + '/')) {
      relPath = filePath.slice(root.length + 1);
      break;
    }
  }
  copyTextWithFeedback(relPath, event, '已复制相对路径');
}

export function copyRelativePath(filePath: string, event?: Event) {
  copyFilePath(filePath, event);
}

export function copyAbsolutePath(filePath: string, event?: Event) {
  copyTextWithFeedback(filePath, event, '已复制绝对路径');
}

// 兼容旧调用
export function copyFileName(fileName: string, event?: Event) {
  copyFilePath(fileName, event);
}
