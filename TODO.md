# 待完成任务

## 页面列表一致在定时刷新，还有哪些地方，要怎么处理

## toc在文件切换的时候不及时，现在是怎么触发的，有的时候没切换toc，但刷新一下就好了。
- 是修这个bug的成本高，还是增加一个手动刷新的小按钮更好？

## 评论修改的按钮可以float起来，避免文本来回跳跃

## 加一个doitlater的功能

## 焦点模式下，文件还是有点多。怎么办？

## 做一个快捷键配置页面

## 搜索路径现在很慢是为什么

## PDF 懒渲染性能基准测试
建立基准测试，记录以下指标在不同 PDF 大小/页数下的表现：白屏率、首页可见时间、内存峰值（通过 getRenderedCount() 监控）、渲染抖动。可顺带考虑在 debug 模式下直接在页面上可视化 TextLayer overlay。

## PDF TOC 跳转精度
当前 PDF TOC 点击只能跳到对应页顶（scrollToPage），无法跳到章节在页内的具体位置。
根本原因：PDF outline 条目包含 dest（destination）对象，其中有页内 y 坐标，但目前 resolvePdfOutlinePageNums 只提取了 pageNum，没有提取 y 偏移。
修复方向：在 resolvePdfOutlinePageNums 里同时提取 dest 的 y 坐标，存入 TocItem，然后 pdfJump 改用 scrollToBlockY(pageNum, y)。


