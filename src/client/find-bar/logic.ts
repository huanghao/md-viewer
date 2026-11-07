/** 查找栏的纯逻辑：键盘动作与计数文本，不依赖 DOM，便于测试。 */

export type FindKeyAction = 'next' | 'prev' | 'close' | null;

/** Enter 下一个，Shift+Enter 上一个，Escape 关闭 */
export function findKeyAction(key: string, shiftKey: boolean): FindKeyAction {
  if (key === 'Enter') return shiftKey ? 'prev' : 'next';
  if (key === 'Escape') return 'close';
  return null;
}

/** 计数文本：有结果时显示「当前 / 总数」，查询非空但无结果时显示「无结果」 */
export function formatFindCount(query: string, current: number, total: number): { text: string; noResult: boolean } {
  if (total === 0) {
    return query ? { text: '无结果', noResult: true } : { text: '', noResult: false };
  }
  return { text: `${current + 1} / ${total}`, noResult: false };
}
