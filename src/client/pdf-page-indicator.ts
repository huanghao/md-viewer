import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { PdfPageIndicator } from './pdf-page-indicator/PdfPageIndicator';

/** 挂载 PDF 页码指示器外壳；显隐与内容由 content-renderer 通过 pdfPageIndicatorStore 控制 */
export function mountPdfPageIndicatorShell(): void {
  const host = document.getElementById('pdfPageIndicatorHost');
  if (!host) return;
  createRoot(host).render(createElement(PdfPageIndicator));
}
