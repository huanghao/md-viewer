import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { Window } from 'happy-dom';
import { appendHighlighted, buildNode, inlinePreview, renderLeaf } from '../../src/client/ui/json-viewer';

const KEYS = ['window', 'document', 'Node', 'HTMLElement'] as const;
const saved: Record<string, any> = {};
let win: Window;

beforeAll(() => {
  win = new Window({ url: 'http://localhost/' });
  for (const k of KEYS) {
    saved[k] = (globalThis as any)[k];
    (globalThis as any)[k] = k === 'window' ? win : (win as any)[k];
  }
});

afterAll(() => {
  for (const k of KEYS) (globalThis as any)[k] = saved[k];
});

function wrap(el: HTMLElement): HTMLElement {
  const holder = document.createElement('div');
  holder.appendChild(el);
  return holder;
}

function marksIn(el: Element): string[] {
  return Array.from(el.querySelectorAll('mark.json-match')).map((m) => m.textContent ?? '');
}

describe('appendHighlighted', () => {
  it('无查询时只写入纯文本', () => {
    const p = document.createElement('span');
    appendHighlighted(p, 'hello', '');
    expect(p.textContent).toBe('hello');
    expect(p.querySelector('mark')).toBeNull();
  });

  it('包裹所有命中，大小写不敏感', () => {
    const p = document.createElement('span');
    appendHighlighted(p, 'Aaa bbb aaa', 'aaa');
    expect(marksIn(p)).toEqual(['Aaa', 'aaa']);
    expect(p.textContent).toBe('Aaa bbb aaa');
  });

  it('无命中时保持原文', () => {
    const p = document.createElement('span');
    appendHighlighted(p, 'hello', 'xyz');
    expect(p.querySelector('mark')).toBeNull();
    expect(p.textContent).toBe('hello');
  });

  it('文本中的 HTML 作为文字显示，不生成元素', () => {
    const p = document.createElement('span');
    appendHighlighted(p, '<img src=x>', 'img');
    expect(p.querySelector('img')).toBeNull();
    expect(p.textContent).toBe('<img src=x>');
    expect(marksIn(p)).toEqual(['img']);
  });

  it('搜索 amp 不会切断 & 字符（不再在转义后的实体中间插入标记）', () => {
    const p = document.createElement('span');
    appendHighlighted(p, '"a&b"', 'amp');
    expect(p.textContent).toBe('"a&b"');
    expect(marksIn(p)).toEqual([]);
  });
});

describe('renderLeaf', () => {
  it('按类型渲染', () => {
    expect(renderLeaf(null, '').className).toBe('json-null');
    expect(renderLeaf(null, '').textContent).toBe('null');
    expect(renderLeaf(true, '').className).toBe('json-boolean');
    expect(renderLeaf(false, '').textContent).toBe('false');
    expect(renderLeaf(42, '').className).toBe('json-number');
    expect(renderLeaf(3.14, '').textContent).toBe('3.14');
  });

  it('字符串带 JSON 引号', () => {
    const el = renderLeaf('hello', '');
    expect(el.className).toBe('json-string');
    expect(el.textContent).toBe('"hello"');
  });

  it('高亮查询命中', () => {
    expect(marksIn(renderLeaf(null, 'ul'))).toEqual(['ul']);
    expect(marksIn(renderLeaf('hello', 'ell'))).toEqual(['ell']);
  });
});

describe('inlinePreview', () => {
  it('短值返回完整 JSON', () => {
    expect(inlinePreview({ a: 1 })).toBe('{"a":1}');
    expect(inlinePreview([1, 2, 3])).toBe('[1,2,3]');
    expect(inlinePreview(null)).toBe('null');
  });

  it('长值截断并加省略号', () => {
    const result = inlinePreview({ key: 'a'.repeat(100) }, 20);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBe(21);
  });
});

describe('buildNode — 叶子节点', () => {
  it('无 key 的字符串叶子不含 key 元素', () => {
    const el = wrap(buildNode('hello', null, 0, ''));
    expect(el.querySelector('.json-string')?.textContent).toBe('"hello"');
    expect(el.querySelector('.json-key')).toBeNull();
  });

  it('带 key 的叶子：key 为带引号的 JSON 字符串', () => {
    const el = wrap(buildNode('hello', 'name', 0, ''));
    expect(el.querySelector('.json-key')?.textContent).toBe('"name"');
    expect(el.querySelector('.json-colon')?.textContent).toBe(':');
    expect(el.querySelector('.json-string')).not.toBeNull();
  });

  it('叶子不含展开结构', () => {
    const el = wrap(buildNode(42, 'count', 0, ''));
    expect(el.querySelector('.json-number')?.textContent).toBe('42');
    expect(el.querySelector('.json-node-expandable')).toBeNull();
  });
});

describe('buildNode — 可展开节点', () => {
  it('对象显示括号与键数', () => {
    const el = wrap(buildNode({ a: 1 }, null, 0, ''));
    expect(el.querySelector('.json-count')?.textContent).toBe('1 keys');
    const brackets = Array.from(el.querySelectorAll('.json-bracket')).map((b) => b.textContent);
    expect(brackets).toContain('{');
    expect(brackets).toContain('}');
  });

  it('数组显示元素数', () => {
    const el = wrap(buildNode([1, 2, 3], null, 0, ''));
    expect(el.querySelector('.json-count')?.textContent).toBe('3 items');
  });

  it('depth 0 展开（▼），depth 1+ 折叠（▶）', () => {
    const d0 = wrap(buildNode({ a: 1 }, null, 0, ''));
    expect(d0.querySelector('.json-toggle')?.textContent).toBe('▼');
    expect(d0.querySelector('.json-children')?.classList.contains('collapsed')).toBe(false);

    const d1 = wrap(buildNode({ a: 1 }, 'nested', 1, ''));
    expect(d1.querySelector('.json-toggle')?.textContent).toBe('▶');
    expect(d1.querySelector('.json-children')?.classList.contains('collapsed')).toBe(true);
  });

  it('折叠节点显示预览，展开节点不显示', () => {
    expect(wrap(buildNode({ a: 1 }, 'obj', 1, '')).querySelector('.json-preview')).not.toBeNull();
    expect(wrap(buildNode({ a: 1 }, 'obj', 0, '')).querySelector('.json-preview')).toBeNull();
  });

  it('高亮键与字符串值中的命中', () => {
    const keyEl = wrap(buildNode({ myKey: 'val' }, null, 0, 'myK'));
    expect(marksIn(keyEl)).toEqual(['myK']);
    const strEl = wrap(buildNode('searchable', null, 0, 'search'));
    expect(marksIn(strEl)).toEqual(['search']);
  });

  it('键中的 HTML 作为文字显示', () => {
    const el = wrap(buildNode({ '<script>': 1 }, null, 0, ''));
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('.json-key')?.textContent).toBe('"<script>"');
  });

  it('空对象与空数组', () => {
    expect(wrap(buildNode({}, null, 0, '')).querySelector('.json-count')?.textContent).toBe('0 keys');
    expect(wrap(buildNode([], null, 0, '')).querySelector('.json-count')?.textContent).toBe('0 items');
  });
});
