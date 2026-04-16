# PDF 划词评论 Handoff — 2026-04-16 / 2026-04-17 更新

## 目标
在 PDF 查看器里实现划词评论，功能和 MD 文件的划词评论一致：
1. 选中文字 → 弹出评论框
2. 提交评论后，原文对应位置有高亮标记
3. quote 内容正确（包含上下文）

## 当前状态

### 已完成
- PDF viewer 基础渲染（pdf-viewer.ts）
- 评论框弹出位置修复（用 clientX/Y 定位）
- 评论提交流程打通（annotation.ts）
- 提交后不卡死（移除了 highlightQuote 里的 renderPage 递归）
- `data-current-file` 在 PDF 模式下正确设置
- **新锚点设计**：用 `textContent.items` 索引作为稳定锚点（见下方）
- **[high] 懒加载页面高亮丢失** — 已修复（onPageRendered 回调重放高亮）
- **[medium] 监听器累积** — 已修复（app 级别注册，委托给 currentPdfBridge）

### 锚点设计变更（2026-04-17）

**问题**：坐标方案和 `sel.toString()` 都有精度问题，无法稳定锚定到单个单词。

**新方案（Hybrid）**：精确文本 + 稳定锚点分离
1. **quote**：用 `sel.toString()` 获取用户实际划选的精确文本
2. **锚点**：在 `textContent.items` 中定位这段文本，记录 item 索引范围

```ts
interface PdfAnnotation {
  // ...其他字段
  page: number;           // 页码
  pdfItemStart: number;   // items 起始索引（稳定锚点）
  pdfItemEnd: number;     // items 结束索引（包含）
}
```

**定位逻辑**：
1. 获取 `sel.toString()` 作为精确选中文本
2. 拼接 `items.map(i => i.str)` 得到完整文本
3. 在完整文本中查找选中文本的位置
4. 根据字符位置映射回 item 索引范围
5. 如果查找失败（PDF 有 scaleX 问题），fallback 到坐标近似

**优势**：
- 用户划选范围精确（不会强制吸附到整行）
- 锚点仍然稳定（基于 item 索引）
- 高亮时使用 `highlightByItemRange`，能正确定位

**API 变更**：
- `onTextSelected` 新增 `startItemIdx`, `endItemIdx` 参数
- `PdfViewerInstance` 新增 `highlightByItemRange(pageNum, start, end)` 方法
- Annotation 新增 `pdfItemStart`, `pdfItemEnd` 字段
- `renderHighlights` 优先使用 item index，fallback 到 quote 文本匹配

### 已修复问题（2026-04-17）

**[high] 懒加载页面的高亮永久丢失**
- 修复：`PdfViewerOptions` 新增 `onPageRendered` 回调
- `renderPage()` 完成后触发，立即重放该页的 annotation 高亮

**[medium] 每次打开 PDF 都累积 document 级监听器**
- 修复：监听器提升到 app 级别，只注册一次
- 使用 `currentPdfBridge` 变量委托给当前活跃的 viewer
- 切换文件时重置 `currentPdfBridge = null`
- 复用已有 viewer 时重建对应的 bridge

## 关键文件

| 文件 | 作用 |
|------|------|
| `src/client/pdf-viewer.ts` | PDF 渲染、mousedown/mouseup 事件、markSelectionSpans、highlightQuote |
| `src/client/pdf-annotation.ts` | handleTextSelected（构建 pending annotation）、renderHighlights |
| `src/client/pdf-translation.ts` | 段落翻译（当前已禁用，onParagraphClick 为空） |
| `src/client/main.ts` | PDF viewer 初始化、annotation:created 监听、data-current-file 设置 |
| `src/client/annotation.ts` | savePendingAnnotation、hideComposer、clearTempSelectionMark |

## 当前代码状态（pdf-viewer.ts mouseup 逻辑）

```ts
textLayerDiv.addEventListener("mouseup", (e) => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;
  const me = e as MouseEvent;
  const wrapperRect = wrapper.getBoundingClientRect();
  const mouseUpPageX = (me.clientX - wrapperRect.left) / scale;
  const mouseUpPageY = (me.clientY - wrapperRect.top) / scale;
  const pageH = viewport.height / scale;
  const selLeft = Math.min(mouseDownPageX, mouseUpPageX);
  const selRight = Math.max(mouseDownPageX, mouseUpPageX);
  const selTop = Math.min(mouseDownPageY, mouseUpPageY);
  const selBottom = Math.max(mouseDownPageY, mouseUpPageY);
  // BUG: selTop === selBottom when dragging horizontally
  // FIX: add minimum height tolerance
  ...
```

