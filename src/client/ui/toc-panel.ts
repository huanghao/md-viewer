import type { TocItem } from '../toc-extractor';

export type TocJumpFn = (item: TocItem) => void;

let _flatItems: TocItem[] = [];

function renderItems(items: TocItem[], startIdx: { v: number }): string {
  return items.map(item => {
    const idx = startIdx.v++;
    return `<a class="toc-item" data-level="${item.level}"
       data-page="${item.pageNum ?? ''}"
       data-anchor="${item.anchor ?? ''}"
       data-idx="${idx}"
       title="${item.title}">${item.title}</a>${renderItems(item.children, startIdx)}`;
  }).join('');
}

export function renderTocPanel(
  container: HTMLElement,
  toc: TocItem[],
  onJump: TocJumpFn,
  loading = false
): void {
  const pane = container.closest('.toc-pane') as HTMLElement | null;
  const sidebar = container.closest('.sidebar') as HTMLElement | null;

  if (loading) {
    container.innerHTML = '<div class="toc-empty">扫描中…</div>';
    sidebar?.classList.remove('toc-visible');
    return;
  }

  if (toc.length === 0) {
    container.innerHTML = '<div class="toc-empty">无目录</div>';
    sidebar?.classList.remove('toc-visible');
    return;
  }

  _flatItems = flattenToc(toc);
  const startIdx = { v: 0 };
  container.innerHTML = renderItems(toc, startIdx);
  sidebar?.classList.add('toc-visible');

  // Ensure header exists in toc-pane
  if (pane && !pane.querySelector('.toc-header')) {
    const header = document.createElement('div');
    header.className = 'toc-header';
    header.innerHTML = `
      <span class="toc-header-label">目录</span>
      <button class="toc-toggle-btn" id="tocToggleBtn" title="关闭目录" aria-label="关闭目录">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 4l8 8M12 4l-8 8"/>
        </svg>
      </button>`;
    pane.insertBefore(header, pane.firstChild);
    header.querySelector('#tocToggleBtn')?.addEventListener('click', () => {
      sidebar?.classList.remove('toc-visible');
    });
  }

  container.querySelectorAll<HTMLElement>('.toc-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx ?? '0', 10);
      const item = _flatItems[idx];
      if (item) onJump(item);
    });
  });
}

export function setActiveTocItem(container: HTMLElement, pageNum?: number, anchor?: string): void {
  container.querySelectorAll('.toc-item').forEach(el => el.classList.remove('active'));
  if (pageNum !== undefined) {
    const el = container.querySelector<HTMLElement>(`.toc-item[data-page="${pageNum}"]`);
    el?.classList.add('active');
  } else if (anchor) {
    const el = container.querySelector<HTMLElement>(`.toc-item[data-anchor="${anchor}"]`);
    el?.classList.add('active');
  }
}

function flattenToc(items: TocItem[]): TocItem[] {
  const result: TocItem[] = [];
  function walk(nodes: TocItem[]) {
    for (const n of nodes) { result.push(n); walk(n.children); }
  }
  walk(items);
  return result;
}
