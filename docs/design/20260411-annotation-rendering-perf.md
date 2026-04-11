# 评论渲染性能问题记录

## 根本原因

`renderAnnotationList` 在 `default` 密度模式下，对每个评论调用一次 `getAnnotationAnchorTopById()`，内部调用 `getBoundingClientRect()`。

**每次 `getBoundingClientRect()` 调用都会强制浏览器做一次同步 layout（forced reflow）。**

N 个评论 × 1 次 forced reflow = 串行 layout 计算，在 DOM 刚重建后代价极高。

```ts
// annotation.ts ~1332 行 — 问题所在
const tops = sorted.map((ann) => getAnnotationAnchorTopById(ann.id));
//                                 ↑ 每次调用 getBoundingClientRect()
```

## 为什么刷新后特别明显

刷新文件时调用链：

```
renderContent()               ← 重建整个 #content DOM
syncAnnotationsForCurrentFile()
  └─ applyAnnotations()       ← TreeWalker + mark DOM 重建
  └─ renderAnnotationList()   ← N × getBoundingClientRect() ← 卡在这里
```

- **刷新前**：DOM 稳定，layout 已缓存，`getBoundingClientRect` 很快
- **刷新后**：`#content` 整个重建，layout 是 dirty 状态，强制触发完整 layout 计算

## 已有修复

**2026-04-11**：把刷新后的 `syncAnnotationsForCurrentFile` 推到 `requestAnimationFrame`，让浏览器先完成 layout 再读取几何信息。

```ts
// main.ts — syncFileFromDisk
requestAnimationFrame(() => {
  syncAnnotationsForCurrentFile(false);
});
```

这解决了刷新后的卡顿，但 `renderAnnotationList` 本身的 N × forced-reflow 结构没变。

## 架构层面的根因

`renderAnnotationList` 把"读 DOM 几何信息"和"写 DOM"混在一起，且每次调用都是全量 `innerHTML` 重建。

真正的解法是把**定位计算**从 `renderAnnotationList` 分离，改成只在 scroll / resize 时重新计算，而不是每次内容变化都重算。这是一次较大的重构，尚未实施。

## 遇到类似卡顿时的排查思路

1. 是否在 DOM 刚重建后立刻读取了 `getBoundingClientRect` / `offsetHeight` / `offsetTop`？
2. 是否在循环里交替读写 DOM（read-write interleaving = layout thrashing）？
3. 用 `requestAnimationFrame` 把"读几何"推到下一帧是否能解决？
4. 如果根本解法，考虑把定位计算改成事件驱动（scroll/resize），而非每次渲染触发。

## 相关文件

- `src/client/annotation.ts` — `renderAnnotationList`、`getAnnotationAnchorTopById`、`resolvePositionedAnnotationOverlaps`
- `src/client/main.ts` — `syncFileFromDisk`、`syncAnnotationsForCurrentFile`
- `tests/unit/annotation-perf.test.ts` — TextNodeIndex 性能基准（JS 层，不含 DOM）
