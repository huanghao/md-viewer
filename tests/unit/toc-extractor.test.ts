import { describe, expect, it } from 'bun:test';
import { extractMdToc } from '../../src/client/toc-extractor';

describe('extractMdToc', () => {
  it('extracts h1/h2/h3 headings', () => {
    const md = `# Title\n\nsome text\n\n## Section 1\n\n### Sub 1.1\n\n## Section 2\n`;
    const toc = extractMdToc(md);
    expect(toc).toEqual([
      { title: 'Title', level: 1, anchor: 'title', children: [
        { title: 'Section 1', level: 2, anchor: 'section-1', children: [
          { title: 'Sub 1.1', level: 3, anchor: 'sub-11', children: [] }
        ]},
        { title: 'Section 2', level: 2, anchor: 'section-2', children: [] }
      ]}
    ]);
  });

  it('returns empty array for content with no headings', () => {
    expect(extractMdToc('just some text\n\nno headings here')).toEqual([]);
  });

  it('ignores headings inside code blocks', () => {
    const md = '# Real\n\n```\n# Fake\n```\n\n## Also Real\n';
    const toc = extractMdToc(md);
    expect(toc.length).toBe(1);
    expect(toc[0].children.length).toBe(1);
    expect(toc[0].children[0].title).toBe('Also Real');
  });

  it('handles Chinese headings with Unicode-aware slugify', () => {
    const md = '# 用法\n\n## 安装\n';
    const toc = extractMdToc(md);
    expect(toc).toEqual([
      { title: '用法', level: 1, anchor: '用法', children: [
        { title: '安装', level: 2, anchor: '安装', children: [] }
      ]}
    ]);
  });

  it('deduplicates anchor names for duplicate headings', () => {
    const md = '## Usage\n\nSome text\n\n## Usage\n';
    const toc = extractMdToc(md);
    expect(toc).toEqual([
      { title: 'Usage', level: 2, anchor: 'usage', children: [] },
      { title: 'Usage', level: 2, anchor: 'usage-1', children: [] }
    ]);
  });
});
