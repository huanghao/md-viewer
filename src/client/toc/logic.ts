import type { TocItem } from '../toc-extractor';

export interface FlatTocItem extends TocItem {
  /** 扁平化后的显示顺序（先父后子） */
  index: number;
}

/** 把嵌套目录按先序展开；目录标题保持原始文本（由 React 作为文字渲染） */
export function flattenToc(items: TocItem[]): FlatTocItem[] {
  const out: FlatTocItem[] = [];
  const walk = (nodes: TocItem[]) => {
    for (const n of nodes) {
      out.push({ ...n, index: out.length });
      walk(n.children ?? []);
    }
  };
  walk(items);
  return out;
}

export interface TocActiveKey {
  page?: number;
  title?: string;
}

/**
 * 查找当前激活项：先按页码（PDF），否则按标题文本（MD），最后回退到锚点。
 * 找不到返回 -1（即没有激活项）。
 */
export function findActiveIndex(flat: FlatTocItem[], key: TocActiveKey | null): number {
  if (!key) return -1;
  if (key.page !== undefined) {
    return flat.findIndex((t) => t.pageNum === key.page);
  }
  if (key.title) {
    const wanted = key.title.trim();
    const byTitle = flat.findIndex((t) => t.title.trim() === wanted);
    if (byTitle !== -1) return byTitle;
    return flat.findIndex((t) => t.anchor === key.title);
  }
  return -1;
}
