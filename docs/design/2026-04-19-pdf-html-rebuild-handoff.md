# PDF HTML 重建实验 — Handoff

## 背景

目标是实现"译文紧跟原文段落下方"的双语阅读体验，替代当前的侧边栏翻译列表。

相关文档：`docs/design/2026-04-19-pdf-structured-translation.md`

## 实验工具

`scripts/pdf-html-lab/` — 独立实验服务，不依赖主程序。

```bash
bun run scripts/pdf-html-lab/server.ts
# http://localhost:4323
```

测试数据：`/Users/huanghao/workspace/walle/bots-tmp/0408-llm-wiki/raw/inbox/` 下的 15 篇学术论文 PDF。

## 实验结论

### 方案一：绝对定位（每个 TextItem 精确还原位置）

**结论：不可行。**

PDF 内部字体编码不是标准 Unicode，字符映射是 PDF 私有的。直接用 `<span>` 渲染会乱码。除非把 PDF 字体也提取出来嵌入 HTML（需要用 `page.getOperatorList()` + `commonObjs` 重新实现渲染器），复杂度极高。

### 方案二：段落流（放弃坐标，按段落顺序流式排列）

**结论：可用，但格式全丢。**

PDF.js 的 `tc.items[].str` 字段是已解码的正确 Unicode 文本，可以直接渲染。段落拆分质量可接受（见 `docs/design/2026-04-19-pdf-structured-translation.md` 数据分析节）。

丢失的内容：粗体/斜体、图片、公式、表格、多栏阅读顺序、页眉页脚区分。对于纯文字论文体验尚可，但不像在看 PDF。

### 方案三：Side-by-side（canvas 左，译文列右）

**结论：布局可行，但体验不理想。**

- 左边 canvas 原文完整保留
- 右边 320px 固定宽度译文列，Y 坐标与左边段落对齐
- 完全绕开 reflow 问题

问题：
- 双栏 PDF 的段落 Y 坐标不连续，左右两栏的译文会交错排列，对齐感很弱
- 译文列宽度固定，无法随内容自适应
- 整体感觉像两个独立文档并排，不是"同一个文档的双语版"

## 核心障碍

PDF canvas 是位图，无法 reflow。所有"译文插入原文之间"的方案都面临同一个问题：**原文不会为译文让位**。

真正干净的解决方案需要放弃 canvas，但放弃 canvas 就意味着放弃原文的视觉还原（字体、排版、图片）。

## 可能的后续方向

1. **接受段落流的格式损失**，做一个"阅读模式"——点击按钮切换到纯文字双语视图，不再尝试还原 PDF 排版。适合快速浏览，不适合需要对照图表的场景。

2. **整页翻译 + 段落流**，一次翻译一整页（上下文更完整，翻译质量更好），显示纯文字双语对照。译文和原文各占一半屏幕宽度（side-by-side），但都是流式文字而不是 canvas。

3. **等待更好的 PDF 渲染 API**，如果 PDF.js 未来暴露字体提取接口，绝对定位方案才真正可行。

4. **维持现状**，侧边栏翻译列表已经可用，当前体验够用，不做大改。

## 当前主程序状态

侧边栏翻译功能已完整实现（`src/client/pdf-translation.ts`、`src/client/annotation.ts`）：
- 每段左侧固定「译」图标，点击翻译
- 译文显示在右侧翻译 tab，最近 10 条，带时间戳
- 支持跳转、删除、重试

如果后续要改成双语视图，入口在 `src/client/main.ts` 的 `onParagraphClick` 回调和 `renderTranslationList`。
