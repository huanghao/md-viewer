/**
 * 批注状态定义与筛选逻辑
 * 前后端共用，确保一致性
 */

export type AnnotationStatus = 'anchored' | 'unanchored' | 'resolved';

/** open = 未解决（anchored 或 unanchored，不含 resolved） */
export function isOpen(status: AnnotationStatus | undefined): boolean {
  return status === 'anchored' || status === 'unanchored';
}

/** orphan = 失锚（unanchored），是 open 的子集，用于单独筛选 */
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
 * @param unanchoredCount 失锚批注数（计入 open）
 * @param resolvedCount 已解决批注数（不计入 open）
 */
export function calculateOpenCount(
  anchoredCount: number,
  unanchoredCount = 0,
  _resolvedCount?: number
): number {
  return anchoredCount + unanchoredCount;
}
