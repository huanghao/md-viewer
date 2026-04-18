# PDF.js 原理与项目集成说明

---

## 第一部分：PDF.js 提供什么

### 1. 整体架构

PDF.js 是 Mozilla 开发的开源 PDF 渲染引擎，完全用 JavaScript 实现。核心包 `pdfjs-dist` 包含三个文件：

| 文件 | 运行位置 | 作用 |
|------|---------|------|
| `pdf.mjs` | 主线程 | 公开 API，负责调度 |
| `pdf.worker.mjs` | Web Worker | CPU 密集型的 PDF 解析、字体解码 |
| `pdf_viewer.css` | — | 文本层、注释层的内置样式 |

主线程通过 `postMessage` 把解析任务交给 Worker，解析完成后把结果传回主线程渲染，不阻塞 UI。

---

### 2. 渲染一页 PDF 的过程

PDF.js 把一页 PDF 渲染成**两个独立的层**，叠加在一起：

```
┌─────────────────────────────────────────┐
│         用户看到的效果                   │
│   "Introduction .............. 1"       │
│   "1. Background"                       │
└─────────────────────────────────────────┘
         ↑ 两层完全叠合

层 2：TextLayer（透明，可交互）
┌─────────────────────────────────────────┐
│  <span>Introduction</span>              │  ← 透明，覆盖在文字上方
│  <span>1</span>                         │    用户可以选中、复制
│  <span>1. Background</span>             │
└─────────────────────────────────────────┘

层 1：Canvas（可见，不可交互）
┌─────────────────────────────────────────┐
│  位图：PDF 页面的完整视觉渲染             │  ← 用户看到的文字、图片、线条
└─────────────────────────────────────────┘
```

**Canvas 层**：把 PDF 的矢量指令（画线、填色、绘字形）转成像素，用户看到的所有视觉内容都来自这里。文字是像素，不可交互。

**TextLayer 层**：用透明的 `<span>` 元素精确覆盖在 Canvas 上对应文字的位置，使文字可以被鼠标选中和复制。用户看不到这些 span，但鼠标事件作用在它们上面。

两层各自独立生成，Canvas 层负责"看起来对"，TextLayer 负责"交互对"。

---

### 3. API 调用顺序

```
getDocument(url)                    → PDFDocumentProxy   // 加载整个 PDF
  └─ pdfDoc.getPage(n)              → PDFPageProxy        // 获取第 n 页（从 1 开始）
       ├─ page.getViewport({scale}) → PageViewport        // 计算渲染尺寸
       ├─ page.render({ctx,vp})     → RenderTask          // 渲染 Canvas 层
       └─ page.getTextContent()     → TextContent         // 获取文字数据
            └─ new TextLayer(...)                         // 渲染 TextLayer 层
                 └─ textLayer.render()
```

`scale` 控制缩放比例：1.0 = 72 DPI（PDF 原始分辨率），1.5 = 108 DPI（本项目默认值）。

---

### 4. TextItem：文字数据的基本单元

`getTextContent()` 返回一个 `TextContent` 对象，其中 `items` 是 `TextItem[]`——页面上所有文字片段的**扁平列表**，没有行、段落、列的概念，只有坐标。

每个 `TextItem` 的字段：

