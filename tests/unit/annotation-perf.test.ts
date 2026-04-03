import { describe, it } from 'bun:test';
import { buildTextNodeIndex, positionForOffset } from '../../src/client/utils/text-node-index';

/**
 * 性能基准测试。
 * 不用 expect 断言性能数字（避免 CI 环境差异导致 flaky），
 * 而是打印对比数据，让开发者人工确认提升。
 */

function makeText(value: string): Text {
  return { nodeValue: value } as unknown as Text;
}

/** 模拟一个有 M 个文本节点的文档，每节点约 10 字符 */
function buildMockNodes(nodeCount: number): Text[] {
  const nodes: Text[] = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(makeText(`node${i}____`)); // 10 chars
  }
  return nodes;
}

/** 原始线性查找（复制自 annotation.ts 的 positionForGlobalOffset 逻辑） */
function positionForGlobalOffsetLinear(
  nodes: Text[],
  offset: number
): { node: Text; offset: number } | null {
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

function runBenchmark(label: string, nodeCount: number, annotationCount: number) {
  const nodes = buildMockNodes(nodeCount);
  const totalLen = nodeCount * 10;

  // 生成随机 offset 对（模拟 N 条批注各需要 start + end 两次查找）
  const offsets: number[] = [];
  for (let i = 0; i < annotationCount * 2; i++) {
    offsets.push(Math.floor(Math.random() * totalLen));
  }

  // === 优化前：线性查找 ===
  const t0 = performance.now();
  for (const offset of offsets) {
    positionForGlobalOffsetLinear(nodes, offset);
  }
  const linearMs = performance.now() - t0;

  // === 优化后：一次建索引 + 二分查找 ===
  const t1 = performance.now();
  const index = buildTextNodeIndex(nodes);
  for (const offset of offsets) {
    positionForOffset(index, offset);
  }
  const binaryMs = performance.now() - t1;

  const speedup = (linearMs / binaryMs).toFixed(1);
  console.log(
    `[${label}] M=${nodeCount} N=${annotationCount} | ` +
    `线性: ${linearMs.toFixed(2)}ms | 二分: ${binaryMs.toFixed(2)}ms | 提速: ${speedup}x`
  );
}

describe('annotation offset lookup benchmark', () => {
  it('prints performance comparison (not a correctness test)', () => {
    console.log('\n=== Annotation Offset Lookup 性能对比 ===');
    runBenchmark('小文档', 500, 10);
    runBenchmark('中文档', 1500, 30);
    runBenchmark('大文档', 1500, 50);
    runBenchmark('超大文档', 3000, 100);
    console.log('=========================================\n');
  });
});
