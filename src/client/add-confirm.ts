import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AddConfirmBar } from './add-confirm/AddConfirmBar';

/** 添加确认条对外入口：file-switcher 通过 addConfirmStore 显示/隐藏，这里只负责挂载 */
export { addConfirmStore } from './add-confirm/store';

export function mountAddConfirmBar(): void {
  const el = document.getElementById('quickActionConfirmHost');
  if (!el) return;
  createRoot(el).render(createElement(AddConfirmBar));
}
