export interface BlockDiff {
  content: string;
  changed: boolean;
}

// 列表起始行：`- `/`* `/`+ ` 或 `1. `/`1) `。要求标记后紧跟空格，避免误判 "---"（hr）或 "**加粗**"。
const LIST_ITEM_RE = /^(\s*)([-*+]|\d+[.)])\s/;

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

  for (const line of lines) {
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

export function diffBlocks(oldText: string, newText: string): BlockDiff[] {
  const oldBlocks = splitBlocks(oldText);
  const newBlocks = splitBlocks(newText);

  if (newBlocks.length === 0) return [];

  // Use a multiset of old block contents. A new block is "unchanged" if its
  // (normalized) content existed in the old document, regardless of position
  // (handles moved paragraphs and pure rewrap/whitespace changes). Only
  // truly new or modified content is marked changed.
  const oldCount = new Map<string, number>();
  for (const b of oldBlocks) {
    const key = isFenceBlock(b) ? b : normalizeKey(b);
    oldCount.set(key, (oldCount.get(key) ?? 0) + 1);
  }

  return newBlocks.map(content => {
    const key = isFenceBlock(content) ? content : normalizeKey(content);
    const count = oldCount.get(key) ?? 0;
    if (count > 0) {
      oldCount.set(key, count - 1);
      return { content, changed: false };
    }
    return { content, changed: true };
  });
}
