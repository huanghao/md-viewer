import type { TocItem } from '../toc-extractor';

export type TocJumpFn = (item: TocItem) => void;

function renderItems(items: TocItem[], onJump: TocJumpFn): string {
  return items.map(item => `
    <a class="toc-item" data-level="${item.level}"
       data-page="${item.pageNum ?? ''}"
       data-anchor="${item.anchor ?? ''}"
       title="${item.title}">
      ${item.title}
    </a>
    ${renderItems(item.children, onJump)}
  `).join('');
}

export function renderTocPanel(
  container: HTMLElement,
  toc: TocItem[],
  onJump: TocJumpFn,
  loading = false
): void {
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

  container.innerHTML = renderItems(toc, onJump);
  sidebar?.classList.add('toc-visible');

  container.querySelectorAll<HTMLElement>('.toc-item').forEach((el, i) => {
    el.addEventListener('click', () => {
      const flat = flattenToc(toc);
      if (flat[i]) onJump(flat[i]);
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
