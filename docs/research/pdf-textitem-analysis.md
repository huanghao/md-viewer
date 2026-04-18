# PDF.js TextItem 结构分析实验

## 背景与目标

本项目的 PDF 选中、高亮、批注功能大量依赖 PDF.js `getTextContent()` 返回的 `TextItem[]` 数据。

本实验有两个目标：

**目标一：理解 PDF.js API 的实际能力**

目前对 PDF.js 提供的数据结构只有抽象文档描述，缺乏对真实数据的直觉。通过分析真实论文的 TextItem 原始数据，建立对以下问题的具体认知：
- 一个 TextItem 在真实 PDF 里代表多大的文字单元（单字符？单词？整行？）
- `height`、`transform`、`width` 这些字段在实际数据里长什么样
- 不同内容区域（正文、标题、公式、表格、页眉）的 item 有什么不同
- item 和浏览器渲染出来的 span 之间是什么关系

**目标二：量化三个已知脆弱点的风险**

当前实现中有三处依赖 TextItem 数据的逻辑，在某些 PDF 上会失败，但不知道失败频率有多高。

---

## 三个脆弱点详解

### 脆弱点 1：文本选中定位（`itemVisualBounds` 的 fontH）

**选中的完整链路：**

用户在屏幕上拖拽选中文字时，项目需要把"鼠标坐标"映射到"哪个 TextItem"。流程如下：

```
鼠标抬起时的屏幕坐标 (clientX, clientY)
    ↓ 减去页面容器的 getBoundingClientRect，除以 scale
PDF 页面坐标 (pageX, pageY)
    ↓ 对每个 TextItem 计算视觉包围盒
每个 item 的包围盒 [iy, iBottom, ix, iRight]
    ↓ 找到与鼠标坐标重叠且距离最近的 item
命中的 TextItem（记录其索引 startItemIdx）
```

**fontH 在哪里起作用：**

包围盒的上下边界依赖 `fontH`（字体高度）：

```typescript
const fontH = item.height || Math.abs(item.transform[3]) || 12;
const iy     = baselineScreenY - fontH;       // 文字顶部
const iBottom = baselineScreenY + fontH * 0.3; // 文字底部（含下延笔画）
```

如果 `fontH` 偏小，包围盒上边界偏低，鼠标点击文字顶部时落在包围盒外，找不到 item，选中失败。
如果 `fontH` 偏大，包围盒上边界偏高，鼠标点击某行时可能误命中上一行的 item。

**三级 fallback 的问题：**

- `item.height`：PDF.js 从字体元数据提取，部分 PDF 字体嵌入不完整时为 0
- `Math.abs(item.transform[3])`：变换矩阵的 Y 缩放因子，旋转文本时不代表字体高度，也可能为 0
- `12`：硬编码默认值，对 8pt 或 18pt 字体都是错的

**实验要回答**：真实论文里 `height=0` 的 item 占多少比例？fallback 到 12 的有多少？

---

### 脆弱点 2：文本选中→高亮的完整链路

**核心问题在第一步**

批注 #9 指出了一个重要认知：如果屏幕坐标→item 这一步是准的，那么 item 索引→高亮就应该是准的。
脆弱点的根源在于**第一步（坐标→item）是否准确**，而不是第二步（item→span）。

完整链路：

```
用户选中文字
    ↓ mouseup，鼠标坐标 → TextItem 索引（依赖 fontH，见脆弱点 1）
startItemIdx 保存到注释
    ↓ 重新渲染时，highlightByItemRange(pageNum, startItemIdx, endItemIdx)
item.str 拼接为 rangeQuote
    ↓ 在 TextLayer 的 span 里搜索 rangeQuote
span 加高亮 class
```

**item→span 的映射问题（次要脆弱点）**

即使 item 索引正确，高亮还依赖一个假设：`items[i].str` 拼接后能在某个 span 的 `textContent` 里找到。
但 PDF.js 在渲染 TextLayer 时可能对空白做不同处理，导致 item.str join(" ") ≠ span.textContent。

**实验要回答**：str 粒度如何？单字符 item 的比例（这类 item 在高亮时很难匹配到对应 span）？

---

### 脆弱点 3：段落识别（`buildTextBlocks` 的 deltaY 阈值）

**block 是什么，为什么需要它**

PDF.js 的 `getTextContent()` 返回的是**扁平列表**，每个 TextItem 只知道自己的坐标和文字，
不知道自己属于哪个段落、哪一行。

