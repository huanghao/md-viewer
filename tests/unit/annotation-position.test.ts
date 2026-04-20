import { describe, expect, it } from 'bun:test';
import { globalOffsetForPositionInternal, positionForGlobalOffsetInternal, clamp } from '../../src/client/annotation/position';

function makeText(value: string): Text {
  return { nodeValue: value } as unknown as Text;
}

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps to min', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });
  it('clamps to max', () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe('globalOffsetForPositionInternal', () => {
  it('returns correct offset for first text node', () => {
    const node1 = makeText('hello ');
    const node2 = makeText('world');
    const nodes = [node1, node2];

    const result = globalOffsetForPositionInternal(nodes, node1, 5);
    expect(result).toBe(5);
  });

  it('returns offset spanning multiple nodes', () => {
    const node1 = makeText('abc');
    const node2 = makeText('def');
    const nodes = [node1, node2];

    // When asking for offset 2 in node2, global offset should be 3 (node1 length) + 2 = 5
    const result = globalOffsetForPositionInternal(nodes, node2, 2);
    expect(result).toBe(5);
  });

  it('returns -1 for unknown node', () => {
    const node1 = makeText('hello');
    const node2 = makeText('world');
    const unknown = makeText('other');
    const nodes = [node1, node2];

    const result = globalOffsetForPositionInternal(nodes, unknown, 0);
    expect(result).toBe(-1);
  });
});

describe('positionForGlobalOffsetInternal', () => {
  it('resolves offset within first node', () => {
    const node1 = makeText('hello world');
    const nodes = [node1];

    const result = positionForGlobalOffsetInternal(nodes, 6);
    expect(result).not.toBeNull();
    expect(result!.node).toBe(node1);
    expect(result!.offset).toBe(6);
  });

  it('resolves offset spanning multiple nodes', () => {
    const node1 = makeText('abc');
    const node2 = makeText('def');
    const nodes = [node1, node2];

    // Global offset 5 (abc=3, def=3, so offset 5 is at position 2 of node2)
    const result = positionForGlobalOffsetInternal(nodes, 5);
    expect(result).not.toBeNull();
    expect(result!.node).toBe(node2);
    expect(result!.offset).toBe(2);
  });

  it('returns last node at end of text', () => {
    const node1 = makeText('abc');
    const nodes = [node1];

    // Test offset beyond text length (should clamp to last node's end)
    const result = positionForGlobalOffsetInternal(nodes, 100);
    expect(result).not.toBeNull();
    expect(result!.node).toBe(node1);
    expect(result!.offset).toBe(3);
  });

  it('returns null for empty element', () => {
    const nodes: Text[] = [];

    const result = positionForGlobalOffsetInternal(nodes, 0);
    expect(result).toBeNull();
  });
});
