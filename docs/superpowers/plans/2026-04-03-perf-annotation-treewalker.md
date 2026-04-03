# 批注渲染性能优化（P0：TextNodeIndex + 二分查找）实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `applyAnnotations` 的 TreeWalker 遍历从 O(N×M) 降为 O(M + N·logM)，消除批注量增大时的主线程卡顿，并输出实测性能对比报告。

**Architecture:** 新增 `TextNodeIndex` 数据结构（累计偏移量数组 + 文本节点引用），在 `applyAnnotations` 开始时做一次 TreeWalker 建立索引，所有批注的 offset→node 定位改用二分查找。`positionForGlobalOffset` 接受可选索引参数，无索引时保持原有逻辑（向后兼容）。性能基准测试用 `performance.now()` 插桩，在 Node/Bun 环境模拟 DOM 结构运行，输出优化前后对比数据。

**Tech Stack:** TypeScript, Bun test (bun:test), 无额外依赖

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/client/utils/text-node-index.ts` | **新建** | `TextNodeIndex` 类型定义 + `buildTextNodeIndex` + `positionForOffset` 二分查找 |
| `src/client/annotation.ts` | **修改** | `applyAnnotations` 使用 `TextNodeIndex`；`positionForGlobalOffset` 接受可选索引 |
| `tests/unit/text-node-index.test.ts` | **新建** | `buildTextNodeIndex` 和 `positionForOffset` 的单元测试 |
| `tests/unit/annotation-perf.test.ts` | **新建** | 性能基准测试：模拟大文档 + 多批注，输出优化前后耗时对比 |

---

### Task 1：新建 TextNodeIndex 工具模块（含测试）

**Files:**
- Create: `src/client/utils/text-node-index.ts`
- Create: `tests/unit/text-node-index.test.ts`

- [ ] **Step 1: 写失败测试**

新建 `tests/unit/text-node-index.test.ts`，内容如下：

```typescript
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
```

- [ ] **Step 2: 运行测试，确认失败**

```bash
bun test tests/unit/text-node-index.test.ts
```

预期：FAIL，报 `Cannot find module '../../src/client/utils/text-node-index'`

- [ ] **Step 3: 实现 TextNodeIndex 模块**

新建 `src/client/utils/text-node-index.ts`：

```typescript
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
```

- [ ] **Step 4: 运行测试，确认通过**

```bash
bun test tests/unit/text-node-index.test.ts
```

预期：全部 PASS

- [ ] **Step 5: 运行全量测试，确认无回归**

```bash
bun test tests/unit/
```

预期：34 pass（原有）+ 新增测试全部 pass，0 fail

- [ ] **Step 6: 提交**

```bash
git add src/client/utils/text-node-index.ts tests/unit/text-node-index.test.ts
git commit -m "feat: add TextNodeIndex for O(logM) annotation offset lookup"
```

---

### Task 2：性能基准测试（优化前基线）

**Files:**
- Create: `tests/unit/annotation-perf.test.ts`

这个测试先在**修改 annotation.ts 之前**运行，记录优化前的基线数据。

- [ ] **Step 1: 写性能基准测试**

新建 `tests/unit/annotation-perf.test.ts`：

```typescript
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
```

- [ ] **Step 2: 运行基准测试，记录输出**

```bash
bun test tests/unit/annotation-perf.test.ts --timeout 30000
```

预期输出格式（数字因机器而异）：
```
=== Annotation Offset Lookup 性能对比 ===
[小文档] M=500 N=10 | 线性: X.XXms | 二分: X.XXms | 提速: X.Xx
[中文档] M=1500 N=30 | 线性: X.XXms | 二分: X.XXms | 提速: X.Xx
[大文档] M=1500 N=50 | 线性: X.XXms | 二分: X.XXms | 提速: X.Xx
[超大文档] M=3000 N=100 | 线性: X.XXms | 二分: X.XXms | 提速: X.Xx
```

将此输出截图或复制，作为**优化前基线**，与 Task 4 的结果对比。

- [ ] **Step 3: 提交**

```bash
git add tests/unit/annotation-perf.test.ts
git commit -m "test: add annotation offset lookup benchmark"
```

---

### Task 3：修改 annotation.ts 使用 TextNodeIndex

**Files:**
- Modify: `src/client/annotation.ts`

涉及以下改动：
1. 在文件顶部 import `collectTextNodes`、`buildTextNodeIndex`、`positionForOffset`
2. 修改 `positionForGlobalOffset` 接受可选 `TextNodeIndex` 参数（向后兼容）
3. 修改 `applyAnnotations` 一次性建立索引，传给所有 `applySingleAnnotation` 调用
4. 修改 `applySingleAnnotation` 接受可选索引参数

- [ ] **Step 1: 在 annotation.ts 顶部添加 import**

在 `src/client/annotation.ts` 第 1 行（`import type { Annotation }...` 之前）添加：

```typescript
import { collectTextNodes, buildTextNodeIndex, positionForOffset as positionForOffsetFast, type TextNodeIndex } from './utils/text-node-index';
```

- [ ] **Step 2: 修改 positionForGlobalOffset，接受可选索引**

找到 `src/client/annotation.ts:285` 的 `positionForGlobalOffset` 函数，替换为：

```typescript
function positionForGlobalOffset(
  root: HTMLElement,
  offset: number,
  index?: TextNodeIndex
): { node: Text; offset: number } | null {
  if (index) {
    return positionForOffsetFast(index, offset);
  }
  // 原始线性逻辑（fallback，保持向后兼容）
  const nodes = getTextNodes(root);
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
```

- [ ] **Step 3: 修改 applySingleAnnotation 接受可选索引**

找到 `src/client/annotation.ts:1070` 的 `applySingleAnnotation` 函数签名，改为：

```typescript
function applySingleAnnotation(ann: Annotation, index?: TextNodeIndex): void {
```

函数内部两处 `positionForGlobalOffset(el.reader, ...)` 调用，均改为传入 `index`：

```typescript
// 原来（约 1075、1076 行）：
const startPos = positionForGlobalOffset(el.reader, ann.start);
const endPos = positionForGlobalOffset(el.reader, ann.start + ann.length);

// 改为：
const startPos = positionForGlobalOffset(el.reader, ann.start, index);
const endPos = positionForGlobalOffset(el.reader, ann.start + ann.length, index);
```

函数内部 `applySingleAnnotation` 内还有一个 `TreeWalker`（约 1100 行），用于跨节点高亮时找文本节点范围。这段逻辑**不改动**，因为它是在已知 startPos/endPos 之后做 DOM 操作，与索引构建无关。

- [ ] **Step 4: 修改 applyAnnotations 一次建立索引**

找到 `src/client/annotation.ts:1181` 的 `applyAnnotations` 函数，在 `clearRenderedMarks()` 之后、`for (const ann of state.annotations)` 循环之前，添加索引构建：

```typescript
export function applyAnnotations(): void {
  const el = getElements();
  clearRenderedMarks();

  // 一次 TreeWalker 建立索引，供所有批注定位复用
  const index: TextNodeIndex | undefined = el.reader
    ? buildTextNodeIndex(collectTextNodes(el.reader))
    : undefined;

  if (el.reader) {
    // getReaderText 也可以从索引直接拼接，避免第二次 TreeWalker
    const text = index
      ? index.nodes.map((n) => n.nodeValue || '').join('')
      : getReaderText(el.reader);

    let changed = false;
    const changedAnnotations: Annotation[] = [];
    for (const ann of state.annotations) {
      const resolved = resolveAnnotationAnchor(text, ann);
      // ... 以下逻辑不变（约 1192-1224 行）
```

注意：`getReaderText` 内部也做了一次 TreeWalker（`annotation.ts:314`），改为从 `index` 拼接后可消除这次额外遍历。

完整替换后的 `applyAnnotations` 开头（到 `if (changed)` 块结束，约 1181-1232 行）：

```typescript
export function applyAnnotations(): void {
  const el = getElements();
  clearRenderedMarks();

  // 一次 TreeWalker 建立索引，供所有批注定位复用
  const index: TextNodeIndex | undefined = el.reader
    ? buildTextNodeIndex(collectTextNodes(el.reader))
    : undefined;

  if (el.reader) {
    const text = index
      ? index.nodes.map((n) => n.nodeValue || '').join('')
      : getReaderText(el.reader);

    let changed = false;
    const changedAnnotations: Annotation[] = [];
    for (const ann of state.annotations) {
      const resolved = resolveAnnotationAnchor(text, ann);
      let annChanged = false;
      const nextStatus = resolved.status;
      if (ann.start !== resolved.start) {
        ann.start = resolved.start;
        changed = true;
        annChanged = true;
      }
      if (ann.length !== resolved.length) {
        ann.length = resolved.length;
        changed = true;
        annChanged = true;
      }
      const mergedStatus = mergeAnnotationStatus(ann.status, nextStatus);
      if ((ann.status || 'anchored') !== mergedStatus) {
        ann.status = mergedStatus;
        changed = true;
        annChanged = true;
      }
      if (ann.confidence !== resolved.confidence) {
        ann.confidence = resolved.confidence;
        changed = true;
        annChanged = true;
      }
      if (annChanged) {
        changedAnnotations.push({ ...ann, thread: ann.thread ? [...ann.thread] : ann.thread });
      }
    }

    if (changed) {
      const currentFile = getActiveAnnotationFilePath();
      if (currentFile) {
        persistAnnotations(currentFile, changedAnnotations, '同步评论锚点失败');
      }
    }
  }

  const sorted = [...getVisibleAnnotations()]
    .sort((a, b) => b.start - a.start);
  for (const ann of sorted) {
    applySingleAnnotation(ann, index);
  }
  attachAnnotationEvents();
}
```

- [ ] **Step 5: 运行全量单元测试，确认无回归**

```bash
bun test tests/unit/
```

预期：全部 pass，0 fail

- [ ] **Step 6: 提交**

```bash
git add src/client/annotation.ts src/client/utils/text-node-index.ts
git commit -m "perf: use TextNodeIndex in applyAnnotations, O(NxM) -> O(M+N*logM)"
```

---

### Task 4：运行基准测试，输出性能对比报告

- [ ] **Step 1: 运行基准测试**

```bash
bun test tests/unit/annotation-perf.test.ts --timeout 30000
```

- [ ] **Step 2: 对比 Task 2 的基线数据，记录实测提速**

将输出与 Task 2 的基线对比，填入下表（实测后替换 X.X）：

| 场景 | 优化前 | 优化后 | 实测提速 |
|------|--------|--------|---------|
| 小文档 M=500 N=10 | Xms | Xms | Xx |
| 中文档 M=1500 N=30 | Xms | Xms | Xx |
| 大文档 M=1500 N=50 | Xms | Xms | Xx |
| 超大文档 M=3000 N=100 | Xms | Xms | Xx |

- [ ] **Step 3: 运行全量测试最终确认**

```bash
bun test tests/unit/
```

预期：全部 pass

- [ ] **Step 4: 提交性能报告**

将实测数据更新到 `docs/superpowers/specs/2026-04-03-performance-optimization-design.md` 的量化表格中，然后：

```bash
git add docs/superpowers/specs/2026-04-03-performance-optimization-design.md
git commit -m "docs: update perf spec with measured benchmark results"
```

---

## 自检

**Spec 覆盖：**
- ✅ 卡点 5+6（TextNodeIndex + 二分查找）：Task 1-4 完整覆盖
- ✅ 功能正确性：Task 1 单元测试，Task 3 Step 5 全量回归
- ✅ 性能量化报告：Task 2 基线 + Task 4 对比

**类型一致性：**
- `TextNodeIndex`、`TextNodePosition` 定义在 `text-node-index.ts`，所有引用一致
- `positionForGlobalOffset` 签名在 Task 3 Step 2 中更新，`applySingleAnnotation` 在 Task 3 Step 3 中更新，顺序正确
- `collectTextNodes` 在 `text-node-index.ts` 中定义，在 `annotation.ts` 中 import

**无占位符：** 所有步骤包含完整代码。
