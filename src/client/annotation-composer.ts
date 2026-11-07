import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Composer, type ComposerCallbacks } from './annotation-composer/Composer';
import { QuickAdd, type QuickAddCallbacks } from './annotation-composer/QuickAdd';

export interface AnnotationComposerDeps {
  quickAdd: QuickAddCallbacks;
  comment: ComposerCallbacks;
  tray: ComposerCallbacks;
}

/** 划词浮层内容的挂载入口：三个浮层各自一个 React 根，显隐与定位仍由 annotation.ts 负责 */
export function mountAnnotationComposer(deps: AnnotationComposerDeps): void {
  const quickAddEl = document.getElementById('annotationQuickAddWrap');
  const commentEl = document.getElementById('annotationComposer');
  const trayEl = document.getElementById('agentTrayComposer');
  if (quickAddEl) createRoot(quickAddEl).render(createElement(QuickAdd, { callbacks: deps.quickAdd }));
  if (commentEl) createRoot(commentEl).render(createElement(Composer, { kind: 'comment', callbacks: deps.comment }));
  if (trayEl) createRoot(trayEl).render(createElement(Composer, { kind: 'tray', callbacks: deps.tray }));
}
