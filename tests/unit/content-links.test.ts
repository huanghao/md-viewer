import { describe, expect, it } from 'bun:test';
import { parsePdfLink, waitForPdfViewer } from '../../src/client/content-links';

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

describe('waitForPdfViewer', () => {
  it('viewer 稍后登记时返回该 viewer', async () => {
    const viewer = { scrollToPage: () => {}, highlightQuote: () => {} };
    let calls = 0;
    const result = await waitForPdfViewer(() => (++calls >= 3 ? viewer : null), 2000, 5);
    expect(result).toBe(viewer);
    expect(calls).toBe(3);
  });

  it('超时仍未登记时返回 null', async () => {
    const result = await waitForPdfViewer(() => null, 30, 5);
    expect(result).toBeNull();
  });
});
