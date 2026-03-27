// Myers diff 算法 — line-level diff
// 返回 DiffLine 数组，type: 'equal' | 'insert' | 'delete'

export interface DiffLine {
  type: 'equal' | 'insert' | 'delete';
  content: string;
  oldLineNo?: number;  // 原文件行号（1-based，equal/delete 有值）
  newLineNo?: number;  // 新文件行号（1-based，equal/insert 有值）
}

export function diffLines(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const n = oldLines.length;
  const m = newLines.length;

  if (n === 0 && m === 0) return [];

  // Myers diff: 计算最短编辑路径
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

  // 回溯路径
  const ops: Array<{ type: 'equal' | 'insert' | 'delete'; x: number; y: number }> = [];
  let x = n;
  let y = m;
  for (let d = trace.length - 1; d >= 0 && (x > 0 || y > 0); d--) {
    const vd = trace[d];
    const k = x - y;
    const idx = k + max;
    let prevK: number;
    if (k === -d || (k !== d && vd[idx - 1] < vd[idx + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = vd[prevK + max];
    const prevY = prevX - prevK;

    while (x > prevX + 1 && y > prevY + 1) {
      ops.unshift({ type: 'equal', x: x - 1, y: y - 1 });
      x--;
      y--;
    }
    if (d > 0) {
      if (x === prevX + 1 && y === prevY + 1 && prevX >= 0 && prevY >= 0 &&
          oldLines[prevX] === newLines[prevY]) {
        ops.unshift({ type: 'equal', x: prevX, y: prevY });
      } else if (x > prevX) {
        ops.unshift({ type: 'delete', x: prevX, y: -1 });
      } else {
        ops.unshift({ type: 'insert', x: -1, y: prevY });
      }
    }
    x = prevX;
    y = prevY;
  }

  // 转换为 DiffLine
  const result: DiffLine[] = [];
  let oldNo = 1;
  let newNo = 1;
  for (const op of ops) {
    if (op.type === 'equal') {
      result.push({ type: 'equal', content: oldLines[op.x], oldLineNo: oldNo++, newLineNo: newNo++ });
    } else if (op.type === 'delete') {
      result.push({ type: 'delete', content: oldLines[op.x], oldLineNo: oldNo++ });
    } else {
      result.push({ type: 'insert', content: newLines[op.y], newLineNo: newNo++ });
    }
  }
  return result;
}
