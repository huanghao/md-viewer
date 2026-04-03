import { describe, expect, it } from 'bun:test';
import { buildTextNodeIndex, positionForOffset } from '../../src/client/utils/text-node-index';

// 模拟浏览器 Text 节点（Bun 环境无 DOM，用对象模拟）
function makeText(value: string): Text {
  return { nodeValue: value } as unknown as Text;
}

describe('buildTextNodeIndex', () => {
  it('builds cumulative offset array for single node', () => {
    const nodes = [makeText('hello')];
    const index = buildTextNodeIndex(nodes);
    expect(index.nodes).toHaveLength(1);
    expect(index.cumulative).toEqual([0, 5]);
    expect(index.totalLength).toBe(5);
  });

  it('builds cumulative offset array for multiple nodes', () => {
    const nodes = [makeText('hello'), makeText(' '), makeText('world')];
    const index = buildTextNodeIndex(nodes);
    expect(index.cumulative).toEqual([0, 5, 6, 11]);
    expect(index.totalLength).toBe(11);
  });

  it('handles empty nodes array', () => {
    const index = buildTextNodeIndex([]);
    expect(index.nodes).toHaveLength(0);
    expect(index.cumulative).toEqual([0]);
    expect(index.totalLength).toBe(0);
  });

  it('skips nodes with null nodeValue', () => {
    const nodes = [makeText('ab'), { nodeValue: null } as unknown as Text, makeText('cd')];
    const index = buildTextNodeIndex(nodes);
    expect(index.totalLength).toBe(4);
  });
});

describe('positionForOffset', () => {
  it('finds position in first node', () => {
    const nodes = [makeText('hello'), makeText(' world')];
    const index = buildTextNodeIndex(nodes);
    const pos = positionForOffset(index, 2);
    expect(pos).not.toBeNull();
    expect(pos!.node).toBe(nodes[0]);
    expect(pos!.offset).toBe(2);
  });

  it('finds position at node boundary', () => {
    const nodes = [makeText('hello'), makeText(' world')];
    const index = buildTextNodeIndex(nodes);
    const pos = positionForOffset(index, 5);
    // offset=5 即第二个节点的起始
    expect(pos).not.toBeNull();
    expect(pos!.node).toBe(nodes[1]);
    expect(pos!.offset).toBe(0);
  });

  it('finds position in second node', () => {
    const nodes = [makeText('hello'), makeText(' world')];
    const index = buildTextNodeIndex(nodes);
    const pos = positionForOffset(index, 7);
    expect(pos).not.toBeNull();
    expect(pos!.node).toBe(nodes[1]);
    expect(pos!.offset).toBe(2);
  });

  it('returns last node end for offset beyond total length', () => {
    const nodes = [makeText('hello')];
    const index = buildTextNodeIndex(nodes);
    const pos = positionForOffset(index, 100);
    expect(pos).not.toBeNull();
    expect(pos!.node).toBe(nodes[0]);
    expect(pos!.offset).toBe(5);
  });

  it('returns null for empty index', () => {
    const index = buildTextNodeIndex([]);
    const pos = positionForOffset(index, 0);
    expect(pos).toBeNull();
  });

  it('handles offset=0', () => {
    const nodes = [makeText('abc')];
    const index = buildTextNodeIndex(nodes);
    const pos = positionForOffset(index, 0);
    expect(pos!.node).toBe(nodes[0]);
    expect(pos!.offset).toBe(0);
  });
});