```typescript
interface TextItem {
  str: string;         // 这个片段的文字内容，例如 "Introduction" 或单个字符 "α"

  transform: number[]; // 6 元素仿射变换矩阵 [a, b, c, d, x, y]
                       //
                       //   x = transform[4]  item 左边界的 X 坐标（PDF 坐标系）
                       //   y = transform[5]  文字基线的 Y 坐标（PDF 坐标系，原点在左下角）
                       //
                       //   a = transform[0]  字体大小（单位：pt）
                       //   d = transform[3]  字体大小，带符号（水平正文为负值，因为 PDF Y 轴向上）
                       //                     正常情况下 Math.abs(d) === a === 字体大小
                       //
                       //   注意：a/d 不是"缩放比例"，而是直接等于字体的 pt 数。
                       //   例如 12pt 正文：a=12, d=-12；18pt 标题：a=18, d=-18。
                       //
                       //   b = transform[1]  斜切分量（italic 等斜体字形时非 0，正常水平文字为 0）
                       //   c = transform[2]  斜切分量（同上）

  width: number;       // 这个片段的渲染宽度（PDF 坐标系单位，与 x/y 同单位，不是像素）
                       // 转换为屏幕像素：width * scale * devicePixelRatio

  height: number;      // 字体高度（PDF 坐标系单位，与 width 同单位，不是像素）
                       // 注意：部分 PDF 字体信息不完整，这个字段可能为 0
                       // height=0 不影响 Canvas 渲染（位图不依赖它），
                       // 但会影响项目代码计算文字包围盒的精度

  dir: string;         // 文字方向，通常是 'ltr'（从左到右）
  fontName: string;    // PDF 内部字体名称，例如 "g_d0_f1"，通常不可读
}
```

**一个 item 代表多大的文字单元？**

item 的粒度由 PDF 生成时的**字体切换**决定——同一字体的连续文字合为一个 item，字体变化（粗体、斜体、字号变化）就会切断。实测 15 份 arXiv 学术论文的结果：

| 内容类型 | 实际粒度 | 说明 |
|----------|---------|------|
| 正文段落 | **整行**（含空格） | 整行是一个 item，`str` 包含整行文字 |
| 标题 | **整行** | 同上 |
| 斜体/粗体词 | **单词或短语** | 字体切换处切断，每段相同字体是一个 item |
| 数学公式 | **单字符** | 每个 α、∑、=、数字各是独立 item |
| 页眉/页脚 | **整行** | 通常一行一个 item |
| 空格占位符 | **空字符串** | `str = " "` 或 `str = ""`，纯占位用 |

单字符 item 在公式密集的论文里占比高达 40–50%（实测数据）。

**示例 1：正文整行 item（正常情况）**

```
// 一整行正文是一个 item
{ str: "We make design choices that seek to maximize our ability to scale the model",
  transform: [10, 0, 0, -10, 70.9, 713.2],  // 10pt 字体，x=70.9, y=713.2
  width: 453.5,
  height: 10.0 }

// 下一行
{ str: "while ensuring it remains stable during training. For example, we opt for a",
  transform: [10, 0, 0, -10, 70.9, 700.8],  // y 减小 ≈ 行高
  width: 453.2,
  height: 10.0 }
```

**示例 2：斜体词打断整行（字体切换）**

同一行 "We present **Quiet-STaR**, a generalization..." 会被切成多个 item：

```
{ str: "We",           transform: [10, 0, 0, -10, 70.9, 650.1], width: 12.2, height: 10 }
{ str: "present",      transform: [10, 0, 0, -10, 85.4, 650.1], width: 33.8, height: 10 }
{ str: " ",            transform: [10, 0, 0, -10, 121.2, 650.1], width: 3.0, height: 0  }  ← 空格，height=0
{ str: "Quiet-STaR",   transform: [10, 0, 0, -10, 124.2, 650.1], width: 52.1, height: 10 }  ← 斜体，独立 item
{ str: ", a generalization of STaR in which LMs learn to",
                       transform: [10, 0, 0, -10, 178.3, 650.1], width: 255.4, height: 10 }
```

**示例 3：数学公式字符（height=0 的情况）**

```
// 公式 "∑_{i=1}^{n}" 会被切成很多单字符 item，且 height 通常为 0
{ str: "∑",  transform: [14, 0, 0, -14, 120.0, 580.0], width: 9.8,  height: 0 }  ← height=0！
{ str: "n",  transform: [8,  0, 0, -8,  130.1, 590.0], width: 5.2,  height: 0 }  ← 上标，字号更小
{ str: "i",  transform: [8,  0, 0, -8,  130.1, 572.0], width: 3.1,  height: 0 }  ← 下标
{ str: "=",  transform: [8,  0, 0, -8,  134.0, 572.0], width: 6.4,  height: 0 }
{ str: "1",  transform: [8,  0, 0, -8,  141.2, 572.0], width: 4.8,  height: 0 }
```

