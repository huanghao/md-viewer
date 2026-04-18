# PDF.js 原理与项目集成说明

## 一、PDF.js 是什么

PDF.js 是 Mozilla 开发的开源 PDF 渲染引擎，完全用 JavaScript 实现，无需任何原生插件。它通过 Canvas API 将 PDF 页面渲染为位图，同时提供文本层（TextLayer）使文字可选中、可搜索。

**一页 PDF 的数据量参考（以 A4 学术论文为例，scale=1.5）：**

| 数据 | 典型大小 | 说明 |
|------|----------|------|
| PDF 原始页数据 | 20–200 KB | 压缩后的页面流，含矢量指令、字体子集、图片 |
| Canvas 位图（scale=1.5，Retina×2） | ≈ 7 MB | 1240×1754 × 4 bytes/px（RGBA），未压缩内存占用 |
| TextContent（TextItem[]） | 5–50 KB | JSON 结构，含所有 text item 的坐标和字符串 |
| 文本层 DOM（span 数量） | 数百个 span | 每个 item 一个 span，内存开销远小于 canvas |

除 Canvas 和 TextLayer 外，PDF.js 还可以渲染 **AnnotationLayer**（PDF 原生注释，如链接、表单字段、高亮批注）。本项目未使用 AnnotationLayer，仅使用 Canvas + TextLayer 两层。

核心包是 `pdfjs-dist`，包含三个主要部分：

| 文件 | 作用 |
|------|------|
| `pdf.mjs` | 主库，运行在主线程，提供所有公开 API |
| `pdf.worker.mjs` | Worker 线程，负责 PDF 解析和解码（CPU 密集型） |
| `pdf_viewer.css` | 文本层、注释层等内置 UI 组件的样式 |

主线程和 Worker 通过 `postMessage` 通信。解析工作在 Worker 中异步完成，不阻塞 UI。

---

## 二、核心渲染流程

### 1. 加载文档

```
getDocument(url) → PDFDocumentLoadingTask → PDFDocumentProxy
```

`getDocument` 接受 URL 或 ArrayBuffer，返回一个 loading task，`.promise` 解析为 `PDFDocumentProxy`（代表整个 PDF 文档）。

### 2. 获取页面

```
PDFDocumentProxy.getPage(pageNum) → PDFPageProxy
```

页面从 1 开始编号。`PDFPageProxy` 包含页面的尺寸、旋转角度等元数据。

### 3. 计算视口

```
PDFPageProxy.getViewport({ scale }) → PageViewport
```

`PageViewport` 包含渲染所需的宽高（单位：CSS 像素 × scale）和变换矩阵。scale 是缩放比例，1.0 = 72 DPI（PDF 原始分辨率），1.5 = 108 DPI。

### 4. Canvas 渲染

```
page.render({ canvasContext, viewport }) → RenderTask
```

将页面内容绘制到 `<canvas>` 上。这是纯位图渲染，文字不可选中。

### 5. 文本层

```
page.getTextContent() → TextContent
new TextLayer({ textContentSource, container, viewport })
textLayer.render()
```

`getTextContent` 返回页面中所有文字的位置和内容（`TextItem[]`）。每个 `TextItem` 的核心字段：

```typescript
{
  str: string,        // 文字内容，例如 "Introduction"
  transform: number[] // [scaleX, skewX, skewY, scaleY, x, y]，x/y 是页面坐标
  width: number,      // 文字渲染宽度（页面坐标单位）
  height: number,     // 字体高度（近似行高）
}
```

`TextLayer` 根据这些坐标，将每个 item 渲染为一个透明 `<span>`，用 CSS `transform: matrix(...)` 精确定位，叠加在 Canvas 上方。

**视觉示意（从侧面看两层的叠加关系）：**

```
┌─────────────────────────────────────────────┐
│  用户视角：看到的是 Canvas 渲染的 PDF 内容    │
│                                             │
│  "Introduction ................... 1"       │  ← Canvas 位图（可见）
│  "1. Background"                            │
│  "This paper proposes..."                   │
└─────────────────────────────────────────────┘
         ↑ 完全叠合，像透明薄膜盖在上面
┌─────────────────────────────────────────────┐
│  TextLayer（透明，用户看不到，但可交互）      │
│                                             │
│  <span opacity≈0>Introduction</span>        │  ← 精确覆盖 Canvas 上的文字
│  <span opacity≈0>1</span>                   │
│  <span opacity≈0>1. Background</span>       │
│  <span opacity≈0>This paper proposes</span> │
└─────────────────────────────────────────────┘
```

实际 DOM 结构（页面包装器内）：

