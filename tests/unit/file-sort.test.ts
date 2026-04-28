import { describe, expect, it } from 'bun:test';
import { compareFileNames } from '../../src/client/utils/file-sort';

describe('compareFileNames', () => {
  it('sorts pure ASCII alphabetically (case-insensitive)', () => {
    const files = ['banana.md', 'Apple.md', 'cherry.md'];
    expect(files.sort(compareFileNames)).toEqual(['Apple.md', 'banana.md', 'cherry.md']);
  });

  it('sorts numbers numerically, not lexicographically', () => {
    const files = ['file10.md', 'file2.md', 'file1.md'];
    expect(files.sort(compareFileNames)).toEqual(['file1.md', 'file2.md', 'file10.md']);
  });

  it('sorts mixed name+number naturally', () => {
    const files = ['chapter9.md', 'chapter10.md', 'chapter2.md'];
    expect(files.sort(compareFileNames)).toEqual(['chapter2.md', 'chapter9.md', 'chapter10.md']);
  });

  it('places ASCII before CJK', () => {
    const files = ['设计.md', 'README.md', '架构.md'];
    expect(files.sort(compareFileNames)).toEqual(['README.md', '架构.md', '设计.md']);
  });

  it('sorts CJK by zh-CN locale', () => {
    const files = ['设计.md', '架构.md', '测试.md'];
    const sorted = files.sort(compareFileNames);
    // All CJK, just verify stable relative order consistent with localeCompare zh-CN
    expect(sorted).toEqual([...files].sort((a, b) =>
      a.toLowerCase().localeCompare(b.toLowerCase(), 'zh-CN', { sensitivity: 'base' })
    ));
  });

  it('returns 0 for identical names', () => {
    expect(compareFileNames('foo.md', 'foo.md')).toBe(0);
  });

  it('shorter name comes first when it is a prefix', () => {
    expect(compareFileNames('file', 'file2')).toBeLessThan(0);
    expect(compareFileNames('file2', 'file')).toBeGreaterThan(0);
  });

  it('handles pure numeric names', () => {
    const files = ['10', '2', '1', '20'];
    expect(files.sort(compareFileNames)).toEqual(['1', '2', '10', '20']);
  });
});
