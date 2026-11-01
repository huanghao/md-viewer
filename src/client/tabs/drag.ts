const DRAG_THRESHOLD = 4; // px，小于此移动距离视为 click，不启动拖拽

/**
 * 标签拖拽排序：按下后移动超过阈值才开始；拖拽时其它标签通过 translateX 让位，
 * 松开时调用 onDrop(fromIdx, insertIdx)。幽灵元素挂在 body 上，不参与 React 渲染。
 */
export function startTabDrag(
  e: PointerEvent,
  tabsScrollEl: HTMLElement,
  tabCount: number,
  onDrop: (fromIdx: number, insertIdx: number) => void,
): void {
  if (e.button !== 0) return;
  const tab = (e.target as HTMLElement).closest('.tab') as HTMLElement | null;
  if (!tab) return;
  if ((e.target as HTMLElement).classList.contains('tab-close')) return;

  const fromIdx = parseInt(tab.dataset.index || '-1', 10);
  if (fromIdx < 0) return;

  const startX = e.clientX;
  const startY = e.clientY;
  let dragging = false;
  let ghost: HTMLElement | null = null;
  let insertIdx = fromIdx;

  const tabRect = tab.getBoundingClientRect();
  const offsetX = e.clientX - tabRect.left;
  const offsetY = e.clientY - tabRect.top;

  // 拖拽开始时快照各标签位置，之后不再读取（避免 translateX 偏移干扰判断）
  let tabOrigRects: Array<{ origIdx: number; left: number; width: number }> = [];

  function startDrag(): void {
    dragging = true;
    ghost = document.createElement('div');
    ghost.className = 'tab-drag-ghost';
    ghost.innerHTML = tab!.querySelector('.tab-name')?.outerHTML || tab!.innerHTML;
    ghost.style.width = tabRect.width + 'px';
    ghost.style.left = tabRect.left + 'px';
    ghost.style.top = tabRect.top + 'px';
    document.body.appendChild(ghost);
    tab!.classList.add('tab-dragging');
    tabOrigRects = [...tabsScrollEl.querySelectorAll<HTMLElement>('.tab')].map((el) => {
      const rect = el.getBoundingClientRect();
      return { origIdx: parseInt(el.dataset.index || '0', 10), left: rect.left, width: rect.width };
    });
  }

  function cleanup(): void {
    tabsScrollEl.querySelectorAll<HTMLElement>('.tab').forEach((el) => { el.style.transform = ''; });
    if (ghost) { ghost.remove(); ghost = null; }
    tab!.classList.remove('tab-dragging');
  }

  function onMove(ev: PointerEvent): void {
    if (!dragging) {
      if (Math.abs(ev.clientX - startX) < DRAG_THRESHOLD && Math.abs(ev.clientY - startY) < DRAG_THRESHOLD) return;
      ev.preventDefault();
      startDrag();
    }
    if (!ghost) return;

    ghost.style.left = (ev.clientX - offsetX) + 'px';
    ghost.style.top = (ev.clientY - offsetY) + 'px';

    const mouseX = ev.clientX;
    const others = tabOrigRects.filter((t) => t.origIdx !== fromIdx);

    let newInsertIdx = fromIdx;
    let found = false;
    for (const t of others) {
      if (mouseX < t.left + t.width) {
        const movingRight = t.origIdx > fromIdx;
        // 向右拖：越过目标左边 1/3；向左拖：越过目标右边 1/3
        const trigger = movingRight ? t.left + t.width / 3 : t.left + t.width * 2 / 3;
        newInsertIdx = mouseX < trigger ? t.origIdx : t.origIdx + 1;
        if (t.origIdx >= fromIdx) newInsertIdx -= 1;
        found = true;
        break;
      }
    }
    if (!found) newInsertIdx = tabCount - 1;
    insertIdx = newInsertIdx;

    const ghostW = ghost.offsetWidth;
    [...tabsScrollEl.querySelectorAll<HTMLElement>('.tab')].forEach((el, i) => {
      if (el === tab) return;
      let dx = 0;
      if (newInsertIdx < fromIdx) {
        if (i >= newInsertIdx && i < fromIdx) dx = ghostW;
      } else if (i > fromIdx && i <= newInsertIdx) {
        dx = -ghostW;
      }
      el.style.transform = dx !== 0 ? `translateX(${dx}px)` : '';
    });
  }

  function detach(): void {
    tab!.removeEventListener('pointermove', onMove);
    tab!.removeEventListener('pointerup', onUp);
    tab!.removeEventListener('pointercancel', onCancel);
  }

  function onUp(): void {
    detach();
    // 没拖过阈值，视为 click，不处理排序
    if (!dragging) return;
    cleanup();
    onDrop(fromIdx, insertIdx);
  }

  function onCancel(): void {
    detach();
    if (dragging) cleanup();
  }

  tab.setPointerCapture(e.pointerId);
  tab.addEventListener('pointermove', onMove);
  tab.addEventListener('pointerup', onUp);
  tab.addEventListener('pointercancel', onCancel);
}
