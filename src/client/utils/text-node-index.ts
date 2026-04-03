/**
 * TextNodeIndex: 一次 TreeWalker 遍历建立的文本节点偏移索引。
 * 用于将全局字符 offset 快速定位到 {node, localOffset}，
 * 替代 positionForGlobalOffset 中的线性遍历，复杂度 O(logM)。
 */

export interface TextNodePosition {
  node: Text;
  offset: number;
}

export interface TextNodeIndex {
  nodes: Text[];
  /** cumulative[i] = 前 i 个节点的字符总数，长度为 nodes.length + 1 */
  cumulative: number[];
  totalLength: number;
}

/**
 * 从已收集的文本节点数组构建索引。
 * 调用方负责用 TreeWalker 收集节点（见 collectTextNodes）。
 */
export function buildTextNodeIndex(nodes: Text[]): TextNodeIndex {
  const cumulative: number[] = [0];
  for (const node of nodes) {
    const len = node.nodeValue?.length ?? 0;
    cumulative.push(cumulative[cumulative.length - 1] + len);
  }
  return {
    nodes,
    cumulative,
    totalLength: cumulative[cumulative.length - 1],
  };
}

/**
 * 二分查找：将全局 offset 映射到 {node, localOffset}。
 * 与原 positionForGlobalOffset 行为一致：
 * - offset 超出范围时返回最后节点末尾
 * - 节点为空时返回 null
 */
export function positionForOffset(index: TextNodeIndex, offset: number): TextNodePosition | null {
  if (index.nodes.length === 0) return null;

  // offset 超出总长度：返回最后节点末尾
  if (offset >= index.totalLength) {
    const last = index.nodes[index.nodes.length - 1];
    return { node: last, offset: last.nodeValue?.length ?? 0 };
  }

  // 二分查找：找到最大的 i 使得 cumulative[i] <= offset
  let lo = 0;
  let hi = index.nodes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (index.cumulative[mid] <= offset) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return {
    node: index.nodes[lo],
    offset: offset - index.cumulative[lo],
  };
}

/**
 * 用 TreeWalker 从 root 收集所有非空文本节点。
 * 在浏览器环境中调用，返回节点数组供 buildTextNodeIndex 使用。
 */
export function collectTextNodes(root: Node): Text[] {
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
