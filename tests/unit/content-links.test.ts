import { describe, expect, it } from 'bun:test';
import { parsePdfLink } from '../../src/client/content-links';

describe('parsePdfLink', () => {
  it('解析路径、页码与引文', () => {
    expect(parsePdfLink('pdf:///a/b.pdf#page=3&quote=some+text')).toEqual({
      filePath: '/a/b.pdf',
      page: 3,
      quote: 'some text',
    });
  });

  it('没有 hash 时默认第 1 页、无引文', () => {
    expect(parsePdfLink('pdf:///a/b.pdf')).toEqual({ filePath: '/a/b.pdf', page: 1, quote: '' });
  });

  it('非 pdf:// 链接返回 null', () => {
    expect(parsePdfLink('https://example.com/a.pdf')).toBeNull();
    expect(parsePdfLink('./local.md')).toBeNull();
  });
});