公式字符的 `height=0` 是正常现象——这些字符的字体元数据不完整，`height` 字段没有值。Canvas 渲染不受影响（直接用字形数据），但项目代码的包围盒计算需要 fallback 到 `Math.abs(transform[3])`。

同一行的 items Y 坐标相同（或差 < 1px），换行时 Y 跳变，跳变量约等于行高。

---

### 5. 坐标系与单位

**PDF 坐标系 vs 屏幕坐标系**

PDF 坐标系和屏幕坐标系方向相反：

```
PDF 坐标系                    屏幕坐标系（CSS px）
原点：左下角                  原点：左上角
Y 轴：向上                    Y 轴：向下
单位：pt（1pt = 1/72 英寸）   单位：CSS 像素

  y↑                            ┌──────→ x
  │                             │
  │  "We" 在 (72, 720)          │  "We" 在 (108, 449)  ← 乘以 scale=1.5 后
  │                             │
  └──────→ x                    ↓ y
```

**坐标转换**（`pageHeight` = `viewport.height / scale`）：

```
屏幕 X = pdf_x × scale
屏幕 Y = (pageHeight - pdf_y) × scale
```

示例：页面高度 779pt，scale=1.5，PDF 坐标 (72, 720) → 屏幕坐标 (108, 88.5)。

**width / height 的单位**

`TextItem.width` 和 `height` 的单位是 PDF 坐标系的 pt，不是像素。
转换为屏幕像素：`screenWidth = item.width × scale`。

**基线（baseline）与文字包围盒**

`transform[5]`（即 y）是文字**基线**的 PDF Y 坐标，不是文字顶部。基线是字母底部对齐的那条线，下延笔画（g、p、y 的尾巴）会突破基线往下。

```
屏幕坐标示意（Y 向下）：

baselineScreenY = pageHeight - transform[5]
                                             ←── 文字顶部（ascent）
  H e l l o                                      iy = baselineScreenY - height
  ─────────────────────── ← 基线（baseline）      baselineScreenY
  g p y 的尾巴              ← 下延（descent）      iBottom = baselineScreenY + height × 0.3
```

项目代码用这三个值构建每个 item 的垂直包围盒，用于判断鼠标点击是否命中该 item。

---

### 6. TextItem 和 span 的关系

TextLayer 渲染时，为每个 TextItem 生成一个 `<span>`，用 CSS `transform: matrix(...)` 定位：

```html
<div class="pdf-text-layer textLayer">
  <!-- 每个 span 对应一个 TextItem，opacity 接近 0，用户看不到 -->
  <span style="transform:matrix(1,0,0,-1,72,449)">Introduction</span>
  <span style="transform:matrix(1,0,0,-1,780,449)">1</span>
  <span style="transform:matrix(1,0,0,-1,72,430)">1. Background</span>
</div>
```

span 的 `transform: matrix(a,b,c,d,e,f)` 中：
- `e`/`f` 是屏幕坐标（定位用）
- `d` 为负值，因为 PDF Y 轴向上而 CSS Y 轴向下，TextLayer 用负缩放翻转

**通常一个 TextItem 对应一个叶子 span**，但 PDF.js 有时会嵌套（外层 span 做容器，内层 span 是实际文字）。项目代码用 `s.querySelector("span") === null` 过滤叶子节点。

**item 坐标可能在视觉上重叠**：TextItem 的坐标来自 PDF 文件本身，PDF 允许文字叠放（比如粗体是普通字体叠加一个偏移复本）。span 是 DOM 元素，浏览器会按 z-index 层叠，视觉上不会"重叠消失"，但两个 span 的点击区域可能重叠，导致鼠标命中歧义。这在正常排版的论文里极少出现，扫描件或特殊 PDF 里可能遇到。

**TextItem 和 span 是两套独立的数据**：TextItem 在内存里，span 在 DOM 里。PDF.js 渲染时可能对空白字符做不同处理（比如把多个连续空格合并为一个），所以 `item.str` 和 `span.textContent` 可能有空白字符上的细微差异，但不会有文字内容的丢失或增加。

