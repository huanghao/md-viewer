/**
 * 文档内容区的 React 外壳。
 *
 * 终态约定（见设计文档第 10 节「阶段 4」）：React 持有 #content 节点，内部 DOM 完全由命令式代码
 * （content-renderer、pdf-viewer、diff-view、批注渲染）维护。因此这里不渲染任何子节点：
 * 挂载时 React 会清空容器中的占位内容，之后不再触碰 children。
 */
export function ContentShell() {
  return null;
}