```html
<div class="pdf-page-wrapper">
  <!-- 层 1：Canvas 位图（可见，不可交互） -->
  <canvas width="2480" height="3508"
          style="width:827px; height:1169px"></canvas>

  <!-- 层 2：文本层（透明，可选中） -->
  <div class="pdf-text-layer textLayer"
       style="width:827px; height:1169px; position:absolute; top:0; left:0">
    <span style="font-size:14px; transform:matrix(1,0,0,-1,72,449)">Introduction</span>
    <span style="font-size:14px; transform:matrix(1,0,0,-1,780,449)">1</span>
    <span style="font-size:12px; transform:matrix(1,0,0,-1,72,430)">1. Background</span>
    <!-- ... 每个 TextItem 对应一个 span，opacity 接近 0 -->
  </div>
</div>
```

`transform: matrix(a,b,c,d,e,f)` 中 `e`/`f` 是定位坐标，`a`/`d` 编码字体缩放，`d` 为负值是因为 PDF Y 轴向上而 CSS Y 轴向下，TextLayer 用负 scale 翻转。

高亮时给 span 加 `background-color`，颜色会透过透明文字显示在 Canvas 上方，形成视觉高亮效果。

注意：这里的 `<span>` 是 **PDF.js 内部构造**的，与项目代码无关。项目代码（`highlightQuote`、`highlightByItemRange`）只是查询这些 span 并给它们加 CSS class。

**CSS class 来源说明：**

PDF.js 库（`pdf_viewer.css`）自带的 class，由 PDF.js 内部管理，项目代码不直接操作：

| Class | 加在哪个元素上 | 作用 |
|-------|--------------|------|
| `.textLayer` | 文本层容器 `<div>` | 标识文本层根节点，CSS 用于设置透明度、定位 |
| `.textLayer .highlight` | 文本层内部 `<span>` | PDF.js 内置搜索高亮，由 `PDFFindController` 管理 |
| `.textLayer .highlight.selected` | 文本层内部 `<span>` | 当前选中的搜索结果 |
| `.textLayer .endOfContent` | 文本层末尾 `<div>` | 辅助元素，用于处理跨行选区的边界行为 |
| `.textLayer span.markedContent` | 文本层内部 `<span>` | PDF 结构标记内容（可访问性，实际 PDF 中较少见） |

本项目自定义的 class（定义在 `src/client/css.ts`）：

| Class | 加在哪个元素上 | 作用 |
|-------|--------------|------|
| `pdf-text-layer` | 文本层容器 `<div>`（与 `textLayer` 并列） | 项目自有标识，用于 `querySelector(".pdf-text-layer")` 定位容器 |
| `pdf-highlight` | PDF.js 生成的叶子 `<span>` | 注释高亮，黄色背景 |
| `annotation-mark` | PDF.js 生成的叶子 `<span>` | 已保存注释的标记，黄色下划线，可点击 |
| `annotation-mark.is-active` | PDF.js 生成的叶子 `<span>` | 当前激活的注释，加深背景 |
| `mark.pdf-selection-mark` | 项目插入的 `<mark>` 元素 | 文字选中时的临时蓝色高亮 |

**为什么不复用 `.highlight` 而自定义 `pdf-highlight`？**

`.textLayer .highlight` 是 PDF.js 内置搜索功能（`PDFFindController`）的专用 class，由库内部的查找逻辑统一添加和清除。本项目没有使用 PDF.js 的内置搜索，直接操作该 class 会与库内部状态冲突（库可能随时清除它）。用项目自定义的 `pdf-highlight` 可以独立控制生命周期，不受库行为干扰。

---

## 三、坐标系说明

PDF 坐标系以**左下角为原点**，Y 轴向上。`TextItem.transform` 是一个 6 元素数组 `[scaleX, skewX, skewY, scaleY, x, y]`，其中 `transform[4]` 是 X 坐标，`transform[5]` 是基线 Y 坐标（PDF 坐标）。

转换到屏幕坐标（左上角原点，Y 轴向下）：

```
screenY = viewport.height / scale - pdfY
```

项目中的 `buildTextBlocks`（`pdf-viewer.ts:529`）和鼠标事件处理（`pdf-viewer.ts:261`）都依赖这个转换。

---

## 四、项目中的集成方式

### 4.1 库加载

**文件：`src/client/html.ts:59-67`**

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/web/pdf_viewer.css">
<script type="module">
  import * as pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.mjs';
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.9.155/build/pdf.worker.mjs';
  window.pdfjsLib = pdfjsLib;
  window.dispatchEvent(new Event('pdfjslib-ready'));
