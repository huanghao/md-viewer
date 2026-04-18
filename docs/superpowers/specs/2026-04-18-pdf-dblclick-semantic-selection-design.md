# PDF 双击语义选择 设计文档

Date: 2026-04-18

## 背景

用户在 PDF 文本层双击时，希望选中语义上完整的单元（句子或标题下的段落），而不是单个词。

## 交互行为

**触发**：在 PDF 文本层双击（`dblclick` 事件）。`mouseup` 里加时间戳判断，双击间隔 < 300ms 时跳过普通选择逻辑，避免同时触发批注创建。

**两级行为：**
- 双击**正文词** → 扩展选中该词所在的**句子**（拼接周边 items 文本后做字符串级句子边界检测，再反查 item 索引）
- 双击**标题文字** → 扩展选中该标题下直到下一个同级或更高级标题前的所有正文 items
- 识别不出结构时（如字号无差异的 PDF）→ 静默降级，选中当前**句子**（正文双击逻辑）或当前**标题行**（标题双击逻辑）

双击后调用现有的 `opts.onTextSelected()`，传入扩展后的 `startItemIdx/endItemIdx`，下游批注/高亮流程完全不变（`highlightByItemRange` 已支持多 item 范围）。

## 结构推断算法

**输入**：当前页的 `textContent.items`（已有，免费）

**步骤：**

1. **计算基准字号**：对当前页所有 items 取字号中位数（`item.height` 字段）→ `medianSize`

2. **按行合并 items**：将 Y 坐标差 < 2px 的相邻 items 视为同一行，对行单元整体计算平均字号和拼接文本。这一步处理标题被拆成字母级 item 的情况。

3. **分类每一行**：
   - `avgHeight / medianSize > 1.05` 且拼接文本短（<100字符）且非长句（无句中句号）且非 URL/数学符号 → `heading`
   - `avgHeight / medianSize < 0.92` → `caption`
   - 其余 → `body`

4. **标题层级**：`size_ratio > 1.2` → h1，否则 → h2

5. **句子边界检测**（正文双击）：将锚点前后 items 的 `str` 拼接为文本串，用 `.!?` 做字符串级句子分割，定位锚点所在句子的字符范围，再反查对应的 item 索引范围

6. **标题扩展**（标题双击）：从锚点行向后扫描，收集所有 body items，直到遇到同级或更高级 heading 行为止

**约束**：同步执行，无异步，无额外 API 调用。

**泛化策略**：基于相对字号（比值），不依赖绝对字号，适用于不同 PDF。字号无差异的 PDF（size_ratio 全部接近 1.0，无 heading 被识别）自动降级为句子选择。

## 代码改动范围

**只改一个文件：`src/client/pdf-viewer.ts`**

### 新增函数

**`classifyPageLines(items, pageH)`**（约50行）
- 输入：当前页 textContent items + 页高
- 先按 Y 坐标将 items 合并为行单元
- 输出：每个 item 对应的分类 `Array<'h1' | 'h2' | 'body' | 'caption'>`

**`expandSelectionSemantically(items, classifications, anchorIdx)`**（约70行）
- 锚点是 heading → 找下一个同级或更高级标题，返回 `[anchorIdx, nextHeadingIdx - 1]`；无法识别结构时返回当前标题行范围
- 锚点是 body → 拼接周边文本，字符串级句子分割，反查 item 索引，返回 `[sentenceStart, sentenceEnd]`
- caption → 同 body 处理

### 修改事件监听

在现有 `mouseup` 监听器开头加双击检测（时间戳判断，< 300ms 则 return）。

新增 `dblclick` 监听器（约20行）：
- 复用现有最近 item 查找逻辑定位锚点
- 调用 `classifyPageLines` + `expandSelectionSemantically`
- 调用 `opts.onTextSelected!` 传入扩展后的范围

### 不改动

`pdf-annotation.ts`、`main.ts`、`annotation-storage.ts`、任何 CSS

### 规模

约 140 行新增，~3 行修改（mouseup 开头加双击检测）。

## 已知边界情况

- 字号无差异 PDF（如 ruler.pdf）：无 heading 被识别，双击标题降级为选中当前行，双击正文选中当前句子
- 多栏布局：行合并只按 Y 坐标，同行不同栏的 items 可能被误合并；但句子边界（`.!?`）检测在字符串层面仍然有效
- 数学公式行：字符级 item，字号可能偏小，被分类为 caption，句子扩展时跳过
- 标题跨行（如论文大标题分两行）：每行独立分类为 heading，双击任一行都触发标题扩展逻辑
