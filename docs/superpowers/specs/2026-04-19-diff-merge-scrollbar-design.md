# Diff 分块合并 + 自定义滚动条 设计文档

## 1. Diff 分块合并

### 背景

当前 `renderInlineDiffHTML`（`src/client/main.ts`）将每个连续的 delete / insert / modify 段独立成块，`navigateDiffBlock` 逐块跳转。当文档中多处相邻变更密集分布时，用户需要多次按"下一处"才能跳过一片改动，体验差。

### 需求

相邻变更块之间如果只隔 **0–2 行 equal 内容**，合并为一个大块，共享同一个 `data-block-index`。"下一处"跳转以合并块为单位。

### 合并规则

- 遍历 `segments` 数组时，维护一个"当前合并组"
- 若下一个 segment 是 `equal` 且行数 ≤ 2，且之后还有非 equal segment，则将该 equal 段纳入当前组（不断开）
- 否则，当前组结束，equal 段作为普通上下文渲染，新组从下一个非 equal segment 开始
- 一个合并组内的所有子块共享同一个 `data-block-index`

### 视觉

合并组外层包一个 `<div class="diff-group" data-block-index="N">`，内部各子块保留原有颜色样式（红/绿）。`diff-focused` 高亮加在外层 `diff-group` 上。

---

## 2. 自定义滚动条

### 需求

- 所有文档页面（Markdown、HTML、Diff）右侧显示自定义滚动条
- 文档高度 ≤ 视口高度时自动隐藏
- PDF 页面不受影响（保持原有逻辑）

### 结构

```
.content（overflow-y: scroll，隐藏原生滚动条）
  └── 文档内容
.doc-scrollbar（fixed，右侧，覆盖 .content 高度）
  ├── .doc-scrollbar-track（轨道，背景浅灰）
  │   ├── .doc-scrollbar-markers（diff 变更标记，仅 diff 页）
  │   └── .doc-scrollbar-thumb（视口块，半透明深色）
```

### 尺寸与位置

- 宽度：8px
- 位置：fixed，right 与 `.content` 右边对齐（需考虑 annotation sidebar 宽度）
- 高度：跟随 `.content` 可见高度

### 交互

- 随 `.content` scroll 事件实时更新 thumb 位置
- 点击 track 跳转到对应文档位置
- 拖拽 thumb 滚动文档

### Diff 页变更标记

- 在 track 上叠加彩色标记条，每个 `diff-group` 对应一条
- 颜色：insert → `#1a7f37`，delete → `#cf222e`，modify → `#f0a500`
- 标记位置 = 块顶部距文档顶部的比例 × track 高度
- 标记高度 = 块高度 / 文档总高度 × track 高度，最小 3px

### 原生滚动条

`.content` 使用 `scrollbar-width: none`（Firefox）+ `::-webkit-scrollbar { width: 0 }`（Chrome/Safari）隐藏原生滚动条，由自定义滚动条替代。

### 显示/隐藏

`ResizeObserver` 监听 `.content`，当 `scrollHeight <= clientHeight` 时隐藏滚动条。

---

## 3. 实现文件

| 文件 | 改动 |
|------|------|
| `src/client/main.ts` | 修改 `renderInlineDiffHTML` 分块合并逻辑；新增 diff 标记更新逻辑 |
| `src/client/ui/doc-scrollbar.ts`（新建） | 自定义滚动条组件：mount / unmount / update |
| `src/client/css.ts` | 添加 `.doc-scrollbar` 相关样式；隐藏 `.content` 原生滚动条 |
| `src/client/html.ts` | 在 `.content` 旁插入 `.doc-scrollbar` DOM |
