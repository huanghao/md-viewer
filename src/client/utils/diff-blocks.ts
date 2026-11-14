import { diffLines } from './diff';

export interface BlockDiff {
  content: string;
  changed: boolean;
  /** 表格块独有：变化的行下标。0 = 表头，1.. = 数据行（不含分隔行），与渲染后的 <tr> 顺序一致。 */
  changedRows?: number[];
  /** 列表块独有：变化的条目下标（含嵌套条目，按文档顺序，与渲染后的 <li> 顺序一致）及条目总数。 */
  changedItems?: number[];
  itemCount?: number;
  /** 代码围栏块独有：新增/修改的代码行下标（不含围栏行），与渲染后 <code> 内的行一致。 */
  changedLines?: number[];
  codeLineCount?: number;
  /** 引用块独有：内部子块的逐块 diff，与渲染后 <blockquote> 的直接子元素一致。 */
  children?: BlockDiff[];
}

// 列表起始行：`- `/`* `/`+ ` 或 `1. `/`1) `。要求标记后紧跟空格，避免误判 "---"（hr）或 "**加粗**"。
const LIST_ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s/;

function nextNonBlank(lines: string[], from: number): string | undefined {
  for (let i = from; i < lines.length; i++) if (lines[i].trim() !== '') return lines[i];
  return undefined;
}

export function splitBlocks(text: string): string[] {
  if (!text.trim()) return [];
  const lines = text.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let inFence = false;
  // current 是否正在累积一个列表：段落与紧邻（无空行）的列表之间，marked 会渲染成两个
  // 独立顶层元素（<p> + <ul>），splitBlocks 的分块边界需要与之对齐，否则段落 diff 渲染时
  // DOM 元素与 diff 块的下标会错位，导致后面所有块的高亮全部错位。
  let currentIsList = false;

  const flush = () => {
    if (current.length > 0) {
      blocks.push(current.join('\n'));
      current = [];
    }
    currentIsList = false;
  };

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    const isFenceBoundary = /^(`{3,}|~{3,})/.test(line);

    if (isFenceBoundary) {
      if (!inFence) {
        flush();
        inFence = true;
        current.push(line);
      } else {
        inFence = false;
        current.push(line);
        blocks.push(current.join('\n'));
        current = [];
      }
      continue;
    }

    if (inFence) {
      current.push(line);
      continue;
    }

    if (line.trim() === '') {
      // 列表内的空行（松散列表 / 条目内多段）：marked 仍渲染成同一个 <ul>，不能在这里切块
      if (currentIsList) {
        const next = nextNonBlank(lines, idx + 1);
        if (next !== undefined && (LIST_ITEM_RE.test(next) || /^\s+/.test(next))) {
          current.push(line);
          continue;
        }
      }
      flush();
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      flush();
      blocks.push(line);
      continue;
    }

    const isListStart = LIST_ITEM_RE.test(line);
    const isIndented = /^\s+/.test(line);

    if (current.length === 0) {
      current.push(line);
      currentIsList = isListStart;
    } else if (currentIsList && !isListStart && !isIndented) {
      // 列表 → 段落（无空行）：另起一块
      flush();
      current.push(line);
      currentIsList = false;
    } else if (!currentIsList && isListStart) {
      // 段落 → 列表（无空行）：另起一块
      flush();
      current.push(line);
      currentIsList = true;
    } else {
      current.push(line);
    }
  }

  flush();
  return blocks;
}

// 归一化 key：折叠所有空白（含换行）为单个空格，忽略纯换行重排（rewrap）造成的误判。
// 代码围栏块内空白有语义，保留原样比较。
function isFenceBlock(content: string): boolean {
  return /^(`{3,}|~{3,})/.test(content);
}

function normalizeKey(content: string): string {
  return content.replace(/\s+/g, ' ').trim();
}

const TABLE_SEP_RE = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/;

/** GFM 表格块 → 行文本（表头 + 数据行，去掉分隔行）；不是表格返回 null。 */
export function tableRows(block: string): string[] | null {
  const lines = block.split('\n');
  if (lines.length < 2 || !lines[0].includes('|') || !TABLE_SEP_RE.test(lines[1]) || !lines[1].includes('-')) return null;
  return [lines[0], ...lines.slice(2)];
}

/** 列表块 → 每个条目自身的文本（不含嵌套子条目以外的内容归属：续行归当前条目），按文档顺序；不是列表返回 null。 */
export function listItems(block: string): string[] | null {
  const lines = block.split('\n');
  if (!LIST_ITEM_RE.test(lines[0])) return null;
  const items: string[] = [];
  for (const line of lines) {
    const m = LIST_ITEM_RE.exec(line);
    if (m) items.push(line.slice(m[0].length));
    else if (line.trim() !== '') items[items.length - 1] += ' ' + line.trim();
  }
  return items;
}

