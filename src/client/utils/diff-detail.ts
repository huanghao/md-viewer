import type { BlockDiff } from './diff-blocks';
import { pickBestOld, wordDiffRanges } from './word-diff';

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

// ── 段落/列表条目内的词级高亮 ──────────────────────────────────────────────

/** 单元自身的文本节点：不进入嵌套列表、引用、代码块（它们有各自的单元）。 */
function ownTextNodes(el: HTMLElement): Text[] {
  const out: Text[] = [];
  const walk = (node: Node) => {
    for (const child of Array.from(node.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) out.push(child as Text);
      else if (child.nodeType === Node.ELEMENT_NODE) {
        const c = child as HTMLElement;
        if (c.matches('ul,ol,blockquote,pre,table,.katex,.katex-display')) continue;
        walk(c);
      }
    }
  };
  walk(el);
  return out;
}

/** 旧文档渲染结果里的候选文本：所有段落 + 列表条目自身文本。 */
export function collectOldTexts(oldRoot: HTMLElement): string[] {
  const texts: string[] = [];
  oldRoot.querySelectorAll<HTMLElement>('p, li').forEach(el => {
    const t = ownTextNodes(el).map(n => n.data).join('').trim();
    if (t) texts.push(t);
  });
  return texts;
}

function wrapRanges(nodes: Text[], ranges: Array<[number, number]>): void {
  let offset = 0;
  for (const node of nodes) {
    const start = offset, end = offset + node.data.length;
    offset = end;
    const local = ranges
      .map(([s, e]) => [Math.max(s, start) - start, Math.min(e, end) - start] as [number, number])
      .filter(([s, e]) => e > s);
    if (local.length === 0) continue;
    const frag = document.createDocumentFragment();
    let pos = 0;
    for (const [s, e] of local) {
      if (s > pos) frag.appendChild(document.createTextNode(node.data.slice(pos, s)));
      const mark = document.createElement('span');
      mark.className = 'diff-word-changed';
      mark.textContent = node.data.slice(s, e);
      frag.appendChild(mark);
      pos = e;
    }
    if (pos < node.data.length) frag.appendChild(document.createTextNode(node.data.slice(pos)));
    node.replaceWith(frag);
  }
}

/** 变化块里的“文字单元”：自身是段落，或其中已标记为变化的条目 / 引用子段落。 */
export function wordTargets(blockEl: HTMLElement): HTMLElement[] {
  if (blockEl.tagName === 'P') return [blockEl];
  return Array.from(blockEl.querySelectorAll<HTMLElement>('li.diff-item-changed, p.diff-child-changed'));
}

/** 对每个单元找最像的旧文本，只高亮新增/修改的词；找不到相近旧文本就保持整段标记。 */
export function markChangedWords(units: HTMLElement[], oldTexts: string[]): void {
  for (const el of units) {
    const nodes = ownTextNodes(el);
    const text = nodes.map(n => n.data).join('');
    if (!text.trim()) continue;
    const old = pickBestOld(text, oldTexts);
    if (old === null) continue;
    const ranges = wordDiffRanges(old, text);
    if (!ranges || ranges.length === 0) continue;
    wrapRanges(nodes, ranges);
  }
}
