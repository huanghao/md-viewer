# PDF.js TextItem 结构分析实验

> 前置阅读：本文假设你已了解 TextItem 数据结构、坐标系、Canvas+TextLayer 原理、以及项目的选中/高亮/段落识别逻辑。
> 请先阅读 [pdf-viewer-internals.md](../pdf-viewer-internals.md)。

---

## 实验目标

项目的选中、高亮、段落识别功能依赖三处对 TextItem 数据的假设，但这些假设在真实 PDF 上是否成立、成立的比例有多高，目前没有数据支撑。

本实验用真实论文数据量化三个已知风险点：

| 风险点 | 对应功能 | 核心假设 | 实验要回答的问题 |
|--------|---------|---------|----------------|
| `fontH` fallback | 文本选中 | `item.height` 通常不为 0 | `height=0` 的 item 占多少比例？fallback 到硬编码 12 的有多少？ |
| item 粒度 | 选中 + 高亮 | item 是词级别，选中词能精确命中 | item 实际是什么粒度？整行？整段？ |
| 单字符 item 过滤 | 高亮 | 被选中的文字 `str.length > 5` | 公式密集的 PDF 里单字符 item 占多少比例？ |
| deltaY 阈值 1.5 | 段落识别 | 段落间距 > 1.5×行高 | deltaY/lineHeight 的实际分布是什么？1.5 是否合适？ |

**已知结论（交互测试，2026-04-19）**：DeepSeek-R1 和 Llama-3 论文的正文 item 粒度是**整行**，不是词级别。这意味着高亮精度的上限是一行，需要改用 `getSelection().toString()` 做子串定位才能精确到词。详见 [pdf-viewer-internals.md § 10](../pdf-viewer-internals.md)。

背景参考：[pdf-viewer-internals.md § 10-12](../pdf-viewer-internals.md)

---

## 语料

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

## 实验设计

### 运行方式

```bash
bun run scripts/pdf-item-analysis.ts
# 输出到 docs/research/pdf-textitem-results/（不提交 git）

streamlit run scripts/pdf-item-dashboard.py
# 可视化结果
```

脚本使用 `pdfjs-dist` 的 Node 版本，不需要浏览器，直接调用 `getTextContent()`。

### 分析页数

取每个 PDF 的**前 5 页**。原因：前 5 页结构最丰富（标题、摘要、引言、正文开头），覆盖所有内容类型；正文段落的 item 分布在第 10 页和第 50 页基本相同，全量分析收益低。如需分析特定页面，调整脚本的 `PAGES_PER_PDF` 参数。

---

## 统计指标

### A 组：fontH fallback 可靠性

对应风险点：`fontH` fallback → 文本选中包围盒计算偏移

| 指标 | 含义 |
|------|------|
| `heightDistribution` | `height` 字段的完整值分布（不只看 0，看整体） |
| `heightZeroRatio` | `height=0` 的 item 占比——这些 item 在选中时依赖 fallback |
| `transform3ZeroRatio` | `height=0` 且 `transform[3]=0` 的占比——这些 item 会 fallback 到硬编码 12 |
| `fontHFallback12Ratio` | 最终使用 12 作为 fontH 的 item 占比（最坏情况的规模） |
| `fontHDistribution` | 最终 fontH 值的分布，正常应有 2-4 个峰值（对应字号层次） |

### B 组：str 粒度

对应风险点：单字符 item 被 `highlightQuote` 的 `text.length > 5` 过滤跳过

| 指标 | 含义 |
|------|------|
| `singleCharRatio` | 单字符 item 的占比（公式、特殊符号） |
| `emptyStrRatio` | 空白 item 的占比（纯空格占位符） |
| `spaceInStrRatio` | str 内含空格的 item 占比（一个 item 跨多个词） |
| `strLenDistribution` | str 长度分布（1、2-5、6-15、16+） |
| `avgStrLen` | 平均 str 长度 |

### C 组：deltaY 分布

对应风险点：`buildTextBlocks` 的 `lineHeight × 1.5` 阈值是否合适

对每页按 Y 坐标排序后，计算相邻 item 的 `deltaY / lineHeight`（归一化，消除字号差异）：

| 区间 | 含义 |
|------|------|
| `< 0.05` | 同一行（水平排列，Y 相同） |
| `0.05 ~ 1.5` | 正常换行，`buildTextBlocks` 会合并为同一 block |
| `1.5 ~ 3.0` | 段落间距或标题间距，`buildTextBlocks` 在此切断 |
| `> 3.0` | 跨区域跳跃（多栏切换、页眉页脚、图表） |

如果 `0.05~1.5` 区间内有双峰，说明存在两种行间距（正文 vs 标题），1.5 阈值可能需要调整。

### D 组：字号层次

辅助理解页面结构，也影响 `buildTextBlocks` 稳定性（用 `prev.height` 作为 lineHeight 参考值）

