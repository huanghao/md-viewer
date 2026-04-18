# PDF 双击语义选择 设计文档

Date: 2026-04-18，更新 2026-04-19

## 背景

用户在 PDF 文本层双击时，希望选中语义上完整的单元，而不是单个词。

根据 pdf-textitem-analysis.md 的实验结论，正文 item 粒度是**整行**（含空格 item 占 45–80%），句子级精度不可达，精度上限是行（item）。

## 交互行为

**触发**：在 PDF 文本层双击（`dblclick` 事件）。`mouseup` 里加时间戳判断，双击间隔 < 300ms 时跳过普通选择逻辑，避免同时触发批注创建。

**两级行为：**
- 双击**正文行** → 选中该行对应的 item（即当前锚点 item，不扩展）
- 双击**标题行** → 扩展选中该标题下直到下一个同级或更高级标题前的所有 body items
- 识别不出结构时（如字号无差异的 PDF）→ 静默降级，选中当前锚点 item（单行）

双击后调用现有的 `opts.onTextSelected()`，传入扩展后的 `startItemIdx/endItemIdx`，下游批注/高亮流程完全不变（`highlightByItemRange` 已支持多 item 范围）。

## 结构推断算法

**输入**：当前页的 `textContent.items`（已有，免费）

**步骤：**

1. **过滤空 str item**：跳过 `item.str.trim() === ''` 的 item（占 15–40%，是纯空格占位符）

2. **计算基准字号**：对过滤后的 items 取 `item.height` 中位数 → `medianSize`。实验证明行级 median 稳定，公式字符不会拉低基准。

3. **按行合并 items**：将 `transform[5]`（PDF Y 坐标）差 < 2pt 的相邻 items 视为同一行，取行内平均字号和拼接文本。主要目的是处理标题被拆成字母级 item 的情况。

4. **分类每一行**：
   - `avgHeight / medianSize > 1.05` 且拼接文本 < 100 字符且无句中句号且非 URL/数学符号 → `heading`
   - `avgHeight / medianSize < 0.92` → `caption`（跳过）
   - 其余 → `body`

5. **标题层级**：`size_ratio > 1.2` → h1，否则 → h2

6. **标题扩展**（标题双击）：从锚点行向后扫描所有 items，收集 body items，直到遇到同级或更高级 heading 为止，返回 `[firstBodyItemIdx, lastBodyItemIdx]`

**约束**：同步执行，无异步，无额外 API 调用。

**泛化策略**：基于相对字号（比值），不依赖绝对字号。字号无差异的 PDF（无 heading 被识别）自动降级为单行选择。

## 代码改动范围

**只改一个文件：`src/client/pdf-viewer.ts`**

### 新增函数

**`classifyPageItems(items, pageH)`**（约50行）
- 过滤空 str → 计算 medianSize → 按 Y 坐标合并行 → 分类
- 返回每个原始 item 对应的分类 `Array<'h1' | 'h2' | 'body' | 'caption'>`

**`expandDblClick(items, classifications, anchorIdx)`**（约40行）
- 锚点是 h1/h2 → 向后收集 body items 直到下一个同级或更高标题，返回 `[firstBody, lastBody]`；无 body items 则返回 `[anchorIdx, anchorIdx]`
- 锚点是 body/caption → 返回 `[anchorIdx, anchorIdx]`（单行）
- 降级同上

### 修改事件监听

`mouseup` 开头加双击检测：记录上次 mousedown 时间戳，间隔 < 300ms 则 return。

新增 `dblclick` 监听器（约20行）：
- 复用现有最近 item 查找逻辑定位锚点
- 调用 `classifyPageItems` + `expandDblClick`
- 调用 `opts.onTextSelected!` 传入扩展范围

### 不改动

`pdf-annotation.ts`、`main.ts`、`annotation-storage.ts`、任何 CSS

### 规模

约 110 行新增，~3 行修改。

## 已知边界情况

- 字号无差异 PDF（ruler.pdf 类）：无 heading 被识别，双击任何位置均选中单行
- 标题跨行（如论文大标题分两行）：每行独立分类为 heading，双击任一行都触发标题扩展
- 公式行：字符级 item 被行合并后字号偏小，分类为 caption，标题扩展时跳过不收集
- 多栏布局：行合并只按 Y 坐标，同行不同栏 items 可能被误合并；但标题扩展按 item 顺序扫描，影响有限
