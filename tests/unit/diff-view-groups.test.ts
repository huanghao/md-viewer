import { describe, it, expect } from 'bun:test';
import { buildDiffGroups } from '../../src/client/diff-view';

type DL = { type: 'equal' | 'insert' | 'delete'; content: string };
const eq  = (content: string): DL => ({ type: 'equal',  content });
const ins = (content: string): DL => ({ type: 'insert', content });
const del = (content: string): DL => ({ type: 'delete', content });

// 把 DiffLine 数组转成 Segment，与 renderInlineDiffHTML 的内部逻辑一致
function toSegments(lines: DL[]) {
  type Seg =
    | { kind: 'equal';  lines: DL[] }
    | { kind: 'delete'; lines: DL[] }
    | { kind: 'insert'; lines: DL[] }
    | { kind: 'modify'; delLines: DL[]; insLines: DL[] };

  const segs: Seg[] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.type === 'equal') {
      const batch: DL[] = [];
      while (i < lines.length && lines[i].type === 'equal') batch.push(lines[i++]);
      segs.push({ kind: 'equal', lines: batch });
    } else if (l.type === 'delete') {
      const delBatch: DL[] = [];
      while (i < lines.length && lines[i].type === 'delete') delBatch.push(lines[i++]);
      if (i < lines.length && lines[i].type === 'insert') {
        const insBatch: DL[] = [];
        while (i < lines.length && lines[i].type === 'insert') insBatch.push(lines[i++]);
        segs.push({ kind: 'modify', delLines: delBatch, insLines: insBatch });
      } else {
        segs.push({ kind: 'delete', lines: delBatch });
      }
    } else {
      const batch: DL[] = [];
      while (i < lines.length && lines[i].type === 'insert') batch.push(lines[i++]);
      segs.push({ kind: 'insert', lines: batch });
    }
  }
  return segs;
}

describe('buildDiffGroups', () => {
  it('单一变更段 → 一个 hasChange group', () => {
    const groups = buildDiffGroups(toSegments([del('old'), ins('new')]));
    expect(groups.filter(g => g.hasChange)).toHaveLength(1);
  });

  it('两个变更段之间有空行 → 合并为一个 group', () => {
    const lines = [
      del('old para 1'), ins('new para 1'),
      eq(''),            // 段落分隔空行
      del('old para 2'), ins('new para 2'),
    ];
    const groups = buildDiffGroups(toSegments(lines));
    const changed = groups.filter(g => g.hasChange);
    expect(changed).toHaveLength(1);
    expect(changed[0].segments).toHaveLength(3); // modify, equal(空行), modify
  });

  it('两个变更段之间有实质内容 equal 行 → 不合并', () => {
    const lines = [
      del('old a'), ins('new a'),
      eq('unchanged context line'),
      del('old b'), ins('new b'),
    ];
    const groups = buildDiffGroups(toSegments(lines));
    expect(groups.filter(g => g.hasChange)).toHaveLength(2);
  });

  it('三个变更段连续两个空行分隔 → 全部合并为一个 group', () => {
    const lines = [
      del('a'), ins('A'),
      eq(''), eq(''),
      del('b'), ins('B'),
      eq(''),
      del('c'), ins('C'),
    ];
    const groups = buildDiffGroups(toSegments(lines));
    expect(groups.filter(g => g.hasChange)).toHaveLength(1);
  });

  it('变更段前面有内容 equal 行 → equal 不合并进 group', () => {
    const lines = [
      eq('preamble'),
      del('x'), ins('y'),
    ];
    const groups = buildDiffGroups(toSegments(lines));
    expect(groups.filter(g => !g.hasChange)).toHaveLength(1);
    expect(groups.filter(g => g.hasChange)).toHaveLength(1);
  });

  it('无任何变更 → 只有 equal group', () => {
    const groups = buildDiffGroups(toSegments([eq('same')]));
    expect(groups.filter(g => g.hasChange)).toHaveLength(0);
    expect(groups.filter(g => !g.hasChange)).toHaveLength(1);
  });
});
