import { describe, it, expect } from 'bun:test';
import { splitBlocks, diffBlocks } from '../../src/client/utils/diff-blocks';

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

describe('diffBlocks', () => {
  it('identical documents → all changed=false', () => {
    const text = 'para one\n\npara two\n\npara three';
    const result = diffBlocks(text, text);
    expect(result.every(b => !b.changed)).toBe(true);
    expect(result.map(b => b.content)).toEqual(['para one', 'para two', 'para three']);
  });

  it('one paragraph modified → that block changed=true', () => {
    const old = 'first\n\nsecond\n\nthird';
    const newText = 'first\n\nSECOND CHANGED\n\nthird';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(false);
    expect(result[1].changed).toBe(true);
    expect(result[2].changed).toBe(false);
  });

  it('new paragraph added → added block changed=true', () => {
    const old = 'first\n\nthird';
    const newText = 'first\n\nnew middle\n\nthird';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(false);
    expect(result[1].changed).toBe(true);
    expect(result[2].changed).toBe(false);
  });

  it('paragraph deleted from old → remaining new blocks correct', () => {
    const old = 'first\n\nsecond\n\nthird';
    const newText = 'first\n\nthird';
    const result = diffBlocks(old, newText);
    expect(result).toHaveLength(2);
    expect(result[0].changed).toBe(false);
    expect(result[1].changed).toBe(false);
  });

  it('all paragraphs changed', () => {
    const old = 'aaa\n\nbbb';
    const newText = 'AAA\n\nBBB';
    const result = diffBlocks(old, newText);
    expect(result.every(b => b.changed)).toBe(true);
  });

  it('empty old → all blocks changed=true', () => {
    const result = diffBlocks('', 'para one\n\npara two');
    expect(result.every(b => b.changed)).toBe(true);
  });

  it('empty new → []', () => {
    expect(diffBlocks('para one\n\npara two', '')).toEqual([]);
  });

  it('heading block changed → changed=true', () => {
    const old = '# Title\n\nContent';
    const newText = '# New Title\n\nContent';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(true);  // heading changed
    expect(result[1].changed).toBe(false); // paragraph unchanged
  });

  it('paragraph added at start → only new block changed', () => {
    const old = 'second\n\nthird';
    const newText = 'new first\n\nsecond\n\nthird';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(true);  // new first
    expect(result[1].changed).toBe(false); // second matched
    expect(result[2].changed).toBe(false); // third matched
  });

  it('last paragraph changed', () => {
    const old = 'first\n\nlast';
    const newText = 'first\n\nLAST CHANGED';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(false);
    expect(result[1].changed).toBe(true);
  });

  it('code fence block changed → changed=true', () => {
    const old = 'intro\n\n```\nold code\n```';
    const newText = 'intro\n\n```\nnew code\n```';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(false); // intro unchanged
    expect(result[1].changed).toBe(true);  // code block changed
  });
});
