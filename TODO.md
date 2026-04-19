# 待完成任务

## 搜索路径现在很慢是为什么


## PDF 懒渲染性能基准测试
建立基准测试，记录以下指标在不同 PDF 大小/页数下的表现：白屏率、首页可见时间、内存峰值（通过 getRenderedCount() 监控）、渲染抖动。可顺带考虑在 debug 模式下直接在页面上可视化 TextLayer overlay。

## PDF 阅读体验改进
1）PDF 页面滚动时没有显式滚动条
2）PDF 页面内没有当前页数/总页数提示，也没有跳转到指定页的快捷方式

## PDF TOC 跳转精度
当前 PDF TOC 点击只能跳到对应页顶（scrollToPage），无法跳到章节在页内的具体位置。
根本原因：PDF outline 条目包含 dest（destination）对象，其中有页内 y 坐标，但目前 resolvePdfOutlinePageNums 只提取了 pageNum，没有提取 y 偏移。
修复方向：在 resolvePdfOutlinePageNums 里同时提取 dest 的 y 坐标，存入 TocItem，然后 pdfJump 改用 scrollToBlockY(pageNum, y)。


## 翻译服务重启，后台服务重启

## 页面zoom in/out

## 学会用memory（还是说不用管）

## ❯ just build-client && just dev
bun run build.ts && bun run scripts/embed-client.ts
我需要一个一键watch的命令，现在just里的命令太多了，需要整理一下

## PDF 整页翻译 + 译文嵌入渲染（探索性）
一次翻译一整页 PDF，把每段中文译文插入对应英文段落下方

可行路径：在 PDF.js canvas 上方用绝对定位 HTML overlay 插入译文块，不修改 canvas 本身（text layer 坐标保持不变）。每段译文 div 定位到对应英文段落的 bottom 坐标处，后续段落视觉上会被遮挡（不 reflow）。

挑战：
- PDF.js canvas 是位图，无法真正 reflow；译文插入后与后续原文重叠
- 若要真正 reflow，需重新生成 PDF（如 pdf-lib）或用纯 HTML 重排，text layer 坐标全部失效
- 整页翻译 API 成本比选段翻译高

后续可探索：先做 overlay 叠加方案验证视觉效果，再评估是否值得做完整 reflow。用户体验上"译文紧跟原文段落下方"是最理想的阅读方式，值得重点探索。