</script>
```

通过 CDN 加载，挂到 `window.pdfjsLib`，发出 `pdfjslib-ready` 事件。`pdf-viewer.ts` 用 `getPdfjsLib()` 等待这个事件再初始化，避免竞态。

### 4.2 懒渲染

**文件：`src/client/pdf-viewer.ts:348-368`**

页面初始化时只创建空的占位 `<div>`（高度等于第一页尺寸），用 `IntersectionObserver` 监听可见性。当页面进入视口前 2500px（约 2 页 A4）时触发 `renderPage`。

```
RENDER_MARGIN = 2500px  ← 预加载边距，避免翻页时白屏
```

每页渲染后加入 `rendered` Set，避免重复渲染。

**评价懒渲染质量的参考指标：**

- **白屏率**：翻页时出现空白占位的频次，RENDER_MARGIN 越大越低，但内存占用越高
- **首页可见时间**：从打开文件到第 1 页 canvas 渲染完成的耗时
- **内存峰值**：同时渲染页数 × 单页 canvas 内存（约 7 MB/页），可通过 `getRenderedCount()` 监控
- **渲染抖动**：IntersectionObserver 触发到 canvas 出现的延迟，受 `getPage` + `render` 耗时影响

### 4.3 高 DPI 支持

**文件：`src/client/pdf-viewer.ts:139-144`**

```typescript
canvas.width  = Math.floor(viewport.width  * dpr);
canvas.height = Math.floor(viewport.height * dpr);
canvas.style.width  = `${viewport.width}px`;
canvas.style.height = `${viewport.height}px`;
ctx.scale(dpr, dpr);
```

Canvas 物理像素按 `devicePixelRatio` 放大，CSS 尺寸保持不变，渲染时缩放 ctx，使高分屏文字清晰。

这是**纯 Canvas 位图层面的功能**，与文本层无关。文本层的 `<span>` 是 CSS/DOM 元素，浏览器会自动按 DPR 渲染，无需额外处理。高 DPI 只影响 Canvas 上的矢量图形、图片和字体渲染清晰度——若不做此处理，Retina 屏上 PDF 文字会模糊。

### 4.4 TextItem 的实际粒度

**文件：`src/client/pdf-viewer.ts:12-17`**

`getTextContent` 返回的 `TextItem[]` 是扁平列表，item 的粒度因 PDF 生成方式而异，规律因文档类型而不同。下表为基于代码逻辑和 PDF.js 规范的定性描述：

| 内容类型 | 典型粒度 | 说明 |
|----------|----------|------|
| 正文段落 | 词或短语 | 每个 item 通常是 1-3 个单词，空格有时在 item 之间，有时在 `str` 内 |
| 标题（大字号） | 整行或单词 | 字号大时往往一个 item 就是整行；有时每个字母是独立 item |
| 页眉/页脚 | 整行 | 通常一行就是一个 item，内容如 "Page 1 of 10" |
| 图注/表注 | 词级别 | 与正文类似，但坐标上与正文分离 |
| 表格单元格 | 单元格内容 | 每个单元格内容是一个 item，跨列时可能拆成多个 |
| 侧边栏/多栏 | 词或短语 | 与正文 X 坐标明显不同，`buildTextBlocks` 会将其归入不同 block |
| 数学公式 | 字符级别 | LaTeX 排版的公式每个字符/符号是独立 item，`str` 可能是单个希腊字母 |

一个典型的学术论文正文段落，`getTextContent` 可能返回如下 items（节选）：

```
{ str: "We",        transform: [..., x:72,  y:720], width: 14.4,  height: 10 }
{ str: "propose",   transform: [..., x:89,  y:720], width: 38.2,  height: 10 }
{ str: "a",         transform: [..., x:130, y:720], width: 6.1,   height: 10 }
{ str: "novel",     transform: [..., x:139, y:720], width: 30.5,  height: 10 }
{ str: "method",    transform: [..., x:172, y:720], width: 35.8,  height: 10 }
{ str: "for",       transform: [..., x:72,  y:708], width: 16.2,  height: 10 }  ← 换行，y 变小
```

同一行的 items Y 坐标相同（或差 < 1px），换行时 Y 坐标跳变（跳变量约等于行高）。

### 4.5 文本块构建

**文件：`src/client/pdf-viewer.ts:529-563`**

项目将相邻 Y 坐标差小于 `lineHeight × 1.5` 的 items 合并为一个 `PdfTextBlock`，用于翻译和段落点击。

`lineHeight` 取自 `TextItem.height`（PDF.js API 提供的字体高度），`1.5` 倍是**本项目定义的常量** `LINE_HEIGHT_MULTIPLIER`，用于判断两个 item 是否属于同一行。

`PdfTextBlock` 是**本项目自定义的抽象**（`pdf-viewer.ts:19-27`），PDF.js API 不提供段落或行级别的分组，只有扁平的 `TextItem[]`。PDF.js 唯一更高层的结构是 `TextMarkedContent`（可访问性标记），但实际 PDF 中很少包含。

### 4.5 注释高亮

项目有两套高亮路径，按优先级：

**路径 A：item 索引（精确，O(1)）**

保存注释时记录 `start`（item 索引）和 `length`，高亮时直接用 `highlightByItemRange` 从索引范围重建引用文本，在文本层 span 中匹配。

**路径 B：文本匹配（回退）**

旧注释或无索引时，用 `highlightQuote` 遍历文本层所有**叶子 span**，做子串匹配。

这里的"叶子 span"是指 PDF.js 渲染文本层时生成的 `<span>` 元素（见第二章第 5 节）——PDF.js 内部会将 `TextItem` 渲染为 span，有时会嵌套（外层 span 做容器，内层 span 是实际文字）。代码用 `s.querySelector("span") === null` 过滤出最内层的叶子节点，避免重复匹配。

这些 span 是 **PDF.js 框架生成的**，不是项目代码创建的。

两者都只对**已渲染**的页面生效（`rendered.has(pageNum)` 检查）。每次 `onPageRendered` 回调触发时重放所有高亮，保证懒加载后注释能正确显示。

### 4.6 文本选择与注释创建

**文件：`src/client/pdf-viewer.ts:227-337`**

PDF 文字选中的底层机制是浏览器原生文本选择（`window.getSelection()`），作用在文本层的透明 span 上。但 PDF.js 的 span 坐标不是连续 DOM 流，无法直接从 Selection 对象得到可靠的文字范围，因此项目用了一套基于鼠标坐标的定位方案：

**定位流程：**

1. `mousedown` 时记录鼠标在页面坐标系中的位置（`mouseDownPageX/Y`）
2. `mouseup` 时记录抬起位置，构建选区矩形 `[selLeft, selRight, selTop, selBottom]`
3. 计算选区中心点 `(selCenterX, selCenterY)`
4. 遍历该页所有 `TextItem`，将每个 item 的 PDF 坐标转换为屏幕坐标，计算其视觉包围盒
5. 找到与选区中心**水平重叠且垂直包含**的 item 中距离最近的一个，记录其索引

**举例：** 用户在论文正文选中 "novel method"，鼠标从 "novel" 拖到 "method"。选区中心落在 "novel" 和 "method" 之间，算法找到距中心最近的 item（假设是 "novel"，索引为 42），记录 `startItemIdx = endItemIdx = 42`。

注意：目前实现是**单 item 锚点**（`startItemIdx === endItemIdx`），即使用户拖选了多个词，注释也只锚定到最近的那一个 item。这是有意为之的简化，避免跨 item 范围计算的复杂性（见代码注释 `pdf-viewer.ts:253`）。

同时取前后各 10 个 item 的文本拼接为上下文（`quotePrefix`/`quoteSuffix`），用于后续显示注释时提供定位参考。

### 4.7 PDF 资源接口

**文件：`src/server.ts:87`，`src/handlers.ts:144-161`**

`GET /api/pdf-asset?path=<本地路径>` 读取本地 PDF 文件，以 `application/pdf` 返回。不支持远程 URL（安全限制）。

### 4.8 查看器生命周期

**文件：`src/client/main.ts:84-117`**

`pdfViewerRegistry`（Map）管理所有已打开的 PDF 查看器实例。切换到其他文件 10 分钟后自动 `destroy()` 释放内存。切换回来时恢复上次的滚动位置（存在 `localStorage`）。

---

## 五、数据流总图

```
用户打开 PDF 文件
  │
  ▼
