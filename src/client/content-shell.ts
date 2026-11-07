import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { ContentShell } from './content-shell/ContentShell';

/**
 * 挂载文档内容区外壳。必须在 renderContent 之前调用。
 * 使用 flushSync 同步提交：React 会在提交时清空容器中的占位内容，若异步提交，
 * 之后命令式写入的内容可能被误清。
 */
export function mountContentShell(): Root | null {
  const el = document.getElementById('content');
  if (!el) return null;
  const root = createRoot(el);
  flushSync(() => root.render(createElement(ContentShell)));
  return root;
}
