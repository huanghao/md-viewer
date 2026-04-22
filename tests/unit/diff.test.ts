import { describe, expect, it } from 'bun:test';
import { diffLines } from '../../src/client/utils/diff';

// Helper: count lines by type
function counts(result: ReturnType<typeof diffLines>) {
  return {
    equal: result.filter(l => l.type === 'equal').length,
    insert: result.filter(l => l.type === 'insert').length,
    delete: result.filter(l => l.type === 'delete').length,
  };
}

// Helper: reconstruct old/new text from diff
function reconstruct(result: ReturnType<typeof diffLines>) {
  const old = result.filter(l => l.type === 'equal' || l.type === 'delete').map(l => l.content);
  const newText = result.filter(l => l.type === 'equal' || l.type === 'insert').map(l => l.content);
  return { old: old.join('\n'), new: newText.join('\n') };
}

describe('diffLines', () => {
  describe('edge cases', () => {
    it('both empty', () => {
      expect(diffLines('', '')).toEqual([]);
    });

    it('old empty → all inserts', () => {
      const result = diffLines('', 'a\nb\nc');
      expect(counts(result)).toEqual({ equal: 0, insert: 3, delete: 0 });
      result.forEach((l, i) => {
        expect(l.type).toBe('insert');
        expect(l.newLineNo).toBe(i + 1);
        expect(l.oldLineNo).toBeUndefined();
      });
    });

    it('new empty → all deletes', () => {
      const result = diffLines('a\nb\nc', '');
      expect(counts(result)).toEqual({ equal: 0, insert: 0, delete: 3 });
      result.forEach((l, i) => {
        expect(l.type).toBe('delete');
        expect(l.oldLineNo).toBe(i + 1);
        expect(l.newLineNo).toBeUndefined();
      });
    });

    it('identical text → all equal', () => {
      const text = 'line1\nline2\nline3';
      const result = diffLines(text, text);
      expect(counts(result)).toEqual({ equal: 3, insert: 0, delete: 0 });
      result.forEach((l, i) => {
        expect(l.type).toBe('equal');
        expect(l.oldLineNo).toBe(i + 1);
        expect(l.newLineNo).toBe(i + 1);
      });
    });

    it('single line identical', () => {
      const result = diffLines('hello', 'hello');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: 'equal', content: 'hello', oldLineNo: 1, newLineNo: 1 });
    });

    it('single line changed → delete + insert', () => {
      const result = diffLines('old', 'new');
      expect(counts(result)).toEqual({ equal: 0, insert: 1, delete: 1 });
    });
  });

  describe('line numbers', () => {
    it('equal lines get consecutive oldLineNo and newLineNo', () => {
      const result = diffLines('a\nb\nc', 'a\nb\nc');
      const nos = result.map(l => ({ old: l.oldLineNo, new: l.newLineNo }));
      expect(nos).toEqual([
        { old: 1, new: 1 },
        { old: 2, new: 2 },
        { old: 3, new: 3 },
      ]);
    });

    it('inserts only increment newLineNo', () => {
      const result = diffLines('a\nc', 'a\nb\nc');
      const insert = result.find(l => l.type === 'insert')!;
      expect(insert.newLineNo).toBe(2);
      expect(insert.oldLineNo).toBeUndefined();
      const lastEqual = result.filter(l => l.type === 'equal').at(-1)!;
      expect(lastEqual.oldLineNo).toBe(2);
      expect(lastEqual.newLineNo).toBe(3);
    });

    it('deletes only increment oldLineNo', () => {
      const result = diffLines('a\nb\nc', 'a\nc');
      const del = result.find(l => l.type === 'delete')!;
      expect(del.oldLineNo).toBe(2);
      expect(del.newLineNo).toBeUndefined();
      const lastEqual = result.filter(l => l.type === 'equal').at(-1)!;
      expect(lastEqual.oldLineNo).toBe(3);
      expect(lastEqual.newLineNo).toBe(2);
    });

    it('oldLineNo covers all old lines, newLineNo covers all new lines', () => {
      const old = 'a\nb\nc\nd';
      const newText = 'a\nX\nc\nY\nd';
      const result = diffLines(old, newText);
      const oldNos = result.filter(l => l.oldLineNo != null).map(l => l.oldLineNo!).sort((a, b) => a - b);
      const newNos = result.filter(l => l.newLineNo != null).map(l => l.newLineNo!).sort((a, b) => a - b);
      expect(oldNos).toEqual([1, 2, 3, 4]);
      expect(newNos).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('content correctness', () => {
    it('reconstructed old/new matches original', () => {
      const old = 'line1\nline2\nline3\nline4';
      const newText = 'line1\nlineX\nline3\nlineY\nline4';
      const result = diffLines(old, newText);
      const { old: gotOld, new: gotNew } = reconstruct(result);
      expect(gotOld).toBe(old);
      expect(gotNew).toBe(newText);
    });

    it('insert at beginning', () => {
      const result = diffLines('b\nc', 'a\nb\nc');
      const { old: gotOld, new: gotNew } = reconstruct(result);
      expect(gotOld).toBe('b\nc');
      expect(gotNew).toBe('a\nb\nc');
      expect(result[0].type).toBe('insert');
      expect(result[0].content).toBe('a');
    });

    it('insert at end', () => {
      const result = diffLines('a\nb', 'a\nb\nc');
      const { old: gotOld, new: gotNew } = reconstruct(result);
      expect(gotOld).toBe('a\nb');
      expect(gotNew).toBe('a\nb\nc');
      expect(result.at(-1)!.type).toBe('insert');
      expect(result.at(-1)!.content).toBe('c');
    });

    it('delete at beginning', () => {
      const result = diffLines('a\nb\nc', 'b\nc');
      expect(result[0].type).toBe('delete');
      expect(result[0].content).toBe('a');
    });

    it('delete at end', () => {
      const result = diffLines('a\nb\nc', 'a\nb');
      expect(result.at(-1)!.type).toBe('delete');
      expect(result.at(-1)!.content).toBe('c');
    });

    it('multiple consecutive inserts', () => {
      const result = diffLines('a\nd', 'a\nb\nc\nd');
      const inserts = result.filter(l => l.type === 'insert');
      expect(inserts.map(l => l.content)).toEqual(['b', 'c']);
      expect(inserts[0].newLineNo).toBe(2);
      expect(inserts[1].newLineNo).toBe(3);
    });

    it('multiple consecutive deletes', () => {
      const result = diffLines('a\nb\nc\nd', 'a\nd');
      const deletes = result.filter(l => l.type === 'delete');
      expect(deletes.map(l => l.content)).toEqual(['b', 'c']);
    });

    it('complete replacement', () => {
      const result = diffLines('a\nb\nc', 'x\ny\nz');
      expect(counts(result)).toEqual({ equal: 0, insert: 3, delete: 3 });
      const { old: gotOld, new: gotNew } = reconstruct(result);
      expect(gotOld).toBe('a\nb\nc');
      expect(gotNew).toBe('x\ny\nz');
    });
  });

  describe('realistic diffs', () => {
    it('function rename in middle of file', () => {
      const old = ['function foo() {', '  return 1;', '}', '', 'function bar() {', '  return 2;', '}'].join('\n');
      const newText = ['function foo() {', '  return 1;', '}', '', 'function baz() {', '  return 2;', '}'].join('\n');
      const result = diffLines(old, newText);
      const { old: gotOld, new: gotNew } = reconstruct(result);
      expect(gotOld).toBe(old);
      expect(gotNew).toBe(newText);
      const changed = result.filter(l => l.type !== 'equal');
      expect(changed.some(l => l.content.includes('bar'))).toBe(true);
      expect(changed.some(l => l.content.includes('baz'))).toBe(true);
    });

    it('empty lines preserved', () => {
      const old = 'a\n\nb\n\nc';
      const newText = 'a\n\nB\n\nc';
      const result = diffLines(old, newText);
      const { old: gotOld, new: gotNew } = reconstruct(result);
      expect(gotOld).toBe(old);
      expect(gotNew).toBe(newText);
    });

    it('no spurious equal lines (diff is minimal in line count)', () => {
      // one-line change: should have exactly 1 delete + 1 insert, rest equal
      const lines = Array.from({ length: 10 }, (_, i) => `line${i + 1}`);
      const newLines = [...lines];
      newLines[4] = 'CHANGED';
      const result = diffLines(lines.join('\n'), newLines.join('\n'));
      expect(counts(result)).toEqual({ equal: 9, insert: 1, delete: 1 });
    });
  });
});
