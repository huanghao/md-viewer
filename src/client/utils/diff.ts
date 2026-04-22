// Myers diff 算法 — line-level diff
// 返回 DiffLine 数组，type: 'equal' | 'insert' | 'delete'

export interface DiffLine {
  type: 'equal' | 'insert' | 'delete';
  content: string;
  oldLineNo?: number;  // 原文件行号（1-based，equal/delete 有值）
  newLineNo?: number;  // 新文件行号（1-based，equal/insert 有值）
}

export function diffLines(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText === '' ? [] : oldText.split('\n');
  const newLines = newText === '' ? [] : newText.split('\n');
  const n = oldLines.length;
  const m = newLines.length;

  if (n === 0 && m === 0) return [];

  // Myers diff: 计算最短编辑路径，记录每步的 v 数组快照
  const max = n + m;
  const v: number[] = new Array(2 * max + 1).fill(0);
  const trace: number[][] = [];

  outer: for (let d = 0; d <= max; d++) {
    trace.push([...v]);
    for (let k = -d; k <= d; k += 2) {
      const idx = k + max;
      let x: number;
      if (k === -d || (k !== d && v[idx - 1] < v[idx + 1])) {
        x = v[idx + 1];
      } else {
        x = v[idx - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && oldLines[x] === newLines[y]) {
        x++;
        y++;
      }
      v[idx] = x;
      if (x >= n && y >= m) break outer;
    }
  }

  // 回溯：从终点 (n, m) 沿 trace 逆向重建 edit script
  // 每步 d：先确定 edit（insert/delete），再走 snake（equal）
  const ops: Array<{ type: 'equal' | 'insert' | 'delete'; oldIdx: number; newIdx: number }> = [];
  let x = n;
  let y = m;

  for (let d = trace.length - 1; d > 0; d--) {
    const vd = trace[d];
    const k = x - y;
    const idx = k + max;

    let prevK: number;
    if (k === -d || (k !== d && vd[idx - 1] < vd[idx + 1])) {
      prevK = k + 1;  // came from insert (moved down in y)
    } else {
      prevK = k - 1;  // came from delete (moved right in x)
    }

    const prevX = vd[prevK + max];
    const prevY = prevX - prevK;

    // snake from after the edit to (x, y) — all equal diagonal moves
    // After the edit: position is (prevX+1, prevY) for delete or (prevX, prevY+1) for insert
    const afterX = prevK === k - 1 ? prevX + 1 : prevX;
    const afterY = prevK === k + 1 ? prevY + 1 : prevY;
    while (x > afterX && y > afterY) {
      x--;
      y--;
      ops.unshift({ type: 'equal', oldIdx: x, newIdx: y });
    }

    // the single edit that got us from diagonal prevK to k
    if (prevK === k + 1) {
      // insert: came from k+1, meaning y was incremented
      ops.unshift({ type: 'insert', oldIdx: -1, newIdx: prevY });
    } else {
      // delete: came from k-1, meaning x was incremented
      ops.unshift({ type: 'delete', oldIdx: prevX, newIdx: -1 });
    }

    x = prevX;
    y = prevY;
  }

  // d=0: remaining diagonal moves (all equal, from (0,0) to (x,y))
  while (x > 0 && y > 0) {
    x--;
    y--;
    ops.unshift({ type: 'equal', oldIdx: x, newIdx: y });
  }

  // 转换为 DiffLine
  const result: DiffLine[] = [];
  let oldNo = 1;
  let newNo = 1;
  for (const op of ops) {
    if (op.type === 'equal') {
      result.push({ type: 'equal', content: oldLines[op.oldIdx], oldLineNo: oldNo++, newLineNo: newNo++ });
    } else if (op.type === 'delete') {
      result.push({ type: 'delete', content: oldLines[op.oldIdx], oldLineNo: oldNo++ });
    } else {
      result.push({ type: 'insert', content: newLines[op.newIdx], newLineNo: newNo++ });
    }
  }
  return result;
}
