import type { TocItem } from '../toc-extractor';

export type TocJumpFn = (item: TocItem) => void;

function renderItems(items: TocItem[]): string {
  return items.map(item => {
    const pageBadge = item.pageNum ? `<span class="toc-page-badge">${item.pageNum}</span>` : '';
    return `<a class="toc-item" data-level="${item.level}"
       data-page="${item.pageNum ?? ''}"
       data-anchor="${item.anchor ?? ''}"
       title="${item.title}"><span class="toc-level-badge">#${item.level}</span><span class="toc-item-title">${item.title}</span>${pageBadge}</a>${renderItems(item.children)}`;
  }).join('');
}

function findAncestor(el: HTMLElement, cls: string): HTMLElement | null {
  let cur: HTMLElement | null = el.parentElement;
  while (cur) {
    if (cur.classList.contains(cls)) return cur;
    cur = cur.parentElement;
  }
  return null;
}

export function renderTocPanel(
  container: HTMLElement,
  toc: TocItem[],
  onJump: TocJumpFn,
  loading = false,
  doc: Document = document
): void {
  const pane = findAncestor(container, 'toc-pane');
  const sidebar = findAncestor(container, 'sidebar');

  if (loading) {
    container.innerHTML = '<div class="toc-empty">加载中…</div>';
    sidebar?.classList.remove('toc-has-content', 'toc-visible');
    return;
  }

  if (toc.length === 0) {
    container.innerHTML = '<div class="toc-empty">无目录</div>';
    sidebar?.classList.remove('toc-has-content', 'toc-visible');
    return;
  }

  const flatItems = flattenToc(toc);
  container.innerHTML = renderItems(toc);
  sidebar?.classList.add('toc-has-content');
  // toc-visible is managed by caller (per-file preference)

  // Ensure header exists in toc-pane (created once, persists across re-renders)
  if (pane && !Array.from(pane.children).some(c => (c as HTMLElement).classList.contains('toc-header'))) {
    const header = doc.createElement('div');
    header.className = 'toc-header';
    header.innerHTML = `
      <span class="toc-header-label">目录</span>
      <button class="toc-toggle-btn" title="收起目录" aria-label="收起目录">
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 10l4 4 4-4"/>
        </svg>
      </button>`;
    pane.insertBefore(header, pane.firstChild);
    (header.getElementsByClassName('toc-toggle-btn')[0] as HTMLElement | undefined)?.addEventListener('click', () => {
      sidebar?.classList.remove('toc-visible');
      // Persist close for current file
      (window as any).__onTocClose?.();
    });
  }

  container.querySelectorAll<HTMLElement>('.toc-item').forEach(el => {
    el.addEventListener('click', () => {
      // Match by title attribute (unique enough for navigation)
      const title = el.title;
      const pageNum = el.dataset.page ? parseInt(el.dataset.page, 10) : undefined;
      const item = flatItems.find(t =>
        t.title === title && (pageNum === undefined || t.pageNum === pageNum)
      );
      if (item) onJump(item);
    });
  });
}

export function setActiveTocItem(container: HTMLElement, pageNum?: number, titleOrAnchor?: string): void {
  container.querySelectorAll('.toc-item').forEach(el => el.classList.remove('active'));
  if (pageNum !== undefined) {
    const el = container.querySelector<HTMLElement>(`.toc-item[data-page="${pageNum}"]`);
    el?.classList.add('active');
  } else if (titleOrAnchor) {
    // Match by .toc-item-title text (excludes level badge), then anchor fallback
    let el = Array.from(container.querySelectorAll<HTMLElement>('.toc-item'))
      .find(e => e.querySelector('.toc-item-title')?.textContent?.trim() === titleOrAnchor);
    if (!el) el = container.querySelector<HTMLElement>(`.toc-item[data-anchor="${titleOrAnchor}"]`) ?? undefined;
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
