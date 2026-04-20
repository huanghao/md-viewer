import { positionForOffset as positionForOffsetFast, type TextNodeIndex } from '../utils/text-node-index';

export function getTextNodes(root: Node): Text[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.length > 0) {
      nodes.push(node as Text);
    }
  }
  return nodes;
}

// Internal helper for testing - accepts pre-computed nodes
export function globalOffsetForPositionInternal(nodes: Text[], targetNode: Node, targetOffset: number): number {
  let count = 0;
  for (const node of nodes) {
    if (node === targetNode) {
      return count + targetOffset;
    }
    count += node.nodeValue?.length || 0;
  }
  return -1;
}

export function globalOffsetForPosition(root: HTMLElement, targetNode: Node, targetOffset: number): number {
  const nodes = getTextNodes(root);
  return globalOffsetForPositionInternal(nodes, targetNode, targetOffset);
}

// Internal helper for testing - accepts pre-computed nodes
export function positionForGlobalOffsetInternal(
  nodes: Text[],
  offset: number,
  index?: TextNodeIndex
): { node: Text; offset: number } | null {
  if (index) {
    return positionForOffsetFast(index, offset);
  }
  let count = 0;
  for (const node of nodes) {
    const len = node.nodeValue?.length || 0;
    const next = count + len;
    if (offset <= next) {
      return { node, offset: Math.max(0, offset - count) };
    }
    count = next;
  }
  if (nodes.length === 0) return null;
  const last = nodes[nodes.length - 1];
  return { node: last, offset: last.nodeValue?.length || 0 };
}

export function positionForGlobalOffset(
  root: HTMLElement,
  offset: number,
  index?: TextNodeIndex
): { node: Text; offset: number } | null {
  const nodes = getTextNodes(root);
  return positionForGlobalOffsetInternal(nodes, offset, index);
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function placeFloating(el: HTMLElement, x: number, y: number): void {
  const width = 360;
  const height = 220;
  const left = clamp(x, 8, window.innerWidth - width - 8);
  const top = clamp(y, 8, window.innerHeight - height - 8);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
}

export function getReaderText(root: HTMLElement): string {
  return getTextNodes(root).map((node) => node.nodeValue || '').join('');
}
