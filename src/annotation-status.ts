/**
 * 批注状态定义与筛选逻辑
 * 前后端共用，确保一致性
 */

export type AnnotationStatus = 'anchored' | 'unanchored' | 'resolved';

/** open = 已锚定且未解决（anchored only） */
export function isOpen(status: AnnotationStatus | undefined): boolean {
  return status === 'anchored';
}

/** orphan = 失锚（unanchored） */
export function isOrphan(status: AnnotationStatus | undefined): boolean {
  return status === 'unanchored';
}

/** resolved = 已解决 */
export function isResolved(status: AnnotationStatus | undefined): boolean {
  return status === 'resolved';
}

/**
 * 计算 open 批注数（用于 badge 计数）
 * @param anchoredCount 已锚定批注数
 * @param unanchoredCount 失锚批注数（不计入 open）
 * @param resolvedCount 已解决批注数（不计入 open）
 */
export function calculateOpenCount(
  anchoredCount: number,
  _unanchoredCount?: number,
  _resolvedCount?: number
): number {
  // unanchored 算 orphan，不算 open
  return anchoredCount;
}