---

### 7. 数据量参考（A4 学术论文，scale=1.5）

| 数据 | 典型大小 | 说明 |
|------|---------|------|
| PDF 原始页数据 | 20–200 KB | 压缩后，含矢量指令、字体子集、图片 |
| Canvas 位图（Retina×2） | ≈ 7 MB | 2480×3508 × 4 bytes/px（RGBA），未压缩 |
| TextContent（TextItem[]） | 5–50 KB | 含所有 item 的坐标和字符串 |
| TextLayer DOM（span 数量） | 数百个 span | 内存开销远小于 Canvas |

---

## 第二部分：项目如何使用这些 API

### 8. 库加载与初始化

**文件：`src/client/html.ts`**

```html
<script type="module">
  import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.mjs';
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.worker.mjs';
  window.pdfjsLib = pdfjsLib;
  window.dispatchEvent(new Event('pdfjslib-ready'));
</script>
```

通过 CDN 加载，挂到 `window.pdfjsLib`，发出 `pdfjslib-ready` 事件。`pdf-viewer.ts` 用 `getPdfjsLib()` 等待这个事件再初始化，避免竞态。

---

### 9. 懒渲染

**文件：`src/client/pdf-viewer.ts:348`**

打开 PDF 时只创建空的占位 `<div>`（高度等于第一页尺寸），用 `IntersectionObserver` 监听可见性。当页面进入视口前 2500px（约 2 页 A4）时才触发真正的渲染。

```
RENDER_MARGIN = 2500px  ← 预加载边距，避免翻页时白屏
```

每页渲染完加入 `rendered` Set，避免重复渲染。高 DPI 处理：Canvas 物理像素按 `devicePixelRatio` 放大，CSS 尺寸不变，使 Retina 屏文字清晰（TextLayer 的 span 是 DOM 元素，浏览器自动处理 DPR）。

---

### 10. 文本选中：鼠标坐标 → TextItem

**文件：`src/client/pdf-viewer.ts:227`**

**为什么需要项目自己实现这个映射？**

PDF.js 没有提供"给定屏幕坐标，返回对应 TextItem"的 API。PDF.js 的 `PDFFindController` 只做文字搜索（关键词 → 高亮），不做坐标→item 的映射。TextLayer 的 span 虽然可以用浏览器原生 `window.getSelection()` 获取选中内容，但 PDF.js 的 span 不是连续的 DOM 文本流（每个 span 都是绝对定位的孤立元素），`getSelection()` 返回的范围不稳定，无法可靠地得到"选中的是第几个 item"。所以项目自己实现了这个映射。

**`getBoundingClientRect` 是什么**

`element.getBoundingClientRect()` 是浏览器 API，返回一个元素相对于视口（viewport）左上角的像素坐标 `{left, top, width, height}`。用它来把鼠标的视口坐标转换为元素内部的局部坐标。

**映射流程**

用户拖拽时会产生 `mousedown`（按下）和 `mouseup`（抬起）两个事件，各自记录一个坐标，构成选区矩形：

```
mousedown (clientX₁, clientY₁)  →  选区左上角
mouseup   (clientX₂, clientY₂)  →  选区右下角

选区矩形 [selLeft, selRight, selTop, selBottom]（屏幕坐标）
选区中心 selCenterX = (selLeft + selRight) / 2
         selCenterY = (selTop + selBottom) / 2
```

然后遍历该页**所有** TextItem，为每个 item 计算包围盒（见坐标系章节），找到与选区中心最近的那一个：

```typescript
const fontH = item.height || Math.abs(item.transform[3]) || 12;
// ↑ 包围盒的垂直范围依赖 fontH，这是唯一的不确定量（见下文）

包围盒（屏幕坐标）：
  左  ix      = transform[4] × scale
  右  iRight  = (transform[4] + width) × scale
  上  iy      = baselineScreenY - fontH × scale   // 文字顶部
  下  iBottom = baselineScreenY + fontH × 0.3 × scale
```

