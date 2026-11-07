/**
 * default 密度下评论卡片的纵向消解：按锚点 top 排列，相互重叠时向下顺延，
 * 并撑开画布高度。读取全部高度后再批量写入，避免 layout thrashing。
 */
export function resolvePositionedAnnotationOverlaps(listEl: HTMLElement, contentScrollHeight: number): void {
  const canvas = listEl.querySelector('.annotation-canvas') as HTMLElement | null;
  if (!canvas) return;
  const items = Array.from(canvas.querySelectorAll('.annotation-item.positioned')) as HTMLElement[];
  if (items.length === 0) return;

  const heights = items.map((item) => item.offsetHeight);

  const gap = 6;
  let previousBottom = 0;
  const tops: number[] = [];
  for (let i = 0; i < items.length; i++) {
    const rawAnchorTop = Number(items[i].getAttribute('data-anchor-top') || '0');
    const anchorTop = Number.isFinite(rawAnchorTop) ? Math.max(0, rawAnchorTop) : 0;
    const resolvedTop = Math.max(anchorTop, previousBottom > 0 ? previousBottom + gap : anchorTop);
    tops.push(resolvedTop);
    previousBottom = resolvedTop + heights[i];
  }

  for (let i = 0; i < items.length; i++) {
    items[i].style.top = `${Math.round(tops[i])}px`;
  }

  const minHeight = Math.max(0, contentScrollHeight);
  const neededHeight = Math.ceil(previousBottom + 24);
  canvas.style.height = `${Math.max(minHeight, neededHeight)}px`;
}
