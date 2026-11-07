import { describe, expect, it } from 'bun:test';
import { resolveMarkdownLinkPath } from '../../src/client/utils/md-link';

describe('resolveMarkdownLinkPath', () => {
  const currentFile = '/Users/huanghao/wiki/10-roadmaps/data-engineering-llm.md';

  it('resolves same-directory relative link', () => {
    expect(resolveMarkdownLinkPath('data-engineering-av.md', currentFile))
      .toBe('/Users/huanghao/wiki/10-roadmaps/data-engineering-av.md');
  });

  it('resolves relative link with subdirectory', () => {
    expect(resolveMarkdownLinkPath('../20-concepts/rlhf.md', currentFile))
      .toBe('/Users/huanghao/wiki/20-concepts/rlhf.md');
  });

  it('resolves absolute path link', () => {
    expect(resolveMarkdownLinkPath('/docs/other.md', currentFile))
      .toBe('/docs/other.md');
  });

  it('strips query string and hash from resolved path', () => {
    expect(resolveMarkdownLinkPath('other.md?v=1#section', currentFile))
      .toBe('/Users/huanghao/wiki/10-roadmaps/other.md');
  });

  it('returns null for http links', () => {
    expect(resolveMarkdownLinkPath('https://example.com/page.md', currentFile)).toBeNull();
  });

  it('returns null for anchor-only links', () => {
    expect(resolveMarkdownLinkPath('#section', currentFile)).toBeNull();
  });

  it('returns null for pdf:// links', () => {
    expect(resolveMarkdownLinkPath('pdf://some/file.pdf', currentFile)).toBeNull();
  });

  it('returns null for non-md links', () => {
    expect(resolveMarkdownLinkPath('image.png', currentFile)).toBeNull();
    expect(resolveMarkdownLinkPath('document.pdf', currentFile)).toBeNull();
  });

  it('returns null when currentFile is null', () => {
    expect(resolveMarkdownLinkPath('other.md', null)).toBeNull();
  });

  it('handles .markdown extension', () => {
    expect(resolveMarkdownLinkPath('notes.markdown', currentFile))
      .toBe('/Users/huanghao/wiki/10-roadmaps/notes.markdown');
  });

  it('href 为百分号编码的中文文件名时还原为真实路径', () => {
    const currentFile = '/Users/me/workspace/thoughts/rg与fd使用指南.md';
    expect(resolveMarkdownLinkPath('rg%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md', currentFile))
      .toBe('/Users/me/workspace/thoughts/rg使用指南.md');
    expect(resolveMarkdownLinkPath('fd%E4%BD%BF%E7%94%A8%E6%8C%87%E5%8D%97.md#x', currentFile))
      .toBe('/Users/me/workspace/thoughts/fd使用指南.md');
  });

  it('非法编码序列不抛错，原样保留', () => {
    expect(resolveMarkdownLinkPath('bad%E4.md', '/a/b.md')).toBe('/a/bad%E4.md');
  });
});