项目需要"段落"概念来支持翻译功能（用户点击某段，翻译整段）。
`buildTextBlocks` 把相邻的 item 按 Y 坐标聚合：

```
item 列表（按 Y 排序）：
  "We"  y=720    ←┐
  "propose" y=720  ├── deltaY=0，合并为同一 block
  "a"   y=720    ←┘
  "novel" y=708  ←┐
  "method" y=708  ├── deltaY=12，< 1.5×lineHeight，合并
  ...            ←┘
  "2."  y=650    ←── deltaY=58，> 1.5×lineHeight，切断，新 block 开始
```

**deltaY 是什么**

deltaY = 相邻两个 item（按 Y 排序后）的屏幕 Y 坐标之差。

PDF 坐标系 Y 轴向上，转换为屏幕坐标后，Y 越大表示越靠下。
同一行的 item deltaY ≈ 0，换行时 deltaY ≈ 行高，跨段落时 deltaY > 行高。

**1.5 倍阈值的风险**

阈值是固定的，对所有 PDF 一视同仁：
- 双栏论文：左栏末行和右栏首行的 Y 坐标差可能恰好在阈值附近，导致跨栏合并
- 标题行：字号大，lineHeight 也大，标题和正文之间的 deltaY 可能 < 1.5×标题行高，被错误合并
- 公式：字符级 item，item 间 deltaY 分布混乱

**实验要回答**：相邻 item 的 deltaY/lineHeight 分布是什么样的？1.5 这个阈值是否合理？

---

## 泛化风险

当前三个脆弱点的实现都是**统一策略**，没有针对不同 PDF 类型做差异化处理：

- `fontH` 的 fallback 链对所有 PDF 用同一套逻辑
- `buildTextBlocks` 的 1.5 阈值对所有 PDF 相同
- `highlightQuote` 的 `text.length > 5` 过滤对所有 PDF 相同

如果分析发现不同 PDF 的数据分布差异很大（比如学术论文 vs 扫描件 vs 演示文稿），
说明统一策略的泛化能力有限，需要考虑自适应方案（如根据页面的 height 分布动态调整阈值）。

---

## 实验设计

### 运行方式

```bash
bun run scripts/pdf-item-analysis.ts
# 输出到 docs/research/pdf-textitem-results/
```

脚本使用 `pdfjs-dist` 的 Node 版本，不需要浏览器，直接调用 `getTextContent()`。

### 分析页数选择

取每个 PDF 的**前 5 页**，而非全部页面，原因：
- 前 5 页通常包含摘要、引言、正文开头，结构最丰富（有标题、正文、公式、页眉）
- 全量分析一份 100 页 PDF 会产生大量冗余数据，而正文段落的 item 分布在第 10 页和第 50 页基本相同
- 脚本运行时间可控，便于迭代调整统计口径后重跑

如需分析特定页面（如图表密集页、附录页），可在脚本里调整 `PAGES_PER_PDF` 参数。

### 语料

语料路径在脚本顶部的 `PDF_PATHS` 常量中配置，不提交到 git。
当前使用的语料是 LLM 相关学术论文（arXiv），均为双栏排版，包含正文、标题、公式、表格、图注。

| 文件 | 大小 | 特点 |
|------|------|------|
| deepseek-r1-2501.12948.pdf | 4.8 MB | 长文，含大量数学公式 |
| deepseek-v2-2405.04434.pdf | 1.5 MB | 标准双栏，表格较多 |
| deepseek-v3-2412.19437.pdf | 1.8 MB | 标准双栏 |
| gemini-1.5-2403.05530.pdf | 6.9 MB | 含大量图表 |
| humanitys-last-exam-2501.14249.pdf | 2.0 MB | 含多语言、特殊字符 |
| limo-less-is-more-for-reasoning-2502.03387.pdf | 1.7 MB | 短文 |
| llama-3-herd-2407.21783.pdf | 9.4 MB | 超长，附录多 |
| osworld-2404.07972.pdf | 35 MB | 大量截图，图片密集 |
| quiet-star-2403.09629.pdf | 949 KB | 短文，公式密集 |
| rm-r1-2505.02387.pdf | 586 KB | 短文 |
| ruler-2404.06654.pdf | 667 KB | 表格密集 |
| s1-simple-test-time-scaling-2501.19393.pdf | 1.4 MB | 标准双栏 |
| self-rewarding-language-models-2401.10020.pdf | 1.1 MB | 标准双栏 |
| swe-lancer-2502.12115.pdf | 3.1 MB | 含代码块 |
| tulu-3-2411.15124.pdf | 7.9 MB | 超长，附录多 |

