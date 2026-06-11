import { describe, it, expect } from 'bun:test';
import { splitBlocks } from '../../src/client/utils/diff-blocks';

describe('splitBlocks', () => {
  it('empty string → []', () => {
    expect(splitBlocks('')).toEqual([]);
    expect(splitBlocks('   \n  ')).toEqual([]);
  });

  it('single paragraph', () => {
    expect(splitBlocks('hello world')).toEqual(['hello world']);
  });

  it('two paragraphs separated by blank line', () => {
    expect(splitBlocks('para one\n\npara two')).toEqual(['para one', 'para two']);
  });

  it('multiple blank lines count as one separator', () => {
    expect(splitBlocks('a\n\n\n\nb')).toEqual(['a', 'b']);
  });

  it('heading is its own block even without blank line before', () => {
    expect(splitBlocks('intro\n# Title\nafter')).toEqual(['intro', '# Title', 'after']);
  });

  it('adjacent headings each get their own block', () => {
    expect(splitBlocks('# H1\n## H2')).toEqual(['# H1', '## H2']);
  });

  it('code fence is kept as one block', () => {
    const text = '```js\nconst x = 1;\n```';
    expect(splitBlocks(text)).toEqual([text]);
  });

  it('code fence content is not split by blank lines inside', () => {
    const text = '```\nline1\n\nline2\n```';
    expect(splitBlocks(text)).toEqual([text]);
  });

  it('paragraph before and after code fence', () => {
    const text = 'before\n\n```\ncode\n```\n\nafter';
    expect(splitBlocks(text)).toEqual(['before', '```\ncode\n```', 'after']);
  });

  it('multi-line paragraph stays as one block', () => {
    expect(splitBlocks('line1\nline2\nline3')).toEqual(['line1\nline2\nline3']);
  });
});