/** 围栏代码块 → 代码行（不含围栏行）；不是围栏返回 null。 */
export function fenceBody(block: string): string[] | null {
  if (!isFenceBlock(block)) return null;
  const lines = block.split('\n');
  const open = lines[0].match(/^(`{3,}|~{3,})/)![1];
  const last = lines[lines.length - 1];
  const closed = lines.length > 1 && last.startsWith(open[0].repeat(open.length)) && last.trim().replace(/[`~]/g, '') === '';
  return lines.slice(1, closed ? -1 : undefined);
}

const QUOTE_RE = /^ {0,3}>/;

/** 引用块 → 去掉 `>` 前缀后拆出的子块；不是引用返回 null。 */
export function quoteBlocks(block: string): string[] | null {
  if (!QUOTE_RE.test(block)) return null;
  const inner = block.split('\n').map(l => l.replace(/^ {0,3}>[ \t]?/, '')).join('\n');
  return splitBlocks(inner);
}

function blockKey(content: string): string {
  return isFenceBlock(content) ? content : normalizeKey(content);
}

function bump(map: Map<string, number>, key: string): void {
  map.set(key, (map.get(key) ?? 0) + 1);
}

function take(map: Map<string, number>, key: string): boolean {
  const c = map.get(key) ?? 0;
  if (c <= 0) return false;
  map.set(key, c - 1);
  return true;
}

interface OldIndex {
  /** 所有层级（含引用内部）块内容的多重集合，用于引用子块比较 */
  deep: Map<string, number>;
  rows: Map<string, number>;
  items: Map<string, number>;
  fences: string[][];
}

function indexOld(blocks: string[], idx: OldIndex): void {
  for (const b of blocks) {
    bump(idx.deep, blockKey(b));
    for (const r of tableRows(b) ?? []) bump(idx.rows, normalizeKey(r));
    for (const it of listItems(b) ?? []) bump(idx.items, normalizeKey(it));
    const body = fenceBody(b);
    if (body) idx.fences.push(body);
    const inner = quoteBlocks(b);
    if (inner) indexOld(inner, idx);
  }
}

function changedCodeLines(body: string[], fences: string[][]): number[] | undefined {
  let best: string[] | null = null;
  let bestScore = 0;
  for (const f of fences) {
    const pool = new Map<string, number>();
    for (const l of f) bump(pool, l);
    let score = 0;
    for (const l of body) if (l.trim() !== '' && take(pool, l)) score++;
    if (score > bestScore) { bestScore = score; best = f; }
  }
  if (!best) return undefined;
  const changed: number[] = [];
  for (const d of diffLines(best.join('\n'), body.join('\n'))) {
    if (d.type === 'insert' && d.newLineNo !== undefined && d.content.trim() !== '') changed.push(d.newLineNo - 1);
  }
  return changed.length > 0 && changed.length < body.length ? changed : undefined;
}

/** 为已确定“变化”的块补充内部细节（表格行 / 列表条目 / 代码行 / 引用子块）。 */
function detailOf(content: string, idx: OldIndex): BlockDiff {
  const base: BlockDiff = { content, changed: true };

  const rows = tableRows(content);
  if (rows) {
    const changedRows: number[] = [];
    rows.forEach((r, i) => { if (!take(idx.rows, normalizeKey(r))) changedRows.push(i); });
    return { ...base, changedRows };
  }

  const items = listItems(content);
  if (items) {
    const changedItems: number[] = [];
    items.forEach((it, i) => { if (!take(idx.items, normalizeKey(it))) changedItems.push(i); });
    return { ...base, changedItems, itemCount: items.length };
  }

  const body = fenceBody(content);
  if (body) {
    const changedLines = changedCodeLines(body, idx.fences);
    return changedLines ? { ...base, changedLines, codeLineCount: body.length } : base;
  }

  const inner = quoteBlocks(content);
  if (inner) {
    const children = inner.map<BlockDiff>(c =>
      take(idx.deep, blockKey(c)) ? { content: c, changed: false } : detailOf(c, idx));
    return { ...base, children };
  }

  return base;
}

export function diffBlocks(oldText: string, newText: string): BlockDiff[] {
  const oldBlocks = splitBlocks(oldText);
  const newBlocks = splitBlocks(newText);

  if (newBlocks.length === 0) return [];

  // Use a multiset of old block contents. A new block is "unchanged" if its
  // (normalized) content existed in the old document, regardless of position
  // (handles moved paragraphs and pure rewrap/whitespace changes). Only
  // truly new or modified content is marked changed.
  const oldCount = new Map<string, number>();
  for (const b of oldBlocks) bump(oldCount, blockKey(b));

  // 旧文档内部元素索引：块变化时，按表格行 / 列表条目 / 代码行 / 引用子块判断具体哪里变了
  const idx: OldIndex = { deep: new Map(), rows: new Map(), items: new Map(), fences: [] };
  indexOld(oldBlocks, idx);

  return newBlocks.map(content => {
    if (take(oldCount, blockKey(content))) return { content, changed: false };
    return detailOf(content, idx);
  });
}
