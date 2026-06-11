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

  const n = oldBlocks.length;
  const m = newBlocks.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      if (oldBlocks[i - 1] === newBlocks[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const matchedNew = new Set<number>();
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (oldBlocks[i - 1] === newBlocks[j - 1]) {
      matchedNew.add(j - 1);
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--;
    } else {
      j--;
    }
  }

  return newBlocks.map((content, idx) => ({
    content,
    changed: !matchedNew.has(idx),
  }));
}