| 指标 | 含义 |
|------|------|
| `uniqueHeightCount` | 不同字号的数量（学术论文通常 3-5 层） |
| `heightValues` | 所有出现的 height 值列表 |
| `dominantHeight` | 出现最多的 height（通常是正文字号） |

---

## 输出格式

### 原始数据（不提交 git）

```
docs/research/pdf-textitem-results/
  all-items.csv              # 所有 item 的扁平 CSV，pandas 可直接读取
  {filename}-stats.json      # 每个 PDF 的完整统计数据
  summary.json               # 所有文件的汇总
```

CSV 列：`file, page, item_idx, str, str_len, has_space, height, transform_3, font_h, font_h_source, width, x, y, screen_y, delta_y_norm`

### 可视化

```bash
streamlit run scripts/pdf-item-dashboard.py
```

展示：各 PDF 的 A/B/C/D 四组指标对比、fontH 分布直方图、deltaY 分布直方图、原始 item 采样表格。

---

## 实验结果

### 运行环境

- 运行时间：2026-04-19
- pdfjs-dist 版本：5.6.205（Node 版本，与浏览器端 4.9.155 API 兼容）
- 分析页数：每个 PDF 前 5 页
- 总计：15 个 PDF，11854 个 item

### A 组：fontH fallback

| 文件 | height=0 占比 | fallback 到 12 占比 | 平均每页 item 数 |
|------|-------------|-------------------|---------------|
| deepseek-r1 | 30.3% | 0.3% | 176 |
| deepseek-v2 | 35.3% | 0.3% | 130 |
| deepseek-v3 | 33.5% | 0.3% | 116 |
| gemini-1.5 | 31.5% | 0.4% | 94 |
| humanitys-last-exam | 15.4% | 0.4% | 97 |
| limo | 23.0% | 0.2% | 93 |
| llama-3-herd | 38.9% | 0.3% | 190 |
| osworld | 28.5% | 0.2% | 171 |
| quiet-star | 27.9% | 0.3% | 233 |
| rm-r1 | 25.4% | 0.1% | 244 |
| ruler | 27.3% | 0.5% | 168 |
| s1 | 26.4% | 0.1% | 231 |
| self-rewarding | 25.5% | 0.2% | 112 |
| swe-lancer | 17.8% | 0.0% | 111 |
| tulu-3 | 40.4% | 0.1% | 205 |

**结论**：
- `height=0` 的 item 占比在 **15%–40%** 之间，比例相当高——这些 item 在文本选中时都依赖 fallback
- 但 fallback 到硬编码 12 的比例极低（< 0.5%），说明 `transform[3]` 作为第二级 fallback 基本可靠
- **风险等级：中**——`height=0` 很常见，但 `transform[3]` 通常能补救，真正危险的情况（fallback 到 12）极少

### B 组：str 粒度

| 文件 | 单字符占比 | 空 str 占比 | 含空格占比 | 估算平均长度 |
|------|----------|-----------|---------|-----------|
| deepseek-r1 | 41.7% | 30.3% | 47.7% | 7.2 |
| deepseek-v2 | 35.5% | 35.3% | 53.1% | 8.3 |
| deepseek-v3 | 32.0% | 33.5% | 57.0% | 9.4 |
| gemini-1.5 | 16.4% | 31.5% | 62.1% | 12.8 |
| humanitys-last-exam | 24.5% | 15.4% | 69.5% | 15.1 |
| limo | 25.1% | 23.0% | 71.9% | 14.9 |
| llama-3-herd | 45.4% | 38.9% | 62.1% | 7.8 |
| osworld | 30.0% | 28.5% | 60.2% | 11.3 |
| quiet-star | 50.5% | 27.9% | 45.2% | 7.0 |
| rm-r1 | 47.6% | 25.4% | 46.6% | 7.6 |
| ruler | 34.0% | 27.3% | 63.1% | 11.0 |
| s1 | 24.7% | 26.4% | 59.5% | 11.5 |
| self-rewarding | 33.6% | 25.5% | 67.5% | 12.8 |
| swe-lancer | 17.1% | 17.8% | 80.3% | 17.4 |
| tulu-3 | 41.0% | 40.4% | 59.3% | 8.1 |

**结论**：
- 单字符 item 占比在 **16%–51%** 之间，公式密集的论文（quiet-star、rm-r1）更高
- `highlightQuote` 里的 `text.length > 5` 过滤会跳过大量 item，公式区域无法高亮
- 空 str item 占比 15%–40%，这些是纯空格占位符，坐标计算时需要跳过
- 含空格 item（整行粒度）占 45%–80%，说明大多数正文 item 是整行
- **风险等级：高**——单字符比例远超预期，公式高亮问题在所有论文中都存在

### C 组：deltaY 分布

