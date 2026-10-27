/**
 * 文本输入框的统一按键约定（个人工具）：
 * - Enter / Ctrl+Enter 只换行，Cmd+Enter 才提交，防误触
 * - Emacs 编辑键（见 emacs-keys.ts）
 */
import { initEmacsKeys } from './emacs-keys';

/** 是否为「提交」按键：只认 Cmd+Enter；输入法组词中的 Enter 不算。 */
export function isSubmitKey(e: KeyboardEvent): boolean {
  return e.key === 'Enter' && e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.isComposing;
}

/** textarea 里 Ctrl+Enter 浏览器不会自己插入换行，手动插入。返回 true 表示已处理。 */
export function handleCtrlEnterNewline(e: KeyboardEvent, el: HTMLElement): boolean {
  if (el.tagName !== 'TEXTAREA') return false;
  if (e.key !== 'Enter' || !e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.isComposing) return false;
  if (!document.execCommand?.('insertText', false, '\n')) {
    const ta = el as HTMLTextAreaElement;
    const { selectionStart: s, selectionEnd: end } = ta;
    ta.value = ta.value.slice(0, s) + '\n' + ta.value.slice(end);
    ta.setSelectionRange(s + 1, s + 1);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
  return true;
}

export function initInputKeys(): void {
  initEmacsKeys();
  document.addEventListener('keydown', (e) => {
    if (handleCtrlEnterNewline(e, e.target as HTMLElement)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true });
}