如需追加新 PDF，在脚本的 `PDF_PATHS` 数组里添加路径，重新运行即可。

---

## 统计指标设计

每个指标都直接对应一个脆弱点或一个理解目标。

### A 组：fontH fallback 可靠性（对应脆弱点 1）

| 指标 | 业务含义 |
|------|---------|
| `heightZeroRatio` | 有多少比例的 item，PDF.js 没能提供字体高度（`height=0`）。这些 item 在选中时依赖 fallback，定位精度下降 |
| `heightDistribution` | `height` 字段的值分布（不只看 0，还看整体分布）。如果大量 item 的 height 是一个很小的非零值，同样可能不准确 |
| `transform3ZeroRatio` | 在 `height=0` 的 item 里，有多少连 `transform[3]`（变换矩阵的 Y 缩放）也是 0。这些 item 会 fallback 到硬编码的 12，是最坏情况 |
| `fontHFallback12Ratio` | 最终实际使用 12 作为字体高度的 item 占比。12 是 12pt 字体的近似值，对于标题（18pt）或脚注（8pt）都是错的，会导致选中时包围盒计算偏移 |
| `fontHDistribution` | 最终 fontH 值的分布。正常情况下应有 2-4 个峰值，对应页面中不同层级的字号（正文/标题/图注/页眉） |

### B 组：str 粒度（理解 API 能力 + 对应脆弱点 2）

| 指标 | 业务含义 |
|------|---------|
| `strLenDistribution` | item 的 str 字符数分布（1、2-5、6-15、16+）。帮助理解 PDF.js 把文字切成多细的粒度 |
| `singleCharRatio` | 单字符 item 的占比。公式、特殊符号往往每个字符是独立 item。`highlightQuote` 里有 `text.length > 5` 的过滤，单字符 item 全部被跳过，公式区域无法高亮 |
| `emptyStrRatio` | 空白 item 的占比（`str.trim() === ''`）。这些 item 是纯空格占位符，在坐标计算时需要跳过 |
| `spaceInStrRatio` | str 内含空格的 item 占比，即一个 item 本身跨多个词。这类 item 在高亮时一个 item 对应一整段文字，粒度粗 |
| `avgStrLen` | 平均 str 长度，反映整体粒度 |

### C 组：deltaY 分布（对应脆弱点 3）

对每页按 Y 坐标排序后，计算相邻 item 的 `deltaY / lineHeight`（归一化行距，消除字号差异）：

| 区间 | 业务含义 |
|------|---------|
| `< 0.05` | 实际上是同一行（Y 几乎相同，item 水平排列）。这类 deltaY 不影响 buildTextBlocks，只是同行内的相邻 item |
| `0.05 ~ 1.5` | 正常换行。`buildTextBlocks` 会把这些 item 合并为同一 block（翻译单元） |
| `1.5 ~ 3.0` | 段落间距或标题间距。`buildTextBlocks` 在这里切断，产生新 block |
| `> 3.0` | 跨区域跳跃：多栏切换、页眉页脚、图表。这些 item 之间没有语义关联，必须切断 |

如果 `0.05~1.5` 区间内有明显双峰（比如 0.3 和 1.2 各一个峰），说明存在两种行间距（正文 vs 标题），1.5 阈值可能需要调整。

### D 组：字号层次（理解页面结构）

| 指标 | 业务含义 |
|------|---------|
| `uniqueHeightCount` | 页面中不同字号的数量。学术论文通常有 3-5 层（正文/节标题/章标题/图注/页眉），数量越多说明页面结构越复杂，`buildTextBlocks` 用 `prev.height` 作为参考值时越不稳定 |
| `heightValues` | 所有出现的 height 值列表，帮助直观看到字号层次 |
| `dominantHeight` | 出现最多的 height，通常是正文字号，是 `buildTextBlocks` 里 lineHeight 的主要参考值 |

---

## 数据结构说明

### PDF.js 原始数据结构（API 提供）

`getTextContent()` 返回的每个 `TextItem` 字段：

