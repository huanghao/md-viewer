export interface BlockDiff {
  content: string;
  changed: boolean;
}

export function splitBlocks(text: string): string[] {
  if (!text.trim()) return [];
  const lines = text.split('\n');
  const blocks: string[] = [];
  let current: string[] = [];
  let inFence = false;

  for (const line of lines) {
    const isFenceBoundary = /^(`{3,}|~{3,})/.test(line);

    if (isFenceBoundary) {
      if (!inFence) {
        if (current.length > 0) {
          blocks.push(current.join('\n'));
          current = [];
        }
        inFence = true;
        current.push(line);
      } else {
        inFence = false;
        current.push(line);
        blocks.push(current.join('\n'));
        current = [];
      }
    } else if (inFence) {
      current.push(line);
    } else if (line.trim() === '') {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }
    } else if (/^#{1,6}\s/.test(line)) {
      if (current.length > 0) {
        blocks.push(current.join('\n'));
        current = [];
      }
      blocks.push(line);
    } else {
      current.push(line);
    }
  }

  if (current.length > 0) blocks.push(current.join('\n'));
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
