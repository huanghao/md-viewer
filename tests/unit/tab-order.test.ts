import { beforeEach, describe, expect, it } from 'bun:test';
import { moveTabOrder, state } from '../../src/client/state';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() { return this.data.size; }
  clear() { this.data.clear(); }
  getItem(key: string) { return this.data.get(key) ?? null; }
  key(index: number) { return [...this.data.keys()][index] ?? null; }
  removeItem(key: string) { this.data.delete(key); }
  setItem(key: string, value: string) { this.data.set(key, value); }
}
(globalThis as any).localStorage = new MemoryStorage();

beforeEach(() => {
  state.tabOrder = ['a', 'b', 'c', 'd', 'e'];
});

describe('moveTabOrder', () => {
  it('向右移：b 移到 d 后', () => {
    moveTabOrder(1, 3);
    expect(state.tabOrder).toEqual(['a', 'c', 'd', 'b', 'e']);
  });

  it('向左移：d 移到 b 前', () => {
    moveTabOrder(3, 1);
    expect(state.tabOrder).toEqual(['a', 'd', 'b', 'c', 'e']);
  });

  it('相同位置不改变顺序', () => {
    moveTabOrder(2, 2);
    expect(state.tabOrder).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('移到第一位', () => {
    moveTabOrder(3, 0);
    expect(state.tabOrder).toEqual(['d', 'a', 'b', 'c', 'e']);
  });

  it('移到最后一位', () => {
    moveTabOrder(1, 4);
    expect(state.tabOrder).toEqual(['a', 'c', 'd', 'e', 'b']);
  });

  it('fromIndex 为负数时不操作', () => {
    moveTabOrder(-1, 2);
    expect(state.tabOrder).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('toIndex 为负数时不操作', () => {
    moveTabOrder(1, -1);
    expect(state.tabOrder).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
