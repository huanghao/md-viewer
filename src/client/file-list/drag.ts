import { state } from '../state';

const DRAG_THRESHOLD = 4; // px，小于此移动距离视为 click，不启动拖拽

/**
 * 文件列表纵向拖拽排序：按下后移动超过阈值才开始；拖拽时其它行通过 translateY 让位，
 * 松开时调用 onDrop(fromIdx, insertIdx)。幽灵元素挂在 body 上，不参与 React 渲染。
 */
export function startFileDrag(
  e: PointerEvent,
  listEl: HTMLElement,
  onDrop: (fromIdx: number, insertIdx: number) => void,
): void {
  if (e.button !== 0) return;
  const target = e.target as HTMLElement;
  const item = target.closest('.file-item') as HTMLElement | null;
  if (!item) return;
  if (target.closest('.close, .tree-pin-btn')) return;

  const fromPath = item.dataset.path || '';
  if (!fromPath) return;
  const fromIdx = state.tabOrder.indexOf(fromPath);
  if (fromIdx < 0) return;

  const startX = e.clientX;
  const startY = e.clientY;
  let dragging = false;
  let ghost: HTMLElement | null = null;
  let insertIdx = fromIdx;

  const itemRect = item.getBoundingClientRect();
  const offsetX = e.clientX - itemRect.left;
  const offsetY = e.clientY - itemRect.top;

  function startDrag(): void {
    dragging = true;
    ghost = document.createElement('div');
    ghost.className = 'file-drag-ghost';
    ghost.textContent = item!.querySelector('.tree-name-full')?.textContent || fromPath.split('/').pop() || fromPath;
    ghost.style.width = itemRect.width + 'px';
    ghost.style.left = itemRect.left + 'px';
    ghost.style.top = itemRect.top + 'px';
    document.body.appendChild(ghost);
    item!.classList.add('file-item-dragging');
  }

  function cleanup(): void {
    listEl.querySelectorAll<HTMLElement>('.file-item').forEach((el) => { el.style.transform = ''; });
    if (ghost) { ghost.remove(); ghost = null; }
    item!.classList.remove('file-item-dragging');
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

    const mouseY = ev.clientY;
    const itemEls = [...listEl.querySelectorAll<HTMLElement>('.file-item:not(.file-item-dragging)')];

    let newInsertIdx = fromIdx;
    let found = false;
    for (const el of itemEls) {
      const r = el.getBoundingClientRect();
      if (mouseY < r.bottom) {
        const origIdx = state.tabOrder.indexOf(el.dataset.path || '');
        if (origIdx < 0) continue;
        newInsertIdx = mouseY < r.top + r.height / 2 ? origIdx : origIdx + 1;
        if (origIdx >= fromIdx) newInsertIdx -= 1;
        found = true;
        break;
      }
    }
    if (!found) newInsertIdx = state.tabOrder.length - 1;
    insertIdx = newInsertIdx;

    const ghostH = ghost.offsetHeight;
    const allItemEls = [...listEl.querySelectorAll<HTMLElement>('.file-item')];
    allItemEls.forEach((el, i) => {
      if (el === item) return;
      let dy = 0;
      if (newInsertIdx < fromIdx) {
        if (i >= newInsertIdx && i < fromIdx) dy = ghostH;
      } else if (i > fromIdx && i <= newInsertIdx) {
        dy = -ghostH;
      }
      el.style.transform = dy !== 0 ? `translateY(${dy}px)` : '';
    });
  }

  function detach(): void {
    item!.removeEventListener('pointermove', onMove);
    item!.removeEventListener('pointerup', onUp);
    item!.removeEventListener('pointercancel', onCancel);
  }

  function onUp(): void {
    detach();
    if (!dragging) return;
    cleanup();
    onDrop(fromIdx, insertIdx);
  }

  function onCancel(): void {
    detach();
    if (dragging) cleanup();
  }

  item.setPointerCapture(e.pointerId);
  item.addEventListener('pointermove', onMove);
  item.addEventListener('pointerup', onUp);
  item.addEventListener('pointercancel', onCancel);
}