条件：item 与选区**水平重叠**，且选区中心 Y 在 item 的 `[iy, iBottom]` 范围内。满足条件的 item 里取距离最近的，记录其索引 `startItemIdx`。

**时间复杂度**：O(n)，n 是该页的 item 数量。实测每页约 100–250 个 item，每次 mouseup 需要遍历一次，每个 item 做几次乘法和比较，耗时在 1ms 以内，不会感知到卡顿。

**为什么 fontH 是不确定量**

item 的左/右边界由 `transform[4]`（x）和 `width` 确定，这两个值来自 PDF 文件，是确定的。
item 的上/下边界依赖 `fontH`（字体高度）。`fontH` 的三级 fallback 是**项目代码自己写的**（`pdf-viewer.ts:257`），不是 PDF.js 提供的——PDF.js 只负责渲染，渲染时它直接用 PDF 文件里的字形数据，不依赖 `height` 字段。`height` 字段在部分 PDF 中为 0 是 PDF 文件本身的问题，PDF.js 把它原样暴露出来，项目代码需要自己处理。

```
item.height（PDF 字体元数据，部分 PDF 中为 0）
  → Math.abs(item.transform[3])（字体大小，旋转文字时不准）
    → 12（硬编码，对非 12pt 字体都是错的）
```

如果 fallback 到 `12` 而实际字体是 18pt，包围盒上边界偏低，鼠标点击文字顶部时落在包围盒外，选中失败。

**实测结论（2026-04-19）与实现合理性分析**

通过交互测试工具（`scripts/pdf-select-lab/`）对多次选中做了实测，结合 15 份论文的定量数据，得出以下结论。

**当前实现的合理性评估**

当前实现（方法 A，选区中心找最近 item）的核心逻辑：
1. 用鼠标坐标找到对应的 item（整行）→ **这一步是正确的**
2. 把 `item.str`（整行文字）存为注释的 `quote` → **这一步是问题所在**

问题不在"找到了哪个 item"，而在于"用整行当 quote"。因为 item 粒度是整行，所以高亮时会高亮整行，而不是用户实际选中的词。

**`sel` 和 `Range` 是什么**

`sel`（`window.getSelection()`）是浏览器提供的对象，代表用户当前选中的文字区域。它有一个 `toString()` 方法返回选中的文字字符串，还有 `getRangeAt(0)` 方法返回一个 `Range` 对象。

`Range` 是浏览器对"选区范围"的精确描述，包含四个关键属性：
- `startContainer`：选区开始的 DOM 节点（对于文字，是文本节点 TextNode）
- `startOffset`：在 startContainer 内，选区从第几个字符开始（从 0 计数）
- `endContainer`：选区结束的 DOM 节点
- `endOffset`：在 endContainer 内，选区到第几个字符结束

**`sel.toString()` 为什么不可靠**

`sel.toString()` 直接把 Range 内的文字拼起来返回。问题在于 PDF.js 的 span 是整行粒度——span 里装着一整行文字。当用户在这个 span 内部拖拽时，`startOffset` 是鼠标按下时在 span 内的字符位置，不是词边界。

举例：标题 span 的 `textContent` 是 `"Quiet-STaR: Language Models Can Teach Themselves to"`。用户想选 "Language Models"，但 mousedown 落在 "L" 的中间偏右（字符偏移 = 1），`toString()` 就返回 `"anguage Models"` 而不是 `"Language Models"`。

**正确做法：用 Range 的偏移直接截取**

`Range.startOffset` 和 `endOffset` 是精确的字符位置。由于 `item.str` 和 `span.textContent` 一致（实测验证），可以直接用这两个偏移从 `item.str` 里切出精确的选中文字：

```typescript
const sel = window.getSelection();
const range = sel.getRangeAt(0);

// range.startOffset：选区在 span 内从第几个字符开始
// range.endOffset：选区在 span 内到第几个字符结束
// item.str 和 span.textContent 一致，所以可以直接用同样的偏移截取

const quote = item.str.slice(range.startOffset, range.endOffset);
// 用户选了 "Language Models" → startOffset=12, endOffset=27
// item.str.slice(12, 27) = "Language Models"，精确
```

