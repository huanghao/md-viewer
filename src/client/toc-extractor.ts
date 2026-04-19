export interface TocItem {
  title: string;
  level: number;       // 1=h1, 2=h2, 3=h3
  pageNum?: number;    // PDF 用
  anchor?: string;     // MD 用：heading slug
  children: TocItem[];
}

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function extractMdToc(content: string): TocItem[] {
  const lines = content.split('\n');
  const flat: TocItem[] = [];
  let inCodeBlock = false;
  const seen = new Map<string, number>();

  for (const line of lines) {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    const m = line.match(/^(#{1,3})\s+(.+)/);
    if (!m) continue;
    let anchor = slugify(m[2].trim());
    const count = seen.get(anchor) ?? 0;
    seen.set(anchor, count + 1);
    if (count > 0) anchor = `${anchor}-${count}`;
    flat.push({ title: m[2].trim(), level: m[1].length, anchor, children: [] });
  }

  return buildTree(flat);
}

function buildTree(flat: TocItem[]): TocItem[] {
  const root: TocItem[] = [];
  const stack: TocItem[] = [];

  for (const item of flat) {
    while (stack.length && stack[stack.length - 1].level >= item.level) stack.pop();
    if (stack.length === 0) {
      root.push(item);
    } else {
      stack[stack.length - 1].children.push(item);
    }
    stack.push(item);
  }

  return root;
}

interface PdfOutlineNode {
  title: string;
  dest: unknown;
  items: PdfOutlineNode[];
}

export function extractPdfOutline(outline: PdfOutlineNode[] | null): TocItem[] {
  if (!outline) return [];
  return convertOutlineNodes(outline, 1);
}

function convertOutlineNodes(nodes: PdfOutlineNode[], level: number): TocItem[] {
  return nodes.map(node => ({
    title: node.title || '',
    level,
    pageNum: undefined,  // dest 解析在 Task 3 完成
    children: convertOutlineNodes(node.items || [], level + 1),
  }));
}