```typescript
// PDF.js API 原始结构（不是项目代码定义的）
interface TextItem {
  str: string;         // 该 item 的文字内容
  transform: number[]; // 仿射变换矩阵 [a, b, c, d, x, y]
                       //   x = transform[4]：item 左边界 X 坐标（PDF 坐标系）
                       //   y = transform[5]：基线 Y 坐标（PDF 坐标系，原点在左下角）
                       //   d = transform[3]：Y 方向缩放，绝对值近似字体高度（备用）
  width: number;       // item 的渲染宽度（PDF 坐标系单位）
  height: number;      // 字体高度（由 PDF 字体元数据提供，部分 PDF 中为 0）
  dir: string;         // 文字方向，通常是 'ltr'
  fontName: string;    // 字体名称
}
```

### 实验脚本的派生数据结构（项目代码计算）

```typescript
// 脚本对每个 item 计算的派生字段
interface RawItemSample {
  // PDF.js 原始字段
  str: string;
  transform: number[];
  width: number;
  height: number;
  // 脚本派生字段
  fontH: number;         // 三级 fallback 后实际使用的字体高度
  fontHSource: 'height' | 'transform3' | 'fallback12'; // 来自哪一级
  screenY: number;       // 转换后的屏幕 Y（pageHeight - transform[5]）
}

interface PageStats {
  pageNum: number;
  totalItems: number;
  // A 组
  heightZeroCount: number;
  transform3ZeroCount: number;
  fontHDistribution: Record<number, number>;
  // B 组
  emptyStrCount: number;
  singleCharCount: number;
  spaceInStrCount: number;
  strLenBuckets: { '1': number; '2-5': number; '6-15': number; '16+': number };
  // C 组
  deltaNormBuckets: {
    sameRow: number;
    interLine: number;
    interBlock: number;
    crossRegion: number;
  };
  // D 组
  uniqueHeights: number[];
  dominantHeight: number;
  // 原始采样（用于定性分析）
  sampleItems: RawItemSample[];
}
```

---

## 输出格式

### 原始数据（不提交 git，在 `.gitignore` 中）

```
docs/research/pdf-textitem-results/
  {filename}-page{n}-items.json    # 每页前 20 个 item 的完整原始数据
  {filename}-stats.json            # 该文件的完整统计数据
  all-items.csv                    # 所有 item 的扁平 CSV（pandas 可直接读取）
  summary.json                     # 所有文件的汇总统计
```

CSV 格式（每行一个 item）：

```
file,page,item_idx,str,str_len,has_space,height,transform_3,font_h,font_h_source,width,x,y,screen_y,delta_y_norm
deepseek-r1,1,0,"We",2,0,10.0,10.0,10.0,height,14.4,72,720,449,0
deepseek-r1,1,1,"propose",7,0,10.0,10.0,10.0,height,38.2,89,720,449,0
...
```

### 可视化（Streamlit）

```bash
streamlit run scripts/pdf-item-dashboard.py
```

用 pandas 读取 `all-items.csv` 和 `summary.json`，展示：
- 各 PDF 的指标对比（A/B/C/D 四组）
- fontH 分布直方图
- deltaY 分布直方图（检验 1.5 阈值）
- 原始 item 采样表格（定性分析用）

### 实验报告（提交 git）

脚本运行完成后，将关键结论填入本文档末尾的"实验结果"章节。

---

## 实验结果

> 本节在脚本运行后填入。

### 运行环境

- 运行时间：（待填）
- pdfjs-dist 版本：4.9.155
- 分析页数：每个 PDF 前 5 页

### A 组：fontH fallback

| 文件 | height=0 占比 | fallback到12 占比 | 主要 fontH 值 |
|------|-------------|----------------|------------|
| （待填） | | | |

**结论**：（待填）

### B 组：str 粒度

| 文件 | 单字符占比 | 空 str 占比 | str 含空格占比 | 平均 str 长度 |
|------|----------|-----------|-------------|------------|
| （待填） | | | | |

**结论**：（待填）

### C 组：deltaY 分布

| 文件 | 同行(<0.05) | 行间(0.05-1.5) | 段间(1.5-3.0) | 跨区域(>3.0) |
|------|-----------|--------------|-------------|------------|
| （待填） | | | | |

**结论**：（待填，重点关注 1.5 阈值是否合适）

### D 组：字号层次

| 文件 | 不同字号数 | 主字号(正文) | 字号列表 |
|------|----------|-----------|--------|
| （待填） | | | |

**结论**：（待填）

### 综合风险评估

（待填，基于以上数据，对三个脆弱点给出量化的风险等级：低/中/高）
