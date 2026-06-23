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

export function diffBlocks(oldText: string, newText: string): BlockDiff[] {
  const oldBlocks = splitBlocks(oldText);
  const newBlocks = splitBlocks(newText);

  if (newBlocks.length === 0) return [];

  // Use a multiset of old block contents. A new block is "unchanged" if its
  // exact content existed in the old document, regardless of position (handles
  // moved paragraphs). Only truly new or modified content is marked changed.
  const oldCount = new Map<string, number>();
  for (const b of oldBlocks) {
    oldCount.set(b, (oldCount.get(b) ?? 0) + 1);
  }

  return newBlocks.map(content => {
    const count = oldCount.get(content) ?? 0;
    if (count > 0) {
      oldCount.set(content, count - 1);
      return { content, changed: false };
    }
    return { content, changed: true };
  });
}
