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

  it('paragraph directly followed by a list (no blank line) splits into two blocks', () => {
    const text = '**标签：**\n- item1\n- item2';
    expect(splitBlocks(text)).toEqual(['**标签：**', '- item1\n- item2']);
  });

  it('numbered list directly following a paragraph also splits', () => {
    const text = '**步骤：**\n1. first\n2. second';
    expect(splitBlocks(text)).toEqual(['**步骤：**', '1. first\n2. second']);
  });

  it('list directly followed by a paragraph (no blank line) splits into two blocks', () => {
    const text = '- item1\n- item2\nfollowing prose';
    expect(splitBlocks(text)).toEqual(['- item1\n- item2', 'following prose']);
  });

  it('indented continuation line under a list item stays in the same block', () => {
    const text = '- item one\n  continues on next line\n- item two';
    expect(splitBlocks(text)).toEqual([text]);
  });

  it('list surrounded by blank lines is unaffected (still one block)', () => {
    const text = 'intro\n\n- item1\n- item2\n\noutro';
    expect(splitBlocks(text)).toEqual(['intro', '- item1\n- item2', 'outro']);
  });

  it('does not treat "---" (hr) as a list item', () => {
    const text = 'para one\n\n---\n\npara two';
    expect(splitBlocks(text)).toEqual(['para one', '---', 'para two']);
  });

  it('does not treat bold text starting with ** as a list item', () => {
    const text = '**bold label** more text\n- item';
    expect(splitBlocks(text)).toEqual(['**bold label** more text', '- item']);
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

  it('moved paragraph (same content, different position) → changed=false', () => {
    const old = 'first\n\nsecond\n\nthird';
    const newText = 'third\n\nfirst\n\nsecond';
    const result = diffBlocks(old, newText);
    expect(result.every(b => !b.changed)).toBe(true);
  });

  it('code fence block changed → changed=true', () => {
    const old = 'intro\n\n```\nold code\n```';
    const newText = 'intro\n\n```\nnew code\n```';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(false); // intro unchanged
    expect(result[1].changed).toBe(true);  // code block changed
  });

  it('rewrapped paragraph (same words, different line breaks) → changed=false', () => {
    const old = 'This is a fairly long paragraph\nthat has been hard-wrapped at a\ncertain width.';
    const newText = 'This is a fairly long paragraph that has been hard-wrapped at a certain width.';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(false);
  });

  it('paragraph with extra internal whitespace only → changed=false', () => {
    const old = 'hello   world\nfoo bar';
    const newText = 'hello world foo bar';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(false);
  });

  it('rewrap plus real content change → still changed=true', () => {
    const old = 'This is a fairly long paragraph\nthat has been hard-wrapped at a\ncertain width.';
    const newText = 'This is a fairly long paragraph that has been hard-wrapped at a DIFFERENT width.';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(true);
  });

  it('code fence with only whitespace/indentation change → still changed=true', () => {
    const old = 'intro\n\n```\nconst x = 1;\n```';
    const newText = 'intro\n\n```\nconst x   =   1;\n```';
    const result = diffBlocks(old, newText);
    expect(result[0].changed).toBe(false);
    expect(result[1].changed).toBe(true); // whitespace matters inside code fences
  });

  // 段落紧跟列表（无空行）曾被 splitBlocks 当成一个块，但 marked 渲染成两个 DOM 元素，
  // 导致渲染时块下标与 DOM 元素下标错位，越往后错位越大（真实文档复现：附录改动被误判到别处）。
  it('editing content after a "label + adjacent list" block does not misattribute changes to earlier blocks', () => {
    const old = '**标签一：**\n- item1\n- item2\n\n**标签二：**\n- item3\n- item4\n\nlast paragraph';
    const newText = '**标签一：**\n- item1\n- item2\n\n**标签二：**\n- item3\n- item4\n\nLAST PARAGRAPH CHANGED';
    const result = diffBlocks(old, newText);
    // 5 blocks: label1, list1, label2, list2, last-paragraph
    expect(result).toHaveLength(5);
    expect(result[0].changed).toBe(false); // 标签一
    expect(result[1].changed).toBe(false); // list1
    expect(result[2].changed).toBe(false); // 标签二
    expect(result[3].changed).toBe(false); // list2
    expect(result[4].changed).toBe(true);  // last paragraph — the only real edit
  });
});

describe('diffBlocks table rows', () => {
  const t = (rows: string[]) => ['| 名称 | 值 |', '|---|---|', ...rows].join('\n');

  it('marks only the changed data row', () => {
    const r = diffBlocks(t(['| a | 1 |', '| b | 2 |', '| c | 3 |']), t(['| a | 1 |', '| b | 20 |', '| c | 3 |']));
    expect(r[0].changed).toBe(true);
    expect(r[0].changedRows).toEqual([2]);
  });

  it('marks added row, ignores moved rows and whitespace', () => {
    const r = diffBlocks(t(['| a | 1 |', '| b | 2 |']), t(['|  b |  2 |', '| a | 1 |', '| d | 4 |']));
    expect(r[0].changedRows).toEqual([3]);
  });

  it('marks header change', () => {
    const r = diffBlocks(t(['| a | 1 |']), ['| 名称 | 数值 |', '|---|---|', '| a | 1 |'].join('\n'));
    expect(r[0].changedRows).toEqual([0]);
  });

  it('non-table block has no changedRows', () => {
    expect(diffBlocks('a | b', 'a | c')[0].changedRows).toBeUndefined();
  });
});