## Codex Adversarial Review 结论（2026-04-16）

> Verdict: **needs-attention / no-ship**

### [high] 懒加载页面的高亮永久丢失

`renderHighlights()` 先 `clearHighlights()` 再对每个 annotation 调 `highlightQuote()`，但 `highlightQuote()` 遇到未渲染页面直接 return（为了避免卡死）。没有任何机制在 `renderPage()` 完成后重放这些 annotation。

结果：打开带有已有评论的 PDF，或跳转到后面的页面时，annotation 高亮永远不会出现。

**修复方向**：在 `renderPage()` 完成后，检查是否有该页的 pending annotation，有则立即高亮。

---

### [high] multi-line 选择导致 quote 数据损坏

当前用 `midY` 确定所在行，只取一行的 items 作为 quote。但 `markSelectionSpans()` 仍然用浏览器的实际 DOM selection（可能跨多行）做视觉高亮。

结果：用户拖选多行，视觉高亮是多行，但保存的 quote 只有一行。重新加载后 anchor 匹配错误或失败。**这是数据损坏，不是 UI 问题。**

**修复方向**：要么限制 PDF 批注只支持单行选择（多行时拒绝），要么 quote 也从完整的拖选范围里提取（跨多行的 items）。

---

### [medium] 每次打开 PDF 都累积 document 级监听器

`main.ts` 里每次创建新 PDF viewer 都调 `document.addEventListener("annotations:loaded", ...)` 和 `document.addEventListener("annotation:created", ...)`，但从不移除。

结果：每次 annotation 事件触发时，所有历史 viewer 的 `renderHighlights()` 都会执行，包括已关闭的。由于 `renderHighlights()` 先调 `clearHighlights()`，会互相清除高亮，导致行为不确定。**这是"反复修改还是不对"的根本原因之一。**

**修复方向**：把监听器注册在 app 级别，只作用于当前活跃的 viewer；或者在 viewer 销毁时移除对应的监听器。

---

## 未解决问题（2026-04-17 后续工作）

### [high] 高亮位置不准确
**现象**：部分评论的高亮显示在错误位置，或根本不显示。
**根因**：PDF.js 的 `textContent.items` 和渲染后的 DOM spans 数量/顺序不一致：
- items: 93, spans: 85（第1页）
- items: 178, spans: 172（第2页）
**当前方案**：用 quote 文本匹配 span，但可能匹配到错误位置（多个 span 包含相同文本）。
**修复方向**：
1. 用 `getClientRects()` 坐标直接定位，绕过 items/spans 映射
2. 或存储 render 时的 span 索引（而非 items 索引）
3. 或改用 PDF 原生高亮（注释层）而非 DOM 高亮

### [medium] 选择粒度太粗
**现象**：用户选中一个单词，实际返回整行文本作为 quote。
**根因**：`textContent.items` 最小粒度是行/段，不是单词。
**影响**：评论 quote 过长，不够精确。
**修复方向**：
1. 接受现状（行级评论）
2. 用坐标比例裁剪 item 文本（需要处理不等宽字体）
3. 用 DOM Range 的 client rects 精确计算字符位置

### [low] 评论 popover 位置偏移
**现象**：点击 mark 后，popover 有时显示在错误位置（如标题附近而非正文）。
**根因**：`getBoundingClientRect()` 获取的是 mark 的位置，但 mark 可能在错误的 span 上。
**依赖**：先解决高亮位置问题。

### [low] 翻译功能未启用
**现象**：PDF 段落翻译已禁用。
**文件**：`pdf-translation.ts`

## 已完成（2026-04-17）

✅ **基本评论流程**：划词 → 弹出评论框 → 提交 → 保存到数据库
✅ **高亮显示**：`highlightByItemRange` 用 quote 匹配定位
✅ **点击 mark 显示 popover**：`pdf:show-popover` 事件
✅ **右侧列表点击跳转**：`jumpToAnnotation` 支持 PDF 滚动
✅ **懒加载页面高亮**：`onPageRendered` 回调
✅ **API 适配**：`fileType: "pdf"` 存储和读取

## 不要碰的地方

- `applyAnnotations()` 在 PDF 模式下已跳过（会导致 textLayer DOM 循环）
- `highlightQuote` 里不能调 `renderPage`（会导致卡死，见 `docs/pdf-render-performance.md`）
- `clearHighlights()` 只在 `renderHighlights()` 开头调一次
