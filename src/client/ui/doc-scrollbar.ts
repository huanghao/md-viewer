// Custom scrollbar overlay for .content — replaces native scrollbar.
// Shows a proportional thumb + diff change markers on diff pages.

let scrollbarEl: HTMLElement | null = null;
let thumbEl: HTMLElement | null = null;
let markersEl: HTMLElement | null = null;
let contentEl: HTMLElement | null = null;
let resizeObserver: ResizeObserver | null = null;
let isDragging = false;
let dragStartY = 0;
let dragStartScrollTop = 0;

export function mountScrollbar(): void {
  contentEl = document.getElementById('content');
  scrollbarEl = document.getElementById('docScrollbar');
  if (!scrollbarEl || !contentEl) return;

  thumbEl = scrollbarEl.querySelector<HTMLElement>('.doc-scrollbar-thumb');
  markersEl = scrollbarEl.querySelector<HTMLElement>('.doc-scrollbar-markers');

  contentEl.addEventListener('scroll', onScroll, { passive: true });

  // 点击轨道跳转
  scrollbarEl.addEventListener('pointerdown', onTrackPointerDown);

  // 拖拽 thumb
  thumbEl?.addEventListener('pointerdown', onThumbPointerDown);

  resizeObserver = new ResizeObserver(updateScrollbar);
  resizeObserver.observe(contentEl);

  window.addEventListener('resize', updateScrollbar);

  updateScrollbar();
}

export function unmountScrollbar(): void {
  contentEl?.removeEventListener('scroll', onScroll);
  scrollbarEl?.removeEventListener('pointerdown', onTrackPointerDown);
  thumbEl?.removeEventListener('pointerdown', onThumbPointerDown);
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.removeEventListener('resize', updateScrollbar);
}

export function updateScrollbar(): void {
  if (!contentEl || !scrollbarEl || !thumbEl) return;
  const { scrollHeight, clientHeight } = contentEl;
  const visible = scrollHeight > clientHeight;
  scrollbarEl.style.display = visible ? 'block' : 'none';
  if (!visible) return;
  // top/height 跟随 .content，right 由 CSS 变量控制
  const contentRect = contentEl.getBoundingClientRect();
  scrollbarEl.style.top = `${contentRect.top}px`;
  scrollbarEl.style.height = `${contentRect.height}px`;
  updateThumb();
}

export function clearDiffMarkers(): void {
  if (markersEl) markersEl.innerHTML = '';
}

export function updateDiffMarkers(groups: Array<{ el: HTMLElement; kind: 'insert' | 'delete' | 'modify' }>): void {
  if (!markersEl || !contentEl) return;
  markersEl.innerHTML = '';
  const totalHeight = contentEl.scrollHeight;
  if (totalHeight === 0) return;

  const COLOR: Record<string, string> = {
    insert: '#1a7f37',
    delete: '#cf222e',
    modify: '#f0a500',
  };

  for (const { el, kind } of groups) {
    const top = (el.getBoundingClientRect().top - contentEl.getBoundingClientRect().top + contentEl.scrollTop) / totalHeight * 100;
    const height = Math.max(el.offsetHeight / totalHeight * 100, 0.5);
    const marker = document.createElement('div');
    marker.className = 'doc-scrollbar-marker';
    marker.style.cssText = `top:${top}%;height:${height}%;background:${COLOR[kind] ?? '#888'};`;
    markersEl.appendChild(marker);
  }
}

function updateThumb(): void {
  if (!contentEl || !thumbEl) return;
  const { scrollTop, scrollHeight, clientHeight } = contentEl;
  const thumbHeight = Math.max(clientHeight / scrollHeight * 100, 5);
  const thumbTop = scrollTop / (scrollHeight - clientHeight) * (100 - thumbHeight);
  thumbEl.style.height = `${thumbHeight}%`;
  thumbEl.style.top = `${thumbTop}%`;
}

function onScroll(): void {
  updateThumb();
}

function onTrackPointerDown(e: PointerEvent): void {
  if (e.target === thumbEl || thumbEl?.contains(e.target as Node)) return;
  if (!contentEl || !scrollbarEl) return;
  const rect = scrollbarEl.getBoundingClientRect();
  const ratio = (e.clientY - rect.top) / rect.height;
  contentEl.scrollTop = ratio * (contentEl.scrollHeight - contentEl.clientHeight);
}

function onThumbPointerDown(e: PointerEvent): void {
  e.stopPropagation();
  if (!contentEl || !thumbEl) return;
  isDragging = true;
  dragStartY = e.clientY;
  dragStartScrollTop = contentEl.scrollTop;
  thumbEl.setPointerCapture(e.pointerId);
  thumbEl.addEventListener('pointermove', onThumbPointerMove);
  thumbEl.addEventListener('pointerup', onThumbPointerUp);
}

function onThumbPointerMove(e: PointerEvent): void {
  if (!isDragging || !contentEl || !scrollbarEl) return;
  const trackHeight = scrollbarEl.clientHeight;
  const delta = e.clientY - dragStartY;
  const scrollDelta = delta / trackHeight * contentEl.scrollHeight;
  contentEl.scrollTop = dragStartScrollTop + scrollDelta;
}

function onThumbPointerUp(e: PointerEvent): void {
  isDragging = false;
  thumbEl?.releasePointerCapture(e.pointerId);
  thumbEl?.removeEventListener('pointermove', onThumbPointerMove);
  thumbEl?.removeEventListener('pointerup', onThumbPointerUp);
}
