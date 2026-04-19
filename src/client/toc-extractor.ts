export interface TocItem {
  title: string;
  level: number;       // 1=h1, 2=h2, 3=h3
  pageNum?: number;    // PDF 用
  anchor?: string;     // MD 用：heading slug
  children: TocItem[];
}

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function extractMdToc(content: string): TocItem[] {
  const lines = content.split('\n');
  const flat: TocItem[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.startsWith('```')) { inCodeBlock = !inCodeBlock; continue; }
    if (inCodeBlock) continue;
    const m = line.match(/^(#{1,3})\s+(.+)/);
    if (!m) continue;
    flat.push({ title: m[2].trim(), level: m[1].length, anchor: slugify(m[2].trim()), children: [] });
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
