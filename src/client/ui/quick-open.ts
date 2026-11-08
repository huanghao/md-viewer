// 快速打开（Cmd+P 风格的文件搜索弹层）。
// 状态与逻辑在 quick-open/，这里只负责挂载 React 组件并对外保持原有入口。
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import { QuickOpen } from '../quick-open/QuickOpen';
import {
  initQuickOpenDeps,
  openQuickOpen,
  closeQuickOpen,
  type QuickOpenDeps,
} from '../quick-open/controller';
import { quickOpenStore } from '../quick-open/store';

let root: Root | null = null;

export function initQuickOpen(d: QuickOpenDeps): void {
  initQuickOpenDeps(d);
}

function ensureMounted(): void {
  if (root) return;
  const host = document.createElement('div');
  host.id = 'quickOpenHost';
  document.body.appendChild(host);
  root = createRoot(host);
  root.render(createElement(QuickOpen));
}

export function showQuickOpen(): void {
  ensureMounted();
  openQuickOpen();
}

export function hideQuickOpen(): void {
  closeQuickOpen();
}

export function isQuickOpenVisible(): boolean {
  return quickOpenStore.getState().visible;
}
