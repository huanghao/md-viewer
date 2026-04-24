/**
 * Emacs/Readline 风格快捷键处理（适用于所有评论 textarea）
 * 返回 true 表示已处理，调用方应 preventDefault() + stopPropagation()
 */
export function handleEmacsKeys(e: KeyboardEvent, textarea: HTMLTextAreaElement): boolean {
  if (!e.ctrlKey || e.metaKey || e.altKey || e.shiftKey) return false;
  const key = e.key.toLowerCase();
  const { value, selectionStart: start, selectionEnd: end } = textarea;
  if (start === null || end === null) return false;

  const setPos = (pos: number) => {
    textarea.selectionStart = pos;
    textarea.selectionEnd = pos;
  };

  const lineStart = (pos: number) => {
    const idx = value.lastIndexOf('\n', pos - 1);
    return idx === -1 ? 0 : idx + 1;
  };
  const lineEnd = (pos: number) => {
    const idx = value.indexOf('\n', pos);
    return idx === -1 ? value.length : idx;
  };

  switch (key) {
    case 'a': setPos(lineStart(start)); return true;
    case 'e': setPos(lineEnd(start)); return true;
    case 'b': setPos(Math.max(0, start - 1)); return true;
    case 'f': setPos(Math.min(value.length, start + 1)); return true;
    case 'n': {
      const le = lineEnd(start);
      setPos(le === value.length ? le : Math.min(value.length, le + 1 + (start - lineStart(start))));
      return true;
    }
    case 'p': {
      const ls = lineStart(start);
      if (ls === 0) { setPos(0); return true; }
      const prevLineStart = lineStart(ls - 1);
      const prevLineLen = (ls - 1) - prevLineStart;
      setPos(prevLineStart + Math.min(start - ls, prevLineLen));
      return true;
    }
    case 'd': {
      if (start < value.length) {
        textarea.value = value.slice(0, start) + value.slice(start + 1);
        setPos(start);
        textarea.dispatchEvent(new Event('input'));
      }
      return true;
    }
    case 'k': {
      const le = lineEnd(start);
      // 如果光标已在行尾，删除换行符本身
      const deleteEnd = start === le && le < value.length ? le + 1 : le;
      textarea.value = value.slice(0, start) + value.slice(deleteEnd);
      setPos(start);
      textarea.dispatchEvent(new Event('input'));
      return true;
    }
    case 'u': {
      const ls = lineStart(start);
      textarea.value = value.slice(0, ls) + value.slice(start);
      setPos(ls);
      textarea.dispatchEvent(new Event('input'));
      return true;
    }
    case 'w': {
      // 删除前一个单词（空白分隔）
      let i = start;
      while (i > 0 && /\s/.test(value[i - 1])) i--;
      while (i > 0 && !/\s/.test(value[i - 1])) i--;
      textarea.value = value.slice(0, i) + value.slice(start);
      setPos(i);
      textarea.dispatchEvent(new Event('input'));
      return true;
    }
    case 'h': {
      if (start > 0) {
        textarea.value = value.slice(0, start - 1) + value.slice(start);
        setPos(start - 1);
        textarea.dispatchEvent(new Event('input'));
      }
      return true;
    }
    default: return false;
  }
}
