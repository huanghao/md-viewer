// 消息提示（toast）。状态与动画在 toast/ 下（store + React 组件），这里提供对外便捷 API。
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastStack } from '../toast/ToastStack';
import { toastStore, type ToastOptions, type ToastType } from '../toast/store';

export type { ToastType };

/** 在 body 中挂载提示容器（组合根调用一次）。挂载前调用 showToast 的提示会排队保存，挂载后显示。 */
export function mountToastStack(): void {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  createRoot(container).render(createElement(ToastStack));
}

export function showToast(options: ToastOptions | string): number {
  return toastStore.add(options);
}

// 便捷方法 — 统一默认 3000ms，调用方无需再传 duration
export function showSuccess(message: string, duration = 3000) {
  return showToast({ message, type: 'success', duration });
}

export function showError(message: string, duration = 0) {
  return showToast({ message, type: 'error', duration });
}

export function showWarning(message: string, duration = 3000) {
  return showToast({ message, type: 'warning', duration });
}

export function showInfo(message: string, duration = 3000) {
  return showToast({ message, type: 'info', duration });
}
