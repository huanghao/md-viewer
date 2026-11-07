import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AnnotationList } from './annotation-list/AnnotationList';

/** 评论列表对外入口：annotation.ts 通过 annotationListStore.setView 推送数据，这里只负责挂载 */
export function mountAnnotationList(): void {
  const el = document.getElementById('annotationList');
  if (!el) return;
  createRoot(el).render(createElement(AnnotationList, { container: el }));
}