这样无论是正文还是标题，都能拿到精确的选中文字，不依赖 fontH 或坐标计算。

**三种方法的对比（实测）**

| 方法 | 单行选词（item 定位） | 单行 quote 精度 | 跨行选中 |
|------|-------------------|---------------|---------|
| **A（当前：选区中心）** | ✓ 正确命中整行 item | ✗ quote = 整行 | ✗ 只命中 1 个 item |
| **B（down→up 范围）** | ✗ 跑偏到其他行 | — | ✗ 范围不足 |
| **C（原生 Selection 反查）** | ✓ 与 A 一致 | ✓ 可用 Range 截取精确 quote | ✓ 完整覆盖所有行 |

**结论**：
- item **定位**用方法 A（当前实现）即可，合理
- **quote 文字**应改用 `Range.startOffset/endOffset` 从 `item.str` 截取，而不是用 `item.str` 整行
- 跨行选中（目前不支持）应用方法 C 反查所有命中 span 的 item 索引范围

---

### 11. 拖拽选中时的视觉高亮

**文件：`src/client/pdf-viewer.ts:500`**（`markSelectionSpans`）

用户拖拽时，浏览器原生的文本选中会在 TextLayer 的 span 上显示蓝色选中效果（CSS `::selection`）。`mouseup` 后项目清除了 `window.getSelection()`（为了让后续点击不受上次选区干扰），蓝色效果随之消失。

为了给用户保留视觉反馈，项目在 `mouseup` 时额外插入 `<mark class="pdf-selection-mark">` 元素包裹命中 span 的文字，显示蓝色背景。这个 `<mark>` 是临时的，下次操作时会被 `clearSelectionMark()` 移除。

> 当前清除 Selection 是为了让后续点击不受上次选区干扰。实测证明原生 Selection 的 Range 对象可以可靠地反查 item 索引和精确 quote，后续改进应利用这一点（见 §10 实测结论）。

---

### 12. 高亮：TextItem 索引 → span 加 class

**文件：`src/client/pdf-viewer.ts:431`**

保存注释时记录了 `startItemIdx`。渲染高亮时：

```
items[startItemIdx].str  →  rangeQuote（item 的文字内容）
  ↓
在 TextLayer 的叶子 span 里搜索 rangeQuote
  ↓
命中的 span 加 css class（pdf-highlight + annotation-mark）
```

为什么要在 span 里再搜索一次：TextItem 在内存里，span 在 DOM 里，两者独立生成，`item.str` 和 `span.textContent` 可能因空白处理不同而不完全一致，所以必须通过文字内容做二次匹配。

**两套高亮路径：**

| 路径 | 触发条件 | 实现 |
|------|---------|------|
| A：item 索引 | 新注释（有 `start` 字段） | `highlightByItemRange`：用索引重建文字，在 span 里精确匹配 |
| B：文本匹配 | 旧注释（无索引） | `highlightQuote`：遍历所有叶子 span 做子串匹配 |

两者都只对**已渲染**的页面生效。每次页面渲染完成（`onPageRendered` 回调）时重放所有高亮，保证懒加载后注释能正确显示。

**`highlightQuote` 的过滤规则**：跳过 `text.length <= 5` 的 span。这意味着公式里的单字符 item（α、∑、=）无法被高亮。

---

### 12. 段落识别：TextItem[] → PdfTextBlock[]

**文件：`src/client/pdf-viewer.ts:529`**

PDF.js 只提供扁平的 TextItem 列表，没有段落概念。翻译功能需要"段落"作为翻译单元，项目自己实现了分组：

```typescript
// 把相邻 Y 坐标差 < lineHeight × 1.5 的 items 合并为一个 block
const lineHeight = prev.height || 12;
if (Math.abs(currY - prevY) < lineHeight * 1.5) {
  // 同一 block
} else {
  // 新 block 开始
}
```

