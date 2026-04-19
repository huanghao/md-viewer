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

export async function resolvePdfOutlinePageNums(
  items: TocItem[],
  dests: ({ num: number; gen: number } | null)[],
  pdfDoc: { getPageIndex(ref: { num: number; gen: number }): Promise<number> }
): Promise<void> {
  let idx = 0;
  async function walk(nodes: TocItem[]) {
    for (const node of nodes) {
      const dest = dests[idx++];
      if (dest != null && typeof dest === 'object' && 'num' in dest) {
        try {
          node.pageNum = (await pdfDoc.getPageIndex(dest as { num: number; gen: number })) + 1;
        } catch { /* dest 无法解析，保持 undefined */ }
      }
      await walk(node.children);
    }
  }
  await walk(items);
}

// sidecar 文件路径约定：foo.pdf.toc.json
export function sidecarPath(pdfPath: string): string {
  return pdfPath + '.toc.json';
}

export async function loadSidecar(pdfPath: string): Promise<TocItem[] | null> {
  try {
    const res = await fetch(`/api/file?path=${encodeURIComponent(sidecarPath(pdfPath))}`);
    if (!res.ok) return null;
    return JSON.parse(await res.text()) as TocItem[];
  } catch { return null; }
}

export async function saveSidecar(pdfPath: string, toc: TocItem[]): Promise<void> {
  await fetch('/api/file-write', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: sidecarPath(pdfPath), content: JSON.stringify(toc, null, 2) }),
  });
}

// 逐页扫描 PDF 标题，onProgress 每扫完一页回调一次（增量更新 UI 用）
export async function scanPdfHeadings(
  pdfPath: string,
  getTextBlocks: (pageNum: number) => Array<{ text: string; height: number; y: number }>,
  totalPages: number,
  onProgress: (toc: TocItem[]) => void
): Promise<TocItem[]> {
  const flat: TocItem[] = [];

  for (let page = 1; page <= totalPages; page++) {
    const blocks = getTextBlocks(page);
    for (const block of blocks) {
      // 利用 classifyPageItems 的结果：height 相对于中位数
      // 这里用简化启发式：height > 14 认为是标题
      if (block.height >= 14 && block.text.trim().length > 0 && block.text.trim().length < 120) {
        const level = block.height >= 18 ? 1 : 2;
        flat.push({ title: block.text.trim(), level, pageNum: page, children: [] });
      }
    }
    onProgress(buildTree([...flat]));
  }

  const toc = buildTree(flat);
  await saveSidecar(pdfPath, toc);
  return toc;
}
