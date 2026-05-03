/**
 * Chat split-panel logic — manages the detachable chat sidebar.
 */

import { storageGet, storageSet, storageGetNumber } from '../utils/storage';
import { renderChatPanel } from '../ui/chat-panel.js';
import { createResizer } from '../utils/resizer';

// ── Callbacks (injected by annotation.ts to avoid circular deps) ──────────────
let _switchAnnotationTab: (tab: 'comments' | 'chat' | 'todo') => void = () => {};

export function registerChatSplitCallbacks(cbs: {
  switchAnnotationTab: (tab: 'comments' | 'chat' | 'todo') => void;
}): void {
  _switchAnnotationTab = cbs.switchAnnotationTab;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const CHAT_SPLIT_KEY = 'md-viewer:chat-split';
const CHAT_SPLIT_WIDTH_KEY = 'md-viewer:chat-sidebar-width';
const CHAT_SPLIT_WIDTH_DEFAULT = 300;
const CHAT_SPLIT_WIDTH_MIN = 220;
const CHAT_SPLIT_WIDTH_MAX = 520;

// ── Core functions ────────────────────────────────────────────────────────────
export function setChatSidebarWidth(width: number): void {
  const clamped = Math.max(CHAT_SPLIT_WIDTH_MIN, Math.min(CHAT_SPLIT_WIDTH_MAX, Math.round(width)));
  document.documentElement.style.setProperty('--chat-sidebar-width', `${clamped}px`);
  storageSet(CHAT_SPLIT_WIDTH_KEY, clamped);
}

export function syncChatSidebarLayout(): void {
  const tabs = document.getElementById('tabs');
  const topOffset = Math.max(0, Math.round((tabs?.getBoundingClientRect().bottom || 84)));
  const height = Math.max(0, window.innerHeight - topOffset);
  const chatSidebar = document.getElementById('chatSidebar');
  const chatResizer = document.getElementById('chatSidebarResizer');
  if (chatSidebar) { chatSidebar.style.top = `${topOffset}px`; chatSidebar.style.height = `${height}px`; }
  if (chatResizer) { chatResizer.style.top = `${topOffset}px`; chatResizer.style.height = `${height}px`; }
}

export function enterSplitMode(): void {
  const chatSidebar = document.getElementById('chatSidebar');
  const chatResizer = document.getElementById('chatSidebarResizer');
  const chatList = document.getElementById('chatList');         // 合并模式的 chat 容器
  const chatListSplit = document.getElementById('chatListSplit'); // 拆分模式的 chat 容器
  const splitBtn = document.getElementById('annotationSplitToggle');

  if (!chatSidebar || !chatListSplit) return;

  // 恢复宽度
  const savedWidth = storageGetNumber(CHAT_SPLIT_WIDTH_KEY, CHAT_SPLIT_WIDTH_DEFAULT);
  setChatSidebarWidth(savedWidth > 0 ? savedWidth : CHAT_SPLIT_WIDTH_DEFAULT);

  // 把 chatList 的内容移到 chatListSplit（直接挂到拆分面板）
  if (chatList && chatListSplit) {
    chatListSplit.innerHTML = chatList.innerHTML;
    chatList.style.display = 'none';
  }

  chatSidebar.style.display = '';
  if (chatResizer) chatResizer.style.display = '';
  splitBtn?.classList.add('is-active');
  document.body.classList.add('sidebar-split');
  storageSet(CHAT_SPLIT_KEY, '1');

  // 隐藏主侧边栏的 Chat tab（chat 已移到独立面板）
  const chatTabEl = document.getElementById('annotationChatTab');
  if (chatTabEl) chatTabEl.style.display = 'none';

  // 切换 annotation sidebar 到评论 tab（chat tab 已移走）
  _switchAnnotationTab('comments');
  syncChatSidebarLayout();

  // 在拆分面板里渲染 chat panel
  renderChatPanel();
}

export function exitSplitMode(): void {
  const chatSidebar = document.getElementById('chatSidebar');
  const chatResizer = document.getElementById('chatSidebarResizer');
  const chatList = document.getElementById('chatList');
  const splitBtn = document.getElementById('annotationSplitToggle');

  chatSidebar && (chatSidebar.style.display = 'none');
  chatResizer && (chatResizer.style.display = 'none');
  splitBtn?.classList.remove('is-active');
  document.body.classList.remove('sidebar-split');
  storageSet(CHAT_SPLIT_KEY, '0');

  // 恢复主侧边栏的 Chat tab
  const chatTabEl = document.getElementById('annotationChatTab');
  if (chatTabEl) chatTabEl.style.display = '';

  // 恢复 chatList 显示
  if (chatList) chatList.style.display = '';
  _switchAnnotationTab('chat');
  renderChatPanel();
}

// ── Init (wire up event listeners and restore state) ─────────────────────────
export function initChatSplit(): void {
  // Split 按钮
  document.getElementById('annotationSplitToggle')?.addEventListener('click', () => {
    const isSplit = document.body.classList.contains('sidebar-split');
    isSplit ? exitSplitMode() : enterSplitMode();
  });

  // 合并按钮（在拆分面板里）
  document.getElementById('chatSidebarMergeBtn')?.addEventListener('click', exitSplitMode);

  // Chat sidebar resizer
  const chatResizerEl = document.getElementById('chatSidebarResizer');
  if (chatResizerEl) {
    createResizer({
      element: chatResizerEl,
      bodyClass: 'annotation-sidebar-resizing',
      guard: () => document.body.classList.contains('sidebar-split'),
      onMove: (_delta, clientX) => {
        setChatSidebarWidth(window.innerWidth - clientX - parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--annotation-sidebar-width') || '320'
        ));
        syncChatSidebarLayout();
      },
      onEnd: (_delta, clientX) => {
        setChatSidebarWidth(window.innerWidth - clientX - parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--annotation-sidebar-width') || '320'
        ));
        syncChatSidebarLayout();
      },
    });
  }

  // 恢复上次的拆分状态
  if (storageGet<string>(CHAT_SPLIT_KEY, '0') === '1') {
    setTimeout(() => enterSplitMode(), 0);
  }
}