**deltaY**（相邻 item 的 Y 坐标差）的含义：

| deltaY 范围 | 含义 |
|------------|------|
| ≈ 0 | 同一行（水平排列） |
| ≈ lineHeight | 正常换行 |
| > lineHeight | 段落间距、标题间距、跨栏跳跃 |

`PdfTextBlock` 是**项目自定义的抽象**，PDF.js API 不提供。

---

### 13. CSS class 说明

PDF.js 库自带（由库内部管理，项目不直接操作）：

| Class | 元素 | 作用 |
|-------|------|------|
| `.textLayer` | 文本层容器 `<div>` | 根节点标识 |
| `.textLayer .highlight` | 内部 `<span>` | PDF.js 内置搜索高亮（`PDFFindController` 管理） |
| `.textLayer .highlight.selected` | 内部 `<span>` | 当前选中的搜索结果 |
| `.textLayer .endOfContent` | 末尾 `<div>` | 处理跨行选区边界 |

项目自定义（定义在 `src/client/css.ts`）：

| Class | 元素 | 作用 |
|-------|------|------|
| `pdf-text-layer` | 文本层容器 `<div>` | 项目标识，用于 `querySelector` 定位 |
| `pdf-highlight` | 叶子 `<span>` | 注释高亮，黄色背景 |
| `annotation-mark` | 叶子 `<span>` | 已保存注释，黄色下划线，可点击 |
| `annotation-mark.is-active` | 叶子 `<span>` | 当前激活注释，加深背景 |
| `mark.pdf-selection-mark` | 项目插入的 `<mark>` | 选中时的临时蓝色高亮 |

为什么不复用 `.highlight`：它是 PDF.js 内置搜索的专用 class，库内部会随时清除它，直接操作会冲突。

---

### 14. 查看器生命周期

**文件：`src/client/main.ts:84`**

`pdfViewerRegistry`（Map）管理所有已打开的 PDF 查看器实例。切换到其他文件 10 分钟后自动 `destroy()` 释放内存（Canvas 位图约 7 MB/页）。切换回来时从 `localStorage` 恢复滚动位置。

---

### 15. 数据流总图

```
用户打开 PDF
  ↓
main.ts: createPdfViewer()
  ↓
pdf-viewer.ts: getDocument("/api/pdf-asset?path=...")
  ├── 创建占位 div × numPages
  └── IntersectionObserver 监听可见性
          ↓ (进入视口前 2500px)
      renderPage(n)
          ├── getPage(n) → getViewport(scale)
          ├── Canvas: page.render()
          ├── TextLayer: getTextContent() + TextLayer.render()
          ├── buildTextBlocks()  → PdfTextBlock[]（翻译用）
          └── onPageRendered 回调
                  ↓
          pdf-annotation.ts: renderHighlights()
                  ├── highlightByItemRange()  ← 新注释（有 item 索引）
                  └── highlightQuote()         ← 旧注释（文本匹配）

用户选中文字
  ↓ mouseup
  鼠标坐标 → PDF 页面坐标 → TextItem 包围盒匹配 → startItemIdx
  ↓
pdf-annotation.ts: handleTextSelected()
  ↓ 创建注释，保存 startItemIdx
  ↓
renderHighlights() → highlightByItemRange(startItemIdx)
```

---

### 16. 关键文件索引

| 文件 | 职责 |
|------|------|
| `src/client/html.ts` | CDN 加载 pdfjs-dist，暴露到 window |
| `src/client/pdf-viewer.ts` | 核心查看器：渲染、高亮、文本选择、滚动 |
| `src/client/pdf-annotation.ts` | 注释桥接层：连接查看器与注释系统 |
| `src/client/pdf-translation.ts` | 段落翻译：基于 PdfTextBlock，带 localStorage 缓存 |
| `src/client/main.ts` | 查看器生命周期管理、事件路由 |
| `src/handlers.ts` | `/api/pdf-asset` 接口：读取本地 PDF 文件 |
| `src/client/css.ts` | PDF 相关样式 |
