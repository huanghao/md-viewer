import { createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { StatusBar } from './statusbar/StatusBar';
import { statusbarStore, type ConnectionStatus } from './statusbar/store';

/** 对外入口保持不变：调用方只管推数据，渲染由 React 订阅 store 完成。 */
export function updateStatusbarFile(charCount: number, createdAt?: number, gitCreatedAt?: number): void {
  statusbarStore.setFile(charCount, createdAt, gitCreatedAt);
}

export function updateStatusbarConnection(status: ConnectionStatus): void {
  statusbarStore.setConnection(status);
}

let root: Root | null = null;

export function mountStatusbar(): void {
  const el = document.getElementById('statusbar');
  if (!el) return;
  root?.unmount();
  root = createRoot(el);
  root.render(createElement(StatusBar));
}
