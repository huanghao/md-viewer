# MD Viewer 性能优化设计文档

**日期：** 2026-04-03  
**分析来源：** 代码静态分析 + 行业基准推算

---

## 背景

通过对代码库的静态分析，发现两类主要性能卡点：

1. **前端批注渲染**（卡点 5+6+7）：`applyAnnotations` 和 `renderAnnotationList` 在批注量增大时存在 O(N×M) 的 TreeWalker 遍历和 layout thrashing
2. **服务端工作区扫描**（卡点 1+2+3）：`scanDirectory` 使用同步 I/O 阻塞事件循环，`getFileList` 未过滤 node_modules，`hydrateExpandedWorkspaces` 串行扫描多工作区

---

## 卡点详情

### 卡点 5+6（P0）：applyAnnotations TreeWalker O(N×M)

**位置：** `src/client/annotation.ts:1181`，`src/client/utils/annotation-anchor.ts`

**问题：**
- `applyAnnotations` 对每条批注各自调用 `positionForGlobalOffset`，每次内部用 TreeWalker 从根节点遍历所有文本节点
- N 条批注 × M 个文本节点 = O(N×M) 遍历
- `applyAnnotations` 有 14 个调用点，每次用户操作都触发

**量化（估算，M=1500文本节点）：**

| 批注数 | 优化前（估算） | 优化后（估算） | 估算提速 |
|--------|--------|--------|------|
| 10     | ~86ms  | ~18ms  | 4.8x |
| 30     | ~245ms | ~41ms  | 6.0x |
| 50     | ~404ms | ~64ms  | 6.3x |

**实测基准（`tests/unit/annotation-perf.test.ts`，仅 offset 查找部分，不含 DOM 操作）：**

| 场景 | 优化前（线性查找） | 优化后（二分查找） | 实测提速 |
|------|----------------|----------------|---------|
| 小文档 M=500 N=10 | 0.28ms | 0.09ms | **3.1x** |
| 中文档 M=1500 N=30 | 0.39ms | 0.10ms | **3.9x** |
| 大文档 M=1500 N=50 | 0.44ms | 0.07ms | **6.1x** |
| 超大文档 M=3000 N=100 | 0.88ms | 0.09ms | **9.9x** |

> 注：实测数字为纯 JS 计算（无 DOM），实际浏览器中还包含 TreeWalker 遍历和 DOM 操作开销，总体提速比会更显著。

**✅ 已实施**（2026-04-03）：
- 新增 `src/client/utils/text-node-index.ts`：`TextNodeIndex` + `buildTextNodeIndex` + `positionForOffset`（二分查找）
- 修改 `src/client/annotation.ts`：`applyAnnotations` 一次建立索引，`applySingleAnnotation` 接受索引参数

**优化方案：**
将 `positionForGlobalOffset` 的逐节点遍历改为：
1. 一次 TreeWalker 建立 `TextNodeIndex`（累计偏移量数组 + 节点引用）
2. 二分查找替代线性遍历
3. 复杂度降为 O(M + N·logM)

### 卡点 7（P1）：renderAnnotationList layout thrashing

**位置：** `src/client/annotation.ts:1302-1314`

**问题：**
- `default` 模式下先读 `getBoundingClientRect`（N次），再写 `innerHTML`，再读 `offsetHeight`
- 形成 read-write-read layout thrashing，强制 2 次同步 reflow

**优化方案：**
`getAnnotationAnchorTopById` 依赖 DOM mark 存在（由 `applyAnnotations` 写入），所以顺序无法完全调换。但可以把 N 次 `getBoundingClientRect` 批量读取后缓存，避免 innerHTML 写入前后的重复读取。

### 卡点 1（P1）：scanDirectory 同步 I/O

**位置：** `src/handlers.ts:566`

**问题：**
- `readdirSync` + `statSync` 全量同步递归，阻塞 Bun 事件循环
- 大仓库（2000个文件）阻塞约 250ms

**优化方案：** 改用 `readdir`/`stat` async，`Promise.all` 并行处理子目录

### 卡点 2（P2）：getFileList 未过滤 node_modules

**位置：** `src/utils.ts:67`

**问题：** `readdirSync(dir, { recursive: true })` 会遍历 node_modules，前端项目可能有 10 万文件

**优化方案：** 在递归遍历前跳过 `node_modules`、`.git`、`dist`、`build` 等目录

### 卡点 3（P2）：hydrateExpandedWorkspaces 串行

**位置：** `src/client/workspace.ts:293`

**问题：** `for...of` + `await` 串行扫描，3 个工作区 = 3x 等待时间

**优化方案：** `Promise.all` 并行扫描

---

## 验证方案

每个优化需要：
1. **功能正确性**：单元测试覆盖核心逻辑，与优化前行为一致
2. **性能量化**：在测试中插桩 `performance.now()`，输出实测耗时对比报告

---

## 实施顺序

1. **P0**：卡点 5+6 — `applyAnnotations` TreeWalker 优化（最高价值）
2. **P1**：卡点 7 — `renderAnnotationList` layout thrashing
3. **P1**：卡点 1 — `scanDirectory` 异步化
4. **P2**：卡点 2 — `getFileList` 过滤 node_modules
5. **P2**：卡点 3 — `hydrateExpandedWorkspaces` 并行化
