import { describe, it, expect } from 'bun:test';
import { wordDiffRanges, pickBestOld } from '../../src/client/utils/word-diff';

const pick = (text: string, ranges: Array<[number, number]>) => ranges.map(([s, e]) => text.slice(s, e));

describe('wordDiffRanges', () => {
  it('英文：只标出改动的词', () => {
    const oldT = 'The quick brown fox jumps over the lazy dog today';
    const newT = 'The quick red fox jumps over the lazy dog today';
    const r = wordDiffRanges(oldT, newT)!;
    expect(pick(newT, r)).toEqual(['red']);
  });
  it('中文：标出新增的短语', () => {
    const oldT = '这个功能会在后台运行并定期清理缓存文件。';
    const newT = '这个功能会在后台运行并每天凌晨定期清理缓存文件。';
    const r = wordDiffRanges(oldT, newT)!;
    expect(pick(newT, r).join('')).toContain('每天凌晨');
    expect(pick(newT, r).join('').length).toBeLessThan(8);
  });
  it('完全相同返回空数组', () => {
    expect(wordDiffRanges('a b c d e f', 'a b c d e f')).toEqual([]);
  });
  it('太不相似返回 null', () => {
    expect(wordDiffRanges('alpha beta gamma delta', 'one two three four five six')).toBeNull();
  });
});

describe('pickBestOld', () => {
  it('选最相近的旧文本，没有相近的返回 null', () => {
    const olds = ['完全无关的一段话', 'The quick brown fox jumps over the lazy dog'];
    expect(pickBestOld('The quick red fox jumps over the lazy dog', olds)).toBe(olds[1]);
    expect(pickBestOld('zzz yyy xxx www', olds)).toBeNull();
  });
});
