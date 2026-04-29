import { positionForOffset as positionForOffsetFast, type TextNodeIndex } from '../utils/text-node-index';

export function getTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  function walk(node: Node) {
    if (node.nodeType === 3) { // TEXT_NODE
      if (node.nodeValue && node.nodeValue.length > 0) {
        nodes.push(node as Text);
      }
    } else {
      // Skip KaTeX elements entirely — their internal DOM is fragmented and
      // causes offset miscalculation and surroundContents failures.
      if (node.nodeType === 1 && (node as Element).classList?.contains('katex')) return;
      for (let i = 0; i < node.childNodes.length; i++) {
        walk(node.childNodes[i]);
      }
    }
  }
  walk(root);
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

// When a Range boundary lands on an element node (rather than a text node),
// convert it to the nearest text node offset using document-order comparison.
// elementNode.childNodes[childIndex] is the "boundary child": nodes before it
// are considered "before" the boundary; nodes at or after are "after".
// side='start': return start of the first text node at/after boundary.
// side='end':   return end of the last text node before boundary.
function resolveElementBoundary(
  nodes: Text[],
  elementNode: Node,
  childIndex: number,
  side: 'start' | 'end',
): number {
  // The boundary child is elementNode.childNodes[childIndex] (may be undefined if at end).
  const boundaryChild: Node | undefined = elementNode.childNodes[childIndex];

  let accumulated = 0;
  for (const n of nodes) {
    const len = n.nodeValue?.length || 0;
    // Is this text node before the boundary child in document order?
    const isBeforeBoundary = boundaryChild
      // DOCUMENT_POSITION_PRECEDING(2): n precedes boundaryChild → n is before boundary
      ? !!(boundaryChild.compareDocumentPosition(n) & 2)
      : true; // no boundary child means childIndex >= childNodes.length → all nodes are before

    if (isBeforeBoundary) {
      accumulated += len;
    } else {
      // n is at or after the boundary
      if (side === 'start') return accumulated;
      // side='end': boundary is before this node, return what we have so far
      return accumulated;
    }
  }
  return accumulated;
}

// If a text node is inside a skipped subtree (e.g. .katex), find the .katex
// root element, then use its position in its parent to snap the boundary.
function resolveSkippedTextNode(
  nodes: Text[],
  textNode: Text,
  side: 'start' | 'end',
): number {
  // Walk up to find the .katex root element
  let katexRoot: Element | null = null;
  let node: Node | null = textNode;
  while (node) {
    if (node.nodeType === 1 && (node as Element).classList?.contains('katex')) {
      katexRoot = node as Element;
      break;
    }
    node = node.parentNode;
  }
  if (!katexRoot) return -1;

  const parent = katexRoot.parentElement;
  if (!parent) return -1;

  let idx = 0;
  for (let i = 0; i < parent.childNodes.length; i++) {
    if (parent.childNodes[i] === katexRoot) { idx = i; break; }
  }
  if (side === 'start') {
    // snap to after the katex element: first text node starting at idx+1
    return resolveElementBoundary(nodes, parent, idx + 1, 'start');
  } else {
    // snap to before the katex element: end of text before it
    return resolveElementBoundary(nodes, parent, idx, 'end');
  }
}

export function globalOffsetForPosition(root: HTMLElement, targetNode: Node, targetOffset: number): number {
  const nodes = getTextNodes(root);
  if (targetNode.nodeType !== 3) {
    return resolveElementBoundary(nodes, targetNode, targetOffset, 'start');
  }
  const offset = globalOffsetForPositionInternal(nodes, targetNode, targetOffset);
  if (offset >= 0) return offset;
  // Text node not in nodes list — it's inside a skipped subtree (e.g. .katex)
  return resolveSkippedTextNode(nodes, targetNode as Text, 'start');
}

export function globalOffsetForPositionEnd(root: HTMLElement, targetNode: Node, targetOffset: number): number {
  const nodes = getTextNodes(root);
  if (targetNode.nodeType !== 3) {
    return resolveElementBoundary(nodes, targetNode, targetOffset, 'end');
  }
  const offset = globalOffsetForPositionInternal(nodes, targetNode, targetOffset);
  if (offset >= 0) return offset;
  return resolveSkippedTextNode(nodes, targetNode as Text, 'end');
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
