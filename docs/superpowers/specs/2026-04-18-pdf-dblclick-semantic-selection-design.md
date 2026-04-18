# PDF 双击语义选择 设计文档

Date: 2026-04-18

## 背景

用户在 PDF 文本层双击时，希望选中语义上完整的单元（句子或标题下的段落），而不是单个词。

## 交互行为

**触发**：在 PDF 文本层双击（`dblclick` 事件，与现有 `mouseup` 并列监听）

**两级行为：**
- 双击**正文词** → 扩展选中该词所在的**句子**（以 `.!?` 为句子边界，跨 item 合并）
- 双击**标题文字** → 扩展选中该标题下直到下一个同级或更高级标题前的所有正文 items
- 识别不出结构时（如字号无差异的 PDF）→ 静默降级，选中所在**段落**（按行间距聚类）

双击后调用现有的 `opts.onTextSelected()`，传入扩展后的 `startItemIdx/endItemIdx`，下游批注/高亮流程完全不变。

## 结构推断算法

**输入**：当前页的 `textContent.items`（已有，免费）

**步骤：**

1. **计算基准字号**：对当前页所有 items 取字号中位数（`item.height` 字段）→ `medianSize`

2. **分类每个 item**：
   - `item.height / medianSize > 1.05` 且文本短（<100字符）且非长句（无句中句号）且非 URL/数学符号 → `heading`
   - `item.height / medianSize < 0.92` → `caption`
   - 其余 → `body`

3. **标题层级**：`size_ratio > 1.2` → h1，否则 → h2

4. **句子边界检测**（正文双击）：从锚点 item 向前后扩展，直到遇到以 `.!?` 结尾的 item 或行间距 > 1.5 倍行高

5. **段落边界检测**（降级）：按 Y 坐标间距聚类，间距 > 1.5 倍行高为段落边界

**约束**：同步执行，无异步，无额外 API 调用。

**泛化策略**：基于相对字号（比值），不依赖绝对字号，适用于不同 PDF。字号无差异的 PDF 自动降级为段落选择。

## 代码改动范围

**只改一个文件：`src/client/pdf-viewer.ts`**

### 新增函数

**`classifyItems(items, pageH)`**（约40行）
- 输入：当前页 textContent items + 页高
- 输出：`Array<'h1' | 'h2' | 'body' | 'caption'>`

**`expandSelectionSemantically(items, classifications, anchorIdx, pageH)`**（约60行）
- 锚点是 heading → 找下一个同级或更高级标题，返回 `[anchorIdx, nextHeadingIdx - 1]`
- 锚点是 body → 扩展到句子边界，返回 `[sentenceStart, sentenceEnd]`
- 降级 → 扩展到段落边界

### 新增事件监听

在现有 `mouseup` 监听器旁新增 `dblclick` 监听器（约15行）：
- 找到锚点 item（复用现有最近 item 查找逻辑）
- 调用 `expandSelectionSemantically`
- 调用 `opts.onTextSelected!` 传入扩展后的范围

### 不改动

`pdf-annotation.ts`、`main.ts`、`annotation-storage.ts`、任何 CSS

### 规模

约 115 行新增，0 行删除。

## 已知边界情况

- `ruler.pdf` 类字号无差异 PDF：自动降级为段落选择，无报错
- 多栏布局：行间距聚类可能跨栏，但句子边界检测（`.!?`）仍然有效
- 数学公式行：被分类为 caption 跳过，不影响句子扩展
