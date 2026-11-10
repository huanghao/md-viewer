// 文件树结构比较（忽略对象引用）。轮询每 5 秒扫描一次，多数时候结果与缓存完全相同；
// 相同则不替换 state.fileTree、不重写 localStorage，避免无谓的整树解析/写入与侧栏重绘。
import type { FileTreeNode } from '../types';

export function fileTreeEquals(a: FileTreeNode, b: FileTreeNode): boolean {
  if (a === b) return true;
  if (a.name !== b.name || a.path !== b.path || a.type !== b.type) return false;
  if (a.fileCount !== b.fileCount || a.lastModified !== b.lastModified) return false;
  if (!!a.isExpanded !== !!b.isExpanded) return false;
  if (JSON.stringify(a.ignorePatterns ?? null) !== JSON.stringify(b.ignorePatterns ?? null)) return false;
  if (JSON.stringify(a.scanWarnings ?? null) !== JSON.stringify(b.scanWarnings ?? null)) return false;
  const ac = a.children ?? [];
  const bc = b.children ?? [];
  if (ac.length !== bc.length) return false;
  for (let i = 0; i < ac.length; i++) {
    if (!fileTreeEquals(ac[i], bc[i])) return false;
  }
  return true;
}