| 文件 | 同行(<0.05) | 行间(0.05-1.5) | 段间(1.5-3.0) | 跨区域(>3.0) |
|------|-----------|--------------|-------------|------------|
| deepseek-r1 | 70.6% | 23.0% | 4.1% | 2.3% |
| deepseek-v2 | 65.9% | 23.2% | 9.0% | 1.9% |
| deepseek-v3 | 64.1% | 20.4% | 13.8% | 1.7% |
| gemini-1.5 | 47.1% | 42.6% | 5.8% | 4.5% |
| humanitys-last-exam | 42.0% | 50.3% | 6.0% | 1.7% |
| limo | 46.0% | 43.0% | 7.6% | 3.5% |
| llama-3-herd | 75.4% | 19.0% | 4.2% | 1.4% |
| osworld | 61.5% | 33.7% | 3.5% | 1.3% |
| quiet-star | 70.9% | 25.2% | 3.1% | 0.8% |
| rm-r1 | 71.2% | 22.7% | 4.3% | 1.8% |
| ruler | 65.0% | 27.6% | 5.4% | 2.0% |
| s1 | 54.6% | 43.3% | 1.5% | 0.7% |
| self-rewarding | 53.3% | 35.0% | 9.2% | 2.5% |
| swe-lancer | 39.1% | 58.2% | 1.3% | 1.4% |
| tulu-3 | 78.9% | 13.7% | 6.6% | 0.8% |

**结论**：
- 同行（deltaY < 0.05）占 **40%–79%**，说明每行有多个 item（公式字符、特殊格式词）
- 行间（0.05–1.5）占 **13%–58%**，这是 `buildTextBlocks` 会合并的范围
- 段间（1.5–3.0）占 **1%–14%**，这是 `buildTextBlocks` 切断的地方，比例不大
- 跨区域（>3.0）占 **0.7%–4.5%**，多栏切换、图表等
- **1.5 阈值基本合理**——段间和跨区域合计只有 2%–18%，说明阈值能正确切断大多数段落边界
- **风险等级：低**——1.5 阈值在这批论文上表现稳定

### D 组：字号层次

| 文件 | 不同字号数 | 主字号(正文) | 字号列表 |
|------|----------|-----------|--------|
| deepseek-r1 | 12 | 11pt | 3,5,6,7,8,10,11,12,13,15,16,20 |
| deepseek-v2 | 11 | 11pt | 5,6,7,8,9,11,12,13,15,16,20 |
| deepseek-v3 | 9 | 11pt | 4,5,6,11,12,13,15,16,20 |
| gemini-1.5 | 12 | 11pt | 4,5,6,7,8,9,10,11,12,13,20,21 |
| humanitys-last-exam | 10 | 8pt | 4,6,7,8,9,10,11,12,17,20 |
| limo | 9 | 10pt | 4,6,7,8,9,10,12,14,20 |
| llama-3-herd | 12 | 10pt | 3,4,6,7,8,9,10,11,12,13,18,20 |
| osworld | 11 | 10pt | 4,5,6,7,8,9,10,12,14,17,20 |
| quiet-star | 11 | 10pt | 3,4,5,6,7,8,9,10,12,14,20 |
| rm-r1 | 11 | 10pt | 4,5,6,7,8,9,10,12,14,17,20 |
| ruler | 10 | 10pt | 5,6,7,8,9,10,11,12,14,20 |
| s1 | 12 | 10pt | 3,4,5,6,7,8,9,10,11,12,14,20 |
| self-rewarding | 8 | 10pt | 5,6,7,9,10,12,17,20 |
| swe-lancer | 7 | 10pt | 6,7,9,10,12,14,20 |
| tulu-3 | 9 | 10pt | 6,7,8,9,10,12,14,20,25 |

**结论**：
- 每份论文有 **7–12 种字号**，远超预期的 3–5 层——公式字符（3–9pt）、正文（10–11pt）、标题（12–20pt）各有多个层级
- 正文主字号集中在 **10–11pt**
- `buildTextBlocks` 用 `prev.height` 作为 lineHeight 参考值，当相邻 item 字号差异大时（如公式字符 5pt 后接正文 10pt），lineHeight 参考值会失真
- **风险等级：中**——字号层次多，但 `buildTextBlocks` 的主要错误场景是公式行，而公式行本身就不适合作为翻译单元

### 综合风险评估

| 风险点 | 风险等级 | 关键数据 |
|--------|---------|---------|
| fontH fallback（文本选中定位） | **中** | height=0 占 15–40%，但 fallback 到 12 极少（<0.5%），transform[3] 基本可靠 |
| 单字符 item 过滤（公式高亮） | **高** | 单字符占 16–51%，公式区域在所有论文中都无法高亮 |
| deltaY 阈值 1.5（段落识别） | **低** | 段间+跨区域合计仅 2–18%，阈值在这批论文上基本合适 |
