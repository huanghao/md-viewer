import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PopoverNote } from './annotation-popover/PopoverNote';

/** 评论浮窗正文的挂载入口：annotation.ts 的 showPopover 通过 popoverNoteStore.show 推送数据 */
export function mountPopoverNote(): void {
  const el = document.getElementById('popoverNote');
  if (!el) return;
  createRoot(el).render(createElement(PopoverNote));
}
