import { beforeEach, describe, expect, it } from 'bun:test';
import { findActiveIndex, flattenToc } from '../../src/client/toc/logic';
import { tocStore } from '../../src/client/toc/store';
import type { TocItem } from '../../src/client/toc-extractor';

const md: TocItem[] = [
  { title: 'Intro', level: 1, anchor: 'intro', children: [
    { title: 'Background', level: 2, anchor: 'background', children: [] },
  ] },
  { title: 'Conclusion', level: 1, anchor: 'conclusion', children: [] },
];

describe('flattenToc', () => {
  it('先父后子展开，并按序编号', () => {
    const flat = flattenToc(md);
    expect(flat.map((t) => t.title)).toEqual(['Intro', 'Background', 'Conclusion']);
    expect(flat.map((t) => t.index)).toEqual([0, 1, 2]);
  });
  it('标题原样保留（不做 HTML 解析）', () => {
    const flat = flattenToc([{ title: '<img src=x>', level: 1, children: [] }]);
    expect(flat[0].title).toBe('<img src=x>');
  });
});

describe('findActiveIndex', () => {
  const flat = flattenToc(md);
  it('按页码匹配（PDF）', () => {
    const pdf = flattenToc([{ title: 'A', level: 1, pageNum: 1, children: [{ title: 'B', level: 2, pageNum: 3, children: [] }] }]);
    expect(findActiveIndex(pdf, { page: 3 })).toBe(1);
    expect(findActiveIndex(pdf, { page: 9 })).toBe(-1);
  });
  it('按标题文本匹配（MD），忽略首尾空白', () => {
    expect(findActiveIndex(flat, { title: '  Background ' })).toBe(1);
  });
  it('标题不匹配时回退到锚点', () => {
    expect(findActiveIndex(flat, { title: 'conclusion' })).toBe(2);
    expect(findActiveIndex(flat, { title: 'nowhere' })).toBe(-1);
  });
  it('无 key 或空标题没有激活项', () => {
    expect(findActiveIndex(flat, null)).toBe(-1);
    expect(findActiveIndex(flat, {})).toBe(-1);
  });
});

describe('tocStore', () => {
  beforeEach(() => tocStore.reset());
  it('标题栏在首次有目录后保持，即使之后变为空或加载中', () => {
    tocStore.setLoading();
    expect(tocStore.getState().headerShown).toBe(false);
    tocStore.setItems(md, () => {});
    expect(tocStore.getState().headerShown).toBe(true);
    tocStore.setEmpty();
    expect(tocStore.getState().headerShown).toBe(true);
    expect(tocStore.getState().status).toBe('empty');
  });

  it('setActive 相同值不通知', () => {
    tocStore.setItems(md, () => {});
    let calls = 0;
    const off = tocStore.subscribe(() => calls++);
    tocStore.setActive({ title: 'Intro' });
    tocStore.setActive({ title: 'Intro' });
    expect(calls).toBe(1);
    off();
  });

  it('setError 记录错误文本并清空列表', () => {
    tocStore.setError('boom');
    expect(tocStore.getState().status).toBe('error');
    expect(tocStore.getState().error).toBe('boom');
    expect(tocStore.getState().items).toEqual([]);
  });
});