main.ts: createPdfViewer()
  │
  ▼
pdf-viewer.ts: getDocument("/api/pdf-asset?path=...")
  │
  ├── 创建占位 div × numPages
  │
  └── IntersectionObserver 监听可见性
          │
          ▼ (进入视口)
      renderPage(n)
          │
          ├── getPage(n) → getViewport(scale)
          ├── Canvas 渲染 → page.render()
          ├── 文本层 → getTextContent() + TextLayer.render()
          ├── 构建 TextBlock（用于翻译/点击）
          └── onPageRendered 回调
                  │
                  ▼
          pdf-annotation.ts: renderHighlights()
                  │
                  ├── highlightByItemRange()  ← 有 item 索引
                  └── highlightQuote()         ← 无索引回退
```

---

## 六、关键文件索引

| 文件 | 职责 |
|------|------|
| `src/client/html.ts` | CDN 加载 pdfjs-dist，暴露到 window |
| `src/client/pdf-viewer.ts` | 核心查看器：渲染、高亮、文本选择、滚动 |
| `src/client/pdf-annotation.ts` | 注释桥接层：连接查看器与注释系统 |
| `src/client/pdf-translation.ts` | 段落翻译：基于 TextBlock，带 localStorage 缓存 |
| `src/client/main.ts` | 查看器生命周期管理、事件路由 |
| `src/handlers.ts` | `/api/pdf-asset` 接口实现 |
| `src/client/css.ts` | PDF 相关样式（容器、高亮、文本层） |
