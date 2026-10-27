/**
 * Emacs/Readline 风格快捷键（所有文本输入框统一生效，由 initEmacsKeys 在 document 上统一接入）。
 *
 * 删除/粘贴一律走 document.execCommand，这样浏览器会把它们记入撤销栈；
 * 直接给 value 赋值会清空撤销历史，Cmd+Z 就撤不回来了。
 */

export type EmacsTarget = HTMLTextAreaElement | HTMLInputElement;

export type EmacsPlan =
  | { type: 'move'; pos: number }
  | { type: 'delete'; from: number; to: number; kill: boolean }
  | { type: 'yank' };

/** 纯计算：按下 Ctrl+key 时该做什么。不碰 DOM，便于单测。 */
export function planEmacsEdit(
  key: string,
  value: string,
  start: number,
  end: number,
  multiline: boolean,
): EmacsPlan | null {
  const lineStart = (pos: number) => {
    const idx = value.lastIndexOf('\n', pos - 1);
    return idx === -1 ? 0 : idx + 1;
  };
  const lineEnd = (pos: number) => {
    const idx = value.indexOf('\n', pos);
    return idx === -1 ? value.length : idx;
  };
  const hasSel = start !== end;

  switch (key) {
    case 'a': return { type: 'move', pos: lineStart(start) };
    case 'e': return { type: 'move', pos: lineEnd(end) };
    case 'b': return { type: 'move', pos: hasSel ? start : Math.max(0, start - 1) };
    case 'f': return { type: 'move', pos: hasSel ? end : Math.min(value.length, end + 1) };
    case 'n': {
      if (!multiline) return null;
      const le = lineEnd(end);
      if (le === value.length) return { type: 'move', pos: le };
      const nextLen = lineEnd(le + 1) - (le + 1);
      return { type: 'move', pos: le + 1 + Math.min(end - lineStart(end), nextLen) };
    }
    case 'p': {
      if (!multiline) return null;
      const ls = lineStart(start);
      if (ls === 0) return { type: 'move', pos: 0 };
      const prevLineStart = lineStart(ls - 1);
      const prevLineLen = (ls - 1) - prevLineStart;
      return { type: 'move', pos: prevLineStart + Math.min(start - ls, prevLineLen) };
    }
    case 'd':
      if (hasSel) return { type: 'delete', from: start, to: end, kill: false };
      return start < value.length ? { type: 'delete', from: start, to: start + 1, kill: false } : { type: 'move', pos: start };
    case 'h':
      if (hasSel) return { type: 'delete', from: start, to: end, kill: false };
      return start > 0 ? { type: 'delete', from: start - 1, to: start, kill: false } : { type: 'move', pos: start };
    case 'k': {
      const le = lineEnd(start);
      // 光标已在行尾：删掉换行符本身
      const to = start === le && le < value.length ? le + 1 : le;
      return { type: 'delete', from: start, to, kill: true };
    }
    case 'u': return { type: 'delete', from: lineStart(start), to: start, kill: true };
    case 'w': {
      if (hasSel) return { type: 'delete', from: start, to: end, kill: true };
      // 删除前一个单词（空白分隔）
      let i = start;
      while (i > 0 && /\s/.test(value[i - 1])) i--;
      while (i > 0 && !/\s/.test(value[i - 1])) i--;
      return { type: 'delete', from: i, to: start, kill: true };
    }
    case 'y': return { type: 'yank' };
    default: return null;
  }
}

// kill ring：Ctrl+k/u/w 删掉的内容，Ctrl+y 粘回
let killRing = '';

/** 用 execCommand 替换 [from, to) 为 text，保留撤销栈；不支持时退回直接赋值（会丢撤销，仅用于无 execCommand 的环境）。 */
function replaceRange(el: EmacsTarget, from: number, to: number, text: string): void {
  el.setSelectionRange(from, to);
  const ok = typeof document.execCommand === 'function'
    && (text ? document.execCommand('insertText', false, text) : (from === to || document.execCommand('delete')));
  if (ok) return;
  el.value = el.value.slice(0, from) + text + el.value.slice(to);
  el.setSelectionRange(from + text.length, from + text.length);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

/**
 * 返回 true 表示已处理，调用方应 preventDefault() + stopPropagation()。
 * 只处理纯 Ctrl 组合；输入法组词中不处理。
 */
export function handleEmacsKeys(e: KeyboardEvent, el: EmacsTarget): boolean {
  if (!e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.isComposing) return false;
  let start: number | null;
  let end: number | null;
  try {
    ({ selectionStart: start, selectionEnd: end } = el);
  } catch {
    return false; // number/email 等类型的 input 不支持选区
  }
  if (start === null || end === null) return false;

  const plan = planEmacsEdit(e.key.toLowerCase(), el.value, start, end, el.tagName === 'TEXTAREA');
  if (!plan) return false;

  if (plan.type === 'move') {
    el.setSelectionRange(plan.pos, plan.pos);
  } else if (plan.type === 'delete') {
    if (plan.kill && plan.to > plan.from) killRing = el.value.slice(plan.from, plan.to);
    replaceRange(el, plan.from, plan.to, '');
  } else if (killRing) {
    replaceRange(el, start, end, killRing);
  }
  return true;
}

function isTextEntry(t: EventTarget | null): t is EmacsTarget {
  const el = t as HTMLElement | null;
  if (el?.tagName === 'TEXTAREA') return true;
  if (el?.tagName !== 'INPUT') return false;
  return ['text', 'search', 'url', 'tel', 'password', ''].includes((el as HTMLInputElement).type);
}

/** 在 document 的 capture 阶段统一接入：新增/动态创建的输入框自动生效，不用逐个接。 */
export function initEmacsKeys(): void {
  document.addEventListener('keydown', (e) => {
    if (!isTextEntry(e.target)) return;
    if (handleEmacsKeys(e, e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, { capture: true });
}
