import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { DiffBanner, type DiffBannerCallbacks } from './diff-banner/DiffBanner';

/** Diff 横幅的挂载入口：diff-view.ts 通过 diffBannerStore 推送状态，这里只负责挂载并注入动作 */
export function mountDiffBanner(callbacks: DiffBannerCallbacks): void {
  const host = document.getElementById('diffBannerHost');
  if (!host) return;
  createRoot(host).render(createElement(DiffBanner, { callbacks }));
}
