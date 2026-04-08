import { describe, expect, it } from 'bun:test';
import {
  highlight,
  renderLeaf,
  inlinePreview,
  buildNode,
} from '../../src/client/ui/json-viewer';

// ==================== highlight ====================

describe('highlight', () => {
  it('returns text unchanged when query is empty', () => {
    expect(highlight('hello world', '')).toBe('hello world');
  });

  it('wraps single match in <mark>', () => {
    expect(highlight('hello world', 'world')).toBe(
      'hello <mark class="json-match">world</mark>'
    );
  });

  it('wraps multiple matches', () => {
    expect(highlight('aaa bbb aaa', 'aaa')).toBe(
      '<mark class="json-match">aaa</mark> bbb <mark class="json-match">aaa</mark>'
    );
  });

  it('is case-insensitive', () => {
    expect(highlight('Hello World', 'hello')).toBe(
      '<mark class="json-match">Hello</mark> World'
    );
  });

  it('returns text unchanged when no match', () => {
    expect(highlight('hello', 'xyz')).toBe('hello');
  });

  it('handles empty text', () => {
    expect(highlight('', 'foo')).toBe('');
  });
});

// ==================== renderLeaf ====================

describe('renderLeaf', () => {
  it('renders null', () => {
    expect(renderLeaf(null, '')).toBe('<span class="json-null">null</span>');
  });

  it('renders boolean true', () => {
    expect(renderLeaf(true, '')).toBe('<span class="json-boolean">true</span>');
  });

  it('renders boolean false', () => {
    expect(renderLeaf(false, '')).toBe('<span class="json-boolean">false</span>');
  });

  it('renders number', () => {
    expect(renderLeaf(42, '')).toBe('<span class="json-number">42</span>');
    expect(renderLeaf(3.14, '')).toBe('<span class="json-number">3.14</span>');
    expect(renderLeaf(0, '')).toBe('<span class="json-number">0</span>');
  });

  it('renders string with JSON quotes', () => {
    expect(renderLeaf('hello', '')).toBe('<span class="json-string">&quot;hello&quot;</span>');
  });

  it('escapes HTML in string values', () => {
    const result = renderLeaf('<script>', '');
    expect(result).toContain('&lt;script&gt;');
    expect(result).not.toContain('<script>');
  });

  it('highlights query match in null', () => {
    expect(renderLeaf(null, 'ul')).toContain('<mark class="json-match">ul</mark>');
  });

  it('highlights query match in string', () => {
    expect(renderLeaf('hello', 'ell')).toContain('<mark class="json-match">ell</mark>');
  });
});

// ==================== inlinePreview ====================

describe('inlinePreview', () => {
  it('returns full JSON for short values', () => {
    expect(inlinePreview({ a: 1 })).toBe('{&quot;a&quot;:1}');
  });

  it('truncates long values with ellipsis', () => {
    const longObj = { key: 'a'.repeat(100) };
    const result = inlinePreview(longObj, 20);
    expect(result.endsWith('…')).toBe(true);
    // The text before ellipsis should be <= 20 chars (before HTML escaping)
  });

  it('handles arrays', () => {
    expect(inlinePreview([1, 2, 3])).toBe('[1,2,3]');
  });

  it('handles null', () => {
    expect(inlinePreview(null)).toBe('null');
  });

  it('escapes HTML in preview', () => {
    const result = inlinePreview({ k: '<b>' });
    expect(result).toContain('&lt;b&gt;');
  });
});

// ==================== buildNode ====================

describe('buildNode — leaf nodes', () => {
  it('renders a string leaf without key', () => {
    const html = buildNode('hello', null, 0, '');
    expect(html).toContain('class="json-string"');
    expect(html).toContain('hello');
    expect(html).not.toContain('json-key');
  });

  it('renders a string leaf with key', () => {
    const html = buildNode('hello', 'name', 0, '');
    expect(html).toContain('class="json-key"');
    expect(html).toContain('&quot;name&quot;'); // key is HTML-escaped JSON string
    expect(html).toContain('class="json-string"');
  });

  it('renders number leaf', () => {
    const html = buildNode(42, 'count', 0, '');
    expect(html).toContain('class="json-number"');
    expect(html).toContain('42');
  });

  it('renders null leaf', () => {
    const html = buildNode(null, 'x', 0, '');
    expect(html).toContain('class="json-null"');
    expect(html).toContain('null');
  });

  it('renders boolean leaf', () => {
    const html = buildNode(true, 'flag', 0, '');
    expect(html).toContain('class="json-boolean"');
    expect(html).toContain('true');
  });
});

describe('buildNode — expandable nodes', () => {
  it('renders object with arrow and bracket', () => {
    const html = buildNode({ a: 1 }, null, 0, '');
    expect(html).toContain('▼'); // depth 0 → expanded
    expect(html).toContain('{');
    expect(html).toContain('}');
    expect(html).toContain('1 keys');
  });

  it('renders array with correct count', () => {
    const html = buildNode([1, 2, 3], null, 0, '');
    expect(html).toContain('3 items');
    expect(html).toContain('[');
    expect(html).toContain(']');
  });

  it('depth 0 is expanded (▼), depth 1+ is collapsed (▶)', () => {
    // depth 0: expanded
    const htmlD0 = buildNode({ a: 1 }, null, 0, '');
    expect(htmlD0).toContain('▼');
    expect(htmlD0).not.toContain('▶');

    // depth 1: collapsed
    const htmlD1 = buildNode({ a: 1 }, 'nested', 1, '');
    expect(htmlD1).toContain('▶');
    expect(htmlD1).not.toContain('▼');
  });

  it('collapsed node shows inline preview', () => {
    const html = buildNode({ a: 1 }, 'obj', 1, '');
    expect(html).toContain('json-preview');
  });

  it('expanded node does not show preview', () => {
    const html = buildNode({ a: 1 }, 'obj', 0, '');
    expect(html).not.toContain('json-preview');
  });

  it('highlights query in keys', () => {
    const html = buildNode({ myKey: 'val' }, null, 0, 'myK');
    expect(html).toContain('<mark class="json-match">myK</mark>');
  });

  it('highlights query in string values', () => {
    const html = buildNode('searchable', null, 0, 'search');
    expect(html).toContain('<mark class="json-match">search</mark>');
  });

  it('escapes XSS in keys', () => {
    const html = buildNode({ '<script>': 1 }, null, 0, '');
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('empty object renders 0 keys', () => {
    const html = buildNode({}, null, 0, '');
    expect(html).toContain('0 keys');
  });

  it('empty array renders 0 items', () => {
    const html = buildNode([], null, 0, '');
    expect(html).toContain('0 items');
  });
});
