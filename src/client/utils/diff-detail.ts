import type { BlockDiff } from './diff-blocks';

const BLOCK_SEL = 'p,h1,h2,h3,h4,h5,h6,ul,ol,pre,blockquote,hr,table';

/**
 * 把（可能带 hljs span 的）代码 HTML 按换行拆成行；跨行的 span 在行尾关闭、下一行重新打开，
 * 保证每行 HTML 自身是平衡的。文本里的 `\n` 不会出现在标签中，hljs 只产出 <span>。
 */
export function splitHtmlLines(html: string): string[] {
  const lines: string[] = [];
  const open: string[] = [];
  let cur = '';
  for (const tok of html.match(/<\/?span[^>]*>|\n|[^<\n]+|</g) ?? []) {
    if (tok === '\n') {
      lines.push(cur + '</span>'.repeat(open.length));
      cur = open.join('');
    } else if (tok.startsWith('</')) {
      open.pop();
      cur += tok;
    } else if (tok.startsWith('<span')) {
      open.push(tok);
      cur += tok;
    } else {
      cur += tok;
    }
  }
  if (cur.replace(/<[^>]*>/g, '') !== '') lines.push(cur);
  return lines;
}

/** 代码块逐行标记：每行包一层 display:block 的 span（行尾换行留在 span 内，textContent 不变）。 */
function markCodeLines(pre: HTMLElement, block: BlockDiff): void {
  const code = pre.querySelector('code');
  const changed = new Set(block.changedLines);
  if (!code || !block.changedLines) return;
  const lines = splitHtmlLines(code.innerHTML);
  if (lines.length !== block.codeLineCount) return; // 与源码行数对不上就放弃，保留整块标记
  code.innerHTML = lines
    .map((l, i) => `<span class="diff-code-line${changed.has(i) ? ' diff-code-line-changed' : ''}">${l}\n</span>`)
    .join('');
  pre.classList.add('diff-detail');
}

function blockChildren(el: HTMLElement): HTMLElement[] {
  return Array.from(el.children).filter(c => c.matches(BLOCK_SEL)) as HTMLElement[];
}

/**
 * 变化块的内部细节标记：表格行 / 列表条目 / 代码行 / 引用子块。
 * 与渲染结果对不上（数量不一致）时什么都不做，退化为整块标记。
 * 成功标出细节的容器加 `diff-detail`，样式上不再画整块竖线。
 */
export function applyBlockDetail(el: HTMLElement, block: BlockDiff): void {
  if (!block.changed) return;
  const tag = el.tagName;

  if (block.changedRows && tag === 'TABLE') {
    el.classList.add('diff-detail');
    const trs = el.querySelectorAll<HTMLElement>('tr');
    for (const r of block.changedRows) trs[r]?.classList.add('diff-row-changed');
  } else if (block.changedItems && (tag === 'UL' || tag === 'OL')) {
    const lis = el.querySelectorAll<HTMLElement>('li');
    if (lis.length !== block.itemCount) return;
    el.classList.add('diff-detail');
    for (const i of block.changedItems) lis[i]?.classList.add('diff-item-changed');
  } else if (block.changedLines && tag === 'PRE') {
    markCodeLines(el, block);
  } else if (block.children && tag === 'BLOCKQUOTE') {
    const els = blockChildren(el);
    if (els.length !== block.children.length) return;
    el.classList.add('diff-detail');
    block.children.forEach((child, i) => {
      if (!child.changed) return;
      const sub = els[i];
      applyBlockDetail(sub, child);
      if (!sub.classList.contains('diff-detail')) sub.classList.add('diff-child-changed');
    });
  }
}
