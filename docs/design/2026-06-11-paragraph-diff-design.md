---
title: 段落级 Diff 模式
date: 2026-06-11
status: approved
---

## 背景

现有 diff 模式采用 Myers 行级算法，以代码 diff 风格展示红绿行。这对 LLM 改写文档的场景不友好——用户只需要知道**哪些段落被改动了**，不需要逐行看增删细节。

## 目标

新增"段落级 diff"模式：正文渲染新版本（阅读体验不变），仅在滚动条上用色块标出有变更的段落位置，配导航 banner 可跳转。行级 diff 完整保留作为 fallback。

## 核心设计

### 入口

- Diff 按钮默认进入**段落模式**（现有行级模式通过 banner 切换）
- `diffViewActive` 状态不变，新增 `diffMode: 'paragraph' | 'line'`，默认 `'paragraph'`

### 块级拆分（`src/client/utils/diff-blocks.ts`）

新增 `diffBlocks(oldText, newText): BlockDiffResult`：

1. `splitBlocks(text)` — 按 markdown 块边界拆分：
   - 连续非空行为一个块（段落、标题、列表、代码围栏等）
   - 空行作为分隔符，不产生块
2. 对 old/new 块序列做 **LCS 比对**（块粒度，以块内容字符串作为比较单元）
3. 输出每个 new 块的状态：`'equal' | 'modified' | 'added'`（deleted 的旧块不在 new 序列中，不参与渲染）

```ts
export interface BlockDiff {
  content: string;       // 块的源文本
  status: 'equal' | 'modified' | 'added';
  blockIndex: number;    // 在 new 文本中的顺序索引
}

export function diffBlocks(oldText: string, newText: string): BlockDiff[]
```

### 渲染流程（`src/client/diff-view.ts`）

段落模式下 `renderDiffView()` 改为：

1. 调用 `diffBlocks()` 得到块状态列表
2. **渲染新版本**：调用现有 `_renderContent()`（与普通模式完全一致，无红绿标记）
3. 渲染完成后，按顺序遍历 `#content` 的顶层 block 元素，与 `BlockDiff[]` 按索引对应
4. 对 `modified` / `added` 块的 DOM 元素打 `data-para-changed="true"`
5. 收集这些元素，调用 `updateDiffMarkers()` 打滚动条色块

### DOM 映射

`#content` 渲染后的顶层元素（`p, h1-h6, ul, ol, pre, blockquote`）与 `splitBlocks()` 产出的块**顺序一致**。通过索引对应，不需要解析内容。

边界情况：
- 若 DOM 元素数量与块数量不一致（极少数情况），跳过多余元素，不崩溃
- 代码块（` ``` `）跨多行但在 DOM 里是单个 `pre`，`splitBlocks` 需整体作为一块处理

### Banner

复用现有 `diff-banner`，改动：
- 计数文案：`2 / 4 段落有变更`（现在是 `1 / N`）
- 新增"行级视图"按钮，点击调用 `switchToLineDiff()`，切换回现有行级渲染逻辑
- Accept / Close 行为不变

### 不改动的部分

- `diffLines()` / Myers 算法 — 完整保留
- `renderInlineDiffHTML()` — 完整保留，行级模式仍走此路径
- `navigateDiffBlock()` — 复用，仅传入 changed block 元素
- `updateDiffMarkers()` / 滚动条逻辑 — 复用

## 文件变更清单

| 文件 | 改动 |
|------|------|
| `src/client/utils/diff-blocks.ts` | 新建，实现 `splitBlocks` + `diffBlocks` |
| `src/client/diff-view.ts` | 新增段落模式渲染路径，banner 切换逻辑 |
| `src/client/ui/diff-banner.ts` | 新增"行级视图"按钮 |
| `src/client/types.ts` | `diffMode` 字段 |
| `tests/unit/diff-blocks.test.ts` | 新建单元测试 |

## 成功标准

- LLM 改写后开启 diff，正文可正常阅读（无红绿标记）
- 滚动条准确标出有变更的段落位置
- Banner 可逐段跳转
- "行级视图"按钮可切回现有行级 diff
- 行级 diff 所有现有测试通过
