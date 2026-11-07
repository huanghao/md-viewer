import type { Annotation } from '../annotation-state';

/** 批注相关的全局交互：PDF 批注事件同步高亮、PDF 标记点击、划词选择。依赖全部注入，避免与 annotation.ts 循环引用。 */
export interface AnnotationInteractionDeps {
  getAnnotations: () => Annotation[];
  getBridge: () => { renderHighlights(annotations: Annotation[]): void } | null;
  getPendingAnnotationSetter: () => ((ann: any, filePath: string, x: number, y: number) => void) | null;
  openComposerFromPending: (x: number, y: number) => void;
  handleSelectionForAnnotation: (filePath: string | null) => void;
}

export function setupAnnotationInteractions(deps: AnnotationInteractionDeps): void {
  // 添加批注文本选中监听
  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      const filePath = document.getElementById('content')?.getAttribute('data-current-file') || null;
      deps.handleSelectionForAnnotation(filePath);
    }, 0);
  });

  // PDF 批注事件：统一刷新当前 PDF 的高亮
  const refreshHighlights = () => {
    deps.getBridge()?.renderHighlights(deps.getAnnotations());
  };
  document.addEventListener('annotations:loaded', refreshHighlights);
  document.addEventListener('annotation:created', refreshHighlights);
  document.addEventListener('annotation:deleted', refreshHighlights);
  document.addEventListener('annotation:highlights-changed', refreshHighlights);

  // 监听 pdf:show-composer 事件
  document.addEventListener('pdf:show-composer', (e: Event) => {
    const { annotation, filePath, clientX, clientY } = (e as CustomEvent).detail;
    deps.getPendingAnnotationSetter()?.(annotation, filePath, clientX, clientY);
  });

  // PDF temp selection mark 点击处理：失焦后重新点击黄色下划线恢复 composer
  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const tempMark = target.closest('mark.pdf-selection-mark-temp');
    if (!tempMark) return;
    if (!tempMark.closest('.pdf-viewer-container')) return;
    e.stopPropagation();
    e.preventDefault();
    const rect = (tempMark as HTMLElement).getBoundingClientRect();
    deps.openComposerFromPending(rect.right + 6, rect.top - 8);
  });

  // PDF annotation mark 点击处理
  document.getElementById('content')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const mark = target.closest('.annotation-mark');
    if (!mark) return;
    if (!mark.closest('.pdf-viewer-container')) return;

    const annotationId = mark.getAttribute('data-annotation-id');
    if (!annotationId) return;

    e.stopPropagation();
    e.preventDefault();

    const ann = deps.getAnnotations().find((a) => a.id === annotationId);
    if (!ann) return;

    const rect = (mark as HTMLElement).getBoundingClientRect();
    document.dispatchEvent(new CustomEvent('pdf:show-popover', {
      detail: { annotation: ann, x: rect.right + 8, y: rect.top }
    }));
  });
}
